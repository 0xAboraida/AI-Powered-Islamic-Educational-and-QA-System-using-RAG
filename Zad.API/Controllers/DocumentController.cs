using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Zad.Application.Interfaces;

namespace Zad.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DocumentController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpGet("/api/documents")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetDocuments()
    {
        try
        {
            var documents = await _documentService.GetAllDocuments();
            return Ok(documents);
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred." });
        }
    }

    [HttpGet("/api/documents/category/{categoryId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetDocumentsByCategory(int categoryId)
    {
        try
        {
            var documents = await _documentService.GetDocumentsByCategory(categoryId);
            if (documents.Count == 0)
            {
                return NotFound(new { message = "No documents found for this category." });
            }

            return Ok(documents);
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred." });
        }
    }

    [HttpGet("/api/categories")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetCategories()
    {
        try
        {
            var categories = await _documentService.GetCategories();
            return Ok(categories);
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An unexpected error occurred." });
        }
    }
}
