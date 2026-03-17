using System;
using System.ComponentModel.DataAnnotations;

namespace Softcoinp.Backend.Models
{
    public class TipoPersonal
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Nombre { get; set; } = string.Empty;

        public bool Activo { get; set; } = true;
    }
}
