namespace Softcoinp.Backend.Dtos
{
    public class ResetPasswordRequest
    {
        public string? NewPassword { get; set; }  // si no se manda, el backend genera una temporal
    }
}
