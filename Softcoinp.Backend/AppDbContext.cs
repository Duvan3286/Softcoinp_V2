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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Personal>()
                .HasIndex(p => p.Documento)
                .IsUnique();

            modelBuilder.Entity<Registro>()
                .HasOne(r => r.Personal)
                .WithMany()
                .HasForeignKey(r => r.PersonalId)
                .OnDelete(DeleteBehavior.Restrict);

            base.OnModelCreating(modelBuilder);
        }
    }
}
