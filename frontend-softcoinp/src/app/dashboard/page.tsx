"use client";

import { useState, useEffect } from "react";
import api from "@/services/api"; 
import { useRouter } from "next/navigation";
import CameraCapture from "@/components/CameraCapture"; 

// 🚨 CONFIGURACIÓN CRÍTICA: La URL base de tu API de C#.
const BACKEND_BASE_URL = "http://localhost:5004/static"; 

// Definición de tipos para el modal
interface ModalState {
  isOpen: boolean;
  message: string;
  type: "success" | "warning" | "error" | "info";
}

// 📸 FUNCIÓN REFORZADA: Convierte una URL de imagen a Base64 usando XMLHttpRequest
// Este método es más fiable para sortear posibles problemas de CORS/Blobs.
const urlToBase64 = async (url: string): Promise<string> => {
    // Construye la URL completa
    const fullUrl = url.startsWith('/') ? `${BACKEND_BASE_URL}${url}` : url;
    
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        
        xhr.onload = function() {
            // Verifica que la respuesta sea exitosa (código 200)
            if (xhr.status === 200 && xhr.response) {
                const reader = new FileReader();
                reader.onloadend = function() {
                    resolve(reader.result as string);
                }
                // Lee el Blob y lo convierte a Base64
                reader.readAsDataURL(xhr.response); 
            } else {
                console.error(`❌ Fallo en XHR. Status: ${xhr.status}. URL: ${fullUrl}`);
                resolve(""); 
            }
        };
        
        xhr.onerror = function() {
             // Si falla (ej: por error de red o CORS), devuelve cadena vacía
             console.error("❌ XHR Error de red al descargar la foto. Posible problema de CORS o ruta.");
             resolve(""); 
        };
        
        // Configura el CORS y el tipo de respuesta (Blob)
        xhr.open('GET', fullUrl);
        // Deshabilita la autenticación con credenciales para evitar problemas innecesarios con StaticFiles
        xhr.withCredentials = false; 
        xhr.responseType = 'blob'; 
        xhr.send();
    });
};


