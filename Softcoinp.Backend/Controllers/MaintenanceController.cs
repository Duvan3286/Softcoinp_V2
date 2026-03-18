using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using Softcoinp.Backend.Models;
using System;
using System.Linq;

namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
                // 1. Limpiar tablas transaccionales
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Registros\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Anotaciones\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"AuditLogs\"");
                
                // 2. Limpiar tablas maestras
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Personal\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Users\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"TiposPersonal\"");

                // 3. Insertar Seeds Básicos mediante EF
                var tipos = new[]
                {
                    new TipoPersonal { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), Nombre = "Empleado", Activo = true },
                    new TipoPersonal { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Nombre = "Visitante", Activo = true }
                };
                _context.TiposPersonal.AddRange(tipos);

                var admin = new User
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000000"),
                    Email = "admin@local",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123"),
                    Role = "admin",
                    Nombre = "Administrador Sistema",
                    CreatedAt = DateTime.UtcNow,
                    RefreshToken = string.Empty,
                    RefreshTokenExpiry = DateTime.UtcNow
                };
                _context.Users.Add(admin);

                await _context.SaveChangesAsync();

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
                // Orden de eliminación para respetar llaves foráneas
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Registros\"");
                await _context.Database.ExecuteSqlRawAsync("DELETE FROM \"Anotaciones\"");
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
