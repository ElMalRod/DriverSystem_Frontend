import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Rutas específicas que tienen proxies personalizados - NO redirigir
      // { source: "/api/user/vehicle/:path*", destination: "/api/user/vehicle/:path*" },
      // { source: "/api/debug-status", destination: "/api/debug-status" },
      // { source: "/api/patch-status", destination: "/api/patch-status" },
      
      // Solo redirigir rutas que NO tienen proxies personalizados
      { 
        source: "/api/Work/:path*", 
        destination: "http://localhost:8080/api/Work/:path*" 
      },
      { 
        source: "/api/vehicle/makes/:path*", 
        destination: "http://localhost:8080/api/vehicle/makes/:path*" 
      },
      { 
        source: "/api/vehicle/model/:path*", 
        destination: "http://localhost:8080/api/vehicle/model/:path*" 
      },
      { 
        source: "/api/vehicle/visit/:path*", 
        destination: "http://localhost:8080/api/vehicle/visit/:path*" 
      },
      // Fallback para otras rutas de API que no están definidas específicamente
      { 
        source: "/api/maintenance/:path*", 
        destination: "http://localhost:8080/api/maintenance/:path*" 
      }
    ];
  },
};

module.exports = nextConfig;

