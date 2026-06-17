using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Zad.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveChatMode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExpertSubMode",
                table: "RequestLogs");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExpertSubMode",
                table: "RequestLogs",
                type: "int",
                nullable: true);
        }
    }
}
