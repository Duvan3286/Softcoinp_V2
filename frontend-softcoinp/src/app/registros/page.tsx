"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NotificationModal from "@/components/NotificationModal";

const BACKEND_BASE_URL = "http://localhost:5004/static";

interface Personal {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  tipo: string;
}
interface Registro {
  id: string;
  personal: Personal;
  destino: string;
  motivo?: string;
  horaIngresoUtc: string;
  horaIngresoLocal: string;
  horaSalidaUtc?: string;
  horaSalidaLocal?: string;
  registradoPor?: string;
  fotoUrl?: string;
  placaVehiculo?: string;
  tipoVehiculo?: string;
  marcaVehiculo?: string;
  modeloVehiculo?: string;
  colorVehiculo?: string;
  fotoVehiculoUrl?: string;
}

interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const formatDateTime = (isoString?: string) => {
  if (!isoString) return { fecha: "-", hora: "-" };
  const d = new Date(isoString);
  const opcionesFecha: Intl.DateTimeFormatOptions = {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };
  const opcionesHora: Intl.DateTimeFormatOptions = {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  return {
    fecha: d.toLocaleDateString("es-CO", opcionesFecha),
    hora: d.toLocaleTimeString("es-CO", opcionesHora),
  };
};

const getTypeColorClasses = (tipo: string) => {
  const lowerCaseTipo = tipo.toLowerCase();
  const colorMap: { [key: string]: string } = {
    'empleado': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'visitante': 'bg-blue-50 text-blue-700 border-blue-100',
    'contratista': 'bg-amber-50 text-amber-700 border-amber-100',
    'proveedor': 'bg-rose-50 text-rose-700 border-rose-100',
  };
  return colorMap[lowerCaseTipo] || 'bg-slate-100 text-slate-700 border-slate-200';
};

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [notification, setNotification] = useState<{ show: boolean; title: string; message: string; type: 'success' | 'error' }>({
    show: false, title: '', message: '', type: 'success'
  });

  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const fetchRegistros = async (pageNumber: number, overrides?: any) => {
    try {
      setLoading(true);
      const params = {
        page: pageNumber,
        pageSize,
        nombre: overrides?.hasOwnProperty('nombre') ? overrides.nombre : (nombre || undefined),
        documento: overrides?.hasOwnProperty('documento') ? overrides.documento : (documento || undefined),
        desde: overrides?.hasOwnProperty('desde') ? overrides.desde : (desde || undefined),
        hasta: overrides?.hasOwnProperty('hasta') ? overrides.hasta : (hasta || undefined),
      };

      const res = await api.get<any>("/registros", { params });
      
      const pagedData = res.data.data;
      
      if (pagedData && pagedData.items) {
        setRegistros(pagedData.items);
        setTotalCount(pagedData.totalCount || 0);
      } else if (res.data.items) {
        setRegistros(res.data.items);
        setTotalCount(res.data.totalCount || 0);
      } else {
        setRegistros([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Error cargando registros:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistros(page);
  }, [page]);

  const handleBuscar = () => {
    setPage(1);
    fetchRegistros(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const resp = await api.get("/registros/export/excel", {
        params: {
          nombre: nombre || undefined,
          documento: documento || undefined,
          desde: desde || undefined,
          hasta: hasta || undefined,
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([resp.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Registros_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error exportando registros", err);
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

  return (
    <>
      <div className="flex-1 h-auto lg:h-full flex flex-col min-h-0 bg-slate-50 p-2 lg:p-4 lg:overflow-hidden relative">
        <div className="max-w-[1700px] mx-auto w-full h-full flex flex-col min-h-0">
          
          {/* 📋 Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-100">
                <span className="text-xl">📜</span>
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-black text-slate-800 uppercase tracking-tight">Historial De ingreso De Personas</h1> 
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Registro general de personas y vehículos</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/registros-vehiculos')}
                className="bg-white hover:bg-slate-50 text-slate-600 px-5 py-2.5 rounded-xl font-black border border-slate-200 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase"
              >
                🚗 Ver Vehículos
              </button>
              {hasPermission("exportar-registros") && (
                <button
                  onClick={handleExportExcel}
                  disabled={exporting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black shadow-lg shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase disabled:opacity-50"
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
            </div>
          </div>

          {/* 🕵️‍♂️ Filtros Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4 flex-shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Nombre</label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Documento</label>
                <input
                  type="text"
                  placeholder="Ej: 12345678"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Desde</label>
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Hasta</label>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="lg:col-span-2 flex gap-2">
                <button
                  onClick={() => {
                    setNombre("");
                    setDocumento("");
                    setDesde("");
                    setHasta("");
                    setPage(1);
                    fetchRegistros(1, { nombre: "", documento: "", desde: "", hasta: "" });
                  }}
                  className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all font-black text-[11px] uppercase flex items-center justify-center gap-2 border border-slate-200"
                >
                  🧹 Limpiar
                </button>
                <button
                  onClick={handleBuscar}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-black shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  Filtrar Resultados
                </button>
              </div>
            </div>
          </div>

          {/* 📊 Tabla Section */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-0 overflow-hidden">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Consultando Registros...</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="min-w-full divide-y divide-slate-100 border-separate border-spacing-0">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Persona</th>
                        <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Documento</th>
                        <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Tipo</th>
                        <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Destino</th>
                        <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Motivo de Ingreso</th>
                        <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Ingreso</th>
                        <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Salida</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                      {registros.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-30 grayscale">
                              <span className="text-6xl">📜</span>
                              <p className="text-sm font-black uppercase tracking-widest">No se encontraron registros</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        registros.map((r) => {
                          const ingreso = formatDateTime(r.horaIngresoLocal);
                          const salida = formatDateTime(r.horaSalidaLocal);
                          const isSalidaPending = !r.horaSalidaLocal;
                          const tagClasses = getTypeColorClasses(r.personal?.tipo || 'desconocido');

                          return (
                            <tr key={r.id} className="hover:bg-slate-50/80 transition-all group">
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm group-hover:border-blue-300 transition-all">
                                    {r.fotoUrl ? (
                                      <img 
                                        src={r.fotoUrl.startsWith('http') ? r.fotoUrl : `${BACKEND_BASE_URL}${r.fotoUrl}`} 
                                        className="w-full h-full object-cover" 
                                        alt="Perfil" 
                                      />
                                    ) : (
                                      <div className="text-[10px] font-black text-slate-400 uppercase">
                                        {r.personal?.nombre?.[0]}{r.personal?.apellido?.[0]}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[13px] font-black text-slate-700 leading-tight">{r.personal?.nombre} {r.personal?.apellido}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Identidad Verificada</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-[12px] font-black text-slate-500 tracking-tighter">{r.personal?.documento}</td>

                              <td className="px-5 py-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border shadow-sm ${tagClasses}`}>
                                  {r.personal?.tipo}
                                </span>
                              </td>

                              <td className="px-5 py-4 whitespace-nowrap text-[12px] font-bold text-slate-600 tracking-tight">{r.destino}</td>
                              
                              <td className="px-5 py-4 max-w-[200px]">
                                <p className="text-[11px] text-slate-500 line-clamp-2 italic leading-tight" title={r.motivo}>
                                  {r.motivo || <span className="text-slate-300">Sin motivo registrado</span>}
                                </p>
                              </td>

                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="text-[12px] font-black text-slate-700 leading-none">{ingreso.fecha}</span>
                                  <span className="text-[10px] font-bold text-blue-500 mt-0.5 tracking-widest">{ingreso.hora}</span>
                                </div>
                              </td>

                              <td className="px-5 py-4 whitespace-nowrap">
                                {isSalidaPending ? (
                                  <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-amber-50 rounded-lg border border-amber-100 animate-pulse">PENDIENTE</span>
                                ) : (
                                  <div className="flex flex-col">
                                    <span className="text-[12px] font-black text-slate-700 leading-none">{salida.fecha}</span>
                                    <span className="text-[10px] font-bold text-emerald-500 mt-0.5 tracking-widest">{salida.hora}</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 🖱️ Paginación Section */}
                <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="p-2 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 transition-all shadow-sm active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    
                    <div className="flex items-center bg-white px-4 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">Página</span>
                      <span className="text-sm font-black text-blue-600">{page}</span>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest mx-2">de</span>
                      <span className="text-sm font-black text-slate-700">{totalPages || 1}</span>
                    </div>

                    <button
                      disabled={page >= totalPages || totalPages === 0}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-2 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 transition-all shadow-sm active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>

                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Registros:</span>
                    <span className="text-xs font-black text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">{totalCount}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
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