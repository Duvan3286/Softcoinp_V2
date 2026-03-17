"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getApiResponse } from "@/services/api";
interface AuthUser {
  nombre: string;
}

export default function Header() {
  const [usuario, setUsuario] = useState("");
  // Removida la redirección redundante; SessionGuard se encarga de esto.
  const pathname = usePathname(); // Mantener pathname para el handleLogout y el renderizado condicional si SessionGuard no lo maneja completamente.
  const router = useRouter(); // Mantener router para handleLogout

  useEffect(() => {
    // 🛡️ IMPORTANTE: No intentar cargar el usuario si estamos en el login
    if (pathname === "/login") return;

    const cargarUsuario = async () => {
      try {
        const res = await getApiResponse<AuthUser>("/auth/me");
        setUsuario(res.data.nombre);
      } catch {
        // El interceptor 401 se encarga de la redirección si falla
      }
    };

    cargarUsuario();
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    // 🧹 LIMPIEZA DE HISTORIAL: Evita que al dar "atrás" vuelva a intentar cargar la sesión
    window.location.replace("/login"); 
  };

  if (pathname === "/login") return null;

  return (
    <header className="relative w-full h-12 bg-white border-b border-gray-200 px-6 flex items-center">

      {/* IZQUIERDA */}
      <div className="flex flex-col leading-tight">
        <span className="text-xs text-gray-500">Usuario activo</span>
        <span className="text-sm font-semibold text-gray-800 flex items-center gap-1">
          👤 {usuario || "—"}
        </span>
      </div>

      {/* CENTRO */}
      <div className="absolute left-1/2 -translate-x-1/2 text-base font-semibold tracking-wide text-blue-700 text-center">
        SOFTCOINP - Sistema de Control de Acceso
      </div>

      {/* DERECHA */}
      <button
        onClick={handleLogout}
        className="ml-auto text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
      >
        🔒 Salir
      </button>

    </header>
  );
}
