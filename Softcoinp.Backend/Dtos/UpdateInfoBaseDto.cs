using System.ComponentModel.DataAnnotations;

namespace Softcoinp.Backend.Dtos
{
    public class UpdateInfoBaseDto
    {
        [Required(ErrorMessage = "El documento es obligatorio")]
        public string Documento { get; set; } = string.Empty;

        public string? Nombre { get; set; }
        public string? Apellido { get; set; }
        [RegularExpression(@"^\d{10}$", ErrorMessage = "El teléfono debe tener exactamente 10 dígitos numéricos")]
        public string? Telefono { get; set; }

        [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido")]
        public string? Email { get; set; }
        public string? Tipo { get; set; }
        public string? Foto { get; set; } // base64

        // 🚗 Datos del vehículo
        public string? Placa { get; set; }
        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public string? Color { get; set; }
        public string? TipoVehiculo { get; set; }
        public string? FotoVehiculo { get; set; } // base64
    }
}
