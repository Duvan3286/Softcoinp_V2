"use client";

import { useEffect, useState } from "react";
import { registroVehiculoService, RegistroVehiculoDto } from "@/services/registroVehiculoService";
import { useRouter } from "next/navigation";

const BACKEND_BASE_URL = "http://localhost:5004/static";

export default function VehiculosActivosPage() {
  const [registrosActivos, setRegistrosActivos] = useState<RegistroVehiculoDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const fetchActivos = async () => {
    setLoading(true);
    try {
      const res = await registroVehiculoService.getActivos();
      setRegistrosActivos(res.data || []);
    } catch (err) {
      console.error("Error al cargar vehículos activos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivos();
  }, []);

  const handleSalida = async (id: string) => {
    try {
      await registroVehiculoService.registrarSalida(id);
      setRegistrosActivos(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Error al registrar salida de vehículo:", err);
    }
  };

  return (
    <div className="h-screen w-full bg-gray-100 p-6 flex flex-col overflow-hidden items-center">
      <div className="w-full max-w-[1400px] h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 mt-4 flex justify-between items-center w-full border-b border-gray-100 pb-4">
           {/* Botón Volver */}
           <button 
                onClick={() => router.push('/dashboard')}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Volver al Dashboard"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>

          <h1 className="text-2xl font-extrabold text-blue-700 uppercase tracking-wide text-center flex-1">
            Vehículos Con Registro Activo (En Sitio)
          </h1>

          <div className="w-10"></div> {/* Spacer for symmetry */}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 mt-6 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Cargando vehículos activos...</p>
            </div>
          ) : registrosActivos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 opacity-60">
              <span className="text-5xl">🚗</span>
              <p className="text-sm font-bold italic uppercase tracking-wider">No hay vehículos con registro activo</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto custom-scrollbar rounded-xl border border-gray-200 shadow-sm bg-white">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-blue-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-blue-600">Foto</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-blue-600">Placa</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-blue-600">Marca / Modelo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-blue-600">Color</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-blue-600">Tipo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-blue-600">Hora Ingreso</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-blue-600">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 capitalize">
                  {registrosActivos.map(r => (
                    <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-3">
                        {r.fotoVehiculoUrl ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white shadow-sm ring-2 ring-blue-50 group-hover:ring-blue-100 transition-all">
                             <img
                                src={r.fotoVehiculoUrl.startsWith('http') ? r.fotoVehiculoUrl : `${BACKEND_BASE_URL}${r.fotoVehiculoUrl}`}
                                alt={r.placa}
                                className="w-full h-full object-cover"
                             />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-bold border-2 border-white shadow-sm ring-2 ring-gray-50 group-hover:ring-gray-100 transition-all text-xl">
                            🚗
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm font-black text-blue-800 tracking-wider uppercase">{r.placa}</td>
                      <td className="px-6 py-3 text-sm font-bold text-gray-700">{r.marca} {r.modelo ? <span className="text-gray-400 font-normal">/ {r.modelo}</span> : ""}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{r.color || "-"}</td>
                      <td className="px-6 py-3 text-[10px]">
                         <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-bold uppercase tracking-tighter">{r.tipoVehiculo || "Otro"}</span>
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-gray-700 font-bold">
                        {new Date(r.horaIngresoLocal).toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => handleSalida(r.id)}
                          className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 border border-rose-100"
                        >
                          📤 Marcar Salida
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
