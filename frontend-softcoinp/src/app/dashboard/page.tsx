"use client";

import { useState, useEffect, useRef, memo } from "react";
import api from "@/services/api";
import { useRouter } from "next/navigation";
import CameraCapture from "@/components/CameraCapture";
import { tipoService, TipoPersonal } from "@/services/tipoService";
import { anotacionService, AnotacionDto } from "@/services/anotacionService";
import { registroVehiculoService } from "@/services/registroVehiculoService";
import CustomModal, { ModalType } from "@/components/CustomModal";
import { getCurrentUser, UserPayload } from "@/utils/auth";
import ImageZoomModal from "@/components/ImageZoomModal";
import { useTheme } from "next-themes";
import { 
  Car, 
  Ban, 
  AlertTriangle, 
  LogIn, 
  LogOut, 
  ScrollText, 
  UserCheck, 
  Camera, 
  Trash2, 
  RefreshCw,
  Calendar,
  X,
  UserCircle,
  Search,
  User
} from "lucide-react";

// URL base del backend para recursos estáticos (fotos)
const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5100/api")
  .replace(/\/api$/, "/static");

// ── Reloj extraído como componente independiente ──────────────────────────────
// Al estar separado, su setInterval de 1s sólo re-renderiza este pequeño
// componente y NO el formulario completo del dashboard.
const LiveClock = memo(function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!mounted) {
    return (
      <div className="animate-pulse flex flex-col items-center gap-2">
        <div className="h-2.5 w-28 bg-border rounded-full" />
        <div className="h-10 w-40 bg-border rounded-full" />
      </div>
    );
  }
  return (
    <>
      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.4em] leading-tight relative z-10">
        {now.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
      </p>
      <div className="flex items-baseline gap-1 mt-1 relative z-10">
        <p className="text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter leading-none drop-shadow-sm">
          {now.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </p>
        <span className="text-2xl font-black text-emerald-500 dark:text-emerald-500/50 animate-pulse">
          :{now.getSeconds().toString().padStart(2, "0")}
        </span>
      </div>
    </>
  );
});

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

