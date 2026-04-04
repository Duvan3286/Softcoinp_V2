import api from "./api";

export interface ReciboPublicoDto {
    id: string;
    servicio: string;
    mes: string;
    anio: number;
    totalRecibidos: number;
    totalEntregados: number;
    pendientes: number;
    fechaCreacionUtc: string;
    activo: boolean;
}

export interface CreateReciboPublicoDto {
    servicio: string;
    mes: string;
    totalRecibidos: number;
}

export interface RegisterEntregaReciboDto {
    residenteNombre: string;
    apartamento: string;
}

export interface EntregaReciboDto {
    id: string;
    residenteNombre: string;
    apartamento: string;
    fechaEntregaUtc: string;
    registradoPor: string;
}

export const recibosPublicosService = {
    getActivos: async () => {
        const res = await api.get<ReciboPublicoDto[]>("/RecibosPublicos/activos");
        return res.data;
    },
    create: async (dto: CreateReciboPublicoDto) => {
        const res = await api.post<ReciboPublicoDto>("/RecibosPublicos", dto);
        return res.data;
    },
    entregar: async (id: string, dto: RegisterEntregaReciboDto) => {
        const res = await api.post(`/RecibosPublicos/${id}/entregar`, dto);
        return res.data;
    },
    getHistorial: async () => {
        const res = await api.get<ReciboPublicoDto[]>("/RecibosPublicos/historial");
        return res.data;
    },
    getEntregas: async (id: string) => {
        const res = await api.get<EntregaReciboDto[]>(`/RecibosPublicos/${id}/entregas`);
        return res.data;
    }
};
