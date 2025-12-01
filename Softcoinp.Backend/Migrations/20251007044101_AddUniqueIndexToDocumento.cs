using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Softcoinp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueIndexToDocumento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HoraIngresoLocal",
                table: "Registros");

            migrationBuilder.DropColumn(
                name: "HoraSalidaLocal",
                table: "Registros");

            migrationBuilder.CreateIndex(
                name: "IX_Registros_Documento",
                table: "Registros",
                column: "Documento",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Registros_Documento",
                table: "Registros");

            migrationBuilder.AddColumn<DateTime>(
                name: "HoraIngresoLocal",
                table: "Registros",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "HoraSalidaLocal",
                table: "Registros",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
