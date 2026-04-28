using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Quartz;
using Softcoinp.Backend;
using Softcoinp.Worker.Jobs;
using Softcoinp.Worker.Services;

var builder = Host.CreateApplicationBuilder(args);

// 1. Configurar Base de Datos (Consumiendo AppDbContext del Backend)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=db;Database=softcoinpdb;User=root;Password=rootpassword";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// 2. Registrar Servicios de Lógica de Negocio (SOLID)
builder.Services.AddScoped<IReportDataService, ReportDataService>();
builder.Services.AddScoped<IPdfReportService, PdfReportService>();
builder.Services.AddScoped<IExcelReportService, ExcelReportService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// 3. Configurar Quartz.NET
builder.Services.AddQuartz(q =>
{
    // Usar identificador único para este worker
    q.SchedulerId = "SOFTCOINP-Report-Worker";

    // Configurar Job
    var jobKey = new JobKey("MonthlyReportJob");
    q.AddJob<MonthlyReportJob>(opts => opts.WithIdentity(jobKey));

    // Configurar Trigger con Expresión CRON (Cada 1ero del mes a las 8:00 AM)
    q.AddTrigger(opts => opts
        .ForJob(jobKey)
        .WithIdentity("MonthlyReportTrigger")
        .WithCronSchedule("0 0 8 1 * ?")); // Segundo 0, Minuto 0, Hora 8, Día 1 de cada mes
});

// 4. Agregar el servicio alojado de Quartz
builder.Services.AddQuartzHostedService(q => q.WaitForJobsToComplete = true);

var host = builder.Build();
host.Run();
