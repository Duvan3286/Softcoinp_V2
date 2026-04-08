using ClosedXML.Excel;
using System.Collections.Generic;
using System.IO;
using Softcoinp.Backend.Models;


namespace Softcoinp.Backend.Services.Reporting
{
    public interface IExcelReportService
    {
        byte[] GenerateRawDataExcel(MonthlyAnalytics analytics);
    }

    public class ExcelReportService : IExcelReportService
    {
        public byte[] GenerateRawDataExcel(MonthlyAnalytics analytics)
        {
            using var workbook = new XLWorkbook();
            
            var summarySheet = workbook.Worksheets.Add("Resumen Mensual");
            summarySheet.Cell(1, 1).Value = "SOFTCOINP - Reporte de Inteligencia (MANUAL)";
            summarySheet.Cell(1, 1).Style.Font.Bold = true;
            summarySheet.Cell(1, 1).Style.Font.FontSize = 14;

            summarySheet.Cell(3, 1).Value = "Métrica";
            summarySheet.Cell(3, 2).Value = "Valor";
            summarySheet.Range(3, 1, 3, 2).Style.Font.Bold = true;
            summarySheet.Range(3, 1, 3, 2).Style.Fill.BackgroundColor = XLColor.Indigo;
            summarySheet.Range(3, 1, 3, 2).Style.Font.FontColor = XLColor.White;

            summarySheet.Cell(4, 1).Value = "Total Peatonal";
            summarySheet.Cell(4, 2).Value = analytics.TotalPeatonal;
            
            summarySheet.Cell(5, 1).Value = "Total Vehicular";
            summarySheet.Cell(5, 2).Value = analytics.TotalVehicular;

            summarySheet.Cell(6, 1).Value = "Mensajería Entregada";
            summarySheet.Cell(6, 2).Value = analytics.BalanceMensajeria.Entregados;

            summarySheet.Columns().AdjustToContents();

            // Hoja: Top Visitantes
            var topSheet = workbook.Worksheets.Add("Top 10 Visitantes");
            topSheet.Cell(1, 1).Value = "Documento";
            topSheet.Cell(1, 2).Value = "Nombre Completo";
            topSheet.Cell(1, 3).Value = "Frecuencia (Visitas)";
            topSheet.Range(1, 1, 1, 3).Style.Font.Bold = true;

            for (int i = 0; i < analytics.Top10Visitantes.Count; i++)
            {
                var v = analytics.Top10Visitantes[i];
                topSheet.Cell(i + 2, 1).Value = v.Documento;
                topSheet.Cell(i + 2, 2).Value = v.Nombre;
                topSheet.Cell(i + 2, 3).Value = v.Visitas;
            }
            topSheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }
    }
}
