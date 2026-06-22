export function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

console.log(slugify("শুধু তোমারই জন্য !@# 123"));
console.log(slugify("Hello World!"));
