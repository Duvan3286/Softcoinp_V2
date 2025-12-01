using System.ComponentModel.DataAnnotations;

namespace Softcoinp.Backend.Dtos
{
  public class UpdateRegistroDto
    {
        // Todos los campos son opcionales para permitir actualizaciones parciales
        public string? Nombre { get; set; }
        public string? Apellido { get; set; }
        public string? Documento { get; set; }
        public string? Destino { get; set; }
        public string? Motivo { get; set; }
        public string? Tipo { get; set; }
    }
}
