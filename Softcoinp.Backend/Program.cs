using Microsoft.EntityFrameworkCore;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Softcoinp.Backend;
using Softcoinp.Backend.Services;
using System.Text.Json;
using System.Text.Json.Serialization;
using Softcoinp.Backend.Helpers;
using Softcoinp.Backend.Middlewares;
using Microsoft.AspNetCore.StaticFiles; 
using Softcoinp.Backend.Filters;
using Softcoinp.Backend.Models;
using Microsoft.Extensions.FileProviders; 
using System.IO; 
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

// Compresión de respuestas HTTP (reduce tamaño del JSON ~70% sin costo de CPU significativo)
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
    {
        "application/json",
        "text/plain"
    });
});
builder.Services.Configure<BrotliCompressionProviderOptions>(o => o.Level = System.IO.Compression.CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(o => o.Level = System.IO.Compression.CompressionLevel.Fastest);


// Conexión a PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configuración de JWT
var jwtSettings = builder.Configuration.GetSection("Jwt");

// validar configuración
var jwtKey = jwtSettings["Key"] 
    ?? throw new InvalidOperationException("JWT Key no está configurada en appsettings.json");
var jwtIssuer = jwtSettings["Issuer"] 
    ?? throw new InvalidOperationException("JWT Issuer no está configurada en appsettings.json");
var jwtAudience = jwtSettings["Audience"] 
    ?? throw new InvalidOperationException("JWT Audience no está configurada en appsettings.json");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// Controladores + Swagger con JWT
builder.Services.AddControllers(options =>
{
    // Filtro global de validación
    options.Filters.Add<ValidationFilter>();
})
.ConfigureApiBehaviorOptions(options =>
{
    options.SuppressModelStateInvalidFilter = true;
})

.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    options.JsonSerializerOptions.Converters.Add(new DateTimeConverter());
    options.JsonSerializerOptions.Converters.Add(new NullableDateTimeConverter());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Softcoinp API", Version = "v1" });

    // Configuración de seguridad para usar JWT en Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Introduce el token en este formato: Bearer {tu token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});


builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAuditService, AuditService>();

// Servicio de Correo Brevo
builder.Services.AddHttpClient<Softcoinp.Backend.Services.IEmailService, BrevoEmailService>();

// Servicios de Inteligencia de Datos y Reportes
builder.Services.AddScoped<Softcoinp.Backend.Services.Reporting.IReportDataService, Softcoinp.Backend.Services.Reporting.ReportDataService>();
builder.Services.AddScoped<Softcoinp.Backend.Services.Reporting.IPdfReportService, Softcoinp.Backend.Services.Reporting.PdfReportService>();
builder.Services.AddScoped<Softcoinp.Backend.Services.Reporting.IExcelReportService, Softcoinp.Backend.Services.Reporting.ExcelReportService>();
builder.Services.AddScoped<Softcoinp.Backend.Services.Reporting.IEmailService, Softcoinp.Backend.Services.Reporting.EmailService>();


// Configurar CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
    ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            // La URL de tu frontend Next.js (necesaria para CORS)
            policy.WithOrigins(allowedOrigins) 
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});


var app = builder.Build();

// 1. Compresión de respuestas (reduce tamaño del JSON ~70%)
app.UseResponseCompression();

// 2. Usar CORS (debe ir ANTES de UseStaticFiles)
app.UseCors("AllowFrontend");

// 2. CONFIGURACIÓN FINAL DE ARCHIVOS ESTÁTICOS
var webRootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".jpeg"] = "image/jpeg"; 
if (!provider.Mappings.ContainsKey(".json"))
{
    provider.Mappings[".json"] = "application/json";
}

