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
        IExcelReportService excelService,
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
                var excelBytes = excelService.GenerateRawDataExcel(analytics);

                // 3. Recuperar ID del gerente para cifrado (Ejemplo: desde configuración o DB)
                string managerId = "1020304050"; 

                // 4. Enviar Correo Seguro
                await emailService.SendSecureReportAsync(
                    "gerencia@softcoinp.com",
                    $"[SOFTCOINP] Reporte Analítico Mensual - {lastMonth:MMMM yyyy}",
                    $"Hola,<br><br>Adjunto encontrará el análisis de inteligencia de datos del mes de {lastMonth:MMMM}.<br>La contraseña de apertura es su número de documento físico.",
                    pdfBytes,
                    excelBytes,
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
