"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auditService, AuditLog } from "@/services/auditService";
import { getCurrentUser } from "@/utils/auth";
import { settingsService } from "@/services/settingsService";

export default function AuditoriaPage() {
  const router = useRouter();
  
  // 🔒 Seguridad: Solo SuperAdmin
  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== "superadmin") {
      router.push("/configuraciones");
    }
  }, [router]);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [systemVersion, setSystemVersion] = useState("");
  const [clientName, setClientName] = useState("");

  // Filtros
  const [actionFilter, setActionFilter] = useState("");
  const [desdeFilter, setDesdeFilter] = useState("");
  const [hastaFilter, setHastaFilter] = useState("");

  const actionNames: Record<string, string> = {
    "UserCreated": "Usuario Creado",
    "UserUpdated": "Usuario Modificado",
    "UserDeleted": "Usuario Eliminado",
    "PasswordChanged": "Contraseña Cambiada",
    "UserPasswordReset": "Reseteo de Contraseña",
    "TipoPersonalCreated": "Tipo de Personal Creado",
    "TipoPersonalUpdated": "Tipo de Personal Modificado",
    "TipoPersonalDeleted": "Tipo de Personal Eliminado",
    "RegistroCreated": "Nuevo Ingreso (Entrada)",
    "RegistroSalida": "Salida Registrada",
    "RegistrosExportCsv": "Documento CSV Exportado",
    "RegistrosExportExcel": "Documento Excel Exportado",
    "AnotacionCreated": "Nota/Observación Creada",
    "AnotacionUpdated": "Nota/Observación Modificada",
    "AnotacionDeleted": "Nota/Observación Eliminada",
    "Login": "Inicio de Sesión",
    "LoginFailed": "Intento de Conexión Fallido"
  };

  const getFriendlyAction = (action: string) => actionNames[action] || action;

  const getLogDetail = (log: AuditLog) => {
    if (!log.data) return "-";
    try {
      const data = JSON.parse(log.data);
      // Prioridad de campos para mostrar como detalle
      return data.Nombre || data.NombreCompleto || data.Email || data.Documento || data.nombre || data.email || data.documento || "-";
    } catch {
      return "-";
    }
  };

  useEffect(() => {
    loadLogs();
    settingsService.getSystemVersion().then(setSystemVersion);
    settingsService.getClientName().then(setClientName);
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getLogs({ 
        page: 1, 
        pageSize: 50,
        action: actionFilter || undefined,
        desde: desdeFilter || undefined,
        hasta: hastaFilter || undefined
      });
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      console.error("Error al cargar logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const getActionBadge = (action: string) => {
    const commonStyles = "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider";
    if (action.includes("Created")) return `${commonStyles} bg-green-100 text-green-700`;
    if (action.includes("Deleted")) return `${commonStyles} bg-red-100 text-red-700`;
    if (action.includes("Updated")) return `${commonStyles} bg-blue-100 text-blue-700`;
    if (action.includes("Login")) return `${commonStyles} bg-purple-100 text-purple-700`;
    return `${commonStyles} bg-gray-100 text-gray-700`;
  };

  return (
    <div className="h-full bg-slate-50 p-4 lg:p-12 flex flex-col items-center justify-start overflow-hidden gap-8 font-sans">
      <div className="w-full max-w-5xl flex flex-col items-start shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between w-full gap-4">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-100 transition-transform hover:scale-110">
                    <span className="text-xl">📋</span>
                </div>
                <div>
                    <h1 className="text-xl lg:text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Auditoría del Sistema</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Bitácora de actividad administrativa</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button 
                  onClick={() => router.push("/configuraciones")}
                  className="bg-white text-slate-500 hover:text-indigo-600 py-2 px-4 rounded-xl font-black border border-slate-200 shadow-sm transition-all active:scale-95 flex items-center gap-2 text-[10px] uppercase tracking-widest"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Volver
                </button>
            </div>
        </div>
        <div className="w-full h-px bg-slate-200 mt-4 mb-2 opacity-50"></div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 w-full animate-in fade-in slide-in-from-top duration-300">
             <select 
                className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-tight focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none min-w-[200px] shadow-sm flex-1 lg:flex-none transition-all"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="">Todas las acciones</option>
                {Object.entries(actionNames).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              <input 
                type="date" 
                className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm flex-1 lg:flex-none transition-all"
                value={desdeFilter}
                onChange={(e) => setDesdeFilter(e.target.value)}
              />
              <button 
                onClick={loadLogs}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Buscar
              </button>
        </div>
      </div>

      <main className="w-full max-w-5xl flex flex-col min-h-0 overflow-y-auto pr-1 pb-10 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Cargando logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
            <span className="text-4xl mb-4 opacity-20">🔎</span>
            <p className="text-[10px] font-black uppercase tracking-widest">No hay registros que coincidan</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="w-full bg-white rounded-2xl p-4 lg:px-6 lg:py-3 border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:bg-blue-50/40 hover:border-blue-100 group"
              >
                {/* Hora mini */}
                <div className="w-16 shrink-0 flex flex-col items-center justify-center border-r border-slate-100 pr-4">
                    <span className="text-[10px] font-black text-slate-800 leading-none">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">
                        {new Date(log.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                    </span>
                </div>

                {/* Acción y Badge */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <span className={getActionBadge(log.action)}>
                          {getFriendlyAction(log.action)}
                        </span>
                        <h2 className="text-[11px] font-black text-slate-700 uppercase tracking-tight truncate group-hover:text-blue-600 transition-colors">
                            {getLogDetail(log)}
                        </h2>
                    </div>
                </div>

                {/* Usuario */}
                <div className="hidden sm:flex items-center gap-2 px-4 border-l border-slate-100">
                    <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-[9px] font-black text-slate-400 uppercase">
                        {log.userName?.substring(0, 1) || "S"}
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter truncate max-w-[100px]">
                        {log.userName || "SISTEMA"}
                    </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className="w-full max-w-5xl flex justify-between items-center mt-auto pb-4 shrink-0 px-2 lg:px-0">
         <p className="text-[9px] text-slate-300 font-black tracking-[0.3em] uppercase">
            Control de Acceso Softcoinp {systemVersion || "..."} • {clientName || "Registro de Auditoría"}
         </p>
         <div className="flex items-center gap-4">
            <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-200/50 px-3 py-1 rounded-lg">Total: {total}</span>
            <button 
              onClick={() => {
                setActionFilter("");
                setDesdeFilter("");
                setHastaFilter("");
                loadLogs();
              }}
              className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
            >
              Limpiar filtros
            </button>
         </div>
      </div>
    </div>
  );
}
