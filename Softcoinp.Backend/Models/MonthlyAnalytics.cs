using System;
using System.Collections.Generic;

namespace Softcoinp.Backend.Models
{
    public class MonthlyAnalytics
    {
        public int TotalPeatonal { get; set; }
        public int TotalVehicular { get; set; }
        public List<TopVisitor> Top10Visitantes { get; set; } = new();
        public List<BlockSummary> BloqueosConsolidado { get; set; } = new();
        public MessagingBalance BalanceMensajeria { get; set; } = new();
        public List<FlowPoint> TendenciaFlujo { get; set; } = new();
        public int Month { get; set; }
        public int Year { get; set; }
    }

    public class TopVisitor { public string Documento { get; set; } = ""; public string Nombre { get; set; } = ""; public int Visitas { get; set; } }
    public class BlockSummary { public string Motivo { get; set; } = ""; public int Cantidad { get; set; } }
    public class MessagingBalance { public int Recibidos { get; set; } public int Entregados { get; set; } public int Pendientes { get; set; } }
    public class FlowPoint { public DateTime Fecha { get; set; } public int Peatonal { get; set; } public int Vehicular { get; set; } }
}
