"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { correspondenciaService, CorrespondenciaDto } from "@/services/correspondenciaService";
import CustomModal, { ModalType } from "@/components/CustomModal";
import { getCurrentUser, UserPayload } from "@/utils/auth";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/es";

dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.locale("es");

export default function CorrespondenciaPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UserPayload | null>(null);
  
  // Lista de correspondencia
  const [lista, setLista] = useState<CorrespondenciaDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroRemitente, setFiltroRemitente] = useState("");
  const [filtroDestinatario, setFiltroDestinatario] = useState("");

  // Modal genérico
  const [modal, setModal] = useState<{
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

  // Modal para Entregar
  const [entregarModal, setEntregarModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [recibidoPor, setRecibidoPor] = useState("");
  const [notaEntrega, setNotaEntrega] = useState("");

  // Tabs: "Lista" | "Nuevo"
  const [activeTab, setActiveTab] = useState<"lista" | "nuevo">("lista");

  // Formulario Nuevo
  const [formRemitente, setFormRemitente] = useState("");
  const [formDestinatario, setFormDestinatario] = useState("");
  const [formTipoDoc, setFormTipoDoc] = useState("");
  const [formGuia, setFormGuia] = useState("");
  const [formDesc, setFormDesc] = useState("");

  useEffect(() => {
    const userPayload = getCurrentUser();
    if (userPayload) {
      setUsuario(userPayload);
    } else {
      router.push("/login");
    }
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await correspondenciaService.getAll(filtroEstado, filtroRemitente, filtroDestinatario);
      setLista(data);
    } catch (error) {
      console.error("Error al cargar correspondencia:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filtroEstado]); // Recargar al cambiar filtro rápido

  const handleBuscar = () => loadData();

  const handleCreate = async () => {
    if (!formRemitente.trim() || !formDestinatario.trim()) {
      showModal("Remitente y Destinatario son obligatorios.", "warning");
      return;
    }

    try {
      setLoading(true);
      await correspondenciaService.create({
        remitente: formRemitente,
        destinatario: formDestinatario,
        tipoDocumento: formTipoDoc,
        numeroGuia: formGuia,
        descripcion: formDesc
      });
      showModal("Correspondencia registrada correctamente.", "success");
      
      // Limpiar formulario y volver a lista
      setFormRemitente("");
      setFormDestinatario("");
      setFormTipoDoc("");
      setFormGuia("");
      setFormDesc("");
      setActiveTab("lista");
      loadData();
    } catch (error: any) {
      showModal(error.response?.data?.message || "Error al registrar correspondencia.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEntregar = (id: string) => {
    setEntregarModal({ isOpen: true, id });
    setRecibidoPor("");
    setNotaEntrega("");
  };

  const handleConfirmEntregar = async () => {
    if (!entregarModal.id) return;
    if (!recibidoPor.trim()) {
      showModal("Debe indicar quién recibe.", "warning");
      return;
    }

    try {
      setLoading(true);
      await correspondenciaService.entregar(entregarModal.id, {
        recibidoPor,
        notaEntrega
      });
      showModal("Correspondencia entregada.", "success");
      setEntregarModal({ isOpen: false, id: null });
      loadData();
    } catch (error: any) {
      showModal(error.response?.data?.message || "Error al entregar correspondencia.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    showModal("¿Está seguro de eliminar este registro?", "confirm", async () => {
      try {
        setLoading(true);
        await correspondenciaService.eliminar(id);
        showModal("Registro eliminado.", "success");
        loadData();
      } catch (error: any) {
        showModal(error.response?.data?.message || "Error al eliminar.", "error");
      } finally {
        setLoading(false);
      }
    });
  };

  const showModal = (msg: string, type: ModalType, onConfirmAction?: () => void) => {
    setModal({
      isOpen: true,
      title: type === "error" ? "Error" : type === "success" ? "Éxito" : type === "confirm" ? "Confirmar" : "Atención",
      message: msg,
      type,
      onConfirm: onConfirmAction
    });
  };

  return (
    <div className="h-screen w-full bg-gray-100 p-4 md:p-6 overflow-hidden flex flex-col items-center">
      <div className="w-full max-w-[1400px] h-full flex flex-col overflow-hidden">
        <CustomModal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />
      
      {/* Modal Entregar */}
      {entregarModal.isOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Entregar Correspondencia</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">Recibido por (Nombre) *</label>
                <input
                  type="text"
                  value={recibidoPor}
                  onChange={(e) => setRecibidoPor(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-blue-500"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">Nota u observación (Opcional)</label>
                <textarea
                  value={notaEntrega}
                  onChange={(e) => setNotaEntrega(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-blue-500 resize-none h-24"
                  placeholder="Firma, c.c., caja 2, etc."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button 
                onClick={() => setEntregarModal({ isOpen: false, id: null })}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmEntregar}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                Confirmar Entrega
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            📦 Gestión de Correspondencia
          </h1>
          <p className="text-sm text-gray-500">Recepción y entrega de paquetes y documentos.</p>
        </div>


      </div>

      {/* TABS */}
      <div className="flex shrink-0 gap-2 mb-4 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 w-fit">
          <button
            onClick={() => setActiveTab("lista")}
            className={`px-6 py-2 rounded-lg font-bold transition-all text-sm ${
              activeTab === "lista" 
                ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100" 
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            📋 Listado y Búsqueda
          </button>
          <button
            onClick={() => setActiveTab("nuevo")}
            className={`px-6 py-2 rounded-lg font-bold transition-all text-sm ${
              activeTab === "nuevo" 
                ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100" 
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            ➕ Registrar Recepción
          </button>
        </div>

        {activeTab === "nuevo" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex-grow overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-blue-500">📥</span> Nuevo Registro de Correspondencia
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Remitente (Empresa/Persona) *</label>
                <input
                  type="text"
                  value={formRemitente}
                  onChange={(e) => setFormRemitente(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="Ej. Servientrega, MercadoLibre, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Destinatario (Residente/Apto) *</label>
                <input
                  type="text"
                  value={formDestinatario}
                  onChange={(e) => setFormDestinatario(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="Ej. Juan Pérez - Apto 302"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Paquete</label>
                <select
                  value={formTipoDoc}
                  onChange={(e) => setFormTipoDoc(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
                >
                  <option value="">Seleccione...</option>
                  <option value="Sobre/Carta">Sobre / Carta</option>
                  <option value="Paquete Pequeño">Paquete Pequeño</option>
                  <option value="Caja Grande">Caja Grande</option>
                  <option value="Domicilio/Comida">Domicilio / Comida</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Número de Guía / Rastreo</label>
                <input
                  type="text"
                  value={formGuia}
                  onChange={(e) => setFormGuia(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 uppercase"
                  placeholder="Opcional"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">Descripción o Novedades</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none h-24"
                  placeholder="Caja en mal estado, pago en efectivo pendiente, etc."
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleCreate}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg shadow-md transition-all flex items-center gap-2 text-sm font-medium"
              >
                {loading ? "Guardando..." : "💾 Guardar Recepción"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "lista" && (
          <div className="flex flex-col flex-grow min-h-0 space-y-4">
            {/* FILTROS */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-2 shrink-0 flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-gray-500 uppercase">Estado</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-blue-500 bg-gray-50 font-semibold"
                >
                  <option value="">Todos los Estados</option>
                  <option value="en_espera">🟡 En Espera de Entrega</option>
                  <option value="entregado">🟢 Entregado</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-gray-500 uppercase">Buscar Remitente</label>
                <input
                  type="text"
                  value={filtroRemitente}
                  onChange={(e) => setFiltroRemitente(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                  placeholder="Empresa o persona..."
                  className="w-full p-2.5 border rounded-lg focus:ring-blue-500 bg-gray-50"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-gray-500 uppercase">Buscar Destinatario</label>
                <input
                  type="text"
                  value={filtroDestinatario}
                  onChange={(e) => setFiltroDestinatario(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                  placeholder="Residente/Apto..."
                  className="w-full p-2.5 border rounded-lg focus:ring-blue-500 bg-gray-50"
                />
              </div>
              <button 
                onClick={handleBuscar}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-all h-[42px] text-sm flex-shrink-0"
              >
                🔍 Buscar
              </button>
            </div>

            {/* TABLA DE RESULTADOS */}
            <div className="flex-1 overflow-y-auto shadow-md rounded-lg border border-gray-300 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-600 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Estado / Fecha Rec.</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Destino / Remitente</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Detalle Paquete</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Datos Entrega</th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {loading && lista.length === 0 ? (
                      <tr><td colSpan={5} className="text-center p-8 text-gray-500">Cargando correspondencia...</td></tr>
                    ) : lista.length === 0 ? (
                      <tr><td colSpan={5} className="text-center p-8 text-gray-500 font-medium">No se encontraron registros de correspondencia.</td></tr>
                    ) : (
                      lista.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                          
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              {item.estado === "en_espera" ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold w-fit border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                  EN ESPERA
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold w-fit border border-emerald-200">
                                  <span className="text-[10px]">✅</span>
                                  ENTREGADO
                                </span>
                              )}
                              <span className="text-xs text-gray-500 font-medium mt-1" title={item.fechaRecepcionLocal}>
                                📅 {dayjs(item.fechaRecepcionLocal).format("DD MMM, HH:mm")}
                              </span>
                              <span className="text-[10px] text-gray-400">Recibido en portería por: {item.registradoPorNombre || "Desconocido"}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                              🏢 {item.destinatario}
                            </div>
                            <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                              🚚 {item.remitente}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="text-sm font-semibold text-gray-700">
                              {item.tipoDocumento || "Paquete Estándar"}
                            </div>
                            {item.numeroGuia && (
                              <div className="text-xs text-blue-600 font-mono mt-1 bg-blue-50 px-2 py-0.5 rounded w-fit border border-blue-100">
                                # {item.numeroGuia}
                              </div>
                            )}
                            {item.descripcion && (
                              <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]" title={item.descripcion}>
                                📝 {item.descripcion}
                              </div>
                            )}
                          </td>

                          <td className="p-4">
                            {item.estado === "entregado" ? (
                              <div className="flex flex-col gap-0.5 border-l-2 border-emerald-500 pl-3">
                                <span className="text-sm font-bold text-emerald-700">👤 {item.recibidoPor}</span>
                                <span className="text-xs text-gray-500 font-medium" title={item.fechaEntregaLocal}>
                                  🕒 {dayjs(item.fechaEntregaLocal).format("DD MMM, HH:mm")}
                                </span>
                                {item.notaEntrega && <span className="text-[10px] text-gray-500 italic mt-0.5">"{item.notaEntrega}"</span>}
                                <span className="text-[10px] text-blue-500 font-medium mt-1">Entregado por: {item.entregadoPorNombre}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Esperando a ser recogido...</span>
                            )}
                          </td>

                          <td className="p-4 text-center">
                            {item.estado === "en_espera" && (
                              <button 
                                onClick={() => handleOpenEntregar(item.id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md transition-all active:scale-95"
                              >
                                📤 Entregar
                              </button>
                            )}
                            
                            {(usuario?.role === 'admin' || usuario?.role === 'superadmin') && (
                              <button 
                                onClick={() => handleDelete(item.id)}
                                className="ml-2 text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                                title="Eliminar registro"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            )}
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
