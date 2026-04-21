namespace Zad.Application.DTOs;

/// <summary>
/// User profile data returned by the API.
/// </summary>
public class UserDto
{
    /// <summary>
    /// User identifier.
    /// </summary>
    /// <example>12</example>
    public int Id { get; set; }

    /// <summary>
    /// User email address.
    /// </summary>
    /// <example>user@zad.app</example>
    public string Email { get; set; } = string.Empty;
}
