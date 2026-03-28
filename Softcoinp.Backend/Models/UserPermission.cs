using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Softcoinp.Backend.Models
{
    public class UserPermission
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        [Required]
        public string ViewKey { get; set; } = string.Empty;

        [JsonIgnore]
        public User? User { get; set; }
    }
}
