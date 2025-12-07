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

        public string? Motivo { get; set; }

        public string? Tipo { get; set; }  // visitante por defecto

        // 📸 Foto en base64 → obligatoria para registrar
        [Required(ErrorMessage = "La fotografía es obligatoria para el registro.")]
        public string? Foto { get; set; }
    }
}
