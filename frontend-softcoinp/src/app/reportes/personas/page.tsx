"use client";

import { useEffect, useState } from "react";
import { personalService } from "@/services/personalService";

export interface PersonalListDto {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  tipo: string;
  telefono?: string;
  email?: string;
  empresa?: string;
  eps?: string;
  arl?: string;
  destinoFrecuente?: string;
  motivoFrecuente?: string;
  fechaCreacionUtc: string;
  isBloqueado: boolean;
  tieneEntradaActiva: boolean;
  fotoUrl?: string;
}

export default function CatalogPersonalPage() {
  const [personal, setPersonal] = useState<PersonalListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    loadPersonal();
  }, []);

  const loadPersonal = async () => {
    setLoading(true);
    const data = await personalService.getAllPersonal() as PersonalListDto[];
    setPersonal(data);
    setLoading(false);
  };

  const filteredPersonal = personal.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      (p.nombre?.toLowerCase().includes(q) || false) ||
      (p.apellido?.toLowerCase().includes(q) || false) ||
      (p.documento?.toLowerCase().includes(q) || false) ||
      (p.tipo?.toLowerCase().includes(q) || false) ||
      (p.empresa?.toLowerCase().includes(q) || false)
    );
  });

  const totalPages = Math.ceil(filteredPersonal.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredPersonal.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="flex-1 h-auto flex flex-col min-h-0 bg-gray-50 p-4 lg:overflow-hidden lg:h-full">
       <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col min-h-0">
         
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-100">
               <span className="text-xl">👥</span>
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-black text-slate-800 uppercase tracking-tight leading-none drop-shadow-sm">Catálogo de Personas</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Base de datos de perfiles registrados</p>
            </div>
          </div>
          
          <div className="relative min-w-[250px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, documento..."
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all placeholder-slate-300 uppercase shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col min-h-0 overflow-hidden">
           
           <div className="overflow-x-auto flex-1 custom-scrollbar">
             {loading ? (
                <div className="flex items-center justify-center h-full min-h-[300px] text-slate-400 gap-3 flex-col">
                   <div className="w-8 h-8 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                   <p className="text-[10px] font-black uppercase tracking-widest">Cargando base de datos...</p>
                </div>
             ) : currentItems.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[300px] text-slate-300 flex-col gap-3">
                   <span className="text-5xl opacity-30 grayscale">📭</span>
                   <p className="text-[10px] font-black uppercase tracking-widest">No se hallaron resultados</p>
                </div>
             ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 uppercase text-[10px] font-black text-slate-500 tracking-widest border-b border-slate-100">
                      <th className="p-4 py-3 whitespace-nowrap">Perfil</th>
                      <th className="p-4 py-3 whitespace-nowrap">Documento</th>
                      <th className="p-4 py-3 whitespace-nowrap">Tipo / Emp.</th>
                      <th className="p-4 py-3 whitespace-nowrap">Estado</th>
                      <th className="p-4 py-3 whitespace-nowrap text-right">Contacto</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-bold text-slate-700 divide-y divide-slate-50">
                    {currentItems.map(p => (
                      <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {p.fotoUrl ? (
                              <img
                                src={p.fotoUrl.startsWith("http") ? p.fotoUrl : `http://localhost:5004/static${p.fotoUrl}`}
                                className="w-10 h-10 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                                alt="Avatar"
                                onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-lg border-2 border-white shadow-sm">👤</div>
                            )}
                            <div>
                               <p className="uppercase leading-none group-hover:text-indigo-700 transition-colors">{p.nombre} {p.apellido}</p>
                               <span className="text-[10px] text-slate-400 tracking-tight">Reg: {new Date(p.fechaCreacionUtc).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">{p.documento}</td>
                        <td className="p-4">
                           <div className="flex flex-col">
                             <span className="uppercase text-indigo-600">{p.tipo}</span>
                             <span className="text-[10px] text-slate-500 truncate max-w-[120px]" title={p.empresa}>{p.empresa || '-'}</span>
                           </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                           <div className="flex gap-1.5 flex-col items-start">
                             {p.isBloqueado && <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200 tracking-widest uppercase">Bloqueado</span>}
                             {p.tieneEntradaActiva && <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 tracking-widest uppercase">En Sitio</span>}
                             {!p.isBloqueado && !p.tieneEntradaActiva && <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 tracking-widest uppercase">Inactivo</span>}
                           </div>
                        </td>
                        <td className="p-4 text-right">
                           <p className="text-[11px] whitespace-nowrap">{p.telefono || '-'}</p>
                           <p className="text-[10px] text-slate-400 lowercase">{p.email || '-'}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             )}
           </div>

           {/* PAGINACIÓN */}
           {totalPages > 1 && (
             <div className="bg-slate-50/50 border-t border-slate-100 p-3 flex items-center justify-between shrink-0">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-1">
                   {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i+1}
                      onClick={() => setCurrentPage(i+1)}
                      className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                        currentPage === i+1 
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 scale-105" 
                          : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {i+1}
                    </button>
                   ))}
                </div>
             </div>
           )}

        </div>
       </div>
    </div>
  );
}
