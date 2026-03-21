using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Softcoinp.Backend.Models;
using Softcoinp.Backend.Dtos;
using Softcoinp.Backend.Services;
using Softcoinp.Backend.Helpers;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RegistroVehiculoController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IAuditService _audit;

        public RegistroVehiculoController(AppDbContext db, IAuditService audit)
        {
            _db = db;
            _audit = audit;
        }

        // GET: api/regisrovehiculo
        [HttpGet]
        public IActionResult GetAll(
            [FromQuery] string? placa,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _db.RegistrosVehiculos.AsQueryable();

            if (!string.IsNullOrWhiteSpace(placa))
                query = query.Where(r => r.Placa.Contains(placa.ToUpper()));

            if (desde.HasValue)
                query = query.Where(r => r.HoraIngresoUtc >= desde.Value.Date);

            if (hasta.HasValue)
                query = query.Where(r => r.HoraIngresoUtc < hasta.Value.Date.AddDays(1));

            var total = query.Count();

            var registros = query
                .OrderByDescending(r => r.HoraIngresoUtc)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new RegistroVehiculoDto
                {
                    Id = r.Id,
                    VehiculoId = r.VehiculoId,
                    Placa = r.Placa,
                    Marca = r.Marca,
                    Modelo = r.Modelo,
                    Color = r.Color,
                    TipoVehiculo = r.TipoVehiculo,
                    FotoVehiculoUrl = r.FotoVehiculoUrl,
                    HoraIngresoUtc = r.HoraIngresoUtc,
                    HoraIngresoLocal = r.HoraIngresoLocal,
                    HoraSalidaUtc = r.HoraSalidaUtc,
                    HoraSalidaLocal = r.HoraSalidaLocal,
                    RegistradoPor = r.RegistradoPor
                })
                .ToList();

            var response = new PagedResponse<RegistroVehiculoDto>(registros, total, page, pageSize);
            return Ok(ApiResponse<PagedResponse<RegistroVehiculoDto>>.SuccessResponse(response));
        }

        // POST: api/regisrovehiculo
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRegistroVehiculoDto input)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<RegistroVehiculoDto>.Fail(null, "Error de validación", ModelState));

            var nowUtc = DateTime.UtcNow;
            string? fotoUrlVehiculo = null;

            // Procesar foto vehículo
            if (!string.IsNullOrWhiteSpace(input.FotoVehiculo))
            {
                try
                {
                    var base64V = input.FotoVehiculo.StartsWith("data:") ? input.FotoVehiculo.Substring(input.FotoVehiculo.IndexOf(',') + 1) : input.FotoVehiculo;
                    var bytesV = Convert.FromBase64String(base64V);
                    var fileNameV = $"REG_VEH_{input.Placa}_{DateTime.Now:yyyyMMddHHmmss}.jpeg";
                    var folderV = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "vehiculos");
                    if (!Directory.Exists(folderV)) Directory.CreateDirectory(folderV);
                    var pathV = Path.Combine(folderV, fileNameV);
                    await System.IO.File.WriteAllBytesAsync(pathV, bytesV);
                    fotoUrlVehiculo = $"/uploads/vehiculos/{fileNameV}";
                }
                catch { }
            }

            // Buscar vehículo maestro
            var vehiculo = await _db.Vehiculos.FirstOrDefaultAsync(v => v.Placa == input.Placa.ToUpper());

            if (vehiculo != null && vehiculo.IsBloqueado)
            {
                return BadRequest(ApiResponse<RegistroVehiculoDto>.Fail(null, $"🚫 VEHÍCULO BLOQUEADO. Motivo: {vehiculo.MotivoBloqueo}"));
            }

            var registro = new RegistroVehiculo
            {
                Id = Guid.NewGuid(),
                VehiculoId = vehiculo?.Id,
                Placa = input.Placa.ToUpper(),
                Marca = input.Marca ?? vehiculo?.Marca,
                Modelo = input.Modelo ?? vehiculo?.Modelo,
                Color = input.Color ?? vehiculo?.Color,
                TipoVehiculo = input.TipoVehiculo ?? vehiculo?.TipoVehiculo,
                FotoVehiculoUrl = fotoUrlVehiculo ?? vehiculo?.FotoUrl,
                HoraIngresoUtc = nowUtc
            };

            var userIdClaim = User.FindFirst("id")?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
                registro.RegistradoPor = userId;

            _db.RegistrosVehiculos.Add(registro);
            await _db.SaveChangesAsync();

            try { await _audit.LogAsync("RegistroVehiculoCreated", "RegistroVehiculo", registro.Id, new { registro.Placa }); } catch { }

            var dto = new RegistroVehiculoDto
            {
                Id = registro.Id,
                Placa = registro.Placa,
                HoraIngresoUtc = registro.HoraIngresoUtc,
                HoraIngresoLocal = registro.HoraIngresoLocal
            };

            return Ok(ApiResponse<RegistroVehiculoDto>.SuccessResponse(dto, "Entrada de vehículo registrada con éxito"));
        }

        // PUT: api/regisrovehiculo/activo?placa
        [HttpGet("activo")]
        public async Task<IActionResult> GetActivo([FromQuery] string placa)
        {
            if (string.IsNullOrWhiteSpace(placa))
                return BadRequest(ApiResponse<RegistroVehiculoDto>.Fail(null, "La placa es obligatoria"));

            var registro = await _db.RegistrosVehiculos
                .Where(r => r.Placa == placa.ToUpper() && r.HoraSalidaUtc == null)
                .OrderByDescending(r => r.HoraIngresoUtc)
                .FirstOrDefaultAsync();

            if (registro == null)
                return NotFound(ApiResponse<RegistroVehiculoDto>.Fail(null, "No hay registro activo para este vehículo"));

            return Ok(ApiResponse<RegistroVehiculoDto>.SuccessResponse(new RegistroVehiculoDto
            {
                Id = registro.Id,
                Placa = registro.Placa
            }));
        }

        // PUT: api/regisrovehiculo/{id}/salida
        [HttpPut("{id}/salida")]
        public async Task<IActionResult> RegistrarSalida(Guid id)
        {
            var registro = await _db.RegistrosVehiculos.FindAsync(id);
            if (registro == null)
                return NotFound(ApiResponse<RegistroVehiculoDto>.Fail(null, "Registro no encontrado"));

            if (registro.HoraSalidaUtc != null)
                return BadRequest(ApiResponse<RegistroVehiculoDto>.Fail(null, "La salida ya fue registrada"));

            registro.HoraSalidaUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            try { await _audit.LogAsync("RegistroVehiculoSalida", "RegistroVehiculo", registro.Id, new { registro.Placa }); } catch { }

            return Ok(ApiResponse<object>.SuccessResponse(null, "Salida de vehículo registrada con éxito"));
        }

        // GET: api/regisrovehiculo/activos
        [HttpGet("activos")]
        public async Task<IActionResult> GetActivos()
        {
            var registros = await _db.RegistrosVehiculos
                .Where(r => r.HoraSalidaUtc == null)
                .OrderByDescending(r => r.HoraIngresoUtc)
                .Select(r => new RegistroVehiculoDto
                {
                    Id = r.Id,
                    VehiculoId = r.VehiculoId,
                    Placa = r.Placa,
                    Marca = r.Marca,
                    Modelo = r.Modelo,
                    Color = r.Color,
                    TipoVehiculo = r.TipoVehiculo,
                    FotoVehiculoUrl = r.FotoVehiculoUrl,
                    HoraIngresoUtc = r.HoraIngresoUtc,
                    HoraIngresoLocal = r.HoraIngresoLocal,
                    HoraSalidaUtc = r.HoraSalidaUtc,
                    HoraSalidaLocal = r.HoraSalidaLocal,
                    RegistradoPor = r.RegistradoPor
                })
                .ToListAsync();

            return Ok(ApiResponse<List<RegistroVehiculoDto>>.SuccessResponse(registros));
        }
    }
}
