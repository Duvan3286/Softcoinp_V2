using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.Linq;
using Softcoinp.Backend.Models;

namespace Softcoinp.Worker.Services
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
                    page.Margin(1.5f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial).FontColor(Color.FromHex("#333333")));

                    page.Header().Element(header => ComposeHeader(header, analytics));
                    page.Content().Element(content => ComposeContent(content, analytics));
                    page.Footer().AlignCenter().PaddingTop(10).Text(x =>
                    {
                        x.Span("Documento confidencial - Generado automáticament por SOFTCOINP | Página ");
                        x.CurrentPageNumber();
                        x.Span(" de ");
                        x.TotalPages();
                    });
                });
            });

            return document.GeneratePdf();
        }

        private void ComposeHeader(IContainer container, MonthlyAnalytics analytics)
        {
            container.PaddingBottom(15).BorderBottom(1).BorderColor(Color.FromHex("#E0E0E0")).Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("SOFTCOINP").FontSize(28).Black().FontColor(Color.FromHex("#1A237E"));
                    column.Item().Text("INFORME EJECUTIVO DE INTELIGENCIA OPERATIVA").FontSize(10).SemiBold().FontColor(Color.FromHex("#5C6BC0"));
                });

                row.RelativeItem().AlignRight().Column(column =>
                {
                    var culture = new System.Globalization.CultureInfo("es-ES");
                    string nombreMes = culture.DateTimeFormat.GetMonthName(analytics.Month);
                    nombreMes = char.ToUpper(nombreMes[0]) + nombreMes.Substring(1);

                    column.Item().Text($"Periodo: {nombreMes} / {analytics.Year}").FontSize(12).Bold();
                    column.Item().Text($"Emisión: {DateTime.Now:dd/MM/yyyy HH:mm}").FontSize(9).FontColor(Color.FromHex("#757575"));
                });

            });
        }

        private void ComposeContent(IContainer container, MonthlyAnalytics analytics)
        {
            container.PaddingVertical(10).Column(column =>
            {
                // Introducción
                column.Item().PaddingBottom(20).Background(Color.FromHex("#F5F5F6")).Padding(15).Text(
                    "Este documento consolida las métricas clave de seguridad, logística y flujo procesadas por la plataforma SOFTCOINP. " +
                    "Los datos a continuación ilustran la carga operativa y los patrones de acceso para apoyar la toma de decisiones estratégicas, " +
                    "permitiendo auditar la seguridad del recinto e identificar oportunidades de optimización operativa."
                ).FontSize(10).Italic().FontColor(Color.FromHex("#424242"));

                // Sección 1: Carga Operativa
                ComposeSectionTitle(column, "1. Carga Operativa y Flujo de Tráfico");
                column.Item().PaddingBottom(10).Text(
                    "La trazabilidad del flujo peatonal y vehicular brinda visibilidad sobre la carga del sistema operativo."
                ).FontSize(9).FontColor(Color.FromHex("#616161"));

                column.Item().PaddingBottom(15).Row(row =>
                {
                    row.RelativeItem().Component(new StatsBox("🚶 Registro Peatonal", analytics.TotalPeatonal.ToString(), "#E8EAF6", "#3F51B5"));
                    row.ConstantItem(15);
                    row.RelativeItem().Component(new StatsBox("🚗 Registro Vehicular", analytics.TotalVehicular.ToString(), "#E8F5E9", "#2E7D32"));
                    row.ConstantItem(15);
                    row.RelativeItem().Component(new StatsBox("📦 Logística Activa", (analytics.BalanceMensajeria.Pendientes + analytics.BalanceMensajeria.Entregados).ToString(), "#FFF3E0", "#E65100"));
                });

                // Tabla Tendencias Visual
                column.Item().PaddingBottom(20).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(2); // Fecha
                        columns.RelativeColumn(4); // Peatonal
                        columns.RelativeColumn(4); // Vehicular
                    });

                    table.Header(header =>
                    {
                        header.Cell().PaddingBottom(5).Text("Día (Últimos)").SemiBold().FontSize(9);
                        header.Cell().PaddingBottom(5).Text("Tendencia Peatonal").SemiBold().FontSize(9);
                        header.Cell().PaddingBottom(5).Text("Tendencia Vehicular").SemiBold().FontSize(9);
                    });

                    if (analytics.TendenciaFlujo.Count == 0)
                    {
                        table.Cell().ColumnSpan(3).Padding(10).Text("No hay datos de flujo para el periodo.").Italic();
                    }

                    var culture = new System.Globalization.CultureInfo("es-ES");

                    foreach (var point in analytics.TendenciaFlujo.TakeLast(10))
                    {
                        table.Cell().PaddingVertical(2).Text(point.Fecha.ToString("dd MMM", culture)).FontSize(8);
                        table.Cell().PaddingVertical(2).Row(r => {
                            r.RelativeItem(point.Peatonal + 1).Background(Color.FromHex("#7986CB")).Height(8);
                            r.RelativeItem(50 - (point.Peatonal >= 50 ? 49 : point.Peatonal)).Height(8); 
                        });
                        table.Cell().PaddingVertical(2).Row(r => {
                            r.RelativeItem(point.Vehicular + 1).Background(Color.FromHex("#81C784")).Height(8);
                            r.RelativeItem(50 - (point.Vehicular >= 50 ? 49 : point.Vehicular)).Height(8); 
                        });
                    }
                });


                // Sección 2: Top Visitantes
                ComposeSectionTitle(column, "2. Monitoreo de Recurrencia (Top 10 Visitantes)");
                column.Item().PaddingBottom(10).Text(
                    "Individuos externos con mayor presencia en la instalación. Útil para auditar permisos prolongados o analizar impacto de proveedores."
                ).FontSize(9).FontColor(Color.FromHex("#616161"));

                column.Item().PaddingBottom(20).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(30);
                        columns.RelativeColumn(3);
                        columns.RelativeColumn(2);
                        columns.ConstantColumn(80);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Background(Color.FromHex("#1A237E")).Padding(5).Text("#").FontColor(Colors.White).SemiBold().FontSize(9);
                        header.Cell().Background(Color.FromHex("#1A237E")).Padding(5).Text("Nombre de Visitante").FontColor(Colors.White).SemiBold().FontSize(9);
                        header.Cell().Background(Color.FromHex("#1A237E")).Padding(5).Text("Documento/ID").FontColor(Colors.White).SemiBold().FontSize(9);
                        header.Cell().Background(Color.FromHex("#1A237E")).Padding(5).AlignCenter().Text("Total Visitas").FontColor(Colors.White).SemiBold().FontSize(9);
                    });

                    if (analytics.Top10Visitantes.Count == 0)
                    {
                        table.Cell().ColumnSpan(4).Padding(10).Text("No hay visitantes en el periodo.").Italic();
                    }

                    for (int i = 0; i < analytics.Top10Visitantes.Count; i++)
                    {
                        var v = analytics.Top10Visitantes[i];
                        var bgColor = i % 2 == 0 ? Color.FromHex("#F5F5F5") : Colors.White;

                        table.Cell().Background(bgColor).Padding(5).Text((i + 1).ToString()).FontSize(9);
                        table.Cell().Background(bgColor).Padding(5).Text(v.Nombre).FontSize(9);
                        table.Cell().Background(bgColor).Padding(5).Text(v.Documento).FontSize(9);
                        table.Cell().Background(bgColor).Padding(5).AlignCenter().Text(v.Visitas.ToString()).ExtraBold().FontSize(9).FontColor(Color.FromHex("#1A237E"));
                    }
                });

                // Salto de Página
                column.Item().PageBreak(); 

                // Sección 3: Seguridad
                ComposeSectionTitle(column, "3. Integridad y Seguridad de Accesos (Bloqueos)");
                column.Item().PaddingBottom(10).Text(
                    "Eventos restrictivos del sistema. Un alto volumen en motivos específicos puede advertir fallos de cumplimiento o intrusiones."
                ).FontSize(9).FontColor(Color.FromHex("#616161"));

                column.Item().PaddingBottom(20).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(4);
                        columns.RelativeColumn(1);
                    });

                    table.Header(header =>
                    {
                        header.Cell().BorderBottom(1).BorderColor(Color.FromHex("#BDBDBD")).PaddingBottom(5).Text("Motivo de la Restricción").SemiBold().FontSize(9);
                        header.Cell().BorderBottom(1).BorderColor(Color.FromHex("#BDBDBD")).PaddingBottom(5).AlignCenter().Text("Frecuencia").SemiBold().FontSize(9);
                    });

                    if (analytics.BloqueosConsolidado.Count == 0)
                    {
                        table.Cell().ColumnSpan(2).Padding(10).AlignCenter().Text("No se registraron bloqueos en este periodo.").Italic().FontColor(Color.FromHex("#9E9E9E"));
                    }
                    else
                    {
                        foreach (var b in analytics.BloqueosConsolidado.OrderByDescending(x => x.Cantidad))
                        {
                            table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(Color.FromHex("#EEEEEE")).Text(b.Motivo).FontSize(9);
                            table.Cell().PaddingVertical(5).BorderBottom(1).BorderColor(Color.FromHex("#EEEEEE")).AlignCenter().Text(b.Cantidad.ToString()).SemiBold().FontSize(9).FontColor(Color.FromHex("#D32F2F"));
                        }
                    }
                });

                // Sección 4: Logística
                ComposeSectionTitle(column, "4. Balance de Mensajería (Efectividad Logística)");
                column.Item().PaddingBottom(10).Text(
                    "Mide el nivel de retención de paquetería ('En Espera') frente a la rotación eficiente ('Entregados')."
                ).FontSize(9).FontColor(Color.FromHex("#616161"));

                column.Item().Row(row =>
                {
                    row.RelativeItem().Component(new StatsBox("Paquetes Entregados", analytics.BalanceMensajeria.Entregados.ToString(), "#E3F2FD", "#1565C0"));
                    row.ConstantItem(15);
                    row.RelativeItem().Component(new StatsBox("Paquetes en Recepción", analytics.BalanceMensajeria.Pendientes.ToString(), "#FFEBEE", "#C62828"));
                });
            });
        }

        private void ComposeSectionTitle(ColumnDescriptor column, string title)
        {
            column.Item().PaddingTop(15).PaddingBottom(5).Text(title).FontSize(14).SemiBold().FontColor(Color.FromHex("#1A237E")); 
        }
    }

    public class StatsBox(string title, string value, string bgColorHex, string accentColorHex) : IComponent
    {
        public void Compose(IContainer container)
        {
            container
                .Background(Color.FromHex(bgColorHex))
                .BorderLeft(4)
                .BorderColor(Color.FromHex(accentColorHex))
                .Padding(12)
                .Column(column =>
                {
                    column.Item().Text(title).FontSize(9).SemiBold().FontColor(Color.FromHex("#424242"));
                    column.Item().PaddingTop(5).Text(value).FontSize(20).ExtraBold().FontColor(Color.FromHex(accentColorHex));
                });
        }
    }
}


