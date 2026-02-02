using System.ComponentModel.DataAnnotations;

namespace Softcoinp.Backend.Dtos
{
    public class UpdateUserDto
    {
        [EmailAddress(ErrorMessage = "El email no es válido")]
        public string? Email { get; set; }
        public string? Nombre { get; set; }

        [StringLength(100, MinimumLength = 6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
        public string? Password { get; set; }

        [StringLength(20, ErrorMessage = "El rol no puede tener más de 20 caracteres")]
        public string? Role { get; set; }
    }
}
