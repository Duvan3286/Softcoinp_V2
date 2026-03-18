"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation"; // ⬅️ 1. IMPORTAR ROUTER

// Definiciones de tipos (SIN CAMBIOS)
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
  // 🚗 Vehículo
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
    'empleado': 'bg-green-100 text-green-800',
    'visitante': 'bg-indigo-100 text-indigo-800',
    'contratista': 'bg-yellow-100 text-yellow-800',
    'proveedor': 'bg-red-100 text-red-800',
  };

  return colorMap[lowerCaseTipo] || 'bg-gray-200 text-gray-800';
};

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const router = useRouter(); // ⬅️ 2. INICIALIZAR ROUTER

  // filtros
  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const fetchRegistros = async (pageNumber: number) => {
    try {
      setLoading(true);
      const params = {
        page: pageNumber,
        pageSize,
        nombre: nombre || undefined,
        documento: documento || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
      };

      const res = await api.get<{ data: PagedResponse<Registro> }>("/registros", { params });

      setRegistros(res.data.data.items || []);
      setTotalCount(res.data.data.totalCount);
      setPage(res.data.data.page);
    } catch (err) {
      console.error("Error al obtener registros", err);
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

  const handleExportExcel = async () => {
    try {
      const res = await api.get(`/registros/export/excel`, {
        params: {
          nombre: nombre || undefined,
          documento: documento || undefined,
          desde: desde || undefined,
          hasta: hasta || undefined,
        },
        responseType: "blob",
      });

      const blob = new Blob([res.data as BlobPart], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `registros_${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exportando registros", err);
    }
  };

  return (
    <div className="h-screen w-full bg-gray-100 p-6 overflow-hidden flex flex-col items-center">
      <div className="bg-white rounded-2xl shadow-xl px-5 py-3 border border-gray-200 w-full max-w-[1400px] h-full flex flex-col overflow-hidden">



        {/* 🚨 BOTÓN DE REGRESO AL DASHBOARD */}

        {/* 🔹 CABECERA COMPACTA */}
        <div className="relative flex items-center mb-3 border-b pb-2 justify-center">
          {/* Título centrado */}
          <h1 className="text-xl font-extrabold text-blue-700">
            📜 Historial de Ingresos y Salidas
          </h1>
        </div>


        {/* 1. Filtros y Acciones */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4 items-end">

          <input
            type="text"
            placeholder="Buscar por Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="p-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"

          />
          <input
            type="text"
            placeholder="Buscar por Documento"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            className="p-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
          />
          <input
            type="date"
            placeholder="Desde (Fecha)"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="p-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
          />
          <input
            type="date"
            placeholder="Hasta (Fecha)"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="p-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
          />

          <button
            onClick={handleBuscar}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition duration-200 flex items-center justify-center text-sm"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            Buscar
          </button>

          <button
            onClick={handleExportExcel}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold shadow-md hover:bg-green-700 transition duration-200 flex items-center justify-center text-sm"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
            Exportar
          </button>
        </div>

        {/* Indicador de Carga y Tabla (Sin cambios) */}
        {loading ? (
          // <div className="text-center py-10 text-lg text-gray-500">
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            Cargando registros...
          </div>
        ) : (
          // <div className="overflow-x-auto shadow-md rounded-lg border border-gray-300">
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto shadow-md rounded-lg border border-gray-300">

              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-600 text-white sticky top-0 z-10">

                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Nombre Completo</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Documento</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Destino</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Fecha Ingreso</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Hora Ingreso</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-blue-200">Placa Veh.</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-blue-200">Tipo Veh.</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-blue-200">Marca Veh.</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-blue-200">Color Veh.</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Fecha Salida</th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Hora Salida</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registros.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-6 text-center text-gray-500">
                        No se encontraron registros con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    registros.map((r, index) => {
                      const ingreso = formatDateTime(r.horaIngresoLocal);
                      const salida = formatDateTime(r.horaSalidaLocal);
                      const isOdd = index % 2 !== 0;
                      const isSalidaPending = !r.horaSalidaLocal;
                      const tagClasses = getTypeColorClasses(r.personal?.tipo || 'desconocido');

                      return (
                        <tr
                          key={r.id}
                          className={`${isOdd ? 'bg-gray-50' : 'bg-white'} ${isSalidaPending ? 'border-l-4 border-yellow-500' : ''} hover:bg-blue-50 transition duration-150`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {r.personal?.nombre} {r.personal?.apellido}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{r.personal?.documento}</td>

                          <td className="px-4 py-3 whitespace-nowrap text-xs">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tagClasses}`}>
                              {r.personal?.tipo}
                            </span>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{r.destino}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{ingreso.fecha}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-mono">{ingreso.hora}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-blue-800 bg-blue-50/50">{r.placaVehiculo || "-"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">{r.tipoVehiculo || "-"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{r.marcaVehiculo || "-"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{r.colorVehiculo || "-"}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{salida.fecha}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-mono">
                            {isSalidaPending ? <span className="text-gray-500">-</span> : salida.hora}
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
        <div className="flex justify-between items-center py-2 px-3 border-t bg-gray-50">



          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold disabled:opacity-50 hover:bg-gray-400 transition duration-150 flex items-center text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            Anterior
          </button>

          <span className="text-gray-700 font-medium text-sm">
            Mostrando {registros.length} de {totalCount} registros. | Página <span className="font-bold text-blue-700">{page}</span> de <span className="font-bold text-blue-700">{totalPages}</span>
          </span>

          <button
            disabled={page >= totalPages || totalPages === 0}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold disabled:opacity-50 hover:bg-gray-400 transition duration-150 flex items-center text-sm"
          >
            Siguiente
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
}