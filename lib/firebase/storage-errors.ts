const uploadErrorHints: Array<{ needle: string; message: string }> = [
  {
    needle: "Image size must be 8MB or less",
    message: "Image file is too large. Please upload an image under 8MB.",
  },
  {
    needle: "Video size must be 40MB or less",
    message: "Video file is too large. Please upload a video under 40MB.",
  },
  {
    needle: "Cloudinary environment variables are not configured",
    message: "Cloudinary is not configured on server. Check CLOUDINARY_* variables.",
  },
  {
    needle: "Invalid upload kind",
    message: "Upload request is invalid. Please retry.",
  },
];

export function getFirebaseStorageErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const matchedHint = uploadErrorHints.find((hint) =>
      error.message.includes(hint.needle),
    );

    if (matchedHint) {
      return matchedHint.message;
    }

    return error.message;
  }

  return "Media upload failed. Please try again.";
}
