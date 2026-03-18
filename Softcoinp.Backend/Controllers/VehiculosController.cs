using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Softcoinp.Backend;
using Softcoinp.Backend.Dtos;
using Softcoinp.Backend.Helpers;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VehiculosController : ControllerBase
    {
        private readonly AppDbContext _db;

        public VehiculosController(AppDbContext db)
        {
            _db = db;
        }

        // GET: api/vehiculos
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var vehiculos = await _db.Vehiculos
                .Include(v => v.Personal)
                .OrderByDescending(v => v.FechaCreacionUtc)
                .Select(v => new VehiculoListDto
                {
                    Id = v.Id,
                    Placa = v.Placa,
                    Marca = v.Marca,
                    Modelo = v.Modelo,
                    Color = v.Color,
                    TipoVehiculo = v.TipoVehiculo,
                    FotoUrl = v.FotoUrl,
                    PropietarioId = v.PersonalId,
                    PropietarioNombre = v.Personal.Nombre,
                    PropietarioApellido = v.Personal.Apellido,
                    PropietarioDocumento = v.Personal.Documento,
                    PropietarioTipo = v.Personal.Tipo,
                    PropietarioFotoUrl = v.Personal.FotoUrl,
                    PropietarioTelefono = v.Personal.Telefono
                })
                .ToListAsync();

            return Ok(ApiResponse<List<VehiculoListDto>>.SuccessResponse(vehiculos));
        }

        // GET: api/vehiculos/buscar
        [HttpGet("buscar")]
        public async Task<IActionResult> Buscar(
            [FromQuery] string? placa,
            [FromQuery] string? documento,
            [FromQuery] string? marca,
            [FromQuery] string? modelo,
            [FromQuery] string? tipoVehiculo,
            [FromQuery] string? color,
            [FromQuery] string? query // Para mantener compatibilidad con búsqueda general
        )
        {
            var queryable = _db.Vehiculos.Include(v => v.Personal).AsQueryable();

            if (!string.IsNullOrWhiteSpace(query))
            {
                var q = query.ToUpper();
                queryable = queryable.Where(v => v.Placa.Contains(q) || v.Personal.Documento.Contains(q) || v.Marca.Contains(q) || v.Modelo.Contains(q));
            }

            if (!string.IsNullOrWhiteSpace(placa))
                queryable = queryable.Where(v => v.Placa.Contains(placa.ToUpper()));

            if (!string.IsNullOrWhiteSpace(documento))
                queryable = queryable.Where(v => v.Personal.Documento.Contains(documento));

            if (!string.IsNullOrWhiteSpace(marca))
                queryable = queryable.Where(v => EF.Functions.ILike(v.Marca, $"%{marca}%"));

            if (!string.IsNullOrWhiteSpace(modelo))
                queryable = queryable.Where(v => EF.Functions.ILike(v.Modelo, $"%{modelo}%"));

            if (!string.IsNullOrWhiteSpace(tipoVehiculo))
                queryable = queryable.Where(v => v.TipoVehiculo == tipoVehiculo);

            if (!string.IsNullOrWhiteSpace(color))
                queryable = queryable.Where(v => EF.Functions.ILike(v.Color, $"%{color}%"));

            var vehiculos = await queryable
                .OrderByDescending(v => v.FechaCreacionUtc)
                .Select(v => new VehiculoListDto
                {
                    Id = v.Id,
                    Placa = v.Placa,
                    Marca = v.Marca,
                    Modelo = v.Modelo,
                    Color = v.Color,
                    TipoVehiculo = v.TipoVehiculo,
                    FotoUrl = v.FotoUrl,
                    PropietarioId = v.PersonalId,
                    PropietarioNombre = v.Personal.Nombre,
                    PropietarioApellido = v.Personal.Apellido,
                    PropietarioDocumento = v.Personal.Documento,
                    PropietarioTipo = v.Personal.Tipo,
                    PropietarioFotoUrl = v.Personal.FotoUrl,
                    PropietarioTelefono = v.Personal.Telefono
                })
                .ToListAsync();

            return Ok(ApiResponse<List<VehiculoListDto>>.SuccessResponse(vehiculos));
        }

        // GET: api/vehiculos/placa/{placa}
        [HttpGet("placa/{placa}")]
        public async Task<IActionResult> GetByPlaca(string placa)
        {
            if (string.IsNullOrWhiteSpace(placa))
                return BadRequest(ApiResponse<VehiculoListDto>.Fail(null, "La placa es obligatoria."));

            placa = placa.ToUpper();

            var vehiculo = await _db.Vehiculos
                .Include(v => v.Personal)
                .Where(v => v.Placa == placa)
                .Select(v => new VehiculoListDto
                {
                    Id = v.Id,
                    Placa = v.Placa,
                    Marca = v.Marca,
                    Modelo = v.Modelo,
                    Color = v.Color,
                    TipoVehiculo = v.TipoVehiculo,
                    FotoUrl = v.FotoUrl,
                    PropietarioId = v.PersonalId,
                    PropietarioNombre = v.Personal.Nombre,
                    PropietarioApellido = v.Personal.Apellido,
                    PropietarioDocumento = v.Personal.Documento,
                    PropietarioTipo = v.Personal.Tipo,
                    PropietarioFotoUrl = v.Personal.FotoUrl,
                    PropietarioTelefono = v.Personal.Telefono
                })
                .FirstOrDefaultAsync();

            if (vehiculo == null)
                return NotFound(ApiResponse<VehiculoListDto>.Fail(null, "Vehículo no encontrado."));

            return Ok(ApiResponse<VehiculoListDto>.SuccessResponse(vehiculo));
        }
    }
}
