export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
