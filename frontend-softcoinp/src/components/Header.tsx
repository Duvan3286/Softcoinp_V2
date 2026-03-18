"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getApiResponse } from "@/services/api";
import { useSidebar } from "@/context/SidebarContext";

interface AuthUser {
  nombre: string;
}

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
        // El interceptor 401 se encarga de la redirección si falla
      }
    };
    cargarUsuario();
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.replace("/login");
  };

  if (pathname === "/login") return null;

  // Iniciales del usuario para el avatar
  const initials = usuario
    ? usuario.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const { toggleSidebar } = useSidebar();

  return (
    <header className="relative w-full h-14 bg-white border-b border-slate-200/80 px-4 lg:px-5 flex items-center gap-2 lg:gap-4 shadow-sm z-[110]">
      
      {/* 📱 BOTÓN MENU (Solo móvil) */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ── IZQUIERDA: Avatar + Nombre usuario ── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar circular con iniciales */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-[11px] font-black text-white tracking-tight">{initials}</span>
        </div>

        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Usuario activo</span>
          <span className="text-sm font-bold text-slate-700 truncate max-w-[140px]">
            {usuario || "—"}
          </span>
        </div>
      </div>

      {/* ── CENTRO: Logo / Nombre del Sistema ── */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 select-none">
        {/* Ícono logo */}
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-200">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        {/* Nombre del sistema */}
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] leading-none">Sistema de Control de Acceso</span>
          <span className="text-base font-black text-slate-800 tracking-tight leading-tight">
            SOFT<span className="text-blue-600">COINP</span>
          </span>
        </div>
      </div>

      {/* ── DERECHA: Botón Salir ── */}
      <div className="ml-auto flex items-center">
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200 group shadow-sm"
        >
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Salir
        </button>
      </div>

    </header>
  );
}
