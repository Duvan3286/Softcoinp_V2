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

// Compresión de respuestas HTTP
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

// --- CONFIGURACIÓN DE BASES DE DATOS ---

// 1. Master Database (Catálogo de Tenants)
var masterConnectionString = builder.Configuration.GetConnectionString("MasterConnection");
builder.Services.AddDbContext<MasterDbContext>(options =>
    options.UseMySql(masterConnectionString, ServerVersion.AutoDetect(masterConnectionString)));

// 2. App Database (Contexto de Negocio Multi-tenant)
// Se registra sin conexión fija, AppDbContext.OnConfiguring la resolverá dinámicamente
builder.Services.AddDbContext<AppDbContext>();

// --- SERVICIOS DE INFRAESTRUCTURA ---
builder.Services.AddMemoryCache();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantProvider, SubdomainTenantProvider>();
builder.Services.AddScoped<MultiTenantMigrationService>();
builder.Services.AddScoped<IAuditService, AuditService>();

// Configuración de JWT
var jwtSettings = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSettings["Key"] ?? throw new InvalidOperationException("JWT Key no está configurada.");
var jwtIssuer = jwtSettings["Issuer"] ?? throw new InvalidOperationException("JWT Issuer no está configurada.");
var jwtAudience = jwtSettings["Audience"] ?? throw new InvalidOperationException("JWT Audience no está configurada.");

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

// Controladores + Swagger
builder.Services.AddControllers(options =>
{
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
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// Otros Servicios
builder.Services.AddHttpClient<Softcoinp.Backend.Services.IEmailService, BrevoEmailService>();
builder.Services.AddScoped<Softcoinp.Backend.Services.Reporting.IReportDataService, Softcoinp.Backend.Services.Reporting.ReportDataService>();
builder.Services.AddScoped<Softcoinp.Backend.Services.Reporting.IPdfReportService, Softcoinp.Backend.Services.Reporting.PdfReportService>();
builder.Services.AddScoped<Softcoinp.Backend.Services.Reporting.IExcelReportService, Softcoinp.Backend.Services.Reporting.ExcelReportService>();
builder.Services.AddScoped<Softcoinp.Backend.Services.Reporting.IEmailService, Softcoinp.Backend.Services.Reporting.EmailService>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        }
        else
        {
            var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:3000" };
            policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
        }
    });
});

var app = builder.Build();

// Pipeline de Middleware
app.UseResponseCompression();
app.UseCors("AllowFrontend");

// Archivos Estáticos
var webRootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".jpeg"] = "image/jpeg";
if (!provider.Mappings.ContainsKey(".json")) provider.Mappings[".json"] = "application/json";

if (Directory.Exists(webRootPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(webRootPath),
        ContentTypeProvider = provider,
        RequestPath = "/static"
    });
}
else
{
    app.UseStaticFiles();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseHttpsRedirection();
app.UseMiddleware<DateTimeUtcMiddleware>();

// --- MIDDLEWARE DE DETECCIÓN DE TENANT ---
app.UseMiddleware<TenantDetectionMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// --- MIGRACIONES AUTOMÁTICAS ---
using (var scope = app.Services.CreateScope())
{
    var migrationService = scope.ServiceProvider.GetRequiredService<MultiTenantMigrationService>();
    try 
    {
        await migrationService.MigrateAndSeedAllTenantsAsync();
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Error durante la migración de tenants al iniciar.");
    }
}

app.Run();
