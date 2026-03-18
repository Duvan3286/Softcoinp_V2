using System;
using System.ComponentModel.DataAnnotations;

namespace Softcoinp.Backend.Models
{
    public class Correspondencia
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string Remitente { get; set; } = string.Empty; // quien envía

        [Required]
        public string Destinatario { get; set; } = string.Empty; // a quien va dirigido

        public string? TipoDocumento { get; set; } // Paquete, Carta, Encomienda, etc.
        public string? NumeroGuia { get; set; }
        public string? Descripcion { get; set; }

        // Estado: "en_espera" | "entregado"
        public string Estado { get; set; } = "en_espera";

        public DateTime FechaRecepcionUtc { get; set; } = DateTime.UtcNow;
        public DateTime FechaRecepcionLocal { get; set; } = DateTime.Now;

        // Datos de entrega (se llenan al entregar)
        public DateTime? FechaEntregaUtc { get; set; }
        public DateTime? FechaEntregaLocal { get; set; }
        public string? RecibidoPor { get; set; }   // Nombre de quien recibe
        public string? NotaEntrega { get; set; }   // Observación de entrega

        // Usuario que registró la recepción
        public Guid? RegistradoPor { get; set; }

        // Usuario que registró la entrega
        public Guid? EntregadoPor { get; set; }
    }
}
