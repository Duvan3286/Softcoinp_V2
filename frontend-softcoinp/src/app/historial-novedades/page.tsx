"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { ApiResponse } from "@/services/api";

interface AnotacionItem {
  id: string;
  personalId: string;
  personalNombre?: string;
  personalApellido?: string;
  texto: string;
  fechaCreacionUtc: string;
  registradoPor: string;
  registradoPorEmail?: string;
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
  const [personal, setPersonal] = useState<PersonalBasic[]>([]);
  const [selectedPersonalId, setSelectedPersonalId] = useState<string>("");
  const [novedades, setNovedades] = useState<AnotacionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPersonal, setLoadingPersonal] = useState(true);
  const [filtroBusqueda, setFiltroBusqueda] = useState("");

  // Cargar lista de personal al montar
  useEffect(() => {
    const fetchPersonal = async () => {
      try {
        const res = await api.get<{ data: PersonalBasic[] }>("/personal");
        setPersonal(res.data.data || []);
      } catch {
        // si no hay endpoint de personal, mostramos historial global
      } finally {
        setLoadingPersonal(false);
      }
    };
    fetchPersonal();
    // Cargar todas las novedades al inicio
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

  const fetchByPersonal = async (personalId: string) => {
    if (!personalId) {
      fetchAllNovedades();
      return;
    }
    setLoading(true);
    try {
      const res = await api.get<{ data: AnotacionItem[] }>(`/anotaciones/personal/${personalId}`);
      setNovedades(res.data.data || []);
    } catch {
      setNovedades([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalChange = (id: string) => {
    setSelectedPersonalId(id);
    fetchByPersonal(id);
  };

  const novedadesFiltradas = novedades.filter(n => {
    const q = filtroBusqueda.toLowerCase();
    if (!q) return true;
    return (
      n.texto.toLowerCase().includes(q) ||
      n.personalNombre?.toLowerCase().includes(q) ||
      n.personalApellido?.toLowerCase().includes(q) ||
      n.registradoPorEmail?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-screen bg-gray-50 p-6 overflow-hidden flex flex-col">
      <div className="max-w-6xl mx-auto w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📋 Historial de Novedades</h1>
            <p className="text-sm text-gray-500 mt-1">
              Consulta todas las anotaciones de seguridad registradas en el sistema.
            </p>
          </div>
          <button
            onClick={() => router.push("/reportes")}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl shadow-md transition duration-200 flex items-center text-sm font-semibold gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Reportes
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-col sm:flex-row gap-3 shrink-0">
          <input
            type="text"
            value={filtroBusqueda}
            onChange={e => setFiltroBusqueda(e.target.value)}
            placeholder="Buscar en novedades (texto, persona, usuario)..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
          />
          <button
            onClick={() => { setSelectedPersonalId(""); fetchAllNovedades(); setFiltroBusqueda(""); }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            Ver todas
          </button>
        </div>

        {/* Conteo */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <p className="text-sm text-gray-500 font-medium">
            {loading ? "Cargando..." : `${novedadesFiltradas.length} novedad(es) encontrada(s)`}
          </p>
        </div>

        {/* Lista de novedades (scrollable) */}
        <div className="flex-grow overflow-y-auto pr-1 shadow-inner custom-scrollbar pb-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando novedades...</div>
          ) : novedadesFiltradas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-12 text-center text-gray-400">
              No hay novedades registradas.
            </div>
          ) : (
            <div className="space-y-4">
              {novedadesFiltradas.map(n => (
                <div key={n.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-yellow-200 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    {/* Info de la persona */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-sm">
                        {(n.personalNombre?.[0] || "?").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {n.personalNombre || "—"} {n.personalApellido || ""}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(n.fechaCreacionUtc).toLocaleString("es-CO", {
                            year: "numeric", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Registrado por */}
                    {n.registradoPorEmail && (
                      <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-3 py-1 flex-shrink-0 font-medium">
                        👤 {n.registradoPorEmail}
                      </span>
                    )}
                  </div>

                  {/* Texto de la novedad */}
                  <p className="mt-3 text-sm text-gray-700 leading-relaxed border-l-4 border-yellow-400 pl-4 bg-yellow-50/50 rounded-r-lg py-3 pr-4 font-medium">
                    {n.texto}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
