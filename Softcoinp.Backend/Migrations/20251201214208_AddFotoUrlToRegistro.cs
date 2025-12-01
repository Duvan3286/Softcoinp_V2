using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Softcoinp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFotoUrlToRegistro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FotoUrl",
                table: "Registros",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FotoUrl",
                table: "Registros");
        }
    }
}
