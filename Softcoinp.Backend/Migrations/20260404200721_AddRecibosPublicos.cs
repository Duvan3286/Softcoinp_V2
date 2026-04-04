using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Softcoinp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddRecibosPublicos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RecibosPublicos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Servicio = table.Column<string>(type: "text", nullable: false),
                    Mes = table.Column<string>(type: "text", nullable: false),
                    Anio = table.Column<int>(type: "integer", nullable: false),
                    TotalRecibidos = table.Column<int>(type: "integer", nullable: false),
                    TotalEntregados = table.Column<int>(type: "integer", nullable: false),
                    FechaCreacionUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecibosPublicos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EntregasRecibos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReciboPublicoId = table.Column<Guid>(type: "uuid", nullable: false),
                    ResidenteNombre = table.Column<string>(type: "text", nullable: false),
                    Apartamento = table.Column<string>(type: "text", nullable: false),
                    FechaEntregaUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RegistradoPor = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EntregasRecibos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EntregasRecibos_RecibosPublicos_ReciboPublicoId",
                        column: x => x.ReciboPublicoId,
                        principalTable: "RecibosPublicos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EntregasRecibos_ReciboPublicoId",
                table: "EntregasRecibos",
                column: "ReciboPublicoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EntregasRecibos");

            migrationBuilder.DropTable(
                name: "RecibosPublicos");
        }
    }
}
