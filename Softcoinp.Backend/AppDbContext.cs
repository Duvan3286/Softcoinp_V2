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
        public DbSet<Vehiculo> Vehiculos { get; set; }
        public DbSet<SystemSetting> SystemSettings { get; set; }
        public DbSet<Correspondencia> Correspondencias { get; set; }
        public DbSet<RegistroVehiculo> RegistrosVehiculos { get; set; }
        public DbSet<UserPermission> UserPermissions { get; set; }

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

            // Relación Personal - Anotacion
            modelBuilder.Entity<Anotacion>()
                .HasOne(a => a.Personal)
                .WithMany(p => p.Anotaciones)
                .HasForeignKey(a => a.PersonalId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relación Vehiculo - Anotacion
            modelBuilder.Entity<Anotacion>()
                .HasOne(a => a.Vehiculo)
                .WithMany() // Opcional: podrías agregar ICollection<Anotacion> en Vehiculo
                .HasForeignKey(a => a.VehiculoId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relación 1:N entre Personal y Vehiculo
            modelBuilder.Entity<Vehiculo>()
                .HasOne(v => v.Personal)
                .WithMany() // Una persona puede tener varios vehículos (historial)
                .HasForeignKey(v => v.PersonalId)
                .OnDelete(DeleteBehavior.Cascade);

            // Seed initial Personal Types
            modelBuilder.Entity<TipoPersonal>().HasData(
                new TipoPersonal { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), Nombre = "Empleado", Activo = true },
                new TipoPersonal { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Nombre = "Visitante", Activo = true }
            );

            // Unique ViewKey per User
            modelBuilder.Entity<UserPermission>()
                .HasIndex(up => new { up.UserId, up.ViewKey })
                .IsUnique();

            modelBuilder.Entity<UserPermission>()
                .HasOne(up => up.User)
                .WithMany()
                .HasForeignKey(up => up.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            base.OnModelCreating(modelBuilder);
        }

    }
}
