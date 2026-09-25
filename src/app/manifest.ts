import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pocketless",
    short_name: "Pocketless",
    description:
      "A coworker in your calls. Silent until you say Pocketless. Remembers people and promises.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16A34A",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