export default function DashboardPage() {
  const [identificacion, setIdentificacion] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [tipo, setTipo] = useState("visitante");
  const [cargo, setCargo] = useState("");
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [fechaHora, setFechaHora] = useState(new Date()); 
  
  // 📸 ESTADOS para la cámara y la foto
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null); // Se usa para almacenar la URL del backend temporalmente

  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    message: "",
    type: "info",
  });

  const router = useRouter();

  // --- LÓGICA DEL COMPONENTE ---

  useEffect(() => {
    const timer = setInterval(() => setFechaHora(new Date()), 1000); 
    return () => clearInterval(timer);
  }, []);

  const showModal = (message: string, type: ModalState["type"]) => {
    setModal({ isOpen: true, message, type });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  // Función para manejar la foto tomada
  const handlePhotoTaken = (imageDataUrl: string) => {
    // Si se toma una nueva foto, reemplazamos el Base64 y limpiamos la URL guardada
    setFotoBase64(imageDataUrl);
    setFotoUrl(null); 
    setIsCameraOpen(false);
    showModal("Foto capturada con éxito.", "success");
  };

  const handleRegistrar = async (accion: "entrada" | "salida") => {
    
    const requiredFields = [
      { value: identificacion, name: "Identificación" },
      { value: nombres, name: "Nombres" },
      { value: apellidos, name: "Apellidos" },
      { value: destino, name: "Destino" },
      { value: motivo, name: "Motivo de ingreso" },
    ];

    const missingField = requiredFields.find(field => !field.value.trim());

    if (missingField) {
      showModal(
        `🛑 Debe diligenciar el campo obligatorio: "${missingField.name}"`, 
        "error"
      );
      return; 
    }
    
    // 📸 Validar que se haya tomado la foto para la ENTRADA
    if (accion === "entrada" && !fotoBase64) {
      showModal(
        "🛑 Debe tomar una fotografía de la persona a registrar.",
        "error"
      );
      return;
    }

    try {
      if (accion === "entrada") {
        await api.post("/registros", {
          nombre: nombres,
          apellido: apellidos,
          documento: identificacion,
          destino,
          motivo,
          tipo,
          // Incluir la foto en Base64
          foto: fotoBase64, 
        });

        showModal("✅ Entrada registrada con éxito", "success");
      } else if (accion === "salida") {
        showModal("🚪 Funcionalidad de salida aún no implementada", "info");
      }

      // Limpiar estados después de un registro exitoso
      setIdentificacion("");
      setNombres("");
      setApellidos("");
      setCargo("");
      setDestino("");
      setMotivo("");
      setTipo("visitante");
      setFotoBase64(null); // 📸 Limpiar la foto Base64
      setFotoUrl(null); // 📸 Limpiar la URL
      
    } catch (err: any) {
      console.error("❌ Error al registrar:", err.response?.data || err);
      const errorMessage =
        err.response?.data?.title ||
        "Error al registrar. Verifica los datos e intenta nuevamente.";
      showModal(errorMessage, "error");
    }
  };

  // 🔄 FUNCIÓN handleBuscar ACTUALIZADA
  const handleBuscar = async () => {
    if (!identificacion.trim()) return;

    // 1. Limpiamos estados antes de la búsqueda
    setNombres("");
    setApellidos("");
    setDestino("");
    setMotivo(""); 
    setTipo("visitante");
    setFotoBase64(null); 
    setFotoUrl(null); 

    try {
      // Asumimos que la respuesta de tu backend incluye 'fotoUrl'
      const res = (await api.get(`/registros/buscar`, {
        params: { documento: identificacion },
      })) as { data: { data?: any } };

      const persona = res.data?.data;

      if (persona) {
        if (persona.tieneEntradaActiva) {
          showModal(
            "⚠️ Esta persona ya tiene una entrada activa. Debe registrar la salida antes de volver a ingresar.",
            "warning"
          );
          return;
        }
        
        // 2. Cargamos datos personales
        setNombres(persona.nombre || "");
        setApellidos(persona.apellido || "");
        setDestino(persona.destino || "");
        setMotivo(persona.motivo || "");
        setTipo(persona.tipo || "visitante");

        // 3. 📸 Lógica de Carga de Foto
        if (persona.fotoUrl) { 
            setFotoUrl(persona.fotoUrl); 
            
            // Intentar convertir la URL a Base64 para mostrarla en el visor
            const base64Image = await urlToBase64(persona.fotoUrl);
            
            if (base64Image) {
                setFotoBase64(base64Image); 
                // showModal("Información de persona encontrada y foto anterior cargada.", "info");
            } else {
                // Si la conversión falla, notificamos (aquí es donde ves el error actual)
                showModal("Persona encontrada. No se pudo cargar la foto anterior. Tome una nueva.", "warning");
            }
        } else {
            showModal("Persona encontrada. Tome una foto para el registro.", "info");
        }
        
      } else {
        showModal("⚠️ No se encontró persona con ese documento. Diligencie los datos.", "warning");
      }
    } catch (err) {
      console.error(err);
      showModal(
        "⚠️ Error en la búsqueda. Diligencie los datos.",
        "warning"
      );
    }
  };

  // Componente Modal (sin cambios)
  const Modal = ({ isOpen, message, type, onClose }: any) => {
    if (!isOpen) return null;
    let bgColor = "bg-blue-600";
    let title = "Información";
    let icon = "ℹ️";
    let textColor = "text-blue-800"; 
    switch (type) {
      case "success": bgColor = "bg-green-600"; title = "Éxito"; icon = "✅"; textColor = "text-green-800"; break;
      case "warning": bgColor = "bg-yellow-500"; title = "Advertencia"; icon = "⚠️"; textColor = "text-yellow-800"; break;
      case "error": bgColor = "bg-red-600"; title = "Error"; icon = "❌"; textColor = "text-red-800"; break;
      case "info": default: bgColor = "bg-blue-600"; title = "Información"; icon = "ℹ️"; textColor = "text-blue-800"; break;
    }
    return (
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 p-4 transition-opacity duration-300"> 
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100 transition-transform duration-300 border-t-8 border-gray-300">
          <div className={`${bgColor} text-white p-4 flex items-center justify-between`}>
            <h3 className="text-xl font-bold">{icon} {title}</h3>
            <button onClick={onClose} className="text-white hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="p-6">
            <p className={`${textColor} text-lg mb-6 font-medium`}>{message}</p>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className={`text-white py-2 px-6 rounded-lg font-semibold transition duration-200 shadow-md transform hover:scale-[1.02] ${bgColor} hover:brightness-110`}
              >Aceptar</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 📸 Componente de Captura de Cámara: se muestra condicionalmente */}
      {isCameraOpen && (
        <CameraCapture 
          onPhotoTaken={handlePhotoTaken} 
          onClose={() => setIsCameraOpen(false)} 
        />
      )}

      <Modal
        isOpen={modal.isOpen}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />

      <div className="h-screen w-screen bg-gray-100 flex flex-col items-center justify-center py-2 px-6">
        
        <div className="bg-white rounded-3xl shadow-2xl py-5 px-6 w-full border border-gray-200 flex flex-col"> 
          
          <h1 className="text-2xl font-extrabold text-center mb-4 text-blue-700 uppercase tracking-wide">
            Control de Acceso | SOFTCOINP
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-grow">
            
            {/* 1. Formulario de Datos */}
            <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold mb-3 text-gray-600 border-b pb-1">
                    Datos de la Persona
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  <div className="md:col-span-2 flex items-center relative">
                    <input
                      type="text"
                      placeholder="Número de Identificación"
                      value={identificacion}
                      onChange={(e) => {
                          const newValue = e.target.value.replace(/[^0-9]/g, '');
                          setIdentificacion(newValue);
                      }}
                      onBlur={handleBuscar} 
                      inputMode="numeric" 
                      pattern="[0-9]*" 
                      className="w-full p-2 pl-9 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                    />
                    <svg className="absolute left-2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 2 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                  </div>

                  <input
                    type="text"
                    placeholder="Nombres"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Apellidos"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Cargo u Oficio (Opcional)"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Destino"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                  />

                  <div className="relative">
                    <select
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value)}
                      className="appearance-none w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm bg-white text-sm"
                    >
                      <option value="visitante">Visitante</option>
                      <option value="empleado">Empleado</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.95 4.95z"/></svg>
                    </div>
                  </div>

                  <textarea
                    placeholder="Motivo de ingreso"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm md:col-span-2 text-sm"
                    rows={2}
                  />

                </div>
            </div>

            {/* 2. Sección de Registro y Tiempo */}
            <div className="lg:col-span-1 flex flex-col items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                
                <div 
                    className="flex flex-col items-center mb-3 w-full cursor-pointer group"
                    onClick={() => setIsCameraOpen(true)} // 👈 ABRIR CÁMARA AL HACER CLIC
                >
                    <div className={`
                        w-36 h-36 border-4 rounded-full bg-blue-100 flex items-center justify-center mb-2 text-xl font-extrabold shadow-inner overflow-hidden
                        ${fotoBase64 ? 'border-green-500' : 'border-blue-400 group-hover:border-blue-600'}
                    `}>
                        {fotoBase64 ? (
                            // Muestra la foto (puede ser nueva o cargada desde la BD)
                            <img src={fotoBase64} alt="Foto de la persona a registrar" className="w-full h-full object-cover" />
                        ) : (
                            // Muestra el icono si no hay foto
                            <svg className="w-16 h-16 text-blue-500 group-hover:text-blue-700 transition duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.218A2 2 0 0110.125 4h3.75a2 2 0 011.664.89l.812 1.218A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        )}
                    </div>
                    <p className="text-xs font-medium text-gray-500 group-hover:text-blue-600 transition duration-200">
                        {fotoBase64 ? '✅ Foto Lista (Clic para cambiar)' : '📸 Clic para tomar foto'}
                    </p>
                </div>

                <div className="flex flex-col gap-2 w-full mb-3">
                    <button
                        onClick={() => handleRegistrar("entrada")}
                        className="bg-green-600 text-white w-full py-3 text-lg font-bold rounded-xl shadow-md hover:bg-green-700 transition duration-200"
                    >
                        ✅ Entrada
                    </button>
                    <button
                        onClick={() => handleRegistrar("salida")}
                        className="bg-red-500 text-white w-full py-3 text-lg font-bold rounded-xl shadow-md hover:bg-red-600 transition duration-200"
                    >
                        🚪 Salida
                    </button>
                </div>

                <div className="text-center w-full bg-gray-800 p-3 rounded-lg shadow-inner">
                    <p className="text-base font-medium text-gray-300">
                        {fechaHora.toLocaleDateString("es-CO", { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-4xl font-mono font-extrabold text-green-400 mt-1 tracking-wider">
                        {fechaHora.toLocaleTimeString("es-CO")}
                    </p>
                </div>

            </div>
          </div>

          <hr className="my-4 border-gray-200" />

          {/* Botones de Navegación Inferiores (sin cambios) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => router.push("/reportes")}
              className="bg-orange-500 text-white py-2 rounded-lg font-semibold shadow-md hover:bg-orange-600 text-xs"
            >
              📊 Reporte
            </button>
            <button
              onClick={() => router.push("/usuarios")}
              className="bg-purple-600 text-white py-2 rounded-lg font-semibold shadow-md hover:bg-purple-700 text-xs"
            >
              👥 Personal
            </button>
            <button
              onClick={() => router.push("/registros")}
              className="bg-yellow-500 text-gray-900 py-2 rounded-lg font-semibold shadow-md hover:bg-yellow-600 text-xs"
            >
              📜 Historial
            </button>
            <button
              onClick={() => router.push("/admin")}
              className="bg-blue-800 text-white py-2 rounded-lg font-semibold shadow-md hover:bg-blue-900 text-xs"
            >
              🔑 Administrador
            </button>
          </div>
        </div>
        
        <p className="mt-2 text-gray-500 text-xs">SOFTCOINP - Sistema de Control de Acceso</p>
      </div>
    </>
  );
}