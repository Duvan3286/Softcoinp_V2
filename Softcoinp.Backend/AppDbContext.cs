using Microsoft.EntityFrameworkCore;
using Softcoinp.Backend.Models;
using Softcoinp.Backend.Services;

namespace Softcoinp.Backend
{
    public class AppDbContext : DbContext
    {
        private readonly ITenantProvider _tenantProvider;

        public AppDbContext(DbContextOptions<AppDbContext> options, ITenantProvider tenantProvider) 
            : base(options) 
        {
            _tenantProvider = tenantProvider;
        }

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
        public DbSet<ReciboPublico> RecibosPublicos { get; set; }
        public DbSet<EntregaRecibo> EntregasRecibos { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (_tenantProvider != null)
            {
                var connectionString = _tenantProvider.GetConnectionString();
                if (!string.IsNullOrEmpty(connectionString))
                {
                    optionsBuilder.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
                }
            }
            base.OnConfiguring(optionsBuilder);
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Documento único
            modelBuilder.Entity<Personal>()
                .HasIndex(p => p.Documento)
                .IsUnique();

            // Relaciones de Registro con Personal
            modelBuilder.Entity<Registro>()
                .HasOne(r => r.Personal)
                .WithMany(p => p.Registros)
                .HasForeignKey(r => r.PersonalId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Registro>()
                .HasOne(r => r.Conductor)
                .WithMany()
                .HasForeignKey(r => r.ConductorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Registro>()
                .HasOne(r => r.ConductorSalida)
                .WithMany()
                .HasForeignKey(r => r.ConductorSalidaId)
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
                .WithMany()
                .HasForeignKey(a => a.VehiculoId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relación 1:N entre Personal y Vehiculo
            modelBuilder.Entity<Vehiculo>()
                .HasOne(v => v.Personal)
                .WithMany(p => p.Vehiculos)
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

            // Índices de rendimiento
            modelBuilder.Entity<Registro>()
                .HasIndex(r => r.Documento);
            modelBuilder.Entity<Registro>()
                .HasIndex(r => r.HoraIngresoUtc);
            modelBuilder.Entity<Registro>()
                .HasIndex(r => r.HoraSalidaUtc);

            modelBuilder.Entity<Vehiculo>()
                .HasIndex(v => v.Placa)
                .IsUnique();

            modelBuilder.Entity<Anotacion>()
                .HasIndex(a => a.VehiculoId);

            modelBuilder.Entity<Vehiculo>()
                .HasIndex(v => v.PersonalId);

            modelBuilder.Entity<RegistroVehiculo>()
                .HasOne(r => r.Conductor)
                .WithMany()
                .HasForeignKey(r => r.ConductorId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<RegistroVehiculo>()
                .HasOne(r => r.ConductorSalida)
                .WithMany()
                .HasForeignKey(r => r.ConductorSalidaId)
                .OnDelete(DeleteBehavior.Restrict);

            base.OnModelCreating(modelBuilder);
        }
    }
}
