using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Softcoinp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddRefreshTokenToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "HoraSalida",
                table: "Registros",
                newName: "HoraSalidaUtc");

            migrationBuilder.RenameColumn(
                name: "HoraIngreso",
                table: "Registros",
                newName: "HoraIngresoUtc");

            migrationBuilder.AddColumn<string>(
                name: "RefreshToken",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "RefreshTokenExpiry",
                table: "Users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<string>(
                name: "Motivo",
                table: "Registros",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RefreshToken",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RefreshTokenExpiry",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "HoraIngresoLocal",
                table: "Registros");

            migrationBuilder.DropColumn(
                name: "HoraSalidaLocal",
                table: "Registros");

            migrationBuilder.RenameColumn(
                name: "HoraSalidaUtc",
                table: "Registros",
                newName: "HoraSalida");

            migrationBuilder.RenameColumn(
                name: "HoraIngresoUtc",
                table: "Registros",
                newName: "HoraIngreso");

            migrationBuilder.AlterColumn<string>(
                name: "Motivo",
                table: "Registros",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}
