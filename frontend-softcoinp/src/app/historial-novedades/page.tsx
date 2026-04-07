"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { ApiResponse } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import NotificationModal from "@/components/NotificationModal";

interface AnotacionItem {
  id: string;
  personalId: string;
  vehiculoId?: string; 
  personalNombre?: string;
  personalApellido?: string;
  personalDocumento?: string;
  texto: string;
  fechaCreacionUtc: string;
  registradoPor: string;
  registradoPorEmail?: string;
  personalFotoUrl?: string; 
  personalIsBloqueado?: boolean; 
}

interface PersonaAgrupada {
  personalId: string;
  nombreCompleto: string;
  documento: string;
  inicial: string;
  fotoUrl?: string; 
  isBloqueado?: boolean; 
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

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api").replace(/\/api$/, "/static");

export default function HistorialNovedadesPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [notification, setNotification] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' }>({
    show: false, title: '', message: '', type: 'success'
  });
  const [novedades, setNovedades] = useState<AnotacionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [desdeFilter, setDesdeFilter] = useState("");
  const [hastaFilter, setHastaFilter] = useState("");
  const [reporterFilter, setReporterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); 
  const [exporting, setExporting] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaAgrupada | null>(null);

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
      const onlyPersonas = (res.data.data || []).filter(a => a.personalId && !a.vehiculoId);
      setNovedades(onlyPersonas);
    } catch {
      setNovedades([]);
    } finally {
      setLoading(false);
    }
  };

  const novedadesFiltradas = novedades.filter(n => {
    const q = filtroBusqueda.toLowerCase();
    if (q) {
      const matchesText = 
        n.texto.toLowerCase().includes(q) ||
        n.personalNombre?.toLowerCase().includes(q) ||
        n.personalApellido?.toLowerCase().includes(q) ||
        n.registradoPorEmail?.toLowerCase().includes(q);
      if (!matchesText) return false;
    }

    if (desdeFilter || hastaFilter) {
      const fechaLog = new Date(n.fechaCreacionUtc);
      const year = fechaLog.getFullYear();
      const month = String(fechaLog.getMonth() + 1).padStart(2, '0');
      const day = String(fechaLog.getDate()).padStart(2, '0');
      const localDateStr = `${year}-${month}-${day}`;

      if (desdeFilter && localDateStr < desdeFilter) return false;
      if (hastaFilter && localDateStr > hastaFilter) return false;
    }

    if (reporterFilter && n.registradoPorEmail !== reporterFilter) return false;

    if (statusFilter) {
      const currentlyBlocked = n.personalIsBloqueado === true;
      if (statusFilter === "bloqueado") {
        if (!currentlyBlocked) return false;
      } else if (statusFilter === "habilitado") {
        if (currentlyBlocked) return false;
      }
    }

    return true;
  });

  const uniqueReporters = Array.from(new Set(novedades.map(n => n.registradoPorEmail).filter(Boolean)));

  const personasAgrupadas: PersonaAgrupada[] = Object.values(
    novedadesFiltradas.reduce((acc: { [key: string]: PersonaAgrupada }, n) => {
      const pid = n.personalId;
      if (!acc[pid]) {
        acc[pid] = {
          personalId: pid,
          nombreCompleto: `${n.personalNombre || "—"} ${n.personalApellido || ""}`.trim(),
          documento: n.personalDocumento || "S/D",
          inicial: (n.personalNombre?.[0] || "?").toUpperCase(),
          fotoUrl: n.personalFotoUrl || undefined,
          isBloqueado: n.personalIsBloqueado,
          novedades: [],
          ultimaFecha: n.fechaCreacionUtc
        };
      }
      acc[pid].novedades.push(n);
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
    setStatusFilter("");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(personasAgrupadas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const personasPaginadas = personasAgrupadas.slice(startIndex, startIndex + itemsPerPage);
  
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (filtroBusqueda) params.append("query", filtroBusqueda);
      if (desdeFilter) params.append("desde", desdeFilter);
      if (hastaFilter) params.append("hasta", hastaFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await api.get(`/anotaciones/exportar-excel?${params.toString()}`, {
        responseType: 'blob'
      }) as any;

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Reporte_Seguridad_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error al exportar Excel:", err);
      setNotification({
        show: true,
        title: "Error de Exportación",
        message: "No se pudo generar el reporte. Verifique su conexión.",
        type: 'error'
      });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroBusqueda, desdeFilter, hastaFilter, reporterFilter, statusFilter]);

  return (
    <>
      <div className="flex-1 h-auto lg:h-full flex flex-col min-h-0 bg-background p-2 lg:p-4 lg:overflow-hidden relative transition-colors duration-300">
        <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col min-h-0">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-100 dark:shadow-none">
                <span className="text-xl">📋</span>
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-black text-foreground uppercase tracking-tight leading-none">Historial de Novedades Con Personas</h1>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Gestión integral de anotaciones de seguridad</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {hasPermission("exportar-historial-novedades") && (
                <button
                  onClick={handleExportExcel}
                  disabled={exporting || novedades.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none transition-all duration-300 flex items-center justify-center gap-2 text-sm font-bold active:scale-95 whitespace-nowrap disabled:opacity-50"
                >
                  {exporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <span className="text-lg">📥</span>
                      Exportar Excel
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => router.push("/novedades")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all duration-300 flex items-center justify-center gap-2 text-sm font-bold active:scale-95 whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Panel de Novedades
              </button>
            </div>
          </div>

          {/* 🔍 Barra de Filtros (Compacta) */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-3 mb-3 flex flex-wrap items-end gap-2 shrink-0">
            <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
              <label className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 px-1 tracking-widest">Búsqueda Libre</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                <input
                  type="text"
                  value={filtroBusqueda}
                  onChange={e => setFiltroBusqueda(e.target.value)}
                  placeholder="Nombre, ID o palabras..."
                  className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all placeholder-slate-300 dark:placeholder-slate-700 text-foreground"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1 w-32 lg:w-36">
                <label className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 px-1 tracking-widest">Desde</label>
                <input
                  type="date"
                  value={desdeFilter}
                  onChange={e => setDesdeFilter(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              <div className="flex flex-col gap-1 w-32 lg:w-36">
                <label className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 px-1 tracking-widest">Hasta</label>
                <input
                  type="date"
                  value={hastaFilter}
                  onChange={e => setHastaFilter(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 w-44">
              <label className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 px-1 tracking-widest">Autor</label>
              <select
                value={reporterFilter}
                onChange={e => setReporterFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all text-foreground"
              >
                <option value="">Cualquier Usuario</option>
                {uniqueReporters.map(email => (
                  <option key={email} value={email}>{email?.split('@')[0]}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1 w-40">
              <label className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 px-1 tracking-widest">Estado</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all shadow-sm text-foreground"
              >
                <option value="">Todos los Eventos</option>
                <option value="bloqueado">🚫 Bloqueados</option>
                <option value="habilitado">🔓 Habilitados</option>
              </select>
            </div>

            <div className="flex gap-2 ml-auto">
              <button
                onClick={fetchAllNovedades}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95 flex items-center gap-2 uppercase tracking-widest"
              >
                <span>Filtrar</span>
              </button>
              <button
                onClick={clearFilters}
                className="bg-background hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-black transition-all border border-border active:scale-95 uppercase tracking-widest"
              >
                Borrar
              </button>
            </div>
          </div>

          {/* Conteo y Status */}
          <div className="flex items-center justify-between mb-2 px-1 shrink-0">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
              {loading ? "Cargando..." : (
                personasAgrupadas.length === 0 
                  ? "No se hallaron registros" 
                  : `Mostrando ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, personasAgrupadas.length)} de ${personasAgrupadas.length} ciudadanos`
              )}
            </p>
          </div>

          {/* 📋 Lista de personas agrupadas (Con Scroll Interno) */}
          <div className="flex-1 overflow-y-auto pr-1 min-h-0 custom-scrollbar pb-4 space-y-2">
            {loading ? (
              <div className="bg-card rounded-2xl p-20 flex flex-col items-center justify-center text-slate-400 gap-4 border border-border">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-xs font-black uppercase tracking-widest">Sincronizando Historial...</p>
              </div>
            ) : personasAgrupadas.length === 0 ? (
              <div className="bg-card rounded-2xl py-20 text-center text-slate-300 dark:text-slate-700 border-2 border-dashed border-border flex flex-col items-center gap-3">
                <span className="text-5xl grayscale opacity-20">📭</span>
                <p className="text-xs font-black uppercase tracking-widest">No se encontraron resultados para los filtros aplicados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {personasPaginadas.map(p => (
                  <div key={p.personalId} className="bg-card rounded-xl shadow-sm border border-border p-2.5 px-4 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-slate-800 dark:bg-slate-950 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md overflow-hidden border border-border">
                          {p.fotoUrl ? (
                            <img 
                              src={p.fotoUrl.startsWith('http') ? p.fotoUrl : `${BACKEND_BASE_URL}${p.fotoUrl}`} 
                              alt={p.nombreCompleto}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            p.inicial
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-black text-foreground truncate uppercase leading-none mb-1 flex items-center gap-2">
                            {p.nombreCompleto}
                            {p.isBloqueado && (
                              <span className="bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[9px] px-1.5 py-0.5 rounded-md border border-red-200 dark:border-red-900/30 animate-pulse">
                                BLOQUEADO
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold tracking-tighter uppercase">
                              ID: {p.documento}
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 hidden md:block border-l border-border pl-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 bg-background px-2 py-1 rounded-lg border border-border uppercase tracking-tighter">
                            {p.novedades.length} Eventos
                          </span>
                          <div className="flex items-center gap-1.5 opacity-60">
                            <span className="text-[10px]">📅</span>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                                Último: {new Date(p.ultimaFecha).toLocaleDateString("es-CO", { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedPersona(p)}
                          className="bg-background hover:bg-indigo-600 dark:hover:bg-indigo-700 hover:text-white text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border border-border shadow-sm active:scale-95"
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
            <div className="bg-card border-t border-border p-3 flex items-center justify-between shrink-0">
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Página {currentPage} de {totalPages}
              </div>
              <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="p-2 hover:bg-background rounded-lg text-slate-400 dark:text-slate-600 disabled:opacity-30 transition-all border border-transparent hover:border-border"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (totalPages > 7) {
                        if (page > 1 && page < totalPages && Math.abs(page - currentPage) > 1) {
                          if (page === 2 || page === totalPages - 1) return <span key={page} className="px-1 text-slate-300 dark:text-slate-700">...</span>;
                          return null;
                        }
                      }
                      
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                            currentPage === page 
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none scale-110" 
                              : "bg-background text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-border"
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
                    className="p-2 hover:bg-background rounded-lg text-slate-400 dark:text-slate-600 disabled:opacity-30 transition-all border border-transparent hover:border-border"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL DE DETALLE (Línea de Tiempo por Persona) */}
        {selectedPersona && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[75vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-border">
              <div className="bg-slate-900 dark:bg-slate-950 p-4 flex items-center justify-between shrink-0 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/20 overflow-hidden border-2 border-white/20">
                    {selectedPersona.fotoUrl ? (
                      <img 
                        src={selectedPersona.fotoUrl.startsWith('http') ? selectedPersona.fotoUrl : `${BACKEND_BASE_URL}${selectedPersona.fotoUrl}`} 
                        alt={selectedPersona.nombreCompleto}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedPersona.inicial
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg tracking-tight uppercase leading-none flex items-center gap-2">
                      {selectedPersona.nombreCompleto}
                      {selectedPersona.isBloqueado && (
                        <span className="bg-red-500/20 text-red-400 text-[9px] px-1.5 py-0.5 rounded border border-red-500/30 animate-pulse">
                          BLOQUEADO
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-indigo-100 text-[9px] font-black uppercase tracking-widest bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                        ID: {selectedPersona.documento}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-tight">
                         {selectedPersona.novedades.length} Eventos registrados
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPersona(null)}
                  className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-full transition-all outline-none active:scale-90"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-background">
                <div className="space-y-4 relative before:content-[''] before:absolute before:left-[13px] before:top-2 before:bottom-0 before:w-0.5 before:bg-border">
                  {selectedPersona.novedades
                    .sort((a, b) => new Date(b.fechaCreacionUtc).getTime() - new Date(a.fechaCreacionUtc).getTime())
                    .map((anot) => (
                    <div key={anot.id} className="relative pl-9 group">
                      <div className="absolute left-0 top-1.5 w-[28px] h-[28px] rounded-full bg-card border-2 border-indigo-500 shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110">
                        <span className="text-[12px]">📝</span>
                      </div>
                      
                      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm transition-all hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="p-0.5 px-2 bg-background rounded border border-border">
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                              {new Date(anot.fechaCreacionUtc).toLocaleString("es-CO", {
                                day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                              })}
                            </span>
                          </div>
                          {anot.registradoPorEmail && (
                            <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded tracking-widest uppercase italic border border-indigo-100/50 dark:border-indigo-900/30">
                               {anot.registradoPorEmail.split('@')[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-card-foreground leading-snug font-bold whitespace-pre-wrap">
                          {anot.texto}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-card border-t border-border flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedPersona(null)}
                  className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white px-8 py-2.5 rounded-xl font-black text-[10px] transition-all shadow-md active:scale-95 uppercase tracking-widest"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <NotificationModal 
        show={notification.show}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, show: false })}
      />
    </>
  );
}
