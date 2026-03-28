"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api, { ApiResponse } from "@/services/api";
import { anotacionService, AnotacionDto } from "@/services/anotacionService";
import { personalService } from "@/services/personalService";
import { getCurrentUser, UserPayload } from "@/utils/auth";
import CustomModal, { ModalType } from "@/components/CustomModal";
import ImageZoomModal from "@/components/ImageZoomModal";

const BACKEND_BASE_URL = "http://localhost:5004/static";

interface PersonalResult {
  id: string;          // ID del Registro (último)
  personalId?: string; // ID del Personal en la tabla Personal
  nombre: string;
  apellido: string;
  documento: string;
  tipo: string;
  fotoUrl?: string | null;
  destino?: string;
  motivo?: string;
  tieneEntradaActiva?: boolean;
  isBloqueado?: boolean;
  motivoBloqueo?: string;
}

export default function NovedadesPersonasPage() {
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

  const [documento, setDocumento] = useState("");
  const [persona, setPersona] = useState<PersonalResult | null>(null);
  const [anotaciones, setAnotaciones] = useState<AnotacionDto[]>([]);
  const [textoAnotacion, setTextoAnotacion] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isBlocking, setIsBlocking] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
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
  });

  const showModal = (title: string, message: string, type: ModalType, onConfirm?: () => void) => {
    setModalConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documento.trim()) return;

    setBuscando(true);
    setPersona(null);
    setAnotaciones([]);
    setErrorBusqueda(null);
    setErrorGuardar(null);
    setSuccessMsg(null);

    try {
      const res = await api.get<ApiResponse<PersonalResult>>("/registros/buscar", {
        params: { documento: documento.trim() },
      });
      const p = res.data.data;
      setPersona(p);

      if (p.personalId) {
        const aList = await anotacionService.getAnotacionesPorPersonal(p.personalId);
        setAnotaciones(aList);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setErrorBusqueda("No se encontró ninguna persona con ese número de documento.");
      } else {
        setErrorBusqueda("Error al buscar. Verifica la conexión con el servidor.");
      }
    } finally {
      setBuscando(false);
    }
  };

  const handleGuardarAnotacion = async () => {
    if (!textoAnotacion.trim() || !persona) return;
    setGuardando(true);
    setErrorGuardar(null);
    setSuccessMsg(null);

    try {
      const nueva = await anotacionService.createAnotacion({
        personalId: persona.personalId!,
        texto: textoAnotacion.trim(),
      });
      setAnotaciones([nueva, ...anotaciones]);
      setTextoAnotacion("");
      setSuccessMsg("✅ Anotación guardada correctamente.");
    } catch (err: any) {
      setErrorGuardar(err.response?.data?.message || "Error al guardar la anotación.");
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
      showModal("Error", err.response?.data?.message || "Error al actualizar la anotación.", "error");
    }
  };

  const handleDelete = async (id: string) => {
    showModal(
        "¿Eliminar Anotación?", 
        "¿Estás seguro de que deseas eliminar esta anotación? Esta acción no se puede deshacer.", 
        "confirm", 
        async () => {
            try {
                await anotacionService.deleteAnotacion(id);
                setAnotaciones(anotaciones.filter(a => a.id !== id));
                setSuccessMsg("Anotación eliminada.");
            } catch (err: any) {
                showModal("Error", err.response?.data?.message || "Error al eliminar la anotación.", "error");
            }
        }
    );
  };

  const handleUnblockPerson = async () => {
    if (!persona?.personalId) return;

    if (!motivoBloqueo.trim()) {
      showModal("Dato Requerido", "Debe indicar un motivo de desbloqueo para proceder.", "warning");
      return;
    }

    setIsBlocking(true);
    setErrorGuardar(null);
    setSuccessMsg(null);

    try {
      await personalService.desbloquear(persona.personalId, motivoBloqueo.trim());
      setPersona({ ...persona, isBloqueado: false, motivoBloqueo: "" });
      setSuccessMsg("Persona desbloqueada correctamente.");
      setShowUnblockModal(false);
      setMotivoBloqueo("");
      const nuevasAnotaciones = await anotacionService.getAnotacionesPorPersonal(persona.personalId);
      setAnotaciones(nuevasAnotaciones);
    } catch (err: any) {
      setErrorGuardar(err.response?.data?.message || "Error al desbloquear a la persona.");
    } finally {
      setIsBlocking(false);
    }
  };

  const fotoSrc = persona?.fotoUrl
    ? `${BACKEND_BASE_URL}/${persona.fotoUrl}`
    : null;

  return (
    <div className="flex-1 h-auto lg:h-full flex flex-col min-h-0 bg-gray-50 p-2 lg:p-4 lg:overflow-hidden">
      <div className="max-w-[1700px] mx-auto w-full h-full flex flex-col min-h-0">
        
        {/* 📋 Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-100">
               <span className="text-xl">🔍</span>
            </div>
            <h1 className="text-lg lg:text-xl font-black text-slate-800 uppercase tracking-tight">Novedades Con Personas</h1> 
          </div>
          
          <button
            onClick={() => router.push("/historial-novedades")}
            className={`text-white py-2 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm font-bold active:scale-95 ${
                anotaciones.length > 0 
                  ? 'bg-red-600 animate-pulse-red' 
                  : 'bg-yellow-500 hover:bg-yellow-600'
            }`}
          >
            📋 Historial de Novedades
          </button>
        </div>

        {/* 🕵️‍♂️ Buscador Section */}
        <form onSubmit={handleBuscar} className="flex gap-2 mb-3 flex-shrink-0">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
            </div>
            <input
              type="text"
              value={documento}
              onChange={(e) => setDocumento(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Ingrese número de documento para buscar..."
              inputMode="numeric"
              className={`w-full pl-11 pr-12 py-2.5 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm text-sm font-bold transition-all ${
                anotaciones.length > 0 ? 'border-red-400 bg-red-50 ring-2 ring-red-50' : 'border-slate-200 bg-white'
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
            disabled={buscando || !documento.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-blue-100 transition-all active:scale-95 text-[10px] uppercase disabled:opacity-50"
          >
            {buscando ? "..." : "Buscar"}
          </button>
        </form>

        {errorBusqueda && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top duration-300">
            <span>❌</span> {errorBusqueda}
          </div>
        )}

        {!persona && !buscando && !errorBusqueda && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white rounded-3xl border-2 border-dashed border-slate-200 animate-in fade-in zoom-in duration-500">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-10 animate-pulse"></div>
                <div className="relative w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-200">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-2xl shadow-lg">
                    <span className="text-2xl">🔍</span>
                </div>
            </div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Control de Novedades</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] text-center max-w-sm leading-relaxed">
                Ingrese un número de documento arriba para gestionar el historial de novedades, bloqueos y alertas de seguridad de una persona.
            </p>
            <div className="mt-8 flex gap-4 text-[9px] font-black uppercase tracking-tighter">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200 text-slate-500">
                    <span>📋 HISTORIAL</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200 text-slate-500">
                    <span>🚫 BLOQUEOS</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200 text-slate-500">
                    <span>⚠️ ALERTAS</span>
                </div>
            </div>
          </div>
        )}

        {persona && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 min-w-0 overflow-y-auto lg:overflow-hidden pb-2">
            
            {/* 👤 LEFT COLUMN: Perfil (3 Cols) */}
            <div className="lg:col-span-3 flex flex-col min-h-0">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 flex flex-col items-center text-center overflow-hidden flex-1 lg:overflow-y-auto custom-scrollbar">
                <div className="relative mb-2 group">
                  <div className="absolute inset-0 bg-blue-400 blur-lg opacity-10 rounded-full group-hover:opacity-20 transition-opacity"></div>
                  <div 
                    className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm bg-slate-50 cursor-pointer hover:scale-105 transition-transform group/img"
                    onClick={() => fotoSrc && setFotoZoomUrl(fotoSrc)}
                    title="Ver en grande"
                  >
                    {fotoSrc ? (
                      <img src={fotoSrc} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl text-slate-300 italic font-black">?</div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-white text-xs">🔍</span>
                    </div>
                  </div>
                </div>

                <h2 className="text-base font-black text-slate-800 tracking-tight leading-tight">{persona.nombre} {persona.apellido}</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: <span className="text-slate-700">{persona.documento}</span></p>
                
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm border ${
                    persona.tipo === "empleado" 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : "bg-blue-50 text-blue-600 border-blue-100"
                  }`}>
                    {persona.tipo}
                  </span>
                </div>

                 {persona.tieneEntradaActiva && (
                  <div className="mt-2 w-full bg-amber-50 border border-amber-200 rounded-lg p-1.5 text-[9px] text-amber-800 font-bold text-center flex items-center justify-center gap-1 shadow-sm uppercase">
                    <span>⚠️</span> EN SITIO
                  </div>
                )}

                {persona.isBloqueado && (
                  <div className="mt-2 w-full bg-rose-50 border border-rose-200 rounded-lg p-2 text-center shadow-sm">
                    <p className="text-[8px] font-black text-rose-600 uppercase tracking-tighter leading-none mb-1">🚫 DENEGADO</p>
                    <p className="text-[10px] font-bold text-rose-800 leading-tight">"{persona.motivoBloqueo}"</p>
                  </div>
                )}

                <div className="mt-3 w-full">
                  {!persona.isBloqueado ? (
                    <button
                      onClick={() => setShowBlockModal(true)}
                      className="w-full bg-slate-900 hover:bg-rose-600 text-white font-black py-2 rounded-lg text-[9px] tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 uppercase group"
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

                <div className="mt-auto w-full border-t border-slate-100 pt-4 text-left grid grid-cols-1 gap-2">
                  {persona.destino && (
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Destino habitual</span>
                      <p className="text-[11px] font-bold text-slate-700 leading-tight truncate">{persona.destino}</p>
                    </div>
                  )}
                  {persona.motivo && (
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Motivo recurrente</span>
                      <p className="text-[11px] font-bold text-slate-700 leading-tight truncate">{persona.motivo}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 📋 CENTER COLUMN: Historial (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-tight leading-none">
                    <span className="text-lg">🕓</span> Historial de Novedades
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100 uppercase tracking-tighter">
                      {anotaciones.length} Eventos
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/20">
                  {anotaciones.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                      <div className="text-5xl grayscale opacity-20">📄</div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Sin registros</p>
                    </div>
                  ) : (
                    <div className="space-y-4 relative before:content-[''] before:absolute before:left-[11px] before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-100 before:rounded-full">
                      {anotaciones.map((a) => (
                        <div key={a.id} className="relative pl-8">
                          <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-[3px] shadow-sm z-10 transition-colors flex items-center justify-center ${a.texto.toUpperCase().includes('BLOQUEO') ? 'border-rose-500' : 'border-blue-500'}`} />
                          
                          <div className={`bg-white rounded-xl p-3 border shadow-sm hover:shadow-md transition-all duration-300 ${a.texto.toUpperCase().includes('BLOQUEO') ? 'border-rose-100' : 'border-slate-100'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="p-0.5 px-2 bg-slate-50 rounded border border-slate-100">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                                  {new Date(a.fechaCreacionUtc).toLocaleString("es-CO", {
                                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                                  })}
                                </span>
                              </div>
                              <div className="flex gap-1.5">
                                {editingId !== a.id && (usuario?.role === "admin" || usuario?.role === "superadmin") && (
                                  <>
                                    <button onClick={() => handleStartEdit(a)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Editar">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <button onClick={() => handleDelete(a.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors" title="Eliminar">
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
                                  className="w-full px-3 py-2 bg-slate-50 border-2 border-blue-100 rounded-lg text-[13px] font-medium focus:border-blue-500 outline-none resize-none transition-all"
                                />
                                <div className="flex justify-end gap-2">
                                  <button onClick={handleCancelEdit} className="px-3 py-1 text-[9px] font-black text-slate-500 bg-slate-100 rounded-lg uppercase tracking-tight hover:bg-slate-200">Canc</button>
                                  <button onClick={() => handleSaveEdit(a.id)} className="px-5 py-1 text-[9px] font-black text-white bg-blue-600 rounded-lg uppercase tracking-tight hover:bg-blue-700 shadow-sm">Guardar</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-[13px] text-slate-700 leading-snug font-bold mb-2">{a.texto}</p>
                                {a.registradoPorEmail && (
                                  <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                      <div className="w-1 h-1 rounded-full bg-blue-300"></div>
                                      <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none">Autor:</span>
                                    </div>
                                    <span className="text-[9px] text-blue-600 font-black bg-blue-50 px-1.5 py-0.5 rounded uppercase leading-none">{a.registradoPorEmail.split('@')[0]}</span>
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
              <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-100 flex flex-col overflow-hidden">
                <div className="bg-slate-800 px-4 py-3 flex items-center gap-2.5 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                    <span className="text-lg">✍️</span>
                  </div>
                  <h3 className="text-xs font-black text-white uppercase tracking-tight">Nueva Novedad</h3>
                </div>
                
                <div className="p-3 space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Detalle de la Novedad</label>
                    <textarea
                      value={textoAnotacion}
                      onChange={(e) => setTextoAnotacion(e.target.value)}
                      placeholder="Escriba aquí los detalles de la novedad..."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none transition-all resize-none placeholder-slate-300"
                    />
                  </div>

                  {errorGuardar && (
                    <div className="bg-rose-50 border border-rose-100 p-2 rounded-lg text-rose-600 text-[9px] font-black flex items-center gap-1.5">
                      <span className="text-sm">⚠️</span> {errorGuardar}
                    </div>
                  )}
                  {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-emerald-600 text-[9px] font-black flex items-center gap-1.5">
                      <span className="text-sm">✅</span> {successMsg}
                    </div>
                  )}

                  <button
                    onClick={handleGuardarAnotacion}
                    disabled={guardando || !textoAnotacion.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-black shadow-lg shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-xs tracking-widest uppercase"
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

        {/* Modal de Antecedentes */}
        {isTimelineOpen && persona && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300 border-t-8 border-red-600">
              <div className="bg-white p-4 text-red-700 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight leading-none">Antecedentes Detectados</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{persona.nombre} {persona.apellido}</p>
                  </div>
                </div>
                <button onClick={() => setIsTimelineOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto bg-gray-50 custom-scrollbar">
                <div className="space-y-4 relative before:content-[''] before:absolute before:left-[11px] before:top-0 before:bottom-0 before:w-0.5 before:bg-red-100">
                  {anotaciones.map((a) => (
                    <div key={a.id} className="relative pl-8">
                      <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-4 border-red-500 shadow-sm z-10" />
                      <div className="bg-white rounded-xl p-4 border border-red-100 shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">
                            {new Date(a.fechaCreacionUtc).toLocaleString("es-CO", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">{a.texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-white border-t flex justify-end">
                <button onClick={() => setIsTimelineOpen(false)} className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-900 transition-all shadow-md">Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Bloqueo */}
        {showBlockModal && persona && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-red-600 p-5 text-white">
                <h3 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
                    🚫 Confirmar Bloqueo
                </h3>
                <p className="text-red-100 text-xs mt-1 font-medium italic">Se prohibirá el ingreso de {persona.nombre} {persona.apellido} de forma permanente hasta que sea revertido.</p>
              </div>
              <div className="p-6">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Motivo del Bloqueo (Obligatorio)</label>
                <textarea
                  value={motivoBloqueo}
                  onChange={(e) => setMotivoBloqueo(e.target.value)}
                  placeholder="Ej: Hurto detectado, comportamiento violento, etc..."
                  className="w-full p-4 border border-red-200 rounded-xl bg-red-50 focus:ring-2 focus:ring-red-500 outline-none text-sm min-h-[120px]"
                  autoFocus
                />
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                        setShowBlockModal(false);
                        setMotivoBloqueo("");
                    }}
                    className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm"
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
                        if (persona.personalId) {
                            await personalService.bloquear(persona.personalId, motivoBloqueo);
                            setPersona({ ...persona, isBloqueado: true, motivoBloqueo });
                            setSuccessMsg("Persona bloqueada exitosamente.");
                            setShowBlockModal(false);
                            setMotivoBloqueo("");
                            const novas = await anotacionService.getAnotacionesPorPersonal(persona.personalId);
                            setAnotaciones(novas);
                        }
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
        {showUnblockModal && persona && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-emerald-600 p-5 text-white">
                <h3 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
                    🔓 Desbloquear Persona
                </h3>
                <p className="text-emerald-100 text-xs mt-1 font-medium italic">Se permitirá nuevamente el ingreso de {persona.nombre} {persona.apellido}.</p>
              </div>
              <div className="p-6">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Motivo del Desbloqueo (Obligatorio)</label>
                <textarea
                  value={motivoBloqueo}
                  onChange={(e) => setMotivoBloqueo(e.target.value)}
                  placeholder="Ej: Documentación corregida, error en reporte, etc..."
                  className="w-full p-4 border border-emerald-200 rounded-xl bg-emerald-50 focus:ring-2 focus:ring-emerald-500 outline-none text-sm min-h-[120px]"
                  autoFocus
                />
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                        setShowUnblockModal(false);
                        setMotivoBloqueo("");
                    }}
                    className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUnblockPerson}
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
            title={persona ? `${persona.nombre} ${persona.apellido}` : "Foto de Perfil"}
        />
      </div>
    </div>
  );
}
