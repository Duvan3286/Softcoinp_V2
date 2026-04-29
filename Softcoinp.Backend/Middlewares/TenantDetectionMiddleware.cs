using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Softcoinp.Backend.Services;

namespace Softcoinp.Backend.Middlewares
{
    public class TenantDetectionMiddleware
    {
        private readonly RequestDelegate _next;

        public TenantDetectionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ITenantProvider tenantProvider, MasterDbContext masterDb)
        {
            var subdomain = tenantProvider.GetSubdomain();

            if (string.IsNullOrEmpty(subdomain) || subdomain == "www")
            {
                // Allow root access (maybe for a landing page or admin portal)
                await _next(context);
                return;
            }

            if (subdomain == "admin")
            {
                // Logic for admin subdomain could go here
                await _next(context);
                return;
            }

            // Check if tenant exists in Master DB
            var tenantExists = masterDb.Tenants.Any(t => t.Subdomain == subdomain && t.IsActive);

            if (!tenantExists)
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                await context.Response.WriteAsync($"Tenant '{subdomain}' not found or inactive.");
                return;
            }

            await _next(context);
        }
    }
}
