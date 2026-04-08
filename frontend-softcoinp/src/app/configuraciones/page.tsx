"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, UserPayload } from "@/utils/auth";
import { settingsService } from "@/services/settingsService";

export default function ConfiguracionesHubPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UserPayload | null>(null);
  const [systemVersion, setSystemVersion] = useState("");
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.role === "user") {
      router.push("/dashboard");
      return;
    }
    setUsuario(user);

    // Cargar versión y nombre del cliente
    settingsService.getSystemVersion().then(setSystemVersion);
    settingsService.getClientName().then(setClientName);
  }, [router]);

  const menuItems = [
    {
      title: "Gestión de Usuarios",
      description: "Crear, editar y administrar usuarios del sistema.",
      icon: "👥",
      path: "/configuraciones/usuarios",
      color: "bg-emerald-50 text-emerald-600",
      roles: ["admin", "superadmin"]
    },
    {
      title: "Gestión de Permisos",
      description: "Controla qué vistas puede ver cada usuario en el sistema.",
      icon: "🔑",
      path: "/configuraciones/permisos",
      color: "bg-cyan-50 text-cyan-600",
      roles: ["admin", "superadmin"]
    },
    {
      title: "Tipos de Personal",
      description: "Administra las categorías de personal (Empleado, Visitante, etc.).",
      icon: "🏷️",
      path: "/configuraciones/tipos",
      color: "bg-emerald-50 text-emerald-600",
      roles: ["admin", "superadmin"]
    },
    {
      title: "Mantenimiento",
      description: "Auditoría de registros, backups y acciones críticas del sistema.",
      icon: "🛠️",
      path: "/configuraciones/mantenimiento",
      color: "bg-cyan-50 text-cyan-600",
      roles: ["superadmin"]
    },
    {
      title: "General",
      description: "Ajustes globales, logos e institución.",
      icon: "⚙️",
      path: "/configuraciones/general",
      color: "bg-zinc-50 text-zinc-600",
      roles: ["admin", "superadmin"]
    }
  ];

  const filteredItems = menuItems.filter(item => 
    usuario && item.roles.includes(usuario.role)
  );

  return (
    <div className="h-full bg-background p-4 lg:p-12 flex flex-col items-center justify-start overflow-hidden gap-8 transition-colors duration-300">
      <div className="w-full max-w-4xl flex flex-col items-start shrink-0">
        <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-emerald-600 rounded-xl text-white shadow-lg dark:shadow-none transition-all hover:scale-110">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
                <h1 className="text-xl lg:text-3xl font-black text-foreground uppercase tracking-tight leading-none">Configuraciones</h1>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mt-2">Panel Administrativo Central</p>
            </div>
        </div>
        <div className="w-full h-px bg-border mt-6 opacity-50 transition-colors"></div>
      </div>

      {/* Lista de opciones - Formato Renglones */}
      <div className="w-full max-w-4xl flex flex-col gap-4 overflow-y-auto pr-2 pb-10 custom-scrollbar">
        {filteredItems.map((item, index) => (
          <div 
            key={index}
            onClick={() => router.push(item.path)}
            className="w-full bg-card rounded-xl p-5 lg:px-10 lg:py-7 border border-border shadow-sm dark:shadow-none flex items-center gap-6 lg:gap-10 transition-all hover:bg-emerald-50/30 dark:hover:bg-zinc-900 hover:border-emerald-100 dark:hover:border-zinc-800 cursor-pointer group"
          >
            {/* Icono compacto */}
            <div className={`w-14 h-14 shrink-0 ${item.color.replace('bg-emerald-50', 'bg-emerald-50 dark:bg-emerald-950/20').replace('bg-cyan-50', 'bg-cyan-50 dark:bg-cyan-950/20').replace('bg-rose-50', 'bg-rose-50 dark:bg-rose-950/20').replace('bg-zinc-50', 'bg-zinc-50 dark:bg-zinc-800')} rounded-xl flex items-center justify-center text-2xl shadow-sm transition-all group-hover:scale-110`}>
              {item.icon}
            </div>
            
            {/* Texto informativo */}
            <div className="flex-1 min-w-0">
                <h2 className="text-base font-black text-foreground uppercase tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.title}</h2>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 truncate uppercase tracking-tighter opacity-70">
                {item.description}
                </p>
            </div>
            
            {/* Botón de acción minimalista */}
            <div className="btn-primary px-6 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 hidden sm:flex">
                Acceder <span>→</span>
            </div>
            <div className="sm:hidden text-emerald-400 font-bold">➔</div>
          </div>
        ))}
      </div>
      
      <div className="w-full flex justify-center mt-auto pb-4 shrink-0">
         <p className="text-[9px] text-slate-300 dark:text-slate-600 font-black tracking-[0.3em] uppercase">
            Control de Acceso Softcoinp {systemVersion || "..."} • {clientName || "Panel de Administración Profesional"}
         </p>
      </div>
    </div>
  );
}
