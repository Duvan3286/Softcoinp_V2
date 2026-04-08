"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { settingsService } from "@/services/settingsService";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  MapPin, 
  Package, 
  ScrollText, 
  AlertTriangle, 
  BarChart3, 
  Database, 
  Settings, 
  Wrench,
  ChevronRight
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, setIsOpen } = useSidebar();
  const [isExpanded, setIsExpanded] = useState(false);
  const { user, hasPermission, loading: authLoading } = useAuth();
  const [systemVersion, setSystemVersion] = useState("");
  
  // Accordion State: Solo un grupo de nivel superior puede estar desplegado
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  


  useEffect(() => {
    if (pathname === "/login") return;

    // Cargar versión
    settingsService.getSystemVersion().then(setSystemVersion);

    // Auto-abrir grupos si la ruta actual pertenece a ellos
    if (pathname.includes("registros")) setOpenGroup("historial");
    if (pathname.includes("activo")) setOpenGroup("en-sitio");
    if (pathname.includes("novedades")) setOpenGroup("novedades");
    if (pathname.includes("reportes") && (pathname.includes("personas") || pathname.includes("vehiculos"))) setOpenGroup("catalogos");
    
    // Cerrar sidebar en móvil al navegar
    setIsOpen(false);
  }, [pathname, setIsOpen]);

  const toggleGroup = (group: string) => {
    setOpenGroup(openGroup === group ? null : group);
  };



  if (pathname === "/login" || authLoading) return null;

  return (
    <>
      {/* 🌑 BACKDROP (Solo móvil) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[115] lg:hidden animate-in fade-in duration-300"
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
         <nav className="flex flex-col gap-1.5 flex-grow px-3 overflow-y-auto overflow-x-hidden custom-scrollbar mt-4 pb-4">
            
            {hasPermission("dashboard") && (
                <NavItem icon={<LayoutDashboard className="w-5 h-5" />} text="Dashboard" path="/dashboard" currentPath={pathname} isExpanded={isExpanded} router={router} />
            )}
            
            {(hasPermission("sitio-personas") || hasPermission("sitio-vehiculos")) && (
                <NavGroup 
                    icon={<MapPin className="w-5 h-5" />} 
                    text="En Sitio" 
                    isOpen={openGroup === 'en-sitio'} 
                    isExpanded={isExpanded}
                    onToggle={() => toggleGroup('en-sitio')}
                >
                    {hasPermission("sitio-personas") && <NavItem text="Personas Activas" path="/personal-activo" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                    {hasPermission("sitio-vehiculos") && <NavItem text="Vehículos Activos" path="/vehiculos-activos" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                </NavGroup>
            )}

            {hasPermission("correspondencia") && (
                <NavItem icon={<Package className="w-5 h-5" />} text="Correspondencia" path="/correspondencia" currentPath={pathname} isExpanded={isExpanded} router={router} />
            )}

            {(hasPermission("historial-personas") || hasPermission("historial-vehiculos") || hasPermission("historial-vehiculares")) && (
                <NavGroup 
                    icon={<ScrollText className="w-5 h-5" />} 
                    text="Historial de Ingresos" 
                    isOpen={openGroup === 'historial'} 
                    isExpanded={isExpanded}
                    onToggle={() => toggleGroup('historial')}
                >
                    {hasPermission("historial-personas") && <NavItem text="Personas" path="/registros" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                    {hasPermission("historial-vehiculos") && <NavItem text="Vehículos" path="/registros-vehiculos" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                </NavGroup>
            )}

            {(hasPermission("novedades-personas") || hasPermission("novedades-vehicular")) && (
                <NavGroup 
                    icon={<AlertTriangle className="w-5 h-5" />} 
                    text="Novedades" 
                    isOpen={openGroup === 'novedades'} 
                    isExpanded={isExpanded} 
                    onToggle={() => toggleGroup('novedades')}
                >
                    {hasPermission("novedades-personas") && <NavItem text="Personas" path="/novedades" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                    {hasPermission("novedades-vehicular") && <NavItem text="Vehículos" path="/novedades-vehiculares" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                </NavGroup>
            )}

            {hasPermission("analitica-dashboard") && (
                <NavItem icon={<BarChart3 className="w-5 h-5" />} text="Analítica" path="/reportes" currentPath={pathname} isExpanded={isExpanded} router={router} />
            )}

            {(hasPermission("analitica-personas") || hasPermission("analitica-vehiculos")) && (
                <NavGroup 
                    icon={<Database className="w-5 h-5" />} 
                    text="Catálogos" 
                    isOpen={openGroup === 'catalogos'} 
                    isExpanded={isExpanded}
                    onToggle={() => toggleGroup('catalogos')}
                >
                    {hasPermission("analitica-personas") && <NavItem text="Personas" path="/reportes/personas" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                    {hasPermission("analitica-vehiculos") && <NavItem text="Vehículos" path="/reportes/vehiculos" currentPath={pathname} isExpanded={isExpanded} router={router} isSubItem />}
                    {hasPermission("exportar-reportes") && <p className="hidden" />} 
                </NavGroup>
            )}

            {(user?.role === "admin" || user?.role === "superadmin") && hasPermission("configuraciones") && (
                <NavItem icon={<Settings className="w-5 h-5" />} text="Configuraciones" path="/configuraciones" currentPath={pathname} isExpanded={isExpanded} router={router} />
            )}

            {user?.role === "superadmin" && (
                <NavItem icon={<Wrench className="w-5 h-5" />} text="Mantenimiento (Super Admin)" path="/configuraciones/mantenimiento" currentPath={pathname} isExpanded={isExpanded} router={router} highlightRed />
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
        <div className="flex flex-col">
            <button 
                onClick={onToggle}
                className={`flex items-center p-3 rounded-xl transition-all duration-200 font-medium border whitespace-nowrap overflow-hidden group relative w-full
                    ${isOpen 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50 shadow-sm' 
                        : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-800 dark:hover:text-slate-200'}
                `}
                title={text}
            >
                <span className="flex-shrink-0 flex items-center justify-center w-6 group-hover:scale-110 transition-transform">
                    {icon}
                </span>
                <span 
                    className={`ml-3 text-sm transition-opacity duration-300 flex-1 text-left tracking-wide font-semibold ${isExpanded ? 'lg:opacity-100 lg:w-auto' : 'lg:opacity-0 lg:w-0 lg:hidden'}`}
                >
                    {text}
                </span>
                {isExpanded && (
                    <span className={`transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-90 text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        <ChevronRight className="w-4 h-4" />
                    </span>
                )}
            </button>
            {isOpen && (
                <div className={`flex flex-col gap-1 mt-1 mb-2 relative before:absolute before:inset-y-2 before:left-[24px] before:w-[1px] before:bg-slate-200 dark:before:bg-zinc-800 animate-in slide-in-from-top-1 duration-200 ${!isExpanded ? 'lg:hidden' : ''}`}>
                    {children}
                </div>
            )}
        </div>
    );
}

function NavItem({ icon, text, path, currentPath, isExpanded, alert, highlightRed, router, isSubItem }: any) {
  const isActive = currentPath === path || (currentPath !== '/dashboard' && currentPath.startsWith(path) && path !== '/dashboard');
  
  let baseClass = `flex items-center rounded-xl transition-all duration-200 whitespace-nowrap overflow-hidden group relative w-full border ${
    isSubItem 
      ? 'pl-6 pr-3 py-2.5 font-medium text-[13px]' // pl-6 es 1.5rem de padding-left
      : 'p-3 font-semibold text-sm'
  } `;
  
  if (highlightRed) {
     baseClass += `text-rose-600 dark:text-rose-400 border-transparent hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-900/50 `;
  } else if (alert) {
     baseClass += `bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.1)] `;
  } else if (isActive) {
     if (isSubItem) {
        baseClass += `text-emerald-600 dark:text-emerald-400 border-transparent font-bold bg-transparent`; 
     } else {
        baseClass += `bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 shadow-sm `;
     }
  } else {
     baseClass += `text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 ${!isSubItem ? 'hover:bg-slate-50 dark:hover:bg-zinc-900' : ''} `;
  }

  return (
    <button onClick={() => router.push(path)} className={baseClass} title={text}>
       {!isSubItem && (
         <span className={`flex-shrink-0 flex items-center justify-center w-6 group-hover:scale-110 transition-transform ${isActive ? 'drop-shadow-md z-10 relative' : 'z-10 relative'}`}>
           {icon}
         </span>
       )}
       
       {isSubItem && isActive && (
         <div className="absolute left-[21px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 z-10 shadow-sm ring-4 ring-card" />
       )}

       <span 
         className={`transition-opacity duration-300 flex-1 text-left tracking-wide ${(!isExpanded && !isSubItem) ? 'lg:opacity-0 lg:w-0 lg:hidden' : ''} ${!isSubItem ? 'ml-3' : 'ml-6'}`}
       >
         {text}
       </span>
       
       {!isExpanded && isActive && !isSubItem && (
         <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-emerald-600 dark:bg-emerald-500 rounded-r-full shadow-sm"></div>
       )}
    </button>
  );
}

