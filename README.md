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

### Configuración Necesaria
Para habilitar los correos, se requiere:
1.  **API Key de Brevo**: Configurada en la variable de entorno `BREVO_API_KEY` dentro del archivo `.env` o el entorno de ejecución.
2.  **Remitente Verificado**: El correo emisor debe estar verificado en el panel de Brevo y configurarse en la vista de **Mantenimiento > Configuración de Mensajería** dentro del sistema.
3.  **Nombre de la Institución**: El nombre del conjunto/edificio se toma automáticamente de **Mantenimiento > Identidad Visual**.

---

## 🏗️ Arquitectura y Stack Tecnológico

El ecosistema se distribuye en una arquitectura desacoplada y dockerizada:

### 🎨 Frontend (`/frontend-softcoinp`)
- **Framework**: Next.js 15+ (App Router) con TypeScript 6.
- **Estilos**: Tailwind CSS 4 con soporte para Modo Oscuro/Claro (`next-themes`).
- **Estado y Datos**: Context API para estado global, Axios para consumo de APIs y Recharts para analítica.
- **Convenciones**: Organización basada en carpetas por funcionalidades dentro de `src/app`.

### ⚙️ Backend (`/Softcoinp.Backend`)
- **Framework**: ASP.NET Core 8.0 Web API.
- **Base de Datos**: PostgreSQL 15 (Entity Framework Core).
- **Seguridad**: Autenticación JWT con políticas de validación estrictas.
- **Optimización**: Compresión de respuestas (Brotli/Gzip) y procesamiento de fechas en UTC mediante middlewares.
- **Patrones**: DTOs para transferencia de datos, filtros globales de validación y manejo centralizado de excepciones.

### 🕒 Worker Service (`/Softcoinp.Worker`)
- **Propósito**: Procesamiento de tareas en segundo plano, como generación de analíticas mensuales y tareas de mantenimiento programadas.

---

## 📏 Reglas de Estilo y Convenciones de Código

Para mantener la consistencia en el desarrollo, el proyecto sigue estas directrices:

### General
- **Internacionalización**: El backend maneja todas las fechas en formato UTC y utiliza conversores personalizados para asegurar consistencia en el JSON.
- **Arquitectura de API**: Uso estricto de CamelCase para las respuestas JSON y manejo de `null` omitiendo campos no definidos.

### Backend (C#)
- **Validación**: Uso de `ValidationFilter` global para interceptar y estandarizar errores de `ModelState`.
- **Estructura**: Separación clara entre `Models` (entidades de DB), `Dtos` (contratos de API) y `Controllers`.
- **Inyección de Dependencias**: Configuración centralizada en `Program.cs`.

### Frontend (TypeScript/React)
- **Tipado**: Uso obligatorio de interfaces y tipos de TypeScript para todas las props y respuestas de API.
- **Componentes**: Estilo funcional con Hooks. Preferencia por componentes de servidor cuando sea posible.
- **CSS**: Utilidad de Tailwind para evitar CSS personalizado innecesario.

---

## 🚀 Despliegue Rápido (Docker)

La forma recomendada de ejecutar SOFTCOINP es mediante **Docker Compose**.

### Pasos para iniciar
1.  Clonar el repositorio.
2.  Ejecutar:
    ```bash
    docker-compose up --build -d
    ```
3.  Acceso: [http://localhost:3000](http://localhost:3000)

### Credenciales Predeterminadas
| Rol | Email | Password |
| :--- | :--- | :--- |
| **SuperAdmin** | `superadmin@dev` | `SuperDev2026!` |

---
© 2026 **Softcoinp Technologies** | *Ingeniería en Control de Acceso e Identidad Digital.*
