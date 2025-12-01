using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Softcoinp.Backend.Models
{
    public class Registro
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        // 🔹 Datos personales
        [Required(ErrorMessage = "El campo Nombre es obligatorio")]
        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "El campo Apellido es obligatorio")]
        public string Apellido { get; set; } = string.Empty;

        [Required(ErrorMessage = "El campo Documento es obligatorio")]
        public string Documento { get; set; } = string.Empty;

        public string? Motivo { get; set; }
        public string Destino { get; set; } = string.Empty;

        // Tipo de persona (visitante, contratista, etc.)
        public string Tipo { get; set; } = "visitante";

        // Relaciones
        public Guid? PersonalId { get; set; }    
        public Personal? Personal { get; set; }    

        // Guardar SIEMPRE en UTC
        public DateTime HoraIngresoUtc { get; set; } = DateTime.UtcNow;
        public DateTime? HoraSalidaUtc { get; set; }

        // Usuario que registró
        public Guid? RegistradoPor { get; set; }

        // Propiedades calculadas (no se guardan en BD)
        [NotMapped]
        public DateTime HoraIngresoLocal =>
            TimeZoneInfo.ConvertTimeFromUtc(HoraIngresoUtc,
                TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time"));

        [NotMapped]
        public DateTime? HoraSalidaLocal =>
            HoraSalidaUtc.HasValue
                ? TimeZoneInfo.ConvertTimeFromUtc(HoraSalidaUtc.Value,
                    TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time"))
                : null;
    }
}
