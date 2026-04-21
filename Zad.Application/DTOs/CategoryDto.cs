namespace Zad.Application.DTOs;

/// <summary>
/// Content category metadata.
/// </summary>
public class CategoryDto
{
    /// <summary>
    /// Category identifier.
    /// </summary>
    /// <example>3</example>
    public int Id { get; set; }

    /// <summary>
    /// Category display name.
    /// </summary>
    /// <example>Fiqh</example>
    public string Name { get; set; } = string.Empty;
}
