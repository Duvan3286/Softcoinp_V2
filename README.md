# 🛡️ SOFTCOINP - Sistema de Gestión y Auditoría de Seguridad (Elite v2.1.8)

**SOFTCOINP** es una plataforma integral de seguridad diseñada para la gestión de ingresos, control de personal activo, supervisión vehicular y auditoría detallada de operaciones administrativas. Esta versión **Elite** introduce una interfaz de usuario premium, personalización dinámica de marca y herramientas avanzadas de mantenimiento de datos.

---

## 🚀 Arquitectura del Proyecto

El sistema está construido siguiendo una arquitectura moderna de alto rendimiento:

### 🎨 Frontend (`/frontend-softcoinp`)
- **Framework:** [Next.js 14+](https://nextjs.org/) (App Router & Turbopack)
- **Lenguaje:** TypeScript (Tipado estricto para mayor robustez)
- **Estilos:** Tailwind CSS (Diseño "Glassmorphism" con animaciones fluidas)
- **UI/UX:** Componentes reactivos, Sidebar tipo "Drawer" inteligente y diseño 100% responsivo.
- **Estado Global:** React Context API & Hooks avanzados.
- **Cliente API:** Axios con interceptores para gestión automática de sesiones (JWT).

### ⚙️ Backend (`/Softcoinp.Backend`)
- **Framework:** [ASP.NET Core 8.0 Web API](https://dotnet.microsoft.com/)
- **Base de Datos:** PostgreSQL con Entity Framework Core.
- **Seguridad:** Autenticación y Autorización basada en Roles (RBAC) con **JSON Web Tokens (JWT)**.
- **Patrones:** Repository/Service, DTOs y Middlewares personalizados de auditoría.
- **API Documentation:** Swagger/OpenAPI integrada para pruebas rápidas.

---

## ✨ Funcionalidades Destacadas (v2.1.8-elite)

- **🏢 Personalización "White-Label":** Capacidad de cambiar dinámicamente el nombre de la institución (Identidad) y la versión del sistema desde el panel administrativo, reflejándose en tiempo real en Header, Sidebar, Login y Footers.
- **📊 Dashboard Administrativo:** Panel interactivo con métricas en tiempo real, búsqueda global rápida y visualización dual avanzada (Personas/Vehículos).
- **📋 Auditoría Integral (Bitácora):** Rastreo persistente de cada acción realizada (creaciones, ediciones, inicios de sesión, exportaciones), con nombres amigables en español y tallas de tiempo exactas.
- **🛠️ Mantenimiento Crítico:** Interfaz intuitiva para realizar backups en JSON, restauración completa del sistema y limpieza profunda de datos operativos con un solo clic.
- **🏷️ Gestión de Personal y Tipos:** Administrador de categorías de personal (Empleado, Visitante, Contratista, etc.) con estados (Activo/Inactivo).
- **📝 Registros y Novedades:** Formulario de ingreso inteligente con validaciones visuales, soporte para captura de fotos y sistema de alertas para personas con antecedentes de seguridad.

---

## 🛠️ Instalación y Configuración

### 📋 Requisitos Previos
- [Node.js](https://nodejs.org/) (v18 o superior)
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [PostgreSQL](https://www.postgresql.org/) (Instalado y en ejecución)

### ⚙️ Configuración del Backend
1. Navega a la carpeta `Softcoinp.Backend/`.
2. Actualiza la cadena de conexión en `appsettings.json` o `appsettings.Development.json`.
3. Ejecuta las migraciones para preparar la base de datos:
   ```bash
   dotnet ef database update
   ```
4. Inicia el servidor API:
   ```bash
   dotnet run
   ```

### 🎨 Configuración del Frontend
1. Navega a la carpeta `frontend-softcoinp/`.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el entorno de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre [http://localhost:3000](http://localhost:3000) para acceder al sistema.

---

## 🧹 Mantenimiento de Base de Datos

El sistema está diseñado para facilitar el mantenimiento preventivo y correctivo desde la interfaz de **Mantenimiento Crítico** dentro de Configuraciones.

### Acciones Disponibles:
- **🗃️ Deep Clean & Seed:** Borra todos los datos (Personal, Auditoría, Registros) y restaura el usuario maestro (`admin@local` / `Admin123`) y configuraciones base. 
- **💾 Exportar Backup:** Genera un archivo JSON descargable con el estado actual de toda la base de datos.
- **🔄 Restaurar Sistema:** Permite cargar un archivo JSON de respaldo para sobrescribir y recuperar el sistema al estado anterior.
- **🗑️ Limpieza Operativa:** Elimina los movimientos históricos (entradas/salidas) pero mantiene al personal y las cuentas de usuario intactas.

---
© 2026 SOFTCOINP - Sistema de Control y Auditoría Elite v2.1.8
