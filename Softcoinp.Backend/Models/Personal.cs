using System;
using System.ComponentModel.DataAnnotations;

namespace Softcoinp.Backend.Models
{
    public class Personal
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required(ErrorMessage = "El campo Nombre es obligatorio")]
        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "El campo Apellido es obligatorio")]
        public string Apellido { get; set; } = string.Empty;

        [Required(ErrorMessage = "El campo Documento es obligatorio")]
        public string Documento { get; set; } = string.Empty;

        public string Tipo { get; set; } = "visitante";

        // Fecha en que fue creado el registro
        public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
    }
}
