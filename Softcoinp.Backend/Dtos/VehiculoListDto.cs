using System;

namespace Softcoinp.Backend.Dtos
{
    public class VehiculoListDto
    {
        public Guid Id { get; set; }
        public string Placa { get; set; } = string.Empty;
        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public string? Color { get; set; }
        public string? TipoVehiculo { get; set; }
        public string? FotoUrl { get; set; }

        // Datos del Propietario
        public Guid PropietarioId { get; set; }
        public string PropietarioNombre { get; set; } = string.Empty;
        public string PropietarioApellido { get; set; } = string.Empty;
        public string PropietarioDocumento { get; set; } = string.Empty;
        public string PropietarioTipo { get; set; } = string.Empty;
        public string? PropietarioFotoUrl { get; set; }
        public string? PropietarioTelefono { get; set; }
    }
}
