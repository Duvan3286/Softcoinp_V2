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

        [RegularExpression(@"^\d{10}$", ErrorMessage = "El teléfono debe tener exactamente 10 dígitos numéricos")]
        public string? Telefono { get; set; }

        [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "El destino es obligatorio")]
        public string Destino { get; set; } = string.Empty;

        public string? Motivo { get; set; }

        public string? Tipo { get; set; }  // visitante por defecto

        // 📸 Foto en base64 → obligatoria solo si es nuevo (se valida en controlador)
        public string? Foto { get; set; }

        // 🚗 Datos opcionales del vehículo
        [RegularExpression(@"^[A-Z0-9]{6}$", ErrorMessage = "La placa debe tener exactamente 6 caracteres alfanuméricos")]
        public string? Placa { get; set; }
        public string? Marca { get; set; }
        
        [RegularExpression(@"^[0-9]{4}$", ErrorMessage = "El modelo debe tener exactamente 4 dígitos numéricos")]
        public string? Modelo { get; set; }
        public string? Color { get; set; }
        public string? TipoVehiculo { get; set; }
        public string? FotoVehiculo { get; set; } // base64

        // 🚗 Datos del Conductor (si es diferente al principal)
        public Guid? ConductorId { get; set; }
        public string? ConductorNombre { get; set; }
    }
}
