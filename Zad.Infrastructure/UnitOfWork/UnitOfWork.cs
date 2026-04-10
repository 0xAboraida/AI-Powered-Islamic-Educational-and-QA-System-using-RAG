using Microsoft.EntityFrameworkCore.Storage;
using Zad.Infrastructure.Persistence;
using Zad.Infrastructure.Repositories;

namespace Zad.Infrastructure.UnitOfWork;

public class UnitOfWork : IUnitOfWork, IAsyncDisposable
{
    private readonly ZadDbContext _context;
    private IDbContextTransaction? _transaction;

    public UnitOfWork(
        ZadDbContext context,
        IUserRepository users,
        IChatSessionRepository chatSessions,
        IMessageRepository messages,
        ICitationRepository citations,
        IDocumentRepository documents,
        ICategoryRepository categories,
        IRequestLogRepository requestLogs)
    {
        _context = context;
        Users = users;
        ChatSessions = chatSessions;
        Messages = messages;
        Citations = citations;
        Documents = documents;
        Categories = categories;
        RequestLogs = requestLogs;
    }

    public IUserRepository Users { get; }
    public IChatSessionRepository ChatSessions { get; }
    public IMessageRepository Messages { get; }
    public ICitationRepository Citations { get; }
    public IDocumentRepository Documents { get; }
    public ICategoryRepository Categories { get; }
    public IRequestLogRepository RequestLogs { get; }

    Zad.Application.Interfaces.Repositories.IUserRepository Zad.Application.Interfaces.IUnitOfWork.Users => Users;
    Zad.Application.Interfaces.Repositories.IChatSessionRepository Zad.Application.Interfaces.IUnitOfWork.ChatSessions => ChatSessions;
    Zad.Application.Interfaces.Repositories.IMessageRepository Zad.Application.Interfaces.IUnitOfWork.Messages => Messages;
    Zad.Application.Interfaces.Repositories.ICitationRepository Zad.Application.Interfaces.IUnitOfWork.Citations => Citations;
    Zad.Application.Interfaces.Repositories.IDocumentRepository Zad.Application.Interfaces.IUnitOfWork.Documents => Documents;
    Zad.Application.Interfaces.Repositories.ICategoryRepository Zad.Application.Interfaces.IUnitOfWork.Categories => Categories;
    Zad.Application.Interfaces.Repositories.IRequestLogRepository Zad.Application.Interfaces.IUnitOfWork.RequestLogs => RequestLogs;

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is not null)
        {
            return;
        }

        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is null)
        {
            return;
        }

        await _context.SaveChangesAsync(cancellationToken);
        await _transaction.CommitAsync(cancellationToken);
        await _transaction.DisposeAsync();
        _transaction = null;
    }

    public async Task RollbackAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction is null)
        {
            return;
        }

        await _transaction.RollbackAsync(cancellationToken);
        await _transaction.DisposeAsync();
        _transaction = null;
        _context.ChangeTracker.Clear();
    }

    public async ValueTask DisposeAsync()
    {
        if (_transaction is not null)
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }
}
