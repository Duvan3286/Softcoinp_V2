"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";

const BACKEND_BASE_URL = "http://localhost:5004/static";


// Definición de tipo de registro
interface RegistroDto {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  motivo: string;
  destino: string;
  tipo: string;
  horaIngresoUtc: string;
  horaIngresoLocal: string;
  fotoUrl?: string | null;
}

export default function PersonalActivoPage() {
  const [registrosActivos, setRegistrosActivos] = useState<RegistroDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const fetchActivos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/registros/activos") as any;
      setRegistrosActivos(res.data?.data || []);
    } catch (err) {
      console.error("Error al cargar registros activos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivos();
  }, []);

  const handleSalida = async (id: string) => {
    try {
      await api.put(`/registros/${id}/salida`);
      setRegistrosActivos(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Error al registrar salida:", err);
    }
  };

  return (
    <div className="h-screen w-full bg-gray-100 p-6 flex flex-col overflow-hidden items-center">
      <div className="w-full max-w-[1400px] h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 mt-4 flex justify-center items-center w-full border-b border-gray-100 pb-4">
          <h1 className="text-2xl font-extrabold text-blue-700 uppercase tracking-wide text-center">
            Personal Con Registro Activo
          </h1>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 mt-6 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Cargando personal activo...</p>
            </div>
          ) : registrosActivos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 opacity-60">
              <span className="text-5xl">🚶</span>
              <p className="text-sm font-bold italic uppercase tracking-wider">No hay personal con registro activo</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto custom-scrollbar rounded-xl border border-gray-200 shadow-sm bg-white">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-blue-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-blue-600">Foto</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-blue-600">Nombre Completo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-blue-600">Documento</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-blue-600">Destino</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-blue-600">Motivo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-blue-600">Hora Ingreso</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-blue-600">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 capitalize">
                  {registrosActivos.map(r => (
                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-3">
                        {r.fotoUrl ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-blue-50 group-hover:ring-blue-100 transition-all">
                            <img
                              src={`${BACKEND_BASE_URL}/${r.fotoUrl}`}
                              alt={`${r.nombre} ${r.apellido}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold border-2 border-white shadow-sm ring-2 ring-gray-50 group-hover:ring-gray-100 transition-all">
                            👤
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-gray-700">{r.nombre} {r.apellido}</td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-500">{r.documento}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{r.destino}</td>
                      <td className="px-6 py-3 text-sm text-gray-600 italic normal-case">{r.motivo}</td>
                      <td className="px-6 py-3 text-sm font-mono text-gray-700">
                        {new Date(r.horaIngresoLocal).toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => handleSalida(r.id)}
                          className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 border border-red-100"
                        >
                          🚪 Marcar Salida
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
