using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Softcoinp.Backend.Models;
using Softcoinp.Backend.Dtos; // Usaremos esta directiva para referenciar tus DTOs existentes (como CreateRegistroDto, UpdateRegistroDto, RegistroDto, etc.)
using Softcoinp.Backend.Services;
using Softcoinp.Backend.Helpers;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using System.Text;
using Softcoinp.Backend.Exceptions;
using System.IO; // 🆕 Necesario para System.IO.File y Path

namespace Softcoinp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RegistrosController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IAuditService _audit;

        public RegistrosController(AppDbContext db, IAuditService audit)
        {
            _db = db;
            _audit = audit;
        }

        // GET: api/registros
        [HttpGet]
        public IActionResult GetAll(
            [FromQuery] string? nombre,
            [FromQuery] string? documento,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _db.Registros.AsQueryable();

            if (!string.IsNullOrWhiteSpace(nombre))
                query = query.Where(r => EF.Functions.ILike(r.Nombre, $"%{nombre}%"));

            if (!string.IsNullOrWhiteSpace(documento))
                query = query.Where(r => r.Documento == documento);

            if (desde.HasValue)
                query = query.Where(r => r.HoraIngresoUtc >= desde.Value.Date);

            if (hasta.HasValue)
            {
                var hastaFin = hasta.Value.Date.AddDays(1); // incluir todo el día
                query = query.Where(r => r.HoraIngresoUtc < hastaFin);
            }

            var total = query.Count();

            // 🛑 Cambio clave: Proyección a tipo anónimo para crear la estructura anidada "personal: {}"
            var registros = query
                .OrderByDescending(r => r.HoraIngresoUtc)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new // Tipo Anónimo
                {
                    Id = r.Id,
                    Personal = new // Objeto anidado "personal"
                    {
                        Id = r.PersonalId, 
                        Nombre = r.Nombre,
                        Apellido = r.Apellido,
                        Documento = r.Documento,
                        Tipo = r.Tipo,
                    },
                    Motivo = r.Motivo,
                    Destino = r.Destino,
                    HoraIngresoUtc = r.HoraIngresoUtc,
                    HoraIngresoLocal = r.HoraIngresoLocal,
                    HoraSalidaUtc = r.HoraSalidaUtc,
                    HoraSalidaLocal = r.HoraSalidaLocal,
                    RegistradoPor = r.RegistradoPor,
                    FotoUrl = r.FotoUrl // 🆕 Asegúrate de incluir FotoUrl si es visible
                })
                .ToList();

            // Los contenedores de respuesta deben usar 'object' debido al tipo anónimo
            var response = new PagedResponse<object>(registros.Cast<object>().ToList(), total, page, pageSize); 
            return Ok(ApiResponse<PagedResponse<object>>.SuccessResponse(response)); 
        }

        // GET: api/registros/{id}
        [HttpGet("{id}")]
        public IActionResult GetById(Guid id)
        {
            var registro = _db.Registros
                .Where(r => r.Id == id)
                .Select(r => new RegistroDto
                {
                    Id = r.Id,
                    Nombre = r.Nombre,
                    Apellido = r.Apellido,
                    Documento = r.Documento,
                    Motivo = r.Motivo,
                    Destino = r.Destino,
                    Tipo = r.Tipo,
                    HoraIngresoUtc = r.HoraIngresoUtc,
                    HoraIngresoLocal = r.HoraIngresoLocal,
                    HoraSalidaUtc = r.HoraSalidaUtc,
                    HoraSalidaLocal = r.HoraSalidaLocal,
                    RegistradoPor = r.RegistradoPor,
                    FotoUrl = r.FotoUrl // 🆕 Incluir FotoUrl
                })
                .FirstOrDefault();

            if (registro == null)
                return NotFound(ApiResponse<RegistroDto>.Fail(null, "Registro no encontrado"));

            return Ok(ApiResponse<RegistroDto>.SuccessResponse(registro));
        }

        // GET: api/registros/buscar?documento=123456
        [HttpGet("buscar")]
        public IActionResult BuscarPorDocumento([FromQuery] string documento)
        {
            if (string.IsNullOrWhiteSpace(documento))
                return BadRequest(ApiResponse<RegistroDto>.Fail(null, "El documento es obligatorio"));

            var registro = _db.Registros
                .Where(r => r.Documento == documento)
                .OrderByDescending(r => r.HoraIngresoUtc)
                .Select(r => new RegistroDto
                {
                    Id = r.Id,
                    Nombre = r.Nombre,
                    Apellido = r.Apellido,
                    Documento = r.Documento,
                    Motivo = r.Motivo,
                    Destino = r.Destino,
                    Tipo = r.Tipo,
                    HoraIngresoUtc = r.HoraIngresoUtc,
                    HoraIngresoLocal = r.HoraIngresoLocal,
                    HoraSalidaUtc = r.HoraSalidaUtc,
                    HoraSalidaLocal = r.HoraSalidaLocal,
                    RegistradoPor = r.RegistradoPor,
                    FotoUrl = r.FotoUrl // 🆕 Incluir FotoUrl
                })
                .FirstOrDefault();

            if (registro == null)
                return NotFound(ApiResponse<RegistroDto>.Fail(null, "No se encontró una persona con ese documento"));

            return Ok(ApiResponse<RegistroDto>.SuccessResponse(registro));
        }


        // // POST: api/registros
        // [HttpPost]
        // public async Task<IActionResult> Create([FromBody] CreateRegistroDto input)
        // {
        //     if (!ModelState.IsValid)
        //         return BadRequest(ApiResponse<RegistroDto>.Fail(null, "Error de validación", ModelState));

        //     // =================================================================
        //     // 🆕 VALIDACIÓN DE FOTO OBLIGATORIA
        //     // =================================================================
        //     if (string.IsNullOrWhiteSpace(input.Foto))
        //     {
        //         return BadRequest(ApiResponse<RegistroDto>.Fail(null, "🛑 La fotografía de la persona es un requisito obligatorio para registrar la entrada."));
        //     }
        //     // =================================================================

        //     var nowUtc = DateTime.UtcNow;
        //     string? fotoUrl = null; 
            
        //     // =================================================================
        //     // 🆕 1. PROCESAR Y GUARDAR LA FOTO
        //     // =================================================================
        //     try
        //     {
        //         // 🛑 PASO 1: Separar prefijo y decodificar Base64 a bytes
        //         var base64Data = input.Foto;
        //         if (base64Data.StartsWith("data:"))
        //         {
        //             base64Data = base64Data.Substring(base64Data.IndexOf(',') + 1);
        //         }
                
        //         byte[] imageBytes = Convert.FromBase64String(base64Data);

        //         // 🛑 PASO 2: Definir el nombre de archivo y la ruta
        //         var extension = ".jpeg"; // Asumiendo JPEG por defecto
        //         var fileName = $"{input.Documento}_{DateTime.Now:yyyyMMddHHmmss}{extension}";
                
        //         // Define la ruta absoluta
        //         var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "registros");

        //         if (!Directory.Exists(uploadsFolder))
        //         {
        //             Directory.CreateDirectory(uploadsFolder);
        //         }

        //         var filePath = Path.Combine(uploadsFolder, fileName);

        //         // 🛑 PASO 3: Guardar el archivo en el disco
        //         await System.IO.File.WriteAllBytesAsync(filePath, imageBytes);

        //         // 🛑 PASO 4: Guardar la ruta pública para la DB
        //         fotoUrl = $"/uploads/registros/{fileName}";
        //     }
        //     catch (FormatException)
        //     {
        //         return BadRequest(ApiResponse<RegistroDto>.Fail(null, "El formato de la imagen Base64 es inválido."));
        //     }
        //     catch (IOException ex)
        //     {
        //         return StatusCode(500, ApiResponse<RegistroDto>.Fail(null, $"Error al guardar la foto: {ex.Message}"));
        //     }
        //     // =================================================================


        //     // 1️⃣ Buscar si la persona ya existe en la tabla Personal
        //     var persona = await _db.Personal.FirstOrDefaultAsync(p => p.Documento == input.Documento);

        //     if (persona == null)
        //     {
        //         // 2️⃣ Si no existe, crearla
        //         persona = new Personal
        //         {
        //             Id = Guid.NewGuid(),
        //             Nombre = input.Nombre,
        //             Apellido = input.Apellido,
        //             Documento = input.Documento,
        //             Tipo = input.Tipo ?? "visitante"
        //         };
        //         _db.Personal.Add(persona);
        //         await _db.SaveChangesAsync();
        //     }

        //     // 3️⃣ Crear el registro de entrada asociado a esa persona
        //     var registro = new Registro
        //     {
        //         Id = Guid.NewGuid(),
        //         PersonalId = persona.Id,
        //         Nombre = persona.Nombre,
        //         Apellido = persona.Apellido,
        //         Documento = persona.Documento,
        //         Destino = input.Destino,
        //         Motivo = input.Motivo,
        //         Tipo = persona.Tipo,
        //         HoraIngresoUtc = nowUtc,
        //         // 🆕 Asignar la URL de la foto
        //         FotoUrl = fotoUrl 
        //     };

        //     var userIdClaim = User.FindFirst("id")?.Value;
        //     if (Guid.TryParse(userIdClaim, out var userId))
        //         registro.RegistradoPor = userId;

        //     _db.Registros.Add(registro);
        //     await _db.SaveChangesAsync();

        //     // 4️⃣ Log opcional
        //     try
        //     {
        //         await _audit.LogAsync("RegistroCreated", "Registro", registro.Id, new
        //         {
        //             registro.Nombre,
        //             registro.Apellido,
        //             registro.Documento,
        //             registro.Motivo,
        //             registro.Destino,
        //             registro.Tipo,
        //             registro.RegistradoPor
        //         });
        //     }
        //     catch { }

        //     // 5️⃣ Respuesta
        //     var dto = new RegistroDto
        //     {
        //         Id = registro.Id,
        //         Nombre = persona.Nombre,
        //         Apellido = persona.Apellido,
        //         Documento = persona.Documento,
        //         Motivo = registro.Motivo,
        //         Destino = registro.Destino,
        //         Tipo = persona.Tipo,
        //         HoraIngresoUtc = registro.HoraIngresoUtc,
        //         HoraIngresoLocal = registro.HoraIngresoLocal,
        //         HoraSalidaUtc = registro.HoraSalidaUtc,
        //         HoraSalidaLocal = registro.HoraSalidaLocal,
        //         RegistradoPor = registro.RegistradoPor,
        //         // 🆕 Incluir la URL de la foto en la respuesta
        //         FotoUrl = registro.FotoUrl 
        //     };

        //     return CreatedAtAction(nameof(GetById), new { id = registro.Id },
        //         ApiResponse<RegistroDto>.SuccessResponse(dto, "Registro creado con éxito"));
        // }

        
        // POST: api/registros
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRegistroDto input)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponse<RegistroDto>.Fail(null, "Error de validación", ModelState));

            if (string.IsNullOrWhiteSpace(input.Foto))
                return BadRequest(ApiResponse<RegistroDto>.Fail(null, "🛑 La fotografía de la persona es obligatoria."));

            var nowUtc = DateTime.UtcNow;

            // ---------- Procesar foto (guardar en /uploads/personal) ----------
            string? fotoUrlPersonal = null;
            try
            {
                var base64 = input.Foto.StartsWith("data:") ? input.Foto.Substring(input.Foto.IndexOf(',') + 1) : input.Foto;
                var bytes = Convert.FromBase64String(base64);
                var fileName = $"{input.Documento}_{DateTime.Now:yyyyMMddHHmmss}.jpeg";
                var folder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "personal");
                if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);
                var path = Path.Combine(folder, fileName);
                await System.IO.File.WriteAllBytesAsync(path, bytes);
                fotoUrlPersonal = $"/uploads/personal/{fileName}";
            }
            catch (FormatException)
            {
                return BadRequest(ApiResponse<RegistroDto>.Fail(null, "Formato de imagen Base64 inválido."));
            }
            catch (IOException ex)
            {
                return StatusCode(500, ApiResponse<RegistroDto>.Fail(null, $"Error al guardar la foto: {ex.Message}"));
            }

            // ---------- Buscar o crear/actualizar Personal ----------
            var persona = await _db.Personal.FirstOrDefaultAsync(p => p.Documento == input.Documento);
            if (persona == null)
            {
                persona = new Personal
                {
                    Id = Guid.NewGuid(),
                    Nombre = input.Nombre,
                    Apellido = input.Apellido,
                    Documento = input.Documento,
                    Tipo = input.Tipo ?? "visitante",
                    FotoUrl = fotoUrlPersonal,
                    FechaCreacionUtc = DateTime.UtcNow
                };
                _db.Personal.Add(persona);
                await _db.SaveChangesAsync();
            }
            else
            {
                // Actualizar datos si el frontend envía nuevos (mantener si vienen vacíos)
                persona.Nombre = string.IsNullOrWhiteSpace(input.Nombre) ? persona.Nombre : input.Nombre;
                persona.Apellido = string.IsNullOrWhiteSpace(input.Apellido) ? persona.Apellido : input.Apellido;
                persona.Tipo = string.IsNullOrWhiteSpace(input.Tipo) ? persona.Tipo : input.Tipo;
                // Si llega foto nueva, actualizar FotoUrl
                if (!string.IsNullOrWhiteSpace(fotoUrlPersonal))
                    persona.FotoUrl = fotoUrlPersonal;
                await _db.SaveChangesAsync();
            }

            // ---------- Crear Registro usando la foto guardada en Personal ----------
            var registro = new Registro
            {
                Id = Guid.NewGuid(),
                PersonalId = persona.Id,
                Nombre = persona.Nombre,
                Apellido = persona.Apellido,
                Documento = persona.Documento,
                Destino = input.Destino,
                Motivo = input.Motivo,
                Tipo = persona.Tipo,
                HoraIngresoUtc = nowUtc,
                FotoUrl = persona.FotoUrl
            };

            var userIdClaim = User.FindFirst("id")?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
                registro.RegistradoPor = userId;

            _db.Registros.Add(registro);
            await _db.SaveChangesAsync();

            var dto = new RegistroDto
            {
                Id = registro.Id,
                Nombre = registro.Nombre,
                Apellido = registro.Apellido,
                Documento = registro.Documento,
                Motivo = registro.Motivo,
                Destino = registro.Destino,
                Tipo = registro.Tipo,
                HoraIngresoUtc = registro.HoraIngresoUtc,
                HoraIngresoLocal = registro.HoraIngresoLocal,
                HoraSalidaUtc = registro.HoraSalidaUtc,
                HoraSalidaLocal = registro.HoraSalidaLocal,
                RegistradoPor = registro.RegistradoPor,
                FotoUrl = registro.FotoUrl
            };

            return CreatedAtAction(nameof(GetById), new { id = registro.Id },
                ApiResponse<RegistroDto>.SuccessResponse(dto, "Registro creado con éxito"));
        }


        // PUT: api/registros/{id}/salida
        [HttpPut("{id}/salida")]
        public async Task<IActionResult> RegistrarSalida(Guid id)
        {
            var registro = _db.Registros.Find(id);
            if (registro == null)
                return NotFound(ApiResponse<RegistroDto>.Fail(null, "Registro no encontrado"));

            if (registro.HoraSalidaUtc != null)
                return BadRequest(ApiResponse<RegistroDto>.Fail(null, "La salida ya fue registrada"));

            registro.HoraSalidaUtc = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            try
            {
                await _audit.LogAsync("RegistroSalida", "Registro", registro.Id, new
                {
                    registro.Nombre,
                    registro.Apellido,
                    registro.Documento,
                    registro.HoraSalidaUtc,
                    registro.HoraSalidaLocal
                });
            }
            catch { }

            var dto = new RegistroDto
            {
                Id = registro.Id,
                Nombre = registro.Nombre,
                Apellido = registro.Apellido,
                Documento = registro.Documento,
                Motivo = registro.Motivo,
                Destino = registro.Destino,
                Tipo = registro.Tipo,
                HoraIngresoUtc = registro.HoraIngresoUtc,
                HoraIngresoLocal = registro.HoraIngresoLocal,
                HoraSalidaUtc = registro.HoraSalidaUtc,
                HoraSalidaLocal = registro.HoraSalidaLocal,
                RegistradoPor = registro.RegistradoPor,
                FotoUrl = registro.FotoUrl // 🆕 Incluir FotoUrl
            };

            return Ok(ApiResponse<RegistroDto>.SuccessResponse(dto, "Salida registrada con éxito"));
        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdatePartial(Guid id, [FromBody] UpdateRegistroDto input)
        {
            var registro = await _db.Registros.FindAsync(id);
            if (registro == null)
                return NotFound(ApiResponse<RegistroDto>.Fail(null, "Registro no encontrado"));

            if (!string.IsNullOrWhiteSpace(input.Nombre))
                registro.Nombre = input.Nombre;

            if (!string.IsNullOrWhiteSpace(input.Apellido))
                registro.Apellido = input.Apellido;

            if (!string.IsNullOrWhiteSpace(input.Documento))
                registro.Documento = input.Documento;

            if (!string.IsNullOrWhiteSpace(input.Destino))
                registro.Destino = input.Destino;

            if (!string.IsNullOrWhiteSpace(input.Motivo))
                registro.Motivo = input.Motivo;

            if (!string.IsNullOrWhiteSpace(input.Tipo))
                registro.Tipo = input.Tipo;

            await _db.SaveChangesAsync();

            var dto = new RegistroDto
            {
                Id = registro.Id,
                Nombre = registro.Nombre,
                Apellido = registro.Apellido,
                Documento = registro.Documento,
                Motivo = registro.Motivo,
                Destino = registro.Destino,
                Tipo = registro.Tipo,
                HoraIngresoUtc = registro.HoraIngresoUtc,
                HoraIngresoLocal = registro.HoraIngresoLocal,
                HoraSalidaUtc = registro.HoraSalidaUtc,
                HoraSalidaLocal = registro.HoraSalidaLocal,
                RegistradoPor = registro.RegistradoPor,
                FotoUrl = registro.FotoUrl // 🆕 Incluir FotoUrl
            };

            return Ok(ApiResponse<RegistroDto>.SuccessResponse(dto, "Registro actualizado correctamente"));
        }

        // GET: api/registros/export/csv
        [HttpGet("export/csv")]
        public async Task<IActionResult> ExportCsv(
            [FromQuery] string? nombre,
            [FromQuery] string? documento,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            var query = _db.Registros.AsQueryable();

            if (!string.IsNullOrWhiteSpace(nombre))
                query = query.Where(r => EF.Functions.ILike(r.Nombre, $"%{nombre}%"));

            if (!string.IsNullOrWhiteSpace(documento))
                query = query.Where(r => r.Documento == documento);

            if (desde.HasValue)
                query = query.Where(r => r.HoraIngresoUtc >= desde.Value.Date);

            if (hasta.HasValue)
            {
                var hastaFin = hasta.Value.Date.AddDays(1);
                query = query.Where(r => r.HoraIngresoUtc < hastaFin);
            }

            var registros = query.OrderByDescending(r => r.HoraIngresoUtc).ToList();

            var tz = TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time"); // Colombia
            var csv = new StringBuilder();
            csv.AppendLine("Id;Nombre;Documento;Motivo;Destino;Tipo;FechaIngreso;HoraIngreso;FechaSalida;HoraSalida;RegistradoPor;FotoUrl"); // 🆕 Encabezado

            foreach (var r in registros)
            {
                var ingresoLocal = TimeZoneInfo.ConvertTimeFromUtc(r.HoraIngresoUtc, tz);
                var salidaLocal = r.HoraSalidaUtc.HasValue 
                    ? TimeZoneInfo.ConvertTimeFromUtc(r.HoraSalidaUtc.Value, tz) 
                    : (DateTime?)null;

                csv.AppendLine($"{r.Id};{r.Nombre};{r.Documento};{r.Motivo};{r.Destino};{r.Tipo};" +
                                $"{ingresoLocal:yyyy-MM-dd};{ingresoLocal:HH:mm:ss};" +
                                $"{(salidaLocal.HasValue ? salidaLocal.Value.ToString("yyyy-MM-dd") : "")};" +
                                $"{(salidaLocal.HasValue ? salidaLocal.Value.ToString("HH:mm:ss") : "")};" +
                                $"{r.RegistradoPor};{r.FotoUrl}"); // 🆕 Datos
            }

            var bytes = Encoding.UTF8.GetBytes(csv.ToString());

            try
            {
                await _audit.LogAsync("RegistrosExportCsv", "Registro", null, new { cantidad = registros.Count });
            }
            catch { }

            return File(bytes, "text/csv", $"registros_{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
        }

        // GET: api/registros/export/excel
        [HttpGet("export/excel")]
        public async Task<IActionResult> ExportExcel(
            [FromQuery] string? nombre,
            [FromQuery] string? apellido,
            [FromQuery] string? documento,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            var query = _db.Registros.AsQueryable();

            if (!string.IsNullOrWhiteSpace(nombre))
                query = query.Where(r => EF.Functions.ILike(r.Nombre, $"%{nombre}%"));

            if (!string.IsNullOrWhiteSpace(apellido))
                query = query.Where(r => EF.Functions.ILike(r.Apellido, $"%{apellido}%"));

            if (!string.IsNullOrWhiteSpace(documento))
                query = query.Where(r => r.Documento == documento);

            if (desde.HasValue)
                query = query.Where(r => r.HoraIngresoUtc >= desde.Value.Date);

            if (hasta.HasValue)
            {
                var hastaFin = hasta.Value.Date.AddDays(1);
                query = query.Where(r => r.HoraIngresoUtc < hastaFin);
            }

            var registros = (from r in query
                             join u in _db.Users on r.RegistradoPor equals u.Id into gj
                             from subUser in gj.DefaultIfEmpty()
                             orderby r.HoraIngresoUtc descending
                             select new
                             {
                                 r.Id,
                                 r.Nombre,
                                 r.Apellido,
                                 r.Documento,
                                 r.Motivo,
                                 r.Destino,
                                 r.Tipo,
                                 r.HoraIngresoUtc,
                                 r.HoraSalidaUtc,
                                 r.FotoUrl, // 🆕 Incluir FotoUrl en la consulta
                                 RegistradoPorEmail = subUser != null ? subUser.Email : null
                             }).ToList();

            var tz = TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time"); // Colombia

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Registros");

            worksheet.Cell(1, 1).Value = "Id";
            worksheet.Cell(1, 2).Value = "Nombre";
            worksheet.Cell(1, 3).Value = "Apellido";
            worksheet.Cell(1, 4).Value = "Documento";
            worksheet.Cell(1, 5).Value = "Motivo";
            worksheet.Cell(1, 6).Value = "Destino";
            worksheet.Cell(1, 7).Value = "Tipo";
            worksheet.Cell(1, 8).Value = "FechaIngreso";
            worksheet.Cell(1, 9).Value = "HoraIngreso";
            worksheet.Cell(1, 10).Value = "FechaSalida";
            worksheet.Cell(1, 11).Value = "HoraSalida";
            worksheet.Cell(1, 12).Value = "RegistradoPor";
            worksheet.Cell(1, 13).Value = "FotoUrl"; // 🆕 Encabezado

            int row = 2;
            foreach (var r in registros)
            {
                var ingresoLocal = TimeZoneInfo.ConvertTimeFromUtc(r.HoraIngresoUtc, tz);
                var salidaLocal = r.HoraSalidaUtc.HasValue
                    ? TimeZoneInfo.ConvertTimeFromUtc(r.HoraSalidaUtc.Value, tz)
                    : (DateTime?)null;

                worksheet.Cell(row, 1).Value = r.Id.ToString();
                worksheet.Cell(row, 2).Value = r.Nombre;
                worksheet.Cell(row, 3).Value = r.Apellido;
                worksheet.Cell(row, 4).Value = r.Documento;
                worksheet.Cell(row, 5).Value = r.Motivo;
                worksheet.Cell(row, 6).Value = r.Destino;
                worksheet.Cell(row, 7).Value = r.Tipo;
                worksheet.Cell(row, 8).Value = ingresoLocal.ToString("yyyy-MM-dd");
                worksheet.Cell(row, 9).Value = ingresoLocal.ToString("HH:mm:ss");
                worksheet.Cell(row, 10).Value = salidaLocal?.ToString("yyyy-MM-dd") ?? "";
                worksheet.Cell(row, 11).Value = salidaLocal?.ToString("HH:mm:ss") ?? "";
                worksheet.Cell(row, 12).Value = r.RegistradoPorEmail ?? "";
                worksheet.Cell(row, 13).Value = r.FotoUrl ?? ""; // 🆕 Dato de la URL
                row++;
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var bytes = stream.ToArray();

            try
            {
                await _audit.LogAsync("RegistrosExportExcel", "Registro", null, new { cantidad = registros.Count });
            }
            catch { }

            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"registros_{DateTime.UtcNow:yyyyMMddHHmmss}.xlsx");
        }

    }
}