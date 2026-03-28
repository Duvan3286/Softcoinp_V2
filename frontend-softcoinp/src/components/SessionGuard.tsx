"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hasPermission, loading } = useAuth();

  useEffect(() => {
    // 🛡️ Verificar sesión en cada cambio de ruta
    const checkAccess = () => {
      const token = localStorage.getItem("token");
      const isLoginPage = pathname === "/login";

      if (!token && !isLoginPage) {
        router.replace("/login");
        return;
      } 
      
      if (token && isLoginPage) {
        router.replace("/dashboard");
        return;
      }

      // Si aún está cargando el contexto de auth, no validamos permisos todavía
      if (loading || !token) return;

      // 🛡️ VALIDACIÓN DE PERMISOS GRANULARES
      const routePermissions: Record<string, string> = {
        "/dashboard": "dashboard",
        "/novedades-vehiculares": "novedades-vehicular",
        "/novedades": "novedades-personas",
        "/historial-novedades": "historial-novedades",
        "/reportes/personas": "analitica-personas",
        "/reportes/vehiculos": "analitica-vehiculos",
        "/reportes": "analitica-dashboard",
        "/registros-vehiculos": "historial-vehiculos",
        "/registros": "historial-personas",
        "/historial-vehiculares": "historial-vehiculares",
        "/personal-activo": "sitio-personas",
        "/vehiculos-activos": "sitio-vehiculos",
        "/correspondencia": "correspondencia",
        "/configuraciones": "configuraciones",
      };

      // Si la ruta está en nuestro mapa de permisos y el usuario NO tiene ese permiso
      // Excepto si es superadmin (hasPermission ya maneja el bypass de superadmin internamente)
      const requiredPermission = Object.keys(routePermissions).find(route => pathname.startsWith(route));
      
      if (requiredPermission && !hasPermission(routePermissions[requiredPermission])) {
        console.warn(`Acceso denegado a ${pathname}. Falta permiso: ${routePermissions[requiredPermission]}`);
        router.replace("/dashboard");
      }

      // 🛠️ Mantenimiento exclusivo para SuperAdmin
      if (pathname.includes("mantenimiento=true") && user?.role !== "superadmin") {
        router.replace("/dashboard");
      }
    };

    checkAccess();
  }, [pathname, loading, user, hasPermission]);

  return <>{children}</>;
}
