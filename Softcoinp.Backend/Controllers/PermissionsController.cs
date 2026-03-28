using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Softcoinp.Backend.Models;
using Softcoinp.Backend.Dtos;
using Softcoinp.Backend.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin,superadmin")]
    public class PermissionsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public PermissionsController(AppDbContext db)
        {
            _db = db;
        }

        // Catálogo de vistas disponibles en el sistema (Ordenado según Sidebar)
        private static readonly List<ViewInfo> ViewCatalog = new()
        {
            // General
            new ViewInfo { Key = "dashboard", Name = "Dashboard Principal", Icon = "🏢", Category = "General" },

            // Novedades (Group)
            new ViewInfo { Key = "novedades-personas", Name = "Novedades Personas", Icon = "👥", Category = "Novedades" },
            new ViewInfo { Key = "novedades-vehicular", Name = "Novedades Vehicular", Icon = "🚗", Category = "Novedades" },
            new ViewInfo { Key = "historial-novedades", Name = "Historial Novedades Personas", Icon = "📋", Category = "Novedades" },
            new ViewInfo { Key = "exportar-historial-novedades", Name = "Exportar Novedades", Icon = "📥", Category = "Novedades" },

            // Analítica & Catálogos (Group)
            new ViewInfo { Key = "analitica-dashboard", Name = "Dashboard Analítico", Icon = "📈", Category = "Analítica & Catálogos" },
            new ViewInfo { Key = "analitica-personas", Name = "Catálogo Personas", Icon = "👥", Category = "Analítica & Catálogos" },
            new ViewInfo { Key = "analitica-vehiculos", Name = "Catálogo Vehículos", Icon = "🚗", Category = "Analítica & Catálogos" },
            new ViewInfo { Key = "exportar-reportes", Name = "Exportar Reportes", Icon = "📥", Category = "Analítica & Catálogos" },

            // Historial De Ingresos (Group)
            new ViewInfo { Key = "historial-personas", Name = "Historial Personas", Icon = "👥", Category = "Historial De Ingresos" },
            new ViewInfo { Key = "historial-vehiculos", Name = "Historial Vehículos", Icon = "🚗", Category = "Historial De Ingresos" },
            new ViewInfo { Key = "historial-vehiculares", Name = "Historial Novedades Vehículares", Icon = "📋", Category = "Historial De Ingresos" },
            new ViewInfo { Key = "exportar-registros", Name = "Exportar Historial Personas", Icon = "📥", Category = "Historial De Ingresos" },
            new ViewInfo { Key = "exportar-registros-vehiculos", Name = "Exportar Historial Vehículos", Icon = "📥", Category = "Historial De Ingresos" },
            new ViewInfo { Key = "exportar-historial-vehiculares", Name = "Exportar Historial Nov. Veh.", Icon = "📥", Category = "Historial De Ingresos" },

            // En Sitio (Group)
            new ViewInfo { Key = "sitio-personas", Name = "Personas en Sitio", Icon = "👤", Category = "En Sitio" },
            new ViewInfo { Key = "sitio-vehiculos", Name = "Vehículos en Sitio", Icon = "🚘", Category = "En Sitio" },

            // Otros
            new ViewInfo { Key = "correspondencia", Name = "Correspondencia", Icon = "📦", Category = "Otros" },
            new ViewInfo { Key = "configuraciones", Name = "Configuraciones", Icon = "🔑", Category = "Otros" }
        };

        [HttpGet("catalog")]
        public IActionResult GetCatalog()
        {
            return Ok(Softcoinp.Backend.Helpers.ApiResponse<List<ViewInfo>>.SuccessResponse(ViewCatalog));
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserPermissions(Guid userId)
        {
            var permissions = await _db.UserPermissions
                .Where(p => p.UserId == userId)
                .Select(p => p.ViewKey)
                .ToListAsync();

            return Ok(Softcoinp.Backend.Helpers.ApiResponse<List<string>>.SuccessResponse(permissions));
        }

        [HttpPut("{userId}")]
        public async Task<IActionResult> UpdateUserPermissions(Guid userId, [FromBody] List<string> viewKeys)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound(Softcoinp.Backend.Helpers.ApiResponse<object>.Fail(null, "Usuario no encontrado"));

            // Eliminar permisos actuales
            var currentPermissions = await _db.UserPermissions.Where(p => p.UserId == userId).ToListAsync();
            _db.UserPermissions.RemoveRange(currentPermissions);

            // Agregar nuevos permisos (solo los que están en el catálogo)
            var validKeys = viewKeys.Where(key => ViewCatalog.Any(v => v.Key == key)).Distinct();
            
            foreach (var key in validKeys)
            {
                _db.UserPermissions.Add(new UserPermission
                {
                    UserId = userId,
                    ViewKey = key
                });
            }

            await _db.SaveChangesAsync();

            return Ok(Softcoinp.Backend.Helpers.ApiResponse<object>.SuccessResponse(null, "Permisos actualizados correctamente"));
        }
    }

    public class ViewInfo
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }
}
