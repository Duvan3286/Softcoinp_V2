using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Softcoinp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Vehiculos_Placa",
                table: "Vehiculos",
                column: "Placa",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Registros_Documento",
                table: "Registros",
                column: "Documento");

            migrationBuilder.CreateIndex(
                name: "IX_Registros_HoraIngresoUtc",
                table: "Registros",
                column: "HoraIngresoUtc");

            migrationBuilder.CreateIndex(
                name: "IX_Registros_HoraSalidaUtc",
                table: "Registros",
                column: "HoraSalidaUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vehiculos_Placa",
                table: "Vehiculos");

            migrationBuilder.DropIndex(
                name: "IX_Registros_Documento",
                table: "Registros");

            migrationBuilder.DropIndex(
                name: "IX_Registros_HoraIngresoUtc",
                table: "Registros");

            migrationBuilder.DropIndex(
                name: "IX_Registros_HoraSalidaUtc",
                table: "Registros");
        }
    }
}
