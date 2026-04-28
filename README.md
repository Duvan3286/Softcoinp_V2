# 🛡️ SOFTCOINP - Sistema Integral de Gestión Residencial y Control de Acceso

**SOFTCOINP** es una solución de grado empresarial diseñada para la gestión crítica de copropiedades y conjuntos residenciales. El sistema centraliza la seguridad, administración y comunicación en una plataforma robusta y moderna.

---

## 📝 Resumen del Proyecto

El sistema permite automatizar y supervisar las operaciones diarias de una propiedad horizontal:

1.  **Control de Acceso Vehicular y Peatonal**: Registro en tiempo real de entradas y salidas con gestión de bloqueos preventivos.
2.  **Seguridad y Bitácora**: Módulo de anotaciones para vigilantes y personal de seguridad.
3.  **Gestión de Correspondencia**: Seguimiento automatizado de paquetes y correspondencia recibida.
4.  **Servicios Públicos**: Control centralizado de recibos y consumos comunes.
5.  **Administración y Auditoría**: Gestión de roles, permisos granulares (RBAC) y logs detallados de actividad (AuditLogs).
6.  **Analíticas**: Tableros de control con estadísticas mensuales y visualización de datos.
7.  **Notificaciones por Correo**: Integración con **Brevo (Sendinblue)** para avisos automáticos a residentes sobre paquetes y recibos.

---

## 📧 Notificaciones por Correo (Brevo)

El sistema cuenta con una integración robusta para mantener informados a los residentes:

### Funcionalidades
- **Aviso de Correspondencia**: Envío automático de correo cuando llega un paquete o sobre a nombre de un residente (requiere que el residente tenga su email registrado en el módulo de Personal).
- **Aviso de Recibos Públicos**: Notificación masiva a grupos de personas (ej: Todos los Residentes) cuando se carga un nuevo lote de facturas de servicios públicos en la portería.

---

## 🏗️ Arquitectura y Stack Tecnológico

El ecosistema se distribuye en una arquitectura desacoplada y dockerizada:

### 🎨 Frontend (`/frontend-softcoinp`)
- **Framework**: Next.js 16+ (App Router) con TypeScript 6.
- **Entorno**: Dockerizado sobre **Debian Slim** para máxima compatibilidad con módulos nativos.
- **Iconografía**: Lucide React.
- **Estilos**: Tailwind CSS 4 con soporte para Modo Oscuro/Claro (`next-themes`).
- **Estado y Datos**: Context API para estado global, Axios para consumo de APIs y Recharts para analítica.

### ⚙️ Backend (`/Softcoinp.Backend`)
- **Framework**: ASP.NET Core 8.0 Web API.
- **Base de Datos**: **MySQL 8.0** (Entity Framework Core con Pomelo Provider).
- **Seguridad**: Autenticación JWT con políticas de validación estrictas.
- **Optimización**: Compresión de respuestas (Brotli/Gzip) y procesamiento de fechas en UTC.

### 🕒 Worker Service (`/Softcoinp.Worker`)
- **Propósito**: Procesamiento de tareas en segundo plano (Analíticas mensuales, reportes automáticos).
- **Base de Datos**: MySQL 8.0.

---

## 🛠️ Herramientas de Administración

El entorno de desarrollo incluye herramientas integradas para la gestión de datos:

- **phpMyAdmin**: Accesible en [http://localhost:8081](http://localhost:8081)
  - **Servidor**: `db`
  - **Usuario**: `root`
  - **Contraseña**: `1234`
- **Swagger UI**: Documentación interactiva de la API en [http://localhost:5100/swagger](http://localhost:5100/swagger).

---

## 📏 Reglas de Estilo y Convenciones de Código

- **Base de Datos**: Se utiliza `EF.Functions.Like` para búsquedas agnósticas (Case-Insensitive por defecto en MySQL).
- **Mantenimiento**: El sistema de backups nativos utiliza `mysqldump` para generar volcados SQL compatibles.
- **Fechas**: Almacenamiento estricto en UTC. El frontend realiza la conversión local según la zona horaria del cliente.

---

## 🚀 Despliegue Rápido (Docker)

La forma recomendada de ejecutar SOFTCOINP es mediante **Docker Compose**.

### Pasos para iniciar
1.  Clonar el repositorio.
2.  Ejecutar:
    ```bash
    docker compose up --build -d
    ```
    *Nota: Si vienes de una versión anterior con PostgreSQL, es necesario ejecutar `docker compose down -v` primero para limpiar los volúmenes de datos antiguos.*

3.  Acceso: [http://localhost:3000](http://localhost:3000)

### Credenciales Predeterminadas
| Rol | Email | Password |
| :--- | :--- | :--- |
| **SuperAdmin** | `superadmin@dev` | `SuperDev2026!` |

---
© 2026 **Softcoinp Technologies** | *Ingeniería en Control de Acceso e Identidad Digital.*
