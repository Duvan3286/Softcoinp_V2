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
    <div className="lg:h-full w-full bg-slate-50/50 p-2 md:p-4 overflow-hidden flex flex-col items-center">
      <div className="w-full max-w-[1400px] h-full flex flex-col overflow-hidden gap-3">
        <CustomModal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />
      
      {/* Modal Entregar */}
      {entregarModal.isOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-md border border-slate-200 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-600 rounded-lg text-base">📤</span>
              Entregar Correspondencia
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Recibido por (Nombre) *</label>
                <input
                  type="text"
                  value={recibidoPor}
                  onChange={(e) => setRecibidoPor(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm font-medium"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nota u observación (Opcional)</label>
                <textarea
                  value={notaEntrega}
                  onChange={(e) => setNotaEntrega(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm resize-none h-20"
                  placeholder="Firma, c.c., caja 2, etc."
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button 
                onClick={() => setEntregarModal({ isOpen: false, id: null })}
                className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 text-sm font-bold transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmEntregar}
                className="px-4 py-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700 text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                disabled={loading}
              >
                Confirmar Entrega
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER COMPACTO */}
      <div className="flex items-center justify-between shrink-0 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
            <span className="text-xl">📦</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">
              Gestión de Correspondencia
            </h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase mt-1">Recepción y Entrega de Paquetes</p>
          </div>
        </div>

        {/* TABS INTEGRADOS EN HEADER */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("lista")}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all text-xs flex items-center gap-2 ${
              activeTab === "lista" 
                ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200" 
                : "text-slate-500 hover:bg-slate-200/50"
            }`}
          >
            📋 Listado
          </button>
          <button
            onClick={() => setActiveTab("nuevo")}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all text-xs flex items-center gap-2 ${
              activeTab === "nuevo" 
                ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200" 
                : "text-slate-500 hover:bg-slate-200/50"
            }`}
          >
            ➕ Nuevo Registro
          </button>
        </div>
      </div>

        {activeTab === "nuevo" && (
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex-grow flex flex-col min-h-0">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 shrink-0">
              <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-sm">📥</span>
              Nuevo Registro de Correspondencia
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">Remitente (Empresa/Persona) *</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">📦</span>
                  <input
                    type="text"
                    value={formRemitente}
                    onChange={(e) => setFormRemitente(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm font-semibold transition-all group-hover:bg-white"
                    placeholder="Ej. Servientrega, MercadoLibre, etc."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">Destinatario (Residente/Apto) *</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">🏢</span>
                  <input
                    type="text"
                    value={formDestinatario}
                    onChange={(e) => setFormDestinatario(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm font-semibold transition-all group-hover:bg-white"
                    placeholder="Ej. Juan Pérez - Apto 302"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">Tipo de Paquete</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">📄</span>
                  <select
                    value={formTipoDoc}
                    onChange={(e) => setFormTipoDoc(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm font-semibold transition-all group-hover:bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Seleccione...</option>
                    <option value="Sobre/Carta">Sobre / Carta</option>
                    <option value="Paquete Pequeño">Paquete Pequeño</option>
                    <option value="Caja Grande">Caja Grande</option>
                    <option value="Domicilio/Comida">Domicilio / Comida</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">Número de Guía / Rastreo</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">#️⃣</span>
                  <input
                    type="text"
                    value={formGuia}
                    onChange={(e) => setFormGuia(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm font-mono transition-all group-hover:bg-white uppercase"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">Descripción o Novedades</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50/50 text-sm font-medium transition-all hover:bg-white resize-none h-16"
                  placeholder="Caja en mal estado, pago en efectivo pendiente, etc."
                />
              </div>
            </div>

            <div className="mt-auto pt-6 flex justify-end shrink-0">
              <button
                onClick={handleCreate}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2 text-sm font-black active:scale-95 disabled:opacity-50"
              >
                {loading ? "GUARDANDO..." : "💾 GUARDAR RECEPCIÓN"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "lista" && (
          <div className="flex flex-col flex-grow min-h-0 space-y-3">
            {/* FILTROS COMPACTOS */}
            <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-200 shrink-0 flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[180px]">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Estado</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 text-xs font-bold transition-all hover:bg-white cursor-pointer"
                >
                  <option value="">Todos los Estados</option>
                  <option value="en_espera">🟡 En Espera</option>
                  <option value="entregado">🟢 Entregado</option>
                </select>
              </div>
              <div className="flex-[1.5] min-w-[220px]">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Buscar Remitente</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs transition-colors">🚚</span>
                  <input
                    type="text"
                    value={filtroRemitente}
                    onChange={(e) => setFiltroRemitente(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                    placeholder="Empresa o persona..."
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 text-xs font-semibold transition-all hover:bg-white"
                  />
                </div>
              </div>
              <div className="flex-[1.5] min-w-[220px]">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Buscar Destinatario</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs transition-colors">👤</span>
                  <input
                    type="text"
                    value={filtroDestinatario}
                    onChange={(e) => setFiltroDestinatario(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                    placeholder="Residente/Apto..."
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50 text-xs font-semibold transition-all hover:bg-white"
                  />
                </div>
              </div>
              <button 
                onClick={handleBuscar}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-black shadow-lg shadow-blue-100 transition-all active:scale-95 text-[10px] uppercase flex-shrink-0"
              >
                🔍 BUSCAR
              </button>
            </div>

            {/* TABLA DE RESULTADOS */}
            <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm min-h-0">
              <div className="overflow-y-auto flex-grow custom-scrollbar">
                <table className="min-w-full divide-y divide-slate-100 relative">
                  <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado y Fecha</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Destino / Remitente</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle Paquete</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Datos Entrega</th>
                      <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50">
                      {loading && lista.length === 0 ? (
                        <tr><td colSpan={5} className="text-center p-12 text-slate-400 font-bold italic">Cargando correspondencia...</td></tr>
                      ) : lista.length === 0 ? (
                        <tr><td colSpan={5} className="text-center p-12 text-slate-400 font-bold h-[200px]">
                          <div className="flex flex-col items-center gap-2 opacity-30 grayscale">
                            <span className="text-4xl text-blue-500">📦</span>
                            <span>No se encontraron registros</span>
                          </div>
                        </td></tr>
                      ) : (
                        lista.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group border-b last:border-0">
                            
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1.5">
                                {item.estado === "en_espera" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-black w-fit border border-amber-100 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    EN ESPERA
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black w-fit border border-emerald-100 shadow-sm">
                                    <span className="text-[10px]">✅</span>
                                    ENTREGADO
                                  </span>
                                )}
                                <div className="flex flex-col">
                                  <span className="text-[11px] text-slate-600 font-bold" title={item.fechaRecepcionLocal}>
                                    📅 {dayjs(item.fechaRecepcionLocal).format("DD MMM, HH:mm")}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Recibido: {item.registradoPorNombre || "Desconocido"}</span>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-black text-slate-800 flex items-center gap-2 text-xs">
                                <span className="text-sm">🏢</span> {item.destinatario}
                              </div>
                              <div className="text-[11px] text-slate-500 font-bold mt-1 flex items-center gap-2 italic">
                                🚚 {item.remitente}
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="text-[11px] font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-lg w-fit border border-slate-200">
                                {item.tipoDocumento || "Paquete Estándar"}
                              </div>
                              {item.numeroGuia && (
                                <div className="text-[10px] text-blue-600 font-mono mt-1 font-black bg-blue-50 px-2 py-0.5 rounded-lg w-fit border border-blue-100">
                                  # {item.numeroGuia}
                                </div>
                              )}
                              {item.descripcion && (
                                <div className="text-[10px] text-slate-400 mt-1 font-bold italic line-clamp-1 max-w-[180px]" title={item.descripcion}>
                                  "{item.descripcion}"
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3">
                              {item.estado === "entregado" ? (
                                <div className="flex flex-col gap-1 border-l-2 border-emerald-500 pl-3">
                                  <span className="text-[11px] font-black text-emerald-700 tracking-tight">👤 {item.recibidoPor}</span>
                                  <span className="text-[10px] text-slate-400 font-bold" title={item.fechaEntregaLocal}>
                                    🕒 {dayjs(item.fechaEntregaLocal).format("DD MMM, HH:mm")}
                                  </span>
                                  {item.notaEntrega && <span className="text-[9px] text-slate-500 italic bg-slate-50 p-1 rounded">"{item.notaEntrega}"</span>}
                                  <span className="text-[9px] text-blue-500 font-bold mt-0.5">Por: {item.entregadoPorNombre}</span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-300 font-bold uppercase italic tracking-tighter">Pendiente de salida...</span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {item.estado === "en_espera" && (
                                  <button 
                                    onClick={() => handleOpenEntregar(item.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center gap-2 group-hover:scale-105"
                                  >
                                    <span className="text-xs">📤</span> ENTREGAR
                                  </button>
                                )}
                                
                                {(usuario?.role === 'admin' || usuario?.role === 'superadmin') && (
                                  <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    title="Eliminar registro"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                  </button>
                                )}
                              </div>
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
