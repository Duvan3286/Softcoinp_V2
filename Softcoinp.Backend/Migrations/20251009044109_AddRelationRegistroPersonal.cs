using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Softcoinp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddRelationRegistroPersonal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Registros_Documento",
                table: "Registros");

            migrationBuilder.AddColumn<Guid>(
                name: "PersonalId",
                table: "Registros",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Personal",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "text", nullable: false),
                    Apellido = table.Column<string>(type: "text", nullable: false),
                    Documento = table.Column<string>(type: "text", nullable: false),
                    Tipo = table.Column<string>(type: "text", nullable: false),
                    FechaCreacionUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Personal", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Registros_PersonalId",
                table: "Registros",
                column: "PersonalId");

            migrationBuilder.CreateIndex(
                name: "IX_Personal_Documento",
                table: "Personal",
                column: "Documento",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Registros_Personal_PersonalId",
                table: "Registros",
                column: "PersonalId",
                principalTable: "Personal",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Registros_Personal_PersonalId",
                table: "Registros");

            migrationBuilder.DropTable(
                name: "Personal");

            migrationBuilder.DropIndex(
                name: "IX_Registros_PersonalId",
                table: "Registros");

            migrationBuilder.DropColumn(
                name: "PersonalId",
                table: "Registros");

            migrationBuilder.CreateIndex(
                name: "IX_Registros_Documento",
                table: "Registros",
                column: "Documento",
                unique: true);
        }
    }
}
