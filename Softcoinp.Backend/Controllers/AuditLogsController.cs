using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Softcoinp.Backend.Models;
using Softcoinp.Backend.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin")] // 🔒 Solo admins pueden consultar logs
    public class AuditLogsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AuditLogsController(AppDbContext db)
        {
            _db = db;
        }

        // GET: api/auditlogs
        [HttpGet]
        public IActionResult GetAll(
            [FromQuery] Guid? userId,
            [FromQuery] string? action,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var query = _db.AuditLogs.AsQueryable();

            if (userId.HasValue)
                query = query.Where(l => l.UserId == userId);

            if (!string.IsNullOrWhiteSpace(action))
                query = query.Where(l => l.Action == action);

           if (desde.HasValue)
            {
                var desdeUtc = DateTime.SpecifyKind(desde.Value, DateTimeKind.Utc);
                query = query.Where(l => l.CreatedAt >= desdeUtc);
            }

            if (hasta.HasValue)
            {
                var hastaUtc = DateTime.SpecifyKind(hasta.Value, DateTimeKind.Utc);
                query = query.Where(l => l.CreatedAt <= hastaUtc);
            }
            
            var total = query.Count();

            var logs = query
                .OrderByDescending(l => l.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new AuditLogDto
                {
                    Id = l.Id,
                    UserId = l.UserId,
                    Action = l.Action,
                    Entity = l.Entity,
                    EntityId = l.EntityId,
                    Data = l.Data,
                    IpAddress = l.IpAddress,
                    UserAgent = l.UserAgent,
                    CreatedAt = l.CreatedAt
                })
                .ToList();

            return Ok(new
            {
                total,
                page,
                pageSize,
                logs
            });
        }
    }
}
