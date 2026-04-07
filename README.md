# 🛡️ SOFTCOINP - Enterprise Access Control & Identity Management

**SOFTCOINP** es una solución integral de seguridad de grado empresarial diseñada para la gestión crítica de accesos, supervisión de personal activo, control vehicular y auditoría de operaciones. El sistema ahora opera bajo una arquitectura totalmente **Dockerizada**, garantizando portabilidad y estabilidad total.

---

## 🏗️ Arquitectura y Stack Tecnológico

El ecosistema se distribuye en tres servicios orquestados:

### 🎨 Frontend (`/frontend-softcoinp`)
- **Tecnología:** Next.js 15+ (App Router) & TypeScript.
- **Estilos:** Tailwind CSS con soporte nativo de **Modo Oscuro/Claro**.
- **Visualización:** Recharts para analítica en tiempo real.

### ⚙️ Backend (`/Softcoinp.Backend`)
- **Tecnología:** ASP.NET Core 8.0 Web API.
- **Base de Datos:** PostgreSQL 15.
- **Seguridad:** JWT (Json Web Tokens) & RBAC (Role-Based Access Control).
- **Resiliencia:** Auto-migración y Auto-seeding automático al iniciar el contenedor.

---

## 🚀 Despliegue Rápido (Docker)

La forma recomendada de ejecutar SOFTCOINP es mediante **Docker Compose**, lo que configura automáticamente la base de datos, el backend (incluyendo herramientas de PostgreSQL) y el frontend.

### Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado.

### Pasos para iniciar
1.  Clonar el repositorio y situarse en la raíz.
2.  Ejecutar el comando de construcción y arranque:
    ```bash
    docker-compose up --build -d
    ```
3.  Acceso a la aplicación: [http://localhost:3000](http://localhost:3000)
4.  Acceso a la API: [http://localhost:5100/api](http://localhost:5100/api)

### Credenciales Predeterminadas (Primer Inicio)
| Rol | Email | Password |
| :--- | :--- | :--- |
| **SuperAdmin** | `superadmin@dev` | `SuperDev2026!` |
| **Admin** | `admin@local` | `Admin123` |

---

## 🛠️ Capacidades del Módulo de Mantenimiento

El sistema incluye herramientas avanzadas para administradores:

- **Backups Inteligentes**:
    - **Configuración (JSON)**: Respaldo ligero de ajustes y usuarios.
    - **Completo (SQL)**: Volcado real de la base de datos generado por `pg_dump`.
- **Restauración Dual**: Soporte para cargar archivos `.json` o `.sql` directamente desde la interfaz web.
- **Limpieza Selectiva**: Modal que permite eliminar datos por módulos (Registros, Personal, Correspondencia, etc.) sin afectar la base del sistema.
- **Identidad Corporativa**: Personalización dinámica del nombre de la institución y versión del software.

---

## 📋 Comandos Útiles de Docker

| Acción | Comando |
| :--- | :--- |
| **Ver logs del sistema** | `docker-compose logs -f` |
| **Detener el sistema** | `docker-compose stop` |
| **Reiniciar y reconstruir** | `docker-compose up --build -d` |
| **Borrar todo (incluyendo datos)** | `docker-compose down -v` |

---
© 2026 **Softcoinp Technologies** | *Ingeniería en Control de Acceso e Identidad Digital.*
