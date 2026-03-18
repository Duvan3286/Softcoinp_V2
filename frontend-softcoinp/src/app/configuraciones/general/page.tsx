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
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" as ModalType });

  useEffect(() => {
    setUsuario(getCurrentUser());
  }, []);

  const showModal = (message: string, type: ModalType, title?: string) => {
    setModal({ isOpen: true, message, type, title: title || "Aviso" });
  };

  const systemInfo = [
    { label: "Nombre del Sistema", value: "SOFTCOINP" },
    { label: "Versión", value: "2.1.5-prod" },
    { label: "Ambiente", value: "Producción Local" },
    { label: "Base de Datos", value: "PostgreSQL / Entity Framework Core" },
    { label: "Rol Actual", value: usuario?.role.toUpperCase() || "CARGANDO..." }
  ];

  const handleDeepClean = async () => {
    if (!window.confirm("⚠️ ATENCIÓN: Esto borrará TODOS los datos (Personal, Registros, Auditoría) y restaurará los usuarios de fábrica. ¿Estás absolutamente seguro?")) return;

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
  };

  return (
    <>
      <div className="h-screen bg-gray-50 p-6 overflow-hidden flex flex-col">
        <div className="max-w-3xl mx-auto w-full h-full flex flex-col">
          <button 
            onClick={() => router.push("/configuraciones")}
            className="bg-blue-600 text-white py-1.5 px-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition duration-200 flex items-center text-sm shrink-0 mb-6 w-fit"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              {/* 🛠️ SECCIÓN DE MANTENIMIENTO (Solo SuperAdmin y con flag) */}
              {usuario?.role === "superadmin" && isMaintMode && (
                <section className="pt-6 border-t-4 border-red-100 animate-in fade-in slide-in-from-bottom duration-500">
                  <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 relative overflow-hidden">
                    <div className="relative z-10">
                      <h2 className="text-red-800 text-xl font-black uppercase tracking-tighter mb-4 flex items-center gap-2">
                         <span>🛠️</span> MANTENIMIENTO CRÍTICO (SUPERADMIN)
                      </h2>
                      <p className="text-red-700 text-sm font-bold mb-6 max-w-xl">
                        Estas opciones modifican directamente la estructura y datos base del sistema. 
                        Úselas con extrema precaución; los cambios pueden ser irreversibles.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={handleDeepClean}
                          disabled={loading}
                          className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-2xl font-black text-center shadow-xl shadow-red-200 transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center"
                        >
                          <span className="text-2xl mb-1">🧹</span>
                          DEEP CLEAN & SEED
                          <span className="text-[9px] font-normal mt-1 opacity-80">(Borra todo, restaura Admin dev)</span>
                        </button>

                        <button
                          onClick={() => api.post("/Maintenance/clear-operational-data").then(() => showModal("Datos operativos borrados. Usuarios conservados.", "success"))}
                          disabled={loading}
                          className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-2xl font-black text-center shadow-xl shadow-orange-200 transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center"
                        >
                          <span className="text-2xl mb-1">🗑️</span>
                          BORRAR OPERATIVOS
                          <span className="text-[9px] font-normal mt-1 opacity-80">(Personal y Registros únicamente)</span>
                        </button>
                      </div>
                    </div>
                    <div className="absolute -right-10 -bottom-10 text-[180px] font-black text-red-600 opacity-5 select-none pointer-events-none">
                      DANGER
                    </div>
                  </div>
                </section>
              )}

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
      <CustomModal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({...modal, isOpen: false})} 
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
