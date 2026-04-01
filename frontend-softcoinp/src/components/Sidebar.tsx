"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { settingsService } from "@/services/settingsService";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, setIsOpen } = useSidebar();
  const [isExpanded, setIsExpanded] = useState(false);
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [systemVersion, setSystemVersion] = useState("");
  const [isHistorialOpen, setIsHistorialOpen] = useState(false);
  const [isEnSitioOpen, setIsEnSitioOpen] = useState(false);
  const [isNovedadesOpen, setIsNovedadesOpen] = useState(false);
  const [isAnaliticaOpen, setIsAnaliticaOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/login") return;

    // Cargar versión
    settingsService.getSystemVersion().then(setSystemVersion);

    // Auto-abrir grupos si la ruta actual pertenece a ellos
    if (pathname.includes("registros")) setIsHistorialOpen(true);
    if (pathname.includes("activo")) setIsEnSitioOpen(true);
    if (pathname.includes("novedades")) setIsNovedadesOpen(true);
    if (pathname.includes("reportes")) setIsAnaliticaOpen(true);
    
    // Cerrar sidebar en móvil al navegar
    setIsOpen(false);
  }, [pathname, setIsOpen]);

  if (pathname === "/login" || authLoading) return null;

  return (
    <>
      {/* 🌑 BACKDROP (Solo móvil) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[115] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        className={`bg-card text-foreground flex flex-col pt-2 pb-4 flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)] dark:shadow-none border-r border-border transition-all duration-300 ease-in-out
          fixed inset-y-0 left-0 z-[120] lg:static lg:z-10 h-full
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isExpanded ? 'w-72' : 'w-72 lg:w-[88px]'}
        `}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
         <nav className="flex flex-col gap-2 flex-grow px-4 overflow-y-auto overflow-x-hidden custom-scrollbar mt-4">
            {hasPermission("dashboard") && (
                <NavItem icon="🏢" text="Dashboard" path="/dashboard" currentPath={pathname} isExpanded={isExpanded} router={router} />
            )}
            
            {/* Grupo Novedades */}
            {(hasPermission("novedades-personas") || hasPermission("novedades-vehicular")) && (
                <NavGroup 
                icon="📁" 
                text="Novedades" 
                isOpen={isNovedadesOpen && isExpanded} 
                isExpanded={isExpanded} 
                onToggle={() => setIsNovedadesOpen(!isNovedadesOpen)}
                >
                {hasPermission("novedades-personas") && <NavItem icon="👥" text="Novedades Personas" path="/novedades" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                {hasPermission("novedades-vehicular") && <NavItem icon="🚗" text="Novedades Vehicular" path="/novedades-vehiculares" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                </NavGroup>
            )}

            {/* Grupo Analítica y Catálogos */}
            {(hasPermission("analitica-dashboard") || hasPermission("analitica-personas") || hasPermission("analitica-vehiculos")) && (
                <NavGroup 
                icon="📊" 
                text="Analítica & Catálogos" 
                isOpen={isAnaliticaOpen && isExpanded} 
                isExpanded={isExpanded}
                onToggle={() => setIsAnaliticaOpen(!isAnaliticaOpen)}
                >
                {hasPermission("analitica-dashboard") && <NavItem icon="📈" text="Dashboard Analítico" path="/reportes" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                {hasPermission("analitica-personas") && <NavItem icon="👥" text="Catálogo Personas" path="/reportes/personas" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                {hasPermission("analitica-vehiculos") && <NavItem icon="🚗" text="Catálogo Vehículos" path="/reportes/vehiculos" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                {hasPermission("exportar-reportes") && <p className="hidden" />} {/* Marcador de permiso */}
                </NavGroup>
            )}
            
            {/* Grupo Historial */}
            {(hasPermission("historial-personas") || hasPermission("historial-vehiculos") || hasPermission("historial-vehiculares")) && (
                <NavGroup 
                icon="📜" 
                text="Historial De Ingresos" 
                isOpen={isHistorialOpen && isExpanded} 
                isExpanded={isExpanded}
                onToggle={() => setIsHistorialOpen(!isHistorialOpen)}
                >
                {hasPermission("historial-personas") && <NavItem icon="👥" text="Historial Personas" path="/registros" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                {hasPermission("historial-vehiculos") && <NavItem icon="🚗" text="Historial Vehículos" path="/registros-vehiculos" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                </NavGroup>
            )}

            {/* Grupo En Sitio */}
            {(hasPermission("sitio-personas") || hasPermission("sitio-vehiculos")) && (
                <NavGroup 
                icon="📍" 
                text="En Sitio" 
                isOpen={isEnSitioOpen && isExpanded} 
                isExpanded={isExpanded}
                onToggle={() => setIsEnSitioOpen(!isEnSitioOpen)}
                >
                {hasPermission("sitio-personas") && <NavItem icon="👤" text="Personas Activas" path="/personal-activo" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                {hasPermission("sitio-vehiculos") && <NavItem icon="🚘" text="Vehículos Activos" path="/vehiculos-activos" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                </NavGroup>
            )}

            {hasPermission("correspondencia") && (
                <NavItem icon="📦" text="Correspondencia" path="/correspondencia" currentPath={pathname} isExpanded={isExpanded} router={router} />
            )}

            {(user?.role === "admin" || user?.role === "superadmin") && hasPermission("configuraciones") && (
               <div className="mt-2 pt-2 border-t border-border">
                   <NavItem icon="🔑" text="Configuraciones" path="/configuraciones" currentPath={pathname} isExpanded={isExpanded} router={router} />
               </div>
            )}

           {user?.role === "superadmin" && (
              <div className="mt-2 text-[10px] uppercase font-black text-slate-300 dark:text-slate-600 px-4 mb-1">Super Admin</div>
           )}
           {user?.role === "superadmin" && (
              <NavItem icon="🛠️" text="Mantenimiento" path="/configuraciones/general?mantenimiento=true" currentPath={pathname} isExpanded={isExpanded} router={router} highlightRed />
           )}
        </nav>

        <div className="mt-auto pt-4 border-t border-border text-center overflow-hidden flex flex-col items-center justify-center min-h-[40px]">
           {isExpanded ? (
             <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-widest whitespace-nowrap animate-in fade-in duration-300 uppercase">Softcoinp {systemVersion || "..."}</p>
           ) : (
             <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase">{systemVersion ? systemVersion.substring(0, 4) : "..."}</p>
           )}
        </div>
      </aside>
    </>
  );
}

function NavGroup({ icon, text, isOpen, isExpanded, onToggle, children }: any) {
    return (
        <div className="flex flex-col gap-1">
            <button 
                onClick={onToggle}
                className={`flex items-center p-3 rounded-2xl transition-all duration-200 font-semibold border whitespace-nowrap overflow-hidden group relative w-full
                    ${isOpen 
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50' 
                        : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'}
                `}
                title={text}
            >
                <span className="text-xl flex-shrink-0 flex items-center justify-center w-8 group-hover:scale-110 transition-transform">{icon}</span>
                <span 
                    className={`text-sm ml-3 transition-opacity duration-300 flex-1 text-left tracking-wide ${isExpanded ? 'lg:opacity-100' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}
                >
                    {text}
                </span>
                {isExpanded && (
                    <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="flex flex-col gap-1 ml-4 border-l-2 border-slate-100 dark:border-slate-800 pl-2 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
}

function NavItem({ icon, text, path, currentPath, isExpanded, alert, highlightRed, router, isSubItem }: any) {
  const isActive = currentPath === path || (currentPath !== '/dashboard' && currentPath.startsWith(path) && path !== '/dashboard');
  
  let baseClass = `flex items-center ${isSubItem ? 'p-2' : 'p-3'} rounded-2xl transition-all duration-200 font-semibold border whitespace-nowrap overflow-hidden group relative `;
  
  if (highlightRed) {
     baseClass += `bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 animate-pulse-red `;
  } else if (alert) {
     baseClass += `bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.1)] `;
  } else if (isActive) {
     baseClass += `bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 shadow-[0_4px_20px_rgba(79,70,229,0.08)] `;
  } else {
     baseClass += `text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 `;
  }

  return (
    <button onClick={() => router.push(path)} className={baseClass} title={text}>
       <span className={`${isSubItem ? 'text-lg' : 'text-xl'} flex-shrink-0 flex items-center justify-center w-8 group-hover:scale-110 transition-transform ${isActive ? 'drop-shadow-md' : ''}`}>{icon}</span>
       <span 
         className={`${isSubItem ? 'text-xs' : 'text-sm'} ml-3 transition-opacity duration-300 flex-1 text-left tracking-wide ${isExpanded ? 'lg:opacity-100' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}
       >
         {text}
       </span>
       {/* Pill indicator for active state when collapsed */}
       {!isExpanded && isActive && (
         <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-indigo-600 dark:bg-indigo-500 rounded-r-full shadow-sm"></div>
       )}
    </button>
  );
}
