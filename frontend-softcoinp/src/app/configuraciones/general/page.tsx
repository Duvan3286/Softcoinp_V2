"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser, UserPayload } from "@/utils/auth";
import api from "@/services/api";
import CustomModal, { ModalType } from "@/components/CustomModal";
import { settingsService } from "@/services/settingsService";

function GeneralContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMaintMode = searchParams.get("mantenimiento") === "true";

  const [usuario, setUsuario] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(false);
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

  const handleExportBackup = async () => {
    setLoading(true);
    try {
      const response = await api.get("/Maintenance/export-backup", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement("a");
      link.href = url;
      // Extraer nombre del archivo sugerido si viene en los headers (opcional)
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `softcoinp_backup_${new Date().toISOString().slice(0,10)}.json`;
      if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
          if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
      }
      
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showModal("✅ Backup generado y descargado exitosamente.", "success", "Exportación Completada");
    } catch (err: any) {
      showModal("❌ Error al descargar el backup: " + (err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        showModal("El archivo seleccionado no es un JSON válido.", "warning", "Formato Incorrecto");
        return;
    }

    showModal(
        `⚠️ ATENCIÓN: Estás a punto de sobrescribir toda la base de datos con el archivo "${file.name}". Esta acción borrará el estado actual y no se puede deshacer.`,
        "confirm",
        "Restaurar Sistema",
        async () => {
            setLoading(true);
            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await api.post<{message: string}>("/Maintenance/import-backup", formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                showModal("✅ " + (res.data.message || "Sistema restaurado con éxito. Cerrando sesión..."), "success", "Restauración Completada");
                setTimeout(() => {
                    localStorage.removeItem("token");
                    window.location.href = "/login";
                }, 4000);
            } catch (err: any) {
                const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || "Error desconocido";
                showModal("❌ Error crítico en restauración: " + errorMessage, "error", "Fallo de Restauración");
            } finally {
                setLoading(false);
                // Limpiar el input para permitir volver a seleccionar el mismo archivo si es necesario
                event.target.value = '';
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
                        {isMaintMode ? "Acciones de sistema y depuración" : "Personalización y ajustes globales"}
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
          
          {/* ℹ️ INFORMACIÓN DEL SISTEMA */}
          {!isMaintMode && (
            <section className="animate-in fade-in slide-in-from-top duration-500">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Detalles Técnicos y Versión</h2>
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

          {/* 🛠️ ACCIONES DE MANTENIMIENTO */}
          {usuario?.role === "superadmin" && isMaintMode && (
            <section className="animate-in fade-in slide-in-from-bottom duration-500">

               {/* 🏢 PERSONALIZACIÓN AVANZADA (Marca y Versión) */}
               <section className="bg-white border border-slate-200/60 rounded-3xl p-6 lg:p-8 shadow-sm mb-6 animate-in fade-in slide-in-from-top duration-500">
                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🏷️</div>
                      <div>
                          <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Identidad y Versión</h2>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control visual de la marca y versión del sistema</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Campo: Nombre del Cliente */}
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre de la Institución</label>
                          <div className="flex gap-2">
                              <div className="relative group flex-1">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">🏛️</span>
                                  <input 
                                      type="text"
                                      value={clientName}
                                      onChange={(e) => setClientName(e.target.value.toUpperCase())}
                                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all uppercase shadow-inner"
                                  />
                              </div>
                              <button
                                  onClick={handleUpdateClientName}
                                  disabled={saving}
                                  className="bg-slate-800 hover:bg-black text-white px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                              >
                                  {saving ? "..." : "OK"}
                              </button>
                          </div>
                      </div>

                      {/* Campo: Versión del Sistema */}
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Versión del Sistema</label>
                          <div className="flex gap-2">
                              <div className="relative group flex-1">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">🔢</span>
                                  <input 
                                      type="text"
                                      value={systemVersion}
                                      onChange={(e) => setSystemVersion(e.target.value)}
                                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-inner"
                                  />
                              </div>
                              <button
                                  onClick={handleUpdateSystemVersion}
                                  disabled={saving}
                                  className="bg-slate-800 hover:bg-black text-white px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                              >
                                  {saving ? "..." : "OK"}
                              </button>
                          </div>
                      </div>
                  </div>
               </section>

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

                  {/* SEPARADOR VISUAL PARA BACKUPS */}
                  <div className="flex items-center gap-4 my-4 opacity-50">
                    <div className="h-px bg-slate-300 flex-1"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestión de Backups</span>
                    <div className="h-px bg-slate-300 flex-1"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Fila: Descargar Backup */}
                      <div 
                        onClick={handleExportBackup}
                        className="w-full bg-indigo-50/30 rounded-2xl p-4 border border-indigo-100/50 shadow-sm flex items-center gap-4 transition-all hover:bg-indigo-50 hover:border-indigo-200 hover:shadow-md cursor-pointer group"
                      >
                        <div className="w-10 h-10 shrink-0 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-lg shadow-inner transition-transform group-hover:scale-110">
                          💾
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">DESCARGAR BACKUP</h2>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 truncate uppercase tracking-tight">
                                Exportar base de datos a JSON
                            </p>
                        </div>
                      </div>

                      {/* Fila: Restaurar Backup */}
                      <div className="relative">
                        <input 
                            type="file" 
                            accept=".json,application/json" 
                            onChange={handleImportBackup} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                            title="Seleccionar archivo JSON"
                        />
                        <div className="w-full bg-emerald-50/30 rounded-2xl p-4 border border-emerald-100/50 shadow-sm flex items-center gap-4 transition-all hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-md group">
                            <div className="w-10 h-10 shrink-0 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-lg shadow-inner transition-transform group-hover:scale-110">
                            🔄
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-700 transition-colors">RESTAURAR SISTEMA</h2>
                                <p className="text-[9px] font-bold text-slate-400 mt-1 truncate uppercase tracking-tight">
                                    Cargar archivo JSON
                                </p>
                            </div>
                        </div>
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
              Control de Acceso Softcoinp {systemVersion || "..."} • {clientName || "Panel de Administración Profesional"}
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
