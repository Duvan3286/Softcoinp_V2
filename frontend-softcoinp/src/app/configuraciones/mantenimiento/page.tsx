"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, UserPayload } from "@/utils/auth";
import api from "@/services/api";
import CustomModal, { ModalType } from "@/components/CustomModal";
import ClearDataModal from "@/components/ClearDataModal";
import { settingsService } from "@/services/settingsService";
import { Wrench, ClipboardList, ArrowRight, Tags, Eraser, Trash2, BarChart, Mail, Settings, Archive, FileJson, Database } from "lucide-react";

export default function MantenimientoHubPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [systemVersion, setSystemVersion] = useState("");
  const [clientName, setClientName] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
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

    // Cargar config SMTP
    api.get("/Settings").then(res => {
        const settings = (res.data as any).data || [];
        const email = settings.find((s:any) => s.key === "SmtpEmail")?.value || "";
        const pass = settings.find((s:any) => s.key === "SmtpPassword")?.value || "";
        setSmtpEmail(email);
        setSmtpPassword(pass);
    });
  }, [router]);

  const handleUpdateSmtpConfig = async () => {
    if (!smtpEmail.trim() || !smtpPassword.trim()) {
      showModal("Correo y Contraseña son obligatorios.", "warning");
      return;
    }
    setSaving(true);
    try {
      await settingsService.update({ key: "SmtpEmail", value: smtpEmail });
      await settingsService.update({ key: "SmtpPassword", value: smtpPassword });
      showModal("✅ Configuración de Gmail guardada con éxito.", "success");
    } catch (err: any) {
      showModal("❌ Error al guardar configuración SMTP.", "error");
    } finally {
      setSaving(false);
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
      showModal("✅ Identidad actualizada con éxito.", "success", "Cambio Guardado");
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      showModal("❌ Error al actualizar el nombre.", "error");
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
      showModal("✅ Versión actualizada con éxito.", "success");
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
        "⚠️ ATENCIÓN: Esto borrará TODOS los datos y restaurará usuarios de fábrica.",
        "confirm",
        "Reseteo Crítico",
        async () => {
            setLoading(true);
            try {
              await api.post("/Maintenance/deep-clean-and-seed");
              showModal("✅ Sistema reseteado.", "success");
              setTimeout(() => { localStorage.removeItem("token"); window.location.href = "/login"; }, 3000);
            } catch (err: any) {
              showModal("❌ Error: " + (err.response?.data?.error || err.message), "error");
            } finally { setLoading(false); }
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
      showModal("✅ Configuración exportada (JSON).", "success");
    } catch (err: any) { showModal("❌ Error al exportar.", "error"); }
    finally { setLoading(false); }
  };

  const handleExportFullBackup = async () => {
    setLoading(true);
    try {
      const response = await api.get("/Maintenance/export-full-backup", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `softcoinp_full_backup_${new Date().toISOString().slice(0,10)}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showModal("✅ Backup completo generado (SQL).", "success");
    } catch (err: any) { showModal("❌ Error al generar SQL.", "error"); }
    finally { setLoading(false); }
  };

  const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    showModal(`⚠️ RESTAURAR JSON: Vas a sobrescribir los datos con "${file.name}".`, "confirm", "Restaurar JSON", async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await api.post("/Maintenance/import-json", formData);
            showModal("✅ Restauración JSON exitosa.", "success");
            setTimeout(() => { localStorage.removeItem("token"); window.location.href = "/login"; }, 3000);
        } catch (err: any) { showModal("❌ Error: " + (err.response?.data?.error || err.message), "error"); }
        finally { setLoading(false); event.target.value = ''; }
    });
  };

  const handleImportSql = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    showModal(`⚠️ RESTAURAR SQL: Restauración técnica profunda con "${file.name}".`, "confirm", "Restaurar SQL", async () => {
        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await api.post("/Maintenance/import-sql", formData);
            showModal("✅ Base de datos restaurada desde SQL.", "success");
            setTimeout(() => { localStorage.removeItem("token"); window.location.href = "/login"; }, 3000);
        } catch (err: any) { showModal("❌ Error: " + (err.response?.data?.error || err.message), "error"); }
        finally { setLoading(false); event.target.value = ''; }
    });
  };

  const [targetEmail, setTargetEmail] = useState("");

  const handleSendManualReport = async () => {
    setLoading(true);
    try {
      await api.post("/Maintenance/enviar-reporte-analitico", { email: targetEmail });
      showModal(`✅ Reporte enviado con éxito${targetEmail ? ` a ${targetEmail}` : " al administrador"}.`, "success", "Inteligencia Enviada");
      setTargetEmail("");
    } catch (err: any) {
      showModal("❌ Error al enviar reporte: " + (err.response?.data?.error || err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClear = async (options: any) => {
    setLoading(true);
    try {
      await api.post("/Maintenance/clear-operational-data", options);
      showModal("✅ Limpieza selectiva completada.", "success");
      setIsClearModalOpen(false);
    } catch (err: any) { showModal("❌ Error: " + (err.response?.data?.error || err.message), "error"); }
    finally { setLoading(false); }
  };


  return (
    <div className="h-full bg-background p-4 lg:p-12 flex flex-col items-center justify-start overflow-hidden gap-8 transition-colors duration-300">
      <div className="w-full max-w-4xl flex flex-col items-start shrink-0">
        <div className="flex items-center justify-between w-full mb-2">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl shadow-sm transition-transform hover:scale-110 flex-shrink-0">
                  <Wrench className="w-7 h-7" />
                </div>
                <div>
                    <h1 className="text-xl lg:text-3xl font-black text-foreground uppercase tracking-tight">Mantenimiento</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2">Acciones Críticas</p>
                </div>
            </div>
            <button onClick={() => router.push("/configuraciones")} className="bg-card text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 py-2 px-4 rounded-xl font-black border border-border shadow-sm text-[10px] uppercase tracking-widest transition-all active:scale-95">Volver</button>
        </div>
        <div className="w-full h-px bg-border mt-6 opacity-50"></div>
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-6 overflow-y-auto pr-2 pb-10 custom-scrollbar">
        
        <div onClick={() => router.push("/configuraciones/mantenimiento/auditoria")} className="w-full bg-card rounded-xl p-6 border border-border shadow-sm flex items-center gap-6 cursor-pointer group hover:border-cyan-500 transition-all">
          <div className="w-14 h-14 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 shrink-0"><ClipboardList className="w-7 h-7" /></div>
          <div className="flex-1">
              <h2 className="text-base font-black text-foreground uppercase tracking-tight">Registro de Auditoría</h2>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter opacity-70">Bitácora completa de actividad.</p>
          </div>
          <div className="text-cyan-400 font-bold group-hover:translate-x-2 transition-transform"><ArrowRight className="w-5 h-5" /></div>
        </div>

        <section className="bg-card border border-border rounded-xl p-6 lg:p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 rounded-xl flex items-center justify-center shrink-0"><Tags className="w-6 h-6" /></div>
                <h2 className="text-sm font-black text-foreground uppercase tracking-tight">Identidad Visual</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Institución</label>
                    <div className="flex gap-2">
                        <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value.toUpperCase())} className="w-full px-4 py-3 bg-input border border-border rounded-xl text-xs font-black uppercase outline-none focus:border-cyan-500 transition-all" />
                        <button onClick={handleUpdateClientName} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-xl font-black text-[9px] uppercase shadow-sm transition-all active:scale-95">OK</button>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Versión</label>
                    <div className="flex gap-2">
                        <input type="text" value={systemVersion} onChange={(e) => setSystemVersion(e.target.value)} className="w-full px-4 py-3 bg-input border border-border rounded-xl text-xs font-black outline-none focus:border-cyan-500 transition-all" />
                        <button onClick={handleUpdateSystemVersion} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-xl font-black text-[9px] uppercase shadow-sm transition-all active:scale-95">OK</button>
                    </div>
                </div>
            </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div onClick={handleDeepClean} className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col gap-4 cursor-pointer hover:border-rose-500 group transition-all">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"><Eraser className="w-6 h-6" /></div>
              <h3 className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-rose-600">Deep Clean & Seed</h3>
            </div>
            <div onClick={() => setIsClearModalOpen(true)} className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col gap-4 cursor-pointer hover:border-orange-500 group transition-all">
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"><Trash2 className="w-6 h-6" /></div>
              <h3 className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-orange-600">Borrar Datos Operativos</h3>
            </div>
        </div>

        <section className="bg-card border border-border rounded-xl p-6 lg:p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 rounded-xl flex items-center justify-center shrink-0"><BarChart className="w-6 h-6" /></div>
                <h2 className="text-sm font-black text-foreground uppercase tracking-tight">Inteligencia de Datos</h2>
            </div>
            <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Generar informe analítico del mes anterior a demanda.</p>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Correo Electrónico Opcional</label>
                        <input 
                            type="email" 
                            placeholder="Dejar vacío para el Admin"
                            value={targetEmail} 
                            onChange={(e) => setTargetEmail(e.target.value)} 
                            className="w-full px-4 py-3 bg-input border border-border rounded-xl text-xs font-black outline-none focus:border-cyan-500 transition-all" 
                        />
                    </div>
                    <div className="flex items-end">
                        <button 
                            onClick={handleSendManualReport} 
                            disabled={loading} 
                            className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all disabled:opacity-50 active:scale-95"
                        >
                            {loading ? "Enviando..." : "Enviar Reporte Ahora"}
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <section className="bg-card border border-cyan-500/30 rounded-xl p-6 lg:p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 rounded-xl flex items-center justify-center shrink-0"><Mail className="w-6 h-6" /></div>
                <h2 className="text-sm font-black text-foreground uppercase tracking-tight">Configuración de Mensajería (Gmail)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Correo Emisor</label>
                    <input 
                        type="email" 
                        placeholder="tu-cuenta@gmail.com"
                        value={smtpEmail} 
                        onChange={(e) => setSmtpEmail(e.target.value)} 
                        className="w-full px-4 py-3 bg-input border border-border rounded-xl text-xs font-black outline-none focus:border-cyan-500 transition-all" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contraseña de Aplicación</label>
                    <div className="flex gap-2">
                        <input 
                            type="password" 
                            placeholder="•••• •••• •••• ••••"
                            value={smtpPassword} 
                            onChange={(e) => setSmtpPassword(e.target.value)} 
                            className="w-full px-4 py-3 bg-input border border-border rounded-xl text-xs font-black outline-none focus:border-cyan-500 transition-all" 
                        />
                        <button 
                            onClick={handleUpdateSmtpConfig} 
                            disabled={saving} 
                            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            {saving ? "..." : "Guardar"}
                        </button>
                    </div>
                </div>
            </div>
            <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase leading-relaxed opacity-70">
                ⚠️ IMPORTANTE: Utiliza una "Contraseña de Aplicación" generada en tu cuenta de Google. No uses tu contraseña personal.
            </p>
        </section>


        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 mt-4">Gestión de Respaldos</h2>

        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div onClick={handleExportConfig} className="bg-card rounded-xl p-5 border border-border shadow-sm flex flex-col items-center gap-3 cursor-pointer group hover:bg-cyan-50/20 transition-all">
              <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"><Settings className="w-5 h-5" /></div>
              <div className="flex-1 text-center">
                <h3 className="text-[10px] font-black text-foreground uppercase tracking-tight group-hover:text-cyan-600">Exportar Configuración</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Solo Ajustes (JSON)</p>
              </div>
            </div>
            <div onClick={handleExportFullBackup} className="bg-card rounded-xl p-5 border border-rose-100/50 dark:border-rose-900/30 shadow-sm flex flex-col items-center gap-3 cursor-pointer group hover:bg-rose-50/20 transition-all">
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"><Archive className="w-5 h-5" /></div>
              <div className="flex-1 text-center">
                <h3 className="text-[10px] font-black text-foreground uppercase tracking-tight group-hover:text-rose-600">Exportar Backup Completo</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Base de Datos Total (SQL)</p>
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div onClick={() => document.getElementById('input-restore-json')?.click()} className="bg-card rounded-xl p-5 border border-border shadow-sm flex flex-col items-center gap-3 cursor-pointer group hover:bg-emerald-50/20 transition-all">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"><FileJson className="w-5 h-5" /></div>
              <div className="flex-1 text-center">
                <h3 className="text-[10px] font-black text-foreground uppercase tracking-tight group-hover:text-emerald-600">Restaurar JSON</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cargar configuración o datos</p>
              </div>
              <input id="input-restore-json" type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </div>
            <div onClick={() => document.getElementById('input-restore-sql')?.click()} className="bg-card rounded-xl p-5 border border-amber-100/50 dark:border-amber-900/30 shadow-sm flex flex-col items-center gap-3 cursor-pointer group hover:bg-amber-50/20 transition-all">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"><Database className="w-5 h-5" /></div>
              <div className="flex-1 text-center">
                <h3 className="text-[10px] font-black text-foreground uppercase tracking-tight group-hover:text-amber-600">Restaurar SQL</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cargar volcado de base de datos</p>
              </div>
              <input id="input-restore-sql" type="file" accept=".sql" onChange={handleImportSql} className="hidden" />
            </div>
        </div>

      </div>

      <ClearDataModal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} onConfirm={handleConfirmClear} loading={loading} />
      <CustomModal isOpen={modal.isOpen} onClose={() => setModal({...modal, isOpen: false})} onConfirm={modal.onConfirm} title={modal.title} message={modal.message} type={modal.type} />
    </div>
  );
}
