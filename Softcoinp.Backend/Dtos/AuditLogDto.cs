using System;

namespace Softcoinp.Backend.Dtos
{
    public class AuditLogDto
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public string? Action { get; set; }
        public string? Entity { get; set; }
        public Guid? EntityId { get; set; }
        public string? Data { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
