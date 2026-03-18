"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import CameraCapture from "@/components/CameraCapture";
import { tipoService, TipoPersonal } from "@/services/tipoService";
import { anotacionService, AnotacionDto } from "@/services/anotacionService";
import CustomModal, { ModalType } from "@/components/CustomModal";
import { getCurrentUser, UserPayload } from "@/utils/auth";


// CONFIGURACIÓN CRÍTICA: La URL base de tu API de C#.
const BACKEND_BASE_URL = "http://localhost:5004/static";

// Definición de tipos para el modal
interface ModalState {
  isOpen: boolean;
  message: string;
  type: "success" | "warning" | "error" | "info";
}

// Estado de registro activo
interface RegistroActivo {
  id: string;
}

// 📸 FUNCIÓN REFORZADA: Convierte una URL de imagen a Base64 usando XMLHttpRequest
const urlToBase64 = async (url: string): Promise<string> => {
  const fullUrl = url.startsWith('/') ? `${BACKEND_BASE_URL}${url}` : url;

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = function () {
      if (xhr.status === 200 && xhr.response) {
        const reader = new FileReader();
        reader.onloadend = function () {
          resolve(reader.result as string);
        }
        reader.readAsDataURL(xhr.response);
      } else {
        console.error(`❌ Fallo en XHR. Status: ${xhr.status}. URL: ${fullUrl}`);
        resolve("");
      }
    };

    xhr.onerror = function () {
      console.error("❌ XHR Error de red al descargar la foto. Posible problema de CORS o ruta.");
      resolve("");
    };

    xhr.open('GET', fullUrl);
    xhr.withCredentials = false;
    xhr.responseType = 'blob';
    xhr.send();
  });
};

