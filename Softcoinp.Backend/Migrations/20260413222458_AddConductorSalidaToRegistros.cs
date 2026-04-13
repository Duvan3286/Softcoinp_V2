using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Softcoinp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddConductorSalidaToRegistros : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ConductorId",
                table: "RegistrosVehiculos",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConductorNombre",
                table: "RegistrosVehiculos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ConductorSalidaId",
                table: "RegistrosVehiculos",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConductorSalidaNombre",
                table: "RegistrosVehiculos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ConductorId",
                table: "Registros",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConductorNombre",
                table: "Registros",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ConductorSalidaId",
                table: "Registros",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConductorSalidaNombre",
                table: "Registros",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RegistrosVehiculos_ConductorId",
                table: "RegistrosVehiculos",
                column: "ConductorId");

            migrationBuilder.CreateIndex(
                name: "IX_RegistrosVehiculos_ConductorSalidaId",
                table: "RegistrosVehiculos",
                column: "ConductorSalidaId");

            migrationBuilder.CreateIndex(
                name: "IX_Registros_ConductorId",
                table: "Registros",
                column: "ConductorId");

            migrationBuilder.CreateIndex(
                name: "IX_Registros_ConductorSalidaId",
                table: "Registros",
                column: "ConductorSalidaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Registros_Personal_ConductorId",
                table: "Registros",
                column: "ConductorId",
                principalTable: "Personal",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Registros_Personal_ConductorSalidaId",
                table: "Registros",
                column: "ConductorSalidaId",
                principalTable: "Personal",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RegistrosVehiculos_Personal_ConductorId",
                table: "RegistrosVehiculos",
                column: "ConductorId",
                principalTable: "Personal",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RegistrosVehiculos_Personal_ConductorSalidaId",
                table: "RegistrosVehiculos",
                column: "ConductorSalidaId",
                principalTable: "Personal",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Registros_Personal_ConductorId",
                table: "Registros");

            migrationBuilder.DropForeignKey(
                name: "FK_Registros_Personal_ConductorSalidaId",
                table: "Registros");

            migrationBuilder.DropForeignKey(
                name: "FK_RegistrosVehiculos_Personal_ConductorId",
                table: "RegistrosVehiculos");

            migrationBuilder.DropForeignKey(
                name: "FK_RegistrosVehiculos_Personal_ConductorSalidaId",
                table: "RegistrosVehiculos");

            migrationBuilder.DropIndex(
                name: "IX_RegistrosVehiculos_ConductorId",
                table: "RegistrosVehiculos");

            migrationBuilder.DropIndex(
                name: "IX_RegistrosVehiculos_ConductorSalidaId",
                table: "RegistrosVehiculos");

            migrationBuilder.DropIndex(
                name: "IX_Registros_ConductorId",
                table: "Registros");

            migrationBuilder.DropIndex(
                name: "IX_Registros_ConductorSalidaId",
                table: "Registros");

            migrationBuilder.DropColumn(
                name: "ConductorId",
                table: "RegistrosVehiculos");

            migrationBuilder.DropColumn(
                name: "ConductorNombre",
                table: "RegistrosVehiculos");

            migrationBuilder.DropColumn(
                name: "ConductorSalidaId",
                table: "RegistrosVehiculos");

            migrationBuilder.DropColumn(
                name: "ConductorSalidaNombre",
                table: "RegistrosVehiculos");

            migrationBuilder.DropColumn(
                name: "ConductorId",
                table: "Registros");

            migrationBuilder.DropColumn(
                name: "ConductorNombre",
                table: "Registros");

            migrationBuilder.DropColumn(
                name: "ConductorSalidaId",
                table: "Registros");

            migrationBuilder.DropColumn(
                name: "ConductorSalidaNombre",
                table: "Registros");
        }
    }
}
