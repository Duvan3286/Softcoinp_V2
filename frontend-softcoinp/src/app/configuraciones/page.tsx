"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, UserPayload } from "@/utils/auth";

export default function ConfiguracionesHubPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UserPayload | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.role === "user") {
      router.push("/dashboard");
      return;
    }
    setUsuario(user);
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
    <div className="h-screen bg-gray-50 p-6 flex flex-col items-center overflow-hidden">
      <div className="w-full max-w-6xl h-full flex flex-col">
        {/* Header con botón de regreso */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Configuraciones</h1>
              <p className="text-sm text-gray-500 font-medium">Panel de administración y ajustes del sistema</p>
            </div>
          </div>
        </div>

        {/* Grid de opciones - Optimizado para scroll interno compacto */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-2">
              {filteredItems.map((item, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col items-center text-center transition-all hover:scale-[1.03] hover:shadow-2xl hover:border-blue-100 group"
                >
                  <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-inner transition-transform group-hover:rotate-1 group-hover:scale-110`}>
                    {item.icon}
                  </div>
                  <h2 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h2>
                  <p className="text-xs text-gray-500 mb-6 leading-relaxed px-2 flex-grow font-medium">
                    {item.description}
                  </p>
                  <button
                    onClick={() => router.push(item.path)}
                    className={`w-full ${item.btnColor} text-white py-2.5 rounded-xl font-black shadow-lg shadow-gray-200/50 transition-all active:scale-95 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest`}
                  >
                    Configurar <span className="text-sm group-hover:translate-x-1 transition-transform">➔</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <p className="py-4 text-center text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase shrink-0 border-t border-gray-100 mt-2">
          Gestión Administrativa • SOFTCOINP v2
        </p>
      </div>
    </div>
  );
}
