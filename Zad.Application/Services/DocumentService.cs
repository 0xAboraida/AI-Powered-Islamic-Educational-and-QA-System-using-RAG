using AutoMapper;
using Microsoft.Extensions.Logging;
using Zad.Application.DTOs;
using Zad.Application.Interfaces;

namespace Zad.Application.Services;

public class DocumentService : IDocumentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ILogger<DocumentService> _logger;

    public DocumentService(IUnitOfWork unitOfWork, IMapper mapper, ILogger<DocumentService> logger)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _logger = logger;
    }

    public Task<IReadOnlyList<DocumentDto>> GetDocuments()
    {
        return GetAllDocuments();
    }

    public async Task<IReadOnlyList<DocumentDto>> GetAllDocuments()
    {
        var documents = await _unitOfWork.Documents.GetAllWithCategoryAsync();
        _logger.LogInformation("Retrieved all documents. Count: {Count}", documents.Count);
        return _mapper.Map<IReadOnlyList<DocumentDto>>(documents);
    }

    public async Task<IReadOnlyList<DocumentDto>> GetDocumentsByCategory(int categoryId)
    {
        var documents = await _unitOfWork.Documents.GetByCategoryAsync(categoryId);
        _logger.LogInformation("Retrieved documents by category. CategoryId: {CategoryId}, Count: {Count}", categoryId, documents.Count);
        return _mapper.Map<IReadOnlyList<DocumentDto>>(documents);
    }

    public async Task<IReadOnlyList<CategoryDto>> GetCategories()
    {
        var categories = await _unitOfWork.Categories.GetAllAsync();
        return _mapper.Map<IReadOnlyList<CategoryDto>>(categories);
    }
}
