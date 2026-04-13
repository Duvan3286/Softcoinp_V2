import api from "./api";

export interface RegistroVehiculoDto {
  id: string;
  vehiculoId?: string;
  placa: string;
  marca?: string;
  modelo?: string;
  color?: string;
  tipoVehiculo?: string;
  fotoVehiculoUrl?: string;
  horaIngresoUtc: string;
  horaIngresoLocal: string;
  horaSalidaUtc?: string;
  horaSalidaLocal?: string;
  registradoPorNombre?: string;
  conductorId?: string;
  conductorNombre?: string;
}

export interface CreateRegistroVehiculoDto {
  placa: string;
  marca?: string;
  modelo?: string;
  color?: string;
  tipoVehiculo?: string;
  fotoVehiculo?: string; // Base64
  conductorId?: string;
  conductorNombre?: string;
}

export const registroVehiculoService = {
  getRegistros: async (params: any = {}) => {
    const res = await api.get("/registrovehiculo", { params }) as any;
    return res.data;
  },

  getActivo: async (placa: string) => {
    try {
      const res = await api.get(`/registrovehiculo/activo`, { params: { placa } }) as any;
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  getActivos: async () => {
    const res = await api.get("/registrovehiculo/activos") as any;
    return res.data;
  },

  registrarEntrada: async (data: CreateRegistroVehiculoDto) => {
    const res = await api.post("/registrovehiculo", data) as any;
    return res.data;
  },

  registrarSalida: async (id: string, data: RegistrarSalidaDto = {}) => {
    const res = await api.put(`/registrovehiculo/${id}/salida`, data) as any;
    return res.data;
  }
};
