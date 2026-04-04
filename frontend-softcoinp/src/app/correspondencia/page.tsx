"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { correspondenciaService, CorrespondenciaDto } from "@/services/correspondenciaService";
import { recibosPublicosService, ReciboPublicoDto, EntregaReciboDto } from "@/services/recibosPublicosService";
import CustomModal, { ModalType } from "@/components/CustomModal";
import { getCurrentUser, UserPayload } from "@/utils/auth";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

export default function CorrespondenciaPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"paquetes" | "recibos" | "nuevo_paquete" | "nuevo_recibo">("paquetes");

  // --- ESTADOS PAQUETES ---
  const [listaPaquetes, setListaPaquetes] = useState<CorrespondenciaDto[]>([]);
  const [filtroEstadoPaquete, setFiltroEstadoPaquete] = useState("");
  const [filtroRemitente, setFiltroRemitente] = useState("");
  const [formRemitente, setFormRemitente] = useState("");
  const [formDestinatario, setFormDestinatario] = useState("");
  const [formTipoDoc, setFormTipoDoc] = useState("");
  const [formGuia, setFormGuia] = useState("");
  const [formDesc, setFormDesc] = useState("");

  // --- ESTADOS RECIBOS ---
  const [listaRecibos, setListaRecibos] = useState<ReciboPublicoDto[]>([]);
  const [mostrarArchivados, setMostrarArchivados] = useState(false);
  const [formServicio, setFormServicio] = useState("");
  const [formMes, setFormMes] = useState("");
  const [formCantidad, setFormCantidad] = useState("");
  
  // Modales Recibos
  const [entregaReciboModal, setEntregaReciboModal] = useState<{ isOpen: boolean; id: string | null; servicio: string }>({ isOpen: false, id: null, servicio: "" });
  const [verEntregasModal, setVerEntregasModal] = useState<{ isOpen: boolean; id: string | null; servicio: string }>({ isOpen: false, id: null, servicio: "" });
  const [entregasDetalle, setEntregasDetalle] = useState<EntregaReciboDto[]>([]);
  const [residenteNombre, setResidenteNombre] = useState("");
  const [apartamento, setApartamento] = useState("");

  // --- MODALES GENERALES ---
  const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string; type: ModalType; onConfirm?: () => void }>({
    isOpen: false, title: "", message: "", type: "info",
  });
  const [entregarPaqueteModal, setEntregarPaqueteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [recibidoPor, setRecibidoPor] = useState("");
  const [notaEntrega, setNotaEntrega] = useState("");

  useEffect(() => {
    const userPayload = getCurrentUser();
    if (userPayload) setUsuario(userPayload);
    else router.push("/login");
    loadAllData();
  }, [mostrarArchivados]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        correspondenciaService.getAll(filtroEstadoPaquete, filtroRemitente, ""),
        mostrarArchivados ? recibosPublicosService.getHistorial() : recibosPublicosService.getActivos()
      ]);
      setListaPaquetes(p);
      setListaRecibos(r);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const showModal = (msg: string, type: ModalType, title?: string, onConfirm?: () => void) => {
    setModal({ isOpen: true, message: msg, type, title: title || "Aviso", onConfirm });
  };

  // --- LÓGICA PAQUETES ---
  const handleCreatePaquete = async () => {
    if (!formRemitente.trim() || !formDestinatario.trim()) {
      showModal("Remitente y Destinatario son obligatorios.", "warning");
      return;
    }
    try {
      setLoading(true);
      await correspondenciaService.create({ remitente: formRemitente, destinatario: formDestinatario, tipoDocumento: formTipoDoc, numeroGuia: formGuia, descripcion: formDesc });
      showModal("Paquete registrado correctamente.", "success");
      setFormRemitente(""); setFormDestinatario(""); setFormTipoDoc(""); setFormGuia(""); setFormDesc("");
      setActiveTab("paquetes");
      loadAllData();
    } catch (err: any) { showModal("Error al registrar paquete.", "error"); } finally { setLoading(false); }
  };

  const handleConfirmEntregarPaquete = async () => {
    if (!entregarPaqueteModal.id || !recibidoPor.trim()) {
      showModal("Debe indicar quién recibe.", "warning");
      return;
    }
    try {
      setLoading(true);
      await correspondenciaService.entregar(entregarPaqueteModal.id, { recibidoPor, notaEntrega });
      showModal("Paquete entregado con éxito.", "success");
      setEntregarPaqueteModal({ isOpen: false, id: null });
      loadAllData();
    } catch (err: any) { showModal("Error al entregar.", "error"); } finally { setLoading(false); }
  };

  // --- LÓGICA RECIBOS ---
  const handleCreateLoteRecibos = async () => {
    const cant = parseInt(formCantidad);
    if (!formServicio || !formMes || isNaN(cant) || cant <= 0) {
      showModal("Diligencie todos los campos correctamente.", "warning");
      return;
    }
    try {
      setLoading(true);
      await recibosPublicosService.create({ servicio: formServicio, mes: formMes, totalRecibidos: cant });
      showModal("Lote de recibos creado exitosamente.", "success");
      setFormServicio(""); setFormMes(""); setFormCantidad("");
      setActiveTab("recibos");
      loadAllData();
    } catch (err: any) { showModal("Error al crear lote.", "error"); } finally { setLoading(false); }
  };

  const handleConfirmEntregaRecibo = async () => {
    if (!entregaReciboModal.id || !residenteNombre.trim() || !apartamento.trim()) {
      showModal("Nombre y Apartamento son obligatorios.", "warning");
      return;
    }
    try {
      setLoading(true);
      await recibosPublicosService.entregar(entregaReciboModal.id, { residenteNombre, apartamento });
      showModal("Entrega de recibo registrada. Inventario actualizado.", "success");
      setEntregaReciboModal({ isOpen: false, id: null, servicio: "" });
      setResidenteNombre(""); setApartamento("");
      loadAllData();
    } catch (err: any) { showModal("Error al registrar entrega.", "error"); } finally { setLoading(false); }
  };

  const handleVerEntregas = async (id: string, servicio: string) => {
    setLoading(true);
    try {
      const data = await recibosPublicosService.getEntregas(id);
      setEntregasDetalle(data);
      setVerEntregasModal({ isOpen: true, id, servicio });
    } catch (err) {
      showModal("Error al cargar detalle de entregas.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lg:h-full w-full bg-background p-2 md:p-4 lg:overflow-hidden flex flex-col items-center transition-colors duration-300">
      <div className="w-full max-w-[1400px] h-full flex flex-col min-h-0 gap-4">
        
        <CustomModal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />

        {/* --- MODAL ENTREGAR PAQUETE --- */}
        {entregarPaqueteModal.isOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEntregarPaqueteModal({ isOpen: false, id: null })}></div>
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden flex flex-col max-h-[85vh] border border-border animate-in zoom-in-95">
              <div className="bg-card px-5 py-3 border-b border-border flex justify-between items-center bg-gradient-to-r from-indigo-50/50 dark:from-indigo-900/20 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-foreground">Entregar Paquete</h2>
                </div>
                <button onClick={() => setEntregarPaqueteModal({ isOpen: false, id: null })} className="text-slate-400 hover:text-rose-600 p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1 tracking-widest">Nombre de quien recibe *</label>
                  <input type="text" value={recibidoPor} onChange={e => setRecibidoPor(e.target.value)} className="input-standard !text-[10px]" placeholder="Ej. Pedro Picapiedra" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1 tracking-widest">Observaciones</label>
                  <textarea value={notaEntrega} onChange={e => setNotaEntrega(e.target.value)} className="input-standard !text-[10px] h-20 resize-none" placeholder="Firma, identificación, etc." />
                </div>
              </div>
              <div className="p-4 px-5 flex gap-2 border-t border-border bg-background">
                <button onClick={() => setEntregarPaqueteModal({ isOpen: false, id: null })} className="px-4 py-2 bg-card border border-border text-slate-400 rounded-lg font-black text-[9px] uppercase tracking-widest">Cancelar</button>
                <button onClick={handleConfirmEntregarPaquete} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md shadow-indigo-100">Confirmar Entrega</button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL ENTREGAR RECIBO --- */}
        {entregaReciboModal.isOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEntregaReciboModal({ isOpen: false, id: null, servicio: "" })}></div>
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden flex flex-col max-h-[85vh] border border-border animate-in zoom-in-95">
              <div className="bg-card px-5 py-3 border-b border-border flex justify-between items-center bg-gradient-to-r from-emerald-50/50 dark:from-emerald-900/20 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-600 rounded-full"></div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-foreground">Entregar: {entregaReciboModal.servicio}</h2>
                </div>
                <button onClick={() => setEntregaReciboModal({ isOpen: false, id: null, servicio: "" })} className="text-slate-400 hover:text-rose-600 p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1 tracking-widest">Nombre del Residente *</label>
                  <input type="text" value={residenteNombre} onChange={e => setResidenteNombre(e.target.value)} className="input-standard !text-[10px]" placeholder="Nombre Completo" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1 tracking-widest">Apartamento / Torre *</label>
                  <input type="text" value={apartamento} onChange={e => setApartamento(e.target.value)} className="input-standard !text-[10px]" placeholder="Ej: Torre 1 - Apt 402" />
                </div>
              </div>
              <div className="p-4 px-5 flex gap-2 border-t border-border bg-background">
                <button onClick={() => setEntregaReciboModal({ isOpen: false, id: null, servicio: "" })} className="px-4 py-2 bg-card border border-border text-slate-400 rounded-lg font-black text-[9px] uppercase tracking-widest">Cancelar</button>
                <button onClick={handleConfirmEntregaRecibo} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md shadow-emerald-100">Registrar Entrega</button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL VER ENTREGAS (HISTORIAL LOTE) --- */}
        {verEntregasModal.isOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setVerEntregasModal({ isOpen: false, id: null, servicio: "" })}></div>
            <div className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] border border-border animate-in zoom-in-95">
              <div className="bg-card px-6 py-4 border-b border-border flex justify-between items-center bg-gradient-to-r from-indigo-50/50 dark:from-indigo-900/20 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 bg-indigo-600 rounded-full"></div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Relación de Entregas: {verEntregasModal.servicio}</h2>
                </div>
                <button onClick={() => setVerEntregasModal({ isOpen: false, id: null, servicio: "" })} className="text-slate-400 hover:text-rose-600 p-1 transition-all hover:rotate-90">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-background transition-colors">
                <table className="w-full text-left">
                  <thead className="bg-card sticky top-0 border-b border-border transition-colors">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Residente / Apto</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Fecha y Hora</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Entregado por</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border transition-colors">
                    {entregasDetalle.length === 0 ? (
                      <tr><td colSpan={3} className="text-center p-10 text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-[10px]">No se han registrado entregas en este lote</td></tr>
                    ) : (
                      entregasDetalle.map(e => (
                        <tr key={e.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-[11px] font-black text-foreground uppercase tracking-tight">{e.residenteNombre}</p>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{e.apartamento}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-[11px] font-black text-foreground">{dayjs(e.fechaEntregaUtc).format("DD MMM YYYY")}</p>
                            <p className="text-[10px] font-bold text-slate-400">{dayjs(e.fechaEntregaUtc).format("HH:mm:ss")}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 px-2 py-1 rounded shadow-sm">
                              {e.registradoPor}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 px-6 border-t border-border bg-card flex justify-end">
                <button onClick={() => setVerEntregasModal({ isOpen: false, id: null, servicio: "" })} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Entendido</button>
              </div>
            </div>
          </div>
        )}

        {/* HEADER & TABS PRINCIPALES */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-card p-4 rounded-3xl border border-border shadow-sm transition-colors shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none transition-transform hover:rotate-3">
              <span className="text-2xl text-white">📦</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground tracking-tight leading-none uppercase">Gestión de Correspondencia</h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1.5 tracking-[0.2em]">Sincronizado con Vigilancia</p>
            </div>
          </div>

          <nav className="flex gap-1.5 bg-background p-1.5 rounded-2xl border border-border transition-colors">
            <button onClick={() => setActiveTab("paquetes")} className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === "paquetes" ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-sm border border-border" : "text-slate-400 hover:text-indigo-500"}`}>📦 Paquetes</button>
            <button onClick={() => setActiveTab("recibos")} className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === "recibos" ? "bg-card text-indigo-600 dark:text-indigo-400 shadow-sm border border-border" : "text-slate-400 hover:text-indigo-500"}`}>📄 Recibos Públicos</button>
            <div className="w-px bg-border h-6 my-auto mx-1"></div>
            <button onClick={() => setActiveTab(activeTab.includes("recibo") ? "nuevo_recibo" : "nuevo_paquete")} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all">
              {activeTab.includes("recibo") ? "+ Nuevo Lote" : "+ Registrar Paquete"}
            </button>
          </nav>
        </div>

        {/* --- CONTENIDO DINÁMICO --- */}
        <main className="flex-1 flex flex-col min-h-0">
          
          {/* TAB: PAQUETES (LISTADO) */}
          {activeTab === "paquetes" && (
            <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
               <div className="bg-card p-4 rounded-3xl border border-border flex flex-wrap gap-4 items-end shadow-sm">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Estado de Paquete</label>
                    <select value={filtroEstadoPaquete} onChange={e => setFiltroEstadoPaquete(e.target.value)} className="input-standard !p-2 !text-xs !font-black uppercase mt-1 cursor-pointer">
                      <option value="">Todos los Estados</option>
                      <option value="en_espera">🟡 En Espera</option>
                      <option value="entregado">🟢 Entregado</option>
                    </select>
                  </div>
                  <div className="flex-[2] min-w-[250px]">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Buscar Remitente</label>
                    <input type="text" value={filtroRemitente} onChange={e => setFiltroRemitente(e.target.value)} placeholder="Ej: Amazon, DHL..." className="input-standard !p-2 !text-xs mt-1 uppercase" />
                  </div>
                  <button onClick={loadAllData} className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-all">Buscar</button>
               </div>

               <div className="flex-1 bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden flex flex-col transition-colors">
                  <div className="overflow-y-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-background sticky top-0 z-10 border-b border-border transition-colors">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado / Fecha</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Residente / Destino</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Paquete</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border transition-colors">
                        {listaPaquetes.map(p => (
                          <tr key={p.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                            <td className="px-6 py-4">
                               <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-tighter ${p.estado === 'entregado' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-800'}`}>
                                 {p.estado === 'entregado' ? '✓ Entregado' : '🕒 En Espera'}
                               </span>
                               <p className="text-[11px] font-black mt-2 text-foreground">{dayjs(p.fechaRecepcionLocal).format("DD/MM HH:mm")}</p>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-[13px] font-black text-foreground uppercase tracking-tight leading-none">{p.destinatario}</p>
                               <p className="text-[10px] font-bold text-indigo-500 mt-1 uppercase italic tracking-tighter">Remitente: {p.remitente}</p>
                            </td>
                            <td className="px-6 py-4">
                               <span className="px-2 py-1 bg-background border border-border rounded text-[9px] font-black text-slate-500 uppercase">{p.tipoDocumento || 'Paquete'}</span>
                               {p.numeroGuia && <p className="text-[10px] font-mono text-indigo-400 mt-1"># {p.numeroGuia}</p>}
                            </td>
                            <td className="px-6 py-4 text-center">
                               {p.estado === 'en_espera' ? (
                                 <button onClick={() => setEntregarPaqueteModal({ isOpen: true, id: p.id })} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 dark:shadow-none">Entregar</button>
                               ) : (
                                 <div className="flex flex-col items-center">
                                   <span className="text-[10px] text-emerald-600 font-black">ENTREGADO A:</span>
                                   <span className="text-[9px] text-slate-400 uppercase font-bold">{p.recibidoPor}</span>
                                 </div>
                               )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}

          {/* TAB: RECIBOS PÚBLICOS (LISTADO) */}
          {activeTab === "recibos" && (
            <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
               {/* FILTRO HISTORIAL RECIBOS */}
               <div className="flex items-center justify-between bg-card p-3 rounded-2xl border border-border shadow-sm transition-colors">
                  <div className="flex items-center gap-2 px-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                     <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {mostrarArchivados ? "Mostrando Lotes Archivados" : "Mostrando Lotes Activos (En Sitio)"}
                     </p>
                  </div>
                  <button 
                    onClick={() => setMostrarArchivados(!mostrarArchivados)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${mostrarArchivados ? "bg-indigo-600 text-white border-indigo-600" : "bg-background text-indigo-600 border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"}`}
                  >
                    {mostrarArchivados ? "Ver Activos" : "Ver Archivados"}
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar pr-1 flex-1">
                  {listaRecibos.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-card rounded-3xl border border-dashed border-border transition-colors">
                       <span className="text-5xl opacity-20 grayscale">📂</span>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-4">No se hallaron registros en esta categoría</p>
                    </div>
                  ) : (
                    listaRecibos.map(r => (
                      <div key={r.id} className="bg-card rounded-3xl border-2 border-border p-6 flex flex-col gap-5 hover:border-indigo-400 transition-all duration-300 shadow-sm relative overflow-hidden group">
                         {/* Progreso Visual Fondo */}
                         <div className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${r.activo ? 'bg-indigo-600' : 'bg-emerald-500'}`} style={{ width: `${(r.totalEntregados / r.totalRecibidos) * 100}%` }}></div>
                         
                         <div className="flex justify-between items-start">
                            <div className={`p-3 rounded-2xl text-xl shadow-inner group-hover:scale-110 transition-transform ${r.activo ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                                {r.activo ? "📄" : "✅"}
                            </div>
                            <div className="text-right">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{r.activo ? 'Lote Activo' : 'Completado'}</p>
                               <p className="text-sm font-black text-foreground uppercase tracking-tight">{r.mes} {r.anio}</p>
                            </div>
                         </div>

                         <div>
                            <h3 className="text-lg font-black text-foreground uppercase tracking-tighter leading-none">{r.servicio}</h3>
                            <div className="flex items-center gap-2 mt-2">
                               <div className="flex-1 bg-background h-2 rounded-full overflow-hidden border border-border">
                                  <div className={`h-full bg-gradient-to-r ${r.activo ? 'from-indigo-500 to-indigo-600' : 'from-emerald-500 to-emerald-600'}`} style={{ width: `${(r.totalEntregados / r.totalRecibidos) * 100}%` }}></div>
                               </div>
                               <span className={`text-[10px] font-black ${r.activo ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{Math.round((r.totalEntregados / r.totalRecibidos) * 100)}%</span>
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-2 bg-background p-3 rounded-2xl border border-border">
                            <div className="text-center">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Pendientes</p>
                               <p className="text-xl font-black text-foreground">{r.pendientes}</p>
                            </div>
                            <div className="text-center border-l border-border">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Entregados</p>
                               <p className={`text-xl font-black ${r.activo ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{r.totalEntregados}</p>
                            </div>
                         </div>

                         <div className="flex gap-2">
                            {r.activo && (
                                <button 
                                    onClick={() => setEntregaReciboModal({ isOpen: true, id: r.id, servicio: r.servicio })}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
                                >
                                    Entregar
                                </button>
                            )}
                            <button 
                                onClick={() => handleVerEntregas(r.id, r.servicio)}
                                className={`py-3 px-4 bg-card border border-border rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${!r.activo && 'w-full'}`}
                                title="Ver detalles de entregas"
                            >
                                {r.activo ? "🔍" : "🔍 Ver Verificación"}
                            </button>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          )}

          {/* TAB: NUEVO PAQUETE */}
          {activeTab === "nuevo_paquete" && (
            <div className="bg-card p-6 md:p-10 rounded-[2.5rem] border border-border shadow-sm flex flex-col flex-grow min-h-0 animate-in slide-in-from-right duration-500 transition-colors">
               <div className="max-w-3xl mx-auto w-full space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-indigo-100 text-white">📦</div>
                    <div>
                      <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Recepción de Paquetería</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Registra el ingreso de mensajería y domicilios</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Empresa / Remitente *</label>
                      <input type="text" value={formRemitente} onChange={e => setFormRemitente(e.target.value)} className="input-standard !py-3 uppercase" placeholder="Ej: Servientrega, Pizza Hut..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Residente / Destino *</label>
                      <input type="text" value={formDestinatario} onChange={e => setFormDestinatario(e.target.value)} className="input-standard !py-3 uppercase" placeholder="Ej: Apto 502, Administración..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Tipo de Envío</label>
                      <select value={formTipoDoc} onChange={e => setFormTipoDoc(e.target.value)} className="input-standard !py-3 uppercase cursor-pointer">
                        <option value="">Seleccione tipo...</option>
                        <option value="Sobre">Sobre / Documento</option>
                        <option value="Paquete">Paquete / Caja</option>
                        <option value="Domicilio">Domicilio / Alimentos</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Nro de Guía (Si aplica)</label>
                      <input type="text" value={formGuia} onChange={e => setFormGuia(e.target.value)} className="input-standard !py-3 uppercase font-mono" placeholder="Opcional" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Detalles Adicionales</label>
                      <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} className="input-standard !py-3 h-20 resize-none" placeholder="Caja abierta, pago pendiente, etc." />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button onClick={() => setActiveTab("paquetes")} className="px-8 py-3 bg-background border border-border text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors">Cancelar</button>
                    <button onClick={handleCreatePaquete} className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Guardar Registro</button>
                  </div>
               </div>
            </div>
          )}

          {/* TAB: NUEVO LOTE DE RECIBOS */}
          {activeTab === "nuevo_recibo" && (
            <div className="bg-card p-6 md:p-10 rounded-[2.5rem] border border-border shadow-sm flex flex-col flex-grow min-h-0 animate-in slide-in-from-right duration-500 transition-colors">
               <div className="max-w-3xl mx-auto w-full space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-emerald-100 text-white">📄</div>
                    <div>
                      <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Carga Masiva de Recibos</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Registra la llegada de facturas de servicios públicos</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Tipo de Servicio *</label>
                      <select value={formServicio} onChange={e => setFormServicio(e.target.value)} className="input-standard !py-3 uppercase cursor-pointer">
                        <option value="">Seleccione servicio...</option>
                        <option value="Agua / Acueducto">💧 Agua / Acueducto</option>
                        <option value="Energía / Luz">⚡ Energía / Luz</option>
                        <option value="Gas Natural">🔥 Gas Natural</option>
                        <option value="Internet / TV">🌐 Internet / TV</option>
                        <option value="Administración">🏢 Administración</option>
                        <option value="Otro">📦 Otro</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Mes de Facturación *</label>
                      <select value={formMes} onChange={e => setFormMes(e.target.value)} className="input-standard !py-3 uppercase cursor-pointer">
                        <option value="">Seleccione mes...</option>
                        {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Cantidad Total Recibida *</label>
                      <input type="number" value={formCantidad} onChange={e => setFormCantidad(e.target.value)} className="input-standard !py-3 font-black text-lg" placeholder="Ej: 300" />
                      <p className="text-[9px] text-slate-400 italic px-1 uppercase tracking-tighter mt-1">El sistema creará un inventario de {formCantidad || '0'} facturas para entregar individualmente.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button onClick={() => setActiveTab("recibos")} className="px-8 py-3 bg-background border border-border text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors">Cancelar</button>
                    <button onClick={handleCreateLoteRecibos} className="px-10 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95">Crear Inventario</button>
                  </div>
               </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
