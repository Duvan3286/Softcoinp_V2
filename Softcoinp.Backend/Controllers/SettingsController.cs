using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Softcoinp.Backend.Models;
using Softcoinp.Backend.Helpers;
using Softcoinp.Backend.Dtos;

namespace Softcoinp.Backend.Controllers
{
    [Route("api/settings")]
    [ApiController]
    [Authorize]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SettingsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/settings
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var settings = await _context.SystemSettings.ToListAsync();
            return Ok(ApiResponse<List<SystemSetting>>.SuccessResponse(settings));
        }

        // GET: api/settings/{key}
        [HttpGet("{key}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetByKey(string key)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key);
            if (setting == null) return NotFound(ApiResponse<SystemSetting>.Fail(null, "Configuración no encontrada"));
            return Ok(ApiResponse<SystemSetting>.SuccessResponse(setting));
        }

        // POST: api/settings
        [HttpPost]
        [Authorize(Roles = "admin,superadmin")]
        public async Task<IActionResult> UpdateSetting([FromBody] SettingUpdateDto input)
        {
            try 
            {
                Console.WriteLine($"[Settings] Intentando actualizar: Key={input.Key}, Value={input.Value}");
                
                var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == input.Key);
                if (setting == null)
                {
                    Console.WriteLine($"[Settings] No se encontró la clave {input.Key}. Creando nueva entrada.");
                    setting = new SystemSetting { Key = input.Key };
                    _context.SystemSettings.Add(setting);
                }

                setting.Value = input.Value;
                setting.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                Console.WriteLine($"[Settings] Guardado exitoso para {input.Key}");
                return Ok(ApiResponse<SystemSetting>.SuccessResponse(setting, "Configuración actualizada"));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Settings] ERROR al actualizar: {ex.Message}");
                if (ex.InnerException != null) Console.WriteLine($"[Settings] Inner ERROR: {ex.InnerException.Message}");
                return BadRequest(ApiResponse<object>.Fail(null, ex.Message));
            }
        }
    }

    public class SettingUpdateDto
    {
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }
}
