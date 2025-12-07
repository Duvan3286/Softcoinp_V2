using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Softcoinp.Backend.Models
{
    public class Personal
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        public string Apellido { get; set; } = string.Empty;

        [Required]
        public string Documento { get; set; } = string.Empty;

        public string Tipo { get; set; } = "visitante";

        public string? FotoUrl { get; set; }

        public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;

        // Relación 1:N correcta
        public List<Registro> Registros { get; set; } = new();
    }
}
