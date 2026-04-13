using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Softcoinp.Backend.Dtos;
using Softcoinp.Backend.Helpers;
using Softcoinp.Backend.Models;
using Softcoinp.Backend.Services;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PersonalController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IAuditService _audit;

        public PersonalController(AppDbContext db, IAuditService audit)
        {
            _db = db;
            _audit = audit;
        }

        // GET: api/personal
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var personas = await _db.Personal
                .Include(p => p.Registros)
                .OrderByDescending(p => p.FechaCreacionUtc)
                .Select(p => new
                {
                    p.Id,
                    p.Nombre,
                    p.Apellido,
                    p.Documento,
                    p.Tipo,
                    p.Telefono,
                    p.Email,
                    p.FechaCreacionUtc,
                    p.IsBloqueado,
                    TieneEntradaActiva = p.Registros.Any(r => r.HoraSalidaUtc == null),
                    FotoUrl = p.FotoUrl ?? p.Registros.Where(r => r.FotoUrl != null).OrderByDescending(r => r.HoraIngresoUtc).Select(r => r.FotoUrl).FirstOrDefault()
                })
                .ToListAsync();

            return Ok(ApiResponse<object>.SuccessResponse(personas));
        }

        // POST: api/personal/{id}/bloquear
        [HttpPost("{id}/bloquear")]
        public async Task<IActionResult> Bloquear(Guid id, [FromBody] MotivoBloqueoDto input)
        {
            var persona = await _db.Personal.FindAsync(id);
            if (persona == null)
                return NotFound(ApiResponse<object>.Fail(null, "Persona no encontrada."));

            if (persona.IsBloqueado)
                return BadRequest(ApiResponse<object>.Fail(null, "Esta persona ya se encuentra bloqueada."));

            if (string.IsNullOrWhiteSpace(input.Motivo))
                return BadRequest(ApiResponse<object>.Fail(null, "El motivo del bloqueo es obligatorio."));

            var userIdClaim = User.FindFirst("id")?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(ApiResponse<object>.Fail(null, "No se pudo identificar al usuario actual."));

            // 1. Marcar como bloqueada
            persona.IsBloqueado = true;
            persona.MotivoBloqueo = input.Motivo;
            persona.FechaBloqueoUtc = DateTime.UtcNow;

            // 2. Crear Anotación automática para historial
            var anotacion = new Anotacion
            {
                Id = Guid.NewGuid(),
                PersonalId = persona.Id,
                Texto = $"🚫 BLOQUEO DE SEGURIDAD: {input.Motivo}",
                FechaCreacionUtc = DateTime.UtcNow,
                RegistradoPor = userId
            };
            _db.Anotaciones.Add(anotacion);

            await _db.SaveChangesAsync();

            try { await _audit.LogAsync("PersonalBloqueado", "Personal", persona.Id, new { Motivo = input.Motivo, Documento = persona.Documento }); } catch { }

            return Ok(ApiResponse<object>.SuccessResponse(null, "Persona bloqueada correctamente."));
        }

        // POST: api/personal/{id}/desbloquear
        [HttpPost("{id}/desbloquear")]
        public async Task<IActionResult> Desbloquear(Guid id, [FromBody] MotivoBloqueoDto input)
        {
            var persona = await _db.Personal.FindAsync(id);
            if (persona == null)
                return NotFound(ApiResponse<object>.Fail(null, "Persona no encontrada."));

            if (!persona.IsBloqueado)
                return BadRequest(ApiResponse<object>.Fail(null, "Esta persona no se encuentra bloqueada."));

            if (string.IsNullOrWhiteSpace(input.Motivo))
                return BadRequest(ApiResponse<object>.Fail(null, "El motivo del desbloqueo es obligatorio."));

            var userIdClaim = User.FindFirst("id")?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(ApiResponse<object>.Fail(null, "No se pudo identificar al usuario actual."));

            // 1. Quitar bloqueo
            persona.IsBloqueado = false;
            persona.MotivoBloqueo = null;
            persona.FechaBloqueoUtc = null;

            // 2. Crear Anotación automática para historial
            var anotacion = new Anotacion
            {
                Id = Guid.NewGuid(),
                PersonalId = persona.Id,
                Texto = $"🔓 DESBLOQUEO DE SEGURIDAD: {input.Motivo}",
                FechaCreacionUtc = DateTime.UtcNow,
                RegistradoPor = userId
            };
            _db.Anotaciones.Add(anotacion);

            await _db.SaveChangesAsync();

            try { await _audit.LogAsync("PersonalDesbloqueado", "Personal", persona.Id, new { Motivo = input.Motivo, Documento = persona.Documento }); } catch { }

            return Ok(ApiResponse<object>.SuccessResponse(null, "Persona desbloqueada correctamente."));
        }
    }

    public class MotivoBloqueoDto
    {
        public string Motivo { get; set; } = string.Empty;
    }
}
