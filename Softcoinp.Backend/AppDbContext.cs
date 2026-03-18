using Microsoft.EntityFrameworkCore;
using Softcoinp.Backend.Models;

namespace Softcoinp.Backend
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Registro> Registros { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<Personal> Personal { get; set; }
        public DbSet<Anotacion> Anotaciones { get; set; }
        public DbSet<TipoPersonal> TiposPersonal { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Documento único
            modelBuilder.Entity<Personal>()
                .HasIndex(p => p.Documento)
                .IsUnique();

            // Relación 1:N entre Personal y Registro
            modelBuilder.Entity<Registro>()
                .HasOne(r => r.Personal)
                .WithMany(p => p.Registros)   // ← ESTA ES LA PARTE QUE FALTABA
                .HasForeignKey(r => r.PersonalId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relación 1:N entre Personal y Anotacion
            modelBuilder.Entity<Anotacion>()
                .HasOne(a => a.Personal)
                .WithMany(p => p.Anotaciones)
                .HasForeignKey(a => a.PersonalId)
                .OnDelete(DeleteBehavior.Cascade); // Si se elimina un personal, se borran sus reportes

            // Seed initial Personal Types
            modelBuilder.Entity<TipoPersonal>().HasData(
                new TipoPersonal { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), Nombre = "Empleado", Activo = true },
                new TipoPersonal { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Nombre = "Visitante", Activo = true }
            );

            base.OnModelCreating(modelBuilder);
        }

    }
}
