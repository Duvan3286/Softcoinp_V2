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
      color: "bg-indigo-50 text-indigo-600",
      roles: ["admin", "superadmin"]
    },
    {
      title: "Gestión de Permisos",
      description: "Controla qué vistas puede ver cada usuario en el sistema.",
      icon: "🔑",
      path: "/configuraciones/permisos",
      color: "bg-violet-50 text-violet-600",
      roles: ["admin", "superadmin"]
    },
    {
      title: "Tipos de Personal",
      description: "Administra las categorías de personal (Empleado, Visitante, etc.).",
      icon: "🏷️",
      path: "/configuraciones/tipos",
      color: "bg-indigo-50 text-indigo-600",
      roles: ["admin", "superadmin"]
    },
    {
      title: "Mantenimiento",
      description: "Auditoría de registros, backups y acciones críticas del sistema.",
      icon: "🛠️",
      path: "/configuraciones/mantenimiento",
      color: "bg-violet-50 text-violet-600",
      roles: ["superadmin"]
    },
    {
      title: "General",
      description: "Ajustes globales, logos e institución.",
      icon: "⚙️",
      path: "/configuraciones/general",
      color: "bg-slate-50 text-slate-600",
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
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100 dark:shadow-none transition-all hover:rotate-3 hover:scale-110">
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
            className="w-full bg-card rounded-3xl p-5 lg:px-10 lg:py-7 border border-border shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none flex items-center gap-6 lg:gap-10 transition-all hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer group"
          >
            {/* Icono compacto */}
            <div className={`w-14 h-14 shrink-0 ${item.color.replace('bg-indigo-50', 'bg-indigo-50 dark:bg-indigo-900/20').replace('bg-violet-50', 'bg-violet-50 dark:bg-violet-900/20').replace('bg-rose-50', 'bg-rose-50 dark:bg-rose-900/20').replace('bg-slate-50', 'bg-slate-50 dark:bg-slate-800')} rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-all group-hover:scale-110 group-hover:rotate-3`}>
              {item.icon}
            </div>
            
            {/* Texto informativo */}
            <div className="flex-1 min-w-0">
                <h2 className="text-base font-black text-foreground uppercase tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{item.title}</h2>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 truncate uppercase tracking-tighter opacity-70">
                {item.description}
                </p>
            </div>
            
            {/* Botón de acción minimalista */}
            <div className="btn-primary px-6 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 hidden sm:flex">
                Acceder <span>→</span>
            </div>
            <div className="sm:hidden text-indigo-400 font-bold">➔</div>
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
