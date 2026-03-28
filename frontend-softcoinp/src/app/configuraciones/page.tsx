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
      description: "Crear, editar y administrar permisos de usuarios del sistema.",
      icon: "👥",
      path: "/configuraciones/usuarios",
      color: "bg-purple-100 text-purple-600",
      btnColor: "bg-purple-600 hover:bg-purple-700",
      roles: ["admin", "superadmin"]
    },
    {
      title: "Tipos de Personal",
      description: "Administra las categorías de personal (Empleado, Visitante, etc.).",
      icon: "🏷️",
      path: "/configuraciones/tipos",
      color: "bg-blue-100 text-blue-600",
      btnColor: "bg-blue-600 hover:bg-blue-700",
      roles: ["admin", "superadmin"]
    },
    {
      title: "Auditoría",
      description: "Visualiza la bitácora de actividad y registros del sistema.",
      icon: "📋",
      path: "/configuraciones/auditoria",
      color: "bg-amber-100 text-amber-600",
      btnColor: "bg-amber-600 hover:bg-amber-700",
      roles: ["superadmin"]
    },
    {
      title: "Mantenimiento",
      description: "Reseteo de base de datos y limpieza profunda (SÓLO DESARROLLO).",
      icon: "🛠️",
      path: "/configuraciones/general?mantenimiento=true",
      color: "bg-red-100 text-red-600",
      btnColor: "bg-red-600 hover:bg-red-700",
      roles: ["superadmin"]
    },
    {
      title: "General",
      description: "Ajustes globales, logos e institución.",
      icon: "⚙️",
      path: "/configuraciones/general",
      color: "bg-slate-100 text-slate-600",
      btnColor: "bg-slate-600 hover:bg-slate-700",
      roles: ["admin", "superadmin"]
    }
  ];

  const filteredItems = menuItems.filter(item => 
    usuario && item.roles.includes(usuario.role)
  );

  return (
    <div className="h-full bg-slate-50 p-4 lg:p-12 flex flex-col items-center justify-start overflow-hidden gap-8">
      <div className="w-full max-w-4xl flex flex-col items-start shrink-0">
        <div className="flex items-center gap-4 mb-2">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100 transition-transform hover:scale-110">
              <span className="text-xl">⚙️</span>
            </div>
            <div>
                <h1 className="text-xl lg:text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Configuraciones del Sistema</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Gestión administrativa y ajustes globales</p>
            </div>
        </div>
        <div className="w-full h-px bg-slate-200 mt-4 opacity-50"></div>
      </div>

      {/* Lista de opciones - Formato Renglones */}
      <div className="w-full max-w-4xl flex flex-col gap-3 overflow-y-auto pr-1 pb-10 custom-scrollbar">
        {filteredItems.map((item, index) => (
          <div 
            key={index}
            onClick={() => router.push(item.path)}
            className="w-full bg-white rounded-2xl p-4 lg:px-8 lg:py-5 border border-slate-100 shadow-sm flex items-center gap-4 lg:gap-8 transition-all hover:bg-indigo-50/40 hover:border-indigo-100 hover:shadow-md cursor-pointer group"
          >
            {/* Icono compacto */}
            <div className={`w-12 h-12 shrink-0 ${item.color} rounded-xl flex items-center justify-center text-xl shadow-inner transition-all group-hover:scale-110`}>
              {item.icon}
            </div>
            
            {/* Texto informativo */}
            <div className="flex-1 min-w-0">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{item.title}</h2>
                <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 mt-1 truncate uppercase tracking-tight">
                {item.description}
                </p>
            </div>
            
            {/* Botón de acción minimalista */}
            <div className={`px-4 py-2 rounded-xl text-white text-[9px] font-black uppercase tracking-widest ${item.btnColor} shadow-md opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 hidden sm:flex items-center gap-2`}>
                Gestionar <span>→</span>
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
