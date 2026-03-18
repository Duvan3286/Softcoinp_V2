"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auditService, AuditLog } from "@/services/auditService";
import { getCurrentUser } from "@/utils/auth";

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
    <div className="h-screen bg-gray-50 p-6 overflow-hidden flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <button 
            onClick={() => router.push("/configuraciones")}
            className="bg-blue-600 text-white py-1.5 px-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition duration-200 flex items-center text-sm shrink-0"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Configuraciones
          </button>

          <div className="flex gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-400">Acción</label>
              <select 
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white min-w-[200px]"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="">Todas las acciones</option>
                {Object.entries(actionNames).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-400">Desde</label>
              <input 
                type="date" 
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                value={desdeFilter}
                onChange={(e) => setDesdeFilter(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-400">Hasta</label>
              <input 
                type="date" 
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                value={hastaFilter}
                onChange={(e) => setHastaFilter(e.target.value)}
              />
            </div>
            <button 
              onClick={loadLogs}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-md h-9"
            >
              Buscar
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex-grow flex flex-col min-h-0">
          <div className="bg-amber-500 p-8 text-white relative shrink-0">
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-2">Auditoría del Sistema</h1>
              <p className="opacity-90">Bitácora de actividad y registros administrativos</p>
            </div>
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-7xl opacity-20">📋</div>
          </div>

          <div className="flex-grow overflow-y-auto overflow-x-auto min-h-0 custom-scrollbar">
            {loading ? (
              <div className="p-20 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-20 text-center text-gray-500 italic">
                No se encontraron registros de auditoría.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Fecha/Hora</th>
                    <th className="px-6 py-4">Acción</th>
                    <th className="px-6 py-4">Detalle</th>
                    <th className="px-6 py-4">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-amber-50/30 transition-colors group">
                      <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap font-medium">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={getActionBadge(log.action)}>
                          {getFriendlyAction(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 italic">
                        {getLogDetail(log)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                        {log.userName || "Sistema"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
            <span className="text-xs text-gray-500 font-medium">Total de registros: {total}</span>
            <button 
              onClick={() => {
                setActionFilter("");
                setDesdeFilter("");
                setHastaFilter("");
                loadLogs();
              }}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
