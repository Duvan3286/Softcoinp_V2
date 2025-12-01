using System;

namespace Softcoinp.Backend.Helpers
{
    public static class DateTimeHelper
    {
        /// <summary>
        /// Devuelve la hora actual en UTC y la hora local de Colombia,
        /// asegurando que los DateTime tengan un DateTimeKind válido.
        /// </summary>
        public static (DateTime Utc, DateTime Local) NowColombia()
        {
            var nowUtc = DateTime.UtcNow; // siempre Kind=Utc

            // Intentamos primero con Windows, si falla, probamos con IANA.
            string[] tryIds = new[] { "SA Pacific Standard Time", "America/Bogota" };

            TimeZoneInfo? tz = null;
            foreach (var id in tryIds)
            {
                try
                {
                    tz = TimeZoneInfo.FindSystemTimeZoneById(id);
                    break;
                }
                catch (TimeZoneNotFoundException) { }
                catch (InvalidTimeZoneException) { }
            }

            // Fallback: si no encontramos la zona, usamos UTC
            if (tz == null)
            {
                return (
                    DateTime.SpecifyKind(nowUtc, DateTimeKind.Utc),
                    DateTime.SpecifyKind(nowUtc, DateTimeKind.Utc)
                );
            }

            var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, tz);

            return (
                DateTime.SpecifyKind(nowUtc, DateTimeKind.Utc),
                DateTime.SpecifyKind(nowLocal, DateTimeKind.Local) // ⚡ evita "Unspecified"
            );
        }
    }
}
