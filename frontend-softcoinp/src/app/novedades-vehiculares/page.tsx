"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { vehiculoService, VehiculoDto } from "@/services/vehiculoService";
import { anotacionService, AnotacionDto } from "@/services/anotacionService";
import { getCurrentUser, UserPayload } from "@/utils/auth";
import CustomModal, { ModalType } from "@/components/CustomModal";

const BACKEND_BASE_URL = "http://localhost:5004/static";

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
    <div className="flex-1 h-auto lg:h-full flex flex-col min-h-0 bg-gray-50 p-2 lg:p-4 lg:overflow-hidden">
      <div className="max-w-[1700px] mx-auto w-full h-full flex flex-col min-h-0">
        
        {/* 📋 Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-100">
               <span className="text-xl">🚗</span>
            </div>
            <h1 className="text-lg lg:text-xl font-black text-slate-800 uppercase tracking-tight">Novedades Vehiculares</h1>
          </div>
          
          <button
            onClick={() => router.push("/historial-vehiculares")}
            className={`text-white py-2 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm font-bold active:scale-95 ${
                anotaciones.length > 0 
                  ? 'bg-red-600 animate-pulse-red' 
                  : 'bg-yellow-500 hover:bg-yellow-600'
            }`}
          >
            📋 Historial Vehicular
          </button>
        </div>

        {/* 🕵️‍♂️ Buscador Section */}
        <form onSubmit={handleBuscar} className="flex gap-2 mb-3 flex-shrink-0">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
               PLACA
            </div>
            <input
              type="text"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="ABC-123"
              className={`w-full pl-14 pr-12 py-2.5 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none shadow-sm text-sm font-bold transition-all uppercase tracking-widest ${
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
            disabled={buscando || !placa.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-blue-100 transition-all active:scale-95 text-[10px] uppercase disabled:opacity-50"
          >
            {buscando ? "..." : "Buscar"}
          </button>
        </form>

        {errorBusqueda && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-4 text-sm font-bold flex items-center gap-2">
            <span>❌</span> {errorBusqueda}
          </div>
        )}

        {vehiculo && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 min-w-0 overflow-y-auto lg:overflow-hidden pb-2">
            
            {/* 🚗 LEFT COLUMN: Perfil (3 Cols) */}
            <div className="lg:col-span-3 flex flex-col min-h-0">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 flex flex-col items-center text-center overflow-hidden flex-1 lg:overflow-y-auto custom-scrollbar">
                <div className="relative mb-2 group">
                  <div className="absolute inset-0 bg-blue-400 blur-lg opacity-10 rounded-full group-hover:opacity-20 transition-opacity"></div>
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center">
                    {fotoSrc ? (
                      <img src={fotoSrc} alt="Vehículo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl opacity-50">🚗</span>
                    )}
                  </div>
                </div>

                <h2 className="text-base font-black text-slate-800 tracking-tight leading-tight uppercase">{vehiculo.placa}</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">MARCA: <span className="text-slate-700">{vehiculo.marca || 'N/A'}</span></p>
                
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm border bg-blue-50 text-blue-600 border-blue-100">
                    {vehiculo.tipoVehiculo || 'N/A'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm border bg-slate-50 text-slate-600 border-slate-200 flex items-center gap-1">
                    {vehiculo.color && (
                      <span className="w-2 h-2 rounded-full border border-slate-300" style={{ backgroundColor: vehiculo.color.toLowerCase() === 'blanco' ? '#fff' : vehiculo.color.toLowerCase() === 'negro' ? '#000' : vehiculo.color.toLowerCase() }} />
                    )}
                    {vehiculo.color || 'N/A'}
                  </span>
                </div>

                <div className="mt-auto w-full border-t border-slate-100 pt-3 text-left grid grid-cols-1 gap-2">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Propietario / Conductor</span>
                    {vehiculo.propietarioNombre ? (
                      <>
                        <p className="text-[11px] font-bold text-slate-700 leading-tight truncate">{vehiculo.propietarioNombre} {vehiculo.propietarioApellido}</p>
                        <p className="text-[9px] text-slate-500 truncate mt-0.5 uppercase tracking-wide">{vehiculo.propietarioTipo} • {vehiculo.propietarioDocumento}</p>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic font-bold">Sin registro</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 📋 CENTER COLUMN: Historial (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                  <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5 uppercase tracking-tight leading-none">
                    <span className="text-lg">🕓</span> Novedades Vehiculares
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
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Sin registros de novedades</p>
                    </div>
                  ) : (
                    <div className="space-y-4 relative before:content-[''] before:absolute before:left-[11px] before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-100 before:rounded-full">
                      {anotaciones.map((a) => (
                        <div key={a.id} className="relative pl-8">
                          <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-[3px] shadow-sm z-10 transition-colors flex items-center justify-center ${a.texto.toUpperCase().includes('BLOQUEO') || a.texto.toUpperCase().includes('ROBO') ? 'border-rose-500' : 'border-blue-500'}`} />
                          
                          <div className={`bg-white rounded-xl p-3 border shadow-sm hover:shadow-md transition-all duration-300 ${a.texto.toUpperCase().includes('BLOQUEO') || a.texto.toUpperCase().includes('ROBO') ? 'border-rose-100' : 'border-slate-100'}`}>
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
                  <h3 className="text-xs font-black text-white uppercase tracking-tight">Nueva Novedad Vehicular</h3>
                </div>
                
                <div className="p-3 space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Detalle de la Novedad</label>
                    <textarea
                      value={textoAnotacion}
                      onChange={(e) => setTextoAnotacion(e.target.value)}
                      placeholder="Escriba aquí los incidentes, revisiones o antecedentes de este vehículo..."
                      rows={4}
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

        {/* Modal de Antecedentes (Timeline global) */}
        {isTimelineOpen && vehiculo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border-t-8 border-red-600">
              <div className="bg-white p-4 text-red-700 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight leading-none">Novedades Vehiculares</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{vehiculo.placa}</p>
                  </div>
                </div>
                <button onClick={() => setIsTimelineOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto bg-gray-50 custom-scrollbar">
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
        
        <CustomModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
        />
      </div>
    </div>
  );
}
