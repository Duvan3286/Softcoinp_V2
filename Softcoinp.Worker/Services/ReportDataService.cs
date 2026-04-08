using Microsoft.EntityFrameworkCore;
using Softcoinp.Backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Softcoinp.Worker.Services
{
    public interface IReportDataService
    {
        Task<MonthlyAnalytics> GetMonthlyAnalyticsAsync(int month, int year);
    }

    public class MonthlyAnalytics
    {
        public int TotalPeatonal { get; set; }
        public int TotalVehicular { get; set; }
        public List<TopVisitor> Top10Visitantes { get; set; } = new();
        public List<BlockSummary> BloqueosConsolidado { get; set; } = new();
        public MessagingBalance BalanceMensajeria { get; set; } = new();
        public List<FlowPoint> TendenciaFlujo { get; set; } = new();
        public int Month { get; set; }
        public int Year { get; set; }
    }

    public class TopVisitor { public string Documento { get; set; } = ""; public string Nombre { get; set; } = ""; public int Visitas { get; set; } }
    public class BlockSummary { public string Motivo { get; set; } = ""; public int Cantidad { get; set; } }
    public class MessagingBalance { public int Recibidos { get; set; } public int Entregados { get; set; } public int Pendientes { get; set; } }
    public class FlowPoint { public DateTime Fecha { get; set; } public int Peatonal { get; set; } public int Vehicular { get; set; } }

    public class ReportDataService(Softcoinp.Backend.AppDbContext db) : IReportDataService
    {
        public async Task<MonthlyAnalytics> GetMonthlyAnalyticsAsync(int month, int year)
        {
            var startDate = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = startDate.AddMonths(1);

            var analytics = new MonthlyAnalytics { Month = month, Year = year };

            // 1. Conteo de Flujos
            analytics.TotalPeatonal = await db.Registros
                .CountAsync(r => r.HoraIngresoUtc >= startDate && r.HoraIngresoUtc < endDate);

            analytics.TotalVehicular = await db.RegistrosVehiculos
                .CountAsync(r => r.HoraIngresoUtc >= startDate && r.HoraIngresoUtc < endDate);

            // 2. Top 10 Visitantes
            analytics.Top10Visitantes = await db.Registros
                .Where(r => r.HoraIngresoUtc >= startDate && r.HoraIngresoUtc < endDate)
                .GroupBy(r => new { r.Documento, r.Nombre, r.Apellido })
                .Select(g => new TopVisitor
                {
                    Documento = g.Key.Documento,
                    Nombre = $"{g.Key.Nombre} {g.Key.Apellido}",
                    Visitas = g.Count()
                })
                .OrderByDescending(x => x.Visitas)
                .Take(10)
                .ToListAsync();

            // 3. Bloqueos Consolidados
            analytics.BloqueosConsolidado = await db.Personal
                .Where(p => p.IsBloqueado && p.FechaBloqueoUtc >= startDate && p.FechaBloqueoUtc < endDate)
                .GroupBy(p => p.MotivoBloqueo ?? "Otros")
                .Select(g => new BlockSummary { Motivo = g.Key, Cantidad = g.Count() })
                .ToListAsync();

            // 4. Balance Mensajería (Correspondencia)
            var correspondenciaMez = await db.Correspondencias
                .Where(c => c.FechaRecepcionUtc >= startDate && c.FechaRecepcionUtc < endDate)
                .ToListAsync();

            analytics.BalanceMensajeria = new MessagingBalance
            {
                Recibidos = correspondenciaMez.Count,
                Entregados = correspondenciaMez.Count(c => c.Estado == "entregado"),
                Pendientes = correspondenciaMez.Count(c => c.Estado == "en_espera")
            };

            // 5. Tendencia Diaria
            var peatonalTrend = await db.Registros
                .Where(r => r.HoraIngresoUtc >= startDate && r.HoraIngresoUtc < endDate)
                .GroupBy(r => r.HoraIngresoUtc.Date)
                .Select(g => new { Fecha = g.Key, Cantidad = g.Count() })
                .ToListAsync();

            var vehicularTrend = await db.RegistrosVehiculos
                .Where(r => r.HoraIngresoUtc >= startDate && r.HoraIngresoUtc < endDate)
                .GroupBy(r => r.HoraIngresoUtc.Date)
                .Select(g => new { Fecha = g.Key, Cantidad = g.Count() })
                .ToListAsync();

            var allDates = peatonalTrend.Select(p => p.Fecha).Union(vehicularTrend.Select(v => v.Fecha)).OrderBy(d => d);
            foreach (var date in allDates)
            {
                analytics.TendenciaFlujo.Add(new FlowPoint
                {
                    Fecha = date,
                    Peatonal = peatonalTrend.FirstOrDefault(p => p.Fecha == date)?.Cantidad ?? 0,
                    Vehicular = vehicularTrend.FirstOrDefault(v => v.Fecha == date)?.Cantidad ?? 0
                });
            }

            return analytics;
        }
    }
}
