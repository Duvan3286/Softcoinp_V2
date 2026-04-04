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
    <div className="lg:h-full w-full bg-background p-2 md:p-4 lg:overflow-hidden flex flex-col items-center transition-colors duration-300">
      <div className="w-full max-w-[1400px] h-full flex flex-col min-h-0 gap-3">
        <CustomModal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />
      
      {/* Modal Entregar - Estilo Unificado */}
      {entregarModal.isOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={() => setEntregarModal({ isOpen: false, id: null })}></div>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden flex flex-col max-h-[85vh] transform transition-all animate-in zoom-in slide-in-from-bottom border border-border">
            
            {/* Cabecera Estilo UserModal */}
            <div className="bg-card px-5 py-3 border-b border-border flex justify-between items-center bg-gradient-to-r from-indigo-50/50 dark:from-indigo-900/20 to-transparent">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                <h2 className="text-xs font-black uppercase tracking-widest text-foreground">
                    Entregar Correspondencia
                </h2>
              </div>
              <button 
                onClick={() => setEntregarModal({ isOpen: false, id: null })}
                className="text-slate-400 dark:text-slate-500 hover:text-rose-600 transition-colors p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Recibido por (Nombre) *</label>
                  <input
                    type="text"
                    value={recibidoPor}
                    onChange={(e) => setRecibidoPor(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:border-indigo-500 outline-none transition-all placeholder-slate-300 dark:placeholder-slate-600 font-bold text-foreground uppercase text-[10px]"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">Nota u observación (Opcional)</label>
                  <textarea
                    value={notaEntrega}
                    onChange={(e) => setNotaEntrega(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:border-indigo-500 outline-none transition-all placeholder-slate-300 dark:placeholder-slate-600 font-medium text-foreground text-[10px] resize-none h-20"
                    placeholder="Firma, c.c., caja 2, etc."
                  />
                </div>
              </div>
            </div>

            <div className="p-4 px-5 flex gap-2 mt-auto border-t border-border bg-background transition-colors">
              <button 
                onClick={() => setEntregarModal({ isOpen: false, id: null })}
                className="px-4 py-2 bg-card border border-border text-slate-400 dark:text-slate-500 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmEntregar}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Procesando..." : "Confirmar Entrega"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER COMPACTO */}
      <div className="flex items-center justify-between shrink-0 bg-card p-3 rounded-2xl border border-border shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-transform hover:scale-110">
            <span className="text-xl text-white">📦</span>
          </div>
          <div>
            <h1 className="text-lg font-black text-foreground tracking-tight leading-none uppercase">
              Correspondencia
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 tracking-widest">Recepción y Entrega</p>
          </div>
        </div>

        {/* TABS INTEGRADOS EN HEADER */}
        <div className="flex gap-1 bg-background p-1 rounded-xl transition-colors">
          <button
            onClick={() => setActiveTab("lista")}
            className={`px-4 py-1.5 rounded-lg font-black transition-all text-[10px] uppercase tracking-widest flex items-center gap-2 ${
              activeTab === "lista" 
                ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-sm border border-border" 
                : "text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400"
            }`}
          >
            📋 Listado
          </button>
          <button
            onClick={() => setActiveTab("nuevo")}
            className={`px-4 py-1.5 rounded-lg font-black transition-all text-[10px] uppercase tracking-widest flex items-center gap-2 ${
              activeTab === "nuevo" 
                ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-sm border border-border" 
                : "text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400"
            }`}
          >
            ➕ Nuevo
          </button>
        </div>
      </div>

        {activeTab === "nuevo" && (
          <div className="bg-card p-5 md:p-8 rounded-3xl shadow-sm border border-border flex-grow flex flex-col min-h-0 transition-colors animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-all group-hover:scale-110">📥</div>
                <div>
                    <h2 className="text-base font-black text-foreground uppercase tracking-tight">Nueva Recepción</h2>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Registro de ingreso de paquetes al sistema</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 overflow-y-auto pr-2 custom-scrollbar">
              <div className="md:col-span-2">
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5 ml-1 tracking-widest">Remitente (Empresa/Persona) *</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors">📦</span>
                  <input
                    type="text"
                    value={formRemitente}
                    onChange={(e) => setFormRemitente(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-input border border-border rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-bold text-foreground text-xs uppercase"
                    placeholder="Ej. Servientrega, MercadoLibre, etc."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5 ml-1 tracking-widest">Destinatario (Residente/Apto) *</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors">🏢</span>
                  <input
                    type="text"
                    value={formDestinatario}
                    onChange={(e) => setFormDestinatario(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-input border border-border rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-bold text-foreground text-xs uppercase"
                    placeholder="Ej. Juan Pérez - Apto 302"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5 ml-1 tracking-widest">Tipo de Paquete</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors">📄</span>
                  <select
                    value={formTipoDoc}
                    onChange={(e) => setFormTipoDoc(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-input border border-border rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-black text-slate-600 dark:text-slate-400 text-xs appearance-none cursor-pointer uppercase tracking-tight"
                  >
                    <option value="">Seleccione...</option>
                    <option value="Sobre/Carta">Sobre / Carta</option>
                    <option value="Paquete Pequeño">Paquete Pequeño</option>
                    <option value="Caja Grande">Caja Grande</option>
                    <option value="Domicilio/Comida">Domicilio / Comida</option>
                    <option value="Otro">Otro</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5 ml-1 tracking-widest">Número de Guía / Rastreo</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors">#️⃣</span>
                  <input
                    type="text"
                    value={formGuia}
                    onChange={(e) => setFormGuia(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-input border border-border rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-bold text-foreground text-xs font-mono uppercase"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="md:col-span-3">
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1.5 ml-1 tracking-widest">Descripción o Novedades</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full p-4 bg-input border border-border rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-medium text-foreground text-xs hover:border-indigo-200 dark:hover:border-indigo-900 resize-none h-24 shadow-inner"
                  placeholder="Caja en mal estado, pago en efectivo pendiente, etc."
                />
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-border flex justify-end shrink-0">
              <button
                onClick={handleCreate}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3 rounded-xl shadow-xl shadow-indigo-100 dark:shadow-none transition-all flex items-center gap-3 text-xs font-black active:scale-95 disabled:opacity-50 tracking-[0.1em]"
              >
                {loading ? "PROCESANDO..." : "💾 GUARDAR RECEPCIÓN"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "lista" && (
          <div className="flex flex-col flex-grow min-h-0 space-y-3 animate-in fade-in duration-500">
            {/* FILTROS COMPACTOS */}
            <div className="bg-card p-3 md:p-4 rounded-2xl shadow-sm border border-border shrink-0 flex flex-wrap gap-4 items-end transition-colors">
              <div className="flex-1 min-w-[180px]">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Estado</label>
                <div className="relative group/select">
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full p-2 bg-input border border-border rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 text-xs font-black text-slate-600 dark:text-slate-400 transition-all cursor-pointer appearance-none uppercase"
                  >
                    <option value="">Todos los Estados</option>
                    <option value="en_espera">🟡 En Espera</option>
                    <option value="entregado">🟢 Entregado</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400 group-hover/select:text-indigo-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
              <div className="flex-[1.5] min-w-[220px]">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Buscar Remitente</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-indigo-500 text-xs transition-colors">🚚</span>
                  <input
                    type="text"
                    value={filtroRemitente}
                    onChange={(e) => setFiltroRemitente(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                    placeholder="Empresa o persona..."
                    className="w-full pl-8 pr-4 py-2 bg-input border border-border rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 text-xs font-bold text-foreground transition-all uppercase"
                  />
                </div>
              </div>
              <div className="flex-[1.5] min-w-[220px]">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Buscar Destinatario</label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-indigo-500 text-xs transition-colors">👤</span>
                  <input
                    type="text"
                    value={filtroDestinatario}
                    onChange={(e) => setFiltroDestinatario(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                    placeholder="Residente/Apto..."
                    className="w-full pl-8 pr-4 py-2 bg-input border border-border rounded-xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 text-xs font-bold text-foreground transition-all uppercase"
                  />
                </div>
              </div>
              <button 
                onClick={handleBuscar}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-black shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95 text-[10px] uppercase flex-shrink-0 tracking-[0.1em]"
              >
                🔍 BUSCAR
              </button>
            </div>

            {/* TABLA DE RESULTADOS */}
            <div className="flex-1 overflow-hidden flex flex-col bg-card rounded-2xl border border-border shadow-sm min-h-0 transition-colors">
              <div className="overflow-y-auto flex-grow custom-scrollbar">
                <table className="min-w-full divide-y divide-border relative">
                  <thead className="bg-background sticky top-0 z-10 border-b border-border transition-colors">
                    <tr>
                      <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Estado y Fecha</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Destino / Remitente</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Detalle Paquete</th>
                      <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Datos Entrega</th>
                      <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border transition-colors">
                      {loading && lista.length === 0 ? (
                        <tr><td colSpan={5} className="text-center p-12 text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-[10px] animate-pulse italic">Cargando correspondencia...</td></tr>
                      ) : lista.length === 0 ? (
                        <tr><td colSpan={5} className="text-center p-12 text-slate-400 dark:text-slate-700 font-bold h-[250px]">
                          <div className="flex flex-col items-center gap-4 opacity-30 grayscale">
                            <span className="text-6xl">📦</span>
                            <span className="text-xs uppercase tracking-widest font-black">No se hallaron registros en la base de datos</span>
                          </div>
                        </td></tr>
                      ) : (
                        lista.map((item) => (
                          <tr key={item.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                            
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-2">
                                {item.estado === "en_espera" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-[9px] font-black w-fit border border-amber-100 dark:border-amber-800 shadow-sm uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    En Espera
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-[9px] font-black w-fit border border-emerald-100 dark:border-emerald-800 shadow-sm uppercase tracking-widest">
                                    <span className="text-[10px]">✅</span>
                                    Entregado
                                  </span>
                                )}
                                <div className="flex flex-col">
                                  <span className="text-[11px] text-foreground font-black tracking-tight" title={item.fechaRecepcionLocal}>
                                    📅 {dayjs(item.fechaRecepcionLocal).format("DD MMM, HH:mm")}
                                  </span>
                                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">Vigilancia: {item.registradoPorNombre || "S.M"}</span>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="font-black text-foreground flex items-center gap-2 text-[13px] uppercase tracking-tight">
                                <span className="text-sm">🏢</span> {item.destinatario}
                              </div>
                              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black mt-1.5 flex items-center gap-2 italic uppercase tracking-tighter">
                                🚚 {item.remitente}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-background px-2.5 py-1 rounded-lg w-fit border border-border uppercase tracking-widest shadow-inner transition-colors">
                                {item.tipoDocumento || "Paquete Estándar"}
                              </div>
                              {item.numeroGuia && (
                                <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-mono mt-1.5 font-black bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg w-fit border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                  # {item.numeroGuia}
                                </div>
                              )}
                              {item.descripcion && (
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-bold italic line-clamp-1 max-w-[180px] normal-case" title={item.descripcion}>
                                  "{item.descripcion}"
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-4">
                              {item.estado === "entregado" ? (
                                <div className="flex flex-col gap-1.5 border-l-2 border-emerald-500 dark:border-emerald-600 pl-3">
                                  <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 tracking-tight uppercase">👤 {item.recibidoPor}</span>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold" title={item.fechaEntregaLocal}>
                                    🕒 {dayjs(item.fechaEntregaLocal).format("DD MMM, HH:mm")}
                                  </span>
                                  {item.notaEntrega && <span className="text-[9px] text-slate-500 dark:text-slate-400 italic bg-background px-2 py-1 rounded border border-border mt-1 transition-colors">"{item.notaEntrega}"</span>}
                                  <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-black mt-1 uppercase tracking-tighter">Entregó: {item.entregadoPorNombre || "S.M"}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-300 dark:text-slate-700 font-black uppercase italic tracking-widest">Pendiente de Salida...</span>
                              )}
                            </td>

                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {item.estado === "en_espera" && (
                                  <button 
                                    onClick={() => handleOpenEntregar(item.id)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95 flex items-center gap-2 group-hover:scale-105 tracking-widest uppercase"
                                  >
                                    <span className="text-xs">📤</span> Entregar
                                  </button>
                                )}
                                
                                {(usuario?.role === 'admin' || usuario?.role === 'superadmin') && (
                                  <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2.5 text-slate-300 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all active:scale-90"
                                    title="Eliminar registro"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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
