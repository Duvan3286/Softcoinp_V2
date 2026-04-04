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
    <div className="h-screen w-full bg-background p-6 flex flex-col overflow-hidden items-center transition-colors duration-300">
      <div className="w-full max-w-[1400px] h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 mt-4 flex justify-center items-center w-full border-b border-border pb-4 transition-colors">
          <h1 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide text-center">
            Personal Con Registro Activo
          </h1>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 mt-6 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <div className="w-10 h-10 border-4 border-indigo-100 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-sm font-medium animate-pulse uppercase tracking-widest">Cargando personal activo...</p>
            </div>
          ) : registrosActivos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-3 opacity-60">
              <span className="text-5xl">🚶</span>
              <p className="text-sm font-bold italic uppercase tracking-wider">No hay personal con registro activo</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto custom-scrollbar rounded-xl border border-border shadow-sm bg-card transition-colors">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background sticky top-0 z-10 transition-colors">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Foto</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Nombre Completo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Documento</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Destino</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Motivo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Hora Ingreso</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border capitalize transition-colors">
                  {registrosActivos.map(r => (
                    <tr key={r.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                      <td className="px-6 py-3">
                        {r.fotoUrl ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-border shadow-sm ring-2 ring-indigo-50 dark:ring-indigo-900/30 group-hover:ring-indigo-100 dark:group-hover:ring-indigo-800 transition-all">
                            <img
                              src={`${BACKEND_BASE_URL}/${r.fotoUrl}`}
                              alt={`${r.nombre} ${r.apellido}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-input flex items-center justify-center text-slate-400 dark:text-slate-600 font-bold border-2 border-border shadow-sm ring-2 ring-slate-50 dark:ring-slate-900 transition-all">
                            👤
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-foreground">{r.nombre} {r.apellido}</td>
                      <td className="px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">{r.documento}</td>
                      <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">{r.destino}</td>
                      <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400 italic normal-case">{r.motivo}</td>
                      <td className="px-6 py-3 text-sm font-mono text-foreground font-bold">
                        {new Date(r.horaIngresoLocal).toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => handleSalida(r.id)}
                          className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 border border-rose-100 dark:border-rose-900/50"
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
