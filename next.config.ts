import type { NextConfig } from "next"
import path from "path"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Silence l'avertissement de workspace root (lockfile parent détecté)
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
