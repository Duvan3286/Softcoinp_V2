using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Softcoinp.Backend.Models;
using Softcoinp.Backend.Dtos;
using Softcoinp.Backend.Helpers;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CorrespondenciaController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly Softcoinp.Backend.Services.IEmailService _emailService;
        private readonly IServiceScopeFactory _scopeFactory;

        public CorrespondenciaController(
            AppDbContext db, 
            Softcoinp.Backend.Services.IEmailService emailService,
            IServiceScopeFactory scopeFactory)
        {
            _db = db;
            _emailService = emailService;
            _scopeFactory = scopeFactory;
        }

        // GET: api/correspondencia?estado=en_espera&remitente=...&destinatario=...
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? estado,
            [FromQuery] string? remitente,
            [FromQuery] string? destinatario,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            var query = _db.Correspondencias.AsQueryable();

            if (!string.IsNullOrWhiteSpace(estado))
                query = query.Where(c => c.Estado == estado);

            if (!string.IsNullOrWhiteSpace(remitente))
                query = query.Where(c => EF.Functions.Like(c.Remitente, $"%{remitente}%"));

            if (!string.IsNullOrWhiteSpace(destinatario))
                query = query.Where(c => EF.Functions.Like(c.Destinatario, $"%{destinatario}%"));

            if (desde.HasValue)
                query = query.Where(c => c.FechaRecepcionUtc >= desde.Value.Date);

            if (hasta.HasValue)
                query = query.Where(c => c.FechaRecepcionUtc < hasta.Value.Date.AddDays(1));

            var items = await query
                .OrderByDescending(c => c.FechaRecepcionUtc)
                .Select(c => new CorrespondenciaDto
                {
                    Id = c.Id,
                    Remitente = c.Remitente,
                    Destinatario = c.Destinatario,
                    TipoDocumento = c.TipoDocumento,
                    NumeroGuia = c.NumeroGuia,
                    Descripcion = c.Descripcion,
                    Estado = c.Estado,
                    FechaRecepcionLocal = c.FechaRecepcionLocal,
                    FechaEntregaLocal = c.FechaEntregaLocal,
                    RecibidoPor = c.RecibidoPor,
                    NotaEntrega = c.NotaEntrega,
                    RegistradoPorNombre = _db.Users.Where(u => u.Id == c.RegistradoPor).Select(u => u.Nombre).FirstOrDefault(),
                    EntregadoPorNombre = _db.Users.Where(u => u.Id == c.EntregadoPor).Select(u => u.Nombre).FirstOrDefault()
                })
                .ToListAsync();

            return Ok(ApiResponse<List<CorrespondenciaDto>>.SuccessResponse(items));
        }

        // POST: api/correspondencia
        [HttpPost]
        public async Task<IActionResult> Crear([FromBody] CreateCorrespondenciaDto input)
        {
            if (string.IsNullOrWhiteSpace(input.Remitente) || string.IsNullOrWhiteSpace(input.Destinatario))
                return BadRequest(ApiResponse<object>.Fail(null, "Remitente y Destinatario son obligatorios."));

            var userIdClaim = User.FindFirst("id")?.Value;
            Guid.TryParse(userIdClaim, out var userId);

            var item = new Correspondencia
            {
                Id = Guid.NewGuid(),
                Remitente = input.Remitente.Trim(),
                Destinatario = input.Destinatario.Trim(),
                TipoDocumento = input.TipoDocumento?.Trim(),
                NumeroGuia = input.NumeroGuia?.Trim(),
                Descripcion = input.Descripcion?.Trim(),
                Estado = "en_espera",
                FechaRecepcionUtc = DateTime.UtcNow,
                FechaRecepcionLocal = DateTime.UtcNow.AddHours(-5), // Se guarda local (-5) pero se mantiene DateTimeKind.Utc para PostgreSQL
                RegistradoPor = userId == Guid.Empty ? null : userId
            };

            _db.Correspondencias.Add(item);
            await _db.SaveChangesAsync();

            // LÃ³gica de NotificaciÃ³n por Correo (Segura en Segundo Plano)
            _ = Task.Run(async () =>
            {
                using (var scope = _scopeFactory.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var logger = scope.ServiceProvider.GetRequiredService<ILogger<CorrespondenciaController>>();
                    var emailSvc = scope.ServiceProvider.GetRequiredService<Softcoinp.Backend.Services.IEmailService>();

                    try
                    {
                        // Normalizamos: quitamos espacios al inicio/final y pasamos a mayÃºsculas
                        var destinatarioOriginal = item.Destinatario.Trim().ToUpper();
                        // Creamos una versiÃ³n sin NINGÃšN espacio para comparaciÃ³n ultra-segura
                        var destinatarioSinEspacios = destinatarioOriginal.Replace(" ", "");
                        
                        Console.WriteLine($"[NOTIFICACIÃ“N] Buscando coincidencia para: '{destinatarioOriginal}' (Sin espacios: '{destinatarioSinEspacios}')");

                        // Buscamos en la base de datos
                        // Comparamos Nombre + Apellido quitando todos los espacios
                        var resident = await db.Personal
                            .AsNoTracking()
                            .Where(p => (p.Nombre + p.Apellido).Replace(" ", "").ToUpper() == destinatarioSinEspacios)
                            .FirstOrDefaultAsync();

                        if (resident != null)
                        {
                            if (!string.IsNullOrEmpty(resident.Email))
                            {
                                Console.WriteLine($"[NOTIFICACIÃ“N] âœ… MATCH ENCONTRADO: {resident.Nombre} {resident.Apellido} -> {resident.Email}");
                                await emailSvc.NotifyNewCorrespondenceAsync(
                                    resident.Email,
                                    $"{resident.Nombre} {resident.Apellido}",
                                    item.Remitente,
                                    item.TipoDocumento ?? "Paquete",
                                    item.NumeroGuia ?? "N/A"
                                );
                            }
                            else
                            {
                                Console.WriteLine($"[NOTIFICACIÃ“N] âš ï¸ PERSONA ENCONTRADA PERO NO TIENE EMAIL: {resident.Nombre} {resident.Apellido}");
                            }
                        }
                        else
                        {
                            Console.WriteLine($"[NOTIFICACIÃ“N] âŒ NO SE ENCONTRÃ“ NADIE QUE COINCIDA CON: {destinatarioOriginal}");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[NOTIFICACIÃ“N] ERROR CRÃTICO: {ex.Message}");
                        logger.LogError(ex, "Error crÃ­tico en el proceso de notificaciÃ³n de correspondencia.");
                    }
                }
            });

            return Ok(ApiResponse<object>.SuccessResponse(new { id = item.Id }, "Correspondencia registrada correctamente."));
        }

        // PUT: api/correspondencia/{id}/entregar
        [HttpPut("{id}/entregar")]
        public async Task<IActionResult> Entregar(Guid id, [FromBody] EntregarCorrespondenciaDto input)
        {
            if (string.IsNullOrWhiteSpace(input.RecibidoPor))
                return BadRequest(ApiResponse<object>.Fail(null, "Debe indicar quiÃ©n recibiÃ³ la correspondencia."));

            var item = await _db.Correspondencias.FindAsync(id);
            if (item == null)
                return NotFound(ApiResponse<object>.Fail(null, "Correspondencia no encontrada."));

            if (item.Estado == "entregado")
                return BadRequest(ApiResponse<object>.Fail(null, "Esta correspondencia ya fue entregada."));

            var userIdClaim = User.FindFirst("id")?.Value;
            Guid.TryParse(userIdClaim, out var userId);

            item.Estado = "entregado";
            item.RecibidoPor = input.RecibidoPor.Trim();
            item.NotaEntrega = input.NotaEntrega?.Trim();
            item.FechaEntregaUtc = DateTime.UtcNow;
            item.FechaEntregaLocal = DateTime.UtcNow.AddHours(-5); // Se guarda con DateTimeKind.Utc para compatibilidad BD
            item.EntregadoPor = userId == Guid.Empty ? null : userId;

            await _db.SaveChangesAsync();

            return Ok(ApiResponse<object>.SuccessResponse(null, "Correspondencia marcada como entregada."));
        }

        // DELETE: api/correspondencia/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin,superadmin")]
        public async Task<IActionResult> Eliminar(Guid id)
        {
            var item = await _db.Correspondencias.FindAsync(id);
            if (item == null)
                return NotFound(ApiResponse<object>.Fail(null, "Correspondencia no encontrada."));

            _db.Correspondencias.Remove(item);
            await _db.SaveChangesAsync();

            return Ok(ApiResponse<object>.SuccessResponse(null, "Correspondencia eliminada."));
        }
    }
}

