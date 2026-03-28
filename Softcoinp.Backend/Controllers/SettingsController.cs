using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Softcoinp.Backend.Models;

namespace Softcoinp.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
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
            return Ok(settings);
        }

        // GET: api/settings/{key}
        [HttpGet("{key}")]
        public async Task<IActionResult> GetByKey(string key)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key);
            if (setting == null) return NotFound();
            return Ok(setting);
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
                return Ok(setting);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Settings] ERROR al actualizar: {ex.Message}");
                if (ex.InnerException != null) Console.WriteLine($"[Settings] Inner ERROR: {ex.InnerException.Message}");
                return BadRequest(new { error = ex.Message });
            }
        }
    }

    public class SettingUpdateDto
    {
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }
}
