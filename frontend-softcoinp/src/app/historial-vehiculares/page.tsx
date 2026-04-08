"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import NotificationModal from "@/components/NotificationModal";
import {
  ClipboardList, Download, ArrowLeft, Search, Calendar, ChevronLeft, ChevronRight,
  FileX, PenTool, X, Filter, CarFront
} from "lucide-react";

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api").replace(/\/api$/, "/static");

interface AnotacionItem {
  id: string;
  vehiculoId: string;
  vehiculoPlaca?: string;
  texto: string;
  fechaCreacionUtc: string;
  registradoPor: string;
  registradoPorEmail?: string;
  vehiculoFotoUrl?: string; 
  vehiculoIsBloqueado?: boolean; 
}

interface VehiculoAgrupado {
  vehiculoId: string;
  placa: string;
  fotoUrl?: string; 
  isBloqueado?: boolean; 
  novedades: AnotacionItem[];
  ultimaFecha: string;
}

export default function HistorialVehicularesPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [notification, setNotification] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' }>({
    show: false, title: '', message: '', type: 'success'
  });
  
  const [novedades, setNovedades] = useState<AnotacionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [desdeFilter, setDesdeFilter] = useState("");
  const [hastaFilter, setHastaFilter] = useState("");
  const [reporterFilter, setReporterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); 
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
      const onlyVehiculos = (res.data.data || []).filter(a => a.vehiculoId);
      setNovedades(onlyVehiculos);
    } catch {
      setNovedades([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (filtroBusqueda) params.append("query", filtroBusqueda);
      if (statusFilter) params.append("status", statusFilter);
      if (desdeFilter) params.append("desde", desdeFilter);
      if (hastaFilter) params.append("hasta", hastaFilter);

      const response = await api.get(`/anotaciones/exportar-vehiculo-excel?${params.toString()}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data as any]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Reporte_Vehicular_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exportando excel:", error);
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

  const novedadesFiltradas = novedades.filter(n => {
    const q = filtroBusqueda.toLowerCase();
    if (q) {
      const matchesText = 
        n.texto.toLowerCase().includes(q) ||
        n.vehiculoPlaca?.toLowerCase().includes(q) ||
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
      const currentlyBlocked = n.vehiculoIsBloqueado === true;
      if (statusFilter === "bloqueado") {
        if (!currentlyBlocked) return false;
      } else if (statusFilter === "habilitado") {
        if (currentlyBlocked) return false;
      }
    }

    return true;
  });

  const uniqueReporters = Array.from(new Set(novedades.map(n => n.registradoPorEmail).filter(Boolean)));

  const vehiculosAgrupados: VehiculoAgrupado[] = Object.values(
    novedadesFiltradas.reduce((acc: { [key: string]: VehiculoAgrupado }, n) => {
      const vid = n.vehiculoId;
      if (!acc[vid]) {
        acc[vid] = {
          vehiculoId: vid,
          placa: n.vehiculoPlaca || "S/D",
          fotoUrl: n.vehiculoFotoUrl || undefined,
          isBloqueado: n.vehiculoIsBloqueado,
          novedades: [],
          ultimaFecha: n.fechaCreacionUtc
        };
      }
      acc[vid].novedades.push(n);
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
    setStatusFilter("");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(vehiculosAgrupados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const vehiculosPaginados = vehiculosAgrupados.slice(startIndex, startIndex + itemsPerPage);

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
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-sm flex-shrink-0 transition-transform hover:-rotate-3">
               <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-black text-foreground uppercase tracking-tight leading-none">Historial de Novedades Vehiculares</h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Gestión integral de anotaciones de seguridad vehicular</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasPermission("exportar-historial-vehiculares") && (
              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl shadow-sm dark:shadow-none transition-all duration-300 flex items-center justify-center gap-2 text-sm font-bold active:scale-95 whitespace-nowrap disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Exportar Excel
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => router.push("/novedades-vehiculares")}
              className="bg-card text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 py-2 px-4 rounded-xl font-black border border-border shadow-sm transition-all active:scale-95 flex items-center gap-2 text-[10px] uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
          </div>
        </div>

        {/* 🔍 Barra de Filtros (Compacta) */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-3 mb-3 flex flex-wrap items-end gap-2 shrink-0">
          {/* Búsqueda por Texto */}
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <label className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 px-1 tracking-widest">Búsqueda Libre</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={filtroBusqueda}
                onChange={e => setFiltroBusqueda(e.target.value)}
                placeholder="Placa o detalle..."
                className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 outline-none transition-all placeholder-slate-300 dark:placeholder-slate-700 text-foreground uppercase tracking-widest"
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
                className="px-3 py-2 bg-background border border-border rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 outline-none transition-all text-foreground [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>

            <div className="flex flex-col gap-1 w-32 lg:w-36">
              <label className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 px-1 tracking-widest">Hasta</label>
              <input
                type="date"
                value={hastaFilter}
                onChange={e => setHastaFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 outline-none transition-all text-foreground [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 w-44">
            <label className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 px-1 tracking-widest">Autor</label>
            <select
              value={reporterFilter}
              onChange={e => setReporterFilter(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 outline-none transition-all text-foreground"
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
              className="px-3 py-2 bg-background border border-border rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 outline-none transition-all shadow-sm text-foreground"
            >
              <option value="">Todos los Eventos</option>
              <option value="bloqueado">Bloqueados</option>
              <option value="habilitado">Habilitados</option>
            </select>
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={fetchAllNovedades}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-sm dark:shadow-none active:scale-95 flex items-center gap-2 uppercase tracking-widest"
            >
              <Filter className="w-3.5 h-3.5" /> Filtrar
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
              vehiculosAgrupados.length === 0 
                ? "No se hallaron registros" 
                : `Mostrando ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, vehiculosAgrupados.length)} de ${vehiculosAgrupados.length} vehículos`
            )}
          </p>
        </div>

        {/* 📋 Lista de vehículos agrupados (Con Scroll Interno) */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-0 custom-scrollbar pb-4 space-y-2">
          {loading ? (
            <div className="bg-card rounded-xl p-20 flex flex-col items-center justify-center text-slate-400 gap-4 border border-border">
               <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
               <p className="text-xs font-black uppercase tracking-widest">Sincronizando Historial...</p>
            </div>
          ) : vehiculosAgrupados.length === 0 ? (
            <div className="bg-card rounded-xl py-20 text-center text-slate-300 dark:text-slate-700 border-2 border-dashed border-border flex flex-col items-center gap-3">
               <FileX className="w-16 h-16 text-slate-300 dark:text-slate-600 opacity-50" />
               <p className="text-xs font-black uppercase tracking-widest">No se encontraron resultados para los filtros aplicados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {vehiculosPaginados.map(v => (
                <div key={v.vehiculoId} className="bg-card rounded-xl shadow-sm border border-border p-2.5 px-4 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between gap-4">
                    {/* Info del Vehículo */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 dark:bg-slate-950 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md overflow-hidden border border-border">
                        {v.fotoUrl ? (
                          <img 
                            src={v.fotoUrl.startsWith('http') ? v.fotoUrl : `${BACKEND_BASE_URL}${v.fotoUrl}`} 
                            alt={v.placa}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <CarFront className="w-5 h-5 opacity-70" />
                        )}
                      </div>
                       <div className="min-w-0">
                         <p className="text-[13px] font-black text-foreground truncate uppercase leading-none mb-1 flex items-center gap-2">
                           PLACA: <span className="text-emerald-600 dark:text-emerald-400">{v.placa}</span>
                           {v.isBloqueado && (
                             <span className="bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[8px] px-1.5 py-0.5 rounded-md border border-red-200 dark:border-red-900/30 animate-pulse">
                               BLOQUEADO
                             </span>
                           )}
                         </p>
                         <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-tighter uppercase">
                            Vehículo
                         </p>
                       </div>
                    </div>

                    {/* Resumen Novedades */}
                    <div className="flex-1 min-w-0 hidden md:block border-l border-border pl-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 bg-background px-2 py-1 rounded-lg border border-border uppercase tracking-tighter">
                          {v.novedades.length} Eventos
                        </span>
                        <div className="flex items-center gap-1.5 opacity-60">
                           <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                           <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                              Último: {new Date(v.ultimaFecha).toLocaleDateString("es-CO", { day: '2-digit', month: 'short', year: 'numeric' })}
                           </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedVehiculo(v)}
                        className="bg-background hover:bg-emerald-600 dark:hover:bg-emerald-700 hover:text-white text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border border-border shadow-sm active:scale-95"
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
                   <ChevronLeft className="w-5 h-5" />
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
                            ? "bg-emerald-600 text-white shadow-sm dark:shadow-none scale-110" 
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
                   <ChevronRight className="w-5 h-5" />
                </button>
             </div>
          </div>
        )}
      </div>

      {/* MODAL DE DETALLE (Línea de Tiempo por Vehículo) */}
      {selectedVehiculo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[75vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-border">
            {/* Header Modal */}
            <div className="bg-slate-900 dark:bg-slate-950 p-4 flex items-center justify-between shrink-0 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xl font-black shadow-sm overflow-hidden border-2 border-white/20">
                  {selectedVehiculo.fotoUrl ? (
                    <img 
                      src={selectedVehiculo.fotoUrl.startsWith('http') ? selectedVehiculo.fotoUrl : `${BACKEND_BASE_URL}${selectedVehiculo.fotoUrl}`} 
                      alt={selectedVehiculo.placa}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <CarFront className="w-6 h-6 opacity-70" />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-black text-lg tracking-tight uppercase leading-none flex items-center gap-2">
                    {selectedVehiculo.placa}
                    {selectedVehiculo.isBloqueado && (
                      <span className="bg-red-500/20 text-red-400 text-[8px] px-1.5 py-0.5 rounded border border-red-500/30 animate-pulse">
                        BLOQUEADO
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-tight">
                       {selectedVehiculo.novedades.length} Eventos registrados
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedVehiculo(null)}
                className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-full transition-all outline-none active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cuerpo Modal (Línea de tiempo scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-background">
              <div className="space-y-4 relative before:content-[''] before:absolute before:left-[13px] before:top-2 before:bottom-0 before:w-0.5 before:bg-border">
                {selectedVehiculo.novedades
                  .sort((a, b) => new Date(b.fechaCreacionUtc).getTime() - new Date(a.fechaCreacionUtc).getTime())
                  .map((anot) => (
                  <div key={anot.id} className="relative pl-9 group">
                    {/* Punto del timeline */}
                    <div className="absolute left-0 top-1.5 w-[28px] h-[28px] rounded-full bg-card border-2 border-emerald-500 shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110">
                      <PenTool className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    
                    <div className="bg-card rounded-xl p-4 border border-border shadow-sm transition-all hover:shadow-md hover:border-emerald-100 dark:hover:border-emerald-900/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-0.5 px-2 bg-background rounded border border-border">
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                            {new Date(anot.fechaCreacionUtc).toLocaleString("es-CO", {
                              day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                          </span>
                        </div>
                        {anot.registradoPorEmail && (
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded tracking-widest uppercase italic border border-emerald-100/50 dark:border-emerald-900/30">
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

            {/* Footer Modal */}
            <div className="p-3 bg-card border-t border-border flex justify-end shrink-0">
              <button
                onClick={() => setSelectedVehiculo(null)}
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
