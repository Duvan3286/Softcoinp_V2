using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Softcoinp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCorrespondencia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Correspondencias",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Remitente = table.Column<string>(type: "text", nullable: false),
                    Destinatario = table.Column<string>(type: "text", nullable: false),
                    TipoDocumento = table.Column<string>(type: "text", nullable: true),
                    NumeroGuia = table.Column<string>(type: "text", nullable: true),
                    Descripcion = table.Column<string>(type: "text", nullable: true),
                    Estado = table.Column<string>(type: "text", nullable: false),
                    FechaRecepcionUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaRecepcionLocal = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FechaEntregaUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FechaEntregaLocal = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RecibidoPor = table.Column<string>(type: "text", nullable: true),
                    NotaEntrega = table.Column<string>(type: "text", nullable: true),
                    RegistradoPor = table.Column<Guid>(type: "uuid", nullable: true),
                    EntregadoPor = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Correspondencias", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Correspondencias");
        }
    }
}
