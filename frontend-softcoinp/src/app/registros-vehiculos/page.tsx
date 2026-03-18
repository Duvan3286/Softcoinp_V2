"use client";

import { useEffect, useState } from "react";
import { registroVehiculoService, RegistroVehiculoDto } from "@/services/registroVehiculoService";
import { useRouter } from "next/navigation";

const BACKEND_BASE_URL = "http://localhost:5004/static";

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

export default function RegistrosVehiculosPage() {
  const [registros, setRegistros] = useState<RegistroVehiculoDto[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [placa, setPlaca] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const fetchRegistros = async (pageNumber: number) => {
    try {
      setLoading(true);
      const params = {
        page: pageNumber,
        pageSize,
        placa: placa || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
      };

      const res = await registroVehiculoService.getRegistros(params);
      const items = res?.data?.items || [];
      const total = res?.data?.totalCount || 0;
      
      setRegistros(items);
      setTotalCount(total);
      if (res?.data?.page) setPage(res.data.page);
    } catch (err) {
      console.error("Error al obtener registros de vehículos", err);
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

  return (
    <div className="flex-1 h-auto lg:h-full flex flex-col min-h-0 bg-slate-50 p-2 lg:p-4 lg:overflow-hidden">
      <div className="max-w-[1700px] mx-auto w-full h-full flex flex-col min-h-0">
        
        {/* 📋 Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-100">
               <span className="text-xl">🚗</span>
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-black text-slate-800 uppercase tracking-tight">Historial de ingreso Vehícular</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Registro detallado de ingresos vehiculares</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
               onClick={() => router.push('/registros')}
               className="bg-white hover:bg-slate-50 text-slate-600 px-5 py-2.5 rounded-xl font-black border border-slate-200 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase"
            >
               📜 Ver Personas
            </button>
          </div>
        </div>

        {/* 🕵️‍♂️ Filtros Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4 flex-shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Placa</label>
              <input
                type="text"
                placeholder="ABC-123"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all uppercase placeholder:normal-case"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <button
              onClick={handleBuscar}
              className="lg:col-span-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-black shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              Filtrar Vehículos
            </button>
          </div>
        </div>

        {/* 📊 Tabla Section */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-0 overflow-hidden">
           {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Buscando Vehículos...</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-slate-100 border-separate border-spacing-0">
                  <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Imagen</th>
                      <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Identificación</th>
                      <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Marca / Modelo</th>
                      <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Tipo</th>
                      <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Ingreso</th>
                      <th className="px-5 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Salida</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50">
                    {registros.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-30 grayscale">
                            <span className="text-6xl">🚘</span>
                            <p className="text-sm font-black uppercase tracking-widest">Sin registros de vehículos</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      registros.map((r, index) => {
                        const ingreso = formatDateTime(r.horaIngresoLocal);
                        const salida = formatDateTime(r.horaSalidaLocal);
                        const isSalidaPending = !r.horaSalidaLocal;

                        return (
                          <tr key={r.id} className="hover:bg-indigo-50/30 transition-all group">
                            <td className="px-5 py-3 whitespace-nowrap">
                              <div className="relative w-14 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shadow-sm group-hover:scale-110 transition-transform cursor-zoom-in">
                                {r.fotoVehiculoUrl ? (
                                  <img 
                                    src={r.fotoVehiculoUrl.startsWith('http') ? r.fotoVehiculoUrl : `${BACKEND_BASE_URL}${r.fotoVehiculoUrl}`} 
                                    className="w-full h-full object-cover" 
                                    alt="Vehículo" 
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xl grayscale opacity-30">🚗</div>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className="text-[14px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded shadow-sm border border-indigo-100 tracking-wider">
                                {r.placa}
                              </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-[13px] font-black text-slate-700 leading-tight">{r.marca}</span>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{r.modelo || "S.M"}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                               <span className="text-[10px] font-black text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200 uppercase tracking-widest shadow-sm">
                                 {r.tipoVehiculo || "Otro"}
                               </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                               <div className="flex flex-col">
                                <span className="text-[12px] font-black text-slate-700 leading-none">{ingreso.fecha}</span>
                                <span className="text-[10px] font-bold text-blue-500 mt-0.5 tracking-widest">{ingreso.hora}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                               {isSalidaPending ? (
                                  <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-100 animate-pulse shadow-sm shadow-emerald-100">EN SITIO</span>
                                ) : (
                                  <div className="flex flex-col">
                                    <span className="text-[12px] font-black text-slate-700 leading-none">{salida.fecha}</span>
                                    <span className="text-[10px] font-bold text-rose-500 mt-0.5 tracking-widest">{salida.hora}</span>
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
                    className="p-2 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 transition-all shadow-sm active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  
                  <div className="flex items-center bg-white px-4 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">Pág.</span>
                    <span className="text-sm font-black text-indigo-600">{page}</span>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest mx-2">/</span>
                    <span className="text-sm font-black text-slate-700">{totalPages || 1}</span>
                  </div>

                  <button
                    disabled={page >= totalPages || totalPages === 0}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-2 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 transition-all shadow-sm active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                <div className="hidden md:flex items-center bg-white px-4 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Vehículos Registrados:</span>
                  <span className="text-sm font-black text-indigo-700">{totalCount}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
