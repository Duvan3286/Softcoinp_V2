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
        public string? TelefonoPersona { get; set; }
        public string? EmailPersona { get; set; }

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

        // Datos del vehículo al momento del registro (historial)
        public string? PlacaVehiculo { get; set; }
        public string? MarcaVehiculo { get; set; }
        public string? ModeloVehiculo { get; set; }
        public string? ColorVehiculo { get; set; }
        public string? TipoVehiculo { get; set; }
        public string? FotoVehiculoUrl { get; set; }

        // Foto tomada al momento de la entrada (selfie de validación)
        public string? FotoUrl { get; set; }

        // Usuario que registró la entrada
        public Guid? RegistradoPor { get; set; }

        // 🚗 Conductor del vehículo (opcional, si es diferente al Personal principal)
        public Guid? ConductorId { get; set; }

        [ForeignKey("ConductorId")]
        public Personal? Conductor { get; set; }

        public string? ConductorNombre { get; set; }

        // 👨‍✈️ Conductor del vehículo al momento de la SALIDA
        public Guid? ConductorSalidaId { get; set; }

        [ForeignKey("ConductorSalidaId")]
        public Personal? ConductorSalida { get; set; }

        public string? ConductorSalidaNombre { get; set; }
    }
}
