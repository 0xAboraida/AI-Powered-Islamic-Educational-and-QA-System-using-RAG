using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zad.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeCitationHashIndexUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Citations_MessageId_DocumentId_ReferenceTextHash",
                table: "Citations");

            migrationBuilder.Sql("""
                ;WITH DuplicateCitations AS
                (
                    SELECT
                        [Id],
                        ROW_NUMBER() OVER (
                            PARTITION BY [MessageId], [DocumentId], [ReferenceTextHash]
                            ORDER BY [Id]) AS [RowNumber]
                    FROM [Citations]
                )
                DELETE FROM [Citations]
                WHERE [Id] IN
                (
                    SELECT [Id]
                    FROM DuplicateCitations
                    WHERE [RowNumber] > 1
                );
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Citations_MessageId_DocumentId_ReferenceTextHash",
                table: "Citations",
                columns: new[] { "MessageId", "DocumentId", "ReferenceTextHash" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Citations_MessageId_DocumentId_ReferenceTextHash",
                table: "Citations");

            migrationBuilder.CreateIndex(
                name: "IX_Citations_MessageId_DocumentId_ReferenceTextHash",
                table: "Citations",
                columns: new[] { "MessageId", "DocumentId", "ReferenceTextHash" });
        }
    }
}
