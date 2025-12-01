using System;
using System.ComponentModel.DataAnnotations;

namespace Softcoinp.Backend.Models
{
    public class AuditLog
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        // Usuario que realizó la acción (nullable por acciones no autenticadas)
        public Guid? UserId { get; set; }

        // Acción realizada: "UserCreated", "RegistroDeleted", "LoginFailed", etc.
        [Required]
        public string Action { get; set; } = string.Empty;

        // Entidad afectada: "User", "Registro", etc.
        public string? Entity { get; set; }

        // Id de la entidad afectada (si aplica)
        public Guid? EntityId { get; set; }

        // Datos adicionales (JSON), opcional
        public string? Data { get; set; }

        // IP y user-agent opcionales para trazabilidad
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }

        // Fecha del evento (UTC)
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
