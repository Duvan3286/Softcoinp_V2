"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser } from "@/utils/auth";
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [usuario, setUsuario] = useState<{ role?: string; id?: string } | null>(null);
  const [hayNovedades, setHayNovedades] = useState(false); // Reservado para uso futuro global

  useEffect(() => {
    if (pathname === "/login") return;
    setUsuario(getCurrentUser() as any);
  }, [pathname]);

  if (pathname === "/login") return null;

  return (
    <aside 
      className={`bg-white text-slate-700 flex flex-col pt-2 pb-4 z-[100] flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)] relative transition-all duration-300 ease-in-out border-r border-slate-200 ${isExpanded ? 'w-64' : 'w-[88px]'} hidden lg:flex h-full`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <nav className="flex flex-col gap-3 flex-grow px-4 overflow-y-auto overflow-x-hidden custom-scrollbar mt-4">
         <NavItem icon="🏢" text="Dashboard" path="/dashboard" currentPath={pathname} isExpanded={isExpanded} router={router} />
         <NavItem icon="📊" text="Reportes" path="/reportes" currentPath={pathname} isExpanded={isExpanded} alert={hayNovedades} router={router} />
         <NavItem icon="📜" text="Registros" path="/registros" currentPath={pathname} isExpanded={isExpanded} router={router} />
         <NavItem icon="📦" text="Correspondencia" path="/correspondencia" currentPath={pathname} isExpanded={isExpanded} router={router} />
         <NavItem icon="👥" text="Registros Activos" path="/personal-activo" currentPath={pathname} isExpanded={isExpanded} router={router} />

         {(usuario?.role === "admin" || usuario?.role === "superadmin") && (
            <div className="mt-2 pt-2 border-t border-slate-200">
                <NavItem icon="🔑" text="Configuraciones" path="/configuraciones" currentPath={pathname} isExpanded={isExpanded} router={router} />
            </div>
         )}

         {usuario?.role === "superadmin" && (
           <div className="mt-2">
            <NavItem icon="🛠️" text="Mantenimiento (DEV)" path="/configuraciones/general?mantenimiento=true" currentPath={pathname} isExpanded={isExpanded} router={router} highlightRed />
           </div>
         )}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-200 text-center overflow-hidden flex flex-col items-center justify-center min-h-[40px]">
         {isExpanded ? (
           <p className="text-[10px] text-slate-400 font-bold tracking-widest whitespace-nowrap animate-in fade-in duration-300">SOFTCOINP V1.0</p>
         ) : (
           <p className="text-[10px] text-slate-400 font-bold tracking-widest">V1.0</p>
         )}
      </div>
    </aside>
  );
}

function NavItem({ icon, text, path, currentPath, isExpanded, alert, highlightRed, router }: any) {
  const isActive = currentPath === path || (currentPath !== '/dashboard' && currentPath.startsWith(path) && path !== '/dashboard');
  
  let baseClass = `flex items-center p-3 rounded-2xl transition-all duration-200 font-semibold border whitespace-nowrap overflow-hidden group relative `;
  
  if (highlightRed) {
     baseClass += `bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 animate-pulse-red `;
  } else if (alert) {
     baseClass += `bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.1)] `;
  } else if (isActive) {
     baseClass += `bg-blue-50 text-blue-700 border-blue-200 shadow-[0_4px_20px_rgba(37,99,235,0.08)] `;
  } else {
     baseClass += `text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-800 `;
  }

  return (
    <button onClick={() => router.push(path)} className={baseClass} title={text}>
       <span className={`text-xl flex-shrink-0 flex items-center justify-center w-8 group-hover:scale-110 transition-transform ${isActive ? 'drop-shadow-md' : ''}`}>{icon}</span>
       <span 
         className={`text-sm ml-3 transition-opacity duration-300 flex-1 text-left tracking-wide ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}
         style={{ display: isExpanded ? 'block' : 'none' }}
       >
         {text}
       </span>
       {/* Pill indicator for active state when collapsed */}
       {!isExpanded && isActive && (
         <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-blue-600 rounded-r-full shadow-sm"></div>
       )}
    </button>
  );
}
