namespace Softcoinp.Backend.Dtos
{
    public class AuthMeDto
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
