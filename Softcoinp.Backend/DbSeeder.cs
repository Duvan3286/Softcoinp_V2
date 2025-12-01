using Softcoinp.Backend.Models;
using BCrypt.Net;

namespace Softcoinp.Backend
{
    public static class DbSeeder
    {
        public static void Seed(AppDbContext context)
        {
            // Si no hay usuarios, creamos el admin por defecto
            if (!context.Users.Any())
            {
                var admin = new User
                {
                    Id = Guid.NewGuid(),
                    Email = "admin@local",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123"),
                    Role = "admin",
                    CreatedAt = DateTime.UtcNow
                };

                context.Users.Add(admin);
                context.SaveChanges();
            }
        }
    }
}
