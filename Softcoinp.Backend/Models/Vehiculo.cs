using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Softcoinp.Backend.Models
{
    public class Vehiculo
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public string Placa { get; set; } = string.Empty;

        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public string? Color { get; set; }
        public string? TipoVehiculo { get; set; }
        public string? FotoUrl { get; set; }

        [Required]
        public Guid PersonalId { get; set; }

        [ForeignKey("PersonalId")]
        public Personal Personal { get; set; } = null!;

        public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
    }
}
