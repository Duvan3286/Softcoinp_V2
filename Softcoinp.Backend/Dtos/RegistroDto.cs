using System;

namespace Softcoinp.Backend.Dtos
{
    public class RegistroDto
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string Documento { get; set; } = string.Empty;
        public string? Telefono { get; set; }
        public string? Email { get; set; }
        public string? Motivo { get; set; }
        public string Destino { get; set; } = string.Empty;
        public string Tipo { get; set; } = "visitante";

        public string? FotoUrl { get; set; } 

        public DateTime HoraIngresoUtc { get; set; }
        public DateTime? HoraSalidaUtc { get; set; }

        public DateTime HoraIngresoLocal { get; set; }
        public DateTime? HoraSalidaLocal { get; set; }

        public Guid? RegistradoPor { get; set; }
        public Guid? PersonalId { get; set; }
        
        public bool IsBloqueado { get; set; }
        public string? MotivoBloqueo { get; set; }

        // 🚗 Datos de vehículo asociados (Historial)
        public Guid? VehiculoId { get; set; }
        public string? PlacaVehiculo { get; set; }
        public string? MarcaVehiculo { get; set; }
        public string? ModeloVehiculo { get; set; }
        public string? ColorVehiculo { get; set; }
        public string? TipoVehiculo { get; set; }
        public string? FotoVehiculoUrl { get; set; }
    }
}