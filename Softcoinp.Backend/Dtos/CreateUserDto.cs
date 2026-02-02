using System;
using System.ComponentModel.DataAnnotations;

namespace Softcoinp.Backend.Dtos
{
    public class CreateUserDto
    {
        [Required(ErrorMessage = "El email es obligatorio")]
        [EmailAddress(ErrorMessage = "El email no es válido")]
        public string Email { get; set; } = string.Empty;

        public string Nombre { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contraseña es obligatoria")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
        public string Password { get; set; } = string.Empty;

        public string? Role { get; set; }  // por defecto se asigna "user"
    }
}
