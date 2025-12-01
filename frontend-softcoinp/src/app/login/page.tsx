"use client";

import { useState } from "react";
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
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 👇 aquí le decimos a axios que la respuesta es del tipo LoginResponse
      const res = await api.post<LoginResponse>("/Auth/login", { email, password });
      
      localStorage.setItem("token", res.data.data.token);
      router.push("/registros");
    } catch (err: any) {
      console.error(err.response); // debug en consola
      setError(err.response?.data?.message || "Error al iniciar sesión");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white shadow-md rounded-lg p-6 w-96"
      >
        <h1 className="text-xl font-bold mb-4">Iniciar Sesión</h1>
        {error && <p className="text-red-500 mb-2">{error}</p>}

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
