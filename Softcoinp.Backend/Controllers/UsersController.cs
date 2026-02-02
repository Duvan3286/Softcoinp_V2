using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Softcoinp.Backend.Models;
using Softcoinp.Backend.Dtos;
using Softcoinp.Backend.Services;
using Softcoinp.Backend.Helpers;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // todos los endpoints requieren token por defecto
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IAuditService _audit;

        public UsersController(AppDbContext db, IAuditService audit)
        {
            _db = db;
            _audit = audit;
        }

        // POST: api/users
        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Create([FromBody] CreateUserDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<UserDto>.Fail(null, "Error de validación", ModelState));

            if (_db.Users.Any(u => u.Email == request.Email))
                return BadRequest(ApiResponse<UserDto>.Fail(null, "Ya existe un usuario con ese email."));

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                Nombre = request.Nombre,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = request.Role ?? "user",
                CreatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            try
            {
                await _audit.LogAsync("UserCreated", "User", user.Id, new { user.Email, user.Role });
            }
            catch { }

            var dto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Nombre = user.Nombre,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };

            return Ok(ApiResponse<UserDto>.SuccessResponse(dto, "Usuario creado correctamente"));
        }

        // GET: api/users
        [HttpGet]
        public IActionResult GetAll()
        {
            var users = _db.Users
                .OrderBy(u => u.Email)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    Nombre = u.Nombre,
                    Role = u.Role,
                    CreatedAt = u.CreatedAt
                })
                .ToList();

            return Ok(ApiResponse<List<UserDto>>.SuccessResponse(users));
        }

        // GET: api/users/{id}
        [HttpGet("{id}")]
        public IActionResult GetById(Guid id)
        {
            var user = _db.Users
                .Where(u => u.Id == id)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    Nombre = u.Nombre,
                    Role = u.Role,
                    CreatedAt = u.CreatedAt
                })
                .FirstOrDefault();

            if (user == null)
                return NotFound(ApiResponse<UserDto>.Fail(null, "Usuario no encontrado"));

            return Ok(ApiResponse<UserDto>.SuccessResponse(user));
        }

        // PATCH: api/users/{id}
        [HttpPatch("{id}")]
        [Authorize(Roles = "admin")] 
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<UserDto>.Fail(null, "Error de validación", ModelState));

            var user = _db.Users.Find(id);
            if (user == null)
                return NotFound(ApiResponse<UserDto>.Fail(null, "Usuario no encontrado"));

            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                if (_db.Users.Any(u => u.Email == request.Email && u.Id != id))
                    return BadRequest(ApiResponse<UserDto>.Fail(null, "Ya existe otro usuario con ese email."));

                user.Email = request.Email;
            }

            if (!string.IsNullOrWhiteSpace(request.Nombre))
                user.Nombre = request.Nombre;

            if (!string.IsNullOrWhiteSpace(request.Password))
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            if (!string.IsNullOrWhiteSpace(request.Role))
                user.Role = request.Role;

            await _db.SaveChangesAsync();

            try
            {
                await _audit.LogAsync("UserUpdated", "User", user.Id, request);
            }
            catch { }

            var dto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Nombre = user.Nombre,
                Role = user.Role,
                CreatedAt = user.CreatedAt
            };

            return Ok(ApiResponse<UserDto>.SuccessResponse(dto, "Usuario actualizado correctamente"));
        }

        // PUT: api/users/change-password
        [HttpPut("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<UserDto>.Fail(null, "Error de validación", ModelState));

            var userIdClaim = User.FindFirst("id")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(ApiResponse<UserDto>.Fail(null, "Token inválido"));

            var user = _db.Users.Find(userId);
            if (user == null)
                return NotFound(ApiResponse<UserDto>.Fail(null, "Usuario no encontrado"));

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                return BadRequest(ApiResponse<UserDto>.Fail(null, "La contraseña actual es incorrecta"));

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _db.SaveChangesAsync();

            try
            {
                await _audit.LogAsync("PasswordChanged", "User", user.Id, new { user.Email });
            }
            catch { }

            return Ok(ApiResponse<UserDto>.SuccessResponse(null!, "Contraseña actualizada correctamente"));
        }

        // DELETE: api/users/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var user = _db.Users.Find(id);
            if (user == null)
                return NotFound(ApiResponse<UserDto>.Fail(null, "Usuario no encontrado"));

            _db.Users.Remove(user);
            await _db.SaveChangesAsync();

            try
            {
                await _audit.LogAsync("UserDeleted", "User", id, new { user.Email });
            }
            catch { }

            return Ok(ApiResponse<UserDto>.SuccessResponse(null!, "Usuario eliminado correctamente"));
        }

        // POST: api/users/{id}/reset-password
        [HttpPost("{id}/reset-password")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordRequest request)
        {
            var user = _db.Users.Find(id);
            if (user == null)
                return NotFound(ApiResponse<UserDto>.Fail(null, "Usuario no encontrado"));

            var newPassword = string.IsNullOrWhiteSpace(request.NewPassword)
                ? Guid.NewGuid().ToString("N").Substring(0, 8)
                : request.NewPassword;

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _db.SaveChangesAsync();

            try
            {
                await _audit.LogAsync("UserPasswordReset", "User", id, new { user.Email });
            }
            catch { }

            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                message = "Contraseña reseteada correctamente",
                temporaryPassword = string.IsNullOrWhiteSpace(request.NewPassword) ? newPassword : null
            }));
        }
    }
}
