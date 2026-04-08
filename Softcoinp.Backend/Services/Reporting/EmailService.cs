using MailKit.Net.Smtp;
using MimeKit;
using Polly;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Softcoinp.Backend.Models;


namespace Softcoinp.Backend.Services.Reporting
{
    public interface IEmailService
    {
        Task SendSecureReportAsync(string recipientEmail, string subject, string body, byte[] pdf, byte[] excel, string password);
    }

    public class EmailService : IEmailService
    {
        private readonly AppDbContext _db;
        private string _smtpHost = "smtp.gmail.com"; 
        private int _smtpPort = 587;

        public EmailService(AppDbContext db)
        {
            _db = db;
        }


        public async Task SendSecureReportAsync(string recipientEmail, string subject, string body, byte[] pdf, byte[] excel, string password)
        {
            var settings = _db.SystemSettings
                .Where(s => s.Key == "SmtpEmail" || s.Key == "SmtpPassword")
                .ToList();


            var smtpEmail = settings.FirstOrDefault(s => s.Key == "SmtpEmail")?.Value;
            var smtpPass = settings.FirstOrDefault(s => s.Key == "SmtpPassword")?.Value;

            if (string.IsNullOrEmpty(smtpEmail) || string.IsNullOrEmpty(smtpPass))
            {
                throw new Exception("Configuración de correo (SMTP) incompleta en Mantenimiento.");
            }

            var retryPolicy = Policy
                .Handle<Exception>()
                .WaitAndRetryAsync(3, i => TimeSpan.FromSeconds(Math.Pow(2, i)));

            await retryPolicy.ExecuteAsync(async () =>
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress("SOFTCOINP Reports", smtpEmail));
                message.To.Add(new MailboxAddress("Destinatario", recipientEmail));
                message.Subject = subject;

                var bodyBuilder = new BodyBuilder { HtmlBody = body };
                bodyBuilder.Attachments.Add("Reporte_Analitico.pdf", pdf, new ContentType("application", "pdf"));
                bodyBuilder.Attachments.Add("Datos_Detallados.xlsx", excel, new ContentType("application", "vnd.openxmlformats-officedocument.spreadsheetml.sheet"));

                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();
                await client.ConnectAsync(_smtpHost, _smtpPort, MailKit.Security.SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(smtpEmail, smtpPass);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            });
        }
    }
}

