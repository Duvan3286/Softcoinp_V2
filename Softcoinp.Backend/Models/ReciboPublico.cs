using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Softcoinp.Backend.Models
{
    public class ReciboPublico
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string Servicio { get; set; } = string.Empty; // Agua, Luz, Gas, etc.

        [Required]
        public string Mes { get; set; } = string.Empty;

        public int Anio { get; set; } = DateTime.UtcNow.Year;

        [Required]
        public int TotalRecibidos { get; set; }

        public int TotalEntregados { get; set; } = 0;

        public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;

        public bool Activo { get; set; } = true;

        // Relación con las entregas individuales
        public ICollection<EntregaRecibo> Entregas { get; set; } = new List<EntregaRecibo>();

        // Propiedad calculada
        public int Pendientes => TotalRecibidos - TotalEntregados;
    }

    public class EntregaRecibo
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid ReciboPublicoId { get; set; }
        public ReciboPublico? ReciboPublico { get; set; }

        [Required]
        public string ResidenteNombre { get; set; } = string.Empty;

        [Required]
        public string Apartamento { get; set; } = string.Empty;

        public DateTime FechaEntregaUtc { get; set; } = DateTime.UtcNow;

        public string RegistradoPor { get; set; } = string.Empty;
    }
}
