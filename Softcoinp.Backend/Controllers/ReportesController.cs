using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Softcoinp.Backend.Dtos;
using Softcoinp.Backend.Helpers;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public ReportesController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
        {
            DateTime fechaInicio;
            DateTime fechaFin;

            if (desde.HasValue && hasta.HasValue)
            {
                fechaInicio = desde.Value.Date;
                fechaFin = hasta.Value.Date.AddDays(1).AddTicks(-1);
            }
            else if (desde.HasValue && !hasta.HasValue)
            {
                fechaInicio = desde.Value.Date;
                fechaFin = DateTime.UtcNow.Date.AddDays(1).AddTicks(-1);
            }
            else if (!desde.HasValue && hasta.HasValue)
            {
                fechaFin = hasta.Value.Date.AddDays(1).AddTicks(-1);
                fechaInicio = fechaFin.Date.AddDays(-7);
            }
            else
            {
                fechaFin = DateTime.UtcNow.Date.AddDays(1).AddTicks(-1);
                fechaInicio = fechaFin.Date.AddDays(-7);
            }

            var totalPersonas = await _db.Personal.CountAsync();
            var totalVehiculos = await _db.Vehiculos.CountAsync();
            
            var recibosPendientes = await _db.RecibosPublicos
                .Where(r => r.Activo)
                .SumAsync(r => r.TotalRecibidos - r.TotalEntregados);
            
            var registrosRango = await _db.Registros
                .Where(r => r.HoraIngresoUtc >= fechaInicio && r.HoraIngresoUtc <= fechaFin)
                .ToListAsync();
                
            var anotacionesRango = await _db.Anotaciones
                .Where(a => a.FechaCreacionUtc >= fechaInicio && a.FechaCreacionUtc <= fechaFin)
                .ToListAsync();

            var ingresosRango = registrosRango.Count;
            var novedadesPersonas = anotacionesRango.Count(a => a.PersonalId != null && a.VehiculoId == null);
            var novedadesVehiculos = anotacionesRango.Count(a => a.VehiculoId != null);

            // Top 5 Destinos más visitados
            var registrosPorDestino = registrosRango
                .GroupBy(r => string.IsNullOrWhiteSpace(r.Destino) ? "Sin Destino" : r.Destino)
                .Select(g => new ChartItemDto { Name = g.Key, Value = g.Count() })
                .OrderByDescending(c => c.Value)
                .Take(5)
                .ToList();

            // Ingresos por Tipo (Visitante vs Empleado)
            var registrosPorTipo = registrosRango
                .GroupBy(r => string.IsNullOrWhiteSpace(r.Tipo) ? "Otro" : r.Tipo)
                .Select(g => new ChartItemDto { Name = g.Key, Value = g.Count() })
                .OrderByDescending(c => c.Value)
                .ToList();

            var proporcionNovedades = new List<ChartItemDto>
            {
                new ChartItemDto { Name = "Personas", Value = novedadesPersonas },
                new ChartItemDto { Name = "Vehículos", Value = novedadesVehiculos }
            };

            var stats = new DashboardStatsDto
            {
                TotalPersonas = totalPersonas,
                TotalVehiculos = totalVehiculos,
                IngresosRango = ingresosRango,
                NovedadesPersonas = novedadesPersonas,
                NovedadesVehiculos = novedadesVehiculos,
                RecibosPendientes = recibosPendientes,
                ProporcionNovedades = proporcionNovedades,
                RegistrosPorDestino = registrosPorDestino,
                RegistrosPorTipo = registrosPorTipo
            };

            return Ok(ApiResponse<DashboardStatsDto>.SuccessResponse(stats));
        }
    }
}
