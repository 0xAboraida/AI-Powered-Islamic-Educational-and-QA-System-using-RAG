using Microsoft.EntityFrameworkCore;
using Zad.Domain.Entities;
using Zad.Infrastructure.Persistence;

namespace Zad.Infrastructure.Repositories;

public class MessageRepository : GenericRepository<Message>, IMessageRepository
{
    public MessageRepository(ZadDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<Message>> GetByChatSession(int chatSessionId)
    {
        return await Context.Messages
            .Where(x => x.ChatSessionId == chatSessionId)
            .Include(x => x.Citations)
            .ThenInclude(x => x.Document)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<Message?> GetWithCitations(int messageId)
    {
        return await Context.Messages
            .Include(x => x.Citations)
            .ThenInclude(x => x.Document)
            .FirstOrDefaultAsync(x => x.Id == messageId);
    }
}
