"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [identificacion, setIdentificacion] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [tipo, setTipo] = useState("visitante");
  const [cargo, setCargo] = useState("");
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [fechaHora, setFechaHora] = useState(new Date());

  const router = useRouter();

  // Actualizar hora en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setFechaHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRegistrar = async (accion: "entrada" | "salida") => {
    try {
      if (accion === "entrada") {
        await api.post("/registros", {
          nombre: nombres,         
          apellido: apellidos,      
          documento: identificacion,
          destino,
          motivo,
          tipo,
        });

        alert("✅ Entrada registrada con éxito");
      } else if (accion === "salida") {
        // Aquí puedes implementar el endpoint PUT /registros/{id}/salida
        alert("🚪 Funcionalidad de salida aún no implementada");
      }

      // Limpiar formulario
      setIdentificacion("");
      setNombres("");
      setApellidos("");
      setCargo("");
      setDestino("");
      setMotivo("");
      setTipo("visitante");
    } catch (err: any) {
      console.error("❌ Error al registrar:", err.response?.data || err);
      alert(
        err.response?.data?.title ||
          "Error al registrar. Verifica los datos e intenta nuevamente."
      );
    }
  };


  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[1000px]">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-800">
          SOFTWARE DE CONTROL DE INGRESO SOFTCOINP - v1.0
        </h1>

        {/* Sección principal */}
        <div className="grid grid-cols-2 gap-6">
          {/* Formulario izquierda */}
          <div>
           <input
              type="text"
              placeholder="Identificación"
              value={identificacion}
              onChange={(e) => setIdentificacion(e.target.value)}
              onBlur={async () => {
                if (!identificacion.trim()) return;

                try {
                  // 👇 Forzamos el tipo de respuesta manualmente
                  const res = (await api.get(`/registros/buscar`, {
                    params: { documento: identificacion },
                  })) as { data: { data?: any } };

                  const persona = res.data?.data;

                  if (persona) {
                    // 🔹 Si tiene entrada activa, se bloquea el registro
                    if (persona.tieneEntradaActiva) {
                      alert(
                        "⚠️ Esta persona ya tiene una entrada activa. Debe registrar la salida antes de volver a ingresar."
                      );
                      setIdentificacion("");
                      setNombres("");
                      setApellidos("");
                      setDestino("");
                      setMotivo("");
                      setTipo("visitante");
                      return;
                    }

                    // 🔹 Autocompletar campos
                    setNombres(persona.nombre || "");
                    setApellidos(persona.apellido || "");
                    setDestino(persona.destino || "");
                    setMotivo(persona.motivo || "");
                    setTipo(persona.tipo || "visitante");

                    alert("✅ Persona encontrada en el sistema");
                  } else {
                    alert("⚠️ No se encontró persona con ese documento");
                    setNombres("");
                    setApellidos("");
                    setDestino("");
                    setMotivo("");
                    setTipo("visitante");
                  }
                } catch (err) {
                  console.error(err);
                  alert(
                    "⚠️ No se encontró persona con ese documento, diligencie los datos."
                  );
                  setNombres("");
                  setApellidos("");
                  setDestino("");
                  setMotivo("");
                  setTipo("visitante");
                }
              }}
              className="w-full p-2 border rounded mb-2"
            />



            <input
              type="text"
              placeholder="Nombres"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="text"
              placeholder="Apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="text"
              placeholder="Cargo u oficio"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="text"
              placeholder="Destino"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />

            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            >
              <option value="visitante">Visitante</option>
              <option value="empleado">Empleado</option>
            </select>

            <textarea
              placeholder="Motivo de ingreso"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full p-2 border rounded mb-2"
              rows={3}
            />
          </div>

          {/* Derecha */}
          <div className="flex flex-col items-center justify-between">
            {/* Foto */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-40 h-40 border rounded-full bg-gray-200 flex items-center justify-center mb-2 text-gray-600 text-lg font-bold">
                Foto
              </div>
              {/* <img src="/logo.png" alt="Logo" className="w-32" /> */}
            </div>

            {/* Botones Entrada / Salida */}
            <div className="flex gap-6 mb-6">
              <button
                onClick={() => handleRegistrar("entrada")}
                className="bg-green-600 text-white py-3 px-8 text-lg rounded hover:bg-green-700"
              >
                Entrada
              </button>
              <button
                onClick={() => handleRegistrar("salida")}
                className="bg-red-600 text-white py-3 px-8 text-lg rounded hover:bg-red-700"
              >
                Salida
              </button>
            </div>

            {/* Fecha y hora grande */}
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-800">
                {fechaHora.toLocaleDateString("es-CO")}
              </p>
              <p className="text-5xl font-extrabold text-blue-700 mt-2">
                {fechaHora.toLocaleTimeString("es-CO")}
              </p>
            </div>
          </div>
        </div>

        {/* Botones inferiores */}
        <div className="grid grid-cols-4 gap-4 mt-8">
          <button
            onClick={() => router.push("/reportes")}
            className="bg-orange-500 text-white py-3 rounded hover:bg-orange-600"
          >
            Reporte de novedad
          </button>
          <button
            onClick={() => router.push("/usuarios")}
            className="bg-purple-500 text-white py-3 rounded hover:bg-purple-600"
          >
            Modificar / crear personal
          </button>
          <button
            onClick={() => router.push("/registros")}
            className="bg-yellow-500 text-white py-3 rounded hover:bg-yellow-600"
          >
            Historial de registros
          </button>
          <button
            onClick={() => router.push("/admin")}
            className="bg-blue-600 text-white py-3 rounded hover:bg-blue-700"
          >
            Ingreso administrador
          </button>
        </div>
      </div>
    </div>
  );
}
