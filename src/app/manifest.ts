import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tá Rolando — Ipatinga",
    short_name: "Tá Rolando",
    description: "Não fique de fora. Saiba o que tá rolando!",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#0B0B12",
    theme_color: "#0B0B12",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
