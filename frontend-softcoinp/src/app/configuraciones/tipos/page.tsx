"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { tipoService, TipoPersonal } from "@/services/tipoService";
import CustomModal, { ModalType } from "@/components/CustomModal";

export default function TiposConfigPage() {
  const router = useRouter();
  const [tipos, setTipos] = useState<TipoPersonal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
    <div className="h-screen bg-gray-50 p-6 flex flex-col font-sans overflow-hidden">
      <main className="flex-1 max-w-5xl mx-auto w-full flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
            onClick={() => router.push("/configuraciones")}
            className="bg-blue-600 text-white py-1.5 px-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition duration-200 flex items-center text-sm"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Configuraciones
          </button>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Tipos de Personal</h1>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all active:scale-95"
          >
            + Nuevo Tipo
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
             <span>❌</span> {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Cargando tipos...</p>
          </div>
        )}

        {!loading && !error && (
          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
              {tipos.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm shadow-gray-200/50 flex flex-col justify-between transition-all hover:shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${t.activo ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className="font-bold text-gray-800 text-lg">{t.nombre}</span>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${t.activo ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                      {t.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-50">
                    <button 
                      onClick={() => toggleActivo(t)}
                      className={`p-2 rounded-lg transition-colors ${t.activo ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      title={t.activo ? "Desactivar" : "Activar"}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleOpenModal(t)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(t.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingTipo ? 'Editar Tipo' : 'Nuevo Tipo de Personal'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform duration-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8">
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Nombre del Tipo</label>
                <input
                  type="text"
                  autoFocus
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400 font-medium"
                  placeholder="Ej: Empleado, Visitante, Contratista..."
                  required
                />
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-[0.98]"
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
    </div>
  );
}
