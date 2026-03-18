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
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // filtros
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
      setRegistros(res.data.items || []);
      setTotalCount(res.data.totalCount);
      setPage(res.data.page);
    } catch (err) {
      console.error("Error al obtener registros de vehículos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistros(page);
  }, [page]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleBuscar = () => {
    setPage(1);
    fetchRegistros(1);
  };

  return (
    <div className="h-screen w-full bg-gray-100 p-6 overflow-hidden flex flex-col items-center">
      <div className="bg-white rounded-2xl shadow-xl px-5 py-3 border border-gray-200 w-full max-w-[1400px] h-full flex flex-col overflow-hidden">
        
        {/* Cabecera */}
        <div className="relative flex items-center mb-3 border-b pb-2 justify-center">
            {/* Botón Volver */}
            <button 
                onClick={() => router.push('/dashboard')}
                className="absolute left-0 p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Volver al Dashboard"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>
            <h1 className="text-xl font-extrabold text-blue-700 uppercase tracking-tight">
                🚗 Historial de Ingresos y Salidas de Vehículos
            </h1>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Placa</label>
            <input
                type="text"
                placeholder="Placa"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                className="p-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm uppercase font-bold"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Desde</label>
            <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="p-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Hasta</label>
            <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="p-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
            />
          </div>
          
          <button
            onClick={handleBuscar}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 transition duration-200 flex items-center justify-center text-sm gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            Buscar
          </button>

          <button
            onClick={() => router.push('/registros')}
            className="w-full bg-slate-100 text-slate-600 py-2 rounded-lg font-bold hover:bg-slate-200 transition duration-200 flex items-center justify-center text-sm"
          >
            📜 Ver Personas
          </button>
        </div>

        {/* Tabla */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Cargando registros...</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto shadow-md rounded-lg border border-gray-300 custom-scrollbar">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-600 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Foto</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Placa</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Marca/Modelo</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Fecha Ingreso</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Hora Ingreso</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-blue-100">Fecha Salida</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-blue-100">Hora Salida</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registros.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-gray-500 italic">
                        No se encontraron registros de vehículos con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    registros.map((r, index) => {
                      const ingreso = formatDateTime(r.horaIngresoLocal);
                      const salida = formatDateTime(r.horaSalidaLocal);
                      const isOdd = index % 2 !== 0;
                      const isSalidaPending = !r.horaSalidaLocal;

                      return (
                        <tr key={r.id} className={`${isOdd ? 'bg-gray-50' : 'bg-white'} ${isSalidaPending ? 'border-l-4 border-emerald-500' : ''} hover:bg-blue-50 transition-colors`}>
                          <td className="px-4 py-2">
                            {r.fotoVehiculoUrl ? (
                              <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
                                <img src={r.fotoVehiculoUrl.startsWith('http') ? r.fotoVehiculoUrl : `${BACKEND_BASE_URL}${r.fotoVehiculoUrl}`} className="w-full h-full object-cover" alt="Vehículo" />
                              </div>
                            ) : (
                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl">🚗</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-black text-blue-800 uppercase tracking-wider">{r.placa}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                            {r.marca} {r.modelo ? <span className="text-gray-400 font-normal">/ {r.modelo}</span> : ""}
                          </td>
                          <td className="px-4 py-3 text-xs uppercase">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-bold">{r.tipoVehiculo || "Otro"}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-medium">{ingreso.fecha}</td>
                          <td className="px-4 py-3 text-sm font-mono font-bold text-gray-700">{ingreso.hora}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-medium">{isSalidaPending ? "-" : salida.fecha}</td>
                          <td className="px-4 py-3 text-sm font-mono">
                            {isSalidaPending 
                                ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-black animate-pulse">DENTRO</span> 
                                : <span className="text-gray-700 font-bold">{salida.hora}</span>
                            }
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Paginación */}
        <div className="flex justify-between items-center py-3 px-4 border-t bg-slate-50 mt-auto">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold disabled:opacity-50 hover:bg-slate-50 transition shadow-sm text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            Anterior
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Página</span>
            <span className="text-slate-800 font-black text-lg">
                {page} <span className="text-slate-300 font-normal mx-1">/</span> {totalPages || 1}
            </span>
            <span className="text-slate-400 text-[9px] mt-1">{totalCount} registros en total</span>
          </div>

          <button
            disabled={page >= totalPages || totalPages === 0}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold disabled:opacity-50 hover:bg-slate-50 transition shadow-sm text-sm flex items-center gap-2"
          >
            Siguiente
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
