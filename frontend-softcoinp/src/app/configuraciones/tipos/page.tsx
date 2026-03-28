"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { tipoService, TipoPersonal } from "@/services/tipoService";
import CustomModal, { ModalType } from "@/components/CustomModal";
import { settingsService } from "@/services/settingsService";

export default function TiposConfigPage() {
  const router = useRouter();
  const [tipos, setTipos] = useState<TipoPersonal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [systemVersion, setSystemVersion] = useState("");
  const [clientName, setClientName] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoPersonal | null>(null);
  const [nombre, setNombre] = useState("");

  // 🔄 Estado de los Modales Custom
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ModalType;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showModal = (title: string, message: string, type: ModalType, onConfirm?: () => void) => {
    setModalConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const fetchTipos = async () => {
    try {
      setLoading(true);
      const data = await tipoService.getTipos();
      setTipos(data);
    } catch (err) {
      setError("Error al cargar los tipos de personal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTipos();
    settingsService.getSystemVersion().then(setSystemVersion);
    settingsService.getClientName().then(setClientName);
  }, []);

  const handleOpenModal = (tipo?: TipoPersonal) => {
    if (tipo) {
      setEditingTipo(tipo);
      setNombre(tipo.nombre);
    } else {
      setEditingTipo(null);
      setNombre("");
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      if (editingTipo) {
        await tipoService.updateTipo(editingTipo.id, { nombre: nombre.trim() });
      } else {
        await tipoService.createTipo(nombre.trim());
      }
      fetchTipos();
      setIsModalOpen(false);
    } catch (err: any) {
      showModal("Error", err.response?.data?.message || "Error al guardar el tipo.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    showModal(
        "¿Eliminar Tipo de Personal?", 
        "¿Estás seguro de que deseas eliminar este tipo? Esta acción no se puede deshacer.", 
        "confirm", 
        async () => {
            try {
                await tipoService.deleteTipo(id);
                fetchTipos();
                showModal("Éxito", "Tipo de personal eliminado correctamente.", "success");
            } catch (err: any) {
                showModal("Error", err.response?.data?.message || "Error al eliminar el tipo.", "error");
            }
        }
    );
  };

  const toggleActivo = async (tipo: TipoPersonal) => {
    try {
      await tipoService.updateTipo(tipo.id, { activo: !tipo.activo });
      fetchTipos();
    } catch (err: any) {
      showModal("Error", "No se pudo actualizar el estado del tipo de personal.", "error");
    }
  };

  return (
    <div className="h-full bg-slate-50 p-4 lg:p-12 flex flex-col items-center justify-start overflow-hidden gap-8 font-sans">
      <div className="w-full max-w-4xl flex flex-col items-start shrink-0">
        <div className="flex items-center justify-between w-full mb-2">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100 transition-transform hover:scale-110">
                    <span className="text-xl">🏷️</span>
                </div>
                <div>
                    <h1 className="text-xl lg:text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Tipos de Personal</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Categorías y clasificación</p>
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
                <button
                  onClick={() => handleOpenModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                  + Nuevo Tipo
                </button>
            </div>
        </div>
        <div className="w-full h-px bg-slate-200 mt-4 opacity-50"></div>
      </div>

      <main className="w-full max-w-4xl flex flex-col min-h-0 overflow-y-auto pr-1 pb-10 custom-scrollbar">
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 p-4 rounded-2xl mb-6 text-[11px] font-bold uppercase tracking-tight flex items-center gap-3 animate-in fade-in slide-in-from-top">
            <span>❌</span> {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Cargando tipos...</p>
          </div>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-3">
            {tipos.map((t) => (
              <div 
                key={t.id} 
                className="w-full bg-white rounded-2xl p-4 lg:px-8 lg:py-4 border border-slate-100 shadow-sm flex items-center gap-4 lg:gap-8 transition-all hover:bg-blue-50/40 hover:border-blue-100 hover:shadow-md group"
              >
                {/* Indicador de Estado */}
                <div className={`w-12 h-12 shrink-0 ${t.activo ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'} rounded-xl flex items-center justify-center text-xl shadow-inner transition-all group-hover:scale-110`}>
                   {t.activo ? "✅" : "🚥"}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{t.nombre}</h2>
                        <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded-md tracking-widest ${t.activo ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                        {t.activo ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                        ID Sistema: {t.id.substring(0, 8)}...
                    </p>
                </div>
                
                {/* Acciones */}
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <button 
                        onClick={() => toggleActivo(t)}
                        className={`p-2 rounded-lg transition-all shadow-sm ${t.activo ? 'bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white' : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'}`}
                        title={t.activo ? "Desactivar" : "Activar"}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    </button>
                    <button 
                        onClick={() => handleOpenModal(t)}
                        className="p-2 bg-slate-50 text-slate-500 hover:bg-blue-600 hover:text-white rounded-lg transition-all shadow-sm"
                        title="Editar"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button 
                        onClick={() => handleDelete(t.id)}
                        className="p-2 bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white rounded-lg transition-all shadow-sm"
                        title="Eliminar"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
                <div className="group-hover:hidden transition-all text-slate-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200 border border-slate-100">
            <div className="bg-blue-600 p-8 text-white relative">
              <h3 className="text-xl font-black uppercase tracking-tight">{editingTipo ? 'Editar Tipo' : 'Nuevo Tipo'}</h3>
              <p className="text-[10px] font-bold text-blue-100 uppercase tracking-[0.2em] mt-1">Definición de categoría de personal</p>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="absolute right-6 top-8 hover:rotate-90 transition-transform duration-200 p-2 bg-blue-500 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 lg:p-10">
              <div className="mb-8">
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Nombre del Tipo</label>
                <input
                  type="text"
                  autoFocus
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-slate-300 font-bold text-slate-700 uppercase text-sm"
                  placeholder="Ej: Empleado, Visitante..."
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]"
                >
                  {editingTipo ? 'Guardar Cambios' : 'Crear Tipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Único de Alertas/Confirmaciones */}
      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      <div className="w-full max-w-4xl flex justify-center mt-auto pb-4 shrink-0 px-2 lg:px-0">
         <p className="text-[9px] text-slate-300 font-black tracking-[0.3em] uppercase">
            Control de Acceso Softcoinp {systemVersion || "..."} • {clientName || "Panel de Administración Profesional"}
         </p>
      </div>
    </div>
  );
}
