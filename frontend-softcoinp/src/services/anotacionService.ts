import api, { ApiResponse } from "./api";

export interface CreateAnotacionDto {
  personalId: string;
  texto: string;
}

export interface AnotacionDto {
  id: string;
  personalId: string;
  personalNombre?: string;
  personalApellido?: string;
  texto: string;
  fechaCreacionUtc: string;
  registradoPor: string;
  registradoPorEmail?: string;
}

export const anotacionService = {
  getAnotacionesPorPersonal: async (personalId: string): Promise<AnotacionDto[]> => {
    const response = await api.get<ApiResponse<AnotacionDto[]>>(`/anotaciones/personal/${personalId}`);
    return response.data.data;
  },

  createAnotacion: async (data: CreateAnotacionDto): Promise<AnotacionDto> => {
    const response = await api.post<ApiResponse<AnotacionDto>>("/anotaciones", data);
    return response.data.data;
  },

  updateAnotacion: async (id: string, texto: string): Promise<AnotacionDto> => {
    const response = await api.patch<ApiResponse<AnotacionDto>>(`/anotaciones/${id}`, { texto });
    return response.data.data;
  },

  deleteAnotacion: async (id: string): Promise<void> => {
    await api.delete(`/anotaciones/${id}`);
  },
};
