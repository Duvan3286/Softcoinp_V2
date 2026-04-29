using System;
using System.Collections.Generic;
using System.Linq;
using Softcoinp.Backend.Models;

namespace Softcoinp.Backend.Services
{
    public class DatabaseSeeder
    {
        private readonly AppDbContext _context;

        public DatabaseSeeder(AppDbContext context)
        {
            _context = context;
        }

        public void Seed()
        {
            // Seed de Configuraciones
            if (!_context.SystemSettings.Any(s => s.Key == "ClientName"))
            {
                _context.SystemSettings.Add(new SystemSetting { Key = "ClientName", Value = "SOFTCOINP", UpdatedAt = DateTime.UtcNow });
            }
            if (!_context.SystemSettings.Any(s => s.Key == "SystemVersion"))
            {
                _context.SystemSettings.Add(new SystemSetting { Key = "SystemVersion", Value = "2.5.0", UpdatedAt = DateTime.UtcNow });
            }

            // Seed de Tipos de Personal
            if (!_context.TiposPersonal.Any())
            {
                _context.TiposPersonal.AddRange(new List<TipoPersonal> {
                    new TipoPersonal { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), Nombre = "Empleado", Activo = true },
                    new TipoPersonal { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Nombre = "Visitante", Activo = true }
                });
            }

            // Seed de Usuarios (Admin y SuperAdmin)
            if (!_context.Users.Any())
            {
                var superPass = BCrypt.Net.BCrypt.HashPassword("SuperDev2026!");
                var adminPass = BCrypt.Net.BCrypt.HashPassword("Admin123");

                _context.Users.AddRange(new List<User> {
                    new User { 
                        Id = Guid.Parse("00000000-0000-0000-0000-000000000000"), 
                        Email = "superadmin@dev", 
                        Nombre = "Super Desarrollador", 
                        PasswordHash = superPass, 
                        Role = "superadmin",
                        CreatedAt = DateTime.UtcNow,
                        RefreshToken = "",
                        RefreshTokenExpiry = DateTime.UtcNow
                    },
                    new User { 
                        Id = Guid.Parse("00000000-0000-0000-0000-00000000000A"), 
                        Email = "admin@local", 
                        Nombre = "Administrador Sistema", 
                        PasswordHash = adminPass, 
                        Role = "admin",
                        CreatedAt = DateTime.UtcNow,
                        RefreshToken = "",
                        RefreshTokenExpiry = DateTime.UtcNow
                    }
                });
            }

            _context.SaveChanges();
        }
    }
}
