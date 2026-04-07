"use client";

import React, { useState } from "react";

interface ClearDataOptions {
  registros: boolean;
  personal: boolean;
  vehiculos: boolean;
  anotaciones: boolean;
  correspondencia: boolean;
  recibos: boolean;
  auditoria: boolean;
}

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: ClearDataOptions) => void;
  loading: boolean;
}

const ClearDataModal: React.FC<ClearDataModalProps> = ({ isOpen, onClose, onConfirm, loading }) => {
  const [options, setOptions] = useState<ClearDataOptions>({
    registros: true,
    personal: false,
    vehiculos: false,
    anotaciones: true,
    correspondencia: true,
    recibos: true,
    auditoria: false,
  });

  if (!isOpen) return null;

  const toggleOption = (key: keyof ClearDataOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const optionLabels: Record<keyof ClearDataOptions, { label: string; desc: string; icon: string }> = {
    registros: { label: "Registros de Acceso", desc: "Historial de entradas y salidas", icon: "📥" },
    anotaciones: { label: "Anotaciones y Novedades", desc: "Reportes de incidencias y notas", icon: "📝" },
    correspondencia: { label: "Correspondencia", desc: "Paquetes y sobres registrados", icon: "📦" },
    recibos: { label: "Recibos Públicos", desc: "Control de entrega de facturas", icon: "📄" },
    vehiculos: { label: "Catálogo de Vehículos", desc: "Borrar todos los autos (Maestra)", icon: "🚗" },
    personal: { label: "Catálogo de Personal", desc: "Borrar empleados y visitantes (Maestra)", icon: "👥" },
    auditoria: { label: "Logs de Auditoría", desc: "Bitácora de acciones del sistema", icon: "📋" },
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden flex flex-col max-h-[90vh] transform animate-in zoom-in slide-in-from-bottom-8 duration-500 border border-border transition-colors">
        
        {/* Header */}
        <div className="bg-card px-5 py-4 border-b border-border flex justify-between items-center bg-gradient-to-r from-orange-50/50 dark:from-orange-900/20 to-transparent transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
              Limpieza Selectiva
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-600 transition-colors p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 text-center leading-relaxed">
            Selecciona los módulos que deseas vaciar. <br/>
            <span className="text-rose-500">Esta acción es irreversible.</span>
          </p>

          <div className="space-y-3">
            {(Object.keys(options) as Array<keyof ClearDataOptions>).map((key) => (
              <div 
                key={key}
                onClick={() => toggleOption(key)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${
                  options[key] 
                    ? "bg-orange-50/50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800" 
                    : "bg-background border-border hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm ${
                  options[key] ? "bg-orange-100 dark:bg-orange-900/30" : "bg-card"
                }`}>
                  {optionLabels[key].icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-[11px] font-black text-foreground uppercase tracking-tight">{optionLabels[key].label}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{optionLabels[key].desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  options[key] ? "bg-orange-500 border-orange-500 text-white" : "border-slate-300 dark:border-slate-700"
                }`}>
                  {options[key] && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-5 flex gap-2 border-t border-border bg-background transition-colors">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-card border border-border text-slate-400 dark:text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(options)}
            disabled={loading || !Object.values(options).some(v => v)}
            className="flex-1 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-100 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Procesando..." : "Ejecutar Limpieza"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearDataModal;
