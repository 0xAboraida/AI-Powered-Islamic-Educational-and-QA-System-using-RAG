using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Zad.Domain.Entities;

namespace Zad.Infrastructure.Persistence;

public static class SeedData
{
    public static async Task SeedAsync(ZadDbContext dbContext, IConfiguration? configuration = null)
    {
        var categoryNames = new[] { "Fiqh", "Quran", "Hadith", "Comparative Fiqh" };
        var existingCategoryNames = await dbContext.Categories
            .Select(c => c.Name)
            .ToListAsync();

        var existingCategorySet = existingCategoryNames
            .Select(name => name.ToLowerInvariant())
            .ToHashSet();

        var categoriesToAdd = categoryNames
            .Where(name => !existingCategorySet.Contains(name.ToLowerInvariant()))
            .Select(name => new Category { Name = name })
            .ToList();

        if (categoriesToAdd.Count > 0)
        {
            await dbContext.Categories.AddRangeAsync(categoriesToAdd);
            await dbContext.SaveChangesAsync();
        }

        var categoriesByName = await dbContext.Categories
            .ToDictionaryAsync(c => c.Name, c => c.Id, StringComparer.OrdinalIgnoreCase);

        var sampleDocuments = new[]
        {
            new { Title = "Introduction to Fiqh", Source = "Fiqh Fundamentals - Vol. 1", CategoryName = "Fiqh" },
            new { Title = "Tafsir Basics", Source = "Quran Study Guide", CategoryName = "Quran" },
            new { Title = "Forty Hadith Overview", Source = "Imam Nawawi Collection", CategoryName = "Hadith" },
            new { Title = "Hanafi and Shafi Positions on Wudu", Source = "Comparative Fiqh Notes", CategoryName = "Comparative Fiqh" }
        };

        var existingDocumentKeys = await dbContext.Documents
            .Select(d => new { d.Title, d.Source })
            .ToListAsync();

        var existingDocumentKeySet = existingDocumentKeys
            .Select(d => $"{d.Title}|{d.Source}".ToLowerInvariant())
            .ToHashSet();

        var documentsToAdd = sampleDocuments
            .Where(d => categoriesByName.ContainsKey(d.CategoryName))
            .Where(d => !existingDocumentKeySet.Contains($"{d.Title}|{d.Source}".ToLowerInvariant()))
            .Select(d => new Document
            {
                Title = d.Title,
                Source = d.Source,
                CategoryId = categoriesByName[d.CategoryName]
            })
            .ToList();

        if (documentsToAdd.Count > 0)
        {
            await dbContext.Documents.AddRangeAsync(documentsToAdd);
            await dbContext.SaveChangesAsync();
        }

    }
}
