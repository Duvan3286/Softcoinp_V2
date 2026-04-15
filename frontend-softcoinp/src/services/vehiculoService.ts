import api, { ApiResponse } from "./api";

export interface VehiculoDto {
  id: string;
  placa: string;
  marca?: string;
  modelo?: string;
  color?: string;
  tipoVehiculo?: string;
  fotoUrl?: string;
  propietarioId?: string;
  propietarioNombre?: string;
  propietarioApellido?: string;
  propietarioDocumento?: string;
  propietarioTipo?: string;
  propietarioFotoUrl?: string;
  propietarioTelefono?: string;
  isBloqueado?: boolean;
  motivoBloqueo?: string;
}

export const vehiculoService = {
  getVehiculoPorPlaca: async (placa: string): Promise<ApiResponse<VehiculoDto>> => {
    const response = await api.get<ApiResponse<VehiculoDto>>(`/vehiculos/placa/${placa}`);
    return response.data;
  },
  getAllVehiculos: async (): Promise<VehiculoDto[]> => {
    try {
      const response = await api.get<{ data: VehiculoDto[] }>("/vehiculos");
      return response.data.data || [];
    } catch (error) {
      console.error("Error al obtener el catálogo de vehículos:", error);
      return [];
    }
  },
  bloquear: async (id: string, motivo: string): Promise<void> => {
    await api.post(`/vehiculos/${id}/bloquear`, { motivo });
  },
  desbloquear: async (id: string, motivo: string): Promise<void> => {
    await api.post(`/vehiculos/${id}/desbloquear`, { motivo });
  }
};
