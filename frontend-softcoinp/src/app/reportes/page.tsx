"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api, { ApiResponse } from "@/services/api";
import { anotacionService, AnotacionDto } from "@/services/anotacionService";

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
}

export default function ReportesPage() {
  const router = useRouter();
  const [documento, setDocumento] = useState("");
  const [persona, setPersona] = useState<PersonalResult | null>(null);
  const [anotaciones, setAnotaciones] = useState<AnotacionDto[]>([]);
  const [textoAnotacion, setTextoAnotacion] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

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

      // Cargar anotaciones del personal por su ID real de la tabla Personal
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
        personalId: persona.personalId!, // ID real de la tabla Personal
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
      alert(err.response?.data?.message || "Error al actualizar la anotación.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta anotación? Esta acción no se puede deshacer.")) return;
    try {
      await anotacionService.deleteAnotacion(id);
      setAnotaciones(anotaciones.filter(a => a.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al eliminar la anotación.");
    }
  };

  const fotoSrc = persona?.fotoUrl
    ? `${BACKEND_BASE_URL}/${persona.fotoUrl}`
    : null;

  return (
    <div className="h-screen bg-gray-50 p-6 overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          {/* Botón izquierda - Menú Principal */}
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 text-white py-1.5 px-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition duration-200 flex items-center text-sm"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Menú Principal
          </button>

          {/* Título centrado */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <h1 className="text-xl font-extrabold text-blue-700">🔍 Reportes de Seguridad</h1>
          </div>

          {/* Botón derecha - Historial */}
          <button
            onClick={() => router.push("/historial-novedades")}
            className="bg-yellow-500 hover:bg-yellow-600 text-white py-1.5 px-3 rounded-lg shadow-md transition duration-200 flex items-center text-sm font-semibold"
          >
            📋 Historial de Novedades
          </button>
        </div>

        {/* Buscador */}
        <form onSubmit={handleBuscar} className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={documento}
              onChange={(e) => setDocumento(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Número de documento..."
              inputMode="numeric"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={buscando || !documento.trim()}
            className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors text-sm disabled:opacity-50"
          >
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {errorBusqueda && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 text-sm">
            {errorBusqueda}
          </div>
        )}

        {persona && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-hidden pb-4">
            {/* Tarjeta de Persona (izquierda) */}
            <div className="lg:col-span-1 overflow-y-auto pr-1 custom-scrollbar">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-200 mb-4 border-4 border-blue-100 flex-shrink-0">
                  {fotoSrc ? (
                    <img src={fotoSrc} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">👤</div>
                  )}
                </div>
                <h2 className="text-lg font-bold text-gray-800">{persona.nombre} {persona.apellido}</h2>
                <p className="text-sm text-gray-500 mt-1">Doc: <span className="font-medium text-gray-700">{persona.documento}</span></p>
                <span className={`mt-2 inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                  persona.tipo === "empleado" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-blue-100 text-blue-800"
                }`}>
                  {persona.tipo === "empleado" ? "Empleado" : "Visitante"}
                </span>

                {persona.tieneEntradaActiva && (
                  <div className="mt-3 w-full bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-xs text-yellow-700 font-medium">
                    ⚠️ Tiene entrada activa
                  </div>
                )}

                <div className="mt-4 w-full border-t border-gray-100 pt-4 text-left space-y-2">
                  {persona.destino && (
                    <div>
                      <span className="text-xs text-gray-400 uppercase tracking-wide">Destino habitual</span>
                      <p className="text-sm text-gray-700">{persona.destino}</p>
                    </div>
                  )}
                  {persona.motivo && (
                    <div>
                      <span className="text-xs text-gray-400 uppercase tracking-wide">Motivo habitual</span>
                      <p className="text-sm text-gray-700">{persona.motivo}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Área de Novedades: 2 Columnas internas (Historial + Formulario) */}
            <div className="lg:col-span-2 grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-hidden">
              
              {/* BLOQUE IZQUIERDO: Historial (Timeline) */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <span className="text-xl">🕓</span> Historial de Novedades
                  </h3>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 uppercase">
                    {anotaciones.length} Registros
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-gray-50/20">
                  {anotaciones.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3 opacity-50">
                      <div className="text-5xl">📄</div>
                      <p className="text-sm font-medium italic">Sin anotaciones de seguridad</p>
                    </div>
                  ) : (
                    <div className="space-y-6 relative before:content-[''] before:absolute before:left-[11px] before:top-0 before:bottom-0 before:w-0.5 before:bg-blue-100">
                      {anotaciones.map((a) => (
                        <div key={a.id} className="relative pl-8">
                          {/* Punto de la línea de tiempo */}
                          <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-4 border-blue-500 shadow-sm z-10" />
                          
                          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">
                                {new Date(a.fechaCreacionUtc).toLocaleString("es-CO", {
                                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                                })}
                              </span>
                              <div className="flex gap-2">
                                {editingId !== a.id && (
                                  <>
                                    <button onClick={() => handleStartEdit(a)} className="text-[10px] font-bold text-blue-500 hover:text-blue-700 uppercase">Editar</button>
                                    <button onClick={() => handleDelete(a.id)} className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase">Eliminar</button>
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
                                  className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg text-sm focus:border-blue-500 outline-none resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                  <button onClick={handleCancelEdit} className="px-3 py-1 text-[10px] font-bold text-gray-500 bg-gray-50 rounded-lg uppercase">Cancelar</button>
                                  <button onClick={() => handleSaveEdit(a.id)} className="px-3 py-1 text-[10px] font-bold text-white bg-blue-600 rounded-lg uppercase">Guardar</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm text-gray-700 leading-relaxed font-medium mb-2">{a.texto}</p>
                                {a.registradoPorEmail && (
                                  <div className="pt-2 border-t border-gray-50 flex items-center gap-1.5">
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Reportado por:</span>
                                    <span className="text-[9px] text-blue-500 font-bold italic">{a.registradoPorEmail.split('@')[0]}</span>
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

              {/* BLOQUE DERECHO: Nueva Anotación (Sticky Form) */}
              <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-100 flex flex-col overflow-hidden h-fit">
                <div className="bg-blue-600 px-5 py-4 flex items-center gap-3">
                  <span className="text-xl">✍️</span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">Registar Nueva Novedad</h3>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Detalles del Incidente</label>
                    <textarea
                      value={textoAnotacion}
                      onChange={(e) => setTextoAnotacion(e.target.value)}
                      placeholder="Escriba aquí los detalles..."
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none placeholder-gray-400"
                    />
                  </div>

                  {errorGuardar && (
                    <div className="bg-red-50 border border-red-100 p-2 rounded-lg text-red-600 text-[10px] font-bold flex items-center gap-2 animate-bounce">
                      <span>⚠️</span> {errorGuardar}
                    </div>
                  )}
                  {successMsg && (
                    <div className="bg-green-50 border border-green-100 p-2 rounded-lg text-green-600 text-[10px] font-bold flex items-center gap-2">
                      <span>✅</span> {successMsg}
                    </div>
                  )}

                  <button
                    onClick={handleGuardarAnotacion}
                    disabled={guardando || !textoAnotacion.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 text-sm"
                  >
                    {guardando ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Guardando...
                      </>
                    ) : (
                      <>💾 GUARDAR ANOTACIÓN</>
                    )}
                  </button>

                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 mt-1">
                    <p className="text-[9px] text-blue-700 leading-normal italic font-medium">
                      * Este registro quedará vinculado permanentemente para auditoría.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
