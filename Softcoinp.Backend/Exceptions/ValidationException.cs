namespace Softcoinp.Backend.Exceptions
{
    public class ValidationException : Exception
    {
        public IDictionary<string, string[]> Errors { get; }

        public ValidationException(IDictionary<string, string[]> errors)
            : base("Uno o más errores de validación ocurrieron.")
        {
            Errors = errors;
        }
    }
}
