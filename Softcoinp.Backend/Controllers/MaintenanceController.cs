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

namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "superadmin")]
    public class MaintenanceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public MaintenanceController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
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
        /// Genera un ZIP con el JSON de toda la base de datos y un dump SQL completo de PostgreSQL (si está disponible).
        /// </summary>
        [HttpGet("export-full-backup")]
        public async Task<IActionResult> ExportFullBackup()
        {
            var tempDir = Path.Combine(Path.GetTempPath(), $"softcoinp_bkp_{Guid.NewGuid()}");
            Directory.CreateDirectory(tempDir);

            try
            {
                // 1. Generar JSON de Respaldo Completo (Fallback robusto si falla pg_dump)
                var fullData = new BackupDataDto
                {
                    ExportDate = DateTime.UtcNow,
                    Version = "2.3.5 (Full+SQL)",
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
                var jsonOptions = new JsonSerializerOptions { WriteIndented = true, ReferenceHandler = ReferenceHandler.IgnoreCycles };
                var fullJson = JsonSerializer.Serialize(fullData, jsonOptions);
                await System.IO.File.WriteAllTextAsync(Path.Combine(tempDir, "configuracion.json"), fullJson);

                // 2. Intentar generar SQL con pg_dump (Opcional)
                try 
                {
                    var connString = _configuration.GetConnectionString("DefaultConnection") ?? "";
                    var sqlPath = Path.Combine(tempDir, "datos.sql");
                    var builder = new Npgsql.NpgsqlConnectionStringBuilder(connString);

                    var processInfo = new ProcessStartInfo
                    {
                        FileName = "pg_dump",
                        Arguments = $"-h {builder.Host} -U {builder.Username} -d {builder.Database} -f \"{sqlPath}\" --no-owner --no-privileges",
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };
                    processInfo.EnvironmentVariables["PGPASSWORD"] = builder.Password;

                    using (var process = Process.Start(processInfo))
                    {
                        if (process != null)
                        {
                            await process.WaitForExitAsync();
                            if (process.ExitCode != 0) 
                            {
                                string stderr = await process.StandardError.ReadToEndAsync();
                                Console.WriteLine($"Aviso: pg_dump falló pero se continuará con el JSON. Error: {stderr}");
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Aviso: pg_dump no disponible o falló: {ex.Message}. Se genera backup solo con JSON.");
                    // No relanzamos la excepción para permitir que el ZIP se genere solo con el JSON
                }

                // 3. Crear ZIP
                var zipPath = Path.Combine(Path.GetTempPath(), $"backup_full_{DateTime.Now:yyyyMMdd_HHmm}.zip");
                if (System.IO.File.Exists(zipPath)) System.IO.File.Delete(zipPath);
                
                ZipFile.CreateFromDirectory(tempDir, zipPath);
                var zipBytes = await System.IO.File.ReadAllBytesAsync(zipPath);
                
                // Limpieza post-proceso
                System.IO.File.Delete(zipPath);
                Directory.Delete(tempDir, true);

                return File(zipBytes, "application/zip", $"softcoinp_full_backup_{DateTime.Now:yyyyMMdd}.zip");
            }
            catch (Exception ex)
            {
                if (Directory.Exists(tempDir)) Directory.Delete(tempDir, true);
                return StatusCode(500, new { error = "Error crítico al generar backup", detail = ex.Message });
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
                // 1. Limpiar tablas transaccionales y de registro
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"EntregasRecibos\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"RecibosPublicos\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"RegistrosVehiculos\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Registros\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Anotaciones\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Correspondencias\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"AuditLogs\"");
                
                // 2. Limpiar tablas maestras (orden importa por FKs)
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Vehiculos\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Personal\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"UserPermissions\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Users\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"TiposPersonal\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"SystemSettings\"");

                // 3. Insertar Seeds Básicos mediante SQL Directo (evita conflictos con EF Change Tracker)
                // Usamos guiones dobles para escapar comillas en C# si es necesario, pero aquí usamos cadenas simples
                
                await _context.Database.ExecuteSqlRawAsync(@"
                    INSERT INTO ""TiposPersonal"" (""Id"", ""Nombre"", ""Activo"") VALUES 
                    ('00000000-0000-0000-0000-000000000001', 'Empleado', true),
                    ('00000000-0000-0000-0000-000000000002', 'Visitante', true);
                ");

                var superPass = BCrypt.Net.BCrypt.HashPassword("SuperDev2026!");
                var adminPass = BCrypt.Net.BCrypt.HashPassword("Admin123");

                await _context.Database.ExecuteSqlRawAsync($@"
                    INSERT INTO ""Users"" (""Id"", ""Email"", ""PasswordHash"", ""Role"", ""Nombre"", ""CreatedAt"", ""RefreshToken"", ""RefreshTokenExpiry"") VALUES 
                    ('00000000-0000-0000-0000-000000000000', 'superadmin@dev', '{superPass}', 'superadmin', 'Super Desarrollador', NOW() AT TIME ZONE 'UTC', '', NOW() AT TIME ZONE 'UTC'),
                    ('00000000-0000-0000-0000-00000000000A', 'admin@local', '{adminPass}', 'admin', 'Administrador Sistema', NOW() AT TIME ZONE 'UTC', '', NOW() AT TIME ZONE 'UTC');
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
        public async Task<IActionResult> ClearOperationalData()
        {
            try
            {
                // Orden de eliminación para respetar llaves foráneas (Dependencias -> Maestras)
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"EntregasRecibos\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"RecibosPublicos\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"RegistrosVehiculos\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Registros\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Anotaciones\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Correspondencias\"");
                
                // Ahora borramos las maestras operativas
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Vehiculos\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Personal\"");

                return Ok(new { message = "Datos operativos limpiados con éxito. Se conservan Usuarios y Configuraciones." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Realiza un reset total de la base de datos: Borra todo y re-inserta seeds.
        /// </summary>
        [HttpPost("reset-all")]
        public async Task<IActionResult> ResetAll()
        {
            try
            {
                // 1. Borrado masivo (PostgreSQL)
                await _context.Database.ExecuteSqlRawAsync("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
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
                    Version = "2.2.0", // Actualizamos versión para reflejar el backup completo
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
                Console.WriteLine($"Error ExportBackup: {ex.Message}");
                if (ex.InnerException != null) Console.WriteLine($"Inner ExportBackup: {ex.InnerException.Message}");
                return StatusCode(500, new { error = "Error al generar el backup", detail = ex.Message });
            }
        }

        /// <summary>
        /// Restaura la base de datos completa desde un archivo JSON o un paquete ZIP.
        /// </summary>
        [HttpPost("import-backup")]
        public async Task<IActionResult> ImportBackup([FromForm] Microsoft.AspNetCore.Http.IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "Archivo no válido o vacío." });

            try
            {
                BackupDataDto? backup = null;
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

                // 1. Detectar si es ZIP o JSON
                if (file.FileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
                {
                    using var stream = file.OpenReadStream();
                    using var archive = new ZipArchive(stream);
                    var entry = archive.GetEntry("configuracion.json");
                    
                    if (entry == null)
                        return BadRequest(new { error = "El archivo ZIP no contiene 'configuracion.json'." });

                    using var entryStream = entry.Open();
                    backup = await JsonSerializer.DeserializeAsync<BackupDataDto>(entryStream, options);
                }
                else
                {
                    using var stream = file.OpenReadStream();
                    backup = await JsonSerializer.DeserializeAsync<BackupDataDto>(stream, options);
                }

                if (backup == null)
                    return BadRequest(new { error = "El formato del respaldo no es válido o está corrupto." });

                Console.WriteLine($"Importando Respaldo v{backup.Version}: {backup.Personal?.Count ?? 0} Personal, {backup.Vehiculos?.Count ?? 0} Vehículos.");

                // INICIA LA RESTAURACIÓN (Lógica existente protegida)
                
                // 1. Limpiar todo el esquema (Re-crear tablas vacías)
                await _context.Database.ExecuteSqlRawAsync("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
                await _context.Database.MigrateAsync();
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"TiposPersonal\"");

                // 2. Restaurar en orden de dependencias
                
                // Config y Maestras Base
                if (backup.SystemSettings?.Any() == true)
                {
                    await _context.SystemSettings.AddRangeAsync(backup.SystemSettings);
                    await _context.SaveChangesAsync();
                }

                if (backup.TiposPersonal?.Any() == true)
                {
                    await _context.TiposPersonal.AddRangeAsync(backup.TiposPersonal);
                    await _context.SaveChangesAsync();
                }

                if (backup.Users?.Any() == true)
                {
                    await _context.Users.AddRangeAsync(backup.Users);
                    await _context.SaveChangesAsync();
                }

                if (backup.UserPermissions?.Any() == true)
                {
                    foreach(var up in backup.UserPermissions) up.User = null;
                    await _context.UserPermissions.AddRangeAsync(backup.UserPermissions);
                    await _context.SaveChangesAsync();
                }

                // Personal y Vehículos
                if (backup.Personal?.Any() == true)
                {
                    foreach(var per in backup.Personal) { per.Registros = new(); per.Anotaciones = new(); }
                    await _context.Personal.AddRangeAsync(backup.Personal);
                    await _context.SaveChangesAsync();
                }

                if (backup.Vehiculos?.Any() == true)
                {
                    foreach(var veh in backup.Vehiculos) veh.Personal = null!;
                    await _context.Vehiculos.AddRangeAsync(backup.Vehiculos);
                    await _context.SaveChangesAsync();
                }

                // Transaccionales
                if (backup.Registros?.Any() == true)
                {
                    foreach(var reg in backup.Registros) reg.Personal = null!;
                    await _context.Registros.AddRangeAsync(backup.Registros);
                    await _context.SaveChangesAsync();
                }

                if (backup.RegistrosVehiculos?.Any() == true)
                {
                    foreach(var rv in backup.RegistrosVehiculos) rv.Vehiculo = null!;
                    await _context.RegistrosVehiculos.AddRangeAsync(backup.RegistrosVehiculos);
                    await _context.SaveChangesAsync();
                }

                if (backup.Anotaciones?.Any() == true)
                {
                    foreach(var an in backup.Anotaciones) { an.Personal = null; an.Vehiculo = null; }
                    await _context.Anotaciones.AddRangeAsync(backup.Anotaciones);
                    await _context.SaveChangesAsync();
                }

                if (backup.Correspondencias?.Any() == true)
                {
                    await _context.Correspondencias.AddRangeAsync(backup.Correspondencias);
                    await _context.SaveChangesAsync();
                }

                if (backup.AuditLogs?.Any() == true)
                {
                    await _context.AuditLogs.AddRangeAsync(backup.AuditLogs);
                    await _context.SaveChangesAsync();
                }

                if (backup.RecibosPublicos?.Any() == true)
                {
                    foreach(var rp in backup.RecibosPublicos) rp.Entregas = new List<EntregaRecibo>();
                    await _context.RecibosPublicos.AddRangeAsync(backup.RecibosPublicos);
                    await _context.SaveChangesAsync();
                }

                if (backup.EntregasRecibos?.Any() == true)
                {
                    foreach(var er in backup.EntregasRecibos) er.ReciboPublico = null;
                    await _context.EntregasRecibos.AddRangeAsync(backup.EntregasRecibos);
                    await _context.SaveChangesAsync();
                }

                return Ok(new { message = $"Sistema restaurado exitosamente desde {(file.FileName.EndsWith(".zip") ? "paquete ZIP" : "archivo JSON")}. Cierra sesión para aplicar los cambios." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error Import: {ex.Message}");
                return StatusCode(500, new { error = "Error crítico durante la restauración. Posible corrupción del archivo.", detail = ex.Message });
            }
        }
    }

    // DTO para estructurar el archivo JSON
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