if (Directory.Exists(webRootPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(webRootPath),
        ContentTypeProvider = provider, 
        RequestPath = "/static", 
        OnPrepareResponse = ctx =>
        {
            // CORS para archivos estáticos
            ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
            ctx.Context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, OPTIONS");
            ctx.Context.Response.Headers.Append("Access-Control-Allow-Headers", "*");
            ctx.Context.Response.Headers.Remove("Content-Disposition");
            // Caché de imágenes: el browser no vuelve a descargar por 7 días
            ctx.Context.Response.Headers.Append("Cache-Control", "public, max-age=604800, immutable");
        }
    }); 
}
else
{
    app.Logger.LogWarning($"Advertencia: wwwroot no encontrado en {webRootPath}. Usando configuración por defecto.");
    app.UseStaticFiles(); 
}

// Swagger solo en desarrollo
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Manejo global de errores → debe ir lo más arriba posible
app.UseMiddleware<ErrorHandlingMiddleware>();

app.UseHttpsRedirection();

// Convertir automáticamente fechas a UTC
app.UseMiddleware<DateTimeUtcMiddleware>();

// Autenticación y Autorización
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// --- LÓGICA DE MIGRACIÓN Y SEEDING AUTOMÁTICO CON REINTENTOS ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    var context = services.GetRequiredService<AppDbContext>();

    int retries = 5;
    bool success = false;

    while (retries > 0 && !success)
    {
        try
        {
            logger.LogInformation($"Intentando conectar a la base de datos... (Reintentos restantes: {retries})");

            // 1. Asegurar que la base de datos esté actualizada
            context.Database.Migrate();

            // 2. Seed de Configuraciones
            if (!context.SystemSettings.Any(s => s.Key == "ClientName"))
            {
                context.SystemSettings.Add(new SystemSetting { Key = "ClientName", Value = "SOFTCOINP", UpdatedAt = DateTime.UtcNow });
            }
            if (!context.SystemSettings.Any(s => s.Key == "SystemVersion"))
            {
                context.SystemSettings.Add(new SystemSetting { Key = "SystemVersion", Value = "2.5.0", UpdatedAt = DateTime.UtcNow });
            }

            // 3. Seed de Tipos de Personal
            if (!context.TiposPersonal.Any())
            {
                context.TiposPersonal.AddRange(new List<TipoPersonal> {
                    new TipoPersonal { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), Nombre = "Empleado", Activo = true },
                    new TipoPersonal { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Nombre = "Visitante", Activo = true }
                });
            }

            // 4. Seed de Usuarios (Admin y SuperAdmin)
            if (!context.Users.Any())
            {
                var superPass = BCrypt.Net.BCrypt.HashPassword("SuperDev2026!");
                var adminPass = BCrypt.Net.BCrypt.HashPassword("Admin123");

                context.Users.AddRange(new List<User> {
                    new User { 
                        Id = Guid.Parse("00000000-0000-0000-0000-000000000000"), 
                        Email = "superadmin@dev", 
                        Nombre = "Super Desarrollador", 
                        PasswordHash = superPass, 
                        Role = "superadmin",
                        CreatedAt = DateTime.UtcNow,
                        RefreshToken = "",
                        RefreshTokenExpiry = DateTime.UtcNow
                    },
                    new User { 
                        Id = Guid.Parse("00000000-0000-0000-0000-00000000000A"), 
                        Email = "admin@local", 
                        Nombre = "Administrador Sistema", 
                        PasswordHash = adminPass, 
                        Role = "admin",
                        CreatedAt = DateTime.UtcNow,
                        RefreshToken = "",
                        RefreshTokenExpiry = DateTime.UtcNow
                    }
                });
            }

            context.SaveChanges();
            logger.LogInformation("✅ Base de datos verificada y datos base sembrados con éxito.");
            success = true;
        }
        catch (Exception ex)
        {
            retries--;
            logger.LogWarning($"⚠️ La base de datos aún no está lista. Reintentando en 5 segundos... ({ex.Message})");
            System.Threading.Thread.Sleep(5000);
            if (retries == 0)
            {
                logger.LogError(ex, "❌ Error crítico: No se pudo conectar a la base de datos tras varios intentos.");
            }
        }
    }
}

app.Run();