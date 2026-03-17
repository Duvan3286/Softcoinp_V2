import api, { ApiResponse } from "./api";

export interface TipoPersonal {
  id: string;
  nombre: string;
  activo: boolean;
}

export const tipoService = {
  getTipos: async (): Promise<TipoPersonal[]> => {
    const response = await api.get<ApiResponse<TipoPersonal[]>>("/tipos");
    return response.data.data;
  },

  createTipo: async (nombre: string): Promise<TipoPersonal> => {
    const response = await api.post<ApiResponse<TipoPersonal>>("/tipos", { nombre });
    return response.data.data;
  },

  updateTipo: async (id: string, data: Partial<{ nombre: string; activo: boolean }>): Promise<TipoPersonal> => {
    const response = await api.patch<ApiResponse<TipoPersonal>>(`/tipos/${id}`, data);
    return response.data.data;
  },

  deleteTipo: async (id: string): Promise<void> => {
    await api.delete(`/tipos/${id}`);
  }
};
