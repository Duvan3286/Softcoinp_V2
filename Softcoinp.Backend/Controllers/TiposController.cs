using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Softcoinp.Backend.Dtos;
using Softcoinp.Backend.Helpers;
using Softcoinp.Backend.Models;
using Softcoinp.Backend.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TiposController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IAuditService _audit;

        public TiposController(AppDbContext db, IAuditService audit)
        {
            _db = db;
            _audit = audit;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tipos = await _db.TiposPersonal
                .OrderBy(t => t.Nombre)
                .Select(t => new TipoPersonalDto
                {
                    Id = t.Id,
                    Nombre = t.Nombre,
                    Activo = t.Activo
                })
                .ToListAsync();

            return Ok(ApiResponse<List<TipoPersonalDto>>.SuccessResponse(tipos));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTipoPersonalDto input)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<TipoPersonalDto>.Fail(null, "Error de validación", ModelState));

            var tipo = new TipoPersonal
            {
                Id = Guid.NewGuid(),
                Nombre = input.Nombre,
                Activo = true
            };

            _db.TiposPersonal.Add(tipo);
            await _db.SaveChangesAsync();

            try { await _audit.LogAsync("TipoPersonalCreated", "TipoPersonal", tipo.Id, new { tipo.Nombre }); } catch { }

            return CreatedAtAction(nameof(GetAll), null, ApiResponse<TipoPersonalDto>.SuccessResponse(new TipoPersonalDto
            {
                Id = tipo.Id,
                Nombre = tipo.Nombre,
                Activo = tipo.Activo
            }, "Tipo de personal creado correctamente"));
        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTipoPersonalDto input)
        {
            var tipo = await _db.TiposPersonal.FindAsync(id);
            if (tipo == null)
                return NotFound(ApiResponse<TipoPersonalDto>.Fail(null, "Tipo de personal no encontrado"));

            if (!string.IsNullOrEmpty(input.Nombre))
                tipo.Nombre = input.Nombre;

            if (input.Activo.HasValue)
                tipo.Activo = input.Activo.Value;

            await _db.SaveChangesAsync();

            try { await _audit.LogAsync("TipoPersonalUpdated", "TipoPersonal", id, new { tipo.Nombre, tipo.Activo }); } catch { }

            return Ok(ApiResponse<TipoPersonalDto>.SuccessResponse(new TipoPersonalDto
            {
                Id = tipo.Id,
                Nombre = tipo.Nombre,
                Activo = tipo.Activo
            }, "Tipo de personal actualizado"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var tipo = await _db.TiposPersonal.FindAsync(id);
            if (tipo == null)
                return NotFound(ApiResponse<object>.Fail(null, "Tipo de personal no encontrado"));

            // Verificar si hay personal usando este tipo antes de borrar (opcional, podrías solo desactivarlo)
            // Por simplicidad en este MVP, permitimos borrar si no hay integridad referencial dura aún.
            
            _db.TiposPersonal.Remove(tipo);
            await _db.SaveChangesAsync();

            try { await _audit.LogAsync("TipoPersonalDeleted", "TipoPersonal", id, new { tipo.Nombre }); } catch { }

            return Ok(ApiResponse<object>.SuccessResponse(null!, "Tipo de personal eliminado"));
        }
    }
}
