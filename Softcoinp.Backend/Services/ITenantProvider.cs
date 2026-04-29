namespace Softcoinp.Backend.Services
{
    public interface ITenantProvider
    {
        string? GetSubdomain();
        string GetConnectionString();
    }
}
