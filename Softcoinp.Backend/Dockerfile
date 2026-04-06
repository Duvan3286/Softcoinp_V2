# Etapa de compilación
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Softcoinp.Backend.csproj", "./"]
RUN dotnet restore "./Softcoinp.Backend.csproj"
COPY . .
RUN dotnet publish "Softcoinp.Backend.csproj" -c Release -o /app/publish

# Etapa final
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# INSTALACIÓN CRÍTICA: Cliente de PostgreSQL para pg_dump
RUN apt-get update && apt-get install -y postgresql-client-15 && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Softcoinp.Backend.dll"]
