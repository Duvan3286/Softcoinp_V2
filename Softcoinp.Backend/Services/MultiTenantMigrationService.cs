using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Softcoinp.Backend.Models;

namespace Softcoinp.Backend.Services
{
    public class MultiTenantMigrationService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MultiTenantMigrationService> _logger;
        private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;

        public MultiTenantMigrationService(
            IServiceProvider serviceProvider, 
            ILogger<MultiTenantMigrationService> logger,
            Microsoft.Extensions.Configuration.IConfiguration configuration)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task MigrateAndSeedAllTenantsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var masterDb = scope.ServiceProvider.GetRequiredService<MasterDbContext>();
            
            _logger.LogInformation("Iniciando migración de Master Database...");
            await masterDb.Database.MigrateAsync();

            // Seed default tenant for development if none exists
            if (!await masterDb.Tenants.AnyAsync())
            {
                _logger.LogInformation("No se encontraron tenants. Creando tenant 'dev' por defecto...");
                
                var masterConn = _configuration.GetConnectionString("MasterConnection") ?? "";
                var devConn = masterConn.Replace("Database=softcoinp_master", "Database=softcoinp_dev")
                                        .Replace("database=softcoinp_master", "database=softcoinp_dev");

                if (string.IsNullOrEmpty(devConn)) devConn = masterConn; // Fallback

                masterDb.Tenants.Add(new Tenant
                {
                    Id = Guid.NewGuid(),
                    Subdomain = "dev",
                    ConnectionString = devConn,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
                await masterDb.SaveChangesAsync();
            }

            var tenants = await masterDb.Tenants.Where(t => t.IsActive).ToListAsync();
            _logger.LogInformation($"Se encontraron {tenants.Count} tenants activos para migrar.");

            foreach (var tenant in tenants)
            {
                try
                {
                    _logger.LogInformation($"Migrando tenant: {tenant.Subdomain}...");
                    
                    // We need a way to set the current tenant for the AppDbContext
                    // Since AppDbContext is scoped and depends on ITenantProvider, 
                    // we can't easily change it here without a way to override ITenantProvider.
                    // For administrative tasks like migration, we'll create a new context manually.
                    
                    var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
                    optionsBuilder.UseMySql(tenant.ConnectionString, ServerVersion.AutoDetect(tenant.ConnectionString));
                    
                    using var tenantContext = new AppDbContext(optionsBuilder.Options, null!); // Pass null for ITenantProvider as we use explicit options
                    
                    await tenantContext.Database.MigrateAsync();
                    
                    var seeder = new DatabaseSeeder(tenantContext);
                    seeder.Seed();
                    
                    _logger.LogInformation($"✅ Tenant {tenant.Subdomain} migrado y sembrado con éxito.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"❌ Error migrando tenant {tenant.Subdomain}: {ex.Message}");
                }
            }
        }
    }
}
