import api, { ApiResponse } from "./api";

export interface MotivoBloqueoDto {
  motivo: string;
}

export const personalService = {
  bloquear: async (id: string, motivo: string): Promise<void> => {
    await api.post<ApiResponse<any>>(`/personal/${id}/bloquear`, { motivo });
  },

  desbloquear: async (id: string): Promise<void> => {
    await api.post<ApiResponse<any>>(`/personal/${id}/desbloquear`, {});
  },
};
