import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import {
  isCloudinaryConfigured,
  uploadImageToCloudinary,
} from "@/lib/uploads/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function parseFolder(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value.trim() : "uploads";
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary is not configured yet." },
      { status: 503 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required." }, { status: 400 });
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `File type "${file.type}" is not allowed. Upload a JPEG, PNG, WebP, GIF, or AVIF image.` },
      { status: 415 },
    );
  }

  // Validate file size before sending to Cloudinary
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 10 MB.` },
      { status: 413 },
    );
  }

  try {
    const uploadedImage = await uploadImageToCloudinary({
      file,
      folder: parseFolder(formData.get("folder")),
    });

    return NextResponse.json(uploadedImage, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Image upload failed.",
      },
      { status: 400 },
    );
  }
}
