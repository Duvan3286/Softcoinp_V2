using System;

namespace Softcoinp.Backend.Dtos
{
    public class CorrespondenciaDto
    {
        public Guid Id { get; set; }
        public string Remitente { get; set; } = string.Empty;
        public string Destinatario { get; set; } = string.Empty;
        public string? TipoDocumento { get; set; }
        public string? NumeroGuia { get; set; }
        public string? Descripcion { get; set; }
        public string Estado { get; set; } = "en_espera";

        public DateTime FechaRecepcionLocal { get; set; }
        public DateTime? FechaEntregaLocal { get; set; }

        public string? RecibidoPor { get; set; }
        public string? NotaEntrega { get; set; }

        // Nombres de usuarios para mostrar en la UI
        public string? RegistradoPorNombre { get; set; }
        public string? EntregadoPorNombre { get; set; }
    }

    public class CreateCorrespondenciaDto
    {
        public string Remitente { get; set; } = string.Empty;
        public string Destinatario { get; set; } = string.Empty;
        public string? TipoDocumento { get; set; }
        public string? NumeroGuia { get; set; }
        public string? Descripcion { get; set; }
    }

    public class EntregarCorrespondenciaDto
    {
        public string RecibidoPor { get; set; } = string.Empty;
        public string? NotaEntrega { get; set; }
    }
}
