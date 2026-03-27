using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Softcoinp.Backend.Dtos;
using Softcoinp.Backend.Helpers;
using Softcoinp.Backend.Models;
using Softcoinp.Backend.Services;
using System;
using System.Linq;
using System.Threading.Tasks;
using ClosedXML.Excel;
using System.IO;
using System.Collections.Generic;

namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Todos los endpoints requieren autenticaciÃ³n
    public class AnotacionesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IAuditService _audit;

        public AnotacionesController(AppDbContext db, IAuditService audit)
        {
            _db = db;
            _audit = audit;
        }

        // GET: api/anotaciones
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var anotaciones = await _db.Anotaciones
                .OrderByDescending(a => a.FechaCreacionUtc)
                .Select(a => new AnotacionDto
                {
                    Id = a.Id,
                    PersonalId = a.PersonalId,
                    PersonalNombre = a.Personal != null ? a.Personal.Nombre : null,
                    PersonalApellido = a.Personal != null ? a.Personal.Apellido : null,
                    PersonalDocumento = a.Personal != null ? a.Personal.Documento : null,
                    PersonalFotoUrl = a.Personal != null ? a.Personal.FotoUrl : null,
                    VehiculoId = a.VehiculoId,
                    VehiculoPlaca = a.Vehiculo != null ? a.Vehiculo.Placa : null,
                    VehiculoFotoUrl = a.Vehiculo != null ? a.Vehiculo.FotoUrl : null,
                    Texto = a.Texto,
                    FechaCreacionUtc = a.FechaCreacionUtc,
                    RegistradoPor = a.RegistradoPor,
                    RegistradoPorEmail = _db.Users.Where(u => u.Id == a.RegistradoPor).Select(u => u.Email).FirstOrDefault(),
                    PersonalIsBloqueado = a.Personal != null ? a.Personal.IsBloqueado : null,
                    VehiculoIsBloqueado = a.Vehiculo != null ? a.Vehiculo.IsBloqueado : null
                })
                .ToListAsync();

            return Ok(ApiResponse<List<AnotacionDto>>.SuccessResponse(anotaciones));
        }

        // POST: api/anotaciones
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAnotacionDto input)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<AnotacionDto>.Fail(null, "Error de validaciÃ³n", ModelState));

            if (!input.PersonalId.HasValue && !input.VehiculoId.HasValue)
                return BadRequest(ApiResponse<AnotacionDto>.Fail(null, "Debe proporcionar un ID de Personal o un ID de VehÃ­culo."));

            if (input.PersonalId.HasValue)
            {
                var personalExists = await _db.Personal.AnyAsync(p => p.Id == input.PersonalId);
                if (!personalExists)
                    return NotFound(ApiResponse<AnotacionDto>.Fail(null, "Persona no encontrada en el sistema."));
            }

            if (input.VehiculoId.HasValue)
            {
                var vehiculoExists = await _db.Vehiculos.AnyAsync(v => v.Id == input.VehiculoId);
                if (!vehiculoExists)
                    return NotFound(ApiResponse<AnotacionDto>.Fail(null, "VehÃ­culo no encontrado en el sistema."));
            }

            var userIdClaim = User.FindFirst("id")?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized(ApiResponse<AnotacionDto>.Fail(null, "No se pudo identificar al usuario actual."));

            var anotacion = new Anotacion
            {
                Id = Guid.NewGuid(),
                PersonalId = input.PersonalId,
                VehiculoId = input.VehiculoId,
                Texto = input.Texto,
                FechaCreacionUtc = DateTime.UtcNow,
                RegistradoPor = userId
            };

            _db.Anotaciones.Add(anotacion);
            await _db.SaveChangesAsync();

            try
            {
                await _audit.LogAsync("AnotacionCreated", "Anotacion", anotacion.Id, new
                {
                    anotacion.PersonalId,
                    anotacion.VehiculoId,
                    anotacion.RegistradoPor
                });
            }
            catch { }

            var dto = new AnotacionDto
            {
                Id = anotacion.Id,
                PersonalId = anotacion.PersonalId,
                VehiculoId = anotacion.VehiculoId,
                Texto = anotacion.Texto,
                FechaCreacionUtc = anotacion.FechaCreacionUtc,
                RegistradoPor = anotacion.RegistradoPor
            };

            return Ok(ApiResponse<AnotacionDto>.SuccessResponse(dto, "AnotaciÃ³n guardada correctamente"));
        }

        // GET: api/anotaciones/vehiculo/{vehiculoId}
        [HttpGet("vehiculo/{vehiculoId}")]
        public async Task<IActionResult> GetAnotacionesByVehiculo(Guid vehiculoId)
        {
            var anotaciones = await _db.Anotaciones
                .Where(a => a.VehiculoId == vehiculoId)
                .OrderByDescending(a => a.FechaCreacionUtc)
                .Select(a => new AnotacionDto
                {
                    Id = a.Id,
                    VehiculoId = a.VehiculoId,
                    VehiculoPlaca = a.Vehiculo != null ? a.Vehiculo.Placa : null,
                    VehiculoFotoUrl = a.Vehiculo != null ? a.Vehiculo.FotoUrl : null,
                    Texto = a.Texto,
                    FechaCreacionUtc = a.FechaCreacionUtc,
                    RegistradoPor = a.RegistradoPor,
                    RegistradoPorEmail = _db.Users.Where(u => u.Id == a.RegistradoPor).Select(u => u.Email).FirstOrDefault(),
                    PersonalIsBloqueado = a.Personal != null ? a.Personal.IsBloqueado : null,
                    VehiculoIsBloqueado = a.Vehiculo != null ? a.Vehiculo.IsBloqueado : null
                })
                .ToListAsync();

            return Ok(ApiResponse<List<AnotacionDto>>.SuccessResponse(anotaciones));
        }

        // GET: api/anotaciones/personal/{personalId}
        [HttpGet("personal/{personalId}")]
        public async Task<IActionResult> GetAnotacionesByPersonal(Guid personalId)
        {
            var anotaciones = await _db.Anotaciones
                .Where(a => a.PersonalId == personalId && a.VehiculoId == null)
                .OrderByDescending(a => a.FechaCreacionUtc)
                .Select(a => new AnotacionDto
                {
                    Id = a.Id,
                    PersonalId = a.PersonalId,
                    PersonalNombre = a.Personal != null ? a.Personal.Nombre : null,
                    PersonalApellido = a.Personal != null ? a.Personal.Apellido : null,
                    PersonalDocumento = a.Personal != null ? a.Personal.Documento : null,
                    PersonalFotoUrl = a.Personal != null ? a.Personal.FotoUrl : null,
                    VehiculoFotoUrl = a.Vehiculo != null ? a.Vehiculo.FotoUrl : null,
                    Texto = a.Texto,
                    FechaCreacionUtc = a.FechaCreacionUtc,
                    RegistradoPor = a.RegistradoPor,
                    RegistradoPorEmail = _db.Users.Where(u => u.Id == a.RegistradoPor).Select(u => u.Email).FirstOrDefault(),
                    PersonalIsBloqueado = a.Personal != null ? a.Personal.IsBloqueado : null,
                    VehiculoIsBloqueado = a.Vehiculo != null ? a.Vehiculo.IsBloqueado : null
                })
                .ToListAsync();

            return Ok(ApiResponse<List<AnotacionDto>>.SuccessResponse(anotaciones));
        }
            // GET: api/anotaciones/exportar-excel
        [HttpGet("exportar-excel")]
        [Authorize(Roles = "admin,superadmin")]
        public async Task<IActionResult> ExportarExcel(
            [FromQuery] string? query,
            [FromQuery] string? status,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time"); 
            var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
            var dbQuery = _db.Anotaciones.Include(a => a.Personal).Include(a => a.Vehiculo).AsQueryable();

            // Solo novedades de Personas
            dbQuery = dbQuery.Where(a => a.PersonalId != null && a.VehiculoId == null);

            if (!string.IsNullOrWhiteSpace(query))
            {
                var q = query.ToLower();
                dbQuery = dbQuery.Where(a => 
                    EF.Functions.ILike(a.Texto, $"%{q}%") || 
                    EF.Functions.ILike(a.Personal!.Nombre, $"%{q}%") || 
                    EF.Functions.ILike(a.Personal!.Apellido, $"%{q}%") ||
                    EF.Functions.ILike(a.Personal!.Documento, $"%{q}%")
                );
            }

            if (status == "bloqueado")
                dbQuery = dbQuery.Where(a => a.Personal!.IsBloqueado == true);
            else if (status == "habilitado")
                dbQuery = dbQuery.Where(a => a.Personal!.IsBloqueado == false);

            if (desde.HasValue)
            {
                var desdeLocal = DateTime.SpecifyKind(desde.Value.Date, DateTimeKind.Unspecified);
                var desdeUtc = TimeZoneInfo.ConvertTimeToUtc(desdeLocal, tz);
                dbQuery = dbQuery.Where(a => a.FechaCreacionUtc >= desdeUtc);
            }

            if (hasta.HasValue)
            {
                var hastaFinLocal = DateTime.SpecifyKind(hasta.Value.Date.AddDays(1), DateTimeKind.Unspecified);
                var hastaFinUtc = TimeZoneInfo.ConvertTimeToUtc(hastaFinLocal, tz);
                dbQuery = dbQuery.Where(a => a.FechaCreacionUtc < hastaFinUtc);
            }

            var rawAnotaciones = await dbQuery
                .OrderByDescending(a => a.FechaCreacionUtc)
                .ToListAsync();

            // Precargar usuarios para evitar N+1 y errores de acceso concurrente/contexto
            var userIds = rawAnotaciones.Select(a => a.RegistradoPor).Distinct().ToList();
            var userDict = await _db.Users
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new { u.Id, Nickname = u.Email!.Split('@', StringSplitOptions.None)[0].ToUpper() })
                .ToDictionaryAsync(u => u.Id, u => u.Nickname);

            // --- AGRUPACION CENTRALIZADA POR CIUDAANO ---
            var groupedData = rawAnotaciones
                .GroupBy(a => a.PersonalId)
                .Select(g => 
                {
                    var persona = g.First().Personal!;
                    return new {
                        Documento = persona.Documento,
                        Ciudadano = $"{persona.Nombre} {persona.Apellido}",
                        Eventos = g.Count(),
                        // Consolidar todas las descripciones en un solo bloque de texto
                        Historial_Novedades = string.Join("\n\n---\n", g.Select(x => {
                            string reporter = userDict.ContainsKey(x.RegistradoPor) ? userDict[x.RegistradoPor] : "SISTEMA";
                            return $"FECHA: [{TimeZoneInfo.ConvertTimeFromUtc(x.FechaCreacionUtc, tz):dd/MM/yy HH:mm}] - (Reportado por: {reporter})\nNOVEDAD: {x.Texto}";
                        })),
                        Ultima_Actividad_Date = g.Max(x => x.FechaCreacionUtc),
                        Ultima_Actividad = TimeZoneInfo.ConvertTimeFromUtc(g.Max(x => x.FechaCreacionUtc), tz).ToString("yyyy-MM-dd HH:mm"),
                        Estado = persona.IsBloqueado ? "BLOQUEADO" : "HABILITADO",
                        IsLocked = persona.IsBloqueado
                    };
                })
                .OrderByDescending(x => x.Eventos)
                .ToList();

            using var workbook = new XLWorkbook();
            
            // --- COLORES CORPORATIVOS ELITE ---
            var colorNavy = XLColor.FromHtml("#0F172A");
            var colorGold = XLColor.FromHtml("#B59410");
            var colorGray = XLColor.FromHtml("#F1F5F9");
            var colorBorder = XLColor.FromHtml("#CBD5E1");

            // ==========================================
            // HOJA 1: DASHBOARD EJECUTIVO
            // ==========================================
            var wsDash = workbook.Worksheets.Add("RESUMEN EJECUTIVO");
            wsDash.Style.Font.SetFontName("Calibri").Font.SetFontSize(11);

            // Banner Principal
            var mainTitle = wsDash.Range("B2:G2");
            mainTitle.Merge().Value = "INFORME ESTRATEGICO DE SEGURIDAD Y CONTROL";
            mainTitle.Style.Font.SetBold().Font.SetFontSize(22).Font.SetFontColor(colorNavy);
            mainTitle.Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Left);
            
            wsDash.Cell(3, 2).Value = "ANALISIS DE RIESGO Y RECURRENCIA DE CIUDADANOS";
            wsDash.Cell(3, 2).Style.Font.SetFontSize(12).Font.SetFontColor(XLColor.SlateGray);
            
            // Linea decorativa
            var lineDash = wsDash.Range("B4:G4");
            lineDash.Merge().Style.Fill.SetBackgroundColor(colorNavy);
            wsDash.Row(4).Height = 3;

            // KPIs - Cards de Informacion (Metodo Manual por Estilo)
            void CreateKpi(int row, int col, string label, string value, XLColor valColor) {
               var rKpi = wsDash.Range(row, col, row + 2, col + 1);
               rKpi.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
               rKpi.Style.Border.OutsideBorderColor = colorBorder;
               rKpi.Style.Fill.SetBackgroundColor(XLColor.White);
               
               wsDash.Cell(row, col).Value = label;
               wsDash.Cell(row, col).Style.Font.SetBold().Font.SetFontSize(9).Font.SetFontColor(XLColor.SlateGray);
               wsDash.Cell(row + 1, col).Value = value;
               wsDash.Cell(row + 1, col).Style.Font.SetBold().Font.SetFontSize(18).Font.SetFontColor(valColor);
            }

            int sujetosTot = groupedData.Count;
            int bloqueadosTot = groupedData.Count(x => x.IsLocked);
            var infractorTop = groupedData.FirstOrDefault();

            CreateKpi(6, 2, "TOTAL CIUDADANOS", sujetosTot.ToString(), colorNavy);
            CreateKpi(6, 4, "BLOQUEOS ACTIVOS", bloqueadosTot.ToString(), XLColor.Red);

            // Seccion de TOP INFRACTOR
            if (infractorTop != null) {
                var topArea = wsDash.Range(10, 2, 13, 7);
                topArea.Style.Fill.SetBackgroundColor(colorGray);
                topArea.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                topArea.Style.Border.OutsideBorderColor = colorBorder;
                
                wsDash.Cell(10, 3).Value = "ANALISIS DE MAYOR RECURRENCIA (TOP INFRACTOR)";
                wsDash.Cell(10, 3).Style.Font.SetBold().Font.SetFontSize(10).Font.SetFontColor(colorNavy);
                
                wsDash.Cell(11, 3).Value = "CIUDADANO:";
                wsDash.Cell(11, 4).Value = infractorTop.Ciudadano;
                wsDash.Cell(12, 3).Value = "TOTAL EVENTOS:";
                wsDash.Cell(12, 4).Value = $"{infractorTop.Eventos} registros detectados";
                wsDash.Cell(11, 4).Style.Font.SetBold();
                wsDash.Cell(12, 4).Style.Font.SetBold().Font.SetFontColor(XLColor.Red);
            }

            // Pie de Pagina
            wsDash.Cell(15, 2).Value = "Generado por Sistema Softcoinp V2 - Reporte Certificado de Auditoria:";
            wsDash.Cell(15, 6).Value = nowLocal.ToString("dd/MM/yyyy HH:mm:ss");
            wsDash.Range(15, 2, 15, 3).Style.Font.SetItalic().Font.SetFontSize(8).Font.SetFontColor(XLColor.Gray);
            
            wsDash.Columns().AdjustToContents();
            wsDash.Column(1).Width = 3;

            // ==========================================
            // HOJA 2: DETALLE ANALITICO
            // ==========================================
            var wsDet = workbook.Worksheets.Add("DETALLE ANALITICO");
            wsDet.Style.Font.SetFontName("Calibri");

            var detHeader = wsDet.Range("A1:F1");
            detHeader.Merge().Value = "BITACORA CONSOLIDADA Y ANALISIS DE RECURRENCIA";
            detHeader.Style.Font.SetBold().Font.SetFontSize(14).Font.SetFontColor(XLColor.White).Fill.SetBackgroundColor(colorNavy);
            detHeader.Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center).Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
            wsDet.Row(1).Height = 30;

            var dTable = groupedData.Select(x => new { 
                DOCUMENTO = x.Documento, 
                CIUDADANO = x.Ciudadano, 
                RECURRENCIA = x.Eventos,
                HISTORIAL_AUDITORIA = x.Historial_Novedades,
                ULTIMA_FECHA = x.Ultima_Actividad,
                ESTADO = x.Estado 
            });

            var tblElite = wsDet.Cell(3, 1).InsertTable(dTable);
            tblElite.Theme = XLTableTheme.TableStyleMedium4; // Minimalista y Pro
            tblElite.ShowAutoFilter = true;

            // Bloqueo de Hojas (Elite Security Protection)
            void ProtectSheet(IXLWorksheet ws) {
               ws.Protect("Softcoinp2026")
                 .AllowElement(XLSheetProtectionElements.AutoFilter)
                 .AllowElement(XLSheetProtectionElements.FormatColumns)
                 .AllowElement(XLSheetProtectionElements.FormatRows);
            }

            // Barras de Datos (Solid Pro) para Recurrencia
            if (groupedData.Count > 0) {
               var recurrenciaRange = wsDet.Range(4, 3, 4 + groupedData.Count - 1, 3);
               recurrenciaRange.AddConditionalFormat().DataBar(XLColor.FromHtml("#FCA5A5")); // Rojo suave sólido
            }

            // Estilos de Fila Analitica
            foreach (var row in tblElite.DataRange.Rows()) {
                row.Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                var cellStatus = row.Field("ESTADO");
                if (cellStatus.Value.ToString() == "BLOQUEADO") {
                   row.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#FEF2F2")); // Red 50 (Suave)
                   cellStatus.Style.Font.SetFontColor(XLColor.DarkRed).Font.SetBold();
                } else {
                   cellStatus.Style.Font.SetFontColor(XLColor.SeaGreen).Font.SetBold();
                }
            }

            wsDet.Columns().AdjustToContents();
            wsDet.Column(4).Width = 85; 
            wsDet.Column(4).Style.Alignment.SetWrapText(true);
            wsDet.Column(2).Width = 35;

            // Aplicar proteccion final
            ProtectSheet(wsDash);
            ProtectSheet(wsDet);

            // 5. AUDITORÍA Y DESCARGA
            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            try { await _audit.LogAsync("AnotacionesExportExcelEliteLocked", "Anotacion", null, new { ciudadanos = sujetosTot }); } catch { }

            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                $"Security_Executive_Report_{nowLocal:yyyyMMdd}.xlsx");
        }

        // GET: api/anotaciones/exportar-vehiculo-excel
        [HttpGet("exportar-vehiculo-excel")]
        [Authorize(Roles = "admin,superadmin")]
        public async Task<IActionResult> ExportarVehiculoExcel(
            [FromQuery] string? query,
            [FromQuery] string? status,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time"); 
            var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
            var dbQuery = _db.Anotaciones.Include(a => a.Vehiculo).AsQueryable();

            // Solo novedades de Vehiculos
            dbQuery = dbQuery.Where(a => a.VehiculoId != null && a.PersonalId == null);

            if (!string.IsNullOrWhiteSpace(query))
            {
                var q = query.ToLower();
                dbQuery = dbQuery.Where(a => 
                    EF.Functions.ILike(a.Texto, $"%{q}%") || 
                    EF.Functions.ILike(a.Vehiculo!.Placa, $"%{q}%")
                );
            }

            if (status == "bloqueado")
                dbQuery = dbQuery.Where(a => a.Vehiculo!.IsBloqueado == true);
            else if (status == "habilitado")
                dbQuery = dbQuery.Where(a => a.Vehiculo!.IsBloqueado == false);

            if (desde.HasValue)
            {
                var desdeLocal = DateTime.SpecifyKind(desde.Value.Date, DateTimeKind.Unspecified);
                var desdeUtc = TimeZoneInfo.ConvertTimeToUtc(desdeLocal, tz);
                dbQuery = dbQuery.Where(a => a.FechaCreacionUtc >= desdeUtc);
            }

            if (hasta.HasValue)
            {
                var hastaFinLocal = DateTime.SpecifyKind(hasta.Value.Date.AddDays(1), DateTimeKind.Unspecified);
                var hastaFinUtc = TimeZoneInfo.ConvertTimeToUtc(hastaFinLocal, tz);
                dbQuery = dbQuery.Where(a => a.FechaCreacionUtc < hastaFinUtc);
            }

            var rawAnotaciones = await dbQuery
                .OrderByDescending(a => a.FechaCreacionUtc)
                .ToListAsync();

            var userIds = rawAnotaciones.Select(a => a.RegistradoPor).Distinct().ToList();
            var userDict = await _db.Users
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new { u.Id, Nickname = u.Email!.Split('@', StringSplitOptions.None)[0].ToUpper() })
                .ToDictionaryAsync(u => u.Id, u => u.Nickname);

            var groupedData = rawAnotaciones
                .GroupBy(a => a.VehiculoId)
                .Select(g => 
                {
                    var veh = g.First().Vehiculo!;
                    return new {
                        Placa = veh.Placa,
                        Detalles = $"{veh.Marca} {veh.Modelo} ({veh.Color})",
                        Eventos = g.Count(),
                        Historial = string.Join("\n\n---\n", g.Select(x => {
                            string reporter = userDict.ContainsKey(x.RegistradoPor) ? userDict[x.RegistradoPor] : "SISTEMA";
                            return $"FECHA: [{TimeZoneInfo.ConvertTimeFromUtc(x.FechaCreacionUtc, tz):dd/MM/yy HH:mm}] - (Operario: {reporter})\nNOVEDAD: {x.Texto}";
                        })),
                        Ultima_Actividad = TimeZoneInfo.ConvertTimeFromUtc(g.Max(x => x.FechaCreacionUtc), tz).ToString("yyyy-MM-dd HH:mm"),
                        Estado = veh.IsBloqueado ? "BLOQUEADO" : "HABILITADO",
                        IsLocked = veh.IsBloqueado
                    };
                })
                .OrderByDescending(x => x.Eventos)
                .ToList();

            using var workbook = new XLWorkbook();
            var colorNavy = XLColor.FromHtml("#0F172A");
            var colorGray = XLColor.FromHtml("#F1F5F9");
            var colorBorder = XLColor.FromHtml("#CBD5E1");

            // ==========================================
            // HOJA 1: RESUMEN DE FLOTA
            // ==========================================
            var wsDash = workbook.Worksheets.Add("DASHBOARD VEHICULAR");
            wsDash.Style.Font.SetFontName("Calibri");

            var mainTitle = wsDash.Range("B2:G2");
            mainTitle.Merge().Value = "INFORME ESTRATEGICO DE SEGURIDAD VEHICULAR";
            mainTitle.Style.Font.SetBold().Font.SetFontSize(22).Font.SetFontColor(colorNavy);
            
            wsDash.Cell(3, 2).Value = "ANALISIS DE INCIDENCIAS Y CONTROL DE ACCESO VEHICULAR";
            wsDash.Cell(3, 2).Style.Font.SetFontSize(12).Font.SetFontColor(XLColor.SlateGray);
            
            var lineDash = wsDash.Range("B4:G4");
            lineDash.Merge().Style.Fill.SetBackgroundColor(colorNavy);
            wsDash.Row(4).Height = 3;

            void CreateKpi(int row, int col, string label, string value, XLColor vColor) {
               var rKpi = wsDash.Range(row, col, row + 2, col + 1);
               rKpi.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
               rKpi.Style.Border.OutsideBorderColor = colorBorder;
               rKpi.Style.Fill.SetBackgroundColor(XLColor.White);
               wsDash.Cell(row, col).Value = label;
               wsDash.Cell(row, col).Style.Font.SetBold().Font.SetFontSize(9).Font.SetFontColor(XLColor.SlateGray);
               wsDash.Cell(row + 1, col).Value = value;
               wsDash.Cell(row + 1, col).Style.Font.SetBold().Font.SetFontSize(18).Font.SetFontColor(vColor);
            }

            int vehsTot = groupedData.Count;
            int bloqueadosTot = groupedData.Count(x => x.IsLocked);
            var vehTop = groupedData.FirstOrDefault();

            CreateKpi(6, 2, "VEHICULOS REGISTRADOS", vehsTot.ToString(), colorNavy);
            CreateKpi(6, 4, "VEHICULOS BLOQUEADOS", bloqueadosTot.ToString(), XLColor.Red);

            if (vehTop != null) {
                var topArea = wsDash.Range(10, 2, 13, 7);
                topArea.Style.Fill.SetBackgroundColor(colorGray).Border.OutsideBorder = XLBorderStyleValues.Thin;
                topArea.Style.Border.OutsideBorderColor = colorBorder;
                wsDash.Cell(10, 3).Value = "ANALISIS DE RECURRENCIA CRITICA (TOP PLACA)";
                wsDash.Cell(10, 3).Style.Font.SetBold().Font.SetFontSize(10).Font.SetFontColor(colorNavy);
                wsDash.Cell(11, 3).Value = "PLACA:";
                wsDash.Cell(11, 4).Value = vehTop.Placa;
                wsDash.Cell(12, 3).Value = "INCIDENCIAS:";
                wsDash.Cell(12, 4).Value = $"{vehTop.Eventos} registros detectados";
                wsDash.Cell(11, 4).Style.Font.SetBold();
                wsDash.Cell(12, 4).Style.Font.SetBold().Font.SetFontColor(XLColor.Red);
            }

            // ==========================================
            // HOJA 2: BITACORA ANALITICA
            // ==========================================
            var wsDet = workbook.Worksheets.Add("BITACORA DE FLOTA");
            var detHeader = wsDet.Range("A1:F1");
            detHeader.Merge().Value = "DETALLE DE NOVEDADES POR VEHICULO";
            detHeader.Style.Font.SetBold().Font.SetFontSize(14).Font.SetFontColor(XLColor.White).Fill.SetBackgroundColor(colorNavy);
            detHeader.Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center).Alignment.SetVertical(XLAlignmentVerticalValues.Center);
            wsDet.Row(1).Height = 30;

            var dTable = groupedData.Select(x => new { 
                PLACA = x.Placa, 
                VEHICULO = x.Detalles, 
                EVENTOS = x.Eventos,
                HISTORIAL_DETALLADO = x.Historial,
                ULTIMA_ACTIVIDAD = x.Ultima_Actividad,
                ESTADO = x.Estado 
            });

            var tblElite = wsDet.Cell(3, 1).InsertTable(dTable);
            tblElite.Theme = XLTableTheme.TableStyleMedium4;
            tblElite.ShowAutoFilter = true;

            if (groupedData.Count > 0) {
               var recurrenciaRange = wsDet.Range(4, 3, 4 + groupedData.Count - 1, 3);
               recurrenciaRange.AddConditionalFormat().DataBar(XLColor.FromHtml("#FCA5A5"));
            }

            foreach (var row in tblElite.DataRange.Rows()) {
                row.Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                var cellStatus = row.Field("ESTADO");
                if (cellStatus.Value.ToString() == "BLOQUEADO") {
                   row.Style.Fill.SetBackgroundColor(XLColor.FromHtml("#FEF2F2"));
                   cellStatus.Style.Font.SetFontColor(XLColor.DarkRed).Font.SetBold();
                } else {
                   cellStatus.Style.Font.SetFontColor(XLColor.SeaGreen).Font.SetBold();
                }
            }

            wsDet.Columns().AdjustToContents();
            wsDet.Column(4).Width = 85; 
            wsDet.Column(4).Style.Alignment.SetWrapText(true);
            wsDet.Column(1).Width = 15;

            // PROTECCION
            void ProtectSheet(IXLWorksheet ws) {
               ws.Protect("Softcoinp2026")
                 .SetAutoFilter(true)
                 .SetFormatColumns(true)
                 .SetFormatRows(true)
                 .SetSelectLockedCells(true)
                 .SetSelectUnlockedCells(true);
            }
            ProtectSheet(wsDash);
            ProtectSheet(wsDet);

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            try { await _audit.LogAsync("AnotacionesExportVehiculoExcelElite", "Anotacion", null, new { vehiculos = vehsTot }); } catch { }

            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                $"Security_Vehicle_Report_{nowLocal:yyyyMMdd}.xlsx");
        }

        // PATCH: api/anotaciones/{id}
        [HttpPatch("{id}")]
        [Authorize(Roles = "admin,superadmin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAnotacionDto input)
        {
            if (string.IsNullOrWhiteSpace(input.Texto))
                return BadRequest(ApiResponse<AnotacionDto>.Fail(null, "El texto no puede estar vacÃ­o."));

            var anotacion = await _db.Anotaciones.FindAsync(id);
            if (anotacion == null)
                return NotFound(ApiResponse<AnotacionDto>.Fail(null, "AnotaciÃ³n no encontrada."));

            anotacion.Texto = input.Texto;
            await _db.SaveChangesAsync();

            try { await _audit.LogAsync("AnotacionUpdated", "Anotacion", id, new { anotacion.PersonalId, anotacion.VehiculoId }); } catch { }

            var dto = new AnotacionDto
            {
                Id = anotacion.Id,
                PersonalId = anotacion.PersonalId,
                VehiculoId = anotacion.VehiculoId,
                Texto = anotacion.Texto,
                FechaCreacionUtc = anotacion.FechaCreacionUtc,
                RegistradoPor = anotacion.RegistradoPor
            };

            return Ok(ApiResponse<AnotacionDto>.SuccessResponse(dto, "AnotaciÃ³n actualizada correctamente."));
        }

        // DELETE: api/anotaciones/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "admin,superadmin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var anotacion = await _db.Anotaciones.FindAsync(id);
            if (anotacion == null)
                return NotFound(ApiResponse<AnotacionDto>.Fail(null, "AnotaciÃ³n no encontrada."));

            _db.Anotaciones.Remove(anotacion);
            await _db.SaveChangesAsync();

            try { await _audit.LogAsync("AnotacionDeleted", "Anotacion", id, new { anotacion.PersonalId, anotacion.VehiculoId }); } catch { }

            return Ok(ApiResponse<object>.SuccessResponse(null!, "AnotaciÃ³n eliminada correctamente."));
        }
    }
}

