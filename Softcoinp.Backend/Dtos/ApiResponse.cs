namespace Softcoinp.Backend.Helpers
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
        public object? Errors { get; set; }

        // Constructor
        public ApiResponse(bool success, T? data, string? message = null, object? errors = null)
        {
            Success = success;
            Data = data;
            Message = message;
            Errors = errors;
        }

        //  Método estático para éxito
        public static ApiResponse<T> SuccessResponse(T data, string? message = null)
        {
            return new ApiResponse<T>(true, data, message);
        }

        //  Método estático para error
        public static ApiResponse<T> Fail(T? data, string? message = null, object? errors = null)
        {
            return new ApiResponse<T>(false, data, message, errors);
        }
    }
}
