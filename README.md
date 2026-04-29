# 🛡️ SOFTCOINP - Sistema Integral de Gestión Residencial Multi-Tenant

**SOFTCOINP** es una solución de grado empresarial diseñada para la gestión crítica de copropiedades y conjuntos residenciales. El sistema utiliza una arquitectura **Multi-tenant con Aislamiento Físico (Database-per-Tenant)**, permitiendo escalar a miles de clientes manteniendo la integridad y privacidad de los datos de forma absoluta.

---

## 🏗️ Arquitectura Multi-Tenant

El sistema está diseñado para servir a múltiples organizaciones (tenants) desde una única infraestructura compartida:

1.  **Aislamiento de Datos**: Cada tenant posee su propia base de datos física independiente.
2.  **Resolución por Subdominio**: El sistema identifica al cliente basándose en el subdominio de la URL (ej: `cliente.softcoinp.com`).
3.  **Base de Datos Maestra**: Un catálogo central (`softcoinp_master`) gestiona el registro de clientes, sus subdominios y sus respectivas cadenas de conexión.
4.  **Migraciones Automáticas**: Al iniciar la aplicación, el backend detecta todos los tenants activos y aplica automáticamente las actualizaciones de esquema (migraciones) y datos base (seeding) a cada base de datos individual.

---

## 📝 Resumen de Funcionalidades

El sistema centraliza las operaciones diarias de una propiedad horizontal:

- **Control de Acceso Vehicular y Peatonal**: Registro de entradas/salidas con gestión de bloqueos preventivos.
- **Seguridad y Bitácora**: Módulo de anotaciones para personal de seguridad.
- **Gestión de Correspondencia**: Seguimiento automatizado de paquetes.
- **Servicios Públicos**: Control de recibos y consumos comunes.
- **Administración y Auditoría**: Gestión de roles (RBAC) y logs detallados (AuditLogs).
- **Analíticas**: Tableros de control con estadísticas mensuales.
- **Notificaciones**: Integración con **Brevo** para avisos automáticos por correo electrónico.

---

## 🏗️ Stack Tecnológico

### 🎨 Frontend (`/frontend-softcoinp`)
- **Next.js 16+ (App Router)** con TypeScript 6.
- **Resolución Dinámica**: Axios configurado para inyectar subdominios automáticamente en las peticiones al API.
- **Tailwind CSS 4**: Soporte nativo para modo oscuro/claro.

### ⚙️ Backend (`/Softcoinp.Backend`)
- **ASP.NET Core 8.0 Web API**.
- **Entity Framework Core**: Proveedor dinámico de contexto basado en el tenant resuelto.
- **MySQL 8.0**: Motor de base de datos para aislamiento físico.
- **JWT**: Autenticación segura con claims de rol y tenant.

---

## 🚀 Guía de Inicio Rápido (Desarrollo Local)

### 1. Configuración de DNS Local
Para simular el comportamiento multi-tenant en tu máquina, debes mapear los subdominios en tu archivo `hosts` (`C:\Windows\System32\drivers\etc\hosts`):

```text
127.0.0.1 dev.localhost
127.0.0.1 cliente1.localhost
```

### 2. Levantar el Entorno con Docker
Ejecuta el siguiente comando en la raíz del proyecto:
```bash
docker compose up --build
```
*El sistema creará automáticamente la base maestra y el tenant `dev` por defecto.*

### 3. Acceso al Sistema
- **Frontend**: [http://dev.localhost:3000](http://dev.localhost:3000)
- **Backend (Swagger)**: [http://dev.localhost:5100/swagger](http://dev.localhost:5100/swagger)
- **phpMyAdmin**: [http://localhost:8081](http://localhost:8081)

### 🔑 Credenciales Predeterminadas (en cualquier tenant)
| Usuario | Email | Password |
| :--- | :--- | :--- |
| **SuperAdmin** | `superadmin@dev` | `SuperDev2026!` |
| **Admin** | `admin@local` | `Admin123` |

---

## ➕ Cómo Crear un Nuevo Tenant

1.  **Registro**: Inserta un registro en la tabla `Tenants` de la base de datos `softcoinp_master` vía phpMyAdmin:
    - `Subdomain`: `nombre_cliente`
    - `ConnectionString`: `Server=db;Database=softcoinp_nombre;User=root;Password=1234`
2.  **Activación**: Reinicia el servicio `backend` en Docker. El sistema creará la base de datos física y aplicará las tablas automáticamente.
3.  **Acceso**: Agrega `127.0.0.1 nombre_cliente.localhost` a tu archivo `hosts` y navega a `http://nombre_cliente.localhost:3000`.
4.  **Ejemplo**:
    ```sql
    INSERT INTO Tenants (Id, Subdomain, ConnectionString, IsActive, CreatedAt)
    VALUES (UUID(), 'ejemplo', 'Server=db;Database=softcoinp_ejemplo;User=root;Password=1234', 1, NOW());
    ```

---
© 2026 **Softcoinp Technologies** | *Ingeniería en Control de Acceso e Identidad Digital.*
