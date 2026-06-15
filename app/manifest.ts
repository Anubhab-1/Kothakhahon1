import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kothakhahon Prokashoni",
    short_name: "Kothakhahon",
    description:
      "An independent Bengali publishing house for literary fiction, essays, and enduring contemporary voices.",
    start_url: "/",
    display: "standalone",
    background_color: "#18140f",
    theme_color: "#dbb56f",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
