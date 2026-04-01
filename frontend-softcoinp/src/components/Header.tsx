"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getApiResponse } from "@/services/api";
import { useSidebar } from "@/context/SidebarContext";
import { settingsService } from "@/services/settingsService";
import { useTheme } from "next-themes";

interface AuthUser {
  nombre: string;
}

export default function Header() {
  const [usuario, setUsuario] = useState("");
  const [clientName, setClientName] = useState("SOFTCOINP");
  const [systemVersion, setSystemVersion] = useState("");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
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
    <header className="relative w-full h-14 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 lg:px-5 flex items-center gap-2 lg:gap-4 shadow-sm z-[110] transition-colors duration-300">
      
      {/* 📱 BOTÓN MENU (Solo móvil) */}
      <button 
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ── IZQUIERDA: Avatar + Nombre usuario ── */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-[11px] font-black text-white tracking-tight">{initials}</span>
        </div>

        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Activo</span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[140px]">
            {usuario || "—"}
          </span>
        </div>
      </div>

      {/* ── CENTRO: Logo / Nombre del Sistema ── */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 select-none hidden sm:flex">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <div className="flex flex-col leading-tight items-start">
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] leading-none mb-0.5">Softcoinp {systemVersion || "..."}</span>
          <span className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight leading-tight uppercase">
            {clientName}
          </span>
        </div>
      </div>

      {/* ── DERECHA: Selector de Tema + Botón Salir ── */}
      <div className="ml-auto flex items-center gap-2 lg:gap-3">
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            title={`Cambiar a modo ${resolvedTheme === 'dark' ? 'claro' : 'oscuro'}`}
            className="group relative flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all active:scale-90"
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              {resolvedTheme === 'dark' ? (
                <svg className="w-5 h-5 text-indigo-400 animate-in zoom-in duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              ) : (
                <svg className="w-5 h-5 text-amber-500 animate-in zoom-in duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
            </div>
          </button>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 dark:hover:border-rose-800 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200 group shadow-sm"
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
