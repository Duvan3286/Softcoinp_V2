using System;
using System.Threading.Tasks;

namespace Softcoinp.Backend.Services
{
    public interface IAuditService
    {
        Task LogAsync(string action, string entity, Guid? entityId = null, object? data = null);
    }
}
