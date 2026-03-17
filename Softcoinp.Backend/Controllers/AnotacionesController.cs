using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Softcoinp.Backend.Dtos;
using Softcoinp.Backend.Helpers;
using Softcoinp.Backend.Models;
using Softcoinp.Backend.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Todos los endpoints requieren autenticación
    public class AnotacionesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IAuditService _audit;

        public AnotacionesController(AppDbContext db, IAuditService audit)
        {
            _db = db;
            _audit = audit;
        }

        // GET: api/anotaciones
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var anotaciones = await _db.Anotaciones
                .OrderByDescending(a => a.FechaCreacionUtc)
                .Join(_db.Users,
                      a => a.RegistradoPor,
                      u => u.Id,
                      (a, u) => new AnotacionDto
                      {
                          Id = a.Id,
                          PersonalId = a.PersonalId,
                          PersonalNombre = a.Personal!.Nombre,
                          PersonalApellido = a.Personal!.Apellido,
                          Texto = a.Texto,
                          FechaCreacionUtc = a.FechaCreacionUtc,
                          RegistradoPor = a.RegistradoPor,
                          RegistradoPorEmail = u.Email
                      })
                .ToListAsync();

            return Ok(ApiResponse<List<AnotacionDto>>.SuccessResponse(anotaciones));
        }

        // POST: api/anotaciones
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAnotacionDto input)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<AnotacionDto>.Fail(null, "Error de validación", ModelState));

            var personalExists = await _db.Personal.AnyAsync(p => p.Id == input.PersonalId);
            if (!personalExists)
                return NotFound(ApiResponse<AnotacionDto>.Fail(null, "Persona no encontrada en el sistema."));

            var userIdClaim = User.FindFirst("id")?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(ApiResponse<AnotacionDto>.Fail(null, "No se pudo identificar al usuario actual."));

            var anotacion = new Anotacion
            {
                Id = Guid.NewGuid(),
                PersonalId = input.PersonalId,
                Texto = input.Texto,
                FechaCreacionUtc = DateTime.UtcNow,
                RegistradoPor = userId
            };

            _db.Anotaciones.Add(anotacion);
            await _db.SaveChangesAsync();

            try
            {
                await _audit.LogAsync("AnotacionCreated", "Anotacion", anotacion.Id, new
                {
                    anotacion.PersonalId,
                    anotacion.RegistradoPor
                });
            }
            catch { }

            var dto = new AnotacionDto
            {
                Id = anotacion.Id,
                PersonalId = anotacion.PersonalId,
                Texto = anotacion.Texto,
                FechaCreacionUtc = anotacion.FechaCreacionUtc,
                RegistradoPor = anotacion.RegistradoPor
            };

            return CreatedAtAction(nameof(GetAnotacionesByPersonal), new { personalId = anotacion.PersonalId }, 
                ApiResponse<AnotacionDto>.SuccessResponse(dto, "Anotación guardada correctamente"));
        }

        // GET: api/anotaciones/personal/{personalId}
        [HttpGet("personal/{personalId}")]
        public async Task<IActionResult> GetAnotacionesByPersonal(Guid personalId)
        {
            var anotaciones = await _db.Anotaciones
                .Where(a => a.PersonalId == personalId)
                .OrderByDescending(a => a.FechaCreacionUtc)
                .Join(_db.Users, 
                      a => a.RegistradoPor, 
                      u => u.Id, 
                      (a, u) => new AnotacionDto
                      {
                          Id = a.Id,
                          PersonalId = a.PersonalId,
                          PersonalNombre = a.Personal!.Nombre,       // Entity Framework maneja los includes implícitos para selecciones simples si la relación existe
                          PersonalApellido = a.Personal!.Apellido,
                          Texto = a.Texto,
                          FechaCreacionUtc = a.FechaCreacionUtc,
                          RegistradoPor = a.RegistradoPor,
                          RegistradoPorEmail = u.Email               // Sacamos el email del usuario que guardó el reporte
                      })
                .ToListAsync();

            return Ok(ApiResponse<List<AnotacionDto>>.SuccessResponse(anotaciones));
        }

        // PATCH: api/anotaciones/{id}
        [HttpPatch("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAnotacionDto input)
        {
            if (string.IsNullOrWhiteSpace(input.Texto))
                return BadRequest(ApiResponse<AnotacionDto>.Fail(null, "El texto no puede estar vacío."));

            var anotacion = await _db.Anotaciones.FindAsync(id);
            if (anotacion == null)
                return NotFound(ApiResponse<AnotacionDto>.Fail(null, "Anotación no encontrada."));

            anotacion.Texto = input.Texto;
            await _db.SaveChangesAsync();

            try { await _audit.LogAsync("AnotacionUpdated", "Anotacion", id, new { anotacion.PersonalId }); } catch { }

            var dto = new AnotacionDto
            {
                Id = anotacion.Id,
                PersonalId = anotacion.PersonalId,
                Texto = anotacion.Texto,
                FechaCreacionUtc = anotacion.FechaCreacionUtc,
                RegistradoPor = anotacion.RegistradoPor
            };

            return Ok(ApiResponse<AnotacionDto>.SuccessResponse(dto, "Anotación actualizada correctamente."));
        }

        // DELETE: api/anotaciones/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var anotacion = await _db.Anotaciones.FindAsync(id);
            if (anotacion == null)
                return NotFound(ApiResponse<AnotacionDto>.Fail(null, "Anotación no encontrada."));

            _db.Anotaciones.Remove(anotacion);
            await _db.SaveChangesAsync();

            try { await _audit.LogAsync("AnotacionDeleted", "Anotacion", id, new { anotacion.PersonalId }); } catch { }

            return Ok(ApiResponse<object>.SuccessResponse(null!, "Anotación eliminada correctamente."));
        }
    }
}
