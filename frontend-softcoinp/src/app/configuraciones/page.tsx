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
      title: "Auditoría",
      description: "Visualiza la bitácora de actividad y registros del sistema.",
      icon: "📋",
      path: "/configuraciones/auditoria",
      color: "bg-violet-50 text-violet-600",
      roles: ["superadmin"]
    },
    {
      title: "Mantenimiento",
      description: "Reseteo de base de datos y limpieza profunda (SÓLO DESARROLLO).",
      icon: "🛠️",
      path: "/configuraciones/general?mantenimiento=true",
      color: "bg-rose-50 text-rose-600",
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
    <div className="h-full bg-slate-50/50 p-4 lg:p-12 flex flex-col items-center justify-start overflow-hidden gap-8">
      <div className="w-full max-w-4xl flex flex-col items-start shrink-0">
        <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100 transition-all hover:rotate-3 hover:scale-110">
              <span className="text-2xl">⚙️</span>
            </div>
            <div>
                <h1 className="text-xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Configuraciones</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2">Panel Administrativo Central</p>
            </div>
        </div>
        <div className="w-full h-px bg-slate-200 mt-6 opacity-50"></div>
      </div>

      {/* Lista de opciones - Formato Renglones */}
      <div className="w-full max-w-4xl flex flex-col gap-4 overflow-y-auto pr-2 pb-10 custom-scrollbar">
        {filteredItems.map((item, index) => (
          <div 
            key={index}
            onClick={() => router.push(item.path)}
            className="w-full bg-white rounded-3xl p-5 lg:px-10 lg:py-7 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center gap-6 lg:gap-10 transition-all hover:bg-indigo-50/30 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 cursor-pointer group"
          >
            {/* Icono compacto */}
            <div className={`w-14 h-14 shrink-0 ${item.color} rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-all group-hover:scale-110 group-hover:rotate-3`}>
              {item.icon}
            </div>
            
            {/* Texto informativo */}
            <div className="flex-1 min-w-0">
                <h2 className="text-base font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{item.title}</h2>
                <p className="text-xs font-bold text-slate-400 mt-1 truncate uppercase tracking-tighter opacity-70">
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
         <p className="text-[9px] text-slate-300 font-black tracking-[0.3em] uppercase">
            Control de Acceso Softcoinp {systemVersion || "..."} • {clientName || "Panel de Administración Profesional"}
         </p>
      </div>
    </div>
  );
}
