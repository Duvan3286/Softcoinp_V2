"use client";

import { useEffect, useState } from "react";
import { vehiculoService } from "@/services/vehiculoService";

export interface VehiculoListDto {
  id: string;
  placa: string;
  marca?: string;
  modelo?: string;
  color?: string;
  tipoVehiculo: string;
  fotoUrl?: string;
  propietarioNombre?: string;
  propietarioApellido?: string;
  propietarioDocumento?: string;
}

export default function CatalogVehiculosPage() {
  const [vehiculos, setVehiculos] = useState<VehiculoListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    loadVehiculos();
  }, []);

  const loadVehiculos = async () => {
    setLoading(true);
    const data = await vehiculoService.getAllVehiculos() as VehiculoListDto[];
    setVehiculos(data);
    setLoading(false);
  };

  const filteredVehiculos = vehiculos.filter(v => {
    const q = searchTerm.toLowerCase();
    return (
      (v.placa?.toLowerCase().includes(q) || false) ||
      (v.marca?.toLowerCase().includes(q) || false) ||
      (v.tipoVehiculo?.toLowerCase().includes(q) || false) ||
      (v.propietarioDocumento?.toLowerCase().includes(q) || false) ||
      (v.propietarioNombre?.toLowerCase().includes(q) || false)
    );
  });

  const totalPages = Math.ceil(filteredVehiculos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredVehiculos.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="flex-1 h-auto flex flex-col min-h-0 bg-gray-50 p-4 lg:overflow-hidden lg:h-full">
       <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col min-h-0">
         
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600 rounded-xl text-white shadow-md shadow-rose-100">
               <span className="text-xl">🚗</span>
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-black text-slate-800 uppercase tracking-tight leading-none drop-shadow-sm">Catálogo de Vehículos</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Base de datos de parque automotor</p>
            </div>
          </div>
          
          <div className="relative min-w-[250px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por placa, propietario..."
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 outline-none transition-all placeholder-slate-300 uppercase shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col min-h-0 overflow-hidden">
           
           <div className="overflow-x-auto flex-1 custom-scrollbar">
             {loading ? (
                <div className="flex items-center justify-center h-full min-h-[300px] text-slate-400 gap-3 flex-col">
                   <div className="w-8 h-8 border-4 border-slate-100 border-t-rose-600 rounded-full animate-spin"></div>
                   <p className="text-[10px] font-black uppercase tracking-widest">Cargando parque automotor...</p>
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
                      <th className="p-4 py-3 whitespace-nowrap">Placa / Vehículo</th>
                      <th className="p-4 py-3 whitespace-nowrap">Tipo</th>
                      <th className="p-4 py-3 whitespace-nowrap">Color</th>
                      <th className="p-4 py-3 whitespace-nowrap">Asociado A</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-bold text-slate-700 divide-y divide-slate-50">
                    {currentItems.map(v => (
                      <tr key={v.id} className="hover:bg-rose-50/30 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {v.fotoUrl ? (
                              <img
                                src={v.fotoUrl.startsWith("http") ? v.fotoUrl : `http://localhost:5004/static${v.fotoUrl}`}
                                className="w-10 h-10 rounded-xl object-cover border-2 border-slate-100 shadow-sm"
                                alt="Vehiculo"
                                onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-lg border-2 border-white shadow-sm">🚙</div>
                            )}
                            <div>
                               <p className="text-[14px] text-rose-600 uppercase leading-none group-hover:text-rose-700 transition-colors tracking-tight">{v.placa}</p>
                               <span className="text-[10px] text-slate-400 tracking-tight uppercase">{v.marca || '-'} {v.modelo || ''}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap uppercase text-slate-500">{v.tipoVehiculo}</td>
                        <td className="p-4">
                           <div className="flex items-center gap-2">
                             <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: v.color || '#fff' }}></div>
                             <span className="uppercase text-[11px]">{v.color || 'N/A'}</span>
                           </div>
                        </td>
                        <td className="p-4">
                           {v.propietarioNombre ? (
                             <div className="flex flex-col">
                               <p className="uppercase leading-none">{v.propietarioNombre} {v.propietarioApellido}</p>
                               <span className="text-[10px] text-slate-400 tracking-widest uppercase">CC {v.propietarioDocumento}</span>
                             </div>
                           ) : (
                             <span className="text-[10px] text-slate-400 uppercase tracking-widest p-1 px-2 border border-slate-200 rounded bg-slate-50">Sin Asignar</span>
                           )}
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
                          ? "bg-rose-600 text-white shadow-md shadow-rose-100 scale-105" 
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
