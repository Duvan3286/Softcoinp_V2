using System;

namespace Softcoinp.Backend.Dtos
{
    public class ReciboPublicoDto
    {
        public Guid Id { get; set; }
        public string Servicio { get; set; } = string.Empty;
        public string Mes { get; set; } = string.Empty;
        public int Anio { get; set; }
        public int TotalRecibidos { get; set; }
        public int TotalEntregados { get; set; }
        public int Pendientes { get; set; }
        public DateTime FechaCreacionUtc { get; set; }
        public bool Activo { get; set; }
    }

    public class CreateReciboPublicoDto
    {
        public string Servicio { get; set; } = string.Empty;
        public string Mes { get; set; } = string.Empty;
        public int Anio { get; set; }
        public int TotalRecibidos { get; set; }
    }

    public class RegisterEntregaReciboDto
    {
        public string ResidenteNombre { get; set; } = string.Empty;
        public string Apartamento { get; set; } = string.Empty;
    }
}
