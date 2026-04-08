using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Quartz;
using Softcoinp.Worker.Services;
using System;
using System.Threading.Tasks;

namespace Softcoinp.Worker.Jobs
{
    [DisallowConcurrentExecution]
    public class MonthlyReportJob(
        ILogger<MonthlyReportJob> logger,
        IReportDataService dataService,
        IPdfReportService pdfService,
        IEmailService emailService) : IJob
    {
        public async Task Execute(IJobExecutionContext context)
        {
            logger.LogInformation("🚀 Iniciando generación de reporte mensual desatendido: {Time}", DateTimeOffset.Now);

            try
            {
                // 1. Obtener periodo (Mes anterior al actual)
                var lastMonth = DateTime.UtcNow.AddMonths(-1);
                var analytics = await dataService.GetMonthlyAnalyticsAsync(lastMonth.Month, lastMonth.Year);

                // 2. Generar Documentos
                var pdfBytes = pdfService.GenerateMonthlyReport(analytics);

                // 3. Recuperar ID del gerente para cifrado (Ejemplo: desde configuración o DB)
                string managerId = "1020304050"; 

                // 4. Enviar Correo Seguro
                var culture = new System.Globalization.CultureInfo("es-ES");
                string nombreMesEmail = culture.DateTimeFormat.GetMonthName(lastMonth.Month);
                nombreMesEmail = char.ToUpper(nombreMesEmail[0]) + nombreMesEmail.Substring(1);

                await emailService.SendSecureReportAsync(
                    "gerencia@softcoinp.com",
                    $"[SOFTCOINP] Reporte Analítico Mensual - {lastMonth:MMMM yyyy}",
                    $"Buen día,<br><br>Se ha generado de forma automática el Reporte Ejecutivo de Inteligencia Operativa consolidado para el mes de {nombreMesEmail}.<br>Adjunto encontrará el documento PDF protegido con todas las métricas de flujo, seguridad y logística detalladas.",
                    pdfBytes,
                    managerId);


                logger.LogInformation("✅ Reporte mensual enviado exitosamente a gerencia.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Error crítico durante la ejecución del job de reportes.");
                throw; // Permitir que Quartz maneje reintentos si está configurado
            }
        }
    }
}
