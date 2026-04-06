"use client";

import { useEffect, useState } from "react";
import { getDashboardStats, DashboardStatsDto } from "@/services/reportesService";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

// Paletas de colores
const COLORS_NOVEDADES = ['#ec4899', '#f59e0b']; // Pink, Amber
const COLORS_TIPOS = ['#3b82f6', '#10b981', '#8b5cf6', '#64748b']; // Blue, Emerald, Violet, Slate
const COLORS_DESTINOS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899']; 

export default function ReportesDashboardPage() {
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Custom Filters
  const [desdeFilter, setDesdeFilter] = useState("");
  const [hastaFilter, setHastaFilter] = useState("");

  const router = useRouter();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async (aplicarFechas: boolean = false) => {
    setLoading(true);
    let d = undefined;
    let h = undefined;
    if (aplicarFechas) {
      if (desdeFilter) d = desdeFilter;
      if (hastaFilter) h = hastaFilter;
    }
    const data = await getDashboardStats(d, h);
    setStats(data);
    setLoading(false);
  };

  const limpiarFiltros = () => {
    setDesdeFilter("");
    setHastaFilter("");
    setLoading(true);
    getDashboardStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  };

  if (loading && !stats) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-background p-4">
        <div className="w-14 h-14 border-4 border-border border-t-indigo-600 rounded-full animate-spin mb-4 shadow-xl"></div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-[11px] animate-pulse">Analizando Datos...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background p-4 justify-center items-center">
        <span className="text-5xl mb-4 grayscale opacity-30">🔌</span>
        <h2 className="text-foreground font-black text-xl mb-1 uppercase tracking-tight">Error de Conexión</h2>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-center">No fue posible obtener los datos analíticos del servidor.</p>
        <button onClick={() => loadStats()} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">Reintentar</button>
      </div>
    );
  }

  // Sanitizado de gráficos para evitar que los charts colapsen si todo está en 0
  const checkEmpty = (arr: any[]) => arr.reduce((acc, c) => acc + c.value, 0) > 0;

  const chartProporcion = checkEmpty(stats.proporcionNovedades) ? stats.proporcionNovedades : [{ name: "Ninguna Novedad", value: 1 }];
  const chartTipos = checkEmpty(stats.registrosPorTipo) ? stats.registrosPorTipo : [{ name: "Sin Ingresos", value: 1 }];
  const chartDestinos = stats.registrosPorDestino.length > 0 ? stats.registrosPorDestino : [{ name: "Sin Data", value: 0 }];

  // Helper para generar URLs con filtros
  const queryParams = `?desde=${desdeFilter}&hasta=${hastaFilter}`;

  return (
    <div className="flex-1 h-auto lg:h-full flex flex-col min-h-0 bg-background p-2 lg:py-2 lg:px-4 lg:overflow-hidden relative transition-colors duration-300">

      {/* Fondo decorativo sutil */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/5 to-fuchsia-500/5 rounded-full blur-3xl pointer-events-none -mt-40 -mr-40"></div>

      <div className="max-w-[1400px] mx-auto w-full h-full flex flex-col min-h-0 relative z-10">

        {/* HEADER & FILTERS (COMPACTED) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-3 shrink-0 bg-card/60 p-3 lg:px-4 rounded-2xl border border-border shadow-sm backdrop-blur-md transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center">
               <span className="text-xl">📈</span>
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-black text-foreground uppercase tracking-tight leading-none drop-shadow-sm">Dashboard Analítico</h1>
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-0.5">Métricas útiles sobre flujos y control</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="flex flex-col gap-0.5">
               <label className="text-[8px] uppercase font-black text-slate-400 dark:text-slate-500 px-1 tracking-widest">Desde</label>
               <input
                 type="date"
                 value={desdeFilter}
                 onChange={e => setDesdeFilter(e.target.value)}
                 className="px-2 py-1.5 bg-input border border-border rounded-lg text-[11px] font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all shadow-sm text-foreground"
               />
             </div>
             <div className="flex flex-col gap-0.5">
               <label className="text-[8px] uppercase font-black text-slate-400 dark:text-slate-500 px-1 tracking-widest">Hasta</label>
               <input
                 type="date"
                 value={hastaFilter}
                 onChange={e => setHastaFilter(e.target.value)}
                 className="px-2 py-1.5 bg-input border border-border rounded-lg text-[11px] font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all shadow-sm text-foreground"
               />
             </div>

             <div className="flex gap-2 items-end">
               <button
                 onClick={() => loadStats(true)}
                 className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-indigo-200 dark:shadow-none"
               >
                 Aplicar
               </button>
               {(desdeFilter || hastaFilter) && (
                 <button
                   onClick={limpiarFiltros}
                   className="mt-3 bg-card hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm border border-border"
                 >
                   ✗
                 </button>
               )}
             </div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT / FLEX CONTENT */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden min-h-0 flex flex-col gap-3 pb-2 lg:pb-0">

          {/* KPI CARDS (Compact & unified theme) */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3 shrink-0">
            {/* Ingresos en el rango */}
            <div className="bg-card rounded-[20px] p-3 lg:p-4 border border-border shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-300">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 rounded-full blur-xl"></div>
              <div className="relative z-10 flex flex-col h-full gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs shadow-sm">📥</div>
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">Accesos <br/><span className="text-indigo-400">En Rango</span></p>
                </div>
                <div className="flex items-end gap-1 mt-auto">
                  <span className="text-2xl lg:text-3xl font-black text-foreground leading-none tracking-tighter">{stats.ingresosRango}</span>
                  <span className="text-[8px] text-indigo-400 font-bold uppercase pb-0.5 tracking-widest">Tránsitos</span>
                </div>
              </div>
            </div>

            {/* Novedades Personas (CON LINK) */}
            <div 
              onClick={() => router.push(`/historial-novedades${queryParams}`)}
              className="bg-card rounded-[20px] p-3 lg:p-4 border border-pink-100/50 dark:border-pink-900/30 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-pink-500/5 to-pink-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-col h-full gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-pink-50 dark:bg-pink-900/30 text-pink-500 flex items-center justify-center text-xs shadow-sm group-hover:bg-pink-100 dark:group-hover:bg-pink-900/50 transition-colors">⚠️</div>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">Novedades <br/><span className="text-pink-500">Personas</span></p>
                  </div>
                  <span className="text-[10px] text-pink-300 opacity-0 group-hover:opacity-100 transition-opacity">▸</span>
                </div>
                <div className="flex items-end gap-1 mt-auto">
                  <span className="text-2xl lg:text-3xl font-black text-pink-600 leading-none tracking-tighter">{stats.novedadesPersonas}</span>
                  <span className="text-[8px] text-pink-400 font-bold uppercase pb-0.5 tracking-widest">Hechos</span>
                </div>
              </div>
            </div>

            {/* Novedades Vehículos (CON LINK) */}
            <div 
              onClick={() => router.push(`/historial-vehiculares${queryParams}`)}
              className="bg-card rounded-[20px] p-3 lg:p-4 border border-orange-100/50 dark:border-orange-900/30 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-orange-500/5 to-orange-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-col h-full gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center text-xs shadow-sm group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors">🚨</div>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">Novedades <br/><span className="text-orange-500">Vehículos</span></p>
                  </div>
                  <span className="text-[10px] text-orange-300 opacity-0 group-hover:opacity-100 transition-opacity">▸</span>
                </div>
                <div className="flex items-end gap-1 mt-auto">
                  <span className="text-2xl lg:text-3xl font-black text-orange-500 leading-none tracking-tighter">{stats.novedadesVehiculos}</span>
                  <span className="text-[8px] text-orange-400 font-bold uppercase pb-0.5 tracking-widest">Hechos</span>
                </div>
              </div>
            </div>

            {/* Total Base Personas (Unified Theme) */}
            <div 
              onClick={() => router.push("/reportes/personas")}
              className="bg-card rounded-[20px] p-3 lg:p-4 border border-indigo-100/50 dark:border-indigo-900/30 shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-col h-full gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center text-xs shadow-sm group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">👥</div>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">Catálogo <br/><span className="text-indigo-500">Personas</span></p>
                  </div>
                  <span className="text-[10px] text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                </div>
                <div className="flex items-end gap-1 mt-auto">
                  <span className="text-2xl lg:text-3xl font-black text-foreground leading-none tracking-tighter">{stats.totalPersonas}</span>
                  <span className="text-[8px] text-indigo-400 font-bold uppercase pb-0.5 tracking-widest">Registrados</span>
                </div>
              </div>
            </div>

            {/* Total Base Vehículos (Unified Theme) */}
            <div 
              onClick={() => router.push("/reportes/vehiculos")}
              className="bg-card rounded-[20px] p-3 lg:p-4 border border-rose-100/50 dark:border-rose-900/30 shadow-sm flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 md:col-span-2 lg:col-span-1"
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-rose-500/5 to-rose-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-col h-full gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center text-xs shadow-sm group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50 transition-colors">🚗</div>
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-tight">Catálogo <br/><span className="text-rose-500">Vehículos</span></p>
                  </div>
                  <span className="text-[10px] text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                </div>
                <div className="flex items-end gap-1 mt-auto">
                  <span className="text-2xl lg:text-3xl font-black text-foreground leading-none tracking-tighter">{stats.totalVehiculos}</span>
                  <span className="text-[8px] text-rose-400 font-bold uppercase pb-0.5 tracking-widest">Registrados</span>
                </div>
              </div>
            </div>
          </div>

          {/* CHARTS CONTAINER - 3 COLUMNS (Flexible height) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 flex-1 min-h-[500px] lg:min-h-0">

            {/* Chart 1: Top Destinos Bar Chart */}
            <div className="bg-card rounded-[20px] border border-border shadow-sm p-4 flex flex-col relative overflow-hidden w-full h-full min-h-[220px] transition-colors">
               <div className="mb-2 shrink-0">
                  <h3 className="text-[12px] font-black text-foreground uppercase tracking-widest mb-0.5">
                    Destinos Frecuentes
                  </h3>
                  <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase">Zonas críticas de recepción</p>
               </div>

               <div className="flex-1 w-full min-h-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartDestinos}
                      layout="vertical"
                      margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                      <XAxis type="number" hide />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 9, fontWeight: 'bold', fill: isDark ? '#94a3b8' : '#64748b' }}
                        width={70}
                      />
                      <Tooltip 
                        cursor={{ fill: isDark ? '#1e293b' : '#f8fafc' }}
                        contentStyle={{ 
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          borderRadius: '12px', 
                          border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0', 
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
                          padding: '5px 10px' 
                        }}
                        itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: isDark ? '#f8fafc' : '#1e293b' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} name="Ingresos">
                        {chartDestinos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_DESTINOS[index % COLORS_DESTINOS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Tipo Perfil */}
            <div className="bg-card rounded-[20px] border border-border shadow-sm p-4 flex flex-col relative overflow-hidden w-full h-full min-h-[220px] transition-colors">
               <div className="mb-2 shrink-0 text-center">
                  <h3 className="text-[12px] font-black text-foreground uppercase tracking-widest mb-0.5">Registros por Tipo</h3>
                  <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase">Clasificación de perfiles de ingreso</p>
               </div>

               <div className="flex-1 w-full min-h-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartTipos}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                      >
                        {chartTipos.map((entry, index) => (
                          <Cell key={`cell-t-${index}`} fill={COLORS_TIPOS[index % COLORS_TIPOS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                          padding: '5px 10px' 
                        }}
                        itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: isDark ? '#f8fafc' : '#1e293b' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={24} 
                        iconType="circle"
                        wrapperStyle={{ 
                          fontSize: '9px', 
                          fontWeight: 'black', 
                          textTransform: 'uppercase', 
                          paddingTop: '5px',
                          color: isDark ? '#94a3b8' : '#64748b'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Proporción Novedades */}
            <div className="bg-card rounded-[20px] border border-border shadow-sm p-4 flex flex-col relative w-full overflow-hidden h-full min-h-[220px] transition-colors">
              <div className="mb-2 shrink-0 text-center">
                 <h3 className="text-[12px] font-black text-foreground uppercase tracking-widest mb-0.5">Balance de Novedades</h3>
                 <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase">Incidencia Personas vs Vehículos</p>
              </div>

              <div className="flex-1 w-full min-h-0 relative flex justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                         <filter id="shadowPie" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity={isDark ? "0.3" : "0.1"} />
                         </filter>
                      </defs>
                      <Pie
                        data={chartProporcion}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                        filter="url(#shadowPie)"
                      >
                        {chartProporcion.map((entry, index) => (
                          <Cell key={`cell-p-${index}`} fill={COLORS_NOVEDADES[index % COLORS_NOVEDADES.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                          padding: '5px 10px' 
                        }}
                        itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: isDark ? '#f8fafc' : '#1e293b' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={24} 
                        iconType="circle"
                        wrapperStyle={{ 
                          fontSize: '9px', 
                          fontWeight: 'black', 
                          textTransform: 'uppercase', 
                          paddingTop: '5px',
                          color: isDark ? '#94a3b8' : '#64748b'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
