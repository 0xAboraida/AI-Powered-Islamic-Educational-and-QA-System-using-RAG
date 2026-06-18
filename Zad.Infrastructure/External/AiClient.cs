using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Diagnostics;
using System.Globalization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Zad.Application.DTOs;
using Zad.Application.Interfaces;

namespace Zad.Infrastructure.External;

public class AiClient : IAiClient
{
    private static readonly JsonSerializerOptions JsonSerializerOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _httpClient;
    private readonly AiClientOptions _options;
    private readonly ILogger<AiClient> _logger;

    public AiClient(HttpClient httpClient, IOptions<AiClientOptions> options, ILogger<AiClient> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<AiResponseDto> AskAsync(AiRequestDto request)
    {
        ArgumentNullException.ThrowIfNull(request);

        EnsureBaseAddressConfigured();
        var askPath = string.IsNullOrWhiteSpace(_options.AskPath) ? "/api/ask" : _options.AskPath;

        _logger.LogInformation(
            "Sending AI request. Mode: {Mode}",
            request.Domain);

        var stopwatch = Stopwatch.StartNew();

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, askPath)
        {
            Content = JsonContent.Create(request)
        };

        var requestUri = httpRequest.RequestUri is null
            ? null
            : httpRequest.RequestUri.IsAbsoluteUri
                ? httpRequest.RequestUri
                : new Uri(_httpClient.BaseAddress!, httpRequest.RequestUri);

        httpRequest.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        if (!string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            httpRequest.Headers.TryAddWithoutValidation("X-Api-Key", _options.ApiKey);
        }

        try
        {
            using var response = await _httpClient.SendAsync(httpRequest);

            if (response.StatusCode == HttpStatusCode.RequestTimeout)
            {
                throw new TimeoutException("The AI service request timed out.");
            }

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError(
                    "AI service request to {RequestUri} failed with status {StatusCode} after {ElapsedMs} ms. Response: {Response}",
                    requestUri,
                    (int)response.StatusCode,
                    stopwatch.ElapsedMilliseconds,
                    errorContent);

                if (response.StatusCode == HttpStatusCode.NotFound)
                {
                    throw new HttpRequestException(
                        $"AI service endpoint not found (404) at '{requestUri}'. Configure 'AiService:AskPath' to match the AI route.");
                }

                throw new HttpRequestException($"AI service request failed with status code {(int)response.StatusCode} at '{requestUri}'.");
            }

            var result = await response.Content.ReadFromJsonAsync<AiResponseDto>(JsonSerializerOptions);

            _logger.LogInformation(
                "AI request completed successfully in {ElapsedMs} ms with status {StatusCode}",
                stopwatch.ElapsedMilliseconds,
                (int)response.StatusCode);

            return result ?? throw new InvalidOperationException("AI service returned an empty response body.");
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogWarning(ex, "AI service request timed out after {ElapsedMs} ms.", stopwatch.ElapsedMilliseconds);
            throw new TimeoutException("The AI service request timed out.", ex);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "AI service request failed after {ElapsedMs} ms.", stopwatch.ElapsedMilliseconds);
            throw;
        }
    }

    private void EnsureBaseAddressConfigured()
    {
        if (_httpClient.BaseAddress is not null)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(_options.BaseUrl))
        {
            throw new InvalidOperationException(
                "AI service base URL is not configured. Set 'AiService:BaseUrl' to an absolute URL (for example: 'https://localhost:5001').");
        }

        if (!Uri.TryCreate(_options.BaseUrl, UriKind.Absolute, out var baseUri))
        {
            throw new InvalidOperationException(
                string.Format(
                    CultureInfo.InvariantCulture,
                    "AI service base URL '{0}' is invalid. Set 'AiService:BaseUrl' to a valid absolute URL.",
                    _options.BaseUrl));
        }

        _httpClient.BaseAddress = baseUri;
    }
}
