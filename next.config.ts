import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Rutas específicas que tienen proxies personalizados - NO redirigir
      // { source: "/api/user/vehicle/:path*", destination: "/api/user/vehicle/:path*" },
      // { source: "/api/debug-status", destination: "/api/debug-status" },
      // { source: "/api/patch-status", destination: "/api/patch-status" },
      
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
      { 
        source: "/api/maintenance/:path*", 
        destination: "http://localhost:8080/api/maintenance/:path*" 
      },
      { 
        source: "/api/supplier-products/:path*", 
        destination: "http://localhost:8080/api/supplier-products/:path*" 
      },
      { 
        source: "/api/supplier-products/supplier/:path*", 
        destination: "http://localhost:8080/api/supplier-products/supplier/:path*" 
      },
      {
        source: "/api/purchase-orders/:path*",
        destination: "http://localhost:8080/api/purchase-orders/:path*"
      },
    ];
  },
};

module.exports = nextConfig;

