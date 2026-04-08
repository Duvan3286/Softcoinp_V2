using System.ComponentModel.DataAnnotations;

namespace Softcoinp.Backend.Dtos
{
    public class CreateRegistroDto
    {
        [Required(ErrorMessage = "El nombre es obligatorio")]
        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "El apellido es obligatorio")]
        public string Apellido { get; set; } = string.Empty;

        [Required(ErrorMessage = "El documento es obligatorio")]
        public string Documento { get; set; } = string.Empty;

        public string? Telefono { get; set; }

        [Required(ErrorMessage = "El destino es obligatorio")]
        public string Destino { get; set; } = string.Empty;

        public string? Motivo { get; set; }

        public string? Tipo { get; set; }  // visitante por defecto

        // 📸 Foto en base64 → obligatoria solo si es nuevo (se valida en controlador)
        public string? Foto { get; set; }

        // 🚗 Datos opcionales del vehículo
        public string? Placa { get; set; }
        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public string? Color { get; set; }
        public string? TipoVehiculo { get; set; }
        public string? FotoVehiculo { get; set; } // base64
    }
}
