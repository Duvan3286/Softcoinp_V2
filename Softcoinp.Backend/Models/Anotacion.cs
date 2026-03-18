using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Softcoinp.Backend.Models
{
    public class Anotacion
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid? PersonalId { get; set; }
 
        public Guid? VehiculoId { get; set; }
 
        [Required(ErrorMessage = "El texto de la anotación es obligatorio.")]
        public string Texto { get; set; } = string.Empty;
 
        public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
 
        [Required]
        public Guid RegistradoPor { get; set; } // ID del usuario (admin/security) que crea el reporte
 
        // Propiedades de navegación
        [ForeignKey("PersonalId")]
        public Personal? Personal { get; set; }
 
        [ForeignKey("VehiculoId")]
        public Vehiculo? Vehiculo { get; set; }
    }
}
