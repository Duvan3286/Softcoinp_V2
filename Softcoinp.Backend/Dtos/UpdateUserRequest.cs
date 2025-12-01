using System.ComponentModel.DataAnnotations;

namespace Softcoinp.Backend.Dtos
{
    public class UpdateUserRequest
    {
        [EmailAddress(ErrorMessage = "El correo no es válido")]
        public string? Email { get; set; }  // opcional

        [StringLength(20, ErrorMessage = "El rol no puede tener más de 20 caracteres")]
        public string? Role { get; set; }   // opcional
    }
}