// Resuelve una URL de imagen (relativa o absoluta) a su URL completa.
// Ya NO se convierte a base64 — el browser carga las imágenes directamente
// desde la URL, lo que es ~10x más rápido y no bloquea el hilo de JS.
const resolveImageUrl = (url: string): string =>
  url.startsWith("http") ? url : `${BACKEND_BASE_URL}${url}`;

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
  const emailRef = useRef<HTMLInputElement>(null);

  const [identificacion, setIdentificacion] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState("visitante");
  const [cargo, setCargo] = useState("");
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");

  
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

  // 👨‍✈️ ESTADOS para el Conductor
  const [conductorOpcion, setConductorOpcion] = useState<"propietario" | "otro">("propietario");
  const [conductorId, setConductorId] = useState<string | null>(null);
  const [conductorNombre, setConductorNombre] = useState<string>("");
  const [busquedaConductor, setBusquedaConductor] = useState("");
  const [resultadosConductor, setResultadosConductor] = useState<any[]>([]);
  const [isSearchingConductor, setIsSearchingConductor] = useState(false);
  const [showSugerenciasConductor, setShowSugerenciasConductor] = useState(false);

  // ⚠️ Estado para validación visual
  const [camposErrores, setCamposErrores] = useState<string[]>([]);
  const [usuario, setUsuario] = useState<UserPayload | null>(null);
  const [fotoZoomUrl, setFotoZoomUrl] = useState<string | null>(null);

  const router = useRouter();
  const { resolvedTheme } = useTheme();

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

  // 🔍 Lógica de búsqueda de conductor
  useEffect(() => {
    const search = async () => {
      if (busquedaConductor.length < 2) {
        setResultadosConductor([]);
        return;
      }

      setIsSearchingConductor(true);
      try {
        const res = await api.get(`/personal/buscar-por-nombre`, {
          params: { termino: busquedaConductor }
        }) as any;
        setResultadosConductor(res.data?.data || []);
      } catch (err) {
        console.error("Error buscando conductor:", err);
      } finally {
        setIsSearchingConductor(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [busquedaConductor]);

  const handleSelectConductor = (persona: any) => {
    setConductorId(persona.id);
    setConductorNombre(`${persona.nombre} ${persona.apellido}`);
    setBusquedaConductor(`${persona.nombre} ${persona.apellido}`);
    setShowSugerenciasConductor(false);
  };

  useEffect(() => {
    setUsuario(getCurrentUser());
    // 🎯 Auto-focus en el campo de identificación al cargar
    setTimeout(() => {
      identificacionRef.current?.focus();
    }, 100);
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
    setTelefono("");
    setEmail("");
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
    setIsVehiculoTimelineOpen(false);

    // Conductor
    setConductorOpcion("propietario");
    setConductorId(null);
    setConductorNombre("");
    setBusquedaConductor("");
    setResultadosConductor([]);
    setShowSugerenciasConductor(false);
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
    setIsVehiculoTimelineOpen(false);

    // Conductor
    setConductorOpcion("propietario");
    setConductorId(null);
    setConductorNombre("");
    setBusquedaConductor("");
    setResultadosConductor([]);
    setShowSugerenciasConductor(false);
  };

  const validateEmail = (email: string) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

        // Validaciones específicas
        if (telefono && telefono.length !== 10) {
          setCamposErrores(["telefono"]);
          showModal("El teléfono debe tener exactamente 10 dígitos.", "error", "Error de Validación");
          return;
        }

        if (email && !validateEmail(email)) {
          setCamposErrores(["email"]);
          showModal("El formato del correo electrónico no es válido.", "error", "Error de Validación");
          return;
        }


        const missing = validation.filter(v => !v.value.trim());
        
        if (missing.length > 0) {
          setCamposErrores(missing.map(m => m.id));
          showModal(`🛑 Debe diligenciar los campos obligatorios: ${missing.map(m => `"${m.name}"`).join(", ")}`, "error");
          
          // Focus el primero que falte
          setTimeout(() => missing[0].ref.current?.focus(), 100);
          return;
        }

        if (!fotoBase64 && !fotoUrl) {
          showModal("🛑 Debe tomar una fotografía de la persona a registrar.", "error");
          return;
        }

        if (isVehiculoBloqueado) {
          showModal(`🛑 No se puede registrar la entrada. El vehículo seleccionado está BLOQUEADO. Motivo: ${motivoBloqueoVehiculo}`, "error");
          return;
        }

        if (conductorOpcion === "otro" && !conductorId && placa) {
          setCamposErrores(prev => [...prev, "conductor"]);
          showModal("🛑 Debe buscar y seleccionar un conductor registrado cuando elige la opción 'Otro' para el vehículo.", "error");
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
          email: email,
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
          conductorId: conductorOpcion === "otro" ? conductorId : null,
          conductorNombre: conductorOpcion === "otro" ? conductorNombre : null,
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
        await api.put(`/registros/${activeRegistroId}/salida`, {
          conductorSalidaId: conductorOpcion === "otro" ? conductorId : null,
          conductorSalidaNombre: conductorOpcion === "otro" ? conductorNombre : null
        });
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

        if (!fotoVehiculoBase64 && !fotoVehiculoUrl) {
          showModal("🛑 Debe tomar una fotografía del vehículo para el registro.", "error");
          return;
        }

        if (isVehiculoBloqueado) {
          showModal(`🛑 No se puede registrar la entrada. Este vehículo está BLOQUEADO. Motivo: ${motivoBloqueoVehiculo}`, "error");
          return;
        }

        if (conductorOpcion === "otro" && !conductorId) {
          setCamposErrores(prev => [...prev, "conductor"]);
          showModal("🛑 Debe buscar y seleccionar un conductor registrado cuando elige la opción 'Otro'.", "error");
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
          fotoVehiculo: fotoVehiculoBase64 || undefined,
          conductorId: conductorOpcion === "otro" ? (conductorId || undefined) : undefined,
          conductorNombre: conductorOpcion === "otro" ? (conductorNombre || undefined) : undefined
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

        await registroVehiculoService.registrarSalida(activeId, {
          conductorSalidaId: conductorOpcion === "otro" ? (conductorId || undefined) : undefined,
          conductorSalidaNombre: conductorOpcion === "otro" ? (conductorNombre || undefined) : undefined
        });
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

    // Validaciones específicas
    if (telefono && telefono.length !== 10) {
      setCamposErrores(["telefono"]);
      showModal("El teléfono debe tener exactamente 10 dígitos.", "error", "Error de Validación");
      return;
    }

    if (email && !validateEmail(email)) {
      setCamposErrores(["email"]);
      showModal("El formato del correo electrónico no es válido.", "error", "Error de Validación");
      return;
    }

    try {
      setLoadingTipos(true);
      await api.post("/registros/actualizar-datos", {
        nombre: nombres,
        apellido: apellidos,
        documento: identificacion,
        telefono: telefono,
        email: email,
        tipo,
        foto: fotoBase64,
        placa,
        marca,
        modelo,
        color,
        tipoVehiculo,
        fotoVehiculo: fotoVehiculoBase64,
      });

      const resumen = "✅ Información sincronizada correctamente.";
      showModal(resumen, "success");
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
    setEmail("");
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
    setFotoVehiculoUrl(null);
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

        setNombres(persona.nombre || "");
        setApellidos(persona.apellido || "");
        setTelefono(persona.telefono || "");
        setEmail(persona.email || "");
        setTipo(persona.tipo || "visitante");

        // 📸 Foto de la persona
        if (persona.fotoUrl) setFotoUrl(persona.fotoUrl);

        // 🚗 Autocompletar vehículo asociado si la persona tiene uno
        if (persona.placaVehiculo) {
          setPlaca(persona.placaVehiculo);
          setMarca(persona.marcaVehiculo || "");
          setModelo(persona.modeloVehiculo || "");
          setColor(persona.colorVehiculo || "");
          setTipoVehiculo(persona.tipoVehiculo || "");
          // Usar la foto del registro como placeholder inicial; se actualizará abajo
          if (persona.fotoVehiculoUrl) setFotoVehiculoUrl(persona.fotoVehiculoUrl);
        }

        // ✅ Lanzar TODAS las peticiones secundarias EN PARALELO
        const [activoRes, vehiculoData, activoVehRes, alertasPersona, alertasVehiculo] = await Promise.allSettled([
          // 1. ¿La persona tiene una entrada activa?
          api.get(`/registros/activo`, { params: { documento: identificacion } }),
          // 2. Datos actualizados del vehículo (foto, bloqueo, etc.)
          persona.placaVehiculo
            ? api.get(`/vehiculos/placa/${persona.placaVehiculo}`)
            : Promise.resolve(null),
          // 3. ¿El vehículo asociado tiene una entrada activa?
          persona.placaVehiculo
            ? registroVehiculoService.getActivo(persona.placaVehiculo)
            : Promise.resolve(null),
          // 4. Anotaciones de seguridad de la persona
          persona.personalId
            ? anotacionService.getAnotacionesPorPersonal(persona.personalId)
            : Promise.resolve([]),
          // 5. Anotaciones de seguridad del vehículo
          persona.vehiculoId
            ? anotacionService.getAnotacionesPorVehiculo(persona.vehiculoId)
            : Promise.resolve([]),
        ]);

        // — Entrada activa de la PERSONA
        // api.get devuelve el objeto de axios, por lo que el cuerpo es .data y el objeto es .data.data
        const personActive = (activoRes.status === "fulfilled" ? activoRes.value : null) as any;
        if (personActive && personActive.data && personActive.data.data) {
          setRegistroActivo({ id: personActive.data.data.id });
        } else {
          setRegistroActivo(null);
        }

        // — Datos actualizados del VEHÍCULO (foto, bloqueo)
        const masterVehRes = (vehiculoData.status === "fulfilled" ? vehiculoData.value : null) as any;
        const vData = masterVehRes?.data?.data ? masterVehRes.data.data : masterVehRes?.data;

        if (vData) {
          // Sobreescribir con datos más frescos del vehículo
          if (vData.marca) setMarca(vData.marca);
          if (vData.modelo) setModelo(vData.modelo);
          if (vData.color) setColor(vData.color);
          if (vData.tipoVehiculo) setTipoVehiculo(vData.tipoVehiculo);
          if (vData.fotoUrl) setFotoVehiculoUrl(vData.fotoUrl);

          if (vData.isBloqueado) {
            setIsVehiculoBloqueado(true);
            setMotivoBloqueoVehiculo(vData.motivoBloqueo || "Motivo no especificado");
          } else {
            setIsVehiculoBloqueado(false);
            setMotivoBloqueoVehiculo("");
          }
        }

        // — Entrada activa del VEHÍCULO
        const activeVehResData = (activoVehRes.status === "fulfilled" ? activoVehRes.value : null) as any;
        const activeVehRecord = activeVehResData?.data; // El servicio ya devuelve .data, así que buscamos el objeto ahí

        if (activeVehRecord && activeVehRecord.id) {
          console.log("🚗 Vehículo detectado EN SITIO:", activeVehRecord.id);
          setRegistroVehiculoActivo({ id: activeVehRecord.id });
        } else {
          console.log("🚗 Vehículo detectado FUERA");
          setRegistroVehiculoActivo(null);
        }

        // — Anotaciones de seguridad
        if (alertasPersona.status === "fulfilled") setAnotacionesAlerta(alertasPersona.value as AnotacionDto[]);
        if (alertasVehiculo.status === "fulfilled") setAnotacionesVehiculoAlerta(alertasVehiculo.value as AnotacionDto[]);

        // Snapshot de datos originales
        setDatosOriginales({
          nombre: persona.nombre || "",
          apellido: persona.apellido || "",
          telefono: persona.telefono || "",
          email: persona.email || "",
          tipo: persona.tipo || "visitante",
          placa: persona.placaVehiculo || "",
          marca: persona.marcaVehiculo || "",
          modelo: persona.modeloVehiculo || "",
          color: persona.colorVehiculo || "",
          tipoVehiculo: persona.tipoVehiculo || "",
          fotoUrl: persona.fotoUrl || null,
          fotoVehiculoUrl: persona.fotoVehiculoUrl || null,
        });

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

    // Reset Conductor a Propietario al buscar placa
    setConductorOpcion("propietario");
    setConductorId(null);
    setConductorNombre("");
    setBusquedaConductor("");

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
        
        // 📸 Fotos: asignar URL directamente
        if (vehiculo.fotoUrl) setFotoVehiculoUrl(vehiculo.fotoUrl);

        // Lanzar peticiones secundarias EN PARALELO
        const [vAlertas, activoVeh, alertasPropietario] = await Promise.allSettled([
          anotacionService.getAnotacionesPorVehiculo(vehiculo.id),
          registroVehiculoService.getActivo(placa.trim()),
          vehiculo.propietarioId
            ? anotacionService.getAnotacionesPorPersonal(vehiculo.propietarioId)
            : Promise.resolve([]),
        ]);

        if (vAlertas.status === "fulfilled") setAnotacionesVehiculoAlerta(vAlertas.value as AnotacionDto[]);

        const activoVehResult = (activoVeh.status === "fulfilled" ? activoVeh.value : null) as any;
        if (activoVehResult && activoVehResult.data) {
          console.log("🚗 Placa detectada EN SITIO:", activoVehResult.data.id);
          setRegistroVehiculoActivo({ id: activoVehResult.data.id });
        } else {
          setRegistroVehiculoActivo(null);
        }

        if (!identificacion) {
          setIdentificacion(vehiculo.propietarioDocumento || "");
          setNombres(vehiculo.propietarioNombre || "");
          setApellidos(vehiculo.propietarioApellido || "");
          setTelefono(vehiculo.propietarioTelefono || "");
          setEmail(vehiculo.propietarioEmail || "");
          setTipo(vehiculo.propietarioTipo || "visitante");
          if (vehiculo.propietarioFotoUrl) setFotoUrl(vehiculo.propietarioFotoUrl);
          if (alertasPropietario.status === "fulfilled") setAnotacionesAlerta(alertasPropietario.value as AnotacionDto[]);
        }

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
          fotoUrl: vehiculo.propietarioFotoUrl || null,
          fotoVehiculoUrl: vehiculo.fotoUrl || null,
        });
      }
    } catch (err: any) {
       setIsVehiculoBloqueado(false);
       setMotivoBloqueoVehiculo("");
       if (err.response?.status === 404) {
         setIsVehiculoNuevo(true);
         showModal("⚠️ Vehículo Nuevo. Por normas de seguridad, debe registrar los datos del conductor en el panel izquierdo para vincularlo como propietario o conductor frecuente la primera vez.", "warning");
       }
    }
  };

  const TimelineModal = ({ isOpen, onClose, anotaciones, nombre }: any) => {
    if (!isOpen) return null;

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" || e.key === "Enter") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] transform animate-in zoom-in slide-in-from-bottom-8 duration-500 border border-border transition-colors">
          
          <div className="bg-card px-5 py-3 border-b border-border flex justify-between items-center bg-gradient-to-r from-red-50/50 dark:from-red-900/20 to-transparent transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-red-600 rounded-full"></div>
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Antecedentes: {nombre}
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 dark:text-slate-500 hover:text-red-600 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto bg-background custom-scrollbar">
            <div className="space-y-4 relative before:content-[''] before:absolute before:left-[11px] before:top-0 before:bottom-0 before:w-0.5 before:bg-red-100 dark:before:bg-red-900/30">
              {anotaciones.map((a: any) => (
                <div key={a.id} className="relative pl-8">
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-card border-4 border-red-500 shadow-sm z-10" />
                  <div className="bg-card rounded-xl p-4 border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> {new Date(a.fechaCreacionUtc).toLocaleString("es-CO", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {a.registradoPorEmail && (
                        <span className="text-[9px] text-red-600 font-bold uppercase tracking-widest">{a.registradoPorEmail.split('@')[0]}</span>
                      )}
                    </div>
                    <p className="text-xs text-foreground font-bold uppercase tracking-tight opacity-80">{a.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 px-5 flex gap-2 mt-auto border-t border-border bg-background transition-colors">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md transition-all active:scale-[0.98] dark:shadow-none"
            >
              Entendido
            </button>
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

      <div style={{ zoom: '0.9' }} className="flex-1 w-full flex flex-col relative z-0 lg:overflow-hidden bg-background transition-colors duration-300">
        
        <div className="flex flex-col-reverse lg:flex-row-reverse gap-4 flex-1 min-h-0 w-full max-w-[1700px] mx-auto p-3 lg:p-4 overflow-y-auto lg:overflow-hidden">

          {/* ══════════════════════════════════════════
              SECCIÓN DERECHA: Reloj + Vehículo
          ══════════════════════════════════════════ */}
          <div className="w-full lg:w-96 xl:w-[26rem] flex flex-col gap-3 flex-shrink-0">

            {/* ── Bloque Vehículo ── */}
            <div className="flex-1 bg-card rounded-xl border border-border shadow-sm p-4 lg:p-5 flex flex-col gap-3 lg:overflow-hidden relative transition-colors duration-300">
              <div className="flex items-center gap-3 mb-2 flex-shrink-0">
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <h3 className="text-sm lg:text-base font-black text-foreground flex items-center gap-2 tracking-tight uppercase">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex-shrink-0 shadow-sm">
                      <Car className="w-5 h-5" />
                    </div>
                    Vehículo
                  </h3>
                  <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-tighter hidden lg:block">
                    {(fotoVehiculoBase64 || fotoVehiculoUrl) ? 'Capturado' : 'Pendiente'}
                  </p>
                </div>

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
                      <div className={`absolute inset-0 rounded-xl blur-2xl opacity-10 transition-all duration-500 ${(fotoVehiculoBase64 || fotoVehiculoUrl) ? 'bg-emerald-500' : 'bg-slate-400 group-hover:bg-emerald-400'}`}></div>
                      <div className={`relative w-full h-full border border-border rounded-xl flex items-center justify-center overflow-hidden bg-background transition-all duration-300 ${(fotoVehiculoBase64 || fotoVehiculoUrl) ? 'border-emerald-500' : 'border-border dark:border-zinc-800 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'}`}>
                        {fotoVehiculoBase64 ? (
                          <img src={fotoVehiculoBase64} alt="Vehículo" className="w-full h-full object-cover" />
                        ) : fotoVehiculoUrl ? (
                          <img src={resolveImageUrl(fotoVehiculoUrl)} alt="Vehículo" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-10 lg:w-12 h-10 lg:h-12 text-slate-300 dark:text-zinc-700 group-hover:text-emerald-300 transition duration-300" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 🆕 BOTONES DE ACCIÓN PARA FOTO VEHÍCULO */}
                  <div className="flex flex-col gap-2 ml-1">
                    {(fotoVehiculoBase64 || fotoVehiculoUrl) && (
                      <>
                        <button
                          onClick={() => setIsVehiculoCameraOpen(true)}
                          className="p-2 bg-card border border-border rounded-xl shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-90"
                          title="Cambiar foto de vehículo"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setFotoVehiculoBase64(null); setFotoVehiculoUrl(null); }}
                          className="p-2 bg-card border border-border rounded-xl shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-90"
                          title="Eliminar foto de vehículo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {isVehiculoBloqueado && (
                <div className="bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 p-3 rounded-xl shadow-sm border border-red-100 dark:border-red-900/50 animate-in slide-in-from-top duration-300 mb-1 flex-shrink-0 relative overflow-hidden transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-red-500 animate-pulse"><Ban className="w-8 h-8" /></div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 leading-tight">Acceso Denegado</p>
                      <p className="text-[11px] font-bold leading-tight mt-0.5">"{motivoBloqueoVehiculo}"</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 flex flex-col gap-2.5 transition-colors">
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBuscarPlaca();
                      }
                    }}
                    className="input-standard !p-3 !text-sm !font-black !uppercase"
                  />
                  {(anotacionesVehiculoAlerta.length > 0 || isVehiculoBloqueado) && (
                    <button
                      onClick={() => setIsVehiculoTimelineOpen(true)}
                      className={`absolute right-3 top-2.5 p-1 text-white rounded-lg shadow-lg transition-all ${isVehiculoBloqueado ? 'bg-red-600 animate-bounce' : 'bg-amber-500 animate-pulse'}`}
                    >
                      {isVehiculoBloqueado ? <Ban className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
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
                    className="input-standard appearance-none cursor-pointer"
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
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400 group-hover/select:text-emerald-500 transition-colors">
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
                  className="input-standard"
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
                    className="input-standard"
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
                    className="input-standard"
                  />
                </div>

                {/* 👨‍✈️ SECCIÓN CONDUCTOR (Movida a sección vehículo) */}
                <div className="mt-1 p-3 bg-slate-50/80 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCircle className="w-3.5 h-3.5 text-indigo-500" />
                      Conducido por:
                    </span>
                    <div className="flex bg-slate-200/50 dark:bg-zinc-700/50 p-0.5 rounded-lg">
                      <button
                        onClick={() => {
                          setConductorOpcion("propietario");
                          setConductorId(null);
                          setConductorNombre("");
                          setBusquedaConductor("");
                        }}
                        className={`px-3 py-1 text-[9px] font-bold uppercase rounded-md transition-all ${
                          conductorOpcion === "propietario" 
                            ? "bg-white dark:bg-zinc-600 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                      >
                        Propietario
                      </button>
                      <button
                        onClick={() => setConductorOpcion("otro")}
                        className={`px-3 py-1 text-[9px] font-bold uppercase rounded-md transition-all ${
                          conductorOpcion === "otro" 
                            ? "bg-white dark:bg-zinc-600 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                            : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                      >
                        Otro
                      </button>
                    </div>
                  </div>

                  {conductorOpcion === "otro" && (
                    <div className="relative">
                      <div className="relative group">
                        <Search className={`absolute left-3 top-2.5 w-3.5 h-3.5 transition-colors ${busquedaConductor ? 'text-indigo-500' : 'text-slate-400'}`} />
                        <input
                          type="text"
                          placeholder="Buscar conductor..."
                          value={busquedaConductor}
                          onChange={(e) => {
                            setBusquedaConductor(e.target.value);
                            setShowSugerenciasConductor(true);
                          }}
                          onFocus={() => setShowSugerenciasConductor(true)}
                          className={`input-standard !p-2 !pl-9 !text-[11px] ${
                            camposErrores.includes("conductor") ? "border-red-500 bg-red-50" : ""
                          }`}
                        />
                        {isSearchingConductor && (
                          <div className="absolute right-3 top-2.5">
                            <div className="w-3.5 h-3.5 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                          </div>
                        )}
                      </div>

                      {showSugerenciasConductor && resultadosConductor.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          {resultadosConductor.map((persona) => (
                            <button
                              key={persona.id}
                              onClick={() => handleSelectConductor(persona)}
                              className="w-full p-2.5 hover:bg-slate-50 dark:hover:bg-zinc-700/50 flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-zinc-700 last:border-0"
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-700 flex-shrink-0 overflow-hidden border border-slate-200 dark:border-zinc-600">
                                {persona.fotoUrl ? (
                                  <img src={`${api.defaults.baseURL?.replace('/api', '')}${persona.fotoUrl}`} alt="Foto" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                     <User className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                              <div className="text-left overflow-hidden">
                                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                  {persona.nombre} {persona.apellido}
                                </div>
                                <div className="text-[9px] text-slate-500 font-medium">
                                  CC: {persona.documento}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2 transition-colors">
                  <button
                    onClick={() => handleRegistrarVehiculo("entrada")}
                    disabled={!!registroVehiculoActivo || isVehiculoBloqueado || isVehiculoNuevo}
                    className={`btn-success !py-3 !text-[9px] ${
                      (registroVehiculoActivo || isVehiculoBloqueado || isVehiculoNuevo) && '!bg-slate-100 dark:!bg-zinc-800 !text-slate-300 dark:!text-zinc-600 !border-border dark:!border-zinc-800 !shadow-none'
                    }`}
                  >
                    {isVehiculoBloqueado ? <><Ban className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" /> BLOQUEO</> : !!isVehiculoNuevo ? <><AlertTriangle className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" /> NUEVO</> : <><LogIn className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" /> ENTRADA</>}
                  </button>
                  <button
                    onClick={() => handleRegistrarVehiculo("salida")}
                    disabled={!registroVehiculoActivo}
                    className={`btn-danger !py-3 !text-[9px] ${
                      !registroVehiculoActivo 
                        ? '!bg-slate-100 dark:!bg-zinc-800 !text-slate-300 dark:!text-zinc-600 !border-border dark:!border-zinc-800 !shadow-none' 
                        : '!bg-red-600 hover:!bg-red-700'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" /> SALIDA
                  </button>
                </div>


              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm p-5 flex flex-col items-center justify-center gap-1.5 text-center relative overflow-hidden group transition-colors duration-300">
              <div className="absolute inset-0 bg-emerald-50/10 dark:bg-emerald-950/5 -translate-y-full group-hover:translate-y-0 transition-transform duration-700"></div>
              {/* LiveClock es un componente separado — su setInterval no re-renderiza el formulario */}
              <LiveClock />
            </div>

          </div>

          {/* ══════════════════════════════════════════
              SECCIÓN IZQUIERDA: Formulario Persona + Acciones
          ══════════════════════════════════════════ */}
          <div className="flex-1 flex flex-col bg-card rounded-xl border border-border shadow-sm p-4 lg:p-6 lg:overflow-hidden min-h-0 relative transition-colors duration-300">
            
            <div className="flex items-center gap-4 mb-4 flex-shrink-0 relative z-10">
              <div className="flex flex-col justify-center flex-1 min-w-0">
                <h2 className="text-base lg:text-lg font-black text-foreground flex items-center gap-3 tracking-tight uppercase">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex-shrink-0 shadow-sm">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  Registro de Persona
                </h2>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-[0.3em] hidden lg:block">
                  {(fotoBase64 || fotoUrl) ? 'Fotografía vinculada con éxito' : 'Diligencie la información básica'}
                </p>
              </div>

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
                    <div className={`absolute inset-0 rounded-xl blur-2xl opacity-10 transition-all duration-500 ${(fotoBase64 || fotoUrl) ? 'bg-emerald-500' : 'bg-emerald-400 group-hover:bg-emerald-600'}`}></div>
                    <div className={`relative w-full h-full border border-border rounded-xl flex items-center justify-center overflow-hidden bg-background transition-all duration-300 ${(fotoBase64 || fotoUrl) ? 'border-emerald-500 shadow-none' : 'border-border dark:border-zinc-800 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'}`}>
                      {fotoBase64 ? (
                        <img src={fotoBase64} alt="Foto" className="w-full h-full object-cover" />
                      ) : fotoUrl ? (
                        <img src={resolveImageUrl(fotoUrl)} alt="Foto" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-10 lg:w-12 h-10 lg:h-12 text-slate-300 dark:text-zinc-700 group-hover:text-emerald-300 transition duration-500" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {(fotoBase64 || fotoUrl) && (
                    <>
                      <button
                        onClick={() => setIsCameraOpen(true)}
                        className="p-2.5 bg-card border border-border rounded-xl shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all active:scale-90"
                        title="Cambiar foto"
                      >
                         <Camera className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => { setFotoBase64(null); setFotoUrl(null); }}
                        className="p-2.5 bg-card border border-border rounded-xl shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-90"
                        title="Eliminar foto"
                      >
                         <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {isBloqueado && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 p-4 rounded-xl shadow-sm border border-red-100 dark:border-red-900/50 animate-in slide-in-from-top duration-300 mb-4 flex-shrink-0 relative overflow-hidden transition-colors">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="text-red-500 animate-pulse"><Ban className="w-10 h-10" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 dark:text-red-400">Alerta de Seguridad</p>
                    <p className="text-sm font-black mt-1">Persona Bloqueada: "{motivoBloqueo}"</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 pr-1 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-2 transition-colors">
                <div className="relative sm:col-span-2 lg:col-span-1">
                  <span className="absolute left-3.5 top-2.5 text-[9px] text-emerald-500 dark:text-emerald-400 font-black uppercase tracking-widest z-10">Documento</span>
                  <input
                    ref={identificacionRef}
                    type="text"
                    value={identificacion}
                    onChange={(e) => {
                      setIdentificacion(e.target.value.replace(/[^0-9]/g, "").slice(0, 10));
                      setCamposErrores(prev => prev.filter(err => err !== "identificacion"));
                    }}
                    maxLength={10}
                    onBlur={handleBuscar}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBuscar();
                      }
                    }}
                    className="input-standard !pt-7 !font-black !text-base"
                  />
                  {(anotacionesAlerta.length > 0 || isBloqueado) && (
                    <button
                      onClick={() => setIsTimelineOpen(true)}
                      className={`absolute right-3 top-3.5 p-1.5 text-white rounded-xl shadow-lg transition-all ${isBloqueado ? 'bg-red-600 animate-bounce' : 'bg-amber-500 animate-pulse'}`}
                    >
                      {isBloqueado ? <Ban className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest px-2">Nombres</span>
                  <input 
                    ref={nombresRef}
                    type="text" 
                    placeholder="Escriba aquí" 
                    value={nombres} 
                    onChange={(e) => {
                      setNombres(e.target.value);
                      setCamposErrores(prev => prev.filter(err => err !== "nombres"));
                    }}
                    className="input-standard" />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest px-2">Apellidos</span>
                  <input 
                    ref={apellidosRef}
                    type="text" 
                    placeholder="Escriba aquí" 
                    value={apellidos} 
                    onChange={(e) => {
                      setApellidos(e.target.value);
                      setCamposErrores(prev => prev.filter(err => err !== "apellidos"));
                    }}
                    className="input-standard" />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest px-2">Teléfono</span>
                  <input type="text" placeholder="Solo 10 dígitos" value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                    maxLength={10}
                    className="input-standard" />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest px-2">Cargo</span>
                  <input type="text" placeholder="Opcional" value={cargo} onChange={(e) => setCargo(e.target.value)}
                    className="input-standard" />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest px-2">Correo Electrónico (Opcional)</span>
                  <input 
                    ref={emailRef}
                    type="email" 
                    placeholder="ejemplo@correo.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="input-standard" 
                  />
                </div>


                <div className="flex gap-2.5 mt-1">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest px-2">Destino</span>
                  <input 
                    ref={destinoRef}
                    type="text" 
                    placeholder="Oficina/Apto" 
                    value={destino} 
                    onChange={(e) => {
                      setDestino(e.target.value);
                      setCamposErrores(prev => prev.filter(err => err !== "destino"));
                    }}
                    className="input-standard" />
                </div>

                <div className="flex flex-col gap-1 relative group/select">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest px-2">Tipo Persona</span>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)} disabled={loadingTipos || tipos.length === 0}
                    className="input-standard appearance-none cursor-pointer">
                    {tipos.length > 0 ? tipos.map(t => <option key={t.id} value={t.nombre.toLowerCase()}>{t.nombre}</option>) : <option value="">{loadingTipos ? "Cargando..." : "Sin tipos"}</option>}
                  </select>
                  <div className="pointer-events-none absolute bottom-3.5 right-4 flex items-center text-slate-400 group-hover/select:text-emerald-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-2 flex flex-col gap-1 relative">
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest px-2">Motivo</span>
                  <textarea 
                    ref={motivoRef}
                    placeholder="Escriba el motivo del ingreso..." 
                    value={motivo} 
                    onChange={(e) => {
                      setMotivo(e.target.value);
                      setCamposErrores(prev => prev.filter(err => err !== "motivo"));
                    }}
                    maxLength={250}
                    className="input-standard resize-none min-h-[48px]"
                    rows={1} 
                  />
                  <div className="absolute right-3 bottom-2 text-[8px] font-black text-slate-400 dark:text-zinc-700 pointer-events-none uppercase">
                    {motivo.length}/250
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 pt-5 mt-2 border-t border-border flex flex-col gap-3 relative z-10 transition-colors">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleRegistrar("entrada")}
                  disabled={isBloqueado || isVehiculoBloqueado || !!registroActivo}
                  className={`btn-success !py-4 !text-xs ${
                    (isBloqueado || isVehiculoBloqueado || !!registroActivo) && '!bg-slate-100 dark:!bg-zinc-800 !text-slate-300 dark:!text-zinc-600 !border-border dark:!border-zinc-800 !shadow-none'
                  }`}
                >
                  {isBloqueado ? <><Ban className="w-4 h-4 inline-block mr-1 -mt-0.5" /> BLOQUEADO</> : <><LogIn className="w-4 h-4 inline-block mr-1 -mt-0.5" /> REGISTRAR ENTRADA</>}
                </button>
                <button
                  onClick={() => handleRegistrar("salida")}
                  disabled={!registroActivo}
                  className={`btn-danger !py-4 !text-xs ${
                    !registroActivo 
                      ? '!bg-slate-100 dark:!bg-zinc-800 !text-slate-300 dark:!text-zinc-600 !border-border dark:!border-zinc-800 !shadow-none' 
                      : '!bg-red-600 hover:!bg-red-700'
                  }`}
                >
                  <LogOut className="w-4 h-4 inline-block mr-1 -mt-0.5" /> REGISTRAR SALIDA
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleActualizarDatos}
                  className="btn-primary flex-1 !py-3 !bg-emerald-50 dark:!bg-emerald-950/20 !text-emerald-600 dark:!text-emerald-400 !shadow-none !border-emerald-100 dark:!border-emerald-900/50 hover:!bg-emerald-600 hover:!text-white !text-[9px] !tracking-[0.2em]"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sincronizar Información
                </button>
                <button
                  onClick={limpiarFormulario}
                  className="btn-secondary !px-5 !py-3 !text-[9px] !tracking-[0.2em]"
                  title="Limpiar Formulario"
                >
                   <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
