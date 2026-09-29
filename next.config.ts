import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La receta en PDF lee el logo y la firma del disco (src/lib/receta-pdf.ts).
  // Next solo empaqueta lo que ve importado, así que se incluyen a mano en las
  // rutas del dashboard, que son las que generan recetas.
  outputFileTracingIncludes: {
    "/dashboard/**": ["src/assets/receta/**/*"],
  },
};

export default nextConfig;
