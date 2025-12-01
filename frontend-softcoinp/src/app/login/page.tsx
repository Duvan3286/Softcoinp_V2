"use client";

import { useState } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";

// Definimos el tipo esperado en la respuesta de login (SIN CAMBIOS EN LÓGICA)
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
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 👇 aquí le decimos a axios que la respuesta es del tipo LoginResponse
      const res = await api.post<LoginResponse>("/Auth/login", { email, password });
      
      localStorage.setItem("token", res.data.data.token);
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err.response); // debug en consola
      setError(err.response?.data?.message || "Error al iniciar sesión. Verifique credenciales.");
    }
  };

  return (
    // Contenedor principal: Altura completa (h-screen) con fondo claro.
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        // Tarjeta de Login: Bordes redondeados y sombra más profunda (similar al Dashboard).
        className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-sm border border-gray-200"
      >
        <div className="text-center mb-6">
            {/* Título y Logo/Icono */}
            <div className="w-16 h-16 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
            </div>
            <h1 className="text-2xl font-extrabold text-blue-700 tracking-wide">
                SOFTCOINP
            </h1>
            <p className="text-sm text-gray-500">Ingresa tus credenciales</p>
        </div>

        {/* Mensaje de Error (Estilo de alerta) */}
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm font-medium" role="alert">
                {error}
            </div>
        )}

        {/* Input de Correo */}
        <div className="mb-4 relative">
            <input
                type="email"
                placeholder="Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                // Estilo de input mejorado (p-3, focus ring, sombra suave)
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150"
                required
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-1 10a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2h12a2 2 0 012 2v4z"></path></svg>
        </div>
        
        {/* Input de Contraseña */}
        <div className="mb-6 relative">
            <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // Estilo de input mejorado
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-150"
                required
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9V7a3 3 0 00-6 0v2"></path></svg>
        </div>
        
        {/* Botón de Login */}
        <button
          type="submit"
          // Botón principal: Grande, azul profundo, sombra y efecto hover.
          className="w-full bg-blue-700 text-white py-3 rounded-lg font-bold text-lg shadow-md hover:bg-blue-800 transition duration-200 transform hover:scale-[1.01]"
        >
          Ingresar
        </button>
        
        {/* Footer opcional / enlace de olvido */}
        <div className="text-center mt-4">
            <a href="#" className="text-sm text-blue-500 hover:text-blue-700 transition duration-150">
                ¿Olvidaste tu contraseña?
            </a>
        </div>
      </form>
    </div>
  );
}