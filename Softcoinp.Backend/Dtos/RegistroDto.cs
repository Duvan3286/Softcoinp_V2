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

        // 🆕 Propiedad de la foto que faltaba y causaba los errores CS0117 en el controlador
        public string? FotoUrl { get; set; } 

        // Guardados en BD
        public DateTime HoraIngresoUtc { get; set; }
        public DateTime? HoraSalidaUtc { get; set; }

        // Calculados desde el modelo (no se envían al guardar)
        public DateTime HoraIngresoLocal { get; set; }
        public DateTime? HoraSalidaLocal { get; set; }

        public Guid? RegistradoPor { get; set; }

        public Guid? PersonalId { get; set; }

    }
}