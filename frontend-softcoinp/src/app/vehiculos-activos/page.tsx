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
    <div className="h-screen w-full bg-background p-6 flex flex-col overflow-hidden items-center transition-colors duration-300">
      <div className="w-full max-w-[1400px] h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 mt-4 flex justify-between items-center w-full border-b border-border pb-4 transition-colors">
           {/* Botón Volver */}
           <button 
                onClick={() => router.push('/dashboard')}
                className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
                title="Volver al Dashboard"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>

          <h1 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide text-center flex-1">
            Vehículos Con Registro Activo (En Sitio)
          </h1>

          <div className="w-10"></div> {/* Spacer for symmetry */}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 mt-6 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <div className="w-10 h-10 border-4 border-indigo-100 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-sm font-medium animate-pulse uppercase tracking-widest">Cargando vehículos activos...</p>
            </div>
          ) : registrosActivos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-3 opacity-60">
              <span className="text-5xl">🚗</span>
              <p className="text-sm font-bold italic uppercase tracking-wider">No hay vehículos con registro activo</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto custom-scrollbar rounded-xl border border-border shadow-sm bg-card transition-colors">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background sticky top-0 z-10 transition-colors">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Foto</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Placa</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Marca / Modelo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Color</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Tipo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Hora Ingreso</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border capitalize transition-colors">
                  {registrosActivos.map(r => (
                    <tr key={r.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                      <td className="px-6 py-3">
                        {r.fotoVehiculoUrl ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-border shadow-sm ring-2 ring-indigo-50 dark:ring-indigo-900/30 group-hover:ring-indigo-100 dark:group-hover:ring-indigo-800 transition-all">
                             <img
                                src={r.fotoVehiculoUrl.startsWith('http') ? r.fotoVehiculoUrl : `${BACKEND_BASE_URL}${r.fotoVehiculoUrl}`}
                                alt={r.placa}
                                className="w-full h-full object-cover"
                             />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-input flex items-center justify-center text-slate-400 dark:text-slate-600 font-bold border-2 border-border shadow-sm ring-2 ring-slate-50 dark:ring-slate-900 transition-all text-xl">
                            🚗
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm font-black text-indigo-800 dark:text-indigo-400 tracking-wider uppercase">{r.placa}</td>
                      <td className="px-6 py-3 text-sm font-bold text-foreground">{r.marca} {r.modelo ? <span className="text-slate-400 dark:text-slate-500 font-normal">/ {r.modelo}</span> : ""}</td>
                      <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{r.color || "-"}</td>
                      <td className="px-6 py-3 text-[10px]">
                         <span className="px-2 py-1 bg-background text-slate-600 dark:text-slate-400 rounded-full font-bold uppercase tracking-tighter border border-border">
                           {r.tipoVehiculo || "Otro"}
                         </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-mono text-foreground font-bold">
                        {new Date(r.horaIngresoLocal).toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => handleSalida(r.id)}
                          className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 border border-rose-100 dark:border-rose-900/50"
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
