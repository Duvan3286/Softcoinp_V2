import axios from "axios";

// ✅ Estructura genérica de respuesta del backend
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ✅ Instancia de Axios configurada
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api", 
});

// ✅ Interceptor para añadir el token JWT automáticamente
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ✅ Interceptor para manejar errores globales (ej: 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("🔒 Sesión expirada o no autorizada. Redirigiendo a login...");
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ✅ Helper tipado para obtener respuestas del backend
export async function getApiResponse<T>(url: string, config?: any): Promise<ApiResponse<T>> {
  const response = await api.get<ApiResponse<T>>(url, config);
  return response.data;
}

export default api;
