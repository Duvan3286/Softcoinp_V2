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

  // Removida la redirección redundante; SessionGuard se encarga de esto.


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
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden transition-colors duration-300">
      
      <div className="w-full max-w-md px-6 relative z-10">
        <form
          onSubmit={handleLogin}
          className="bg-card border border-border rounded-xl p-8 lg:p-10 shadow-sm dark:shadow-none backdrop-blur-sm relative overflow-hidden group transition-all duration-300"
        >
          <div className="text-center mb-8">
            {/* Logo Estilo Header */}
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-emerald-600 shadow-lg dark:shadow-none transition-transform duration-500">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
            
            <h1 className="text-2xl font-black text-foreground tracking-tight uppercase leading-none mb-2">
              Softcoinp <span className="text-emerald-600 dark:text-emerald-400">{systemVersion || "..."}</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
              Control de Acceso e Identidad
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl mb-6 text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2" role="alert">
              <span className="text-lg">🛑</span>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <span className="absolute left-4 top-1 text-[9px] text-emerald-500 dark:text-emerald-400 font-black uppercase tracking-widest z-10 transition-colors group-focus-within:text-emerald-600">
                Correo Electrónico
              </span>
              <div className="relative">
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-standard !pt-7 !pb-3 !px-4 !text-sm"
                  required
                />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-zinc-600 group-focus-within:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-1 10a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2h12a2 2 0 012 2v4z"></path>
                </svg>
              </div>
            </div>
            
            <div className="relative group">
              <span className="absolute left-4 top-1 text-[9px] text-emerald-500 dark:text-emerald-400 font-black uppercase tracking-widest z-10 transition-colors group-focus-within:text-emerald-600">
                Contraseña
              </span>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-standard !pt-7 !pb-3 !px-4 !text-sm"
                  required
                />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-zinc-600 group-focus-within:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 9V7a3 3 0 00-6 0v2"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            className="btn-primary w-full !py-4 !text-xs !mt-8 shadow-none"
          >
            Iniciar Sesión
            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </button>

          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-400 dark:text-zinc-600 font-bold uppercase tracking-widest">
              &copy; {new Date().getFullYear()} Softcoinp Technologies
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}