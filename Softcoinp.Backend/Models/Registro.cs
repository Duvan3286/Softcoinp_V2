using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Softcoinp.Backend.Models
{
    public class Registro
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        // Relación con la tabla Personal (1:N)
        [Required]
        public Guid PersonalId { get; set; }

        [ForeignKey("PersonalId")]
        public Personal Personal { get; set; } = null!;

        // Datos redundantes para mantener historial congelado
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string Documento { get; set; } = string.Empty;

        public string Motivo { get; set; } = string.Empty;
        public string Destino { get; set; } = string.Empty;
        public string Tipo { get; set; } = "visitante";

        // Hora de entrada (UTC)
        public DateTime HoraIngresoUtc { get; set; } = DateTime.UtcNow;

        // Hora de salida (UTC)
        public DateTime? HoraSalidaUtc { get; set; }

        // LOCAL TIME (solo lectura)
        [NotMapped]
        public DateTime HoraIngresoLocal =>
            TimeZoneInfo.ConvertTimeFromUtc(HoraIngresoUtc,
                TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time"));

        [NotMapped]
        public DateTime? HoraSalidaLocal =>
            HoraSalidaUtc == null
                ? null
                : TimeZoneInfo.ConvertTimeFromUtc(HoraSalidaUtc.Value,
                    TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time"));

        // Foto tomada al momento de la entrada (selfie de validación)
        public string? FotoUrl { get; set; }

        // Usuario que registró la entrada
        public Guid? RegistradoPor { get; set; }
    }
}
