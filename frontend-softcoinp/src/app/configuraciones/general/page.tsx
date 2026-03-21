"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser, UserPayload } from "@/utils/auth";
import api from "@/services/api";
import CustomModal, { ModalType } from "@/components/CustomModal";

function GeneralContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMaintMode = searchParams.get("mantenimiento") === "true";

  const [usuario, setUsuario] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ 
    isOpen: false, 
    title: "", 
    message: "", 
    type: "info" as ModalType,
    onConfirm: undefined as (() => void) | undefined 
  });

  useEffect(() => {
    setUsuario(getCurrentUser());
  }, []);

  const showModal = (message: string, type: ModalType, title?: string, onConfirm?: () => void) => {
    setModal({ isOpen: true, message, type, title: title || "Aviso", onConfirm });
  };

  const systemInfo = [
    { label: "Nombre del Sistema", value: "SOFTCOINP" },
    { label: "Versión", value: "2.1.5-prod" },
    { label: "Ambiente", value: "Producción Local" },
    { label: "Base de Datos", value: "PostgreSQL / Entity Framework Core" },
    { label: "Rol Actual", value: usuario?.role.toUpperCase() || "CARGANDO..." }
  ];

  const handleDeepClean = async () => {
    showModal(
        "⚠️ ATENCIÓN: Esto borrará TODOS los datos (Personal, Registros, Auditoría) y restaurará los usuarios de fábrica. Esta acción es irreversible.",
        "confirm",
        "Reseteo Crítico",
        async () => {
            setLoading(true);
            try {
              await api.post("/Maintenance/deep-clean-and-seed");
              showModal("✅ Sistema reseteado con éxito. Por favor, vuelve a iniciar sesión.", "success", "Reseteo Completo");
              setTimeout(() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }, 3000);
            } catch (err: any) {
              showModal("❌ Error al realizar el mantenimiento: " + (err.response?.data?.error || err.message), "error");
            } finally {
              setLoading(false);
            }
        }
    );
  };

  return (
    <>
      <div className="h-full bg-slate-50 p-4 lg:p-12 flex flex-col items-center justify-start overflow-hidden gap-8">
        <div className="w-full max-w-4xl flex flex-col items-start shrink-0">
          <div className="flex items-center justify-between w-full mb-2">
            <div className="flex items-center gap-4">
                <div className={`p-2.5 ${isMaintMode ? "bg-rose-600 shadow-rose-100" : "bg-indigo-600 shadow-indigo-100"} rounded-xl text-white shadow-lg transition-transform hover:scale-110`}>
                  <span className="text-xl">{isMaintMode ? "🛠️" : "⚙️"}</span>
                </div>
                <div>
                    <h1 className="text-xl lg:text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">
                        {isMaintMode ? "Mantenimiento Crítico" : "Configuración General"}
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">
                        {isMaintMode ? "Acciones de sistema y depuración" : "Información técnica y ajustes globales"}
                    </p>
                </div>
            </div>
            <button 
                onClick={() => router.push("/configuraciones")}
                className="bg-white text-slate-500 hover:text-indigo-600 py-2 px-4 rounded-xl font-black border border-slate-200 shadow-sm transition-all active:scale-95 flex items-center gap-2 text-[10px] uppercase tracking-widest"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Volver
              </button>
          </div>
          <div className="w-full h-px bg-slate-200 mt-4 opacity-50"></div>
        </div>

        <div className="w-full max-w-4xl flex flex-col gap-8 overflow-y-auto pr-1 pb-10 custom-scrollbar">
          {/* ℹ️ INFORMACIÓN DEL SISTEMA (Solo si NO es mantenimiento) */}
          {!isMaintMode && (
            <section className="animate-in fade-in slide-in-from-top duration-500">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Información del Sistema</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {systemInfo.map((info, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-indigo-100 group">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 group-hover:text-indigo-400 transition-colors">{info.label}</p>
                    <p className="text-[12px] font-black text-slate-700 leading-tight uppercase">{info.value}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 🛠️ ACCIONES DE MANTENIMIENTO (Estilo Renglones) */}
          {usuario?.role === "superadmin" && isMaintMode && (
            <section className="animate-in fade-in slide-in-from-bottom duration-500">
               <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-6 lg:p-8 mb-6">
                  <p className="text-rose-800 text-[11px] font-black uppercase tracking-widest leading-relaxed flex items-center gap-2 mb-2">
                    <span className="text-lg">⚠️</span> ADVERTENCIA DE SEGURIDAD
                  </p>
                  <p className="text-rose-600/80 text-[10px] lg:text-[11px] font-bold uppercase tracking-tight max-w-3xl">
                    Las acciones a continuación modifican directamente la base de datos de forma irreversible. 
                    El sistema quedará temporalmente fuera de servicio durante el procesamiento.
                  </p>
               </div>

               <div className="flex flex-col gap-3">
                  {/* Fila: Deep Clean */}
                  <div 
                    onClick={handleDeepClean}
                    className="w-full bg-white rounded-2xl p-4 lg:px-8 lg:py-5 border border-slate-100 shadow-sm flex items-center gap-4 lg:gap-8 transition-all hover:bg-rose-50/40 hover:border-rose-100 hover:shadow-md cursor-pointer group"
                  >
                    <div className="w-12 h-12 shrink-0 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-xl shadow-inner transition-all group-hover:scale-110">
                      🧹
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-rose-600 transition-colors">DEEP CLEAN & SEED</h2>
                        <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 mt-1 truncate uppercase tracking-tight">
                        BORRADO TOTAL DE DATOS Y RESTAURACIÓN DE USUARIOS DE FÁBRICA
                        </p>
                    </div>
                    <div className="px-5 py-2.5 rounded-xl text-white text-[9px] font-black uppercase tracking-widest bg-rose-600 shadow-lg shadow-rose-100 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 hidden sm:block">
                        EJECUTAR RESETEO <span>➔</span>
                    </div>
                  </div>

                  {/* Fila: Borrar Operativos */}
                  <div 
                    onClick={() => {
                        showModal(
                            "¿Seguro que deseas borrar solo datos operativos (personal y registros)? Los usuarios se conservarán.",
                            "confirm",
                            "Limpieza Operativa",
                            () => {
                                api.post("/Maintenance/clear-operational-data")
                                   .then(() => showModal("Datos operativos borrados con éxito.", "success"));
                            }
                        );
                    }}
                    className="w-full bg-white rounded-2xl p-4 lg:px-8 lg:py-5 border border-slate-100 shadow-sm flex items-center gap-4 lg:gap-8 transition-all hover:bg-orange-50/40 hover:border-orange-100 hover:shadow-md cursor-pointer group"
                  >
                    <div className="w-12 h-12 shrink-0 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center text-xl shadow-inner transition-all group-hover:scale-110">
                      🗑️
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-orange-600 transition-colors">BORRAR DATOS OPERATIVOS</h2>
                        <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 mt-1 truncate uppercase tracking-tight">
                        ELIMINAR PERSONAL Y REGISTROS SIN AFECTAR CUENTAS DE USUARIO
                        </p>
                    </div>
                    <div className="px-5 py-2.5 rounded-xl text-white text-[9px] font-black uppercase tracking-widest bg-orange-500 shadow-lg shadow-orange-100 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 hidden sm:block">
                        BORRAR DATOS <span>➔</span>
                    </div>
                  </div>
               </div>
            </section>
          )}

          {/* 🆘 SECCIÓN DE SOPORTE (Solo si NO es mantenimiento) */}
          {!isMaintMode && (
            <section className="pt-4 border-t border-slate-200 border-dashed">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-center gap-8 group">
                <div className="w-20 h-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white text-3xl shadow-xl shadow-indigo-100 transition-transform group-hover:rotate-6">
                  🆘
                </div>
                <div className="flex-grow text-center md:text-left">
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">¿Necesitas soporte avanzado?</h3>
                  <p className="text-[11px] font-bold text-slate-400 mb-6 uppercase tracking-tight max-w-xl">
                    Si experimentas problemas técnicos o necesitas realizar un mantenimiento que no está listado, escribe a nuestro equipo de ingenieros.
                  </p>
                  <a 
                    href="mailto:soporte@softcoinp.com"
                    className="inline-flex px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    Contactar Soporte Técnico <span>➔</span>
                  </a>
                </div>
              </div>
            </section>
          )}
        </div>
        
        <div className="w-full flex justify-center mt-auto pb-4 shrink-0">
           <p className="text-[9px] text-slate-300 font-black tracking-[0.3em] uppercase">
              SOFTCOINP v2 • Sistema de Gestión de Infraestructura
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

export default function GeneralPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Cargando configuración...</p>
      </div>
    }>
      <GeneralContent />
    </Suspense>
  );
}
