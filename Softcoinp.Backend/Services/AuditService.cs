using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Softcoinp.Backend.Models;

namespace Softcoinp.Backend.Services
{
    public class AuditService : IAuditService
    {
        private readonly AppDbContext _db;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuditService(AppDbContext db, IHttpContextAccessor httpContextAccessor)
        {
            _db = db;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task LogAsync(string action, string entity, Guid? entityId = null, object? data = null)
        {
            try
            {
                var http = _httpContextAccessor.HttpContext;
                Guid? userId = null;
                if (http?.User?.Identity?.IsAuthenticated == true)
                {
                    var idClaim = http.User.FindFirst("id")?.Value;
                    if (Guid.TryParse(idClaim, out var g)) userId = g;
                }

                string? ip = http?.Connection?.RemoteIpAddress?.ToString();
                string? ua = http?.Request?.Headers["User-Agent"].FirstOrDefault();

                var audit = new AuditLog
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Action = action ?? string.Empty,
                    Entity = entity,
                    EntityId = entityId,
                    Data = data is null ? null : JsonSerializer.Serialize(data),
                    IpAddress = ip,
                    UserAgent = ua,
                    CreatedAt = DateTime.UtcNow
                };

                _db.AuditLogs.Add(audit);
                await _db.SaveChangesAsync();
            }
            catch
            {
                // No hacer nada si falla el logging
                // Evitar que falle la operación principal por un error en auditoría
            }
        }
    }
}
