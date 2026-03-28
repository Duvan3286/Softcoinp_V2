using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Softcoinp.Backend.Models;
using Softcoinp.Backend.Dtos;
using Softcoinp.Backend.Services;
using Softcoinp.Backend.Helpers;
using Microsoft.EntityFrameworkCore;
using System.IO;
using ClosedXML.Excel;

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

        // GET: api/registrovehiculo
        [HttpGet]
        public IActionResult GetAll(
            [FromQuery] string? placa,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time"); // Colombia
            var query = _db.RegistrosVehiculos.AsQueryable();

            if (!string.IsNullOrWhiteSpace(placa))
                query = query.Where(r => r.Placa.Contains(placa.ToUpper()));

            if (desde.HasValue)
            {
                var desdeLocal = DateTime.SpecifyKind(desde.Value.Date, DateTimeKind.Unspecified);
                var desdeUtc = TimeZoneInfo.ConvertTimeToUtc(desdeLocal, tz);
                query = query.Where(r => r.HoraIngresoUtc >= desdeUtc);
            }

            if (hasta.HasValue)
            {
                var hastaFinLocal = DateTime.SpecifyKind(hasta.Value.Date.AddDays(1), DateTimeKind.Unspecified);
                var hastaFinUtc = TimeZoneInfo.ConvertTimeToUtc(hastaFinLocal, tz);
                query = query.Where(r => r.HoraIngresoUtc < hastaFinUtc);
            }

            var total = query.Count();

            var registros = (from r in query
                             join u in _db.Users on r.RegistradoPor equals u.Id into gj
                             from subUser in gj.DefaultIfEmpty()
                             orderby r.HoraIngresoUtc descending
                             select new RegistroVehiculoDto
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
                                 RegistradoPorNombre = subUser != null ? subUser.Nombre : "SISTEMA"
                             })
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
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

            if (vehiculo == null)
            {
                return BadRequest(ApiResponse<RegistroVehiculoDto>.Fail(null, "⚠️ Vehículo Nuevo. Por normas de seguridad, debe registrar los datos del conductor en el panel contiguo para vincularlo como propietario por primera vez."));
            }

            if (vehiculo.IsBloqueado)
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

        // GET: api/registrovehiculo/export/excel
        [HttpGet("export/excel")]
        public async Task<IActionResult> ExportExcel(
            [FromQuery] string? placa,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time"); // Colombia
            var query = _db.RegistrosVehiculos.AsQueryable();

            if (!string.IsNullOrWhiteSpace(placa))
                query = query.Where(r => r.Placa.Contains(placa.ToUpper()));

            if (desde.HasValue)
            {
                var desdeLocal = DateTime.SpecifyKind(desde.Value.Date, DateTimeKind.Unspecified);
                var desdeUtc = TimeZoneInfo.ConvertTimeToUtc(desdeLocal, tz);
                query = query.Where(r => r.HoraIngresoUtc >= desdeUtc);
            }

            if (hasta.HasValue)
            {
                var hastaFinLocal = DateTime.SpecifyKind(hasta.Value.Date.AddDays(1), DateTimeKind.Unspecified);
                var hastaFinUtc = TimeZoneInfo.ConvertTimeToUtc(hastaFinLocal, tz);
                query = query.Where(r => r.HoraIngresoUtc < hastaFinUtc);
            }

            var registros = (from r in query
                             join u in _db.Users on r.RegistradoPor equals u.Id into gj
                             from subUser in gj.DefaultIfEmpty()
                             orderby r.HoraIngresoUtc descending
                             select new
                             {
                                 r.Placa,
                                 r.Marca,
                                 r.Modelo,
                                 r.Color,
                                 r.TipoVehiculo,
                                 r.HoraIngresoUtc,
                                 r.HoraSalidaUtc,
                                 RegistradoPorNombre = subUser != null ? subUser.Nombre : "SISTEMA"
                             }).ToList();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Registros Vehículos");

            // --- PALETA DE COLORES PREMIUM ---
            var primaryColor = XLColor.FromHtml("#312e81"); // Indigo 900
            var secondaryColor = XLColor.FromHtml("#4338ca"); // Indigo 700
            var accentColor = XLColor.FromHtml("#eef2ff"); // Indigo 50 (for stripes)
            var borderColor = XLColor.FromHtml("#c7d2fe"); // Indigo 200

            // Fetch ClientName from SystemSettings
            var clientSetting = await _db.SystemSettings.FirstOrDefaultAsync(s => s.Key == "ClientName");
            string clientName = clientSetting?.Value ?? "SOFTCOINP";

            // 1. Título Principal
            var titleRange = worksheet.Range(1, 1, 1, 9);
            titleRange.Merge().Value = $"{clientName} - HISTORIAL VEHICULAR";
            titleRange.Style
                .Font.SetBold()
                .Font.SetFontSize(16)
                .Font.SetFontColor(XLColor.White)
                .Fill.SetBackgroundColor(primaryColor)
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                .Alignment.SetVertical(XLAlignmentVerticalValues.Center);
            worksheet.Row(1).Height = 35;

            // 2. Info Contexto
            worksheet.Cell(2, 1).Value = "Filtro:";
            string rangoStr = (desde.HasValue ? desde.Value.ToString("yyyy-MM-dd") : "Inicio") + 
                             " hasta " + 
                             (hasta.HasValue ? hasta.Value.ToString("yyyy-MM-dd") : "Hoy");
            worksheet.Cell(2, 2).Value = rangoStr;
            worksheet.Cell(2, 8).Value = "Generado el:";
            worksheet.Cell(2, 9).Value = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).ToString("yyyy-MM-dd HH:mm:ss");

            var infoRange = worksheet.Range(2, 1, 2, 9);
            infoRange.Style.Font.SetFontSize(9).Font.SetFontColor(secondaryColor);
            infoRange.Style.Border.BottomBorder = XLBorderStyleValues.Thin;
            infoRange.Style.Border.BottomBorderColor = borderColor;

            // 3. Encabezados
            string[] headers = { 
                "PLACA", "MARCA", "MODELO", "COLOR", "TIPO VEHÍCULO", 
                "FECHA INGRESO", "HORA INGRESO", "ESTADO / SALIDA", "REGISTRADO POR" 
            };

            for (int i = 0; i < headers.Length; i++)
            {
                var cell = worksheet.Cell(4, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.SetBold().Font.SetFontSize(10).Font.SetFontColor(XLColor.White)
                    .Fill.SetBackgroundColor(secondaryColor)
                    .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                    .Alignment.SetVertical(XLAlignmentVerticalValues.Center)
                    .Border.SetOutsideBorder(XLBorderStyleValues.Thin)
                    .Border.SetOutsideBorderColor(primaryColor);
            }
            worksheet.Row(4).Height = 25;

            // 4. Datos
            int row = 5;
            foreach (var r in registros)
            {
                var ingresoLocal = TimeZoneInfo.ConvertTimeFromUtc(r.HoraIngresoUtc, tz);
                var salidaLocal = r.HoraSalidaUtc.HasValue ? TimeZoneInfo.ConvertTimeFromUtc(r.HoraSalidaUtc.Value, tz) : (DateTime?)null;

                worksheet.Cell(row, 1).Value = r.Placa;
                worksheet.Cell(row, 2).Value = r.Marca;
                worksheet.Cell(row, 3).Value = r.Modelo;
                worksheet.Cell(row, 4).Value = r.Color;
                worksheet.Cell(row, 5).Value = r.TipoVehiculo?.ToUpper() ?? "OTRO";
                worksheet.Cell(row, 6).Value = ingresoLocal.ToString("yyyy-MM-dd");
                worksheet.Cell(row, 7).Value = ingresoLocal.ToString("HH:mm:ss");
                worksheet.Cell(row, 8).Value = salidaLocal?.ToString("yyyy-MM-dd HH:mm:ss") ?? "EN SITIO";
                worksheet.Cell(row, 9).Value = r.RegistradoPorNombre;

                if (row % 2 == 0) worksheet.Range(row, 1, row, 9).Style.Fill.SetBackgroundColor(accentColor);
                
                var rowRange = worksheet.Range(row, 1, row, 9);
                rowRange.Style.Font.SetFontSize(10).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                rowRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
                rowRange.Style.Border.InsideBorderColor = XLColor.White;
                rowRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                rowRange.Style.Border.OutsideBorderColor = borderColor;

                worksheet.Cell(row, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Font.SetBold();
                worksheet.Cell(row, 6).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                worksheet.Cell(row, 7).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                
                if (!salidaLocal.HasValue) worksheet.Cell(row, 8).Style.Font.SetFontColor(XLColor.Red).Font.SetBold();

                row++;
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var bytes = stream.ToArray();

            try { await _audit.LogAsync("RegistrosVehiculosExcel", "Vehiculo", null, new { cantidad = registros.Count }); } catch { }

            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Reporte_Vehiculos_Softcoinp_{TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz):yyyyMMdd_HHmm}.xlsx");
        }

        // GET: api/registrovehiculo/activos
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
