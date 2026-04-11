using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Softcoinp.Backend.Models;
using Softcoinp.Backend.Dtos;
using System.Security.Claims;

namespace Softcoinp.Backend.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class RecibosPublicosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RecibosPublicosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("activos")]
        public async Task<ActionResult<IEnumerable<ReciboPublicoDto>>> GetActivos()
        {
            var recibos = await _context.RecibosPublicos
                .Where(r => r.Activo)
                .OrderByDescending(r => r.FechaCreacionUtc)
                .Select(r => new ReciboPublicoDto
                {
                    Id = r.Id,
                    Servicio = r.Servicio,
                    Mes = r.Mes,
                    Anio = r.Anio,
                    TotalRecibidos = r.TotalRecibidos,
                    TotalEntregados = r.TotalEntregados,
                    Pendientes = r.TotalRecibidos - r.TotalEntregados,
                    FechaCreacionUtc = r.FechaCreacionUtc,
                    Activo = r.Activo
                })
                .ToListAsync();

            return Ok(recibos);
        }

        [HttpPost]
        public async Task<ActionResult<ReciboPublicoDto>> Create(CreateReciboPublicoDto dto)
        {
            // Verificar duplicados para el mismo servicio, mes y año
            var existe = await _context.RecibosPublicos
                .AnyAsync(r => r.Servicio == dto.Servicio && r.Mes == dto.Mes && r.Anio == dto.Anio);

            if (existe)
            {
                return Conflict($"Ya existe un lote de recibos para {dto.Servicio} en el mes de {dto.Mes} de {dto.Anio}.");
            }

            var recibo = new ReciboPublico
            {
                Servicio = dto.Servicio,
                Mes = dto.Mes,
                TotalRecibidos = dto.TotalRecibidos,
                Anio = dto.Anio,
                Activo = true
            };

            _context.RecibosPublicos.Add(recibo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetActivos), new { id = recibo.Id }, new ReciboPublicoDto
            {
                Id = recibo.Id,
                Servicio = recibo.Servicio,
                Mes = recibo.Mes,
                Anio = recibo.Anio,
                TotalRecibidos = recibo.TotalRecibidos,
                TotalEntregados = recibo.TotalEntregados,
                Pendientes = recibo.TotalRecibidos,
                FechaCreacionUtc = recibo.FechaCreacionUtc,
                Activo = recibo.Activo
            });
        }

        [HttpPost("{id}/entregar")]
        public async Task<ActionResult> Entregar(Guid id, RegisterEntregaReciboDto dto)
        {
            var recibo = await _context.RecibosPublicos.FindAsync(id);
            if (recibo == null || !recibo.Activo)
                return NotFound("Lote de recibos no encontrado o inactivo.");

            if (recibo.TotalEntregados >= recibo.TotalRecibidos)
                return BadRequest("Ya se han entregado todos los recibos de este lote.");

            var nombreUsuario = User.FindFirst("nombre")?.Value ?? User.FindFirst(ClaimTypes.Name)?.Value ?? "Desconocido";

            var entrega = new EntregaRecibo
            {
                ReciboPublicoId = id,
                ResidenteNombre = dto.ResidenteNombre,
                Apartamento = dto.Apartamento,
                RegistradoPor = nombreUsuario,
                FechaEntregaUtc = DateTime.UtcNow
            };

            recibo.TotalEntregados++;

            // Si se completaron todos, archivar automáticamente
            if (recibo.TotalEntregados >= recibo.TotalRecibidos)
            {
                recibo.Activo = false;
            }

            _context.EntregasRecibos.Add(entrega);
            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "Entrega registrada con éxito", 
                pendientes = recibo.TotalRecibidos - recibo.TotalEntregados,
                completado = !recibo.Activo
            });
        }

        [HttpGet("historial")]
        public async Task<ActionResult<IEnumerable<ReciboPublicoDto>>> GetHistorial(string? servicio = null, string? mes = null, int? anio = null)
        {
            var query = _context.RecibosPublicos.Where(r => !r.Activo);

            if (!string.IsNullOrEmpty(servicio))
                query = query.Where(r => r.Servicio.Contains(servicio));

            if (!string.IsNullOrEmpty(mes))
                query = query.Where(r => r.Mes == mes);

            if (anio.HasValue)
                query = query.Where(r => r.Anio == anio.Value);

            var recibos = await query
                .OrderByDescending(r => r.FechaCreacionUtc)
                .Take(50)
                .Select(r => new ReciboPublicoDto
                {
                    Id = r.Id,
                    Servicio = r.Servicio,
                    Mes = r.Mes,
                    Anio = r.Anio,
                    TotalRecibidos = r.TotalRecibidos,
                    TotalEntregados = r.TotalEntregados,
                    Pendientes = 0,
                    FechaCreacionUtc = r.FechaCreacionUtc,
                    Activo = r.Activo
                })
                .ToListAsync();

            return Ok(recibos);
        }

        [HttpGet("{id}/entregas")]
        public async Task<ActionResult> GetEntregasPorLote(Guid id)
        {
            var entregas = await _context.EntregasRecibos
                .Where(e => e.ReciboPublicoId == id)
                .OrderByDescending(e => e.FechaEntregaUtc)
                .Select(e => new {
                    e.Id,
                    e.ResidenteNombre,
                    e.Apartamento,
                    e.FechaEntregaUtc,
                    e.RegistradoPor
                })
                .ToListAsync();

            return Ok(entregas);
        }
    }
}
