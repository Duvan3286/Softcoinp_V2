import api from './api';

export interface ChartItemDto {
  name: string;
  value: number;
}

export interface DashboardStatsDto {
  totalPersonas: number;
  totalVehiculos: number;
  ingresosRango: number;
  novedadesPersonas: number;
  novedadesVehiculos: number;
  proporcionNovedades: ChartItemDto[];
  registrosPorDestino: ChartItemDto[];
  registrosPorTipo: ChartItemDto[];
}

export const getDashboardStats = async (desde?: string, hasta?: string): Promise<DashboardStatsDto | null> => {
  try {
    let url = '/reportes/dashboard';
    const params = new URLSearchParams();
    if (desde) params.append('desde', desde);
    if (hasta) params.append('hasta', hasta);
    
    if (params.toString()) {
        url += `?${params.toString()}`;
    }

    const response = await api.get<{ data: DashboardStatsDto }>(url);
    return response.data.data;
  } catch (error) {
    console.error("Error al obtener estadísticas del dashboard:", error);
    return null;
  }
};
