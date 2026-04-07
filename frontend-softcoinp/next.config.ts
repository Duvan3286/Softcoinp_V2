import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite que el servidor de desarrollo acepte conexiones desde el host Docker
  // (necesario cuando el browser accede via localhost pero el server corre en el contenedor)
  allowedDevOrigins: ["http://localhost:3000"],
};

export default nextConfig;
