"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";

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
}

interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// 🕓 Formatear fecha y hora (zona horaria de Colombia)
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

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // filtros
  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const fetchRegistros = async (pageNumber: number) => {
    try {
      setLoading(true);
      const res = await api.get<{ data: PagedResponse<Registro> }>("/registros", {
        params: {
          page: pageNumber,
          pageSize,
          nombre: nombre || undefined,
          documento: documento || undefined,
          desde: desde || undefined,
          hasta: hasta || undefined,
        },
      });

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

  if (loading) return <p className="p-6">Cargando...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Registro de Ingresos y Salidas</h1>

      {/* Filtros */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Buscar por documento"
          value={documento}
          onChange={(e) => setDocumento(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className="p-2 border rounded"
        />
        <div className="flex gap-2">
          <button
            onClick={handleBuscar}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Buscar
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Tabla */}
      <table className="table-auto border-collapse border border-gray-300 w-full mb-4">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">Nombre</th>
            <th className="border border-gray-300 p-2">Apellido</th>
            <th className="border border-gray-300 p-2">Documento</th>
            <th className="border border-gray-300 p-2">Destino</th>
            <th className="border border-gray-300 p-2">Tipo</th>
            <th className="border border-gray-300 p-2">Fecha Ingreso</th>
            <th className="border border-gray-300 p-2">Hora Ingreso</th>
            <th className="border border-gray-300 p-2">Fecha Salida</th>
            <th className="border border-gray-300 p-2">Hora Salida</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((r) => {
            const ingreso = formatDateTime(r.horaIngresoLocal);
            const salida = formatDateTime(r.horaSalidaLocal);
            return (
              <tr key={r.id}>
                <td className="border border-gray-300 p-2">{r.personal?.nombre}</td>
                <td className="border border-gray-300 p-2">{r.personal?.apellido}</td>
                <td className="border border-gray-300 p-2">{r.personal?.documento}</td>
                <td className="border border-gray-300 p-2">{r.destino}</td>
                <td className="border border-gray-300 p-2">{r.personal?.tipo}</td>
                <td className="border border-gray-300 p-2">{ingreso.fecha}</td>
                <td className="border border-gray-300 p-2">{ingreso.hora}</td>
                <td className="border border-gray-300 p-2">{salida.fecha}</td>
                <td className="border border-gray-300 p-2">{salida.hora}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Paginación */}
      <div className="flex justify-between items-center">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
