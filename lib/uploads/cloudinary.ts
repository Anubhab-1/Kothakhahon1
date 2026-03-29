import { createHash } from "node:crypto";
import { env } from "@/lib/env";

const CLOUDINARY_UPLOAD_LIMIT_BYTES = 8 * 1024 * 1024;
const CLOUDINARY_API_BASE = "https://api.cloudinary.com/v1_1";

function normalizeFolder(folder?: string) {
  const normalized = (folder ?? "uploads")
    .trim()
    .replace(/[^a-zA-Z0-9/_-]+/g, "-")
    .replace(/\/{2,}/g, "/")
    .replace(/^\/+|\/+$/g, "");

  return normalized ? `kothakhahon/${normalized}` : "kothakhahon/uploads";
}

function createCloudinarySignature(params: Record<string, string | number>) {
  const apiSecret = env.CLOUDINARY_API_SECRET;
  if (!apiSecret) {
    throw new Error("Cloudinary is not configured.");
  }

  const serialized = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
}

function readCloudinaryError(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "Cloudinary upload failed.";
  }

  const error = (payload as { error?: { message?: string } }).error;
  if (error?.message) {
    return error.message;
  }

  return "Cloudinary upload failed.";
}

export function isCloudinaryConfigured() {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
  );
}

export interface UploadedCloudinaryImage {
  publicId: string;
  secureUrl: string;
  width: number | null;
  height: number | null;
  format: string | null;
}

export async function uploadImageToCloudinary({
  file,
  folder,
}: {
  file: File;
  folder?: string;
}): Promise<UploadedCloudinaryImage> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported.");
  }

  if (file.size > CLOUDINARY_UPLOAD_LIMIT_BYTES) {
    throw new Error("Image is too large. Keep uploads under 8 MB.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const uploadFolder = normalizeFolder(folder);
  const signature = createCloudinarySignature({
    folder: uploadFolder,
    timestamp,
  });

  const formData = new FormData();
  formData.set("file", file);
  formData.set("api_key", env.CLOUDINARY_API_KEY!);
  formData.set("folder", uploadFolder);
  formData.set("timestamp", String(timestamp));
  formData.set("signature", signature);

  const response = await fetch(
    `${CLOUDINARY_API_BASE}/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
      cache: "no-store",
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | {
        secure_url?: string;
        public_id?: string;
        width?: number;
        height?: number;
        format?: string;
      }
    | null;

  if (!response.ok) {
    throw new Error(readCloudinaryError(payload));
  }

  if (!payload?.secure_url || !payload.public_id) {
    throw new Error("Cloudinary upload finished without a valid file URL.");
  }

  return {
    publicId: payload.public_id,
    secureUrl: payload.secure_url,
    width: typeof payload.width === "number" ? payload.width : null,
    height: typeof payload.height === "number" ? payload.height : null,
    format: payload.format ?? null,
  };
}
