import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração para build otimizado no Docker
  output: 'standalone',
};

export default nextConfig;
