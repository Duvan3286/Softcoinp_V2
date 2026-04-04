using System.Collections.Generic;

namespace Softcoinp.Backend.Dtos
{
    public class DashboardStatsDto
    {
        public int TotalPersonas { get; set; }
        public int TotalVehiculos { get; set; }
        public int IngresosRango { get; set; }
        public int NovedadesPersonas { get; set; }
        public int NovedadesVehiculos { get; set; }
        public int RecibosPendientes { get; set; }
        
        public List<ChartItemDto> ProporcionNovedades { get; set; } = new List<ChartItemDto>();
        public List<ChartItemDto> RegistrosPorDestino { get; set; } = new List<ChartItemDto>();
        public List<ChartItemDto> RegistrosPorTipo { get; set; } = new List<ChartItemDto>();
    }

    public class ChartItemDto
    {
        public string Name { get; set; } = string.Empty;
        public int Value { get; set; }
    }
}
