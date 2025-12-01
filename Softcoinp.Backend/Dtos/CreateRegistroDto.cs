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

        [Required(ErrorMessage = "El destino es obligatorio")]
        public string Destino { get; set; } = string.Empty;

        // No es obligatorio, puede venir vacío
        public string? Motivo { get; set; }

        // Si no se envía, en el controller se asigna "visitante" por defecto
        public string? Tipo { get; set; }
    }
}
