import api from "./api";

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
}

export const vehiculoService = {
  getVehiculoPorPlaca: async (placa: string): Promise<VehiculoDto | null> => {
    try {
      const response = await api.get(`/vehiculos/placa/${placa}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }
};
