using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using Softcoinp.Backend.Models;
using System;
using System.Linq;
using Microsoft.AspNetCore.Authorization;

namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "superadmin")]
    public class MaintenanceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MaintenanceController(AppDbContext context)
        {
            _context = context;
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
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"RegistrosVehiculos\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Registros\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Anotaciones\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Correspondencias\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"AuditLogs\"");
                
                // 2. Limpiar tablas maestras (orden importa por FKs)
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Vehiculos\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Personal\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Users\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"TiposPersonal\"");

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
    }
}
