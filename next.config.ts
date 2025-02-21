import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images:{
    remotePatterns:[
      {
        protocol: "https",  // Asegúrate de que el protocolo sea "https"
        hostname: "image.mux.com"
      },
      {
        protocol: "https",  // Asegúrate de que el protocolo sea "https"
        hostname: "utfs.io"
      }
    ]
  }
};

export default nextConfig;
