"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api").replace(/\/api$/, "/static");


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
        <div className="flex-shrink-0 mt-4 flex items-center w-full border-b border-border pb-4 transition-colors">
          <button 
              onClick={() => router.back()}
              className="group flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl text-slate-500 hover:text-cyan-600 dark:hover:text-[#22D3EE] transition-all shadow-none"
          >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-[11px] font-black uppercase tracking-widest">Volver</span>
          </button>

          <h1 className="text-xl lg:text-2xl font-black text-foreground uppercase tracking-tight text-center flex-1">
            Personal Con Registro Activo
          </h1>
          <div className="w-[88px]"></div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 mt-6 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <div className="w-10 h-10 border-4 border-emerald-500/10 border-t-emerald-600 rounded-full animate-spin"></div>
              <p className="text-sm font-medium animate-pulse uppercase tracking-widest text-slate-400 dark:text-[#94A3B8]">Cargando personal activo...</p>
            </div>
          ) : registrosActivos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-3 opacity-60">
              <span className="text-5xl">🚶</span>
              <p className="text-sm font-bold italic uppercase tracking-wider">No hay personal con registro activo</p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto custom-scrollbar rounded-xl border border-border shadow-none bg-card transition-colors">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background sticky top-0 z-10 transition-colors">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-[#22D3EE]">Foto</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-[#22D3EE]">Nombre Completo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-[#22D3EE]">Documento</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-[#22D3EE]">Destino</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-[#22D3EE]">Motivo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-[#22D3EE]">Hora Ingreso</th>
                    <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-[#22D3EE]">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border capitalize transition-colors">
                  {registrosActivos.map(r => (
                    <tr key={r.id} className="hover:bg-cyan-500/5 transition-colors group">
                      <td className="px-6 py-3">
                        {r.fotoUrl ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-background transition-all">
                            <img
                              src={`${BACKEND_BASE_URL}/${r.fotoUrl}`}
                              alt={`${r.nombre} ${r.apellido}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-slate-400 dark:text-[#94A3B8] font-bold border border-border transition-all">
                            👤
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm font-bold text-foreground">{r.nombre} {r.apellido}</td>
                      <td className="px-6 py-3 text-sm font-medium text-slate-500 dark:text-[#94A3B8]">{r.documento}</td>
                      <td className="px-6 py-3 text-sm text-slate-600 dark:text-[#94A3B8]">{r.destino}</td>
                      <td className="px-6 py-3 text-sm text-slate-600 dark:text-[#94A3B8] italic normal-case">{r.motivo}</td>
                      <td className="px-6 py-3 text-sm font-mono text-foreground font-bold">
                        {new Date(r.horaIngresoLocal).toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => handleSalida(r.id)}
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-none active:scale-95 border border-emerald-600/20"
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
