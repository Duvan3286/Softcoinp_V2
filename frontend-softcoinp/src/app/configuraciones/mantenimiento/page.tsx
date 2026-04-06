"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, UserPayload } from "@/utils/auth";
import api from "@/services/api";
import CustomModal, { ModalType } from "@/components/CustomModal";
import { settingsService } from "@/services/settingsService";

export default function MantenimientoHubPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [systemVersion, setSystemVersion] = useState("");
  const [clientName, setClientName] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState({ 
    isOpen: false, 
    title: "", 
    message: "", 
    type: "info" as ModalType,
    onConfirm: undefined as (() => void) | undefined 
  });

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.role !== "superadmin") {
      router.push("/configuraciones");
      return;
    }
    setUsuario(user);
    settingsService.getSystemVersion().then(setSystemVersion);
    settingsService.getClientName().then(setClientName);
  }, [router]);

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

  const handleExportConfig = async () => {
    setLoading(true);
    try {
      const response = await api.get("/Maintenance/export-config", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `softcoinp_config_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showModal("✅ Configuración del sistema exportada con éxito.", "success", "Exportación Completada");
    } catch (err: any) {
      showModal("❌ Error al exportar configuración: " + (err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportFullBackup = async () => {
    setLoading(true);
    try {
      const response = await api.get("/Maintenance/export-full-backup", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `softcoinp_full_backup_${new Date().toISOString().slice(0,10)}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showModal("✅ Respaldo completo generado (JSON + SQL) y descargado exitosamente.", "success", "Respaldo Completado");
    } catch (err: any) {
      showModal("❌ Error al generar el respaldo completo: " + (err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
                showModal("❌ Error crítico en restauración: " + (err.response?.data?.error || err.message), "error");
            } finally {
                setLoading(false);
                event.target.value = '';
            }
        }
    );
  };

  return (
    <div className="h-full bg-background p-4 lg:p-12 flex flex-col items-center justify-start overflow-hidden gap-8 transition-colors duration-300">
      <div className="w-full max-w-4xl flex flex-col items-start shrink-0">
        <div className="flex items-center justify-between w-full mb-2">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-600 rounded-2xl text-white shadow-xl shadow-rose-100 dark:shadow-none transition-all hover:rotate-3 hover:scale-110">
                  <span className="text-2xl">🛠️</span>
                </div>
                <div>
                    <h1 className="text-xl lg:text-3xl font-black text-foreground uppercase tracking-tight leading-none">Mantenimiento</h1>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mt-2">Acciones Críticas y Auditoría</p>
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
        <div className="w-full h-px bg-border mt-6 opacity-50 transition-colors"></div>
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-6 overflow-y-auto pr-2 pb-10 custom-scrollbar">
        
        {/* 📋 OPCIÓN: AUDITORÍA (Movida aquí) */}
        <div 
          onClick={() => router.push("/configuraciones/mantenimiento/auditoria")}
          className="w-full bg-card rounded-3xl p-6 border border-border shadow-sm flex items-center gap-6 transition-all hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 hover:border-indigo-100 dark:hover:border-indigo-900 cursor-pointer group"
        >
          <div className="w-14 h-14 shrink-0 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-all group-hover:scale-110">
            📋
          </div>
          <div className="flex-1">
              <h2 className="text-base font-black text-foreground uppercase tracking-tight group-hover:text-indigo-600 transition-colors">Registro de Auditoría</h2>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-tighter opacity-70">
                Visualiza la bitácora completa de actividad y cambios en el sistema.
              </p>
          </div>
          <div className="text-indigo-400 font-bold group-hover:translate-x-2 transition-transform">→</div>
        </div>

        <div className="h-px bg-border my-2 opacity-50 transition-colors"></div>

        {/* 🏢 IDENTIDAD Y VERSIÓN (Migrado aquí) */}
        <section className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm animate-in fade-in slide-in-from-top duration-500 transition-colors">
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

        <div className="h-px bg-border my-2 opacity-50 transition-colors"></div>

        {/* ACCIONES DE BORRADO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={handleDeepClean}
              className="bg-card rounded-3xl p-6 border border-border shadow-sm flex flex-col gap-4 transition-all hover:border-rose-200 dark:hover:border-rose-900 group cursor-pointer"
            >
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110">🧹</div>
              <div>
                <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1 group-hover:text-rose-600 transition-colors">Deep Clean & Seed</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Borrado total de datos y restauración de fábrica.</p>
              </div>
            </div>

            <div 
              onClick={() => {
                  showModal(
                      "¿Seguro que deseas borrar solo datos operativos (personal y registros)?",
                      "confirm",
                      "Limpieza Operativa",
                      () => { api.post("/Maintenance/clear-operational-data").then(() => showModal("Datos borrados.", "success")); }
                  );
              }}
              className="bg-card rounded-3xl p-6 border border-border shadow-sm flex flex-col gap-4 transition-all hover:border-orange-200 dark:hover:border-orange-900 group cursor-pointer"
            >
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110">🗑️</div>
              <div>
                <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-1 group-hover:text-orange-600 transition-colors">Borrar Datos Operativos</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Elimina personal y registros sin afectar usuarios.</p>
              </div>
            </div>
        </div>

        {/* BACKUPS (ACTUALIZADO) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Botón: Exportar Configuración */}
            <div 
              onClick={handleExportConfig}
              className="bg-card rounded-3xl p-5 border border-border shadow-sm flex flex-col items-center gap-3 transition-all hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 cursor-pointer group text-center"
            >
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-110">⚙️</div>
              <div className="flex-1">
                <h3 className="text-[10px] font-black text-foreground uppercase tracking-tight group-hover:text-indigo-600 transition-colors">Configuración</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">JSON (Solo ajustes)</p>
              </div>
            </div>

            {/* Botón: Backup Completo */}
            <div 
              onClick={handleExportFullBackup}
              className="bg-card rounded-3xl p-5 border border-border shadow-sm flex flex-col items-center gap-3 transition-all hover:bg-rose-50/20 dark:hover:bg-rose-900/10 cursor-pointer group text-center border-rose-100/50 dark:border-rose-900/30"
            >
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-110">📦</div>
              <div className="flex-1">
                <h3 className="text-[10px] font-black text-foreground uppercase tracking-tight group-hover:text-rose-600 transition-colors">Backup Completo</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">ZIP (JSON + SQL)</p>
              </div>
            </div>

            {/* Botón: Restaurar */}
            <div className="relative group">
              <input type="file" accept=".json" onChange={handleImportBackup} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="bg-card rounded-3xl p-5 border border-border shadow-sm flex flex-col items-center gap-3 transition-all group-hover:bg-emerald-50/20 dark:group-hover:bg-emerald-900/10 h-full text-center">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-110">🔄</div>
                <div className="flex-1">
                  <h3 className="text-[10px] font-black text-foreground uppercase tracking-tight group-hover:text-emerald-600 transition-colors">Restaurar JSON</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cargar respaldo JSON</p>
                </div>
              </div>
            </div>
        </div>

      </div>

      <div className="w-full flex justify-center mt-auto pb-4 shrink-0">
         <p className="text-[9px] text-slate-300 dark:text-slate-600 font-black tracking-[0.3em] uppercase">
            Softcoinp {systemVersion || "..."} • Módulo de Mantenimiento
         </p>
      </div>

      <CustomModal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({...modal, isOpen: false})} 
        onConfirm={modal.onConfirm}
        title={modal.title} 
        message={modal.message} 
        type={modal.type} 
      />
    </div>
  );
}
