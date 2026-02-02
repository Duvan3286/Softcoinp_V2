using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Softcoinp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddNombreToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Nombre",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Nombre",
                table: "Users");
        }
    }
}
