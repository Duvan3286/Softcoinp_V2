import api from "./api";

export interface RegistroDto {
  id: string;
  personalId?: string;
  nombre: string;
  apellido: string;
  documento: string;
  telefono?: string;
  email?: string;
  motivo?: string;
  destino: string;
  tipo: string;
  horaIngresoUtc: string;
  horaIngresoLocal: string;
  horaSalidaUtc?: string;
  horaSalidaLocal?: string;
  registradoPor?: string;
  fotoUrl?: string;
  isBloqueado?: boolean;
  motivoBloqueo?: string;
  placaVehiculo?: string;
  vehiculoId?: string;
  marcaVehiculo?: string;
  modeloVehiculo?: string;
  colorVehiculo?: string;
  tipoVehiculo?: string;
  fotoVehiculoUrl?: string;
  conductorId?: string;
  conductorNombre?: string;
  vehiculos?: any[];
}

export interface CreateRegistroDto {
  nombre: string;
  apellido: string;
  documento: string;
  telefono?: string;
  email?: string;
  destino: string;
  motivo: string;
  tipo?: string;
  foto?: string; // Base64
  fotoVehiculo?: string; // Base64
  placa?: string;
  marca?: string;
  modelo?: string;
  color?: string;
  tipoVehiculo?: string;
  conductorId?: string;
  conductorNombre?: string;
}

export interface RegistrarSalidaDto {
  conductorSalidaId?: string;
  conductorSalidaNombre?: string;
}

export const registroService = {
  getRegistros: async (params: any = {}) => {
    const res = await api.get("/registros", { params }) as any;
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get(`/registros/${id}`) as any;
    return res.data;
  },

  buscarPorDocumento: async (documento: string) => {
    const res = await api.get(`/registros/buscar`, { params: { documento } }) as any;
    return res.data;
  },

  getActivos: async () => {
    const res = await api.get("/registros/activos") as any;
    return res.data;
  },

  getActivoPorDocumento: async (documento: string) => {
    try {
      const res = await api.get(`/registros/activo`, { params: { documento } }) as any;
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  registrarEntrada: async (data: CreateRegistroDto) => {
    const res = await api.post("/registros", data) as any;
    return res.data;
  },

  registrarSalida: async (id: string, data: RegistrarSalidaDto = {}) => {
    const res = await api.put(`/registros/${id}/salida`, data) as any;
    return res.data;
  },

  actualizarDatos: async (data: any) => {
    const res = await api.post("/registros/actualizar-datos", data) as any;
    return res.data;
  }
};
