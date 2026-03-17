"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function ConfiguracionesHubPage() {
  const router = useRouter();

  const menuItems = [
    {
      title: "Gestión de Usuarios",
      description: "Crear, editar y administrar permisos de usuarios del sistema.",
      icon: "👥",
      path: "/configuraciones/usuarios",
      color: "bg-purple-100 text-purple-600",
      btnColor: "bg-purple-600 hover:bg-purple-700"
    },
    {
      title: "Tipos de Personal",
      description: "Administra las categorías de personal (Empleado, Visitante, etc.).",
      icon: "🏷️",
      path: "/configuraciones/tipos",
      color: "bg-blue-100 text-blue-600",
      btnColor: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "Auditoría",
      description: "Visualiza la bitácora de actividad y registros del sistema.",
      icon: "📋",
      path: "/configuraciones/auditoria",
      color: "bg-amber-100 text-amber-600",
      btnColor: "bg-amber-600 hover:bg-amber-700"
    },
    {
      title: "General",
      description: "Ajustes globales, logos e institución.",
      icon: "⚙️",
      path: "/configuraciones/general",
      color: "bg-slate-100 text-slate-600",
      btnColor: "bg-slate-600 hover:bg-slate-700"
    }
  ];

  return (
    <div className="h-screen bg-gray-50 p-6 flex flex-col items-center overflow-hidden">
      <div className="w-full max-w-6xl h-full flex flex-col">
        {/* Header con botón de regreso */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-4">
            <button
               onClick={() => router.push("/dashboard")}
               className="bg-blue-600 text-white py-1.5 px-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition duration-200 flex items-center text-sm"
               title="Volver al Dashboard"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Configuraciones</h1>
              <p className="text-sm text-gray-500 font-medium">Panel de administración y ajustes del sistema</p>
            </div>
          </div>
        </div>

        {/* Grid de opciones - Ajustado para no scroll */}
        <div className="flex-grow flex items-center justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-h-full overflow-y-auto pr-2 custom-scrollbar">
            {menuItems.map((item, index) => (
              <div 
                key={index}
                className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col items-center text-center transition-all hover:scale-[1.02] hover:shadow-2xl"
              >
                <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-inner`}>
                  {item.icon}
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h2>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed px-2 flex-grow">
                  {item.description}
                </p>
                <button
                  onClick={() => router.push(item.path)}
                  className={`w-full ${item.btnColor} text-white py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-sm`}
                >
                  Configurar <span>➔</span>
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <p className="mt-8 mb-4 text-center text-xs text-gray-400 font-medium tracking-widest uppercase shrink-0">
          Gestión Administrativa • SOFTCOINP
        </p>
      </div>
    </div>
  );
}
