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
                .Select(a => new AnotacionDto
                {
                    Id = a.Id,
                    PersonalId = a.PersonalId,
                    PersonalNombre = a.Personal != null ? a.Personal.Nombre : null,
                    PersonalApellido = a.Personal != null ? a.Personal.Apellido : null,
                    PersonalDocumento = a.Personal != null ? a.Personal.Documento : null,
                    PersonalFotoUrl = a.Personal != null ? a.Personal.FotoUrl : null,
                    VehiculoId = a.VehiculoId,
                    VehiculoPlaca = a.Vehiculo != null ? a.Vehiculo.Placa : null,
                    VehiculoFotoUrl = a.Vehiculo != null ? a.Vehiculo.FotoUrl : null,
                    Texto = a.Texto,
                    FechaCreacionUtc = a.FechaCreacionUtc,
                    RegistradoPor = a.RegistradoPor,
                    RegistradoPorEmail = _db.Users.Where(u => u.Id == a.RegistradoPor).Select(u => u.Email).FirstOrDefault(),
                    PersonalIsBloqueado = a.Personal != null ? a.Personal.IsBloqueado : null,
                    VehiculoIsBloqueado = a.Vehiculo != null ? a.Vehiculo.IsBloqueado : null
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

            if (!input.PersonalId.HasValue && !input.VehiculoId.HasValue)
                return BadRequest(ApiResponse<AnotacionDto>.Fail(null, "Debe proporcionar un ID de Personal o un ID de Vehículo."));

            if (input.PersonalId.HasValue)
            {
                var personalExists = await _db.Personal.AnyAsync(p => p.Id == input.PersonalId);
                if (!personalExists)
                    return NotFound(ApiResponse<AnotacionDto>.Fail(null, "Persona no encontrada en el sistema."));
            }

            if (input.VehiculoId.HasValue)
            {
                var vehiculoExists = await _db.Vehiculos.AnyAsync(v => v.Id == input.VehiculoId);
                if (!vehiculoExists)
                    return NotFound(ApiResponse<AnotacionDto>.Fail(null, "Vehículo no encontrado en el sistema."));
            }

            var userIdClaim = User.FindFirst("id")?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(ApiResponse<AnotacionDto>.Fail(null, "No se pudo identificar al usuario actual."));

            var anotacion = new Anotacion
            {
                Id = Guid.NewGuid(),
                PersonalId = input.PersonalId,
                VehiculoId = input.VehiculoId,
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
                    anotacion.VehiculoId,
                    anotacion.RegistradoPor
                });
            }
            catch { }

            var dto = new AnotacionDto
            {
                Id = anotacion.Id,
                PersonalId = anotacion.PersonalId,
                VehiculoId = anotacion.VehiculoId,
                Texto = anotacion.Texto,
                FechaCreacionUtc = anotacion.FechaCreacionUtc,
                RegistradoPor = anotacion.RegistradoPor
            };

            return Ok(ApiResponse<AnotacionDto>.SuccessResponse(dto, "Anotación guardada correctamente"));
        }

        // GET: api/anotaciones/vehiculo/{vehiculoId}
        [HttpGet("vehiculo/{vehiculoId}")]
        public async Task<IActionResult> GetAnotacionesByVehiculo(Guid vehiculoId)
        {
            var anotaciones = await _db.Anotaciones
                .Where(a => a.VehiculoId == vehiculoId)
                .OrderByDescending(a => a.FechaCreacionUtc)
                .Select(a => new AnotacionDto
                {
                    Id = a.Id,
                    VehiculoId = a.VehiculoId,
                    VehiculoPlaca = a.Vehiculo != null ? a.Vehiculo.Placa : null,
                    VehiculoFotoUrl = a.Vehiculo != null ? a.Vehiculo.FotoUrl : null,
                    Texto = a.Texto,
                    FechaCreacionUtc = a.FechaCreacionUtc,
                    RegistradoPor = a.RegistradoPor,
                    RegistradoPorEmail = _db.Users.Where(u => u.Id == a.RegistradoPor).Select(u => u.Email).FirstOrDefault(),
                    PersonalIsBloqueado = a.Personal != null ? a.Personal.IsBloqueado : null,
                    VehiculoIsBloqueado = a.Vehiculo != null ? a.Vehiculo.IsBloqueado : null
                })
                .ToListAsync();

            return Ok(ApiResponse<List<AnotacionDto>>.SuccessResponse(anotaciones));
        }

        // GET: api/anotaciones/personal/{personalId}
        [HttpGet("personal/{personalId}")]
        public async Task<IActionResult> GetAnotacionesByPersonal(Guid personalId)
        {
            var anotaciones = await _db.Anotaciones
                .Where(a => a.PersonalId == personalId && a.VehiculoId == null)
                .OrderByDescending(a => a.FechaCreacionUtc)
                .Select(a => new AnotacionDto
                {
                    Id = a.Id,
                    PersonalId = a.PersonalId,
                    PersonalNombre = a.Personal != null ? a.Personal.Nombre : null,
                    PersonalApellido = a.Personal != null ? a.Personal.Apellido : null,
                    PersonalDocumento = a.Personal != null ? a.Personal.Documento : null,
                    PersonalFotoUrl = a.Personal != null ? a.Personal.FotoUrl : null,
                    VehiculoFotoUrl = a.Vehiculo != null ? a.Vehiculo.FotoUrl : null,
                    Texto = a.Texto,
                    FechaCreacionUtc = a.FechaCreacionUtc,
                    RegistradoPor = a.RegistradoPor,
                    RegistradoPorEmail = _db.Users.Where(u => u.Id == a.RegistradoPor).Select(u => u.Email).FirstOrDefault(),
                    PersonalIsBloqueado = a.Personal != null ? a.Personal.IsBloqueado : null,
                    VehiculoIsBloqueado = a.Vehiculo != null ? a.Vehiculo.IsBloqueado : null
                })
                .ToListAsync();

            return Ok(ApiResponse<List<AnotacionDto>>.SuccessResponse(anotaciones));
        }

        // PATCH: api/anotaciones/{id}
        [HttpPatch("{id}")]
        [Authorize(Roles = "admin,superadmin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAnotacionDto input)
        {
            if (string.IsNullOrWhiteSpace(input.Texto))
                return BadRequest(ApiResponse<AnotacionDto>.Fail(null, "El texto no puede estar vacío."));

            var anotacion = await _db.Anotaciones.FindAsync(id);
            if (anotacion == null)
                return NotFound(ApiResponse<AnotacionDto>.Fail(null, "Anotación no encontrada."));

            anotacion.Texto = input.Texto;
            await _db.SaveChangesAsync();

            try { await _audit.LogAsync("AnotacionUpdated", "Anotacion", id, new { anotacion.PersonalId, anotacion.VehiculoId }); } catch { }

            var dto = new AnotacionDto
            {
                Id = anotacion.Id,
                PersonalId = anotacion.PersonalId,
                VehiculoId = anotacion.VehiculoId,
                Texto = anotacion.Texto,
                FechaCreacionUtc = anotacion.FechaCreacionUtc,
                RegistradoPor = anotacion.RegistradoPor
            };

            return Ok(ApiResponse<AnotacionDto>.SuccessResponse(dto, "Anotación actualizada correctamente."));
        }

        // DELETE: api/anotaciones/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin,superadmin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var anotacion = await _db.Anotaciones.FindAsync(id);
            if (anotacion == null)
                return NotFound(ApiResponse<AnotacionDto>.Fail(null, "Anotación no encontrada."));

            _db.Anotaciones.Remove(anotacion);
            await _db.SaveChangesAsync();

            try { await _audit.LogAsync("AnotacionDeleted", "Anotacion", id, new { anotacion.PersonalId, anotacion.VehiculoId }); } catch { }

            return Ok(ApiResponse<object>.SuccessResponse(null!, "Anotación eliminada correctamente."));
        }
    }
}
