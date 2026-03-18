import api from "./api";

export interface CorrespondenciaDto {
  id: string;
  remitente: string;
  destinatario: string;
  tipoDocumento?: string;
  numeroGuia?: string;
  descripcion?: string;
  estado: string; // "en_espera" | "entregado"
  fechaRecepcionLocal: string;
  fechaEntregaLocal?: string;
  recibidoPor?: string;
  notaEntrega?: string;
  registradoPorNombre?: string;
  entregadoPorNombre?: string;
}

export interface CreateCorrespondenciaDto {
  remitente: string;
  destinatario: string;
  tipoDocumento?: string;
  numeroGuia?: string;
  descripcion?: string;
}

export interface EntregarCorrespondenciaDto {
  recibidoPor: string;
  notaEntrega?: string;
}

export const correspondenciaService = {
  getAll: async (estado?: string, remitente?: string, destinatario?: string) => {
    let url = "/correspondencia";
    const params = new URLSearchParams();
    if (estado) params.append("estado", estado);
    if (remitente) params.append("remitente", remitente);
    if (destinatario) params.append("destinatario", destinatario);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const { data } = await api.get<{ data: CorrespondenciaDto[] }>(url);
    return data.data;
  },

  create: async (payload: CreateCorrespondenciaDto) => {
    const { data } = await api.post("/correspondencia", payload);
    return data;
  },

  entregar: async (id: string, payload: EntregarCorrespondenciaDto) => {
    const { data } = await api.put(`/correspondencia/${id}/entregar`, payload);
    return data;
  },

  eliminar: async (id: string) => {
    const { data } = await api.delete(`/correspondencia/${id}`);
    return data;
  }
};
