using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Softcoinp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddVehiculosYCamposRegistro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ColorVehiculo",
                table: "Registros",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FotoVehiculoUrl",
                table: "Registros",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MarcaVehiculo",
                table: "Registros",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModeloVehiculo",
                table: "Registros",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlacaVehiculo",
                table: "Registros",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Vehiculos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Placa = table.Column<string>(type: "text", nullable: false),
                    Marca = table.Column<string>(type: "text", nullable: true),
                    Modelo = table.Column<string>(type: "text", nullable: true),
                    Color = table.Column<string>(type: "text", nullable: true),
                    FotoUrl = table.Column<string>(type: "text", nullable: true),
                    PersonalId = table.Column<Guid>(type: "uuid", nullable: false),
                    FechaCreacionUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vehiculos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Vehiculos_Personal_PersonalId",
                        column: x => x.PersonalId,
                        principalTable: "Personal",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Vehiculos_PersonalId",
                table: "Vehiculos",
                column: "PersonalId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Vehiculos");

            migrationBuilder.DropColumn(
                name: "ColorVehiculo",
                table: "Registros");

            migrationBuilder.DropColumn(
                name: "FotoVehiculoUrl",
                table: "Registros");

            migrationBuilder.DropColumn(
                name: "MarcaVehiculo",
                table: "Registros");

            migrationBuilder.DropColumn(
                name: "ModeloVehiculo",
                table: "Registros");

            migrationBuilder.DropColumn(
                name: "PlacaVehiculo",
                table: "Registros");
        }
    }
}
