using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Softcoinp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddVehiculosNavigationToPersonal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PersonalId1",
                table: "Vehiculos",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vehiculos_PersonalId1",
                table: "Vehiculos",
                column: "PersonalId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Vehiculos_Personal_PersonalId1",
                table: "Vehiculos",
                column: "PersonalId1",
                principalTable: "Personal",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Vehiculos_Personal_PersonalId1",
                table: "Vehiculos");

            migrationBuilder.DropIndex(
                name: "IX_Vehiculos_PersonalId1",
                table: "Vehiculos");

            migrationBuilder.DropColumn(
                name: "PersonalId1",
                table: "Vehiculos");
        }
    }
}
