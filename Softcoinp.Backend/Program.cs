using Microsoft.EntityFrameworkCore;
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
using Softcoinp.Backend.Filters; // CORRECCIÓN: Se cambió Microsoft.AspNetCore.Filters a Softcoinp.Backend.Filters
using Softcoinp.Backend.Models;
using Microsoft.Extensions.FileProviders; 
using System.IO; 
using Microsoft.AspNetCore.Http; 

var builder = WebApplication.CreateBuilder(args);


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

// Configurar CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            // La URL de tu frontend Next.js (necesaria para CORS)
            policy.WithOrigins("http://localhost:3000") 
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});


var app = builder.Build();

// LOGS
var webRootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
app.Logger.LogInformation($"Content Root Path (Directorio Base): {app.Environment.ContentRootPath}");
app.Logger.LogInformation($"Web Root Path (Archivos Estáticos Forzado): {webRootPath}");

// 1. Usar CORS (debe ir ANTES de UseStaticFiles)
app.UseCors("AllowFrontend");

// 2. CONFIGURACIÓN FINAL DE ARCHIVOS ESTÁTICOS: Mapeo Explícito, CORS Forzado Y MIME Type
var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".jpeg"] = "image/jpeg"; 
if (!provider.Mappings.ContainsKey(".json"))
{
    provider.Mappings[".json"] = "application/json";
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(webRootPath),
    ContentTypeProvider = provider, 
    // Usamos el prefijo /static para evitar conflictos con rutas API
    RequestPath = "/static", 
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "http://localhost:3000");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Methods", "GET");
        ctx.Context.Response.Headers.Remove("Content-Disposition");
    }
}); 

// Ejecutar seeder al iniciar
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    DbSeeder.Seed(db);
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

app.Run();