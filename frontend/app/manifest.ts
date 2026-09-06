import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Adamos Inventory",
    short_name: "AFE Inventory",
    description: "Mobile inventory and sales monitoring for Adamos Fresh Eggs.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f4f6f1",
    theme_color: "#173b24",
    icons: [
      {
        src: "/adamos-fresh-eggs-logo.jpg",
        sizes: "480x480",
        type: "image/jpeg",
        purpose: "any",
      },
    ],
  };
}
