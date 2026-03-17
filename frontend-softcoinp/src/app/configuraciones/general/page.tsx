"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function GeneralPage() {
  const router = useRouter();

  const systemInfo = [
    { label: "Nombre del Sistema", value: "SOFTCOINP" },
    { label: "Versión", value: "2.1.0-beta" },
    { label: "Ambiente", value: "Producción Local" },
    { label: "Base de Datos", value: "PostgreSQL / Entity Framework Core" },
    { label: "Desarrollador", value: "Duvan3286" }
  ];

  return (
    <div className="h-screen bg-gray-50 p-6 overflow-hidden flex flex-col">
      <div className="max-w-3xl mx-auto w-full h-full flex flex-col">
        <button 
          onClick={() => router.push("/configuraciones")}
          className="mb-6 text-blue-600 flex items-center gap-2 font-semibold hover:text-blue-800 transition-colors shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver a Configuraciones
        </button>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex-grow flex flex-col min-h-0">
          <div className="bg-slate-700 p-8 text-white relative shrink-0">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-2">Configuración General</h1>
              <p className="opacity-90">Información técnica y global del sistema</p>
            </div>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-7xl opacity-20">⚙️</div>
          </div>

          <div className="p-8 space-y-8 overflow-y-auto flex-grow custom-scrollbar">
            <section>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Información del Sistema</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {systemInfo.map((info, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">{info.label}</p>
                    <p className="text-sm font-semibold text-gray-800">{info.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="pt-6 border-t border-gray-100">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Soporte y Mantenimiento</h2>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl shadow-lg">
                  🆘
                </div>
                <div className="flex-grow text-center md:text-left">
                  <h3 className="text-lg font-bold text-blue-900 mb-1">¿Necesitas ayuda técnica?</h3>
                  <p className="text-sm text-blue-700 mb-4 opacity-80">Si experimentas problemas con el sistema o necesitas realizar un mantenimiento avanzado, contacta al administrador.</p>
                  <a 
                    href="mailto:soporte@softcoinp.com"
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all"
                  >
                    Contactar Soporte
                  </a>
                </div>
              </div>
            </section>
          </div>
          
          <div className="p-6 bg-gray-50 text-center border-t border-gray-100 shrink-0">
            <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">
              SOFTCOINP v2 • All Rights Reserved 2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
