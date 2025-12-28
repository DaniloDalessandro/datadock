import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração para build otimizado no Docker
  output: 'standalone',

  // Desabilitar telemetria
  experimental: {
    instrumentationHook: false,
  },
};

export default nextConfig;
