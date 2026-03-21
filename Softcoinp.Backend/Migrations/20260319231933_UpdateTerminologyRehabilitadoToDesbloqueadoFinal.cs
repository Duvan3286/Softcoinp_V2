using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Softcoinp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTerminologyRehabilitadoToDesbloqueadoFinal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"Anotaciones\" SET \"Texto\" = REPLACE(\"Texto\", 'VEHÍCULO REHABILITADO', 'VEHÍCULO DESBLOQUEADO') WHERE \"Texto\" LIKE '%VEHÍCULO REHABILITADO%'");
            migrationBuilder.Sql("UPDATE \"Anotaciones\" SET \"Texto\" = REPLACE(\"Texto\", 'PERSONA REHABILITADA', 'PERSONA DESBLOQUEADA') WHERE \"Texto\" LIKE '%PERSONA REHABILITADA%'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"Anotaciones\" SET \"Texto\" = REPLACE(\"Texto\", 'VEHÍCULO DESBLOQUEADO', 'VEHÍCULO REHABILITADO') WHERE \"Texto\" LIKE '%VEHÍCULO DESBLOQUEADO%'");
            migrationBuilder.Sql("UPDATE \"Anotaciones\" SET \"Texto\" = REPLACE(\"Texto\", 'PERSONA DESBLOQUEADA', 'PERSONA REHABILITADA') WHERE \"Texto\" LIKE '%PERSONA DESBLOQUEADA%'");
        }
    }
}
