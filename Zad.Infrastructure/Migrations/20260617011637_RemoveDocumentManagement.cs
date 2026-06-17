using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zad.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDocumentManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Citations_Documents_DocumentId",
                table: "Citations");

            migrationBuilder.DropTable(
                name: "Documents");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_Citations_DocumentId",
                table: "Citations");

            migrationBuilder.DropIndex(
                name: "IX_Citations_MessageId_DocumentId",
                table: "Citations");

            migrationBuilder.DropIndex(
                name: "IX_Citations_MessageId_DocumentId_ReferenceTextHash",
                table: "Citations");

            migrationBuilder.DropColumn(
                name: "DocumentId",
                table: "Citations");

            migrationBuilder.AddColumn<string>(
                name: "DocumentTitle",
                table: "Citations",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Citations_MessageId_DocumentTitle",
                table: "Citations",
                columns: new[] { "MessageId", "DocumentTitle" });

            migrationBuilder.CreateIndex(
                name: "IX_Citations_MessageId_DocumentTitle_ReferenceTextHash",
                table: "Citations",
                columns: new[] { "MessageId", "DocumentTitle", "ReferenceTextHash" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Citations_MessageId_DocumentTitle",
                table: "Citations");

            migrationBuilder.DropIndex(
                name: "IX_Citations_MessageId_DocumentTitle_ReferenceTextHash",
                table: "Citations");

            migrationBuilder.DropColumn(
                name: "DocumentTitle",
                table: "Citations");

            migrationBuilder.AddColumn<int>(
                name: "DocumentId",
                table: "Citations",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Documents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoryId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Documents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Documents_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Citations_DocumentId",
                table: "Citations",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_Citations_MessageId_DocumentId",
                table: "Citations",
                columns: new[] { "MessageId", "DocumentId" });

            migrationBuilder.CreateIndex(
                name: "IX_Citations_MessageId_DocumentId_ReferenceTextHash",
                table: "Citations",
                columns: new[] { "MessageId", "DocumentId", "ReferenceTextHash" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Name",
                table: "Categories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Documents_CategoryId",
                table: "Documents",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_Title_Source",
                table: "Documents",
                columns: new[] { "Title", "Source" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Citations_Documents_DocumentId",
                table: "Citations",
                column: "DocumentId",
                principalTable: "Documents",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
