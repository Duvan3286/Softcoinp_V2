using System;
using System.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;

namespace Softcoinp.Backend.Services
{
    public class SubdomainTenantProvider : ITenantProvider
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMemoryCache _cache;
        private readonly MasterDbContext _masterDb;
        private readonly string _defaultConnectionString;

        public SubdomainTenantProvider(
            IHttpContextAccessor httpContextAccessor, 
            IMemoryCache cache, 
            MasterDbContext masterDb,
            IConfiguration configuration)
        {
            _httpContextAccessor = httpContextAccessor;
            _cache = cache;
            _masterDb = masterDb;
            _defaultConnectionString = configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
        }

        public string? GetSubdomain()
        {
            var host = _httpContextAccessor.HttpContext?.Request.Host.Host;
            if (string.IsNullOrEmpty(host)) return null;

            var segments = host.Split('.');
            if (segments.Length < 2) return null; // localtest.me, etc. need at least 2 parts for a subdomain

            // Handle localhost or IP addresses
            if (segments.Length == 1 || int.TryParse(segments[0], out _)) return null;

            return segments[0].ToLower();
        }

        public string GetConnectionString()
        {
            var subdomain = GetSubdomain();
            if (string.IsNullOrEmpty(subdomain) || subdomain == "www")
            {
                return _defaultConnectionString;
            }

            string cacheKey = $"tenant_conn_{subdomain}";
            if (!_cache.TryGetValue(cacheKey, out string? connectionString))
            {
                var tenant = _masterDb.Tenants
                    .FirstOrDefault(t => t.Subdomain == subdomain && t.IsActive);

                if (tenant != null)
                {
                    connectionString = tenant.ConnectionString;
                    var cacheOptions = new MemoryCacheEntryOptions()
                        .SetSlidingExpiration(TimeSpan.FromMinutes(30));
                    _cache.Set(cacheKey, connectionString, cacheOptions);
                }
                else
                {
                    // Fallback to default or throw exception depending on policy
                    connectionString = _defaultConnectionString;
                }
            }

            return connectionString ?? _defaultConnectionString;
        }
    }
}
