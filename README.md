# SOFTCOINP - Sistema de Gestión y Auditoría

SOFTCOINP es una plataforma integral diseñada para la gestión de ingresos, control de personal activo y auditoría detallada de operaciones administrativas.

## 🚀 Arquitectura del Proyecto

El sistema está dividido en dos componentes principales:

### 1. Frontend (`/frontend-softcoinp`)
- **Tecnología:** Next.js 14+ (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS (Diseño "Single-Page" sin scroll global)
- **Estado:** React Hooks & Context API
- **Cliente API:** Axios (Centralizado en `src/services/api.ts`)

### 2. Backend (`/Softcoinp.Backend`)
- **Tecnología:** ASP.NET Core 8.0 Web API
- **Base de Datos:** PostgreSQL con Entity Framework Core
- **Seguridad:** Autenticación JWT (JSON Web Tokens)
- **Patrones:** Repository/Service, DTOs, Middlewares personalizados

## ✨ Funcionalidades Principales

- **Dashboard:** Panel central con estadísticas en tiempo real y visualización de ingresos.
- **Gestión de Registros:** Control de entradas y salidas con soporte para captura de fotos.
- **Personal Activo:** Monitoreo en tiempo real de quién se encuentra en las instalaciones.
- **Reportes:** Módulo avanzado de consulta con exportación a Excel y CSV.
- **Auditoría (Bitácora):** Registro detallado de todas las acciones del sistema, incluyendo:
  - Nombres de usuario reales.
  - Acciones en español legible.
  - Filtros por acción y rango de fechas.
  - Extracción de detalles relevantes (ej: nombre de la persona afectada).
- **Configuración:** Administración de usuarios, tipos de personal y parámetros generales.

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

---
© 2026 SOFTCOINP - Sistema de Control y Auditoria
