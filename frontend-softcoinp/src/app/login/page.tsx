"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";

// Definimos el tipo esperado en la respuesta de login
interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    expiration: string;
    email: string;
    role: string;
  };
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [systemVersion, setSystemVersion] = useState("");
  const router = useRouter();

  useEffect(() => {
    import("@/services/settingsService").then(({ settingsService }) => {
      settingsService.getSystemVersion().then(setSystemVersion);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<LoginResponse>("/Auth/login", { email, password });

      localStorage.setItem("token", res.data.data.token);
      
      // 🧹 LIMPIEZA DE HISTORIAL: Evita volver al login al dar "atrás"
      window.location.replace("/dashboard");
    } catch (err: any) {
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 400) {
          setError("Usuario o contraseña incorrectos");
        } else {
          setError("Ocurrió un error en el servidor. Intenta más tarde.");
        }
      } else {
        setError("No se pudo conectar al servidor. Verifica tu conexión.");
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Lado izquierdo (2/3) - Decorativo Arquitectónico */}
      <div className="hidden lg:flex lg:w-2/3 relative flex-col justify-center overflow-hidden bg-background">
        
        {/* Grilla de líneas finas */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        {/* Polígonos angulares superpuestos con sutil brillo (borde y sombra) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <svg fill="none" viewBox="0 0 800 800" className="w-[120%] h-[120%] max-w-none text-emerald-600">
            <g className="origin-center" stroke="currentColor">
               <polygon points="100,700 300,100 700,300 500,800" strokeWidth="1" fill="none" className="drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
               <polygon points="200,600 400,200 800,400 600,900" strokeWidth="0.5" fill="none" className="drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
               <line x1="100" y1="700" x2="800" y2="400" strokeWidth="1" strokeDasharray="5,10" />
               <line x1="300" y1="100" x2="600" y2="900" strokeWidth="0.5" />
            </g>
          </svg>
        </div>

        {/* Borde derecho emitiendo el sutil brillo */}
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-emerald-500/30 shadow-[0_0_20px_2px_rgba(16,185,129,0.4)] z-20"></div>

        <div className="relative z-10 px-24">
          <div className="w-16 h-16 border border-emerald-500/50 flex flex-col justify-center items-center shadow-[0_0_15px_rgba(16,185,129,0.2)] mb-10 bg-emerald-500/5 backdrop-blur-sm rounded-none">
            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3"></path>
            </svg>
          </div>
          <h2 className="text-5xl font-black text-foreground uppercase tracking-tighter leading-[0.9] mb-6">
            Software De <br/>
            Control De <br/>
            <span className="text-emerald-600 drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]">Ingresos</span>
          </h2>
          <p className="text-xs font-bold text-slate-500 max-w-sm uppercase tracking-[0.2em] leading-relaxed">
            Plataforma integral de gestión, auditoría y análisis de ingresos en tiempo real.
          </p>
        </div>
      </div>

      {/* Lado derecho (1/3) - Formulario */}
      <div className="w-full lg:w-1/3 flex flex-col bg-card relative z-30 shadow-[-20px_0_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="w-full max-w-[320px] mx-auto px-6 py-12 flex flex-col justify-center min-h-screen">
          
          <div className="mb-14">
            <svg className="w-10 h-10 text-emerald-600 mb-6 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter m-0 p-0 leading-none">
              SOFTCOINP
            </h1>
            <p className="text-emerald-600 font-bold text-sm tracking-[0.3em] mt-2 mb-6">
              {systemVersion || "V..."}
            </p>
            <hr className="border-t-2 border-emerald-600 w-12 ml-0" />
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            {error && (
              <div className="bg-rose-50/50 dark:bg-rose-950/20 border-l-2 border-rose-600 text-rose-600 dark:text-rose-400 px-4 py-3 text-[10px] font-black uppercase tracking-widest flex items-start gap-3 mt-4">
                <span className="text-base leading-none">×</span>
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <div className="relative pt-6">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer w-full bg-transparent border-0 border-b border-emerald-600 focus:border-b-2 text-foreground text-sm font-bold pb-2 px-0 pt-1 outline-none transition-all placeholder-transparent uppercase tracking-widest rounded-none focus:ring-0 [&:-webkit-autofill]:transition-[background-color] [&:-webkit-autofill]:duration-[50000s] [&:-webkit-autofill]:ease-in-out [&:-webkit-autofill]:[-webkit-text-fill-color:inherit]"
                placeholder="email"
                required
              />
              <label 
                htmlFor="email" 
                className={`absolute left-0 uppercase tracking-[0.2em] transition-all cursor-text pointer-events-none
                  ${email ? 'top-0 text-[10px] font-black text-emerald-600' : 'top-7 text-xs text-slate-400 dark:text-slate-500 font-bold'}
                  peer-focus:top-0 peer-focus:text-[10px] peer-focus:font-black peer-focus:text-emerald-600
                  peer-autofill:top-0 peer-autofill:text-[10px] peer-autofill:font-black peer-autofill:text-emerald-600
                  peer-[:-webkit-autofill]:top-0 peer-[:-webkit-autofill]:text-[10px] peer-[:-webkit-autofill]:font-black peer-[:-webkit-autofill]:text-emerald-600
                `}
              >
                Correo Electrónico
              </label>
            </div>
            
            <div className="relative pt-6">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full bg-transparent border-0 border-b border-emerald-600 focus:border-b-2 text-foreground text-sm font-bold pb-2 px-0 pt-1 outline-none transition-all placeholder-transparent uppercase tracking-widest rounded-none focus:ring-0 [&:-webkit-autofill]:transition-[background-color] [&:-webkit-autofill]:duration-[50000s] [&:-webkit-autofill]:ease-in-out [&:-webkit-autofill]:[-webkit-text-fill-color:inherit]"
                placeholder="password"
                required
              />
              <label 
                htmlFor="password" 
                className={`absolute left-0 uppercase tracking-[0.2em] transition-all cursor-text pointer-events-none
                  ${password ? 'top-0 text-[10px] font-black text-emerald-600' : 'top-7 text-xs text-slate-400 dark:text-slate-500 font-bold'}
                  peer-focus:top-0 peer-focus:text-[10px] peer-focus:font-black peer-focus:text-emerald-600
                  peer-autofill:top-0 peer-autofill:text-[10px] peer-autofill:font-black peer-autofill:text-emerald-600
                  peer-[:-webkit-autofill]:top-0 peer-[:-webkit-autofill]:text-[10px] peer-[:-webkit-autofill]:font-black peer-[:-webkit-autofill]:text-emerald-600
                `}
              >
                Contraseña
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-[0.25em] transition-colors rounded-none mt-6 shadow-none flex items-center justify-between px-6"
            >
              Iniciar Sesión
              <span className="text-lg leading-none font-light">→</span>
            </button>

            <div className="mt-8 pt-8">
              <p className="text-[9px] text-slate-400 dark:text-zinc-600 font-bold uppercase tracking-[0.2em]">
                &copy; {new Date().getFullYear()} Softcoinp
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}