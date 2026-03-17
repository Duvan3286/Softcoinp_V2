"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 🛡️ Verificar sesión en cada cambio de ruta y al cargar desde caché (Back button)
    const checkSession = () => {
      const token = localStorage.getItem("token");
      const isLoginPage = pathname === "/login";

      if (!token && !isLoginPage) {
        // No hay sesión y no estamos en login -> Forzar salida
        router.replace("/login");
      } else if (token && isLoginPage) {
        // Hay sesión y estamos en login -> Mandar al dashboard
        router.replace("/dashboard");
      }
    };

    // 🔄 Manejar el botón "Atrás" del navegador (bfcache)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // La página se cargó desde la caché del navegador al dar "atrás"
        checkSession();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    checkSession();

    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [pathname]);

  return <>{children}</>;
}
