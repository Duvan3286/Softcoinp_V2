using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using Softcoinp.Backend.Models;
using System;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Diagnostics;
using MySqlConnector;

namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "superadmin")]
    public class MaintenanceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly Services.Reporting.IReportDataService _reportData;
        private readonly Services.Reporting.IPdfReportService _pdfService;
        private readonly Services.Reporting.IExcelReportService _excelService;
        private readonly Services.Reporting.IEmailService _emailService;

        public MaintenanceController(
            AppDbContext context, 
            IConfiguration configuration,
            Services.Reporting.IReportDataService reportData,
            Services.Reporting.IPdfReportService pdfService,
            Services.Reporting.IExcelReportService excelService,
            Services.Reporting.IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _reportData = reportData;
            _pdfService = pdfService;
            _excelService = excelService;
            _emailService = emailService;
        }

        /// <summary>
        /// Exporta la configuración básica a JSON (Settings, Users, Permissions, Types).
        /// </summary>
        [HttpGet("export-config")]
        public async Task<IActionResult> ExportConfig()
        {
            try
            {
                var config = new BackupDataDto
                {
                    ExportDate = DateTime.UtcNow,
                    Version = "2.3.0 (Config)",
                    SystemSettings = await _context.SystemSettings.AsNoTracking().ToListAsync(),
                    TiposPersonal = await _context.TiposPersonal.AsNoTracking().ToListAsync(),
                    Users = await _context.Users.AsNoTracking().ToListAsync(),
                    UserPermissions = await _context.UserPermissions.AsNoTracking().ToListAsync()
                };

                var options = new JsonSerializerOptions { WriteIndented = true, ReferenceHandler = ReferenceHandler.IgnoreCycles };
                var jsonBytes = JsonSerializer.SerializeToUtf8Bytes(config, options);

                return File(jsonBytes, "application/json", $"softcoinp_config_{DateTime.Now:yyyyMMdd}.json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error al exportar configuración", detail = ex.Message });
            }
        }

        /// <summary>
        /// Genera un volcado SQL completo de MySQL (mysqldump) y lo descarga directamente.
        /// </summary>
        [HttpGet("export-full-backup")]
        public async Task<IActionResult> ExportFullBackup()
        {
            var tempSqlPath = Path.Combine(Path.GetTempPath(), $"softcoinp_full_{Guid.NewGuid()}.sql");

            try
            {
                // 1. Obtener datos de conexión
                var connString = _configuration.GetConnectionString("DefaultConnection") ?? "";
                var builder = new MySqlConnectionStringBuilder(connString);

                // 2. Configurar mysqldump
                var processInfo = new ProcessStartInfo
                {
                    FileName = "mysqldump",
                    Arguments = $"--host={builder.Server} --user={builder.UserID} --password={builder.Password} --databases {builder.Database} --result-file=\"{tempSqlPath}\" --no-tablespaces",
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                // 3. Ejecutar proceso
                using (var process = Process.Start(processInfo))
                {
                    if (process == null) throw new Exception("No se pudo iniciar mysqldump en el servidor Docker.");
                    string stderr = await process.StandardError.ReadToEndAsync();
                    await process.WaitForExitAsync();

                    if (process.ExitCode != 0)
                        throw new Exception($"Error en mysqldump (Código {process.ExitCode}): {stderr}");
                }

                // 4. Leer archivo generado y devolverlo
                var sqlBytes = await System.IO.File.ReadAllBytesAsync(tempSqlPath);
                
                // Limpieza inmediata del archivo temporal
                if (System.IO.File.Exists(tempSqlPath)) System.IO.File.Delete(tempSqlPath);

                return File(sqlBytes, "application/sql", $"softcoinp_full_backup_{DateTime.Now:yyyyMMdd_HHmm}.sql");
            }
            catch (Exception ex)
            {
                if (System.IO.File.Exists(tempSqlPath)) System.IO.File.Delete(tempSqlPath);
                Console.WriteLine($"Error ExportFull SQL: {ex.Message}");
                return StatusCode(500, new { error = "Fallo al generar el volcado SQL completo.", detail = ex.Message });
            }
        }

        /// <summary>
        /// Realiza una limpieza profunda y vuelve a sembrar los datos básicos (Admin y Tipos).
        /// </summary>
        [HttpPost("deep-clean-and-seed")]
        public async Task<IActionResult> DeepCleanAndSeed()
        {
            try
            {
                // 1. Limpiar tablas transaccionales y de registro (Sintaxis MySQL)
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM EntregasRecibos");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM RecibosPublicos");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM RegistrosVehiculos");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Registros");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Anotaciones");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Correspondencias");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM AuditLogs");
                
                // 2. Limpiar tablas maestras (orden importa por FKs)
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Vehiculos");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Personal");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM UserPermissions");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM Users");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM TiposPersonal");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM SystemSettings");

                // 3. Insertar Seeds Básicos mediante SQL Directo
                await _context.Database.ExecuteSqlRawAsync(@"
                    INSERT INTO TiposPersonal (Id, Nombre, Activo) VALUES 
                    ('00000000-0000-0000-0000-000000000001', 'Empleado', true),
                    ('00000000-0000-0000-0000-000000000002', 'Visitante', true);
                ");

                var superPass = BCrypt.Net.BCrypt.HashPassword("SuperDev2026!");
                var adminPass = BCrypt.Net.BCrypt.HashPassword("Admin123");

                await _context.Database.ExecuteSqlRawAsync($@"
                    INSERT INTO Users (Id, Email, PasswordHash, Role, Nombre, CreatedAt, RefreshToken, RefreshTokenExpiry) VALUES 
                    ('00000000-0000-0000-0000-000000000000', 'superadmin@dev', '{superPass}', 'superadmin', 'Super Desarrollador', UTC_TIMESTAMP(), '', UTC_TIMESTAMP()),
                    ('00000000-0000-0000-0000-00000000000A', 'admin@local', '{adminPass}', 'admin', 'Administrador Sistema', UTC_TIMESTAMP(), '', UTC_TIMESTAMP());
                ");

                return Ok(new { message = "Base de datos reseteada con éxito. Admin permanente restaurado." });
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"Error Reset: {ex.Message}");
                if (ex.InnerException != null) System.Console.WriteLine($"Inner: {ex.InnerException.Message}");
                return BadRequest(new { error = ex.Message, detail = ex.InnerException?.Message });
            }
        }

        [HttpPost("clear-operational-data")]
        public async Task<IActionResult> ClearOperationalData([FromBody] ClearDataRequest req)
        {
            try
            {
                // El orden de eliminación es crítico para respetar FKs
                if (req.Recibos)
                {
                    await _context.Database.ExecuteSqlRawAsync("DELETE FROM EntregasRecibos");
                    await _context.Database.ExecuteSqlRawAsync("DELETE FROM RecibosPublicos");
                }

                if (req.Registros)
                {
                    await _context.Database.ExecuteSqlRawAsync("DELETE FROM RegistrosVehiculos");
                    await _context.Database.ExecuteSqlRawAsync("DELETE FROM Registros");
                }

                if (req.Anotaciones)
                {
                    await _context.Database.ExecuteSqlRawAsync("DELETE FROM Anotaciones");
                }

                if (req.Correspondencia)
                {
                    await _context.Database.ExecuteSqlRawAsync("DELETE FROM Correspondencias");
                }

                if (req.Vehiculos)
                {
                    if (!req.Registros) await _context.Database.ExecuteSqlRawAsync("DELETE FROM RegistrosVehiculos");
                    if (!req.Anotaciones) await _context.Database.ExecuteSqlRawAsync("DELETE FROM Anotaciones WHERE VehiculoId IS NOT NULL");
                    await _context.Database.ExecuteSqlRawAsync("DELETE FROM Vehiculos");
                }

                if (req.Personal)
                {
                    if (!req.Registros) await _context.Database.ExecuteSqlRawAsync("DELETE FROM Registros");
                    if (!req.Anotaciones) await _context.Database.ExecuteSqlRawAsync("DELETE FROM Anotaciones WHERE PersonalId IS NOT NULL");
                    if (!req.Vehiculos) await _context.Database.ExecuteSqlRawAsync("DELETE FROM Vehiculos");
                    await _context.Database.ExecuteSqlRawAsync("DELETE FROM Personal");
                }

                if (req.Auditoria)
                {
                    await _context.Database.ExecuteSqlRawAsync("DELETE FROM AuditLogs");
                }

                return Ok(new { message = "Limpieza selectiva completada con éxito." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Realiza un reset total de la base de datos (Compatible con MySQL).
        /// </summary>
        [HttpPost("reset-all")]
        public async Task<IActionResult> ResetAll()
        {
            try
            {
                var connString = _configuration.GetConnectionString("DefaultConnection") ?? "";
                var builder = new MySqlConnectionStringBuilder(connString);
                var dbName = builder.Database;

                // MySQL no usa esquemas como PG, borramos y recreamos la base de datos
                await _context.Database.ExecuteSqlRawAsync($"DROP DATABASE IF EXISTS `{dbName}`;");
                await _context.Database.ExecuteSqlRawAsync($"CREATE DATABASE `{dbName}`;");
                
                // Forzar reconexión y aplicar migraciones
                await _context.Database.MigrateAsync();

                return Ok(new { message = "Base de datos reseteada desde cero con éxito." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Exporta la base de datos completa a formato JSON.
        /// </summary>
        [HttpGet("export-backup")]
        public async Task<IActionResult> ExportBackup()
        {
            try
            {
                var backup = new BackupDataDto
                {
                    ExportDate = DateTime.UtcNow,
                    Version = "2.2.0 (MySQL Ready)",
                    SystemSettings = await _context.SystemSettings.AsNoTracking().ToListAsync(),
                    TiposPersonal = await _context.TiposPersonal.AsNoTracking().ToListAsync(),
                    Users = await _context.Users.AsNoTracking().ToListAsync(),
                    UserPermissions = await _context.UserPermissions.AsNoTracking().ToListAsync(),
                    Personal = await _context.Personal.AsNoTracking().ToListAsync(),
                    Vehiculos = await _context.Vehiculos.AsNoTracking().ToListAsync(),
                    Anotaciones = await _context.Anotaciones.AsNoTracking().ToListAsync(),
                    Registros = await _context.Registros.AsNoTracking().ToListAsync(),
                    RegistrosVehiculos = await _context.RegistrosVehiculos.AsNoTracking().ToListAsync(),
                    Correspondencias = await _context.Correspondencias.AsNoTracking().ToListAsync(),
                    AuditLogs = await _context.AuditLogs.AsNoTracking().ToListAsync(),
                    RecibosPublicos = await _context.RecibosPublicos.AsNoTracking().ToListAsync(),
                    EntregasRecibos = await _context.EntregasRecibos.AsNoTracking().ToListAsync()
                };

                var options = new JsonSerializerOptions 
                { 
                    WriteIndented = true,
                    ReferenceHandler = ReferenceHandler.IgnoreCycles
                };
                var jsonBytes = JsonSerializer.SerializeToUtf8Bytes(backup, options);

                return File(jsonBytes, "application/json", $"softcoinp_backup_{DateTime.Now:yyyyMMdd_HHmmss}.json");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error al generar el backup", detail = ex.Message });
            }
        }

        [HttpPost("import-json")]
        public async Task<IActionResult> ImportJson([FromForm] Microsoft.AspNetCore.Http.IFormFile file)
        {
            if (file == null || file.Length == 0 || !file.FileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { error = "Por favor selecciona un archivo .json válido." });

            try
            {
                using var stream = file.OpenReadStream();
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var backup = await JsonSerializer.DeserializeAsync<BackupDataDto>(stream, options);
                
                if (backup == null) return BadRequest(new { error = "El formato JSON no es válido." });

                return await ProcessRestoration(backup, "archivo JSON");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error al procesar el archivo JSON", detail = ex.Message });
            }
        }

        /// <summary>
        /// Restaura la base de datos desde un archivo .sql (Dump nativo de MySQL).
        /// </summary>
        [HttpPost("import-sql")]
        public async Task<IActionResult> ImportSql([FromForm] Microsoft.AspNetCore.Http.IFormFile file)
        {
            if (file == null || file.Length == 0 || !file.FileName.EndsWith(".sql", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { error = "Por favor selecciona un archivo .sql válido." });

            var tempSqlPath = Path.Combine(Path.GetTempPath(), $"restore_{Guid.NewGuid()}.sql");

            try
            {
                using (var stream = new FileStream(tempSqlPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var connString = _configuration.GetConnectionString("DefaultConnection") ?? "";
                var builder = new MySqlConnectionStringBuilder(connString);

                var processInfo = new ProcessStartInfo
                {
                    FileName = "mysql",
                    Arguments = $"--host={builder.Server} --user={builder.UserID} --password={builder.Password} {builder.Database} < \"{tempSqlPath}\"",
                    RedirectStandardError = true,
                    UseShellExecute = true, // Necesario para redirección '<' en algunos entornos
                    CreateNoWindow = true
                };

                using (var process = Process.Start(processInfo))
                {
                    if (process == null) throw new Exception("No se pudo iniciar el binario 'mysql'.");
                    await process.WaitForExitAsync();

                    if (process.ExitCode != 0)
                        throw new Exception($"MySQL reportó un error (Código {process.ExitCode})");
                }

                await _context.Database.MigrateAsync();
                return Ok(new { message = "Base de datos restaurada con éxito desde el archivo SQL. Reinicia sesión." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error crítico durante la restauración SQL", detail = ex.Message });
            }
            finally
            {
                if (System.IO.File.Exists(tempSqlPath)) System.IO.File.Delete(tempSqlPath);
            }
        }

        private async Task<IActionResult> ProcessRestoration(BackupDataDto backup, string sourceInfo)
        {
            try
            {
                // Limpieza total compatible con MySQL
                var connString = _configuration.GetConnectionString("DefaultConnection") ?? "";
                var builder = new MySqlConnectionStringBuilder(connString);
                await _context.Database.ExecuteSqlRawAsync($"DROP DATABASE IF EXISTS `{builder.Database}`; CREATE DATABASE `{builder.Database}`;");
                await _context.Database.MigrateAsync();

                // Inserción en orden de jerarquía
                if (backup.SystemSettings?.Any() == true) await _context.SystemSettings.AddRangeAsync(backup.SystemSettings);
                if (backup.TiposPersonal?.Any() == true) await _context.TiposPersonal.AddRangeAsync(backup.TiposPersonal);
                if (backup.Users?.Any() == true) await _context.Users.AddRangeAsync(backup.Users);
                
                await _context.SaveChangesAsync();

                if (backup.UserPermissions?.Any() == true)
                {
                    foreach(var up in backup.UserPermissions) up.User = null;
                    await _context.UserPermissions.AddRangeAsync(backup.UserPermissions);
                }

                if (backup.Personal?.Any() == true)
                {
                    foreach(var per in backup.Personal) { per.Registros = new(); per.Anotaciones = new(); }
                    await _context.Personal.AddRangeAsync(backup.Personal);
                }

                await _context.SaveChangesAsync();

                if (backup.Vehiculos?.Any() == true)
                {
                    foreach(var veh in backup.Vehiculos) veh.Personal = null!;
                    await _context.Vehiculos.AddRangeAsync(backup.Vehiculos);
                }

                if (backup.Registros?.Any() == true)
                {
                    foreach(var reg in backup.Registros) reg.Personal = null!;
                    await _context.Registros.AddRangeAsync(backup.Registros);
                }

                if (backup.RegistrosVehiculos?.Any() == true)
                {
                    foreach(var rv in backup.RegistrosVehiculos) rv.Vehiculo = null!;
                    await _context.RegistrosVehiculos.AddRangeAsync(backup.RegistrosVehiculos);
                }

                if (backup.Anotaciones?.Any() == true)
                {
                    foreach(var an in backup.Anotaciones) { an.Personal = null; an.Vehiculo = null; }
                    await _context.Anotaciones.AddRangeAsync(backup.Anotaciones);
                }

                if (backup.Correspondencias?.Any() == true) await _context.Correspondencias.AddRangeAsync(backup.Correspondencias);
                if (backup.AuditLogs?.Any() == true) await _context.AuditLogs.AddRangeAsync(backup.AuditLogs);

                if (backup.RecibosPublicos?.Any() == true)
                {
                    foreach(var rp in backup.RecibosPublicos) rp.Entregas = new List<EntregaRecibo>();
                    await _context.RecibosPublicos.AddRangeAsync(backup.RecibosPublicos);
                }

                if (backup.EntregasRecibos?.Any() == true)
                {
                    foreach(var er in backup.EntregasRecibos) er.ReciboPublico = null;
                    await _context.EntregasRecibos.AddRangeAsync(backup.EntregasRecibos);
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = $"Sistema restaurado exitosamente desde {sourceInfo}." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Fallo en la base de datos durante la restauración.", detail = ex.Message });
            }
        }

        public class ManualReportRequest
        {
            public string? Email { get; set; }
            public int? Mes { get; set; }
            public int? Anio { get; set; }
        }

        [HttpPost("enviar-reporte-analitico")]
        public async Task<IActionResult> EnviarReporteAnalitico([FromBody] ManualReportRequest req)
        {
            try
            {
                var now = DateTime.UtcNow;
                int month = req.Mes ?? now.Month;
                int year = req.Anio ?? now.Year;
                var analytics = await _reportData.GetMonthlyAnalyticsAsync(month, year);
                var pdfBytes = _pdfService.GenerateMonthlyReport(analytics);

                string recipient = req.Email ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "gerencia@softcoinp.com";
                string encryptionKey = "1020304050"; 
                var reportDate = new DateTime(year, month, 1);

                await _emailService.SendSecureReportAsync(
                    recipient,
                    $"SOFTCOINP Reporte Analítico - {reportDate:MMMM yyyy}",
                    $"Reporte consolidado para el mes de {reportDate:MMMM}.",
                    pdfBytes,
                    encryptionKey
                );

                return Ok(new { message = $"Reporte enviado a {recipient}." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Fallo al generar reporte.", detail = ex.Message });
            }
        }
    }

    public class ClearDataRequest
    {
        public bool Registros { get; set; }
        public bool Personal { get; set; }
        public bool Vehiculos { get; set; }
        public bool Anotaciones { get; set; }
        public bool Correspondencia { get; set; }
        public bool Recibos { get; set; }
        public bool Auditoria { get; set; }
    }

    public class BackupDataDto
    {
        public DateTime ExportDate { get; set; }
        public string Version { get; set; } = string.Empty;
        public List<SystemSetting> SystemSettings { get; set; } = new();
        public List<TipoPersonal> TiposPersonal { get; set; } = new();
        public List<User> Users { get; set; } = new();
        public List<UserPermission> UserPermissions { get; set; } = new();
        public List<Personal> Personal { get; set; } = new();
        public List<Vehiculo> Vehiculos { get; set; } = new();
        public List<Anotacion> Anotaciones { get; set; } = new();
        public List<Registro> Registros { get; set; } = new();
        public List<RegistroVehiculo> RegistrosVehiculos { get; set; } = new();
        public List<Correspondencia> Correspondencias { get; set; } = new();
        public List<AuditLog> AuditLogs { get; set; } = new();
        public List<ReciboPublico> RecibosPublicos { get; set; } = new();
        public List<EntregaRecibo> EntregasRecibos { get; set; } = new();
    }
}
