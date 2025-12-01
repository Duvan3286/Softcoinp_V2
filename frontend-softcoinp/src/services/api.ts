import axios from "axios";

// ✅ Estructura genérica de respuesta del backend
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ✅ Instancia de Axios configurada
const api = axios.create({
  baseURL: "http://localhost:5004/api", // Ajustar si tu backend usa otro puerto
});

// ✅ Interceptor para añadir el token JWT automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ✅ Helper tipado para obtener respuestas del backend
export async function getApiResponse<T>(url: string, config?: any): Promise<ApiResponse<T>> {
  const response = await api.get<ApiResponse<T>>(url, config);
  return response.data;
}

export default api;
