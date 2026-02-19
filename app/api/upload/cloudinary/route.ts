import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

type UploadKind = "image" | "video";

function validateUpload(file: File, uploadKind: UploadKind): string | null {
  if (uploadKind === "image") {
    if (!file.type.startsWith("image/")) {
      return "Please upload a valid image file.";
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return "Image size must be 8MB or less.";
    }

    return null;
  }

  if (!file.type.startsWith("video/")) {
    return "Please upload a valid video file.";
  }

  if (file.size > MAX_VIDEO_BYTES) {
    return "Video size must be 40MB or less.";
  }

  return null;
}

async function uploadBufferToCloudinary(
  file: File,
  uploadKind: UploadKind,
  restaurantId: string,
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const safeBaseName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

  const publicId = `donations/${restaurantId}/${Date.now()}-${safeBaseName}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "foodbridge",
        resource_type: uploadKind,
        public_id: publicId,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }

        resolve(result.secure_url);
      },
    );

    stream.end(buffer);
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const uploadKindRaw = formData.get("uploadKind");
    const restaurantIdRaw = formData.get("restaurantId");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No file received." }, { status: 400 });
    }

    if (uploadKindRaw !== "image" && uploadKindRaw !== "video") {
      return NextResponse.json({ message: "Invalid upload kind." }, { status: 400 });
    }

    if (typeof restaurantIdRaw !== "string" || !restaurantIdRaw.trim()) {
      return NextResponse.json({ message: "Missing restaurant ID." }, { status: 400 });
    }

    const validationError = validateUpload(file, uploadKindRaw);

    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const secureUrl = await uploadBufferToCloudinary(
      file,
      uploadKindRaw,
      restaurantIdRaw.trim(),
    );

    return NextResponse.json({ secureUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
