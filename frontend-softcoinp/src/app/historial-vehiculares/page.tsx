"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";

const BACKEND_BASE_URL = "http://localhost:5004/static";

interface AnotacionItem {
  id: string;
  vehiculoId: string;
  vehiculoPlaca?: string;
  texto: string;
  fechaCreacionUtc: string;
  registradoPor: string;
  registradoPorEmail?: string;
  vehiculoFotoUrl?: string; // 📸 Nueva propiedad
}

interface VehiculoAgrupado {
  vehiculoId: string;
  placa: string;
  fotoUrl?: string; // 📸 Nueva propiedad
  novedades: AnotacionItem[];
  ultimaFecha: string;
}

export default function HistorialVehicularesPage() {
  const router = useRouter();
  const [novedades, setNovedades] = useState<AnotacionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [desdeFilter, setDesdeFilter] = useState("");
  const [hastaFilter, setHastaFilter] = useState("");
  const [reporterFilter, setReporterFilter] = useState("");
  const [selectedVehiculo, setSelectedVehiculo] = useState<VehiculoAgrupado | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Cargar todas las novedades al inicio y leer filtros URL si existen
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const d = urlParams.get('desde');
    const h = urlParams.get('hasta');
    if (d) setDesdeFilter(d);
    if (h) setHastaFilter(h);
    
    // Auto-limpiar URL para no ensuciar la navegación futura
    window.history.replaceState(null, '', window.location.pathname);

    fetchAllNovedades();
  }, []);

  const fetchAllNovedades = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: AnotacionItem[] }>("/anotaciones");
      // Filtro para traer SÓLO las de vehículos
      const onlyVehiculos = (res.data.data || []).filter(a => a.vehiculoId);
      setNovedades(onlyVehiculos);
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
        n.vehiculoPlaca?.toLowerCase().includes(q) ||
        n.registradoPorEmail?.toLowerCase().includes(q);
      if (!matchesText) return false;
    }

    // 3. Filtro por Fechas
    if (desdeFilter || hastaFilter) {
      const fechaLog = new Date(n.fechaCreacionUtc);
      const year = fechaLog.getFullYear();
      const month = String(fechaLog.getMonth() + 1).padStart(2, '0');
      const day = String(fechaLog.getDate()).padStart(2, '0');
      const localDateStr = `${year}-${month}-${day}`;

      if (desdeFilter && localDateStr < desdeFilter) return false;
      if (hastaFilter && localDateStr > hastaFilter) return false;
    }

    // 4. Filtro por Reportante
    if (reporterFilter && n.registradoPorEmail !== reporterFilter) return false;

    return true;
  });

  // Obtener lista única de reportantes para el filtro
  const uniqueReporters = Array.from(new Set(novedades.map(n => n.registradoPorEmail).filter(Boolean)));

  // AGRUPACIÓN POR VEHÍCULO
  const vehiculosAgrupados: VehiculoAgrupado[] = Object.values(
    novedadesFiltradas.reduce((acc: { [key: string]: VehiculoAgrupado }, n) => {
      const vid = n.vehiculoId;
      if (!acc[vid]) {
        acc[vid] = {
          vehiculoId: vid,
          placa: n.vehiculoPlaca || "S/D",
          fotoUrl: n.vehiculoFotoUrl || undefined,
          novedades: [],
          ultimaFecha: n.fechaCreacionUtc
        };
      }
      acc[vid].novedades.push(n);
      // Mantener la fecha más reciente para ordenar
      if (new Date(n.fechaCreacionUtc) > new Date(acc[vid].ultimaFecha)) {
        acc[vid].ultimaFecha = n.fechaCreacionUtc;
      }
      return acc;
    }, {})
  ).sort((a, b) => new Date(b.ultimaFecha).getTime() - new Date(a.ultimaFecha).getTime());

  const clearFilters = () => {
    setFiltroBusqueda("");
    setDesdeFilter("");
    setHastaFilter("");
    setReporterFilter("");
    setCurrentPage(1);
  };

  // Cálculo de paginación
  const totalPages = Math.ceil(vehiculosAgrupados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const vehiculosPaginados = vehiculosAgrupados.slice(startIndex, startIndex + itemsPerPage);

  // Reset pagina al filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [filtroBusqueda, desdeFilter, hastaFilter, reporterFilter]);

  return (
    <div className="flex-1 h-auto lg:h-full flex flex-col min-h-0 bg-gray-50 p-2 lg:p-4 lg:overflow-hidden">
      <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col min-h-0">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-xl text-white shadow-md">
               <span className="text-xl">📋</span>
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Historial de Novedades Vehiculares</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestión integral de anotaciones de seguridad vehicular</p>
            </div>
          </div>
          
          <button
            onClick={() => router.push("/novedades-vehiculares")}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm font-bold active:scale-95 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Panel de Novedades
          </button>
        </div>

        {/* 🔍 Barra de Filtros (Compacta) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 mb-3 flex flex-wrap items-end gap-2 shrink-0">
          {/* Búsqueda por Texto */}
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <label className="text-[9px] uppercase font-black text-slate-400 px-1 tracking-widest">Búsqueda Libre</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                value={filtroBusqueda}
                onChange={e => setFiltroBusqueda(e.target.value)}
                placeholder="Placa o detalle..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none transition-all placeholder-slate-300 uppercase tracking-widest"
              />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1 w-32 lg:w-36">
              <label className="text-[9px] uppercase font-black text-slate-400 px-1 tracking-widest">Desde</label>
              <input
                type="date"
                value={desdeFilter}
                onChange={e => setDesdeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none transition-all"
              />
            </div>

            <div className="flex flex-col gap-1 w-32 lg:w-36">
              <label className="text-[9px] uppercase font-black text-slate-400 px-1 tracking-widest">Hasta</label>
              <input
                type="date"
                value={hastaFilter}
                onChange={e => setHastaFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 w-44">
            <label className="text-[9px] uppercase font-black text-slate-400 px-1 tracking-widest">Autor</label>
            <select
              value={reporterFilter}
              onChange={e => setReporterFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none transition-all"
            >
              <option value="">Cualquier Usuario</option>
              {uniqueReporters.map(email => (
                <option key={email} value={email}>{email?.split('@')[0]}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={fetchAllNovedades}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-lg shadow-blue-100 active:scale-95 flex items-center gap-2 uppercase tracking-widest"
            >
              <span>Filtrar</span>
            </button>
            <button
              onClick={clearFilters}
              className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-black transition-all active:scale-95 uppercase tracking-widest"
            >
              Borrar
            </button>
          </div>
        </div>

        {/* Conteo y Status */}
        <div className="flex items-center justify-between mb-2 px-1 shrink-0">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {loading ? "Cargando..." : (
              vehiculosAgrupados.length === 0 
                ? "No se hallaron registros" 
                : `Mostrando ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, vehiculosAgrupados.length)} de ${vehiculosAgrupados.length} vehículos`
            )}
          </p>
        </div>

        {/* 📋 Lista de vehículos agrupados (Con Scroll Interno) */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-0 custom-scrollbar pb-4 space-y-2">
          {loading ? (
            <div className="bg-white rounded-2xl p-20 flex flex-col items-center justify-center text-slate-400 gap-4 border border-slate-100">
               <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
               <p className="text-xs font-black uppercase tracking-widest">Sincronizando Historial...</p>
            </div>
          ) : vehiculosAgrupados.length === 0 ? (
            <div className="bg-white rounded-2xl py-20 text-center text-slate-300 border-2 border-dashed border-slate-100 flex flex-col items-center gap-3">
               <span className="text-5xl grayscale opacity-20">📭</span>
               <p className="text-xs font-black uppercase tracking-widest">No se encontraron resultados para los filtros aplicados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {vehiculosPaginados.map(v => (
                <div key={v.vehiculoId} className="bg-white rounded-xl shadow-sm border border-slate-100 p-2.5 px-4 hover:border-blue-200 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between gap-4">
                    {/* Info del Vehículo */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md overflow-hidden border border-slate-200">
                        {v.fotoUrl ? (
                          <img 
                            src={v.fotoUrl.startsWith('http') ? v.fotoUrl : `${BACKEND_BASE_URL}${v.fotoUrl}`} 
                            alt={v.placa}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          "🚗"
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-black text-slate-800 truncate uppercase leading-none mb-1">
                          PLACA: <span className="text-blue-600">{v.placa}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold tracking-tighter uppercase">
                           Vehículo
                        </p>
                      </div>
                    </div>

                    {/* Resumen Novedades */}
                    <div className="flex-1 min-w-0 hidden md:block border-l border-slate-50 pl-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 uppercase tracking-tighter">
                          {v.novedades.length} Eventos
                        </span>
                        <div className="flex items-center gap-1.5 opacity-60">
                           <span className="text-[10px]">📅</span>
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                              Último: {new Date(v.ultimaFecha).toLocaleDateString("es-CO", { day: '2-digit', month: 'short', year: 'numeric' })}
                           </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedVehiculo(v)}
                        className="bg-slate-50 hover:bg-blue-600 hover:text-white text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border border-blue-100 shadow-sm active:scale-95"
                      >
                        Ver Detalle
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🔢 Paginador (Premium) */}
        {totalPages > 1 && (
          <div className="bg-white border-t border-slate-100 p-3 flex items-center justify-between shrink-0">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Página {currentPage} de {totalPages}
             </div>
             <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 disabled:opacity-30 transition-all border border-transparent hover:border-slate-100"
                >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                
                <div className="flex gap-1">
                   {[...Array(totalPages)].map((_, i) => {
                     const page = i + 1;
                     // Mostrar solo algunas páginas si hay muchas
                     if (totalPages > 7) {
                       if (page > 1 && page < totalPages && Math.abs(page - currentPage) > 1) {
                         if (page === 2 || page === totalPages - 1) return <span key={page} className="px-1 text-slate-300">...</span>;
                         return null;
                       }
                     }
                     
                     return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                          currentPage === page 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-100 scale-110" 
                            : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
                        }`}
                      >
                        {page}
                      </button>
                     );
                   })}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 disabled:opacity-30 transition-all border border-transparent hover:border-slate-100"
                >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </button>
             </div>
          </div>
        )}
      </div>

      {/* MODAL DE DETALLE (Línea de Tiempo por Vehículo) */}
      {selectedVehiculo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[75vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-200">
            {/* Header Modal */}
            <div className="bg-slate-900 p-4 flex items-center justify-between shrink-0 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/20 overflow-hidden border-2 border-white/20">
                  {selectedVehiculo.fotoUrl ? (
                    <img 
                      src={selectedVehiculo.fotoUrl.startsWith('http') ? selectedVehiculo.fotoUrl : `${BACKEND_BASE_URL}${selectedVehiculo.fotoUrl}`} 
                      alt={selectedVehiculo.placa}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "🚗"
                  )}
                </div>
                <div>
                  <h3 className="text-white font-black text-lg tracking-tight uppercase leading-none">
                    {selectedVehiculo.placa}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">
                       {selectedVehiculo.novedades.length} Eventos registrados
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedVehiculo(null)}
                className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-full transition-all outline-none active:scale-90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Cuerpo Modal (Línea de tiempo scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/30">
              <div className="space-y-4 relative before:content-[''] before:absolute before:left-[13px] before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-200">
                {selectedVehiculo.novedades
                  .sort((a, b) => new Date(b.fechaCreacionUtc).getTime() - new Date(a.fechaCreacionUtc).getTime())
                  .map((anot) => (
                  <div key={anot.id} className="relative pl-9 group">
                    {/* Punto del timeline */}
                    <div className="absolute left-0 top-1.5 w-[28px] h-[28px] rounded-full bg-white border-2 border-blue-500 shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110">
                      <span className="text-[12px]">📝</span>
                    </div>
                    
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-0.5 px-2 bg-slate-50 rounded border border-slate-100">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                            {new Date(anot.fechaCreacionUtc).toLocaleString("es-CO", {
                              day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                          </span>
                        </div>
                        {anot.registradoPorEmail && (
                          <span className="text-[9px] text-blue-600 font-black bg-blue-50 px-2 py-0.5 rounded tracking-widest uppercase italic border border-blue-100/50">
                             {anot.registradoPorEmail.split('@')[0]}
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-slate-700 leading-snug font-bold whitespace-pre-wrap">
                        {anot.texto}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-3 bg-white border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedVehiculo(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-2.5 rounded-xl font-black text-[10px] transition-all shadow-md active:scale-95 uppercase tracking-widest"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
