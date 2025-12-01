using System.Globalization;

namespace Softcoinp.Backend.Middlewares
{
    public class DateTimeUtcMiddleware
    {
        private readonly RequestDelegate _next;

        public DateTimeUtcMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            foreach (var key in context.Request.Query.Keys)
            {
                var value = context.Request.Query[key];

                if (DateTime.TryParse(value, out var parsed) && parsed.Kind == DateTimeKind.Unspecified)
                {
                    // 🔒 Convertir a UTC
                    var utcValue = DateTime.SpecifyKind(parsed, DateTimeKind.Utc);

                    context.Request.Query = new QueryCollection(
                        context.Request.Query.ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Key == key
                                ? new Microsoft.Extensions.Primitives.StringValues(utcValue.ToString("o", CultureInfo.InvariantCulture))
                                : kvp.Value
                        )
                    );
                }
            }

            await _next(context);
        }
    }
}
