"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, UserPayload } from "@/utils/auth";
import CustomModal, { ModalType } from "@/components/CustomModal";
import { settingsService } from "@/services/settingsService";

export default function GeneralPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UserPayload | null>(null);
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState("");
  const [systemVersion, setSystemVersion] = useState("");
  const [modal, setModal] = useState({ 
    isOpen: false, 
    title: "", 
    message: "", 
    type: "info" as ModalType,
    onConfirm: undefined as (() => void) | undefined 
  });

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

  const handleUpdateClientName = async () => {
    if (!clientName.trim()) {
      showModal("El nombre del cliente no puede estar vacío.", "warning");
      return;
    }

    setSaving(true);
    try {
      await settingsService.update({ key: "ClientName", value: clientName.toUpperCase() });
      showModal("✅ Identidad del sistema actualizada con éxito. Recalibrando interfaz...", "success", "Cambio Guardado");
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      showModal("❌ Error al actualizar el nombre del cliente.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSystemVersion = async () => {
    if (!systemVersion.trim()) {
      showModal("La versión no puede estar vacía.", "warning");
      return;
    }

    setSaving(true);
    try {
      await settingsService.update({ key: "SystemVersion", value: systemVersion });
      showModal("✅ Versión del sistema actualizada con éxito.", "success", "Versión Actualizada");
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      showModal("❌ Error al actualizar la versión.", "error");
    } finally {
      setSaving(false);
    }
  };

  const showModal = (message: string, type: ModalType, title?: string, onConfirm?: () => void) => {
    setModal({ isOpen: true, message, type, title: title || "Aviso", onConfirm });
  };

  const systemInfo = [
    { label: "Versión de Software", value: systemVersion || "CARGANDO..." },
    { label: "Ambiente de Ejecución", value: "Producción Cloud / Local" },
    { label: "Motor de Base de Datos", value: "PostgreSQL 15" },
    { label: "Módulo de Seguridad", value: "JWT + RBAC" },
    { label: "Rol Administrativo", value: usuario?.role.toUpperCase() || "CARGANDO..." }
  ];

  return (
    <>
      <div className="h-full bg-background p-4 lg:p-12 flex flex-col items-center justify-start overflow-hidden gap-8 transition-colors duration-300">
        <div className="w-full max-w-4xl flex flex-col items-start shrink-0">
          <div className="flex items-center justify-between w-full mb-2">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100 dark:shadow-none transition-transform hover:scale-110">
                  <span className="text-xl">⚙️</span>
                </div>
                <div>
                    <h1 className="text-xl lg:text-2xl font-black text-foreground uppercase tracking-tight leading-none">
                        Configuración General
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-1">
                        Personalización y ajustes globales de identidad
                    </p>
                </div>
            </div>
            <button 
                onClick={() => router.push("/configuraciones")}
                className="bg-card text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-2 px-4 rounded-xl font-black border border-border shadow-sm transition-all active:scale-95 flex items-center gap-2 text-[10px] uppercase tracking-widest"
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
            <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">Detalles Técnicos y Versión</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {systemInfo.map((info, idx) => (
                <div key={idx} className="p-4 bg-card rounded-2xl border border-border shadow-sm transition-all hover:border-indigo-100 dark:hover:border-indigo-900 group">
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mb-1 group-hover:text-indigo-400 transition-colors">{info.label}</p>
                  <p className="text-[12px] font-black text-foreground leading-tight uppercase">{info.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 🏢 IDENTIDAD Y VERSIÓN */}
          <section className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm animate-in fade-in slide-in-from-bottom duration-500 transition-colors">
              <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-all group-hover:scale-110">🏷️</div>
                  <div>
                      <h2 className="text-sm font-black text-foreground uppercase tracking-tight">Identidad Visual</h2>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Control de marca y versionamiento</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Campo: Nombre del Cliente */}
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Nombre de la Institución</label>
                      <div className="flex gap-2">
                          <div className="relative group flex-1">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors">🏛️</span>
                              <input 
                                  type="text"
                                  value={clientName}
                                  onChange={(e) => setClientName(e.target.value.toUpperCase())}
                                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl text-xs font-black text-foreground focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all uppercase shadow-inner"
                              />
                          </div>
                          <button
                              onClick={handleUpdateClientName}
                              disabled={saving}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-100 dark:shadow-none"
                          >
                              {saving ? "..." : "OK"}
                          </button>
                      </div>
                  </div>

                  {/* Campo: Versión del Sistema */}
                  <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Versión del Software</label>
                      <div className="flex gap-2">
                          <div className="relative group flex-1">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors">🔢</span>
                              <input 
                                  type="text"
                                  value={systemVersion}
                                  onChange={(e) => setSystemVersion(e.target.value)}
                                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl text-xs font-black text-foreground focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-inner"
                              />
                          </div>
                          <button
                              onClick={handleUpdateSystemVersion}
                              disabled={saving}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-100 dark:shadow-none"
                          >
                              {saving ? "..." : "OK"}
                          </button>
                      </div>
                  </div>
              </div>
          </section>

          {/* 🆘 SECCIÓN DE SOPORTE */}
          <section className="pt-4 border-t border-border border-dashed transition-colors">
            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/50 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-center gap-8 group transition-colors">
              <div className="w-20 h-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white text-3xl shadow-xl shadow-indigo-100 dark:shadow-none transition-transform group-hover:rotate-6">
                🆘
              </div>
              <div className="flex-grow text-center md:text-left">
                <h3 className="text-lg font-black text-foreground uppercase tracking-tight mb-2">¿Necesitas soporte técnico?</h3>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-6 uppercase tracking-tight max-w-xl">
                  Si experimentas problemas con la configuración de identidad o necesitas asistencia técnica especializada, contacta a nuestro equipo.
                </p>
                <a 
                  href="mailto:soporte@softcoinp.com"
                  className="inline-flex px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Contactar Ingeniería <span>➔</span>
                </a>
              </div>
            </div>
          </section>
        </div>
        
        <div className="w-full flex justify-center mt-auto pb-4 shrink-0 px-2 lg:px-0">
           <p className="text-[9px] text-slate-300 dark:text-slate-600 font-black tracking-[0.3em] uppercase text-center">
              Control de Acceso Softcoinp {systemVersion || "..."} • {clientName || "Configuración Global"}
           </p>
        </div>
      </div>
      <CustomModal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({...modal, isOpen: false})} 
        onConfirm={modal.onConfirm}
        title={modal.title} 
        message={modal.message} 
        type={modal.type} 
      />
    </>
  );
}
