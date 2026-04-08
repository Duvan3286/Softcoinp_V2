"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { vehiculoService, VehiculoDto } from "@/services/vehiculoService";
import { anotacionService, AnotacionDto } from "@/services/anotacionService";
import { getCurrentUser, UserPayload } from "@/utils/auth";
import CustomModal, { ModalType } from "@/components/CustomModal";
import ImageZoomModal from "@/components/ImageZoomModal";

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api").replace(/\/api$/, "/static");

export default function NovedadesVehicularesPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UserPayload | null>(null);

  React.useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/dashboard");
    } else {
      setUsuario(user);
    }
  }, [router]);

  const [placa, setPlaca] = useState("");
  const [vehiculo, setVehiculo] = useState<VehiculoDto | null>(null);
  const [anotaciones, setAnotaciones] = useState<AnotacionDto[]>([]);
  const [textoAnotacion, setTextoAnotacion] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  const [isBlocking, setIsBlocking] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [fotoZoomUrl, setFotoZoomUrl] = useState<string | null>(null);

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
    onConfirm: undefined,
  });

  const showModal = (title: string, message: string, type: ModalType, onConfirm?: () => void) => {
    setModalConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa.trim()) return;

    setBuscando(true);
    setVehiculo(null);
    setAnotaciones([]);
    setErrorBusqueda(null);
    setErrorGuardar(null);
    setSuccessMsg(null);

    try {
      const v = await vehiculoService.getVehiculoPorPlaca(placa.toUpperCase().trim());
      if (v) {
        setVehiculo(v);
        const aList = await anotacionService.getAnotacionesPorVehiculo(v.id);
        setAnotaciones(aList);
      } else {
        setErrorBusqueda("No se encontró ningún vehículo con esa placa.");
      }
    } catch (err: any) {
      setErrorBusqueda("Error al buscar. Verifica la conexión con el servidor.");
    } finally {
      setBuscando(false);
    }
  };

  const handleGuardarAnotacion = async () => {
    if (!textoAnotacion.trim() || !vehiculo) return;
    setGuardando(true);
    setErrorGuardar(null);
    setSuccessMsg(null);

    try {
      const nueva = await anotacionService.createAnotacion({
        vehiculoId: vehiculo.id,
        texto: textoAnotacion.trim(),
      });
      setAnotaciones([nueva, ...anotaciones]);
      setTextoAnotacion("");
      setSuccessMsg("✅ Novedad guardada correctamente.");
    } catch (err: any) {
      setErrorGuardar(err.response?.data?.message || "Error al guardar la novedad.");
    } finally {
      setGuardando(false);
    }
  };

  const handleStartEdit = (a: AnotacionDto) => {
    setEditingId(a.id);
    setEditText(a.texto);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editText.trim()) return;
    try {
      const updated = await anotacionService.updateAnotacion(id, editText.trim());
      setAnotaciones(anotaciones.map(a => a.id === id ? { ...a, texto: updated.texto } : a));
      setEditingId(null);
      setEditText("");
    } catch (err: any) {
      showModal("Error", err.response?.data?.message || "Error al actualizar la novedad.", "error");
    }
  };

  const handleUnblockVehiculo = async () => {
    if (!vehiculo?.id) return;
    if (!motivoBloqueo.trim()) {
      showModal("Dato Requerido", "Debe indicar un motivo de desbloqueo para proceder.", "warning");
      return;
    }

    setIsBlocking(true);
    setErrorGuardar(null);
    setSuccessMsg(null);

    try {
      await vehiculoService.desbloquear(vehiculo.id, motivoBloqueo.trim());
      setVehiculo({ ...vehiculo, isBloqueado: false, motivoBloqueo: "" });
      setSuccessMsg("Vehículo desbloqueado correctamente.");
      setShowUnblockModal(false);
      setMotivoBloqueo("");
      const nuevasAnotaciones = await anotacionService.getAnotacionesPorVehiculo(vehiculo.id);
      setAnotaciones(nuevasAnotaciones);
    } catch (err: any) {
      setErrorGuardar(err.response?.data?.message || "Error al desbloquear el vehículo.");
    } finally {
      setIsBlocking(false);
    }
  };

  const handleDelete = async (id: string) => {
    showModal(
        "¿Eliminar Novedad?", 
        "¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.", 
        "confirm", 
        async () => {
            try {
                await anotacionService.deleteAnotacion(id);
                setAnotaciones(anotaciones.filter(a => a.id !== id));
                setSuccessMsg("Novedad eliminada.");
            } catch (err: any) {
                showModal("Error", err.response?.data?.message || "Error al eliminar la novedad.", "error");
            }
        }
    );
  };

  const fotoSrc = vehiculo?.fotoUrl
    ? (vehiculo.fotoUrl.startsWith('http') ? vehiculo.fotoUrl : `${BACKEND_BASE_URL}${vehiculo.fotoUrl}`)
    : null;

  return (
    <div className="flex-1 h-auto lg:h-full flex flex-col min-h-0 bg-background p-2 lg:p-4 lg:overflow-hidden transition-colors duration-300">
      <div className="max-w-[1700px] mx-auto w-full h-full flex flex-col min-h-0">
        
        <div className="flex-col lg:flex-row lg:items-center justify-between gap-2 mb-3 shrink-0 flex">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-sm dark:shadow-none">
               <span className="text-xl">🚗</span>
            </div>
            <h1 className="text-lg lg:text-xl font-black text-foreground uppercase tracking-tight">Novedades Vehiculares</h1>
          </div>
          
          <button
            onClick={() => router.push("/historial-vehiculares")}
            className={`text-white py-2 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm font-bold active:scale-95 ${
                anotaciones.length > 0 
                  ? 'bg-red-600 animate-pulse-red' 
                  : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            📋 Historial de Novedades
          </button>
        </div>

        {/* 🕵️‍♂️ Buscador Section */}
        <form onSubmit={handleBuscar} className="flex gap-2 mb-3 flex-shrink-0">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider">
               PLACA
            </div>
            <input
              type="text"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="ABC-123"
              className={`w-full pl-14 pr-12 py-2.5 border rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none shadow-sm text-sm font-bold transition-all uppercase tracking-widest ${
                anotaciones.length > 0 
                ? 'border-red-400 bg-red-50 dark:bg-red-950/10 ring-2 ring-red-50 dark:ring-red-900/10 text-foreground' 
                : 'border-border bg-card text-foreground'
              }`}
            />
            
            {anotaciones.length > 0 && (
                <button
                type="button"
                onClick={() => setIsTimelineOpen(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-red-600 text-white rounded-full shadow-lg animate-pulse hover:bg-red-700 transition-all flex items-center justify-center z-20"
                title="Ver Línea de Tiempo"
                >
                <span className="text-xs">⚠️</span>
                </button>
            )}
          </div>
          <button
            type="submit"
            disabled={buscando || !placa.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-black shadow-sm dark:shadow-none transition-all active:scale-95 text-[10px] uppercase disabled:opacity-50"
          >
            {buscando ? "..." : "Buscar"}
          </button>
        </form>

        {errorBusqueda && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-4 rounded-xl mb-4 text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top duration-300">
            <span>❌</span> {errorBusqueda}
          </div>
        )}

        {!vehiculo && !buscando && !errorBusqueda && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card rounded-xl border-2 border-dashed border-border animate-in fade-in zoom-in duration-500">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-10 animate-pulse"></div>
                <div className="relative w-32 h-32 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center text-white shadow-2xl shadow-sm dark:shadow-none">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1-1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-card p-2 rounded-xl shadow-lg border border-border">
                    <span className="text-2xl">🔍</span>
                </div>
            </div>
            <h2 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2">Novedades Vehiculares</h2>
            <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[10px] text-center max-w-sm leading-relaxed">
                Ingrese una placa de vehículo para gestionar el historial de novedades, bloqueos y alertas de seguridad
            </p>
            <div className="mt-8 flex gap-4 text-[9px] font-black uppercase tracking-tighter">
                <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-full border border-border text-slate-500">
                    <span>📋 HISTORIAL</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-full border border-border text-slate-500">
                    <span>🚫 BLOQUEOS</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-full border border-border text-slate-500">
                    <span>⚠️ ALERTAS</span>
                </div>
            </div>
          </div>
        )}

        {vehiculo && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 min-w-0 overflow-y-auto lg:overflow-hidden pb-2">
            
            {/* 🚗 LEFT COLUMN: Perfil (3 Cols) */}
            <div className="lg:col-span-3 flex flex-col min-h-0">
              <div className="bg-card rounded-xl shadow-sm border border-border p-3 flex flex-col items-center text-center overflow-hidden flex-1 lg:overflow-y-auto custom-scrollbar">
                <div className="relative mb-2 group">
                  <div className="absolute inset-0 bg-emerald-400 blur-lg opacity-10 rounded-full group-hover:opacity-20 transition-opacity"></div>
                  <div 
                    className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-border shadow-sm bg-background flex items-center justify-center cursor-pointer hover:scale-105 transition-transform group/img"
                    onClick={() => fotoSrc && setFotoZoomUrl(fotoSrc)}
                    title="Ver en grande"
                  >
                    {fotoSrc ? (
                      <img src={fotoSrc} alt="Vehículo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl opacity-50">🚗</span>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-white text-xs">🔍</span>
                    </div>
                  </div>
                </div>

                <h2 className="text-base font-black text-foreground tracking-tight leading-tight uppercase">{vehiculo.placa}</h2>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">MARCA: <span className="text-foreground">{vehiculo.marca || 'N/A'}</span></p>
                
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm border bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30">
                    {vehiculo.tipoVehiculo || 'N/A'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm border bg-background text-slate-600 dark:text-slate-400 border-border flex items-center gap-1">
                    {vehiculo.color && (
                      <span className="w-2 h-2 rounded-full border border-border" style={{ backgroundColor: vehiculo.color.toLowerCase() === 'blanco' ? '#fff' : vehiculo.color.toLowerCase() === 'negro' ? '#000' : vehiculo.color.toLowerCase() }} />
                    )}
                    {vehiculo.color || 'N/A'}
                  </span>
                </div>

                {vehiculo.isBloqueado && (
                  <div className="mt-2 w-full bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-lg p-3 text-center shadow-sm animate-pulse-red">
                    <p className="text-[8px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-tighter leading-none mb-1">🚫 DENEGADO</p>
                    <p className="text-[10px] font-bold text-rose-800 dark:text-rose-300 leading-tight">"{vehiculo.motivoBloqueo}"</p>
                  </div>
                )}

                <div className="mt-3 w-full">
                  {!vehiculo.isBloqueado ? (
                    <button
                      onClick={() => setShowBlockModal(true)}
                      className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-rose-600 dark:hover:bg-rose-700 text-white font-black py-2 rounded-lg text-[9px] tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 uppercase group"
                    >
                      <span>🚫</span> BLOQUEAR
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowUnblockModal(true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 rounded-lg text-[9px] tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 uppercase"
                    >
                       <span>🔓</span> Desbloquear
                    </button>
                  )}
                </div>

                <div className="mt-auto w-full border-t border-border pt-3 text-left grid grid-cols-1 gap-2">
                  <div className="p-2 bg-background rounded-lg border border-border">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block leading-none mb-1">Propietario / Conductor</span>
                    {vehiculo.propietarioNombre ? (
                      <>
                        <p className="text-[11px] font-bold text-card-foreground leading-tight truncate">{vehiculo.propietarioNombre} {vehiculo.propietarioApellido}</p>
                        <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate mt-0.5 uppercase tracking-wide">{vehiculo.propietarioTipo} • {vehiculo.propietarioDocumento}</p>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-400 dark:text-slate-600 italic font-bold">Sin registro</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 📋 CENTER COLUMN: Historial (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col min-h-0 bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card shrink-0">
                  <h3 className="text-xs font-black text-foreground flex items-center gap-1.5 uppercase tracking-tight leading-none">
                    <span className="text-lg">🕓</span> Historial de Novedades Vehiculares
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30 uppercase tracking-tighter">
                      {anotaciones.length} Eventos
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/20 dark:bg-slate-900/10">
                  {anotaciones.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-800 gap-3">
                      <div className="text-5xl grayscale opacity-20">📄</div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Sin registros de novedades</p>
                    </div>
                  ) : (
                    <div className="space-y-4 relative before:content-[''] before:absolute before:left-[11px] before:top-0 before:bottom-0 before:w-0.5 before:bg-border before:rounded-full">
                      {anotaciones.map((a) => (
                        <div key={a.id} className="relative pl-8">
                          <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full bg-card border-[3px] shadow-sm z-10 transition-colors flex items-center justify-center ${a.texto.toUpperCase().includes('BLOQUEO') || a.texto.toUpperCase().includes('ROBO') ? 'border-rose-500' : 'border-emerald-500'}`} />
                          
                          <div className={`bg-card rounded-xl p-3 border shadow-sm hover:shadow-md transition-all duration-300 ${a.texto.toUpperCase().includes('BLOQUEO') || a.texto.toUpperCase().includes('ROBO') ? 'border-rose-100 dark:border-rose-900/30' : 'border-border'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="p-0.5 px-2 bg-background rounded border border-border">
                                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                                  {new Date(a.fechaCreacionUtc).toLocaleString("es-CO", {
                                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                                  })}
                                </span>
                              </div>
                              <div className="flex gap-1.5">
                                {editingId !== a.id && (usuario?.role === "admin" || usuario?.role === "superadmin") && (
                                  <>
                                    <button onClick={() => handleStartEdit(a)} className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors" title="Editar">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <button onClick={() => handleDelete(a.id)} className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors" title="Eliminar">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {editingId === a.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  rows={3}
                                  className="w-full px-3 py-2 bg-background border-2 border-emerald-100 dark:border-emerald-900/50 rounded-lg text-[13px] font-medium focus:border-emerald-500 outline-none resize-none transition-all text-foreground"
                                />
                                <div className="flex justify-end gap-2">
                                  <button onClick={handleCancelEdit} className="px-3 py-1 text-[9px] font-black text-slate-500 bg-background rounded-lg uppercase tracking-tight hover:bg-slate-200 dark:hover:bg-slate-800 border border-border">Canc</button>
                                  <button onClick={() => handleSaveEdit(a.id)} className="px-5 py-1 text-[9px] font-black text-white bg-emerald-600 rounded-lg uppercase tracking-tight hover:bg-emerald-700 shadow-sm">Guardar</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-[13px] text-card-foreground leading-snug font-bold mb-2">{a.texto}</p>
                                {a.registradoPorEmail && (
                                  <div className="pt-2 border-t border-border flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      <div className="w-1 h-1 rounded-full bg-emerald-300"></div>
                                      <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none">Autor:</span>
                                    </div>
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded uppercase leading-none">{a.registradoPorEmail.split('@')[0]}</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            </div>

            {/* ✍️ RIGHT COLUMN: Formulario (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4 min-h-0 lg:overflow-y-auto custom-scrollbar">
              <div className="bg-card rounded-xl shadow-sm border-2 border-border flex flex-col overflow-hidden">
                <div className="bg-slate-800 dark:bg-slate-950 px-4 py-3 flex items-center gap-2.5 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                    <span className="text-lg">✍️</span>
                  </div>
                  <h3 className="text-xs font-black text-white uppercase tracking-tight">Nueva Novedad Vehicular</h3>
                </div>
                
                <div className="p-3 space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Detalle de la Novedad</label>
                    <textarea
                      value={textoAnotacion}
                      onChange={(e) => setTextoAnotacion(e.target.value)}
                      placeholder="Escriba aqui los detalles de la novedad..."
                      rows={4}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 outline-none transition-all resize-none placeholder-slate-300 dark:placeholder-slate-700 text-foreground"
                    />
                  </div>

                  {errorGuardar && (
                    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-2 rounded-lg text-rose-600 dark:text-rose-400 text-[9px] font-black flex items-center gap-1.5">
                      <span className="text-sm">⚠️</span> {errorGuardar}
                    </div>
                  )}
                  {successMsg && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400 text-[9px] font-black flex items-center gap-1.5">
                      <span className="text-sm">✅</span> {successMsg}
                    </div>
                  )}

                  <button
                    onClick={handleGuardarAnotacion}
                    disabled={guardando || !textoAnotacion.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-black shadow-sm dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-xs tracking-widest uppercase"
                  >
                    {guardando ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>💾 Registrar</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Antecedentes (Timeline global) */}
        {isTimelineOpen && vehiculo && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300 border-t-8 border-red-600">
              <div className="bg-card p-4 text-red-700 dark:text-red-400 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight leading-none">Novedades Vehiculares</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{vehiculo.placa}</p>
                  </div>
                </div>
                <button onClick={() => setIsTimelineOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-background transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto bg-background custom-scrollbar">
                <div className="space-y-4 relative before:content-[''] before:absolute before:left-[11px] before:top-0 before:bottom-0 before:w-0.5 before:bg-red-100 dark:before:bg-red-900/30">
                  {anotaciones.map((a) => (
                    <div key={a.id} className="relative pl-8">
                      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-card border-4 border-red-500 shadow-sm z-10" />
                      <div className="bg-card rounded-xl p-4 border border-red-100 dark:border-red-900/30 shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {new Date(a.fechaCreacionUtc).toLocaleString("es-CO", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-card-foreground font-medium">{a.texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-card border-t border-border flex justify-end">
                <button onClick={() => setIsTimelineOpen(false)} className="bg-slate-800 dark:bg-slate-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-900 dark:hover:bg-slate-600 transition-all shadow-md">Cerrar</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de Bloqueo */}
        {showBlockModal && vehiculo && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-red-600 p-5 text-white">
                <h3 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
                    🚫 Confirmar Bloqueo
                </h3>
                <p className="text-red-100 text-xs mt-1 font-medium italic">Se prohibirá el ingreso del vehículo {vehiculo.placa} de forma permanente hasta que sea revertido.</p>
              </div>
              <div className="p-6">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Motivo del Bloqueo (Obligatorio)</label>
                <textarea
                  value={motivoBloqueo}
                  onChange={(e) => setMotivoBloqueo(e.target.value)}
                  placeholder="Ej: Reporte de robo, falta de documentación, etc..."
                  className="w-full p-4 border border-red-200 dark:border-red-900/30 rounded-xl bg-red-50 dark:bg-red-950/10 focus:ring-2 focus:ring-red-500 outline-none text-sm min-h-[120px] text-foreground"
                  autoFocus
                />
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                        setShowBlockModal(false);
                        setMotivoBloqueo("");
                    }}
                    className="flex-1 bg-background text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm border border-border"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (!motivoBloqueo.trim()) {
                        showModal("Dato Requerido", "Debe indicar un motivo de bloqueo para proceder.", "warning");
                        return;
                      }
                      setIsBlocking(true);
                      try {
                        await vehiculoService.bloquear(vehiculo.id, motivoBloqueo);
                        setVehiculo({ ...vehiculo, isBloqueado: true, motivoBloqueo });
                        setSuccessMsg("Vehículo bloqueado exitosamente.");
                        setShowBlockModal(false);
                        setMotivoBloqueo("");
                        const nuevas = await anotacionService.getAnotacionesPorVehiculo(vehiculo.id);
                        setAnotaciones(nuevas);
                      } catch (err: any) {
                        showModal("Error", err.response?.data?.message || "Error al bloquear", "error");
                      } finally {
                        setIsBlocking(false);
                      }
                    }}
                    disabled={isBlocking}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg active:scale-95 disabled:bg-red-300 text-sm"
                  >
                    {isBlocking ? "Bloqueando..." : "Bloquear Ahora"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Desbloqueo */}
        {showUnblockModal && vehiculo && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-emerald-600 p-5 text-white">
                <h3 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
                    🔓 Desbloquear Vehículo
                </h3>
                <p className="text-emerald-100 text-xs mt-1 font-medium italic">Se permitirá nuevamente el ingreso del vehículo {vehiculo.placa}.</p>
              </div>
              <div className="p-6">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Motivo del Desbloqueo (Obligatorio)</label>
                <textarea
                  value={motivoBloqueo}
                  onChange={(e) => setMotivoBloqueo(e.target.value)}
                  placeholder="Ej: Documentación al día, error en reporte anterior..."
                  className="w-full p-4 border border-emerald-200 dark:border-emerald-900/30 rounded-xl bg-emerald-50 dark:bg-emerald-950/10 focus:ring-2 focus:ring-emerald-500 outline-none text-sm min-h-[120px] text-foreground"
                  autoFocus
                />
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                        setShowUnblockModal(false);
                        setMotivoBloqueo("");
                    }}
                    className="flex-1 bg-background text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm border border-border"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUnblockVehiculo}
                    disabled={isBlocking}
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg active:scale-95 disabled:bg-emerald-300 text-sm"
                  >
                    {isBlocking ? "Desbloqueando..." : "Desbloquear Ahora"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <CustomModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
        />

        <ImageZoomModal
            isOpen={!!fotoZoomUrl}
            onClose={() => setFotoZoomUrl(null)}
            imageUrl={fotoZoomUrl}
            title={vehiculo ? `Vehículo: ${vehiculo.placa}` : "Foto de Vehículo"}
        />
      </div>
    </div>
  );
}
