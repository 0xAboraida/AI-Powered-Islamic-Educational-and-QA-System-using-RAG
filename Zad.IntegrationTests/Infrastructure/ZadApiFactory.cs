using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Zad.Application.Interfaces;
using Zad.Infrastructure.Persistence;

namespace Zad.IntegrationTests.Infrastructure;

public sealed class ZadApiFactory : WebApplicationFactory<Zad.API.Program>, IAsyncLifetime
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<ZadDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<ZadDbContext>>();
            services.RemoveAll<ZadDbContext>();
            services.RemoveAll<IAiClient>();
            services.RemoveAll(typeof(Zad.Infrastructure.External.IAiClient));

            services.AddDbContext<ZadDbContext>(options => options.UseSqlite(_connection));
            services.AddScoped<IAiClient, FakeAiClient>();
        });
    }

    public async Task InitializeAsync()
    {
        await _connection.OpenAsync();
        await ResetDatabaseAsync();
    }

    public new async Task DisposeAsync()
    {
        await _connection.DisposeAsync();
        await base.DisposeAsync();
    }

    public async Task ResetDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ZadDbContext>();

        await db.Database.EnsureDeletedAsync();
        await db.Database.EnsureCreatedAsync();
        await SeedData.SeedAsync(db);
    }
}
