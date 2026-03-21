using System.ComponentModel.DataAnnotations;

namespace Softcoinp.Backend.Dtos
{
    public class CreateRegistroVehiculoDto
    {
        [Required]
        public string Placa { get; set; } = string.Empty;

        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public string? Color { get; set; }
        public string? TipoVehiculo { get; set; }

        public string? FotoVehiculo { get; set; } // Base64
    }

    public class RegistroVehiculoDto
    {
        public Guid Id { get; set; }
        public Guid? VehiculoId { get; set; }
        public string Placa { get; set; } = string.Empty;
        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public string? Color { get; set; }
        public string? TipoVehiculo { get; set; }
        public string? FotoVehiculoUrl { get; set; }

        public DateTime HoraIngresoUtc { get; set; }
        public DateTime HoraIngresoLocal { get; set; }
        public DateTime? HoraSalidaUtc { get; set; }
        public DateTime? HoraSalidaLocal { get; set; }

        public Guid? RegistradoPor { get; set; }
        public string? RegistradoPorNombre { get; set; }
    }
}
