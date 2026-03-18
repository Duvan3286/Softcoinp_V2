"use client";

/**
 * Utilidades para manejo de JWT y Autenticación en el Frontend
 */

export interface UserPayload {
  id: string;
  email: string;
  nombre: string;
  role: string;
  exp: number;
}

/**
 * Decodifica un JWT manualmente sin dependencias externas
 */
export const decodeToken = (token: string): UserPayload | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(jsonPayload);
    
    // 🛡️ Normalizar claims de ASP.NET Core (Microsoft Identity / WS-Federation)
    const roleClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    const nameClaim = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
    const emailClaim = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";

    if (payload[roleClaim]) payload.role = payload[roleClaim];
    if (payload[nameClaim] && !payload.nombre) payload.nombre = payload[nameClaim];
    if (payload.sub && !payload.email) payload.email = payload.sub;
    if (payload[emailClaim] && !payload.email) payload.email = payload[emailClaim];

    return payload;
  } catch (error) {
    console.error("Error al decodificar el token:", error);
    return null;
  }
};

/**
 * Obtiene el payload del usuario actual desde localStorage
 */
export const getCurrentUser = (): UserPayload | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  return decodeToken(token);
};
