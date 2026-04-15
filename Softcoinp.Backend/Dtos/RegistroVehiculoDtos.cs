using System.ComponentModel.DataAnnotations;

namespace Softcoinp.Backend.Dtos
{
    public class CreateRegistroVehiculoDto
    {
        [Required(ErrorMessage = "La placa es obligatoria")]
        [RegularExpression(@"^[A-Z0-9]{6}$", ErrorMessage = "La placa debe tener exactamente 6 caracteres alfanuméricos")]
        public string Placa { get; set; } = string.Empty;

        public string? Marca { get; set; }

        [RegularExpression(@"^[0-9]{4}$", ErrorMessage = "El modelo debe tener exactamente 4 dígitos numéricos")]
        public string? Modelo { get; set; }
        public string? Color { get; set; }
        public string? TipoVehiculo { get; set; }

        public string? FotoVehiculo { get; set; } // Base64

        public Guid? ConductorId { get; set; }
        public string? ConductorNombre { get; set; }
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

        public Guid? ConductorId { get; set; }
        public string? ConductorNombre { get; set; }

        public Guid? ConductorSalidaId { get; set; }
        public string? ConductorSalidaNombre { get; set; }
    }

    public class RegistrarSalidaDto
    {
        public Guid? ConductorSalidaId { get; set; }
        public string? ConductorSalidaNombre { get; set; }
    }
}
