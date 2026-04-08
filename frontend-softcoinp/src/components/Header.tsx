"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getApiResponse } from "@/services/api";
import { useSidebar } from "@/context/SidebarContext";
import { settingsService } from "@/services/settingsService";
interface AuthUser {
  nombre: string;
}

export default function Header() {
  const [usuario, setUsuario] = useState("");
  const [clientName, setClientName] = useState("SOFTCOINP");
  const [systemVersion, setSystemVersion] = useState("");

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {

    if (pathname === "/login") return;
    const cargarDatos = async () => {
      try {
        const res = await getApiResponse<AuthUser>("/auth/me");
        setUsuario(res.data.nombre);
        
        // Cargar nombre del cliente
        const name = await settingsService.getClientName();
        setClientName(name);

        // Cargar versión del sistema
        const version = await settingsService.getSystemVersion();
        setSystemVersion(version);
      } catch {
        // El interceptor 401 se encarga de la redirección si falla
      }
    };
    cargarDatos();
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
    <header className="relative w-full h-14 bg-card border-b border-border px-4 lg:px-5 flex items-center gap-2 lg:gap-4 shadow-sm z-[110] transition-colors duration-300">
      
      {/* 📱 BOTÓN MENU (Solo móvil) */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-xl bg-background text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ── IZQUIERDA: Avatar + Nombre usuario ── */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-[11px] font-black text-white tracking-tight">{initials}</span>
        </div>

        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Activo</span>
          <span className="text-sm font-bold text-foreground truncate max-w-[140px]">
            {usuario || "—"}
          </span>
        </div>
      </div>

      {/* ── CENTRO: Logo / Nombre del Sistema ── */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 select-none hidden sm:flex">
        <div className="w-7 h-7 rounded-lg bg-emerald-700 flex items-center justify-center shadow-md dark:shadow-none">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <div className="flex flex-col leading-tight items-start">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] leading-none mb-0.5">Softcoinp {systemVersion || "..."}</span>
          <span className="text-sm font-black text-foreground tracking-tight leading-tight uppercase">
            {clientName}
          </span>
        </div>
      </div>

      {/* ── DERECHA: Botón Salir ── */}
      <div className="ml-auto flex items-center gap-2 lg:gap-3">

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 dark:hover:border-rose-800 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200 group shadow-sm"
        >
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden xs:inline">Salir</span>
        </button>
      </div>

    </header>
  );
}
