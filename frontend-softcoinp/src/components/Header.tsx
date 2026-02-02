"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getApiResponse } from "@/services/api";
import { AuthUser } from "@/types/auth";

export default function Header() {
  const [usuario, setUsuario] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/login") return;

    const cargarUsuario = async () => {
      try {
        const res = await getApiResponse<AuthUser>("/auth/me");
        setUsuario(res.data.nombre);
      } catch {
        router.replace("/login");
      }
    };

    cargarUsuario();
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    router.replace("/login");
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
