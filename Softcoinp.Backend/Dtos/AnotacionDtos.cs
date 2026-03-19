using System;
using System.ComponentModel.DataAnnotations;

namespace Softcoinp.Backend.Dtos
{
    public class CreateAnotacionDto
    {
        public Guid? PersonalId { get; set; }
        public Guid? VehiculoId { get; set; }

        [Required(ErrorMessage = "El texto de la anotación es obligatorio.")]
        public string Texto { get; set; } = string.Empty;
    }

    public class AnotacionDto
    {
        public Guid Id { get; set; }
        public Guid? PersonalId { get; set; }
        public string? PersonalNombre { get; set; }
        public string? PersonalApellido { get; set; }
        public string? PersonalDocumento { get; set; }
        public string? PersonalFotoUrl { get; set; }
        
        public Guid? VehiculoId { get; set; }
        public string? VehiculoPlaca { get; set; }
        public string? VehiculoFotoUrl { get; set; }
        
        public string Texto { get; set; } = string.Empty;
        public DateTime FechaCreacionUtc { get; set; }
        public Guid RegistradoPor { get; set; }
        public string? RegistradoPorEmail { get; set; }
    }

    public class UpdateAnotacionDto
    {
        [Required(ErrorMessage = "El texto de la anotación es obligatorio.")]
        public string Texto { get; set; } = string.Empty;
    }
}
