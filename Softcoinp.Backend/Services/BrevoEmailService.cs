using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Softcoinp.Backend.Services
{
    public class BrevoEmailService : IEmailService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private readonly ILogger<BrevoEmailService> _logger;
        private readonly IServiceProvider _serviceProvider;

        public BrevoEmailService(HttpClient httpClient, IConfiguration config, ILogger<BrevoEmailService> logger, IServiceProvider serviceProvider)
        {
            _httpClient = httpClient;
            _config = config;
            _logger = logger;
            _serviceProvider = serviceProvider;
            _httpClient.BaseAddress = new Uri("https://api.brevo.com/v3/");
        }

        private async Task<bool> ConfigureHttpClientAsync(AppDbContext db)
        {
            // Intentar obtener de BD
            var dbApiKey = (await db.SystemSettings.FirstOrDefaultAsync(s => s.Key == "BrevoApiKey"))?.Value;
            
            // Si no está en BD, intentar de Variable de Entorno
            var apiKey = !string.IsNullOrEmpty(dbApiKey) ? dbApiKey : Environment.GetEnvironmentVariable("BREVO_API_KEY") ?? _config["Brevo:ApiKey"];

            if (string.IsNullOrEmpty(apiKey) || apiKey == "USAR_VARIABLE_DE_ENTORNO")
            {
                _logger.LogWarning("Brevo API Key no configurada.");
                return false;
            }

            _httpClient.DefaultRequestHeaders.Remove("api-key");
            _httpClient.DefaultRequestHeaders.Add("api-key", apiKey);
            return true;
        }

        public async Task<bool> SendEmailAsync(string toEmail, string toName, string subject, string htmlContent)
        {
            try
            {
                string senderEmail = "no-reply@softcoinp.com";
                string senderName = "Softcoinp - Portería";

                using (var scope = _serviceProvider.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    
                    if (!await ConfigureHttpClientAsync(db)) return false;

                    var settings = await db.SystemSettings
                        .Where(s => s.Key == "SmtpEmail" || s.Key == "ClientName")
                        .ToListAsync();

                    var dbEmail = settings.FirstOrDefault(s => s.Key == "SmtpEmail")?.Value;
                    var dbClient = settings.FirstOrDefault(s => s.Key == "ClientName")?.Value;

                    if (!string.IsNullOrEmpty(dbEmail)) senderEmail = dbEmail;
                    if (!string.IsNullOrEmpty(dbClient)) senderName = $"{dbClient} - Portería";
                }

                var payload = new
                {
                    sender = new { name = senderName, email = senderEmail },
                    to = new[] { new { email = toEmail, name = toName } },
                    subject = subject,
                    htmlContent = htmlContent
                };

                var response = await _httpClient.PostAsJsonAsync("smtp/email", payload);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Correo enviado exitosamente a {toEmail} desde {senderEmail}");
                    return true;
                }

                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Error enviando correo a {toEmail}: {response.StatusCode} - {error}");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Excepción al enviar correo a {toEmail}");
                return false;
            }
        }

        public async Task NotifyNewCorrespondenceAsync(string toEmail, string toName, string remitente, string tipo, string guia)
        {
            // Asunto más limpio y profesional para evitar SPAM
            var subject = $"Aviso de Correspondencia: {remitente}";
            var tipoStr = string.IsNullOrWhiteSpace(tipo) ? "Paquete / Sobre" : tipo;
            var guiaStr = string.IsNullOrWhiteSpace(guia) ? "No especificada" : guia;

            var html = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;'>
                    <div style='background-color: #059669; padding: 20px; text-align: center; color: white;'>
                        <h1 style='margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;'>Softcoinp - Portería</h1>
                    </div>
                    <div style='padding: 30px; line-height: 1.6;'>
                        <p style='font-size: 16px; font-weight: bold;'>Hola, {toName}:</p>
                        <p>Te informamos que ha llegado una nueva correspondencia a tu nombre en la portería:</p>
                        
                        <div style='background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;'>
                            <p style='margin: 5px 0;'><strong>📦 Remitente:</strong> {remitente}</p>
                            <p style='margin: 5px 0;'><strong>📄 Tipo:</strong> {tipoStr}</p>
                            <p style='margin: 5px 0;'><strong>🎫 Guía:</strong> {guiaStr}</p>
                            <p style='margin: 5px 0;'><strong>🕒 Fecha:</strong> {DateTime.UtcNow.AddHours(-5):dd/MM/yyyy hh:mm tt}</p>
                        </div>
                        
                        <p>Por favor, acércate a la portería lo antes posible para reclamarla.</p>
                        <p style='font-size: 14px; color: #64748b;'>Este es un mensaje automático, por favor no lo respondas.</p>
                    </div>
                    <div style='background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 11px; color: #94a3b8;'>
                        &copy; {DateTime.Now.Year} Softcoinp - Sistema de Gestión de Propiedad Horizontal
                    </div>
                </div>";

            await SendEmailAsync(toEmail, toName, subject, html);
        }

        public async Task NotifyNewBatchRecibosAsync(string toEmail, string toName, string servicio, string mes, int anio)
        {
            var subject = $"📄 Recibos de {servicio} Disponibles - Portería";
            
            var html = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;'>
                    <div style='background-color: #059669; padding: 20px; text-align: center; color: white;'>
                        <h1 style='margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;'>Softcoinp - Portería</h1>
                    </div>
                    <div style='padding: 30px; line-height: 1.6;'>
                        <p style='font-size: 16px; font-weight: bold;'>Hola, {toName}:</p>
                        <p>Te informamos que ya se encuentran disponibles en la portería los recibos de <strong>{servicio}</strong> correspondientes al mes de <strong>{mes} de {anio}</strong>.</p>
                        
                        <p>Por favor, acércate a la portería en tu próxima entrada o salida para reclamarlo.</p>
                        
                        <div style='background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; text-align: center;'>
                            <p style='margin: 0; font-weight: bold; color: #15803d;'>Servicio: {servicio}</p>
                            <p style='margin: 0; font-size: 12px; color: #166534;'>Periodo: {mes} / {anio}</p>
                        </div>
                        
                        <p style='font-size: 14px; color: #64748b;'>Este es un mensaje automático, por favor no lo respondas.</p>
                    </div>
                    <div style='background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 11px; color: #94a3b8;'>
                        &copy; {DateTime.Now.Year} Softcoinp - Sistema de Gestión de Propiedad Horizontal
                    </div>
                </div>";

            await SendEmailAsync(toEmail, toName, subject, html);
        }
    }
}
