using Microsoft.EntityFrameworkCore;
using Softcoinp.Backend;
using Softcoinp.Backend.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Softcoinp.Backend.Services.Reporting
{
    public interface IReportDataService
    {
        Task<MonthlyAnalytics> GetMonthlyAnalyticsAsync(int month, int year);
    }

    public class ReportDataService : IReportDataService
    {
        private readonly AppDbContext _db;

        public ReportDataService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<MonthlyAnalytics> GetMonthlyAnalyticsAsync(int month, int year)
        {
            var startDate = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = startDate.AddMonths(1);

            var analytics = new MonthlyAnalytics { Month = month, Year = year };

            analytics.TotalPeatonal = _db.Registros
                .Count(r => r.HoraIngresoUtc >= startDate && r.HoraIngresoUtc < endDate);

            analytics.TotalVehicular = _db.RegistrosVehiculos
                .Count(r => r.HoraIngresoUtc >= startDate && r.HoraIngresoUtc < endDate);

            var topVisitors = _db.Registros
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
                .ToList();

            analytics.Top10Visitantes = topVisitors;

            analytics.BloqueosConsolidado = _db.Personal
                .Where(p => p.IsBloqueado && p.FechaBloqueoUtc >= startDate && p.FechaBloqueoUtc < endDate)
                .GroupBy(p => p.MotivoBloqueo ?? "Otros")
                .Select(g => new BlockSummary { Motivo = g.Key, Cantidad = g.Count() })
                .ToList();

            var correspondenciaMez = _db.Correspondencias
                .Where(c => c.FechaRecepcionUtc >= startDate && c.FechaRecepcionUtc < endDate)
                .ToList();

            analytics.BalanceMensajeria = new MessagingBalance
            {
                Recibidos = correspondenciaMez.Count,
                Entregados = correspondenciaMez.Count(c => c.Estado == "entregado"),
                Pendientes = correspondenciaMez.Count(c => c.Estado == "en_espera")
            };

            var peatonalTrend = _db.Registros
                .Where(r => r.HoraIngresoUtc >= startDate && r.HoraIngresoUtc < endDate)
                .GroupBy(r => r.HoraIngresoUtc.Date)
                .Select(g => new { Fecha = g.Key, Cantidad = g.Count() })
                .ToList();

            var vehicularTrend = _db.RegistrosVehiculos
                .Where(r => r.HoraIngresoUtc >= startDate && r.HoraIngresoUtc < endDate)
                .GroupBy(r => r.HoraIngresoUtc.Date)
                .Select(g => new { Fecha = g.Key, Cantidad = g.Count() })
                .ToList();

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
