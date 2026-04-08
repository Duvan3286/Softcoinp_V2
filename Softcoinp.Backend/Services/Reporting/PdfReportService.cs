using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.Linq;
using Softcoinp.Backend.Models;

namespace Softcoinp.Backend.Services.Reporting
{
    public interface IPdfReportService
    {
        byte[] GenerateMonthlyReport(MonthlyAnalytics analytics);
    }

    public class PdfReportService : IPdfReportService
    {
        static PdfReportService() => QuestPDF.Settings.License = LicenseType.Community;

        public byte[] GenerateMonthlyReport(MonthlyAnalytics analytics)
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Verdana));

                    page.Header().Element(header => ComposeHeader(header, analytics));
                    page.Content().Element(content => ComposeContent(content, analytics));
                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Página ");
                        x.CurrentPageNumber();
                    });
                });
            });

            return document.GeneratePdf();
        }

        private void ComposeHeader(IContainer container, MonthlyAnalytics analytics)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("SOFTCOINP").FontSize(24).ExtraBold().FontColor(Color.FromHex("#3F51B5"));
                    column.Item().Text("Data Intelligence Engine").FontSize(12).SemiBold().FontColor(Color.FromHex("#757575"));
                });

                row.RelativeItem().AlignRight().Column(column =>
                {
                    column.Item().Text($"Reporte Mensual: {analytics.Month}/{analytics.Year}").FontSize(14).Bold();
                    column.Item().Text($"Generado (Manual): {DateTime.Now:yyyy-MM-dd HH:mm}").FontSize(8).FontColor(Color.FromHex("#9E9E9E"));
                });
            });
        }

        private void ComposeContent(IContainer container, MonthlyAnalytics analytics)
        {
            container.PaddingVertical(10).Column(column =>
            {
                column.Item().Text("1. Resumen Ejecutivo").FontSize(14).Bold().FontColor(Color.FromHex("#3F51B5"));
                column.Item().PaddingVertical(5).Row(row =>
                {
                    row.RelativeItem().Component(new StatsCard("Flujo Peatonal", analytics.TotalPeatonal.ToString(), "🚶"));
                    row.ConstantItem(10);
                    row.RelativeItem().Component(new StatsCard("Flujo Vehicular", analytics.TotalVehicular.ToString(), "🚗"));
                    row.ConstantItem(10);
                    row.RelativeItem().Component(new StatsCard("Pendientes Mensajería", analytics.BalanceMensajeria.Pendientes.ToString(), "📦"));
                });

                column.Item().PaddingTop(20).Text("2. Tendencia de Tráfico Diaria").FontSize(14).Bold().FontColor(Color.FromHex("#3F51B5"));
                column.Item().PaddingVertical(10).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(3);
                        columns.RelativeColumn(7);
                    });

                    foreach (var point in analytics.TendenciaFlujo.TakeLast(7))
                    {
                        table.Cell().Text(point.Fecha.ToString("dd/MM"));
                        table.Cell().Row(r => {
                            r.RelativeItem(point.Peatonal + 1).Background(Color.FromHex("#C5CAE9")).Height(10);
                            r.RelativeItem(point.Vehicular + 1).Background(Color.FromHex("#B2DFDB")).Height(10);
                        });
                    }
                });

                column.Item().PaddingTop(20).Text("3. Distribución de Motivos de Bloqueo").FontSize(14).Bold().FontColor(Color.FromHex("#3F51B5"));
                column.Item().Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        foreach (var b in analytics.BloqueosConsolidado)
                            col.Item().Text($"- {b.Motivo}: {b.Cantidad}").FontSize(9);
                    });
                });
            });
        }
    }

    public class StatsCard(string title, string value, string icon) : IComponent
    {
        public void Compose(IContainer container)
        {
            container.Background(Color.FromHex("#F5F5F5")).Padding(10).Column(column =>
            {
                column.Item().Row(row => {
                    row.RelativeItem().Text(title).FontSize(8).SemiBold().FontColor(Color.FromHex("#616161"));
                    row.ConstantItem(15).Text(icon);
                });
                column.Item().Text(value).FontSize(16).Bold().FontColor(Color.FromHex("#3F51B5"));
            });
        }
    }
}
