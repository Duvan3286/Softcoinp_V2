using System;
using System.ComponentModel.DataAnnotations;

namespace Softcoinp.Backend.Dtos
{
    public class TipoPersonalDto
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public bool Activo { get; set; }
    }

    public class CreateTipoPersonalDto
    {
        [Required(ErrorMessage = "El nombre del tipo es obligatorio.")]
        public string Nombre { get; set; } = string.Empty;
    }

    public class UpdateTipoPersonalDto
    {
        public string? Nombre { get; set; }
        public bool? Activo { get; set; }
    }
}
