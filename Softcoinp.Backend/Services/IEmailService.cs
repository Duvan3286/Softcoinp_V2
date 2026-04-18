using System.Threading.Tasks;

namespace Softcoinp.Backend.Services
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(string toEmail, string toName, string subject, string htmlContent);
        Task NotifyNewCorrespondenceAsync(string toEmail, string toName, string remitente, string tipo, string guia);
        Task NotifyNewBatchRecibosAsync(string toEmail, string toName, string servicio, string mes, int anio);
    }
}
