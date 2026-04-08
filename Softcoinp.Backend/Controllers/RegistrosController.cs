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

        // POST: api/registros/actualizar-datos
        [HttpPost("actualizar-datos")]
        public async Task<IActionResult> ActualizarDatos([FromBody] UpdateInfoBaseDto input)
        {
            if (string.IsNullOrWhiteSpace(input.Documento))
                return BadRequest(ApiResponse<object>.Fail(null, "El documento es obligatorio."));

            // ---------- Procesar foto personal (opcional) ----------
            string? fotoUrlPersonal = null;
            if (!string.IsNullOrWhiteSpace(input.Foto))
            {
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
                catch { }
            }

            // ---------- Procesar foto vehículo (opcional) ----------
            string? fotoUrlVehiculo = null;
            if (!string.IsNullOrWhiteSpace(input.FotoVehiculo) && !string.IsNullOrWhiteSpace(input.Placa))
            {
                try
                {
                    var base64V = input.FotoVehiculo.StartsWith("data:") ? input.FotoVehiculo.Substring(input.FotoVehiculo.IndexOf(',') + 1) : input.FotoVehiculo;
                    var bytesV = Convert.FromBase64String(base64V);
                    var fileNameV = $"VEH_{input.Placa}_{DateTime.Now:yyyyMMddHHmmss}.jpeg";
                    var folderV = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "vehiculos");
                    if (!Directory.Exists(folderV)) Directory.CreateDirectory(folderV);
                    var pathV = Path.Combine(folderV, fileNameV);
                    await System.IO.File.WriteAllBytesAsync(pathV, bytesV);
                    fotoUrlVehiculo = $"/uploads/vehiculos/{fileNameV}";
                }
                catch { }
            }

            // ---------- Actualizar Personal ----------
            var persona = await _db.Personal.FirstOrDefaultAsync(p => p.Documento == input.Documento);
            if (persona == null)
                return NotFound(ApiResponse<object>.Fail(null, "La persona no existe en el sistema."));

            persona.Nombre = string.IsNullOrWhiteSpace(input.Nombre) ? persona.Nombre : input.Nombre;
            persona.Apellido = string.IsNullOrWhiteSpace(input.Apellido) ? persona.Apellido : input.Apellido;
            persona.Tipo = string.IsNullOrWhiteSpace(input.Tipo) ? persona.Tipo : input.Tipo;
            persona.Telefono = input.Telefono ?? persona.Telefono;
            if (!string.IsNullOrWhiteSpace(fotoUrlPersonal))
                persona.FotoUrl = fotoUrlPersonal;

            // ---------- Actualizar Vehículo ----------
            if (!string.IsNullOrWhiteSpace(input.Placa))
            {
                var placaNormalizada = input.Placa.ToUpper().Trim();
                var vehiculo = await _db.Vehiculos.FirstOrDefaultAsync(v => v.Placa == placaNormalizada);
                
                if (vehiculo != null)
                {
                    // Asegurar que el vehículo esté vinculado a esta persona
                    vehiculo.PersonalId = persona.Id;

                    vehiculo.Marca = string.IsNullOrWhiteSpace(input.Marca) ? vehiculo.Marca : input.Marca;
                    vehiculo.Modelo = string.IsNullOrWhiteSpace(input.Modelo) ? vehiculo.Modelo : input.Modelo;
                    vehiculo.Color = string.IsNullOrWhiteSpace(input.Color) ? vehiculo.Color : input.Color;
                    vehiculo.TipoVehiculo = string.IsNullOrWhiteSpace(input.TipoVehiculo) ? vehiculo.TipoVehiculo : input.TipoVehiculo;
                    
                    if (!string.IsNullOrWhiteSpace(fotoUrlVehiculo))
                        vehiculo.FotoUrl = fotoUrlVehiculo;
                    else
                        fotoUrlVehiculo = vehiculo.FotoUrl; // Heredar la foto maestra para el historial
                }
                else
                {
                    // Si no existe, lo creamos vinculado a la persona
                    vehiculo = new Vehiculo
                    {
                        Id = Guid.NewGuid(),
                        Placa = placaNormalizada,
                        Marca = input.Marca,
                        Modelo = input.Modelo,
                        Color = input.Color,
                        TipoVehiculo = input.TipoVehiculo,
                        FotoUrl = fotoUrlVehiculo,
                        PersonalId = persona.Id
                    };
                    _db.Vehiculos.Add(vehiculo);
                }
            }

            await _db.SaveChangesAsync();
            try { await _audit.LogAsync("DatosActualizados", "Personal", persona.Id, new { Documento = persona.Documento }); } catch { }

            return Ok(ApiResponse<object>.SuccessResponse(null, "Datos actualizados correctamente sin generar registro de acceso."));
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

            var tz = TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time"); // Colombia

            if (!string.IsNullOrWhiteSpace(nombre))
                query = query.Where(r => EF.Functions.ILike(r.Nombre, $"%{nombre}%"));

            if (!string.IsNullOrWhiteSpace(documento))
                query = query.Where(r => r.Documento == documento);

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
                        Telefono = r.TelefonoPersona,
                        Tipo = r.Tipo,
                        IsBloqueado = r.Personal!.IsBloqueado,
                        MotivoBloqueo = r.Personal!.MotivoBloqueo
                    },
                    Motivo = r.Motivo,
                    Destino = r.Destino,
                    HoraIngresoUtc = r.HoraIngresoUtc,
                    HoraIngresoLocal = r.HoraIngresoLocal,
                    HoraSalidaUtc = r.HoraSalidaUtc,
                    HoraSalidaLocal = r.HoraSalidaLocal,
                    RegistradoPor = r.RegistradoPor,
                    FotoUrl = r.FotoUrl, 
                    PlacaVehiculo = r.PlacaVehiculo,
                    MarcaVehiculo = r.MarcaVehiculo,
                    ModeloVehiculo = r.ModeloVehiculo,
                    ColorVehiculo = r.ColorVehiculo,
                    TipoVehiculo = r.TipoVehiculo,
                    FotoVehiculoUrl = r.FotoVehiculoUrl
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
            // JOIN con Vehiculo por PersonalId (ID de la persona)
            // Esto garantiza que se traiga el vehículo asociado en el sistema,
            // no solo el del historial de este registro específico.
            var result = (
                from r in _db.Registros
                join v in _db.Vehiculos on r.PersonalId equals v.PersonalId into vJoin
                from v in vJoin.OrderByDescending(x => x.FechaCreacionUtc).Take(1).DefaultIfEmpty()
                where r.Id == id
                select new
                {
                    r.Id,
                    Nombre          = r.Personal!.Nombre,
                    Apellido        = r.Personal!.Apellido,
                    Documento       = r.Personal!.Documento,
                    Telefono        = r.Personal!.Telefono,
                    r.Motivo,
                    r.Destino,
                    Tipo            = r.Personal!.Tipo,
                    r.HoraIngresoUtc,
                    r.HoraIngresoLocal,
                    r.HoraSalidaUtc,
                    r.HoraSalidaLocal,
                    r.RegistradoPor,
                    FotoUrl         = r.Personal!.FotoUrl ?? r.FotoUrl,
                    IsBloqueado     = r.Personal!.IsBloqueado,
                    MotivoBloqueo   = r.Personal!.MotivoBloqueo,
                    r.PlacaVehiculo,
                    // Si hay un vehículo maestro asociado, usamos su data; si no, la del historial
                    MarcaVehiculo   = v.Marca      ?? r.MarcaVehiculo,
                    ModeloVehiculo  = v.Modelo     ?? r.ModeloVehiculo,
                    ColorVehiculo   = v.Color      ?? r.ColorVehiculo,
                    TipoVehiculo    = v.TipoVehiculo ?? r.TipoVehiculo,
                    FotoVehiculoUrl = v.FotoUrl    ?? r.FotoVehiculoUrl
                }
            ).FirstOrDefault();

            if (result == null)
                return NotFound(ApiResponse<RegistroDto>.Fail(null, "Registro no encontrado"));

            var registro = new RegistroDto
            {
                Id              = result.Id,
                Nombre          = result.Nombre,
                Apellido        = result.Apellido,
                Documento       = result.Documento,
                Telefono        = result.Telefono,
                Motivo          = result.Motivo,
                Destino         = result.Destino,
                Tipo            = result.Tipo,
                HoraIngresoUtc  = result.HoraIngresoUtc,
                HoraIngresoLocal = result.HoraIngresoLocal,
                HoraSalidaUtc   = result.HoraSalidaUtc,
                HoraSalidaLocal = result.HoraSalidaLocal,
                RegistradoPor   = result.RegistradoPor,
                FotoUrl         = result.FotoUrl,
                IsBloqueado     = result.IsBloqueado,
                MotivoBloqueo   = result.MotivoBloqueo,
                PlacaVehiculo   = result.PlacaVehiculo,
                MarcaVehiculo   = result.MarcaVehiculo,
                ModeloVehiculo  = result.ModeloVehiculo,
                ColorVehiculo   = result.ColorVehiculo,
                TipoVehiculo    = result.TipoVehiculo,
                FotoVehiculoUrl = result.FotoVehiculoUrl
            };

            return Ok(ApiResponse<RegistroDto>.SuccessResponse(registro));
        }

        // GET: api/registros/buscar?documento=123456
        [HttpGet("buscar")]
        public IActionResult BuscarPorDocumento([FromQuery] string documento)
        {
            if (string.IsNullOrWhiteSpace(documento))
                return BadRequest(ApiResponse<RegistroDto>.Fail(null, "El documento es obligatorio"));

            // JOIN con Vehiculo por PersonalId (ID de la persona) en vez de placa.
            // Esto permite que el buscador traiga el vehículo actual del propietario
            // incluso si el último registro lo hizo a pie.
            var result = (
                from r in _db.Registros
                join v in _db.Vehiculos on r.PersonalId equals v.PersonalId into vJoin
                from v in vJoin.OrderByDescending(x => x.FechaCreacionUtc).Take(1).DefaultIfEmpty()
                where r.Documento == documento
                orderby r.HoraIngresoUtc descending
                select new
                {
                    r.Id,
                    r.PersonalId,
                    Nombre        = r.Personal!.Nombre,
                    Apellido      = r.Personal!.Apellido,
                    Documento     = r.Personal!.Documento,
                    Telefono      = r.Personal!.Telefono,
                    r.Motivo,
                    r.Destino,
                    Tipo          = r.Personal!.Tipo,
                    r.HoraIngresoUtc,
                    r.HoraIngresoLocal,
                    r.HoraSalidaUtc,
                    r.HoraSalidaLocal,
                    r.RegistradoPor,
                    FotoUrl       = r.Personal!.FotoUrl ?? r.FotoUrl,
                    IsBloqueado   = r.Personal!.IsBloqueado,
                    MotivoBloqueo = r.Personal!.MotivoBloqueo,
                    PlacaVehiculo   = v.Placa ?? r.PlacaVehiculo, // Priorizar la placa del carro master
                    VehiculoId         = (Guid?)v.Id,
                    MarcaVehiculo      = v.Marca      ?? r.MarcaVehiculo,
                    ModeloVehiculo     = v.Modelo     ?? r.ModeloVehiculo,
                    ColorVehiculo      = v.Color      ?? r.ColorVehiculo,
                    TipoVehiculo       = v.TipoVehiculo ?? r.TipoVehiculo,
                    FotoVehiculoUrl    = v.FotoUrl    ?? r.FotoVehiculoUrl
                }
            ).FirstOrDefault();

            if (result == null)
                return NotFound(ApiResponse<RegistroDto>.Fail(null, "No se encontró una persona con ese documento"));

            var registro = new RegistroDto
            {
                Id              = result.Id,
                PersonalId      = result.PersonalId,
                Nombre          = result.Nombre,
                Apellido        = result.Apellido,
                Documento       = result.Documento,
                Telefono        = result.Telefono,
                Motivo          = result.Motivo,
                Destino         = result.Destino,
                Tipo            = result.Tipo,
                HoraIngresoUtc  = result.HoraIngresoUtc,
                HoraIngresoLocal = result.HoraIngresoLocal,
                HoraSalidaUtc   = result.HoraSalidaUtc,
                HoraSalidaLocal = result.HoraSalidaLocal,
                RegistradoPor   = result.RegistradoPor,
                FotoUrl         = result.FotoUrl,
                IsBloqueado     = result.IsBloqueado,
                MotivoBloqueo   = result.MotivoBloqueo,
                PlacaVehiculo   = result.PlacaVehiculo,
                VehiculoId      = result.VehiculoId,
                MarcaVehiculo   = result.MarcaVehiculo,
                ModeloVehiculo  = result.ModeloVehiculo,
                ColorVehiculo   = result.ColorVehiculo,
                TipoVehiculo    = result.TipoVehiculo,
                FotoVehiculoUrl = result.FotoVehiculoUrl
            };

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

            // Foto obligatoria solo si la persona es nueva o no tiene foto previa (se valida más abajo)


            var nowUtc = DateTime.UtcNow;

            // ---------- Procesar foto (guardar en /uploads/personal) ----------
            string? fotoUrlPersonal = null;
            if (!string.IsNullOrWhiteSpace(input.Foto))
            {
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
            }

            // ---------- Procesar foto vehículo (opcional) ----------
            string? fotoUrlVehiculo = null;
            if (!string.IsNullOrWhiteSpace(input.FotoVehiculo))
            {
                try
                {
                    var base64V = input.FotoVehiculo.StartsWith("data:") ? input.FotoVehiculo.Substring(input.FotoVehiculo.IndexOf(',') + 1) : input.FotoVehiculo;
                    var bytesV = Convert.FromBase64String(base64V);
                    var fileNameV = $"VEH_{input.Placa}_{DateTime.Now:yyyyMMddHHmmss}.jpeg";
                    var folderV = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "vehiculos");
                    if (!Directory.Exists(folderV)) Directory.CreateDirectory(folderV);
                    var pathV = Path.Combine(folderV, fileNameV);
                    await System.IO.File.WriteAllBytesAsync(pathV, bytesV);
                    fotoUrlVehiculo = $"/uploads/vehiculos/{fileNameV}";
                }
                catch { /* Ignorar errores en foto opcional para no romper el flujo principal */ }
            }

            // ---------- Buscar o crear/actualizar Personal ----------
            var persona = await _db.Personal.FirstOrDefaultAsync(p => p.Documento == input.Documento);
            if (persona == null)
            {
                // Si es nuevo, la foto ES OBLIGATORIA
                if (string.IsNullOrWhiteSpace(fotoUrlPersonal))
                    return BadRequest(ApiResponse<RegistroDto>.Fail(null, "🛑 La fotografía es obligatoria para registrar personas nuevas."));

                persona = new Personal
                {
                    Id = Guid.NewGuid(),
                    Nombre = input.Nombre,
                    Apellido = input.Apellido,
                    Documento = input.Documento,
                    Tipo = input.Tipo ?? "visitante",
                    Telefono = input.Telefono,
                    FotoUrl = fotoUrlPersonal,
                    FechaCreacionUtc = DateTime.UtcNow
                };
                _db.Personal.Add(persona);
                await _db.SaveChangesAsync();
            }
            else
            {
                // Si ya existe, validar que al menos tenga una foto previa si no mandó nueva
                if (string.IsNullOrWhiteSpace(persona.FotoUrl) && string.IsNullOrWhiteSpace(fotoUrlPersonal))
                    return BadRequest(ApiResponse<RegistroDto>.Fail(null, "🛑 Esta persona no tiene foto. Debe capturar una para continuar."));

                persona.Nombre = string.IsNullOrWhiteSpace(input.Nombre) ? persona.Nombre : input.Nombre;
                persona.Apellido = string.IsNullOrWhiteSpace(input.Apellido) ? persona.Apellido : input.Apellido;
                persona.Tipo = string.IsNullOrWhiteSpace(input.Tipo) ? persona.Tipo : input.Tipo;
                persona.Telefono = input.Telefono ?? persona.Telefono;
                
                if (!string.IsNullOrWhiteSpace(fotoUrlPersonal))
                    persona.FotoUrl = fotoUrlPersonal;
                else
                    fotoUrlPersonal = persona.FotoUrl; // Heredar la foto existente para el registro de entrada
                
                await _db.SaveChangesAsync();
            }

            // ---------- Guardar/Actualizar Vehículo vinculado a Personal ----------
            if (!string.IsNullOrWhiteSpace(input.Placa))
            {
                var placaNormalizada = input.Placa.ToUpper().Trim();
                var vehiculo = await _db.Vehiculos.FirstOrDefaultAsync(v => v.Placa == placaNormalizada);
                
                if (vehiculo == null)
                {
                    vehiculo = new Vehiculo
                    {
                        Id = Guid.NewGuid(),
                        Placa = placaNormalizada,
                        Marca = input.Marca,
                        Modelo = input.Modelo,
                        Color = input.Color,
                        TipoVehiculo = input.TipoVehiculo,
                        FotoUrl = fotoUrlVehiculo,
                        PersonalId = persona.Id
                    };
                    _db.Vehiculos.Add(vehiculo);
                }
                else
                {
                    vehiculo.PersonalId = persona.Id; // Transferir o ratificar propietario al conductor actual
                    vehiculo.Marca = input.Marca ?? vehiculo.Marca;
                    vehiculo.Modelo = input.Modelo ?? vehiculo.Modelo;
                    vehiculo.Color = input.Color ?? vehiculo.Color;
                    vehiculo.TipoVehiculo = input.TipoVehiculo ?? vehiculo.TipoVehiculo;
                    if (!string.IsNullOrWhiteSpace(fotoUrlVehiculo))
                        vehiculo.FotoUrl = fotoUrlVehiculo;
                }
                await _db.SaveChangesAsync();
            }

            // ---------- Crear Registro ----------
            var registro = new Registro
            {
                Id = Guid.NewGuid(),
                PersonalId = persona.Id,
                Nombre = persona.Nombre,
                Apellido = persona.Apellido,
                Documento = persona.Documento,
                TelefonoPersona = persona.Telefono,
                Destino = input.Destino,
                Motivo = input.Motivo,
                Tipo = persona.Tipo,
                HoraIngresoUtc = nowUtc,
                FotoUrl = persona.FotoUrl,
                // Datos del vehículo para el historial
                PlacaVehiculo = input.Placa?.ToUpper(),
                MarcaVehiculo = input.Marca,
                ModeloVehiculo = input.Modelo,
                ColorVehiculo = input.Color,
                TipoVehiculo = input.TipoVehiculo,
                FotoVehiculoUrl = fotoUrlVehiculo
            };

            var userIdClaim = User.FindFirst("id")?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
                registro.RegistradoPor = userId;

            _db.Registros.Add(registro);
            await _db.SaveChangesAsync();

            try
            {
                await _audit.LogAsync("RegistroCreated", "Registro", registro.Id, new
                {
                    registro.Nombre,
                    registro.Apellido,
                    registro.Documento,
                    registro.Destino,
                    registro.Motivo,
                    registro.Tipo,
                    registro.PlacaVehiculo
                });
            }
            catch { }

            var dto = new RegistroDto
            {
                Id = registro.Id,
                Nombre = registro.Nombre,
                Apellido = registro.Apellido,
                Documento = registro.Documento,
                Telefono = registro.TelefonoPersona,
                Motivo = registro.Motivo,
                Destino = registro.Destino,
                Tipo = registro.Tipo,
                HoraIngresoUtc = registro.HoraIngresoUtc,
                HoraIngresoLocal = registro.HoraIngresoLocal,
                HoraSalidaUtc = registro.HoraSalidaUtc,
                HoraSalidaLocal = registro.HoraSalidaLocal,
                RegistradoPor = registro.RegistradoPor,
                FotoUrl = registro.FotoUrl,
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
                Telefono = registro.TelefonoPersona,
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
                Telefono = registro.TelefonoPersona,
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


        // GET: api/registros/activo?documento
        [HttpGet("activo")]
        public IActionResult GetActivo([FromQuery] string documento)
        {
            if (string.IsNullOrWhiteSpace(documento))
                return BadRequest(ApiResponse<RegistroDto>.Fail(null, "El documento es obligatorio"));

            var registro = _db.Registros
                .Where(r => r.Documento == documento && r.HoraSalidaUtc == null)
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
                    FotoUrl = r.FotoUrl,
                    IsBloqueado = r.Personal!.IsBloqueado,
                    MotivoBloqueo = r.Personal!.MotivoBloqueo
                })
                .FirstOrDefault();

            if (registro == null)
                return NotFound(ApiResponse<RegistroDto>.Fail(null, "No hay registro activo"));

            return Ok(ApiResponse<RegistroDto>.SuccessResponse(registro));
        }

        // GET: api/registros/activos

        [HttpGet("activos")]
        public IActionResult GetActivos()
        {
            var registros = _db.Registros
                .Where(r => r.HoraSalidaUtc == null)
                .OrderBy(r => r.HoraIngresoUtc)
                .Select(r => new RegistroDto
                {
                    Id = r.Id,
                    Nombre = r.Nombre,
                    Apellido = r.Apellido,
                    Documento = r.Documento,
                    Telefono = r.TelefonoPersona,
                    Motivo = r.Motivo,
                    Destino = r.Destino,
                    Tipo = r.Tipo,
                    HoraIngresoUtc = r.HoraIngresoUtc,
                    HoraIngresoLocal = r.HoraIngresoLocal,
                    FotoUrl = r.FotoUrl
                })
                .ToList();

            return Ok(ApiResponse<List<RegistroDto>>.SuccessResponse(registros));
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

        [HttpGet("export/excel")]
        public async Task<IActionResult> ExportExcel(
            [FromQuery] string? nombre,
            [FromQuery] string? apellido,
            [FromQuery] string? documento,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById("SA Pacific Standard Time"); // Colombia
            var query = _db.Registros.AsQueryable();

            if (!string.IsNullOrWhiteSpace(nombre))
                query = query.Where(r => EF.Functions.ILike(r.Nombre, $"%{nombre}%"));

            if (!string.IsNullOrWhiteSpace(apellido))
                query = query.Where(r => EF.Functions.ILike(r.Apellido, $"%{apellido}%"));

            if (!string.IsNullOrWhiteSpace(documento))
                query = query.Where(r => r.Documento == documento);

            if (desde.HasValue)
            {
                // Convertir inicio del día local a UTC (ej: 20-03 00:00 COL -> 20-03 05:00 UTC)
                var desdeLocal = DateTime.SpecifyKind(desde.Value.Date, DateTimeKind.Unspecified);
                var desdeUtc = TimeZoneInfo.ConvertTimeToUtc(desdeLocal, tz);
                query = query.Where(r => r.HoraIngresoUtc >= desdeUtc);
            }

            if (hasta.HasValue)
            {
                // Convertir fin del día local a UTC (ej: 20-03 23:59 COL -> 21-03 04:59 UTC)
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
                                 r.Id,
                                 r.Nombre,
                                 r.Apellido,
                                 r.Documento,
                                 r.Motivo,
                                 r.Destino,
                                 r.Tipo,
                                 r.HoraIngresoUtc,
                                 r.HoraSalidaUtc,
                                 r.PlacaVehiculo,
                                 r.MarcaVehiculo,
                                 r.ModeloVehiculo,
                                 r.ColorVehiculo,
                                 r.TipoVehiculo,
                                 r.FotoUrl,
                                 RegistradoPorNombre = subUser != null ? subUser.Nombre : "SISTEMA"
                             }).ToList();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Registros de Acceso");

            // --- PALETA DE COLORES PREMIUM ---
            var primaryColor = XLColor.FromHtml("#0f172a"); // Slate 900
            var secondaryColor = XLColor.FromHtml("#334155"); // Slate 700
            var accentColor = XLColor.FromHtml("#e2e8f0"); // Slate 200 (for stripes)
            var borderColor = XLColor.FromHtml("#cbd5e1"); // Slate 300

            // Fetch ClientName from SystemSettings
            var clientSetting = await _db.SystemSettings.FirstOrDefaultAsync(s => s.Key == "ClientName");
            string clientName = clientSetting?.Value ?? "SOFTCOINP";

            // 1. Título Principal (Banner Premium)
            var titleRange = worksheet.Range(1, 1, 1, 11);
            titleRange.Merge().Value = $"{clientName} - REPORTE GERENCIAL DE PERSONAS";
            titleRange.Style
                .Font.SetBold()
                .Font.SetFontSize(16)
                .Font.SetFontColor(XLColor.White)
                .Fill.SetBackgroundColor(primaryColor)
                .Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center)
                .Alignment.SetVertical(XLAlignmentVerticalValues.Center);
            worksheet.Row(1).Height = 35;

            // 2. Información de Contexto
            worksheet.Cell(2, 1).Value = "Rango de Búsqueda:";
            string rangoStr = (desde.HasValue ? desde.Value.ToString("yyyy-MM-dd") : "Inicio") + 
                             " hasta " + 
                             (hasta.HasValue ? hasta.Value.ToString("yyyy-MM-dd") : "Hoy");
            worksheet.Cell(2, 2).Value = rangoStr;
            
            worksheet.Cell(2, 10).Value = "Generado el:";
            worksheet.Cell(2, 11).Value = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz).ToString("yyyy-MM-dd HH:mm:ss");
            
            var infoRange = worksheet.Range(2, 1, 2, 11);
            infoRange.Style.Font.SetFontSize(9);
            infoRange.Style.Font.SetFontColor(secondaryColor);
            infoRange.Style.Border.BottomBorder = XLBorderStyleValues.Thin;
            infoRange.Style.Border.BottomBorderColor = borderColor;

            // 3. Encabezados de Tabla (Fila 4)
            string[] headers = { 
                "DOCUMENTO", "NOMBRE", "APELLIDO", "PERFIL / TIPO", 
                "FECHA INGRESO", "HORA INGRESO", "FECHA SALIDA", "HORA SALIDA",
                "DESTINO", "MOTIVO DE INGRESO", "REGISTRADO POR" 
            };

            for (int i = 0; i < headers.Length; i++)
            {
                var cell = worksheet.Cell(4, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.SetBold();
                cell.Style.Font.SetFontSize(10);
                cell.Style.Font.SetFontColor(XLColor.White);
                cell.Style.Fill.SetBackgroundColor(secondaryColor);
                cell.Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                cell.Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                cell.Style.Border.OutsideBorderColor = primaryColor;
            }
            worksheet.Row(4).Height = 25;

            // 4. Datos con Estilo Zebra y Límites
            int row = 5;
            foreach (var r in registros)
            {
                var ingresoLocal = TimeZoneInfo.ConvertTimeFromUtc(r.HoraIngresoUtc, tz);
                var salidaLocal = r.HoraSalidaUtc.HasValue
                    ? TimeZoneInfo.ConvertTimeFromUtc(r.HoraSalidaUtc.Value, tz)
                    : (DateTime?)null;

                // Truncar motivo a 250 caracteres
                string motivoTruncado = r.Motivo ?? "";
                if (motivoTruncado.Length > 250)
                {
                    motivoTruncado = motivoTruncado.Substring(0, 247) + "...";
                }

                worksheet.Cell(row, 1).Value = r.Documento;
                worksheet.Cell(row, 2).Value = r.Nombre;
                worksheet.Cell(row, 3).Value = r.Apellido;
                worksheet.Cell(row, 4).Value = r.Tipo?.ToUpper() ?? "-";
                
                worksheet.Cell(row, 5).Value = ingresoLocal.ToString("yyyy-MM-dd");
                worksheet.Cell(row, 6).Value = ingresoLocal.ToString("HH:mm:ss");
                
                worksheet.Cell(row, 7).Value = salidaLocal?.ToString("yyyy-MM-dd") ?? "PENDIENTE";
                worksheet.Cell(row, 8).Value = salidaLocal?.ToString("HH:mm:ss") ?? "PENDIENTE";

                worksheet.Cell(row, 9).Value = r.Destino;
                worksheet.Cell(row, 10).Value = motivoTruncado;
                worksheet.Cell(row, 11).Value = r.RegistradoPorNombre;

                // Aplicar Franjas Alternas (Zebra)
                if (row % 2 == 0)
                {
                    worksheet.Range(row, 1, row, 11).Style.Fill.SetBackgroundColor(accentColor);
                }

                // Estilo para celdas de datos
                var rowRange = worksheet.Range(row, 1, row, 11);
                rowRange.Style.Font.SetFontSize(10);
                rowRange.Style.Alignment.SetVertical(XLAlignmentVerticalValues.Center);
                rowRange.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
                rowRange.Style.Border.InsideBorderColor = XLColor.White;
                rowRange.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                rowRange.Style.Border.OutsideBorderColor = borderColor;

                // Centrar columnas específicas
                worksheet.Cell(row, 1).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                worksheet.Cell(row, 4).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                worksheet.Cell(row, 5).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                worksheet.Cell(row, 6).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                worksheet.Cell(row, 7).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);
                worksheet.Cell(row, 8).Style.Alignment.SetHorizontal(XLAlignmentHorizontalValues.Center);

                // Alertar Salidas Pendientes (Texto Rojo Negrita)
                if (!salidaLocal.HasValue)
                {
                    worksheet.Cell(row, 7).Style.Font.SetFontColor(XLColor.Red).Font.SetBold();
                    worksheet.Cell(row, 8).Style.Font.SetFontColor(XLColor.Red).Font.SetBold();
                }

                row++;
            }

            // 5. Ajustes Finales de Visualización
            worksheet.Columns().AdjustToContents();
            // Limitar ancho máximo de columna motivo para evitar excels demasiado anchos
            worksheet.Column(10).Width = 40; 
            worksheet.Column(10).Style.Alignment.SetWrapText(true);

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var bytes = stream.ToArray();

            try
            {
                await _audit.LogAsync("RegistrosExportExcel", "Registro", null, new { cantidad = registros.Count });
            }
            catch { }

            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Reporte_Seguridad_Softcoinp_{TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz):yyyyMMdd_HHmm}.xlsx");
        }
    }
}