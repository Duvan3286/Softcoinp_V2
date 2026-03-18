"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import CameraCapture from "@/components/CameraCapture";
import { tipoService, TipoPersonal } from "@/services/tipoService";
import { anotacionService, AnotacionDto } from "@/services/anotacionService";
import { registroVehiculoService } from "@/services/registroVehiculoService";
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
  const identificacionRef = useRef<HTMLInputElement>(null);
  const nombresRef = useRef<HTMLInputElement>(null);
  const apellidosRef = useRef<HTMLInputElement>(null);
  const destinoRef = useRef<HTMLInputElement>(null);
  const motivoRef = useRef<HTMLTextAreaElement>(null);
  const placaRef = useRef<HTMLInputElement>(null);
  const marcaRef = useRef<HTMLInputElement>(null);
  const modeloRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const tipoVehiculoRef = useRef<HTMLSelectElement>(null);

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
  const [registroVehiculoActivo, setRegistroVehiculoActivo] = useState<RegistroActivo | null>(null);

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

  // ⚠️ Estado para validación visual
  const [camposErrores, setCamposErrores] = useState<string[]>([]);

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
    
    // 🎯 Auto-focus en el campo de identificación al cargar
    setTimeout(() => {
      identificacionRef.current?.focus();
    }, 100);

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

  const limpiarFormulario = () => {
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
    setAnotacionesAlerta([]);
    setIsBloqueado(false);
    setMotivoBloqueo("");
    setRegistroActivo(null);
    setDatosOriginales({});
    setCamposErrores([]);
  };

  const limpiarVehiculoFormulario = () => {
    setPlaca("");
    setMarca("");
    setModelo("");
    setColor("");
    setTipoVehiculo("");
    setFotoVehiculoBase64(null);
    setRegistroVehiculoActivo(null);
    setCamposErrores([]);
  };

  const handleRegistrar = async (accion: "entrada" | "salida") => {
    try {
      if (accion === "entrada") {
        // Verificar campos obligatorios
        const validation = [
          { value: identificacion, name: "Identificación", ref: identificacionRef, id: "identificacion" },
          { value: nombres, name: "Nombres", ref: nombresRef, id: "nombres" },
          { value: apellidos, name: "Apellidos", ref: apellidosRef, id: "apellidos" },
          { value: destino, name: "Destino", ref: destinoRef, id: "destino" },
          { value: motivo, name: "Motivo de ingreso", ref: motivoRef, id: "motivo" },
        ];

        const missing = validation.filter(v => !v.value.trim());
        
        if (missing.length > 0) {
          setCamposErrores(missing.map(m => m.id));
          showModal(`🛑 Debe diligenciar los campos obligatorios: ${missing.map(m => `"${m.name}"`).join(", ")}`, "error");
          
          // Focus el primero que falte
          setTimeout(() => missing[0].ref.current?.focus(), 100);
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
        limpiarFormulario();

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
        limpiarFormulario();
      }
    } catch (err: any) {
      console.error("Error al registrar:", err);
      const msg = err.response?.data?.message || "Error en el servidor al procesar el registro.";
      showModal(`🛑 ${msg}`, "error");
    } finally {
      // Ya no limpiamos aquí para evitar borrar el formulario en caso de error de validación
    }
  };

  const handleRegistrarVehiculo = async (accion: "entrada" | "salida") => {
    try {
      if (accion === "entrada") {
        const validation = [
          { value: placa, name: "Placa", ref: placaRef, id: "placa" },
          { value: tipoVehiculo, name: "Tipo de Vehículo", ref: tipoVehiculoRef, id: "tipoVehiculo" },
          { value: marca, name: "Marca", ref: marcaRef, id: "marca" },
          { value: modelo, name: "Modelo", ref: modeloRef, id: "modelo" },
          { value: color, name: "Color", ref: colorRef, id: "color" },
        ];

        const missing = validation.filter(v => !v.value.trim());

        if (missing.length > 0) {
          setCamposErrores(missing.map(m => m.id));
          showModal(`🛑 Debe diligenciar los campos obligatorios del vehículo: ${missing.map(m => `"${m.name}"`).join(", ")}`, "error");
          setTimeout(() => missing[0].ref.current?.focus(), 100);
          return;
        }

        if (!fotoVehiculoBase64) {
          showModal("🛑 Debe tomar una fotografía del vehículo para el registro.", "error");
          return;
        }

        // Verificar si ya tiene entrada activa
        const activo = await registroVehiculoService.getActivo(placa);
        if (activo?.data) {
          showModal("⚠️ Este vehículo ya tiene una entrada activa.", "warning");
          setRegistroVehiculoActivo({ id: activo.data.id });
          return;
        }

        await registroVehiculoService.registrarEntrada({
          placa,
          marca,
          modelo,
          color,
          tipoVehiculo,
          fotoVehiculo: fotoVehiculoBase64 || undefined
        });

        showModal("✅ Entrada de vehículo registrada con éxito", "success");
        setRegistroVehiculoActivo({ id: "activo" });
        limpiarVehiculoFormulario();

      } else {
        if (!registroVehiculoActivo) {
          showModal("🛑 No hay un registro de entrada activo para este vehículo.", "error");
          return;
        }

        // Buscar el ID real si es necesario
        let activeId = registroVehiculoActivo.id;
        if (activeId === "activo") {
          const res = await registroVehiculoService.getActivo(placa);
          if (res?.data) activeId = res.data.id;
          else {
            showModal("🛑 No se pudo encontrar el registro activo para este vehículo.", "error");
            return;
          }
        }

        await registroVehiculoService.registrarSalida(activeId);
        showModal("🚪 Salida de vehículo registrada con éxito", "success");
        limpiarVehiculoFormulario();
      }
    } catch (err: any) {
      console.error("Error al registrar vehículo:", err);
      const msg = err.response?.data?.message || "Error al procesar el registro del vehículo.";
      showModal(`🛑 ${msg}`, "error");
    } finally {
      // No limpiamos aquí para evitar borrar campos en caso de error de validación
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

    setDestino("");
    setMotivo("");

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

        // Verificar si tiene entrada activa
        try {
          const activo = await registroVehiculoService.getActivo(placa);
          if (activo?.data) {
            setRegistroVehiculoActivo({ id: activo.data.id });
          } else {
            setRegistroVehiculoActivo(null);
          }
        } catch {
          setRegistroVehiculoActivo(null);
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
                  <div className="bg-white rounded-xl p-4 border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {new Date(a.fechaCreacionUtc).toLocaleString("es-CO", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {a.registradoPorEmail && (
                        <span className="text-[9px] text-red-500 font-bold uppercase italic">{a.registradoPorEmail.split('@')[0]}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 font-medium">{a.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-white border-t border-gray-100 flex justify-end">
            <button onClick={onClose} className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-900 transition-all shadow-sm">Cerrar</button>
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

      <div className="h-[calc(100vh-56px)] w-full flex flex-col relative z-0 overflow-hidden">
        
        {/* Halo decorativo */}
        <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/40 to-transparent -z-10 pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0 w-full max-w-[1700px] mx-auto p-3 lg:p-4 overflow-y-auto lg:overflow-hidden">

          {/* ══════════════════════════════════════════
              COLUMNA IZQUIERDA: Reloj + Vehículo
          ══════════════════════════════════════════ */}
          <div className="w-full lg:w-96 xl:w-[26rem] flex flex-col gap-3 flex-shrink-0">

            {/* ── Bloque Vehículo ── */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-3 lg:p-4 flex flex-col gap-2.5 overflow-hidden">
              <div className="flex items-center gap-3 mb-1 flex-shrink-0">
                {/* Título — izquierda */}
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <h3 className="text-sm lg:text-base font-bold text-slate-700 flex items-center gap-2 tracking-tight">
                    <div className="p-1 lg:p-1.5 bg-slate-100 rounded-lg text-slate-600 flex-shrink-0">
                      <span className="text-sm lg:text-base">🚗</span>
                    </div>
                    Vehículo
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 hidden lg:block">
                    {fotoVehiculoBase64 ? '✅ Foto capturada — clic para cambiar' : 'Clic en el círculo para fotografía'}
                  </p>
                </div>

                {/* Foto vehículo — derecha (circular y simétrica a la de persona) */}
                <div
                  className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                  onClick={() => setIsVehiculoCameraOpen(true)}
                >
                  <div className="relative w-20 lg:w-24 h-20 lg:h-24">
                    <div className={`absolute inset-0 rounded-full blur-md opacity-20 transition-all duration-500 ${fotoVehiculoBase64 ? 'bg-emerald-400' : 'bg-slate-300 group-hover:bg-blue-400'}`}></div>
                    <div className={`relative w-full h-full border-[2px] rounded-full flex items-center justify-center overflow-hidden bg-slate-50 transition-all duration-300 ${fotoVehiculoBase64 ? 'border-emerald-400' : 'border-slate-200 group-hover:border-blue-400'}`}>
                      {fotoVehiculoBase64 ? (
                        <img src={fotoVehiculoBase64} alt="Vehículo" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-10 lg:w-12 h-10 lg:h-12 text-slate-300 group-hover:text-blue-400 transition duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.218A2 2 0 0110.125 4h3.75a2 2 0 011.664.89l.812 1.218A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white border border-slate-200 p-1 rounded-full shadow group-hover:bg-blue-50 transition-colors">
                      <span className="text-[10px]">{fotoVehiculoBase64 ? '🔄' : '📸'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campos del vehículo */}
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 flex flex-col gap-2">
                <input
                  ref={placaRef}
                  type="text"
                  placeholder="Placa"
                  value={placa}
                  onChange={(e) => {
                    setPlaca(e.target.value.toUpperCase());
                    setCamposErrores(prev => prev.filter(err => err !== "placa"));
                  }}
                  onBlur={handleBuscarPlaca}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter') {
                       if (marca.trim() || modelo.trim()) {
                         handleRegistrarVehiculo(registroVehiculoActivo ? "salida" : "entrada");
                       } else {
                         handleBuscarPlaca();
                       }
                    }
                  }}
                  className={`w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-sm text-sm font-black uppercase transition-all ${
                    camposErrores.includes("placa") ? 'border-red-500 bg-red-50 ring-2 ring-red-500/10' : 'border-slate-200 bg-slate-50 text-slate-700'
                  } placeholder:font-medium placeholder:normal-case placeholder:text-slate-400`}
                />

                <div className="relative">
                  <select
                    ref={tipoVehiculoRef}
                    value={tipoVehiculo}
                    onChange={(e) => {
                      setTipoVehiculo(e.target.value);
                      setCamposErrores(prev => prev.filter(err => err !== "tipoVehiculo"));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRegistrarVehiculo(registroVehiculoActivo ? "salida" : "entrada");
                    }}
                    className={`w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-sm text-sm font-medium appearance-none cursor-pointer transition-all ${
                      camposErrores.includes("tipoVehiculo") ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500/10' : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
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
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.95 4.95z" /></svg>
                  </div>
                </div>

                <input
                  ref={marcaRef}
                  type="text"
                  placeholder="Marca"
                  value={marca}
                  onChange={(e) => {
                    setMarca(e.target.value);
                    setCamposErrores(prev => prev.filter(err => err !== "marca"));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRegistrarVehiculo(registroVehiculoActivo ? "salida" : "entrada");
                  }}
                  className={`w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-sm text-sm font-medium transition-all placeholder:text-slate-400 ${
                    camposErrores.includes("marca") ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500/10' : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`}
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    ref={modeloRef}
                    type="text"
                    placeholder="Modelo"
                    value={modelo}
                    onChange={(e) => {
                      setModelo(e.target.value);
                      setCamposErrores(prev => prev.filter(err => err !== "modelo"));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRegistrarVehiculo(registroVehiculoActivo ? "salida" : "entrada");
                    }}
                    className={`w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-sm text-sm font-medium transition-all placeholder:text-slate-400 ${
                      camposErrores.includes("modelo") ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500/10' : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  />
                  <input
                    ref={colorRef}
                    type="text"
                    placeholder="Color"
                    value={color}
                    onChange={(e) => {
                      setColor(e.target.value);
                      setCamposErrores(prev => prev.filter(err => err !== "color"));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRegistrarVehiculo(registroVehiculoActivo ? "salida" : "entrada");
                    }}
                    className={`w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-sm text-sm font-medium transition-all placeholder:text-slate-400 ${
                      camposErrores.includes("color") ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500/10' : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  />
                </div>

                {/* Botones de Entrada/Salida para Vehículo */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => handleRegistrarVehiculo("entrada")}
                    disabled={!!registroVehiculoActivo}
                    className={`flex-1 py-1.5 rounded-xl font-bold text-[10px] transition-all active:scale-[0.98] border shadow-sm ${
                      registroVehiculoActivo 
                      ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    📥 ENTRADA VEH
                  </button>
                  <button
                    onClick={() => handleRegistrarVehiculo("salida")}
                    disabled={!registroVehiculoActivo}
                    className={`flex-1 py-1.5 rounded-xl font-bold text-[10px] transition-all active:scale-[0.98] border shadow-sm ${
                      !registroVehiculoActivo 
                      ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                      : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    📤 SALIDA VEH
                  </button>
                </div>

                <button
                  onClick={() => router.push('/registros-vehiculos')}
                  className="w-full mt-2 bg-slate-100 text-slate-600 py-2 rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-slate-200 text-[10px] uppercase tracking-wider"
                >
                  <span className="text-base">📜</span>
                  Ver Historial de Vehículos
                </button>
              </div>
            </div>

            {/* ── Bloque Reloj / Fecha ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col items-center justify-center gap-1 text-center">
              {mounted ? (
                <>
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-tight">
                    {fechaHora.toLocaleDateString("es-CO", { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <div className="flex items-baseline gap-0.5 mt-1">
                    <p className="text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-700 to-indigo-900 tracking-tight leading-none">
                      {fechaHora.toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </p>
                    <span className="text-xl font-mono font-bold text-blue-500 animate-pulse">:{fechaHora.getSeconds().toString().padStart(2, '0')}</span>
                  </div>
                </>
              ) : (
                <div className="animate-pulse flex flex-col items-center gap-2">
                  <div className="h-2.5 w-28 bg-slate-200 rounded"></div>
                  <div className="h-9 w-36 bg-slate-200 rounded"></div>
                </div>
              )}
            </div>

          </div>{/* fin columna izquierda */}

          {/* ══════════════════════════════════════════
              COLUMNA DERECHA: Formulario Persona + Acciones
          ══════════════════════════════════════════ */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm p-4 lg:p-5 overflow-hidden min-h-0">
            {/* Cabecera: Título izq + Foto derecha */}
            <div className="flex items-center gap-3 mb-2 flex-shrink-0">

              {/* Título — izquierda */}
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <h2 className="text-sm lg:text-base font-bold text-slate-800 flex items-center gap-2 tracking-tight">
                  <div className="p-1 lg:p-1.5 bg-blue-100 rounded-lg text-blue-600 flex-shrink-0">
                    <svg className="w-3.5 h-3.5 lg:w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  </div>
                  Registro de Persona
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5 hidden lg:block">
                  {fotoBase64 ? '✅ Foto capturada — clic para cambiar' : 'Clic en el avatar para tomar fotografía'}
                </p>
              </div>

              {/* Foto persona — derecha (ajustada para ahorrar espacio vertical) */}
              <div
                className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                onClick={() => setIsCameraOpen(true)}
              >
                <div className="relative w-20 lg:w-24 h-20 lg:h-24">
                  <div className={`absolute inset-0 rounded-full blur-md opacity-20 transition-all duration-500 ${fotoBase64 ? 'bg-emerald-400' : 'bg-blue-300 group-hover:bg-blue-500'}`}></div>
                  <div className={`relative w-full h-full border-[2px] rounded-full flex items-center justify-center overflow-hidden bg-slate-50 transition-all duration-300 ${fotoBase64 ? 'border-emerald-400' : 'border-slate-200 group-hover:border-blue-400'}`}>
                    {fotoBase64 ? (
                      <img src={fotoBase64} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-10 lg:w-12 h-10 lg:h-12 text-slate-300 group-hover:text-blue-400 transition duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.218A2 2 0 0110.125 4h3.75a2 2 0 011.664.89l.812 1.218A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white border border-slate-200 p-1 rounded-full shadow group-hover:bg-blue-50 transition-colors">
                    <span className="text-[10px]">{fotoBase64 ? '🔄' : '📸'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Alerta bloqueo */}
            {isBloqueado && (
              <div className="bg-red-50 text-red-800 p-3 rounded-xl shadow-sm border border-red-200 animate-in slide-in-from-top duration-300 mb-3 flex-shrink-0 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="text-2xl animate-pulse">🛑</div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-600">Acceso Denegado</p>
                    <p className="text-sm font-bold">"{motivoBloqueo}"</p>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 text-6xl opacity-[0.03] text-red-900 font-black rotate-[-10deg]">BLOCK</div>
              </div>
            )}

            {/* Campos optimizados en grid de 3 columnas para PC */}
            <div className="flex-1 overflow-y-auto lg:overflow-visible custom-scrollbar min-h-0 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pb-2">

                {/* Identificación */}
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <span className="absolute left-2 top-2.5 text-[10px] text-slate-500 font-bold uppercase z-10">Identificación</span>
                  <input
                    ref={identificacionRef}
                    type="text"
                    value={identificacion}
                    onChange={(e) => {
                      setIdentificacion(e.target.value.replace(/[^0-9]/g, ""));
                      setCamposErrores(prev => prev.filter(err => err !== "identificacion"));
                    }}
                    onBlur={handleBuscar}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (nombres.trim()) {
                          if (!isBloqueado) handleRegistrar(registroActivo ? "salida" : "entrada");
                        } else {
                          handleBuscar();
                        }
                      }
                    }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={`w-full p-2 pt-6 pl-9 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm text-sm font-black transition-all ${
                      isBloqueado ? 'border-red-300 bg-red-50 text-red-900 ring-4 ring-red-500/10' :
                      camposErrores.includes("identificacion") ? 'border-red-500 bg-red-50 ring-4 ring-red-500/10' :
                      anotacionesAlerta.length > 0 ? 'border-yellow-300 bg-yellow-50 text-yellow-900 ring-2 ring-yellow-400/20' : 'border-slate-200 bg-slate-50 focus:bg-white text-slate-800'
                    }`}
                  />
                  <svg className="absolute left-2.5 top-6 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 2 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                  {(anotacionesAlerta.length > 0 || isBloqueado) && (
                    <button
                      onClick={() => setIsTimelineOpen(true)}
                      className={`absolute right-2 top-7 p-1.5 rounded-full shadow-lg transition-all ${isBloqueado ? 'bg-red-600 animate-bounce' : 'bg-yellow-500 animate-pulse-red'}`}
                      title={isBloqueado ? "BLOQUEADO" : "¡ALERTA!"}
                    >
                      <span className="text-[13px]">{isBloqueado ? "🚫" : "⚠️"}</span>
                    </button>
                  )}
                </div>

                <input 
                  ref={nombresRef}
                  type="text" 
                  placeholder="Nombres" 
                  value={nombres} 
                  onChange={(e) => {
                    setNombres(e.target.value);
                    setCamposErrores(prev => prev.filter(err => err !== "nombres"));
                  }}
                  className={`w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-sm text-sm font-medium transition-all placeholder:text-slate-400 ${
                    camposErrores.includes("nombres") ? 'border-red-500 bg-red-50 ring-2 ring-red-500/10 text-red-900' : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`} />

                <input 
                  ref={apellidosRef}
                  type="text" 
                  placeholder="Apellidos" 
                  value={apellidos} 
                  onChange={(e) => {
                    setApellidos(e.target.value);
                    setCamposErrores(prev => prev.filter(err => err !== "apellidos"));
                  }}
                  className={`w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-sm text-sm font-medium transition-all placeholder:text-slate-400 ${
                    camposErrores.includes("apellidos") ? 'border-red-500 bg-red-50 ring-2 ring-red-500/10 text-red-900' : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`} />

                <input type="text" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-sm text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400" />

                <input type="text" placeholder="Cargo u Oficio (Opcional)" value={cargo} onChange={(e) => setCargo(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-sm text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400" />

                <input 
                  ref={destinoRef}
                  type="text" 
                  placeholder="Destino" 
                  value={destino} 
                  onChange={(e) => {
                    setDestino(e.target.value);
                    setCamposErrores(prev => prev.filter(err => err !== "destino"));
                  }}
                  className={`w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-sm text-sm font-medium transition-all placeholder:text-slate-400 ${
                    camposErrores.includes("destino") ? 'border-red-500 bg-red-50 ring-2 ring-red-500/10 text-red-900' : 'border-slate-200 bg-slate-50 text-slate-800'
                  }`} />

                <div className="relative">
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)} disabled={loadingTipos || tipos.length === 0}
                    className="appearance-none w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-sm text-sm font-medium text-slate-800 disabled:opacity-50 transition-all cursor-pointer">
                    {tipos.length > 0 ? tipos.map(t => <option key={t.id} value={t.nombre.toLowerCase()}>{t.nombre}</option>) : <option value="">{loadingTipos ? "Cargando..." : "Sin tipos"}</option>}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9l4.95 4.95z" /></svg>
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-3 relative">
                  <textarea 
                    ref={motivoRef}
                    placeholder="Motivo de ingreso" 
                    value={motivo} 
                    onChange={(e) => {
                      setMotivo(e.target.value);
                      setCamposErrores(prev => prev.filter(err => err !== "motivo"));
                    }}
                    maxLength={250}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                    className={`w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white shadow-sm text-sm font-medium transition-all placeholder:text-slate-400 resize-none overflow-hidden min-h-[42px] ${
                      camposErrores.includes("motivo") ? 'border-red-500 bg-red-50 ring-2 ring-red-500/10 text-red-900' : 'border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                    rows={1} 
                  />
                  <div className="absolute right-2 bottom-1 text-[8px] font-bold text-slate-300 pointer-events-none uppercase">
                    {motivo.length}/250
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción (fijos abajo) */}
            <div className="flex-shrink-0 pt-3 border-t border-slate-100 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleRegistrar("entrada")}
                  disabled={isBloqueado || !!registroActivo}
                  className={`w-full text-white py-2.5 px-3 rounded-xl font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm border ${
                    isBloqueado ? 'bg-red-50 border-red-200 text-red-500 cursor-not-allowed'
                    : registroActivo ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgb(16,185,129,0.2)]'
                  }`}
                >
                  {isBloqueado ? "🚫 PROHIBIDO" : "✅ ENTRADA"}
                </button>
                <button
                  onClick={() => handleRegistrar("salida")}
                  disabled={!registroActivo}
                  className={`w-full py-2.5 text-sm font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center border ${
                    registroActivo ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-[0_0_15px_rgb(225,29,72,0.2)]'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  🚪 SALIDA
                </button>
              </div>
              <button
                onClick={handleActualizarDatos}
                className="w-full bg-blue-50 text-blue-600 py-2 rounded-xl font-bold hover:bg-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-blue-200 text-xs uppercase tracking-wider shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Actualizar Datos
              </button>
            </div>

          </div>{/* fin columna derecha */}

        </div>
      </div>
    </>
  );
}
