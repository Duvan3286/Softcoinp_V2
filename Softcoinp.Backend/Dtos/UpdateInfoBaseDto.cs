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
        [RegularExpression(@"^[A-Z0-9]{6}$", ErrorMessage = "La placa debe tener exactamente 6 caracteres alfanuméricos")]
        public string? Placa { get; set; }
        public string? Marca { get; set; }
        [RegularExpression(@"^[0-9]{4}$", ErrorMessage = "El modelo debe tener exactamente 4 dígitos numéricos")]
        public string? Modelo { get; set; }
        public string? Color { get; set; }
        public string? TipoVehiculo { get; set; }
        public string? FotoVehiculo { get; set; } // base64
    }
}
