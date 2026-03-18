using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Softcoinp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTipoVehiculo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TipoVehiculo",
                table: "Vehiculos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoVehiculo",
                table: "Registros",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TipoVehiculo",
                table: "Vehiculos");

            migrationBuilder.DropColumn(
                name: "TipoVehiculo",
                table: "Registros");
        }
    }
}
