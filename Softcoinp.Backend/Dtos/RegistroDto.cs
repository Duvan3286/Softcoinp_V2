using System;

namespace Softcoinp.Backend.Dtos
{
    public class RegistroDto
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string Documento { get; set; } = string.Empty;
        public string? Motivo { get; set; }
        public string Destino { get; set; } = string.Empty;
        public string Tipo { get; set; } = "visitante";

        // Guardados en BD
        public DateTime HoraIngresoUtc { get; set; }
        public DateTime? HoraSalidaUtc { get; set; }

        // Calculados desde el modelo (no se envían al guardar)
        public DateTime HoraIngresoLocal { get; set; }
        public DateTime? HoraSalidaLocal { get; set; }

        public Guid? RegistradoPor { get; set; }
    }
}
