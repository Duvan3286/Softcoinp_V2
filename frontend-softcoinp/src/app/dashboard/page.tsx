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
import ImageZoomModal from "@/components/ImageZoomModal";


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
  const [anotacionesVehiculoAlerta, setAnotacionesVehiculoAlerta] = useState<AnotacionDto[]>([]);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isVehiculoTimelineOpen, setIsVehiculoTimelineOpen] = useState(false);

  // 🚫 Estado de Bloqueo
  const [isBloqueado, setIsBloqueado] = useState(false);
  const [motivoBloqueo, setMotivoBloqueo] = useState("");
  const [isVehiculoBloqueado, setIsVehiculoBloqueado] = useState(false);
  const [motivoBloqueoVehiculo, setMotivoBloqueoVehiculo] = useState("");

  // 🚗 ESTADOS para el Vehículo
  const [placa, setPlaca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [color, setColor] = useState("");
  const [tipoVehiculo, setTipoVehiculo] = useState("");
  const [fotoVehiculoBase64, setFotoVehiculoBase64] = useState<string | null>(null);
  const [fotoVehiculoUrl, setFotoVehiculoUrl] = useState<string | null>(null);
  const [isVehiculoCameraOpen, setIsVehiculoCameraOpen] = useState(false);

  // 📸 Snapshot de datos originales (para detectar cambios en actualización)
  const [datosOriginales, setDatosOriginales] = useState<Record<string, string | null>>({}); 

  // 🚙 Estado para bloquear registro directo de vehículos nuevos
  const [isVehiculoNuevo, setIsVehiculoNuevo] = useState(false);

  // ⚠️ Estado para validación visual
  const [camposErrores, setCamposErrores] = useState<string[]>([]);
  const [usuario, setUsuario] = useState<UserPayload | null>(null);
  const [fotoZoomUrl, setFotoZoomUrl] = useState<string | null>(null);

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
    setFotoVehiculoUrl(null);
    setTelefono("");
    setAnotacionesAlerta([]);
    setAnotacionesVehiculoAlerta([]);
    setIsBloqueado(false);
    setMotivoBloqueo("");
    setIsVehiculoBloqueado(false);
    setMotivoBloqueoVehiculo("");
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
    setFotoVehiculoUrl(null);
    setRegistroVehiculoActivo(null);
    setIsVehiculoBloqueado(false);
    setMotivoBloqueoVehiculo("");
    setAnotacionesVehiculoAlerta([]);
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

        if (isVehiculoBloqueado) {
          showModal(`🛑 No se puede registrar la entrada. El vehículo seleccionado está BLOQUEADO. Motivo: ${motivoBloqueoVehiculo}`, "error");
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

        if (isVehiculoBloqueado) {
          showModal(`🛑 No se puede registrar la entrada. Este vehículo está BLOQUEADO. Motivo: ${motivoBloqueoVehiculo}`, "error");
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
        camposActualizados.push(`👤 Nombre: ${nombres}`);
      if (apellidos.trim() && apellidos !== datosOriginales.apellido)
        camposActualizados.push(`👤 Apellido: ${apellidos}`);
      if (telefono.trim() && telefono !== datosOriginales.telefono)
        camposActualizados.push(`📞 Teléfono: ${telefono}`);
      if (tipo.trim() && tipo !== datosOriginales.tipo)
        camposActualizados.push(`🪪 Tipo: ${tipo}`);
      if (fotoBase64 && fotoBase64 !== datosOriginales.fotoBase64)
        camposActualizados.push(`📸 Foto de persona actualizada`);
      
      if (placa.trim()) {
        const pModificada = placa.trim() !== (datosOriginales.placa || "").trim();
        if (pModificada) camposActualizados.push(`🚗 Placa: ${placa}`);
        
        if (marca.trim() && marca !== datosOriginales.marca)
          camposActualizados.push(`   • Marca: ${marca}`);
        if (modelo.trim() && modelo !== datosOriginales.modelo)
          camposActualizados.push(`   • Modelo: ${modelo}`);
        if (color.trim() && color !== datosOriginales.color)
          camposActualizados.push(`   • Color: ${color}`);
        if (tipoVehiculo.trim() && tipoVehiculo !== datosOriginales.tipoVehiculo)
          camposActualizados.push(`   • Tipo vehículo: ${tipoVehiculo}`);
        if (fotoVehiculoBase64 && fotoVehiculoBase64 !== datosOriginales.fotoVehiculoBase64)
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
    setPlaca("");
    setMarca("");
    setModelo("");
    setColor("");
    setTipoVehiculo("");
    setFotoVehiculoBase64(null);
    setRegistroActivo(null);
    setAnotacionesAlerta([]);
    setAnotacionesVehiculoAlerta([]);
    setIsBloqueado(false);
    setMotivoBloqueo("");
    setIsVehiculoBloqueado(false);
    setMotivoBloqueoVehiculo("");

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

          // 🚫 Bug fix #1: Consultar el estado de bloqueo del vehículo inmediatamente
          if (persona.placaVehiculo) {
            try {
              const vRes = (await api.get(`/vehiculos/placa/${persona.placaVehiculo}`)) as { data: { data?: any } };
              const vData = vRes.data?.data;
              if (vData?.isBloqueado) {
                setIsVehiculoBloqueado(true);
                setMotivoBloqueoVehiculo(vData.motivoBloqueo || "Motivo no especificado");
              } else {
                setIsVehiculoBloqueado(false);
                setMotivoBloqueoVehiculo("");
              }
            } catch {
              setIsVehiculoBloqueado(false);
              setMotivoBloqueoVehiculo("");
            }
          }
        }

        // 📸 Carga de fotos para el snapshot y la vista
        let pBase64 = null;
        if (persona.fotoUrl) {
          setFotoUrl(persona.fotoUrl);
          pBase64 = await urlToBase64(persona.fotoUrl);
          if (pBase64) setFotoBase64(pBase64);
        }

        let vBase64 = null;
        if (persona.fotoVehiculoUrl) {
          setFotoVehiculoUrl(persona.fotoVehiculoUrl);
          vBase64 = await urlToBase64(persona.fotoVehiculoUrl);
          if (vBase64) setFotoVehiculoBase64(vBase64);
        }

        // 📸 Guardar snapshot de los datos originales con base64 para detectar cambios
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
          fotoBase64: pBase64,
          fotoVehiculoBase64: vBase64,
        });

        // 🔍 Verificar Novedades de Seguridad
        if (persona.personalId) {
          const alerts = await anotacionService.getAnotacionesPorPersonal(persona.personalId);
          setAnotacionesAlerta(alerts);
        }
        if (persona.vehiculoId) {
          const vAlerts = await anotacionService.getAnotacionesPorVehiculo(persona.vehiculoId);
          setAnotacionesVehiculoAlerta(vAlerts);
        }

        if (!persona.fotoUrl) {
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
    setFotoVehiculoUrl(null);
    setIsVehiculoNuevo(false);

    try {
      const res = (await api.get(`/vehiculos/placa/${placa}`)) as { data: { data?: any } };
      const vehiculo = res.data?.data;

      if (vehiculo) {
        setIsVehiculoNuevo(false);
        // Cargar datos del vehículo
        setMarca(vehiculo.marca || "");
        setModelo(vehiculo.modelo || "");
        setColor(vehiculo.color || "");
        setTipoVehiculo(vehiculo.tipoVehiculo || "");
        
        if (vehiculo.isBloqueado) {
          setIsVehiculoBloqueado(true);
          setMotivoBloqueoVehiculo(vehiculo.motivoBloqueo || "Motivo no especificado");
          showModal(`🚫 VEHÍCULO BLOQUEADO: La placa ${placa} tiene restringido el ingreso. Motivo: ${vehiculo.motivoBloqueo}`, "error");
        } else {
          setIsVehiculoBloqueado(false);
          setMotivoBloqueoVehiculo("");
        }
        
        let vBase64_local = null;
        if (vehiculo.fotoUrl) {
           setFotoVehiculoUrl(vehiculo.fotoUrl);
           vBase64_local = await urlToBase64(vehiculo.fotoUrl);
           if (vBase64_local) setFotoVehiculoBase64(vBase64_local);
        }

        const vAlerts = await anotacionService.getAnotacionesPorVehiculo(vehiculo.id);
        setAnotacionesVehiculoAlerta(vAlerts);

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

        let pBase64_local = null;
        if (!identificacion) {
            setIdentificacion(vehiculo.propietarioDocumento || "");
            setNombres(vehiculo.propietarioNombre || "");
            setApellidos(vehiculo.propietarioApellido || "");
            setTelefono(vehiculo.propietarioTelefono || "");
            setTipo(vehiculo.propietarioTipo || "visitante");
            
            if (vehiculo.propietarioFotoUrl) {
              setFotoUrl(vehiculo.propietarioFotoUrl);
              pBase64_local = await urlToBase64(vehiculo.propietarioFotoUrl);
              if (pBase64_local) setFotoBase64(pBase64_local);
            }
            
            // Buscar historial/novedades del propietario
            if (vehiculo.propietarioId) {
               const alerts = await anotacionService.getAnotacionesPorPersonal(vehiculo.propietarioId);
               setAnotacionesAlerta(alerts);
            }
        }

        // 📸 Snapshot para búsqueda por placa usando variables locales
        setDatosOriginales({
          nombre: nombres || vehiculo.propietarioNombre || "",
          apellido: apellidos || vehiculo.propietarioApellido || "",
          telefono: telefono || vehiculo.propietarioTelefono || "",
          tipo: tipo || vehiculo.propietarioTipo || "visitante",
          placa: placa || "",
          marca: vehiculo.marca || "",
          modelo: vehiculo.modelo || "",
          color: vehiculo.color || "",
          tipoVehiculo: vehiculo.tipoVehiculo || "",
          fotoBase64: pBase64_local,
          fotoVehiculoBase64: vBase64_local,
          fotoVehiculoUrl: vehiculo.fotoUrl,
        });
      }
    } catch (err: any) {
       setIsVehiculoBloqueado(false);
       setMotivoBloqueoVehiculo("");
       if (err.response?.status === 404) {
         setIsVehiculoNuevo(true);
         showModal("⚠️ Vehículo Nuevo. Por normas de seguridad, debe registrar los datos del conductor en el panel izquierdo para vincularlo como propietario o conductor frecuente la primera vez.", "warning");
       } else {
         console.error("Error al buscar placa:", err);
       }
    }
  };

  // Componente Modal local eliminado para usar CustomModal

  const TimelineModal = ({ isOpen, onClose, anotaciones, nombre }: any) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="bg-red-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <h3 className="text-lg font-bold uppercase tracking-tight">Antecedentes de Seguridad: {nombre}</h3>
            </div>
            <button onClick={onClose} className="hover:bg-red-700 p-1 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="p-6 max-h-[60vh] overflow-y-auto bg-gray-50 custom-scrollbar">
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

      <TimelineModal
        isOpen={isVehiculoTimelineOpen}
        onClose={() => setIsVehiculoTimelineOpen(false)}
        anotaciones={anotacionesVehiculoAlerta}
        nombre={`Vehículo: ${placa}`}
      />

      <ImageZoomModal
        isOpen={!!fotoZoomUrl}
        onClose={() => setFotoZoomUrl(null)}
        imageUrl={fotoZoomUrl}
        title={fotoZoomUrl === (fotoBase64 || (fotoUrl ? (fotoUrl.startsWith('http') ? fotoUrl : `${BACKEND_BASE_URL}${fotoUrl}`) : null)) ? "Persona" : "Vehículo"}
      />

      <div className="flex-1 w-full flex flex-col relative z-0 lg:overflow-hidden">
        
        {/* Halo decorativo */}
        <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/40 to-transparent -z-10 pointer-events-none"></div>

        <div className="flex flex-col-reverse lg:flex-row-reverse gap-4 flex-1 min-h-0 w-full max-w-[1700px] mx-auto p-3 lg:p-4 overflow-y-auto lg:overflow-hidden">

          {/* ══════════════════════════════════════════
              SECCIÓN DERECHA: Reloj + Vehículo
          ══════════════════════════════════════════ */}
          <div className="w-full lg:w-96 xl:w-[26rem] flex flex-col gap-3 flex-shrink-0">

            {/* ── Bloque Vehículo ── */}
            <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-4 lg:p-5 flex flex-col gap-3 lg:overflow-hidden relative">
              <div className="flex items-center gap-3 mb-2 flex-shrink-0">
                {/* Título — izquierda */}
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <h3 className="text-sm lg:text-base font-black text-slate-800 flex items-center gap-2 tracking-tight uppercase">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl flex-shrink-0 shadow-sm">
                      <span className="text-lg">🚗</span>
                    </div>
                    Vehículo
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter hidden lg:block">
                    {fotoVehiculoBase64 ? 'Capturado' : 'Pendiente'}
                  </p>
                </div>

                {/* Foto vehículo — derecha */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                    onClick={() => {
                        const currentVehFullUrl = fotoVehiculoBase64 || (fotoVehiculoUrl ? (fotoVehiculoUrl.startsWith('http') ? fotoVehiculoUrl : `${BACKEND_BASE_URL}${fotoVehiculoUrl}`) : null);
                        if (currentVehFullUrl) setFotoZoomUrl(currentVehFullUrl);
                        else setIsVehiculoCameraOpen(true);
                    }}
                  >
                    <div className="relative w-20 h-20 lg:w-24 lg:h-24 transition-all duration-500 group-hover:scale-105">
                      <div className={`absolute inset-0 rounded-3xl blur-2xl opacity-10 transition-all duration-500 ${(fotoVehiculoBase64 || fotoVehiculoUrl) ? 'bg-indigo-500' : 'bg-slate-400 group-hover:bg-indigo-400'}`}></div>
                      <div className={`relative w-full h-full border-2 rounded-3xl flex items-center justify-center overflow-hidden bg-slate-50 transition-all duration-300 ${(fotoVehiculoBase64 || fotoVehiculoUrl) ? 'border-indigo-400 rotate-2' : 'border-slate-100 group-hover:border-indigo-200 group-hover:-rotate-1'}`}>
                        {fotoVehiculoBase64 ? (
                          <img src={fotoVehiculoBase64} alt="Vehículo" className="w-full h-full object-cover" />
                        ) : fotoVehiculoUrl ? (
                          <img src={fotoVehiculoUrl.startsWith('http') ? fotoVehiculoUrl : `${BACKEND_BASE_URL}${fotoVehiculoUrl}`} alt="Vehículo" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-10 lg:w-12 h-10 lg:h-12 text-slate-200 group-hover:text-indigo-300 transition duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.218A2 2 0 0110.125 4h3.75a2 2 0 011.664.89l.812 1.218A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {isVehiculoBloqueado && (
                <div className="bg-rose-50 text-rose-800 p-3 rounded-2xl shadow-sm border border-rose-100 animate-in slide-in-from-top duration-300 mb-1 flex-shrink-0 relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl animate-pulse">🛑</div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 leading-tight">Acceso Denegado</p>
                      <p className="text-[11px] font-bold leading-tight mt-0.5">"{motivoBloqueoVehiculo}"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Campos del vehículo */}
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 flex flex-col gap-2.5">
                <div className="relative">
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
                    className={`input-standard !p-3 !text-sm !font-black !uppercase ${
                      isVehiculoBloqueado ? '!border-rose-300 !bg-rose-50 !text-rose-900 !ring-rose-500/10' :
                      camposErrores.includes("placa") ? '!border-rose-500 !bg-rose-50 !ring-rose-500/10' : 
                      anotacionesVehiculoAlerta.length > 0 ? '!border-amber-300 !bg-amber-50 !text-amber-900 !ring-amber-400/20' : ''
                    }`}
                  />
                  {(anotacionesVehiculoAlerta.length > 0 || isVehiculoBloqueado) && (
                    <button
                      onClick={() => setIsVehiculoTimelineOpen(true)}
                      className={`absolute right-3 top-2.5 p-1 rounded-lg shadow-lg transition-all ${isVehiculoBloqueado ? 'bg-rose-600 animate-bounce' : 'bg-amber-500 animate-pulse'}`}
                    >
                      <span className="text-[12px]">{isVehiculoBloqueado ? "🚫" : "⚠️"}</span>
                    </button>
                  )}
                </div>

                <div className="relative group/select">
                  <select
                    ref={tipoVehiculoRef}
                    value={tipoVehiculo}
                    onChange={(e) => {
                      setTipoVehiculo(e.target.value);
                      setCamposErrores(prev => prev.filter(err => err !== "tipoVehiculo"));
                    }}
                    className={`input-standard appearance-none cursor-pointer ${
                      camposErrores.includes("tipoVehiculo") ? '!border-rose-500 !bg-rose-50 !text-rose-900' : ''
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
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400 group-hover/select:text-indigo-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
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
                  className={`input-standard ${camposErrores.includes("marca") ? '!border-rose-500 !bg-rose-50' : ''}`}
                />

                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    ref={modeloRef}
                    type="text"
                    placeholder="Modelo"
                    value={modelo}
                    onChange={(e) => {
                      setModelo(e.target.value);
                      setCamposErrores(prev => prev.filter(err => err !== "modelo"));
                    }}
                    className={`input-standard ${camposErrores.includes("modelo") ? '!border-rose-500 !bg-rose-50' : ''}`}
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
                    className={`input-standard ${camposErrores.includes("color") ? '!border-rose-500 !bg-rose-50' : ''}`}
                  />
                </div>

                {/* Botones de Entrada/Salida para Vehículo */}
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    onClick={() => handleRegistrarVehiculo("entrada")}
                    disabled={!!registroVehiculoActivo || isVehiculoBloqueado || isVehiculoNuevo}
                    className={`btn-success !py-3 !text-[9px] ${
                      (registroVehiculoActivo || isVehiculoBloqueado || isVehiculoNuevo) && '!bg-slate-100 !text-slate-300 !border-slate-100 !shadow-none'
                    }`}
                  >
                    {isVehiculoBloqueado ? "🚫 BLOQUEO" : !!isVehiculoNuevo ? "⚠️ NUEVO" : "📥 ENTRADA"}
                  </button>
                  <button
                    onClick={() => handleRegistrarVehiculo("salida")}
                    disabled={!registroVehiculoActivo}
                    className={`btn-danger !py-3 !text-[9px] ${
                      !registroVehiculoActivo && '!bg-slate-100 !text-slate-300 !border-slate-100 !shadow-none'
                    }`}
                  >
                    📤 SALIDA
                  </button>
                </div>

                <button
                  onClick={() => router.push('/registros-vehiculos')}
                  className="btn-secondary !w-full !mt-1 !py-3 !text-[9px] !tracking-[0.2em]"
                >
                  <span className="text-lg">📜</span>
                  Historial de Vehículos
                </button>
              </div>
            </div>

            {/* ── Bloque Reloj / Fecha ── */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] p-5 flex flex-col items-center justify-center gap-1.5 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-indigo-50/30 -translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
              {mounted ? (
                <>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-tight relative z-10">
                    {fechaHora.toLocaleDateString("es-CO", { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <div className="flex items-baseline gap-1 mt-1 relative z-10">
                    <p className="text-5xl font-black text-indigo-600 tracking-tighter leading-none drop-shadow-sm">
                      {fechaHora.toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </p>
                    <span className="text-2xl font-black text-indigo-300 animate-pulse">:{fechaHora.getSeconds().toString().padStart(2, '0')}</span>
                  </div>
                </>
              ) : (
                <div className="animate-pulse flex flex-col items-center gap-2">
                  <div className="h-2.5 w-28 bg-slate-100 rounded-full"></div>
                  <div className="h-10 w-40 bg-slate-100 rounded-full"></div>
                </div>
              )}
            </div>

          </div>{/* fin sección derecha */}

          {/* ══════════════════════════════════════════
              SECCIÓN IZQUIERDA: Formulario Persona + Acciones
          ══════════════════════════════════════════ */}
          <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_8px_40px_rgb(0,0,0,0.04)] p-5 lg:p-7 lg:overflow-hidden min-h-0 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-40"></div>
            
            {/* Cabecera: Título izq + Foto derecha */}
            <div className="flex items-center gap-4 mb-4 flex-shrink-0 relative z-10">

              {/* Título — izquierda */}
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <h2 className="text-base lg:text-lg font-black text-slate-900 flex items-center gap-3 tracking-tight uppercase">
                  <div className="p-2.5 bg-indigo-600 rounded-2xl text-white flex-shrink-0 shadow-lg shadow-indigo-200 rotate-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  </div>
                  Registro de Persona
                </h2>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.3em] hidden lg:block">
                  {fotoBase64 ? 'Fotografía capturada con éxito' : 'Diligencie la información básica'}
                </p>
              </div>

              {/* Foto persona — derecha */}
              <div className="flex items-center gap-4">
                <div
                  className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                  onClick={() => {
                      const currentFullUrl = fotoBase64 || (fotoUrl ? (fotoUrl.startsWith('http') ? fotoUrl : `${BACKEND_BASE_URL}${fotoUrl}`) : null);
                      if (currentFullUrl) setFotoZoomUrl(currentFullUrl);
                      else setIsCameraOpen(true);
                  }}
                >
                  <div className="relative w-24 h-24 lg:w-28 lg:h-28 transition-all duration-500 group-hover:scale-105">
                    <div className={`absolute inset-0 rounded-[2.5rem] blur-2xl opacity-10 transition-all duration-500 ${(fotoBase64 || fotoUrl) ? 'bg-emerald-500' : 'bg-indigo-400 group-hover:bg-indigo-600'}`}></div>
                    <div className={`relative w-full h-full border-2 rounded-[2.5rem] flex items-center justify-center overflow-hidden bg-slate-50 transition-all duration-300 ${(fotoBase64 || fotoUrl) ? 'border-emerald-400 rotate-3 shadow-xl' : 'border-slate-100 group-hover:border-indigo-300'}`}>
                      {fotoBase64 ? (
                        <img src={fotoBase64} alt="Foto" className="w-full h-full object-cover" />
                      ) : fotoUrl ? (
                        <img src={fotoUrl.startsWith('http') ? fotoUrl : `${BACKEND_BASE_URL}${fotoUrl}`} alt="Foto" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-12 lg:w-14 h-12 lg:h-14 text-slate-200 group-hover:text-indigo-300 transition duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones Acciones Persona */}
                <div className="flex flex-col gap-2">
                  {(fotoBase64 || fotoUrl) && (
                    <>
                      <button
                        onClick={() => setIsCameraOpen(true)}
                        className="p-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90"
                        title="Cambiar foto"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.218A2 2 0 0110.125 4h3.75a2 2 0 011.664.89l.812 1.218A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      </button>
                      <button
                        onClick={() => { setFotoBase64(null); setFotoUrl(null); }}
                        className="p-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-90"
                        title="Eliminar foto"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Alerta bloqueo */}
            {isBloqueado && (
              <div className="bg-rose-50 text-rose-800 p-4 rounded-3xl shadow-sm border border-rose-100 animate-in slide-in-from-top duration-300 mb-4 flex-shrink-0 relative overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="text-3xl animate-pulse">🛑</div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-600">Alerta de Seguridad</p>
                    <p className="text-sm font-black mt-1">Persona Bloqueada: "{motivoBloqueo}"</p>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 text-7xl opacity-[0.03] text-rose-900 font-black rotate-[-10deg]">BLOCK</div>
              </div>
            )}

            {/* Campos optimizados en grid de 3 columnas para PC */}
            <div className="flex-1 overflow-y-auto lg:overflow-visible custom-scrollbar min-h-0 pr-1 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-2">

                {/* Identificación */}
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <span className="absolute left-3.5 top-2.5 text-[9px] text-indigo-500 font-black uppercase tracking-widest z-10">Documento</span>
                  <input
                    ref={identificacionRef}
                    type="text"
                    value={identificacion}
                    onChange={(e) => {
                      setIdentificacion(e.target.value.replace(/[^0-9]/g, ""));
                      setCamposErrores(prev => prev.filter(err => err !== "identificacion"));
                    }}
                    onBlur={handleBuscar}
                    className={`input-standard !pt-7 !font-black !text-base ${
                      isBloqueado ? '!border-rose-300 !bg-rose-50 !text-rose-900 !ring-rose-500/10' :
                      camposErrores.includes("identificacion") ? '!border-rose-500 !bg-rose-50 !ring-rose-500/10' :
                      anotacionesAlerta.length > 0 ? '!border-amber-300 !bg-amber-50 !text-amber-900 !ring-amber-400/20' : ''
                    }`}
                  />
                  {(anotacionesAlerta.length > 0 || isBloqueado) && (
                    <button
                      onClick={() => setIsTimelineOpen(true)}
                      className={`absolute right-3 top-3.5 p-1.5 rounded-xl shadow-lg transition-all ${isBloqueado ? 'bg-rose-600 animate-bounce' : 'bg-amber-500 animate-pulse'}`}
                    >
                      <span className="text-[14px]">{isBloqueado ? "🚫" : "⚠️"}</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest px-2">Nombres</span>
                  <input 
                    ref={nombresRef}
                    type="text" 
                    placeholder="Escriba aquí" 
                    value={nombres} 
                    onChange={(e) => {
                      setNombres(e.target.value);
                      setCamposErrores(prev => prev.filter(err => err !== "nombres"));
                    }}
                    className={`input-standard ${camposErrores.includes("nombres") ? '!border-rose-500 !bg-rose-50' : ''}`} />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest px-2">Apellidos</span>
                  <input 
                    ref={apellidosRef}
                    type="text" 
                    placeholder="Escriba aquí" 
                    value={apellidos} 
                    onChange={(e) => {
                      setApellidos(e.target.value);
                      setCamposErrores(prev => prev.filter(err => err !== "apellidos"));
                    }}
                    className={`input-standard ${camposErrores.includes("apellidos") ? '!border-rose-500 !bg-rose-50' : ''}`} />
                </div>

                <input type="text" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/[^0-9]/g, ""))}
                  className="input-standard" />

                <input type="text" placeholder="Cargo u Oficio (Opcional)" value={cargo} onChange={(e) => setCargo(e.target.value)}
                  className="input-standard" />

                <input 
                  ref={destinoRef}
                  type="text" 
                  placeholder="Destino" 
                  value={destino} 
                  onChange={(e) => {
                    setDestino(e.target.value);
                    setCamposErrores(prev => prev.filter(err => err !== "destino"));
                  }}
                  className={`input-standard ${camposErrores.includes("destino") ? '!border-rose-500 !bg-rose-50' : ''}`} />

                <div className="relative group/select">
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)} disabled={loadingTipos || tipos.length === 0}
                    className="input-standard appearance-none cursor-pointer">
                    {tipos.length > 0 ? tipos.map(t => <option key={t.id} value={t.nombre.toLowerCase()}>{t.nombre}</option>) : <option value="">{loadingTipos ? "Cargando..." : "Sin tipos"}</option>}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400 group-hover/select:text-indigo-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-2 relative">
                  <textarea 
                    ref={motivoRef}
                    placeholder="Motivo de ingreso..." 
                    value={motivo} 
                    onChange={(e) => {
                      setMotivo(e.target.value);
                      setCamposErrores(prev => prev.filter(err => err !== "motivo"));
                    }}
                    maxLength={250}
                    className={`input-standard resize-none min-h-[48px] ${
                      camposErrores.includes("motivo") ? '!border-rose-500 !bg-rose-50' : ''
                    }`}
                    rows={1} 
                  />
                  <div className="absolute right-3 bottom-2 text-[8px] font-black text-slate-300 pointer-events-none uppercase">
                    {motivo.length}/250
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción (fijos abajo) */}
            <div className="flex-shrink-0 pt-5 mt-2 border-t border-slate-100 flex flex-col gap-3 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleRegistrar("entrada")}
                  disabled={isBloqueado || isVehiculoBloqueado || !!registroActivo}
                  className={`btn-success !py-4 !text-xs ${
                    (isBloqueado || isVehiculoBloqueado || !!registroActivo) && '!bg-slate-100 !text-slate-300 !border-slate-100 !shadow-none'
                  }`}
                >
                  {isBloqueado ? "🚫 BLOQUEADO" : "✅ REGISTRAR ENTRADA"}
                </button>
                <button
                  onClick={() => handleRegistrar("salida")}
                  disabled={!registroActivo}
                  className={`btn-danger !py-4 !text-xs ${
                    !registroActivo && '!bg-slate-100 !text-slate-300 !border-slate-100 !shadow-none'
                  }`}
                >
                  🚪 REGISTRAR SALIDA
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleActualizarDatos}
                  className="btn-primary flex-1 !py-3 !bg-indigo-50 !text-indigo-600 !shadow-none !border-indigo-100 hover:!bg-indigo-600 hover:!text-white !text-[9px] !tracking-[0.2em]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  Sincronizar Información
                </button>
                <button
                  onClick={limpiarFormulario}
                  className="btn-secondary !px-5 !py-3 !text-[9px] !tracking-[0.2em]"
                  title="Limpiar Formulario"
                >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>

          </div>{/* fin sección izquierda */}

        </div>
      </div>
    </>
  );
}
