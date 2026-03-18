using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Softcoinp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddVehiculoIdToAnotaciones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "PersonalId",
                table: "Anotaciones",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "VehiculoId",
                table: "Anotaciones",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Anotaciones_VehiculoId",
                table: "Anotaciones",
                column: "VehiculoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Anotaciones_Vehiculos_VehiculoId",
                table: "Anotaciones",
                column: "VehiculoId",
                principalTable: "Vehiculos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Anotaciones_Vehiculos_VehiculoId",
                table: "Anotaciones");

            migrationBuilder.DropIndex(
                name: "IX_Anotaciones_VehiculoId",
                table: "Anotaciones");

            migrationBuilder.DropColumn(
                name: "VehiculoId",
                table: "Anotaciones");

            migrationBuilder.AlterColumn<Guid>(
                name: "PersonalId",
                table: "Anotaciones",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
