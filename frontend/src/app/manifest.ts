import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "아크노트",
    short_name: "아크노트",
    start_url: "/",
    display: "standalone",
    theme_color: "#f7f4ec",
    background_color: "#f7f4ec",
    lang: "ko",
    icons: [
      {
        src: "/icons/arcnote-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/arcnote-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
