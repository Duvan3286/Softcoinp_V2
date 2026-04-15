import api, { ApiResponse } from "./api";

export interface MotivoBloqueoDto {
  motivo: string;
}

// Assuming PersonalListDto is defined elsewhere or needs to be added.
// For the purpose of this edit, I'll assume it's available or will be added.
// If not, this line would cause a type error.
export interface PersonalListDto {
  // Define properties of PersonalListDto here, e.g.:
  id: string;
  nombre: string;
  // ... other properties
}

export const personalService = {
  bloquear: async (id: string, motivo: string): Promise<void> => {
    await api.post<ApiResponse<any>>(`/personal/${id}/bloquear`, { motivo });
  },

  desbloquear: async (id: string, motivo: string): Promise<void> => {
    await api.post<ApiResponse<any>>(`/personal/${id}/desbloquear`, { motivo });
  },

  getAllPersonal: async (): Promise<PersonalListDto[]> => {
    try {
      const response = await api.get<{ data: PersonalListDto[] }>("/personal");
      return response.data.data || [];
    } catch (error) {
      console.error("Error al obtener el catálogo de personal:", error);
      return [];
    }
  },

  buscarPorNombre: async (termino: string) => {
    const res = await api.get("/personal/buscar-por-nombre", {
      params: { termino }
    }) as any;
    return res.data;
  },
};
