import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import {
  isCloudinaryConfigured,
  uploadImageToCloudinary,
} from "@/lib/uploads/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
