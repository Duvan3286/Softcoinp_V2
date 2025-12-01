using System.Net;
using System.Text.Json;
using Softcoinp.Backend.Exceptions;

namespace Softcoinp.Backend.Middlewares
{
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ErrorHandlingMiddleware> _logger;
        private readonly IHostEnvironment _env;

        public ErrorHandlingMiddleware(
            RequestDelegate next,
            ILogger<ErrorHandlingMiddleware> logger,
            IHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);

                if (context.Response.StatusCode >= 400 && !context.Response.HasStarted)
                {
                    await WriteErrorResponse(context, context.Response.StatusCode, null);
                }
            }
            catch (ValidationException vex) 
            {
                await WriteValidationErrorResponse(context, vex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error no controlado");
                await WriteErrorResponse(context, (int)HttpStatusCode.InternalServerError, ex);
            }
        }

        private async Task WriteValidationErrorResponse(HttpContext context, ValidationException vex)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;

            var response = new
            {
                status = context.Response.StatusCode,
                title = "Errores de validación",
                errors = vex.Errors, 
                traceId = context.TraceIdentifier
            };

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            var json = JsonSerializer.Serialize(response, options);
            await context.Response.WriteAsync(json);
        }

        private async Task WriteErrorResponse(HttpContext context, int statusCode, Exception? ex)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = statusCode;

            string title = statusCode switch
            {
                400 => "Solicitud incorrecta",
                401 => "No autorizado",
                403 => "Prohibido",
                404 => "No encontrado",
                500 => "Error interno del servidor",
                _ => "Error"
            };

            var response = new
            {
                status = statusCode,
                title,
                message = ex == null ? title : "Ocurrió un error inesperado en el servidor",
                details = _env.IsDevelopment() ? ex?.Message : null,
                traceId = context.TraceIdentifier
            };

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            };

            var json = JsonSerializer.Serialize(response, options);
            await context.Response.WriteAsync(json);
        }
    }
}
