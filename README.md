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
