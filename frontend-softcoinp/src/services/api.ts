import axios from "axios";

// ✅ Estructura genérica de respuesta del backend
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Obtiene el subdominio actual.
 * Ej: 'dev.localhost' -> 'dev'
 * Si es 'localhost' o no hay subdominio, retorna null.
 */
const getSubdomain = () => {
  if (typeof window === "undefined") return null;
  const host = window.location.host; // 'dev.localhost:3000'
  const parts = host.split('.');
  
  if (parts.length >= 2) {
    // Si es algo como 'dev.localhost:3000', parts[0] es 'dev'
    return parts[0].toLowerCase();
  }
  return null;
};

/**
 * Calcula la Base URL dinámica.
 * Si detecta un subdominio, intenta inyectarlo en la URL del API.
 */
const getBaseUrl = () => {
  const defaultApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api";
  const subdomain = getSubdomain();

  if (subdomain && subdomain !== "www") {
    try {
      const url = new URL(defaultApiUrl);
      // Inyectar subdominio en el host del API
      // Ej: de 'localhost:5100' a 'dev.localhost:5100'
      url.hostname = `${subdomain}.${url.hostname}`;
      return url.toString();
    } catch (e) {
      console.error("Error al construir la URL del API con subdominio:", e);
      return defaultApiUrl;
    }
  }

  return defaultApiUrl;
};

// ✅ Instancia de Axios configurada
const api = axios.create({
  baseURL: getBaseUrl(), 
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

// ✅ Interceptor para manejar errores globales (ej: 401 Unauthorized o 404 Tenant Not Found)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        console.warn("🔒 Sesión expirada o no autorizada. Redirigiendo a login...");
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      } else if (error.response.status === 404 && error.config.url?.includes("/api/")) {
        // Podría ser un tenant no encontrado
        console.error("🏢 Tenant no encontrado o inactivo.");
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
