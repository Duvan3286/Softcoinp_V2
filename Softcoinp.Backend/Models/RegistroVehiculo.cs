using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Softcoinp.Backend.Models
{
    public class RegistroVehiculo
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        // Relación con el vehículo maestro (opcional si es un vehículo no registrado previamente)
        public Guid? VehiculoId { get; set; }

        [ForeignKey("VehiculoId")]
        public Vehiculo? Vehiculo { get; set; }

        // Datos del vehículo al momento del registro (historial congelado)
        [Required]
        public string Placa { get; set; } = string.Empty;
        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public string? Color { get; set; }
        public string? TipoVehiculo { get; set; }
        public string? FotoVehiculoUrl { get; set; }

        // Tiempos
        public DateTime HoraIngresoUtc { get; set; } = DateTime.UtcNow;
        public DateTime? HoraSalidaUtc { get; set; }

        // LOCAL TIME (solo lectura para conveniencia en el backend si se requiere)
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

        // Quién registró la entrada
        public Guid? RegistradoPor { get; set; }
    }
}
