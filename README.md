# SOFTCOINP - Sistema de Gestión y Auditoría

SOFTCOINP es una plataforma integral diseñada para la gestión de ingresos, control de personal activo y auditoría detallada de operaciones administrativas.

## 🚀 Arquitectura del Proyecto

El sistema está dividido en dos componentes principales:

### 1. Frontend (`/frontend-softcoinp`)
- **Tecnología:** Next.js 14+ (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS (Diseño adaptable de alto rendimiento)
- **Responsive:** Sidebar tipo "Drawer" en móviles y diseño optimizado para tablets/celulares.
- **Estado:** React Hooks & Context API (SidebarContext para navegación móvil)
- **Cliente API:** Axios (Centralizado en `src/services/api.ts`)

### 2. Backend (`/Softcoinp.Backend`)
- **Tecnología:** ASP.NET Core 8.0 Web API
- **Base de Datos:** PostgreSQL con Entity Framework Core
- **Seguridad:** Autenticación JWT (JSON Web Tokens)
- **Patrones:** Repository/Service, DTOs, Middlewares personalizados

## ✨ Funcionalidades Destacadas

- **Dashboard Inteligente:** Panel interactivo con reloj en tiempo real, búsqueda rápida y visualización dual (Persona/Vehículo).
- **Gestión de Registros (Entradas/Salidas):** 
  - Formulario unificado con validación avanzada (asistencia visual en rojo y auto-foco).
  - Soporte para **Captura de Fotos** mediante webcam para personal y vehículos.
  - Limpieza automática de campos sensibles ("Motivo" y "Destino") para garantizar datos precisos.
- **Control de Personal y Vehículos Activos:** Monitoreo en tiempo real de quién y qué vehículo se encuentra en las instalaciones.
- **Seguridad y Antecedentes:** Sistema de alertas para personas con novedades de seguridad, incluyendo un modal de línea de tiempo con historial detallado.
- **Reportes Avanzados:** Módulo de consulta con filtros por fecha, tipo y documento, con exportación a Excel y CSV.
- **Auditoría Integral (Bitácora):** Rastreo de cada acción realizada en el sistema con descripciones amigables en español y nombres de usuario.
- **Optimización de UX:** Navegación por teclado completa (soporte de tecla `Enter`), modales de retroalimentación inmediata y carga fluida de datos.
- **Diseño Responsive:** Interfaz adaptable que garantiza la visibilidad del sidebar y la usabilidad de los formularios incluso en dispositivos móviles pequeños.

## 🛠️ Instalación y Ejecución

### Requisitos Previos
- Node.js (v18+)
- .NET SDK (v8.0+)
- PostgreSQL Instalado y Corriendo

### Configuración del Backend
1. Entra a `Softcoinp.Backend/`.
2. Configura tu cadena de conexión en `appsettings.json`.
3. Ejecuta las migraciones: `dotnet ef database update`.
4. Inicia el servidor: `dotnet run`.

### Configuración del Frontend
1. Entra a `frontend-softcoinp/`.
2. Instala dependencias: `npm install`.
3. Inicia el entorno de desarrollo: `npm run dev`.
4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🧹 Mantenimiento de Base de Datos

El sistema incluye herramientas para realizar limpiezas controladas y reseteos globales de la información.

### Limpieza Profunda y Re-sembrado (Recomendado)
Este proceso elimina todos los datos operativos (Registros, Anotaciones, Auditoría y Personal) y restaura los valores iniciales del sistema.

#### Opción A: Desde PowerShell (Más Rápido)
Abre una terminal nueva (mientras el backend corre) y ejecuta:
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:5004/api/Maintenance/deep-clean-and-seed"
```

#### Opción B: Desde Swagger (Visual)
1. Ve a `http://localhost:5004/swagger/index.html`.
2. Busca la sección **Maintenance**.
3. Abre el POST de `deep-clean-and-seed`.
4. Dale a **Try it out** y luego a **Execute**.

#### Opción C: Desde Postman / Insomnia
- **Método:** `POST`
- **URL:** `http://localhost:5004/api/Maintenance/deep-clean-and-seed`

**Resultado del Proceso:**
- Base de datos vacía, con el usuario `admin@local` (Contraseña: `Admin123`) y los tipos de personal básicos (`Empleado`, `Visitante`) creados.

### Limpieza de Datos Operativos
Si solo deseas borrar los movimientos (entradas, salidas y reportes) pero conservar al personal creado y los usuarios:
- Ejecuta: `POST http://localhost:5004/api/Maintenance/clear-operational-data`

---
© 2026 SOFTCOINP - Sistema de Control y Auditoria
