using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using Softcoinp.Backend;
using Softcoinp.Backend.Models;
using Softcoinp.Backend.Dtos;
using Softcoinp.Backend.Helpers;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;


namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<LoginResponseDto>.Fail(null, "Error de validación", ModelState));

            var user = _db.Users.SingleOrDefault(u => u.Email == request.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized(ApiResponse<LoginResponseDto>.Fail(null, "Credenciales inválidas"));
            }

            var (token, expiration) = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7); // 7 días válido
            _db.SaveChanges();

            var response = new LoginResponseDto
            {
                Token = token,
                Expiration = expiration,
                RefreshToken = refreshToken,
                RefreshTokenExpiry = user.RefreshTokenExpiry,
                Email = user.Email,
                Role = user.Role
            };

            return Ok(ApiResponse<LoginResponseDto>.SuccessResponse(response, "Inicio de sesión exitoso"));
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Token inválido" });

            var user = _db.Users.Find(userId);
            if (user == null) return NotFound(new { message = "Usuario no encontrado" });

            user.RefreshToken = string.Empty;
            user.RefreshTokenExpiry = DateTime.MinValue;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Sesión cerrada correctamente" });
        }


        [HttpPost("refresh")]
        [AllowAnonymous]
        public IActionResult Refresh([FromBody] RefreshRequest request)
        {
            var user = _db.Users.SingleOrDefault(u => u.RefreshToken == request.RefreshToken);
            if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
            {
                return Unauthorized(ApiResponse<LoginResponseDto>.Fail(null, "Refresh token inválido o expirado"));
            }

            var (token, expiration) = GenerateJwtToken(user);
            var newRefreshToken = GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            _db.SaveChanges();

            var response = new LoginResponseDto
            {
                Token = token,
                Expiration = expiration,
                RefreshToken = newRefreshToken,
                RefreshTokenExpiry = user.RefreshTokenExpiry,
                Email = user.Email,
                Role = user.Role
            };

            return Ok(ApiResponse<LoginResponseDto>.SuccessResponse(response, "Token renovado exitosamente"));
        }

        [HttpGet("me")]
        [Authorize]
        public IActionResult Me()
        {
            var userIdClaim = User.FindFirst("id")?.Value;

            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(ApiResponse<AuthMeDto>.Fail(null, "Token inválido"));

            var user = _db.Users
                .Where(u => u.Id == userId)
                .Select(u => new AuthMeDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    Nombre = u.Nombre,
                    Role = u.Role
                })
                .FirstOrDefault();

            if (user == null)
                return Unauthorized(ApiResponse<AuthMeDto>.Fail(null, "Usuario no encontrado"));

            return Ok(ApiResponse<AuthMeDto>.SuccessResponse(user));
        }


        // Genera JWT normal
        private (string token, DateTime expiration) GenerateJwtToken(User user)
        {
            var jwtSettings = _config.GetSection("Jwt");

            var keyString = jwtSettings["Key"] 
                ?? throw new InvalidOperationException("JWT Key no está configurada en appsettings.json");

            var issuer = jwtSettings["Issuer"] 
                ?? throw new InvalidOperationException("JWT Issuer no está configurado en appsettings.json");

            var audience = jwtSettings["Audience"] 
                ?? throw new InvalidOperationException("JWT Audience no está configurado en appsettings.json");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Email),
                new Claim(ClaimTypes.Name, user.Nombre), 
                new Claim("nombre", user.Nombre), 
                new Claim("id", user.Id.ToString()),
                new Claim("role", user.Role)
            };

            var expiration = DateTime.UtcNow.AddHours(2);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expiration,
                signingCredentials: creds
            );

            return (new JwtSecurityTokenHandler().WriteToken(token), expiration);
        }

        // Genera refresh token aleatorio
        private string GenerateRefreshToken()
        {
            return Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
