using Microsoft.AspNetCore.Mvc.Filters;
using Softcoinp.Backend.Exceptions;

namespace Softcoinp.Backend.Filters
{
    public class ValidationFilter : IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            if (!context.ModelState.IsValid)
            {
                var errors = context.ModelState
                    .Where(ms => ms.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                    );

                throw new ValidationException(errors);
            }
        }

        public void OnActionExecuted(ActionExecutedContext context) { }
    }
}
