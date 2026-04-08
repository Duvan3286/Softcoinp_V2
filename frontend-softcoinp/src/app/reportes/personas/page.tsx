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

type SortKey = "nombre" | "documento" | "tipo" | "estado";
type SortDir = "asc" | "desc";

// Icono de ordenamiento para las cabeceras
const SortIcon = ({ colKey, sortKey, sortDir }: { colKey: SortKey; sortKey: SortKey; sortDir: SortDir }) => {
  const active = colKey === sortKey;
  return (
    <span className={`inline-flex flex-col ml-1 leading-none transition-opacity ${active ? "opacity-100" : "opacity-30"}`}>
      <svg className={`w-2.5 h-2.5 ${active && sortDir === "asc" ? "text-emerald-600" : "text-slate-400"}`} viewBox="0 0 10 6" fill="currentColor">
        <path d="M5 0L10 6H0L5 0z" />
      </svg>
      <svg className={`w-2.5 h-2.5 ${active && sortDir === "desc" ? "text-emerald-600" : "text-slate-400"}`} viewBox="0 0 10 6" fill="currentColor">
        <path d="M5 6L0 0h10L5 6z" />
      </svg>
    </span>
  );
};

export default function CatalogPersonalPage() {
  const [personal, setPersonal] = useState<PersonalListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Ordenamiento — por defecto: nombre A→Z
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"todos" | "bloqueado" | "habilitado">("todos");
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

  // Alternar criterio/dirección al hacer clic en la cabecera
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  // Valor numérico de estado para comparar (Bloqueado > En Sitio > Inactivo)
  const estadoOrder = (p: PersonalListDto) =>
    p.isBloqueado ? 2 : p.tieneEntradaActiva ? 1 : 0;

  const filteredPersonal = personal
    .filter(p => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        (p.nombre?.toLowerCase().includes(q) || false) ||
        (p.apellido?.toLowerCase().includes(q) || false) ||
        (p.documento?.toLowerCase().includes(q) || false) ||
        (p.tipo?.toLowerCase().includes(q) || false) ||
        (p.empresa?.toLowerCase().includes(q) || false);
      const matchStatus =
        statusFilter === "todos" ? true :
        statusFilter === "bloqueado" ? p.isBloqueado :
        /* habilitado */ !p.isBloqueado;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "nombre":
          cmp = `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`, "es");
          break;
        case "documento":
          cmp = a.documento.localeCompare(b.documento, undefined, { numeric: true });
          break;
        case "tipo":
          cmp = a.tipo.localeCompare(b.tipo, "es");
          break;
        case "estado":
          cmp = estadoOrder(a) - estadoOrder(b);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalPages = Math.ceil(filteredPersonal.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredPersonal.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Cabecera sortable reutilizable
  const Th = ({ label, colKey, right = false }: { label: string; colKey: SortKey; right?: boolean }) => (
    <th
      className={`p-4 py-3 whitespace-nowrap cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors ${right ? "text-right" : ""}`}
      onClick={() => handleSort(colKey)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        <SortIcon colKey={colKey} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  );

  return (
    <div className="flex-1 h-auto flex flex-col min-h-0 bg-background p-4 lg:overflow-hidden lg:h-full transition-colors duration-300">
       <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col min-h-0">
         
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 shrink-0">
          <div className="flex items-center gap-4">


            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-md shadow-emerald-100 dark:shadow-none">
                 <span className="text-xl">👥</span>
              </div>
              <div>
                <h1 className="text-lg lg:text-xl font-black text-foreground uppercase tracking-tight leading-none drop-shadow-sm">Catálogo de Personas</h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Base de datos de perfiles registrados</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative min-w-[230px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, documento..."
                className="w-full pl-8 pr-3 py-2 bg-input border border-border rounded-xl text-[13px] font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 outline-none transition-all placeholder-slate-300 dark:placeholder-slate-600 uppercase shadow-sm text-foreground"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as "todos" | "bloqueado" | "habilitado")}
              className="py-2 px-3 bg-input border border-border rounded-xl text-[12px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 outline-none transition-all shadow-sm cursor-pointer"
            >
              <option value="todos">Todos</option>
              <option value="bloqueado">Bloqueados</option>
              <option value="habilitado">Habilitados</option>
            </select>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border flex-1 flex flex-col min-h-0 overflow-hidden transition-colors">
           
           <div className="overflow-x-auto flex-1 custom-scrollbar">
             {loading ? (
                <div className="flex items-center justify-center h-full min-h-[300px] text-slate-400 gap-3 flex-col">
                   <div className="w-8 h-8 border-4 border-border border-t-emerald-600 rounded-full animate-spin"></div>
                   <p className="text-[10px] font-black uppercase tracking-widest">Cargando base de datos...</p>
                </div>
             ) : currentItems.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[300px] text-slate-300 dark:text-slate-700 flex-col gap-3">
                   <span className="text-5xl opacity-30 grayscale">📭</span>
                   <p className="text-[10px] font-black uppercase tracking-widest">No se hallaron resultados</p>
                </div>
             ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-background uppercase text-[10px] font-black text-slate-500 dark:text-slate-400 tracking-widest border-b border-border transition-colors">
                      <Th label="Perfil" colKey="nombre" />
                      <Th label="Documento" colKey="documento" />
                      <Th label="Tipo / Emp." colKey="tipo" />
                      <Th label="Estado" colKey="estado" />
                      {/* Contacto no es sortable */}
                      <th className="p-4 py-3 whitespace-nowrap text-right">Contacto</th>
                    </tr>
                  </thead>
                  <tbody className="text-[13px] font-bold text-foreground divide-y divide-border transition-colors">
                    {currentItems.map(p => (
                      <tr key={p.id} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {p.fotoUrl ? (
                              <img
                                src={p.fotoUrl.startsWith("http") ? p.fotoUrl : `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api").replace(/\/api$/, "/static")}${p.fotoUrl}`}
                                className="w-10 h-10 rounded-full object-cover border-2 border-border shadow-sm"
                                alt="Avatar"
                                onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-input flex items-center justify-center text-slate-400 dark:text-slate-600 text-lg border-2 border-border shadow-sm">👤</div>
                            )}
                            <div>
                               <p className="uppercase leading-none group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{p.nombre} {p.apellido}</p>
                               <span className="text-[10px] text-slate-400 dark:text-slate-500 tracking-tight font-medium">Reg: {new Date(p.fechaCreacionUtc).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">{p.documento}</td>
                        <td className="p-4">
                           <div className="flex flex-col">
                             <span className="uppercase text-emerald-600 dark:text-emerald-400">{p.tipo}</span>
                             <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[120px]" title={p.empresa}>{p.empresa || '-'}</span>
                           </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                           <div className="flex gap-1.5 flex-col items-start">
                             {p.isBloqueado && <span className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded border border-red-200 dark:border-red-800 tracking-widest uppercase font-black">Bloqueado</span>}
                             {p.tieneEntradaActiva && <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 tracking-widest uppercase font-black">En Sitio</span>}
                             {!p.isBloqueado && !p.tieneEntradaActiva && <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 tracking-widest uppercase font-black">Habilitado</span>}
                           </div>
                        </td>
                        <td className="p-4 text-right">
                           <p className="text-[11px] whitespace-nowrap">{p.telefono || '-'}</p>
                           <p className="text-[10px] text-slate-400 dark:text-slate-500 lowercase font-medium">{p.email || '-'}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             )}
           </div>

           {/* PAGINACIÓN */}
           {filteredPersonal.length > 0 && (
             <div className="bg-background relative z-10 border-t border-border p-3 flex items-center justify-between shrink-0 transition-colors">
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="p-1.5 bg-card border border-border rounded-lg text-slate-400 hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-all shadow-sm active:scale-90"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                  </button>

                  <div className="flex items-center bg-card px-3 py-1.5 rounded-xl border border-border shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-2">Página</span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{currentPage}</span>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mx-2">de</span>
                    <span className="text-xs font-black text-foreground">{totalPages || 1}</span>
                  </div>

                  <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="p-1.5 bg-card border border-border rounded-lg text-slate-400 hover:text-emerald-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-all shadow-sm active:scale-90"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                   <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total:</span>
                   <span className="text-xs font-black text-foreground bg-card px-3 py-1.5 rounded-xl border border-border shadow-sm">
                     {filteredPersonal.length} {filteredPersonal.length === 1 ? 'persona' : 'personas'}
                   </span>
                </div>
             </div>
           )}

        </div>
       </div>
    </div>
  );
}
