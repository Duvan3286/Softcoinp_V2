# 🛡️ SOFTCOINP - Enterprise Access Control & Identity Management

**SOFTCOINP** es una solución integral de seguridad de grado empresarial diseñada para la gestión crítica de accesos, supervisión de personal activo, control vehicular y auditoría forense de operaciones. Desarrollado con tecnologías de vanguardia, ofrece una experiencia de usuario fluida con soporte nativo para temas dinámicos y personalización total de marca.

---

## 🏗️ Arquitectura y Stack Tecnológico

El sistema se basa en una arquitectura desacoplada de alto rendimiento (SPA + Web API):

### 🎨 Frontend (`/frontend-softcoinp`)
- **Core:** [Next.js 15+](https://nextjs.org/) con App Router y Turbopack.
- **Lenguaje:** TypeScript (Tipado estricto y seguridad en tiempo de compilación).
- **Estilos:** Tailwind CSS con arquitectura de variables semánticas para **Soporte de Modo Oscuro/Claro (Auto-Theme)**.
- **Gráficos:** Recharts para visualización analítica de datos en tiempo real.
- **Estado Global:** Context API & Hooks avanzados para gestión de sesiones y UI.
- **Gestión de Fechas:** Day.js con soporte de zonas horarias locales.

### ⚙️ Backend (`/Softcoinp.Backend`)
- **Core:** [ASP.NET Core 8.0 Web API](https://dotnet.microsoft.com/).
- **Persistencia:** PostgreSQL con Entity Framework Core (Code-First).
- **Seguridad:** Autenticación por Tokens **JWT** y sistema avanzado de **Permisos basados en Vistas (RBAC)**.
- **Arquitectura:** Patrón Repository/Service con transferencia de datos mediante DTOs.
- **Middleware:** Procesamiento centralizado de errores y auditoría automática de transacciones.

---

## 🚀 Módulos y Capacidades Clave

### 📊 Dashboard Analítico & Control
- Panel interactivo con métricas en tiempo real sobre flujos de entrada y salida.
- Búsqueda global inteligente de personas y vehículos.
- Registro de ingresos con soporte para **captura fotográfica en vivo** y detección de estados de bloqueo.

### 🌓 Interfaz Adaptativa (Dark Mode)
- Implementación integral de modo oscuro en todas las vistas (Dashboard, Reportes, Registros, Configuraciones).
- Sincronización automática con la preferencia del sistema o selección manual en el encabezado.

### 📦 Gestión de Correspondencia
- Sistema completo de recepción y entrega de paquetes y sobres.
- Seguimiento de estados (En Espera / Entregado) con firmas de recepción y bitácora de entrega.

### 🛡️ Seguridad y Permisos
- Configuración granular de acceso a nivel de vista para cada usuario.
- Control total sobre acciones administrativas (Exportación, Edición, Eliminación).
- Sistema de **Bloqueo Preventivo** para personas y vehículos con alertas visuales inmediatas.

### 📋 Mantenimiento y Auditoría Forense
- **Bitácora de Actividad:** Registro persistente de cada cambio, login o acción crítica realizada en el sistema.
- **Herramientas de Respaldo:** Exportación e importación de bases de datos completas en formato JSON.
- **Acciones Críticas:** Limpieza de datos operativos y restauración de configuración de fábrica (Deep Clean).

---

## 🛠️ Despliegue y Configuración

### Requisitos del Entorno
- [Node.js](https://nodejs.org/) (v18.x o superior)
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [PostgreSQL](https://www.postgresql.org/) (Instancia activa)

### Configuración del Servidor (API)
1.  Acceder a la carpeta `Softcoinp.Backend/`.
2.  Configurar el string de conexión `DefaultConnection` en `appsettings.json`.
3.  Aplicar esquema de base de datos:
    ```bash
    dotnet ef database update
    ```
4.  Iniciar servicio:
    ```bash
    dotnet run
    ```

### Configuración de la Interfaz (Frontend)
1.  Acceder a la carpeta `frontend-softcoinp/`.
2.  Instalar dependencias:
    ```bash
    npm install
    ```
3.  Ejecutar entorno de desarrollo:
    ```bash
    npm run dev
    ```
4.  Acceso predeterminado: [http://localhost:3000](http://localhost:3000)

---

## 🏷️ Identidad y Personalización (White-Label)
Softcoinp permite la personalización total de la identidad desde el módulo de Mantenimiento:
- **Nombre de Institución:** Actualización dinámica de la marca en login, header y reportes.
- **Versionamiento:** Control visual de la versión del software desplegado.

---
© 2026 **Softcoinp Technologies** | *Ingeniería en Control de Acceso e Identidad Digital.*
