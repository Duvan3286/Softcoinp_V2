namespace Softcoinp.Backend.Dtos
{
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime Expiration { get; set; }
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime RefreshTokenExpiry { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "user";
    }
}