export default function DashboardPage() {
  const [identificacion, setIdentificacion] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipo, setTipo] = useState("visitante");
  const [cargo, setCargo] = useState("");
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [fechaHora, setFechaHora] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  
  // 🏷️ ESTADOS para los tipos de personal dinámicos
  const [tipos, setTipos] = useState<TipoPersonal[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(true);

  // 📸 ESTADOS para la cámara y la foto
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ModalType;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });
  const [registroActivo, setRegistroActivo] = useState<RegistroActivo | null>(null);

  // 🔔 Alerta de Novedades
  const [anotacionesAlerta, setAnotacionesAlerta] = useState<AnotacionDto[]>([]);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  // 🚫 Estado de Bloqueo
  const [isBloqueado, setIsBloqueado] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState("");

  // 🚗 ESTADOS para el Vehículo
  const [placa, setPlaca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [color, setColor] = useState("");
  const [tipoVehiculo, setTipoVehiculo] = useState("");
  const [fotoVehiculoBase64, setFotoVehiculoBase64] = useState<string | null>(null);
  const [isVehiculoCameraOpen, setIsVehiculoCameraOpen] = useState(false);

  // 📸 Snapshot de datos originales (para detectar cambios en actualización)
  const [datosOriginales, setDatosOriginales] = useState<Record<string, string | null>>({}); 

  const [usuario, setUsuario] = useState<UserPayload | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const data = await tipoService.getTipos();
        const activos = data.filter(t => t.activo);
        setTipos(activos);
        if (activos.length > 0) {
          setTipo(activos[0].nombre.toLowerCase());
        }
      } catch (err) {
        console.error("Error al cargar tipos de personal:", err);
      } finally {
        setLoadingTipos(false);
      }
    };
    fetchTipos();
  }, []);

  useEffect(() => {
    setMounted(true);
    setUsuario(getCurrentUser());
    const timer = setInterval(() => setFechaHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showModal = (message: string, type: ModalType, title?: string) => {
    const defaultTitle = type === "success" ? "Éxito" : type === "error" ? "Error" : type === "warning" ? "Advertencia" : "Información";
    setModal({ isOpen: true, message, type, title: title || defaultTitle });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const handlePhotoTaken = (imageDataUrl: string) => {
    setFotoBase64(imageDataUrl);
    setFotoUrl(null);
    setIsCameraOpen(false);
    showModal("Foto capturada con éxito.", "success");
  };

  const handleRegistrar = async (accion: "entrada" | "salida") => {
    try {
      if (accion === "entrada") {
        // Verificar campos obligatorios
        const requiredFields = [
          { value: identificacion, name: "Identificación" },
          { value: nombres, name: "Nombres" },
          { value: apellidos, name: "Apellidos" },
          { value: destino, name: "Destino" },
          { value: motivo, name: "Motivo de ingreso" },
        ];
        const missingField = requiredFields.find(field => !field.value.trim());
        if (missingField) {
          showModal(`🛑 Debe diligenciar el campo obligatorio: "${missingField.name}"`, "error");
          return;
        }
        if (!fotoBase64) {
          showModal("🛑 Debe tomar una fotografía de la persona a registrar.", "error");
          return;
        }

        // 🔍 Verificar si ya hay una entrada activa
        try {
          const res = await api.get(`/registros/activo`, { params: { documento: identificacion } }) as any;
          if (res.data?.data) {
            showModal(
              "⚠️ Esta persona ya tiene una entrada activa. No se puede registrar otra entrada.",
              "warning"
            );
            return; // ❌ Detener registro
          }
        } catch (err: any) {
          // Si el backend devuelve 404, significa que no hay registro activo
          if (err.response?.status !== 404) {
            console.error("Error al verificar registro activo:", err);
            showModal("Error al verificar entrada activa. Intente nuevamente.", "error");
            return;
          }
        }

        // Si no hay entrada activa, continuar con el POST
        await api.post("/registros", {
          nombre: nombres,
          apellido: apellidos,
          documento: identificacion,
          telefono: telefono,
          destino,
          motivo,
          tipo,
          foto: fotoBase64,
          placa,
          marca,
          modelo,
          color,
          tipoVehiculo,
          fotoVehiculo: fotoVehiculoBase64,
        });
        showModal("✅ Entrada registrada con éxito", "success");
        // 🔄 Marcar como adentro para actualizar los botones inmediatamente
        setRegistroActivo({ id: "activo" });

      } else if (accion === "salida") {
        if (!identificacion.trim() || !nombres.trim() || !apellidos.trim()) {
          showModal("🛑 Debe diligenciar Nombre, Apellido y Documento para registrar la salida.", "error");
          return;
        }

        // 🔍 Buscar registro activo en el backend
        let activeRegistroId: string | null = null;
        try {
          const res = await api.get(`/registros/activo`, { params: { documento: identificacion } }) as any;
          if (res.data?.data) {
            activeRegistroId = res.data.data.id;
          }
        } catch {
          activeRegistroId = null;
        }

        if (!activeRegistroId) {
          showModal("🛑 Esta persona no tiene una entrada activa.", "error");
          return;
        }

        // Registrar salida
        await api.put(`/registros/${activeRegistroId}/salida`);
        showModal("🚪 Salida registrada con éxito", "success");
        setRegistroActivo(null);
      }
    } catch (err: any) {
      console.error("Error al registrar:", err);
      const msg = err.response?.data?.message || "Error en el servidor al procesar el registro.";
      showModal(`🛑 ${msg}`, "error");
    } finally {
      // Limpiar campos después de registrar
      setIdentificacion("");
      setNombres("");
      setApellidos("");
      setCargo("");
      setDestino("");
      setMotivo("");
      setPlaca("");
      setMarca("");
      setModelo("");
      setColor("");
      setTipoVehiculo("");
      setFotoBase64(null);
      setFotoUrl(null);
      setFotoVehiculoBase64(null);
      setTelefono("");
    }
  };

  const handleActualizarDatos = async () => {
    if (!identificacion.trim()) {
      showModal("🛑 El documento es obligatorio para actualizar datos.", "error");
      return;
    }

    try {
      setLoadingTipos(true);
      await api.post("/registros/actualizar-datos", {
        nombre: nombres,
        apellido: apellidos,
        documento: identificacion,
        telefono: telefono,
        tipo,
        foto: fotoBase64,
        placa,
        marca,
        modelo,
        color,
        tipoVehiculo,
        fotoVehiculo: fotoVehiculoBase64,
      });

      const camposActualizados: string[] = [];
      if (nombres.trim() && nombres !== datosOriginales.nombre)
        camposActualizados.push(`👤 Nombre: ${nombres} ${apellidos}`);
      if (telefono.trim() && telefono !== datosOriginales.telefono)
        camposActualizados.push(`📞 Teléfono: ${telefono}`);
      if (tipo.trim() && tipo !== datosOriginales.tipo)
        camposActualizados.push(`🪪 Tipo: ${tipo}`);
      if (fotoBase64 && fotoBase64 !== datosOriginales.fotoUrl)
        camposActualizados.push(`📸 Foto de persona actualizada`);
      if (placa.trim()) {
        if (marca.trim() && marca !== datosOriginales.marca)
          camposActualizados.push(`   • Marca: ${marca}`);
        if (modelo.trim() && modelo !== datosOriginales.modelo)
          camposActualizados.push(`   • Modelo: ${modelo}`);
        if (color.trim() && color !== datosOriginales.color)
          camposActualizados.push(`   • Color: ${color}`);
        if (tipoVehiculo.trim() && tipoVehiculo !== datosOriginales.tipoVehiculo)
          camposActualizados.push(`   • Tipo vehículo: ${tipoVehiculo}`);
        if (fotoVehiculoBase64 && fotoVehiculoBase64 !== datosOriginales.fotoUrl)
          camposActualizados.push(`   📸 Foto del vehículo actualizada`);
      }

      const resumen = camposActualizados.length > 0
        ? `✅ Campos actualizados:\n${camposActualizados.join("\n")}`
        : "✅ Datos guardados. No se detectaron cambios.";

      showModal(resumen, "success");
      // Refrescar datos desde el servidor para asegurar sincronía
      handleBuscar();
    } catch (err: any) {
      console.error("Error al actualizar datos:", err);
      const msg = err.response?.data?.message || "Error al intentar actualizar la información.";
      showModal(`🛑 ${msg}`, "error");
    } finally {
      setLoadingTipos(false);
    }
  };

  const handleBuscar = async () => {
    if (!identificacion.trim()) return;

    // 📏 Validación de longitud (mínimo 7, máximo 10)
    if (identificacion.length < 7 || identificacion.length > 10) {
        showModal("El número de documento debe tener entre 7 y 10 dígitos.", "warning", "Documento Inválido");
        return;
    }

    setNombres("");
    setApellidos("");
    setTelefono("");
    setDestino("");
    setMotivo("");
    setTipo("visitante");
    setFotoBase64(null);
    setFotoUrl(null);
    setRegistroActivo(null);
    setAnotacionesAlerta([]);
    setIsBloqueado(false);
    setMotivoBloqueo("");

    try {
      const res = (await api.get(`/registros/buscar`, {
        params: { documento: identificacion },
      })) as { data: { data?: any } };

      const persona = res.data?.data;

      if (persona) {
        if (persona.isBloqueado) {
           setIsBloqueado(true);
           setMotivoBloqueo(persona.motivoBloqueo || "Motivo no especificado");
           showModal(`🚫 ACCESO DENEGADO: Esta persona se encuentra BLOQUEADA. Motivo: ${persona.motivoBloqueo}`, "error");
        }

        // ✅ Verificar si tiene entrada activa usando el endpoint dedicado
        try {
          const activoRes = await api.get(`/registros/activo`, { params: { documento: identificacion } }) as any;
          if (activoRes.data?.data) {
            setRegistroActivo({ id: activoRes.data.data.id });
          } else {
            setRegistroActivo(null);
          }
        } catch {
          // 404 significa que no hay entrada activa
          setRegistroActivo(null);
        }

        setNombres(persona.nombre || "");
        setApellidos(persona.apellido || "");
        setTelefono(persona.telefono || "");
        setDestino(persona.destino || "");
        setMotivo(persona.motivo || "");
        setTipo(persona.tipo || "visitante");

        // Autocompletar vehículo si existe
        if (persona.placaVehiculo) {
          setPlaca(persona.placaVehiculo);
          setMarca(persona.marcaVehiculo || "");
          setModelo(persona.modeloVehiculo || "");
          setColor(persona.colorVehiculo || "");
          setTipoVehiculo(persona.tipoVehiculo || "");
        }

        // 📸 Guardar snapshot de los datos originales para detectar cambios
        setDatosOriginales({
          nombre: persona.nombre || "",
          apellido: persona.apellido || "",
          telefono: persona.telefono || "",
          tipo: persona.tipo || "visitante",
          placa: persona.placaVehiculo || "",
          marca: persona.marcaVehiculo || "",
          modelo: persona.modeloVehiculo || "",
          color: persona.colorVehiculo || "",
          tipoVehiculo: persona.tipoVehiculo || "",
          fotoUrl: persona.fotoUrl || null,
        });

        // 🔍 Verificar Novedades de Seguridad
        if (persona.personalId) {
          const alerts = await anotacionService.getAnotacionesPorPersonal(persona.personalId);
          setAnotacionesAlerta(alerts);
        }

        if (persona.fotoUrl) {
          setFotoUrl(persona.fotoUrl);
          const base64Image = await urlToBase64(persona.fotoUrl);
          if (base64Image) setFotoBase64(base64Image);
          else showModal("Persona encontrada. No se pudo cargar la foto anterior. Tome una nueva.", "warning");
        } else {
          showModal("Persona encontrada. Tome una foto para el registro.", "info");
        }
      } else {
        showModal("⚠️ No se encontró persona con ese documento. Diligencie los datos.", "warning");
      }

    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        showModal(
          "⚠️ Documento no encontrado. Diligencie el formulario para registrar una nueva entrada.",
          "warning"
        );
      } else {
        console.error(err);
        showModal(
          err.response?.data?.title || "Error desconocido al buscar el documento.",
          "error"
        );
      }
    }
  };

  const handleBuscarPlaca = async () => {
    if (!placa || placa.trim().length < 3) return;

    try {
      const res = (await api.get(`/vehiculos/placa/${placa}`)) as { data: { data?: any } };
      const vehiculo = res.data?.data;

      if (vehiculo) {
        // Cargar datos del vehículo
        setMarca(vehiculo.marca || "");
        setModelo(vehiculo.modelo || "");
        setColor(vehiculo.color || "");
        setTipoVehiculo(vehiculo.tipoVehiculo || "");
        
        if (vehiculo.fotoUrl) {
           setFotoVehiculoBase64(vehiculo.fotoUrl.startsWith('http') ? vehiculo.fotoUrl : `http://localhost:5004/static${vehiculo.fotoUrl}`);
        }

        // Cargar datos del propietario (si no están ya cargados)
        if (!identificacion) {
            setIdentificacion(vehiculo.propietarioDocumento || "");
            setNombres(vehiculo.propietarioNombre || "");
            setApellidos(vehiculo.propietarioApellido || "");
            setTelefono(vehiculo.propietarioTelefono || "");
            setTipo(vehiculo.propietarioTipo || "visitante");
            
            if (vehiculo.propietarioFotoUrl) {
              setFotoUrl(vehiculo.propietarioFotoUrl);
              const base64Image = await urlToBase64(vehiculo.propietarioFotoUrl);
              if (base64Image) setFotoBase64(base64Image);
            }
            
            // Buscar historial/novedades del propietario
            if (vehiculo.propietarioId) {
               const alerts = await anotacionService.getAnotacionesPorPersonal(vehiculo.propietarioId);
               setAnotacionesAlerta(alerts);
            }
        }
      }
    } catch (err: any) {
       if (err.response?.status === 404) {
         showModal("⚠️ No se encontró registro previo de este vehículo. Por favor, ingrese los datos manualmente.", "warning");
       } else {
         console.error("Error al buscar placa:", err);
       }
    }
  };

  // Componente Modal local eliminado para usar CustomModal

  const TimelineModal = ({ isOpen, onClose, anotaciones, nombre }: any) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="bg-red-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <h3 className="text-lg font-bold uppercase tracking-tight">Antecedentes de Seguridad: {nombre}</h3>
            </div>
            <button onClick={onClose} className="hover:bg-red-700 p-1 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="p-6 max-h-[70vh] overflow-y-auto bg-gray-50 custom-scrollbar">
            <div className="space-y-4 relative before:content-[''] before:absolute before:left-[11px] before:top-0 before:bottom-0 before:w-0.5 before:bg-red-100">
              {anotaciones.map((a: any) => (
                <div key={a.id} className="relative pl-8">
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-4 border-red-500 shadow-sm z-10" />
                  <div className="bg-white rounded-xl p-4 border border-red-100 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {new Date(a.fechaCreacionUtc).toLocaleString("es-CO", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {a.registradoPorEmail && (
                        <span className="text-[9px] text-red-400 font-bold uppercase italic">{a.registradoPorEmail.split('@')[0]}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 font-medium">{a.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-white border-t flex justify-end">
            <button onClick={onClose} className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-900 transition-all">Cerrar</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {isCameraOpen && (
        <CameraCapture
          onPhotoTaken={handlePhotoTaken}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {isVehiculoCameraOpen && (
        <CameraCapture
          onPhotoTaken={(base64) => {
            setFotoVehiculoBase64(base64);
            setIsVehiculoCameraOpen(false);
          }}
          onClose={() => setIsVehiculoCameraOpen(false)}
        />
      )}

      <CustomModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />

      <TimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        anotaciones={anotacionesAlerta}
        nombre={`${nombres} ${apellidos}`}
      />

      <div className="h-full w-full bg-gray-100 flex flex-col items-center px-4 py-2 md:py-4 overflow-y-auto custom-scrollbar">

        <div className="bg-white rounded-3xl shadow-xl py-4 px-4 md:px-6 w-full max-w-[1400px] border border-gray-200 flex flex-col my-auto">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 flex-grow">

            {/* 1. Formulario de Datos */}
            <div className="lg:col-span-2">
              <h2 className="text-base font-semibold mb-2 text-gray-600 border-b pb-1">
                Datos de la Persona
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">

                <div className="relative">
                  <span className="absolute left-2 top-2.5 text-xs text-gray-400 font-bold uppercase z-10">Identificación</span>
                  <input
                    type="text"
                    value={identificacion}
                    onChange={(e) => setIdentificacion(e.target.value.replace(/[^0-9]/g, ""))}
                    onBlur={handleBuscar}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (nombres.trim()) {
                          // 🟢 Ya hay persona cargada → ejecutar entrada o salida
                          if (!isBloqueado) {
                            handleRegistrar(registroActivo ? "salida" : "entrada");
                          }
                        } else {
                          // 🔍 Primer Enter → buscar persona
                          handleBuscar();
                        }
                      }
                    }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={`w-full p-2 pt-6 pl-9 pr-12 border rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm font-bold transition-all ${
                        isBloqueado ? 'border-red-600 bg-red-50 ring-4 ring-red-100' :
                        anotacionesAlerta.length > 0 ? 'border-yellow-400 bg-yellow-50 ring-2 ring-yellow-100' : 'border-gray-300'
                    }`}
                  />
                  <svg className="absolute left-2 top-7 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 2 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                  
                  {(anotacionesAlerta.length > 0 || isBloqueado) && (
                    <button
                      onClick={() => setIsTimelineOpen(true)}
                      className={`absolute right-2 top-7 p-1.5 rounded-full shadow-lg transition-all flex items-center justify-center group ${
                        isBloqueado ? 'bg-red-600 animate-bounce' : 'bg-yellow-500 animate-pulse-red'
                      }`}
                      title={isBloqueado ? "PERSONA BLOQUEADA - Clic para ver historial" : "¡ALERTA DE SEGURIDAD! Clic para ver detalles"}
                    >
                      <span className="text-[14px]">{isBloqueado ? "🚫" : "⚠️"}</span>
                    </button>
                   )}
                </div>

                {isBloqueado && (
                  <div className="bg-red-600 text-white p-3 rounded-lg shadow-inner animate-in slide-in-from-top duration-300 overflow-hidden relative">
                    <div className="flex items-center gap-3">
                        <div className="text-2xl animate-spin-slow">🚫</div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Entrada Prohibida - Usuario Bloqueado</p>
                            <p className="text-xs font-bold italic">"{motivoBloqueo}"</p>
                        </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 font-black">BLOCK</div>
                  </div>
                )}

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
                  placeholder="Teléfono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value.replace(/[^0-9]/g, ""))}
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
                    disabled={loadingTipos || tipos.length === 0}
                    className="appearance-none w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm bg-white text-sm disabled:bg-gray-50"
                  >
                    {tipos.length > 0 ? (
                      tipos.map(t => (
                        <option key={t.id} value={t.nombre.toLowerCase()}>{t.nombre}</option>
                      ))
                    ) : (
                      <option value="">{loadingTipos ? "Cargando..." : "Sin tipos disponibles"}</option>
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.95 4.95z" /></svg>
                  </div>
                </div>

                <textarea
                  placeholder="Motivo de ingreso"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full p-2 py-1.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm md:col-span-2 text-sm resize-none"
                  rows={1}
                />

                {/* 🚗 Sección de Vehículo REDISEÑADA */}
                <div className="md:col-span-2 bg-gray-100/50 p-3 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md mt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                       <span className="text-lg">🚗</span>
                       <h3 className="text-xs font-black text-gray-700 uppercase tracking-tighter">Información del Vehículo</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/vehiculos")}
                      className="text-[10px] bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold hover:bg-blue-200 transition-colors flex items-center gap-1 uppercase"
                    >
                      📂 Ver Registrados
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {/* Botón Cámara de Vehículo */}
                    <div className="col-span-2 md:col-span-1 flex flex-col items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => setIsVehiculoCameraOpen(true)}
                        className={`w-full h-full min-h-[80px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all ${
                          fotoVehiculoBase64 ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        {fotoVehiculoBase64 ? (
                          <img src={fotoVehiculoBase64} alt="Vehículo" className="w-full h-full object-cover rounded-md" />
                        ) : (
                          <>
                            <span className="text-xl">📸</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Foto</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Placa"
                          value={placa}
                          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                          onBlur={handleBuscarPlaca}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleBuscarPlaca();
                            }
                          }}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 text-sm font-black uppercase placeholder:font-normal"
                        />
                      </div>

                      <div className="relative">
                        <select
                          value={tipoVehiculo}
                          onChange={(e) => setTipoVehiculo(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 text-sm bg-white appearance-none cursor-pointer"
                        >
                          <option value="">Tipo de Vehículo</option>
                          <option value="carro">Carro</option>
                          <option value="moto">Moto</option>
                          <option value="camioneta">Camioneta</option>
                          <option value="camion">Camión</option>
                          <option value="bus">Bus / Microbús</option>
                          <option value="bicicleta">Bicicleta</option>
                          <option value="otro">Otro</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.95 4.95z" /></svg>
                        </div>
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Marca"
                        value={marca}
                        onChange={(e) => setMarca(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 text-sm"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Modelo"
                          value={modelo}
                          onChange={(e) => setModelo(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 2. Sección de Registro y Tiempo */}
            <div className="lg:col-span-1 flex flex-col items-center justify-between p-3 lg:p-4 bg-blue-50/50 rounded-2xl border border-blue-100 h-full">

              <div
                className="flex flex-col items-center mb-2 w-full cursor-pointer group"
                onClick={() => setIsCameraOpen(true)} // 👈 ABRIR CÁMARA AL HACER CLIC
              >
                <div className={`
                        w-28 h-28 lg:w-32 lg:h-32 border-4 rounded-full bg-blue-100 flex items-center justify-center mb-2 text-xl font-extrabold shadow-inner overflow-hidden
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

              <div className="flex flex-col gap-2 w-full mb-2">
                <button
                  onClick={() => handleRegistrar("entrada")}
                  disabled={isBloqueado || !!registroActivo}
                  className={`w-full text-white py-2.5 px-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-sm lg:text-base ${
                    isBloqueado
                      ? 'bg-gray-400 cursor-not-allowed grayscale'
                      : registroActivo
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  }`}
                >
                  {isBloqueado ? "🚫 INGRESO PROHIBIDO" : "✅ REGISTRAR ENTRADA"}
                </button>
                <button
                  onClick={() => handleRegistrar("salida")}
                  disabled={!registroActivo}
                  className={`w-full py-2.5 text-base font-bold rounded-xl shadow-md transition duration-200 ${
                    registroActivo
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  🚪 REGISTRAR SALIDA
                </button>
                
                <button
                  onClick={handleActualizarDatos}
                  className="mt-1 w-full bg-blue-100 text-blue-700 py-1.5 rounded-xl font-bold shadow-sm hover:bg-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 border border-blue-200 text-xs uppercase"
                >
                  🛠️ Actualizar Datos
                </button>
              </div>

              <div className="text-center w-full bg-gray-800 p-3 rounded-lg shadow-inner">
                {mounted ? (
                  <>
                    <p className="text-base font-medium text-gray-300">
                      {fechaHora.toLocaleDateString("es-CO", { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-4xl font-mono font-extrabold text-green-400 mt-1 tracking-wider">
                      {fechaHora.toLocaleTimeString("es-CO")}
                    </p>
                  </>
                ) : (
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="h-4 w-32 bg-gray-700 rounded"></div>
                    <div className="h-8 w-48 bg-gray-700 rounded"></div>
                  </div>
                )}
              </div>

            </div>
          </div>

          <hr className="my-3 border-gray-200" />

          {/* Botones de Navegación Inferiores (sin cambios) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Solo Admin y SuperAdmin ven Reportes y Registros */}
            <button
              onClick={() => router.push("/reportes")}
              className={`text-white py-2 rounded-lg font-semibold shadow-md text-xs transition-all ${
                anotacionesAlerta.length > 0 
                  ? 'bg-red-600 animate-pulse-red shadow-red-200' 
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              📊 Reporte de Novedades
            </button>

            <button
              onClick={() => router.push("/registros")}
              className="bg-yellow-500 text-white py-2 rounded-lg font-semibold shadow-md hover:bg-yellow-600 text-xs"
            >
              📜 Historial de Registros
            </button>

            <button
              onClick={() => router.push("/correspondencia")}
              className="bg-indigo-600 text-white py-2 rounded-lg font-semibold shadow-md hover:bg-indigo-700 text-xs"
            >
              📦 Correspondencia
            </button>

            <button
              onClick={() => router.push("/personal-activo")}
              className="bg-purple-600 text-white py-2 rounded-lg font-semibold shadow-md hover:bg-purple-700 text-xs"
            >
              👥 Personal Con Registro Activo
            </button>

            {/* Solo Admin y SuperAdmin ven Configuraciones */}
            {(usuario?.role === "admin" || usuario?.role === "superadmin") && (
              <button
                onClick={() => router.push("/configuraciones")}
                className="bg-blue-800 text-white py-2 rounded-lg font-semibold shadow-md hover:bg-blue-900 text-xs"
              >
                🔑 Configuraciones
              </button>
            )}

            {/* Solo SuperAdmin ve Mantenimiento */}
            {usuario?.role === "superadmin" && (
              <button
                onClick={() => router.push("/configuraciones/general?mantenimiento=true")}
                className="bg-red-700 text-white py-2 rounded-lg font-semibold shadow-md hover:bg-red-800 text-xs border-2 border-red-300 animate-pulse"
              >
                🛠️ Mantenimiento (DEV)
              </button>
            )}
          </div>
        </div>

        <p className="mt-2 text-gray-500 text-xs">SOFTCOINP - Sistema de Control de Acceso</p>
      </div>
    </>
  );
}