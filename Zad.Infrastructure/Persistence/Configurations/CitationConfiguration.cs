using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zad.Domain.Entities;

namespace Zad.Infrastructure.Persistence.Configurations;

public class CitationConfiguration : IEntityTypeConfiguration<Citation>
{
    private readonly bool _useSqlServerHash;

    public CitationConfiguration(bool useSqlServerHash)
    {
        _useSqlServerHash = useSqlServerHash;
    }

    public void Configure(EntityTypeBuilder<Citation> builder)
    {
        builder.ToTable("Citations");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.MessageId)
            .IsRequired();

        builder.Property(x => x.BookTitle)
    .IsRequired()
    .HasMaxLength(300);

        builder.Property(x => x.Madhhab)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Author)
            .IsRequired()
            .HasMaxLength(300);

        builder.Property(x => x.AuthorDeath)
            .HasMaxLength(50);

        builder.Property(x => x.Part)
            .HasMaxLength(50);

        builder.Property(x => x.Hierarchy)
            .HasMaxLength(2000);

        builder.Property(x => x.SourceUrl)
            .HasMaxLength(2000);

        

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.HasIndex(x => new { x.MessageId, x.BookTitle });

        builder.HasIndex(x => new { x.MessageId, x.BookTitle, x.PageId })
            .IsUnique();


        builder.HasOne(x => x.Message)
            .WithMany(x => x.Citations)
            .HasForeignKey(x => x.MessageId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
