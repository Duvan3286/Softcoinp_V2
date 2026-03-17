"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { ApiResponse } from "@/services/api";

interface AnotacionItem {
  id: string;
  personalId: string;
  personalNombre?: string;
  personalApellido?: string;
  personalDocumento?: string;
  texto: string;
  fechaCreacionUtc: string;
  registradoPor: string;
  registradoPorEmail?: string;
}

interface PersonaAgrupada {
  personalId: string;
  nombreCompleto: string;
  documento: string;
  inicial: string;
  novedades: AnotacionItem[];
  ultimaFecha: string;
}

interface PersonalBasic {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
}

interface AnotacionesResponse {
  data: AnotacionItem[];
}

export default function HistorialNovedadesPage() {
  const router = useRouter();
  const [novedades, setNovedades] = useState<AnotacionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [desdeFilter, setDesdeFilter] = useState("");
  const [hastaFilter, setHastaFilter] = useState("");
  const [reporterFilter, setReporterFilter] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<PersonaAgrupada | null>(null);

  // Cargar todas las novedades al inicio
  useEffect(() => {
    fetchAllNovedades();
  }, []);

  const fetchAllNovedades = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: AnotacionItem[] }>("/anotaciones");
      setNovedades(res.data.data || []);
    } catch {
      setNovedades([]);
    } finally {
      setLoading(false);
    }
  };

  const novedadesFiltradas = novedades.filter(n => {
    // 1. Filtro por Texto (Búsqueda Libre)
    const q = filtroBusqueda.toLowerCase();
    if (q) {
      const matchesText = 
        n.texto.toLowerCase().includes(q) ||
        n.personalNombre?.toLowerCase().includes(q) ||
        n.personalApellido?.toLowerCase().includes(q) ||
        n.registradoPorEmail?.toLowerCase().includes(q);
      if (!matchesText) return false;
    }

    // 3. Filtro por Fechas
    if (desdeFilter || hastaFilter) {
      const fechaLog = new Date(n.fechaCreacionUtc);
      fechaLog.setHours(0, 0, 0, 0);

      if (desdeFilter) {
        const desde = new Date(desdeFilter);
        desde.setHours(0, 0, 0, 0);
        if (fechaLog < desde) return false;
      }

      if (hastaFilter) {
        const hasta = new Date(hastaFilter);
        hasta.setHours(0, 0, 0, 0);
        if (fechaLog > hasta) return false;
      }
    }

    // 4. Filtro por Reportante
    if (reporterFilter && n.registradoPorEmail !== reporterFilter) return false;

    return true;
  });

  // Obtener lista única de reportantes para el filtro
  const uniqueReporters = Array.from(new Set(novedades.map(n => n.registradoPorEmail).filter(Boolean)));

  // AGRUPACIÓN POR PERSONA
  const personasAgrupadas: PersonaAgrupada[] = Object.values(
    novedadesFiltradas.reduce((acc: { [key: string]: PersonaAgrupada }, n) => {
      const pid = n.personalId;
      if (!acc[pid]) {
        acc[pid] = {
          personalId: pid,
          nombreCompleto: `${n.personalNombre || "—"} ${n.personalApellido || ""}`.trim(),
          documento: n.personalDocumento || "S/D",
          inicial: (n.personalNombre?.[0] || "?").toUpperCase(),
          novedades: [],
          ultimaFecha: n.fechaCreacionUtc
        };
      }
      acc[pid].novedades.push(n);
      // Mantener la fecha más reciente para ordenar
      if (new Date(n.fechaCreacionUtc) > new Date(acc[pid].ultimaFecha)) {
        acc[pid].ultimaFecha = n.fechaCreacionUtc;
      }
      return acc;
    }, {})
  ).sort((a, b) => new Date(b.ultimaFecha).getTime() - new Date(a.ultimaFecha).getTime());

  const clearFilters = () => {
    setFiltroBusqueda("");
    setDesdeFilter("");
    setHastaFilter("");
    setReporterFilter("");
  };

  return (
    <div className="h-screen bg-gray-50 p-6 overflow-hidden flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">📋 Historial de Novedades</h1>
            <p className="text-sm text-gray-400 font-medium">
              Consulta y filtra todas las anotaciones de seguridad registradas.
            </p>
          </div>
          <button
            onClick={() => router.push("/reportes")}
            className="bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-lg shadow-md transition duration-200 flex items-center text-sm font-semibold gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Reportes
          </button>
        </div>

        {/* Barra de Filtros (Estilo Premium) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap items-end gap-3 shrink-0">
          {/* Búsqueda por Texto */}
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase font-black text-gray-400 px-1 tracking-widest">Búsqueda</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                value={filtroBusqueda}
                onChange={e => setFiltroBusqueda(e.target.value)}
                placeholder="Nombre, ID o palabras clave..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium placeholder-gray-400"
              />
            </div>
          </div>

          {/* Fecha Desde */}
          <div className="flex flex-col gap-1 w-36">
            <label className="text-[10px] uppercase font-black text-gray-400 px-1 tracking-widest">Desde</label>
            <input
              type="date"
              value={desdeFilter}
              onChange={e => setDesdeFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="flex flex-col gap-1 w-36">
            <label className="text-[10px] uppercase font-black text-gray-400 px-1 tracking-widest">Hasta</label>
            <input
              type="date"
              value={hastaFilter}
              onChange={e => setHastaFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Filtro por Reportante */}
          <div className="flex flex-col gap-1 w-48">
            <label className="text-[10px] uppercase font-black text-gray-400 px-1 tracking-widest">Reportado por</label>
            <select
              value={reporterFilter}
              onChange={e => setReporterFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all bg-white font-medium"
            >
              <option value="">Cualquier Usuario</option>
              {uniqueReporters.map(email => (
                <option key={email} value={email}>{email?.split('@')[0]}</option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <button
              onClick={fetchAllNovedades}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2 uppercase tracking-wide"
            >
              <span>APLICAR</span>
            </button>
            <button
              onClick={clearFilters}
              className="bg-gray-100 hover:bg-gray-200 text-gray-500 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 uppercase tracking-wide"
            >
              LIMPIAR
            </button>
          </div>
        </div>

        {/* Conteo y Status */}
        <div className="flex items-center justify-between mb-3 px-1 shrink-0">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
            {loading ? "Cargando..." : `${personasAgrupadas.length} personas con novedades`}
          </p>
        </div>

        {/* Lista de personas agrupadas (scrollable) */}
        <div className="flex-grow overflow-y-auto pr-1 shadow-inner custom-scrollbar pb-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando historial...</div>
          ) : personasAgrupadas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-12 text-center text-gray-400">
              No hay novedades registradas con estos filtros.
            </div>
          ) : (
            <div className="space-y-3">
              {personasAgrupadas.map(p => (
                <div key={p.personalId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 px-4 hover:border-blue-200 transition-colors group">
                  <div className="flex items-center justify-between gap-4">
                    {/* Info de la Persona */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-sm">
                        {p.inicial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate uppercase">
                          {p.nombreCompleto}
                        </p>
                        <p className="text-[10px] text-blue-500 font-bold tracking-tight">
                          Documento: {p.documento}
                        </p>
                      </div>
                    </div>

                    {/* Resumen Novedades */}
                    <div className="flex-1 min-w-0 hidden md:block border-l border-gray-100 pl-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700">{p.novedades.length} anotaciones</span>
                        <span className="text-[10px] text-gray-400 font-medium italic truncate">
                           última: {new Date(p.ultimaFecha).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Botón Detalle */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setSelectedPersona(p)}
                        className="bg-gray-50 hover:bg-blue-600 hover:text-white text-blue-600 px-5 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border border-blue-100 shadow-sm active:scale-95"
                      >
                        Ver Línea de Tiempo
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE DETALLE (Línea de Tiempo por Persona) */}
      {selectedPersona && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200">
            {/* Header Modal */}
            <div className="bg-blue-600 p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-600 text-xl font-black shadow-lg">
                  {selectedPersona.inicial}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg tracking-tight uppercase leading-none">
                    {selectedPersona.nombreCompleto}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-blue-100 text-[10px] font-black uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">
                      Documento: {selectedPersona.documento}
                    </span>
                    <span className="text-blue-200 text-[10px] font-bold">
                      • {selectedPersona.novedades.length} anotaciones
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPersona(null)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cuerpo Modal (Línea de tiempo scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 custom-scrollbar">
              <div className="space-y-6 relative before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-0 before:w-0.5 before:bg-blue-100">
                {selectedPersona.novedades
                  .sort((a, b) => new Date(b.fechaCreacionUtc).getTime() - new Date(a.fechaCreacionUtc).getTime())
                  .map((anot) => (
                  <div key={anot.id} className="relative pl-10 group">
                    {/* Punto del timeline */}
                    <div className="absolute left-0 top-1.5 w-[32px] h-[32px] rounded-full bg-white border-2 border-blue-500 shadow-sm flex items-center justify-center z-10">
                      <span className="text-[14px]">📝</span>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                          {new Date(anot.fechaCreacionUtc).toLocaleString("es-CO", {
                            day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </span>
                        {anot.registradoPorEmail && (
                          <span className="text-[9px] text-gray-400 font-bold uppercase">
                            👤 {anot.registradoPorEmail.split('@')[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                        {anot.texto}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-white border-t border-gray-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedPersona(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 uppercase tracking-widest"
              >
                Cerrar Historial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
