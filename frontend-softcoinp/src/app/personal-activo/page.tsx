"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";

const BACKEND_BASE_URL = "http://localhost:5004/static";


// Definición de tipo de registro
interface RegistroDto {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  motivo: string;
  destino: string;
  tipo: string;
  horaIngresoUtc: string;
  horaIngresoLocal: string;
  fotoUrl?: string | null;
}

export default function PersonalActivoPage() {
  const [registrosActivos, setRegistrosActivos] = useState<RegistroDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // 🟢 Cargar registros activos
  const fetchActivos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/registros/activos");
      setRegistrosActivos(res.data?.data || []);
    } catch (err) {
      console.error("Error al cargar registros activos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivos();
  }, []);

  // 🚪 Registrar salida
  const handleSalida = async (id: string) => {
    try {
      await api.put(`/registros/${id}/salida`);
      setRegistrosActivos(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Error al registrar salida:", err);
    }
  };

  return (
    
    <div className="h-screen w-screen bg-gray-100 p-6 flex flex-col">

      {/* Botón para volver al Dashboard */}
      <div className="mt-6 flex justify-left">
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-blue-600 text-white py-2 px-4 rounded-xl shadow-md hover:bg-blue-700 transition duration-200 flex items-center text-sm"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Menú Principal
        </button>
      </div>
      <h1 className="text-2xl font-extrabold text-blue-700 uppercase tracking-wide mb-6 text-center">
        Personal con Entrada Activa
      </h1>

      {loading ? (
        <p className="text-center text-gray-500">Cargando registros activos...</p>
      ) : registrosActivos.length === 0 ? (
        <p className="text-center text-gray-500">No hay personal con entrada activa.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-xl shadow-md border border-gray-200">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Foto</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Nombre</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Documento</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Destino</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Motivo</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Ingreso</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Acción</th>
              </tr>
            </thead>
            <tbody>
              {registrosActivos.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {r.fotoUrl ? (
                      <img
                        src={r.fotoUrl ? `${BACKEND_BASE_URL}/${r.fotoUrl}` : ""}
                        alt={`${r.nombre} ${r.apellido}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-500">
                        👤
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">{r.nombre} {r.apellido}</td>
                  <td className="px-4 py-2">{r.documento}</td>
                  <td className="px-4 py-2">{r.destino}</td>
                  <td className="px-4 py-2">{r.motivo}</td>
                  <td className="px-4 py-2">{new Date(r.horaIngresoLocal).toLocaleString("es-CO")}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleSalida(r.id)}
                      className="bg-red-500 text-white py-1 px-3 rounded-lg shadow hover:bg-red-600 transition duration-200"
                    >
                      🚪 Salida
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Botón para volver al Dashboard */}
      {/* <div className="mt-6 flex justify-center">
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-blue-700 text-white py-2 px-6 rounded-xl shadow-md hover:bg-blue-800 transition duration-200"
        >
          ⬅️ Menú Principal
        </button>
      </div> */}
    </div>
  );
}
