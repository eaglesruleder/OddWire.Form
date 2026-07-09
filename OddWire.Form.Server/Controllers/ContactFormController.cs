using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace OddWire.Form.Server.Controllers
{
    [ApiController]
    [Route("api/form/contact")]
    public class ContactFormController : ControllerBase
    {
        public static JsonElement? LastBody { get; private set; }

        [HttpPost]
        public IActionResult Post(JsonElement body)
        {
            LastBody = body.Clone();

            return Ok(new { captured = true });
        }
    }
}
