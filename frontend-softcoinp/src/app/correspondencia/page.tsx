"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { correspondenciaService, CorrespondenciaDto } from "@/services/correspondenciaService";
import { recibosPublicosService, ReciboPublicoDto, EntregaReciboDto } from "@/services/recibosPublicosService";
import { personalService } from "@/services/personalService";
import { tipoService, TipoPersonal } from "@/services/tipoService";
import CustomModal, { ModalType } from "@/components/CustomModal";
import { getCurrentUser, UserPayload } from "@/utils/auth";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { 
  Package, 
  FileText, 
  FolderOpen, 
  CheckCircle2, 
  Clock, 
  Search, 
  ArrowLeft,
  X,
  User,
  Check
} from "lucide-react";

dayjs.locale("es");

export default function CorrespondenciaPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"paquetes" | "recibos" | "nuevo_paquete" | "nuevo_recibo">("paquetes");

  // --- ESTADOS TIPOS PERSONA ---
  const [tiposPersona, setTiposPersona] = useState<TipoPersonal[]>([]);
  const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([]);

  // --- ESTADOS PAQUETES ---
  const [listaPaquetes, setListaPaquetes] = useState<CorrespondenciaDto[]>([]);
  const [filtroEstadoPaquete, setFiltroEstadoPaquete] = useState("");
  const [filtroRemitente, setFiltroRemitente] = useState("");
  const [formRemitente, setFormRemitente] = useState("");
  const [formDestinatario, setFormDestinatario] = useState("");
  const [formTipoDoc, setFormTipoDoc] = useState("");
  const [formGuia, setFormGuia] = useState("");
  const [formDesc, setFormDesc] = useState("");

  // --- ESTADOS BUSQUEDA RESIDENTE ---
  const [buscandoResidente, setBuscandoResidente] = useState(false);
  const [residenteResultados, setResidenteResultados] = useState<any[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // --- ESTADOS RECIBOS ---
  const [listaRecibos, setListaRecibos] = useState<ReciboPublicoDto[]>([]);
  const [mostrarArchivados, setMostrarArchivados] = useState(false);
  const [formServicio, setFormServicio] = useState("");
  const [formMes, setFormMes] = useState("");
  const [formAnio, setFormAnio] = useState(String(new Date().getFullYear()));
  const [formCantidad, setFormCantidad] = useState("");
  
  // Filtros Historial Recibos
  const [filtroHServicio, setFiltroHServicio] = useState("");
  const [filtroHMes, setFiltroHMes] = useState("");
  const [filtroHAnio, setFiltroHAnio] = useState("");
  
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
      const [p, r, t] = await Promise.all([
        correspondenciaService.getAll(filtroEstadoPaquete, filtroRemitente, ""),
        mostrarArchivados 
          ? recibosPublicosService.getHistorial(filtroHServicio, filtroHMes, filtroHAnio ? parseInt(filtroHAnio) : undefined) 
          : recibosPublicosService.getActivos(),
        tipoService.getTipos()
      ]);
      setListaPaquetes(p);
      setListaRecibos(r);
      setTiposPersona(t.filter(x => x.activo));
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const showModal = (msg: string, type: ModalType, title?: string, onConfirm?: () => void) => {
    setModal({ isOpen: true, message: msg, type, title: title || "Aviso", onConfirm });
  };

  // --- BUSQUEDA RESIDENTE ---
  const [campoBusquedaActual, setCampoBusquedaActual] = useState<"paquete" | "recibo">("paquete");

  const handleSearchResidente = async (termino: string, campo: "paquete" | "recibo") => {
    if (campo === "paquete") setFormDestinatario(termino);
    else setResidenteNombre(termino);

    setCampoBusquedaActual(campo);

    if (termino.length < 2) {
      setResidenteResultados([]);
      setMostrarSugerencias(false);
      return;
    }

    try {
      setBuscandoResidente(true);
      const res = await personalService.buscarPorNombre(termino);
      setResidenteResultados(res.data || []);
      setMostrarSugerencias(true);
    } catch (error) {
      console.error("Error buscando residente:", error);
    } finally {
      setBuscandoResidente(false);
    }
  };

  const handleSelectResidente = (p: any) => {
    const nombreCompleto = `${p.nombre} ${p.apellido}`.toUpperCase();
    if (campoBusquedaActual === "paquete") setFormDestinatario(nombreCompleto);
    else setResidenteNombre(nombreCompleto);
    
    setResidenteResultados([]);
    setMostrarSugerencias(false);
  };

  const toggleTipoSeleccionado = (nombre: string) => {
    setTiposSeleccionados(prev => 
      prev.includes(nombre) 
        ? prev.filter(t => t !== nombre) 
        : [...prev, nombre]
    );
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
    const anio = parseInt(formAnio);
    if (!formServicio || !formMes || isNaN(anio) || anio < 2000 || isNaN(cant) || cant <= 0) {
      showModal("Diligencie todos los campos correctamente.", "warning");
      return;
    }
    try {
      setLoading(true);
      
      // Primera verificación local rápida (solo activos) — incluye año
      const activos = await recibosPublicosService.getActivos();
      const duplicadoActivo = activos.some(r => r.servicio === formServicio && r.mes === formMes && r.anio === anio);
      
      if (duplicadoActivo) {
        showModal(`Ya existe un lote activo de ${formServicio} para ${formMes} de ${anio}. Por favor verifique en el listado.`, "warning", "Lote Existente");
        return;
      }

      await recibosPublicosService.create({ 
        servicio: formServicio, 
        mes: formMes, 
        anio, 
        totalRecibidos: cant,
        tiposPersonaDestinatarios: tiposSeleccionados
      });

      showModal("Lote de recibos creado exitosamente e iniciando notificaciones.", "success");
      setFormServicio(""); setFormMes(""); setFormAnio(String(new Date().getFullYear())); setFormCantidad("");
      setTiposSeleccionados([]);
      setActiveTab("recibos");
      loadAllData();
    } catch (err: any) { 
      if (err.response?.status === 409) {
        showModal(err.response.data || "Este lote ya fue registrado anteriormente (puede estar en el historial).", "warning", "Lote Duplicado");
      } else {
        showModal("Error al crear lote.", "error"); 
      }
    } finally { 
      setLoading(false); 
    }
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
    <div className="lg:h-full w-full bg-background p-2 md:p-3 lg:overflow-hidden flex flex-col items-center transition-colors duration-300">
      <div className="w-full max-w-[1400px] h-full flex flex-col min-h-0 gap-3">
        
        <CustomModal {...modal} onClose={() => setModal({ ...modal, isOpen: false })} />

        {/* --- MODAL ENTREGAR PAQUETE --- */}
        {entregarPaqueteModal.isOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEntregarPaqueteModal({ isOpen: false, id: null })}></div>
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden flex flex-col max-h-[85vh] border border-border animate-in zoom-in-95">
              <div className="bg-card px-5 py-3 border-b border-border flex justify-between items-center bg-gradient-to-r from-emerald-50/50 dark:from-emerald-900/20 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-600 rounded-full"></div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-foreground">Entregar Paquete</h2>
                </div>
                <button onClick={() => setEntregarPaqueteModal({ isOpen: false, id: null })} className="text-slate-400 hover:text-rose-600 p-1">
                  <X className="w-4 h-4" />
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
                <button onClick={handleConfirmEntregarPaquete} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md shadow-emerald-100">Confirmar Entrega</button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL ENTREGAR RECIBO --- */}
        {entregaReciboModal.isOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEntregaReciboModal({ isOpen: false, id: null, servicio: "" })}></div>
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden flex flex-col max-h-[85vh] border border-border animate-in zoom-in-95">
              <div className="bg-card px-5 py-3 border-b border-border flex justify-between items-center bg-gradient-to-r from-emerald-50/50 dark:from-emerald-900/20 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-600 rounded-full"></div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-foreground">Entregar: {entregaReciboModal.servicio}</h2>
                </div>
                <button onClick={() => setEntregaReciboModal({ isOpen: false, id: null, servicio: "" })} className="text-slate-400 hover:text-rose-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="relative">
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1 tracking-widest">Nombre del Residente *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={residenteNombre} 
                      onChange={e => handleSearchResidente(e.target.value, "recibo")} 
                      onFocus={() => residenteNombre.length >= 2 && setMostrarSugerencias(true)}
                      onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                      className="input-standard !text-[10px] pr-8" 
                      placeholder="Nombre Completo" 
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                      {buscandoResidente && campoBusquedaActual === "recibo" ? (
                        <div className="w-3 h-3 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>

                  {mostrarSugerencias && campoBusquedaActual === "recibo" && residenteResultados.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {residenteResultados.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleSelectResidente(p)}
                            className="w-full flex items-center gap-2 p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border-b border-border last:border-0 text-left"
                          >
                            <User className="w-3 h-3 text-emerald-600" />
                            <div>
                              <p className="text-[10px] font-black text-foreground uppercase leading-tight">{p.nombre} {p.apellido}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">DOC: {p.documento}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] border border-border animate-in zoom-in-95">
              <div className="bg-card px-6 py-4 border-b border-border flex justify-between items-center bg-gradient-to-r from-emerald-50/50 dark:from-emerald-900/20 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-5 bg-emerald-600 rounded-full"></div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Relación de Entregas: {verEntregasModal.servicio}</h2>
                </div>
                <button onClick={() => setVerEntregasModal({ isOpen: false, id: null, servicio: "" })} className="text-slate-400 hover:text-rose-600 p-1 transition-all hover:rotate-90">
                  <X className="w-5 h-5" />
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
                      <tr><td colSpan={3} className="text-center p-6 text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-[8px]">Sin registros</td></tr>
                    ) : (
                      entregasDetalle.map(e => (
                        <tr key={e.id} className="hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 transition-colors">
                          <td className="px-4 py-1.5">
                            <p className="text-[10px] font-black text-foreground uppercase tracking-tight">{e.residenteNombre}</p>
                            <p className="text-[9px] font-bold text-cyan-500 uppercase tracking-widest">{e.apartamento}</p>
                          </td>
                          <td className="px-4 py-1.5">
                            <p className="text-[10px] font-black text-foreground">{dayjs(e.fechaEntregaUtc).format("DD/MM/YY")}</p>
                            <p className="text-[9px] font-bold text-slate-400">{dayjs(e.fechaEntregaUtc).format("HH:mm")}</p>
                          </td>
                          <td className="px-4 py-1.5">
                            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 px-1.5 py-0.5 rounded shadow-sm">
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
                <button onClick={() => setVerEntregasModal({ isOpen: false, id: null, servicio: "" })} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Entendido</button>
              </div>
            </div>
          </div>
        )}

        {/* HEADER & TABS PRINCIPALES */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2 bg-card p-2 rounded-xl border border-border shadow-sm transition-colors shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg shadow-sm flex-shrink-0 transition-transform hover:rotate-3">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-black text-foreground tracking-tight leading-none uppercase">Correspondencia</h1>
                <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1 tracking-[0.2em]">Sincronizado con Vigilancia</p>
              </div>
            </div>
          </div>

          <nav className="flex gap-1 bg-background p-1 rounded-lg border border-border transition-colors">
            <button onClick={() => setActiveTab("paquetes")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${activeTab === "paquetes" ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-sm border border-border" : "text-slate-400 hover:text-emerald-500"}`}><Package className="w-3 h-3" /> Paquetes</button>
            <button onClick={() => setActiveTab("recibos")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${activeTab === "recibos" ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-sm border border-border" : "text-slate-400 hover:text-emerald-500"}`}><FileText className="w-3 h-3" /> Recibos</button>
            <div className="w-px bg-border h-4 my-auto mx-0.5"></div>
            <button onClick={() => setActiveTab(activeTab.includes("recibo") ? "nuevo_recibo" : "nuevo_paquete")} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md shadow-emerald-100 dark:shadow-none hover:bg-emerald-700 active:scale-95 transition-all">
              {activeTab.includes("recibo") ? "+ Nuevo Lote" : "+ Registrar"}
            </button>
          </nav>
        </div>

        {/* --- CONTENIDO DINÁMICO --- */}
        <main className="flex-1 flex flex-col min-h-0">
          
          {/* TAB: PAQUETES (LISTADO) */}
          {activeTab === "paquetes" && (
            <div className="flex flex-col h-full gap-2 animate-in fade-in duration-500">
               <div className="bg-card p-3 rounded-xl border border-border flex flex-wrap gap-3 items-end shadow-sm">
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Estado</label>
                    <select value={filtroEstadoPaquete} onChange={e => setFiltroEstadoPaquete(e.target.value)} className="input-standard !p-2 !text-xs !font-black uppercase mt-1 cursor-pointer">
                      <option value="">Todos</option>
                      <option value="en_espera">🟡 En Espera</option>
                      <option value="entregado">🟢 Entregado</option>
                    </select>
                  </div>
                  <div className="flex-[2] min-w-[200px]">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Buscar Remitente</label>
                    <input type="text" value={filtroRemitente} onChange={e => setFiltroRemitente(e.target.value)} placeholder="Ej: Amazon, DHL..." className="input-standard !p-2 !text-xs mt-1 uppercase" />
                  </div>
                  <button onClick={loadAllData} className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md shadow-emerald-100 active:scale-95 transition-all">Buscar</button>
               </div>

               <div className="flex-1 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col transition-colors">
                  <div className="overflow-y-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-background sticky top-0 z-10 border-b border-border transition-colors">
                        <tr>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado / Fecha</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Destinatario</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Paquete</th>
                          <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border transition-colors">
                        {listaPaquetes.map(p => (
                          <tr key={p.id} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors group">
                            <td className="px-5 py-2.5">
                               <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-tighter ${p.estado === 'entregado' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-800'}`}>
                                 {p.estado === 'entregado' ? <><CheckCircle2 className="w-3 h-3" /> Entregado</> : <><Clock className="w-3 h-3" /> En Espera</>}
                               </span>
                               <p className="text-[11px] font-black mt-1 text-foreground">{dayjs(p.fechaRecepcionLocal).format("DD/MM HH:mm")}</p>
                            </td>
                            <td className="px-5 py-2.5">
                               <p className="text-[13px] font-black text-foreground uppercase tracking-tight leading-none truncate max-w-[250px]">{p.destinatario}</p>
                               <p className="text-[10px] font-bold text-cyan-600 mt-1 uppercase italic tracking-tighter">De: {p.remitente}</p>
                            </td>
                            <td className="px-5 py-2.5">
                               <span className="px-2 py-1 bg-background border border-border rounded text-[9px] font-black text-slate-500 uppercase">{p.tipoDocumento || 'Paquete'}</span>
                               {p.numeroGuia && <p className="text-[11px] font-mono text-cyan-500 mt-1"># {p.numeroGuia}</p>}
                            </td>
                            <td className="px-5 py-2.5 text-center">
                               {p.estado === 'en_espera' ? (
                                 <button onClick={() => setEntregarPaqueteModal({ isOpen: true, id: p.id })} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm">Entregar</button>
                               ) : (
                                 <div className="flex flex-col items-center leading-tight">
                                   <span className="text-[10px] text-emerald-600 font-black uppercase">Entregado</span>
                                   <span className="text-[9px] text-slate-400 uppercase font-bold truncate max-w-[100px]">{p.recibidoPor}</span>
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
            <div className="flex flex-col h-full gap-2 animate-in fade-in duration-500">
               {/* FILTRO HISTORIAL RECIBOS */}
               <div className="flex items-center justify-between bg-card p-2 rounded-xl border border-border shadow-sm transition-colors">
                  <div className="flex items-center gap-2 px-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                     <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {mostrarArchivados ? "Lotes Archivados" : "Lotes Activos (En Sitio)"}
                     </p>
                  </div>
                  <button 
                    onClick={() => setMostrarArchivados(!mostrarArchivados)}
                    className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${mostrarArchivados ? "bg-emerald-600 text-white border-emerald-600" : "bg-background text-emerald-600 border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"}`}
                  >
                    {mostrarArchivados ? "Ver Activos" : "Ver Archivados"}
                  </button>
               </div>

               <div className="flex-1 min-h-0 flex flex-col">
                  {mostrarArchivados ? (
                    /* VISTA COMPACTA (TABLA) PARA ARCHIVADOS */
                    <div className="flex flex-col h-full gap-2">
                       {/* BARRA DE FILTROS HISTORIAL - SIEMPRE VISIBLE */}
                       <div className="bg-card p-2 rounded-xl border border-border flex flex-wrap gap-2 items-end shadow-sm">
                          <div className="flex-1 min-w-[120px]">
                             <label className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">Servicio</label>
                             <select value={filtroHServicio} onChange={e => setFiltroHServicio(e.target.value)} className="input-standard !p-1.5 !text-[10px] mt-0.5 uppercase cursor-pointer">
                                <option value="">Todos</option>
                                <option value="Agua / Acueducto">💧 Agua</option>
                                <option value="Energía / Luz">⚡ Energía</option>
                                <option value="Gas Natural">🔥 Gas</option>
                                <option value="Internet / TV">🌐 Internet</option>
                                <option value="Administración">🏢 Admon</option>
                                <option value="Otro">📦 Otro</option>
                             </select>
                          </div>
                          <div className="flex-1 min-w-[120px]">
                             <label className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">Mes</label>
                             <select value={filtroHMes} onChange={e => setFiltroHMes(e.target.value)} className="input-standard !p-1.5 !text-[10px] mt-0.5 uppercase cursor-pointer">
                                <option value="">Todos</option>
                                {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map(m => (
                                   <option key={m} value={m}>{m}</option>
                                ))}
                             </select>
                          </div>
                          <div className="w-20">
                             <label className="text-[8px] font-black text-slate-400 uppercase ml-1 tracking-widest">Año</label>
                             <input type="number" value={filtroHAnio} onChange={e => setFiltroHAnio(e.target.value)} placeholder="2026" className="input-standard !p-1.5 !text-[10px] mt-0.5 font-black" />
                          </div>
                          <button onClick={loadAllData} className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md active:scale-95 transition-all">Filtrar</button>
                       </div>

                       <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col transition-colors flex-1">
                          {listaRecibos.length === 0 ? (
                            <div className="py-12 text-center flex flex-col items-center">
                               <FolderOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Sin registros</p>
                            </div>
                          ) : (
                            <div className="overflow-y-auto flex-1 custom-scrollbar">
                               <table className="w-full text-left border-collapse">
                                  <thead className="bg-background sticky top-0 z-10 border-b border-border transition-colors">
                                      <tr>
                                         <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Servicio</th>
                                         <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Periodo</th>
                                         <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Inv.</th>
                                         <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border transition-colors">
                                      {listaRecibos.map(r => (
                                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                          <td className="px-4 py-1.5">
                                              <div className="flex items-center gap-2">
                                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                  <p className="text-[11px] font-black text-foreground uppercase tracking-tight leading-none">{r.servicio}</p>
                                              </div>
                                          </td>
                                          <td className="px-4 py-1.5">
                                              <p className="text-[10px] font-black text-foreground uppercase leading-none">{r.mes}</p>
                                              <p className="text-[8px] font-bold text-slate-400">{r.anio}</p>
                                          </td>
                                          <td className="px-4 py-1.5 text-center">
                                              <span className="text-[10px] font-black text-emerald-600">{r.totalEntregados} / {r.totalRecibidos}</span>
                                          </td>
                                          <td className="px-4 py-1.5 text-center">
                                              <button 
                                                  onClick={() => handleVerEntregas(r.id, r.servicio)}
                                                  className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                              >
                                                  <Search className="w-3.5 h-3.5" />
                                              </button>
                                          </td>
                                      </tr>
                                      ))}
                                  </tbody>
                               </table>
                            </div>
                          )}
                       </div>
                    </div>
                  ) : (
                    /* VISTA DE TARJETAS (CARDS) PARA LOTES ACTIVOS */
                    listaRecibos.length === 0 ? (
                      <div className="py-12 text-center bg-card rounded-xl border border-dashed border-border transition-colors flex flex-col items-center">
                         <FolderOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Sin lotes activos</p>
                      </div>
                    ) : (
                      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-3 content-start" style={{ gridAutoRows: 'minmax(200px, auto)' }}>
                        {listaRecibos.map(r => (
                          <div key={r.id} className="bg-card rounded-xl border border-border p-4 flex flex-col gap-3 hover:border-emerald-400 transition-all duration-300 shadow-sm relative overflow-hidden group min-h-[200px]">
                            {/* Progreso Visual Fondo */}
                            <div className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 bg-emerald-600`} style={{ width: `${(r.totalEntregados / r.totalRecibidos) * 100}%` }}></div>
                            
                            <div className="flex justify-between items-start">
                                <div className={`p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400`}>
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="text-right">
                                  <p className="text-[11px] font-black text-foreground uppercase tracking-tight">{r.mes} {r.anio}</p>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-[14px] font-black text-foreground uppercase tracking-tighter leading-tight truncate">{r.servicio}</h3>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <div className="flex-1 bg-background h-1.5 rounded-full overflow-hidden border border-border transition-colors">
                                      <div className={`h-full bg-emerald-500`} style={{ width: `${(r.totalEntregados / r.totalRecibidos) * 100}%` }}></div>
                                  </div>
                                  <span className={`text-[9px] font-black text-emerald-600`}>{Math.round((r.totalEntregados / r.totalRecibidos) * 100)}%</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 bg-background p-2 rounded-lg border border-border transition-colors">
                                <div className="text-center">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Pendientes</p>
                                  <p className="text-base font-black text-foreground leading-none">{r.pendientes}</p>
                                </div>
                                <div className="text-center border-l border-border transition-colors">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Entregados</p>
                                  <p className={`text-base font-black text-emerald-600 leading-none`}>{r.totalEntregados}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-1.5">
                                <button 
                                    onClick={() => setEntregaReciboModal({ isOpen: true, id: r.id, servicio: r.servicio })}
                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                                >
                                    Entregar
                                </button>
                                <button 
                                    onClick={() => handleVerEntregas(r.id, r.servicio)}
                                    className="py-2 px-3 bg-card border border-border rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    <Search className="w-4 h-4 mx-auto" />
                                </button>
                            </div>
                          </div>
                        ))}
                        </div>
                      </div>
                    )
                  )}
               </div>
            </div>
          )}

          {/* TAB: NUEVO PAQUETE */}
          {activeTab === "nuevo_paquete" && (
            <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-md flex flex-col flex-grow min-h-0 animate-in slide-in-from-right duration-500 transition-colors overflow-y-auto custom-scrollbar">
               <div className="max-w-3xl mx-auto w-full space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-sm flex-shrink-0">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Registro de Paquetería</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5">Ingreso de mensajería y domicilios</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Empresa / Remitente *</label>
                      <input type="text" value={formRemitente} onChange={e => setFormRemitente(e.target.value)} className="input-standard !py-2.5 !text-[13px] uppercase" placeholder="Ej: Amazon, DHL..." />
                    </div>
                    <div className="space-y-2 relative">
                      <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Residente / Destinatario *</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={formDestinatario} 
                          onChange={e => handleSearchResidente(e.target.value, "paquete")} 
                          onFocus={() => formDestinatario.length >= 2 && setMostrarSugerencias(true)}
                          onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                          className="input-standard !py-2.5 !text-[13px] uppercase pr-10" 
                          placeholder="Buscar residente..." 
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {buscandoResidente ? (
                            <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                        </div>
                      </div>

                      {mostrarSugerencias && residenteResultados.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {residenteResultados.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => handleSelectResidente(p)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border-b border-border last:border-0 text-left"
                              >
                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
                                  <User className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-[13px] font-black text-foreground uppercase leading-tight">{p.nombre} {p.apellido}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">DOC: {p.documento}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Tipo de Envío</label>
                      <select value={formTipoDoc} onChange={e => setFormTipoDoc(e.target.value)} className="input-standard !py-2.5 !text-[13px] uppercase cursor-pointer">
                        <option value="">Seleccione...</option>
                        <option value="Sobre">Sobre / Documento</option>
                        <option value="Paquete">Paquete / Caja</option>
                        <option value="Domicilio">Domicilio / Alimentos</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Número de Guía</label>
                      <input type="text" value={formGuia} onChange={e => setFormGuia(e.target.value)} className="input-standard !py-2.5 !text-[13px] uppercase font-mono" placeholder="Opcional" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Observaciones</label>
                      <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} className="input-standard !py-2.5 !text-[13px] h-20 resize-none" placeholder="Detalles adicionales..." />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button onClick={() => setActiveTab("paquetes")} className="px-6 py-2.5 bg-background border border-border text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
                    <button onClick={handleCreatePaquete} className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95">Guardar Registro</button>
                  </div>
               </div>
            </div>
          )}

          {/* TAB: NUEVO LOTE DE RECIBOS */}
          {activeTab === "nuevo_recibo" && (
            <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-md flex flex-col flex-grow min-h-0 animate-in slide-in-from-right duration-500 transition-colors overflow-y-auto custom-scrollbar">
               <div className="max-w-3xl mx-auto w-full space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-sm flex-shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Carga Masiva de Recibos</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-0.5">Creación de inventario y avisos</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Tipo de Servicio *</label>
                      <select value={formServicio} onChange={e => setFormServicio(e.target.value)} className="input-standard !py-2.5 !text-[13px] uppercase cursor-pointer">
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
                      <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Mes de Facturación *</label>
                      <select value={formMes} onChange={e => setFormMes(e.target.value)} className="input-standard !py-2.5 !text-[13px] uppercase cursor-pointer">
                        <option value="">Seleccione mes...</option>
                        {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Año del Lote *</label>
                       <input type="number" value={formAnio} onChange={e => setFormAnio(e.target.value)} className="input-standard !py-2.5 !text-[13px] font-black" min="2000" max="2100" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Cantidad Recibida *</label>
                       <input type="number" value={formCantidad} onChange={e => setFormCantidad(e.target.value)} className="input-standard !py-2.5 !text-[14px] font-black" placeholder="Ej: 300" />
                     </div>

                     <div className="md:col-span-2 space-y-3 pt-2">
                        <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Notificar automáticamente a:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                           {tiposPersona.map(tipo => (
                              <button
                                 key={tipo.id}
                                 onClick={() => toggleTipoSeleccionado(tipo.nombre)}
                                 className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                                    tiposSeleccionados.includes(tipo.nombre)
                                       ? "border-emerald-500 bg-emerald-50/50 text-emerald-700"
                                       : "border-border bg-background text-slate-500 hover:border-slate-300"
                                 }`}
                              >
                                 <span className="text-[11px] font-black uppercase tracking-tight truncate pr-1">{tipo.nombre}</span>
                                 <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                    tiposSeleccionados.includes(tipo.nombre) ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                                 }`}>
                                    {tiposSeleccionados.includes(tipo.nombre) && <Check className="w-2.5 h-2.5" strokeWidth={5} />}
                                 </div>
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4">
                    <button onClick={() => setActiveTab("recibos")} className="px-6 py-2.5 bg-background border border-border text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Cancelar</button>
                    <button onClick={handleCreateLoteRecibos} className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95">Crear Inventario</button>
                  </div>
               </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
