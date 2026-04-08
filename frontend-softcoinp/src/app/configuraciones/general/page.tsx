"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, UserPayload } from "@/utils/auth";
import { settingsService } from "@/services/settingsService";

export default function GeneralPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UserPayload | null>(null);
  const [clientName, setClientName] = useState("");
  const [systemVersion, setSystemVersion] = useState("");

  useEffect(() => {
    setUsuario(getCurrentUser());
    cargarConfiguraciones();
  }, []);

  const cargarConfiguraciones = async () => {
    try {
      const name = await settingsService.getClientName();
      setClientName(name);

      const version = await settingsService.getSystemVersion();
      setSystemVersion(version);
    } catch (err) {
      console.error("Error al cargar configuraciones", err);
    }
  };

  const systemInfo = [
    { label: "Nombre de Cliente", value: clientName || "CARGANDO..." },
    { label: "Versión de Software", value: systemVersion || "CARGANDO..." },
    { label: "Ambiente de Ejecución", value: "Producción Cloud / Local" },
    { label: "Motor de Base de Datos", value: "PostgreSQL 15" },
    { label: "Módulo de Seguridad", value: "JWT + RBAC" },
    { label: "Rol Administrativo", value: usuario?.role.toUpperCase() || "CARGANDO..." }
  ];

  return (
    <div className="h-full bg-background p-4 lg:p-12 flex flex-col items-center justify-start overflow-hidden gap-8 transition-colors duration-300 font-sans">
      <div className="w-full max-w-4xl flex flex-col items-start shrink-0">
        <div className="flex items-center justify-between w-full mb-2">
          <div className="flex items-center gap-4">
              <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-sm transition-transform hover:scale-110">
                <span className="text-xl">⚙️</span>
              </div>
              <div>
                  <h1 className="text-xl lg:text-2xl font-black text-foreground uppercase tracking-tight leading-none">
                      Información General
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1">
                      Detalles técnicos y estado del entorno
                  </p>
              </div>
          </div>
          <button 
              onClick={() => router.push("/configuraciones")}
              className="bg-card text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 py-2 px-4 rounded-xl font-black border border-border shadow-sm transition-all active:scale-95 flex items-center gap-2 text-[10px] uppercase tracking-widest"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Volver
            </button>
        </div>
        <div className="w-full h-px bg-border mt-4 opacity-50 transition-colors"></div>
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-8 overflow-y-auto pr-1 pb-10 custom-scrollbar">
        
        {/* ℹ️ INFORMACIÓN DEL SISTEMA */}
        <section className="animate-in fade-in slide-in-from-top duration-500">
          <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">Ficha Técnica de Instalación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {systemInfo.map((info, idx) => (
              <div key={idx} className="p-4 bg-card rounded-xl border border-border shadow-sm transition-all hover:border-emerald-100 dark:hover:border-emerald-900 group">
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1 group-hover:text-emerald-400 transition-colors">{info.label}</p>
                <p className="text-[12px] font-black text-foreground leading-tight uppercase">{info.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 🆘 SECCIÓN DE SOPORTE */}
        <section className="pt-4 border-t border-border border-dashed transition-colors">
          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-6 lg:p-8 flex flex-col md:flex-row items-center gap-8 group transition-colors text-center md:text-left">
            <div className="w-20 h-20 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-3xl shadow-sm transition-transform group-hover:rotate-6">
              🆘
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-black text-foreground uppercase tracking-tight mb-2">Asistencia Técnica Softcoinp</h3>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-6 uppercase tracking-tight max-w-xl">
                Para soporte avanzado, reportes de bugs o personalizaciones adicionales, nuestro equipo de ingeniería está a tu disposición.
              </p>
              <a 
                href="mailto:soporte@softcoinp.com"
                className="inline-flex px-8 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-emerald-700 transition-all active:scale-95"
              >
                Contactar Ingeniería <span>➔</span>
              </a>
            </div>
          </div>
        </section>
      </div>
      
      <div className="w-full flex justify-center mt-auto pb-4 shrink-0 px-2 lg:px-0">
         <p className="text-[9px] text-slate-300 dark:text-slate-600 font-black tracking-[0.3em] uppercase text-center">
            Softcoinp {systemVersion || "..."} • Entorno de Gestión Operativa
         </p>
      </div>
    </div>
  );
}
