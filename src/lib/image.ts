// Browser-only image helpers: shrink photos before upload so posting is fast on mobile data.

type ResizeOptions = {
  /** Longest side in pixels. */
  max: number;
  /** Crop to a centred square (used for the profile picture). */
  square?: boolean;
  quality?: number;
};

/**
 * Returns a JPEG no larger than `max` on its longest side. GIFs that don't need
 * cropping are returned unchanged so animations keep working.
 */
export async function resizeImage(file: File, { max, square = false, quality = 0.86 }: ResizeOptions): Promise<Blob> {
  if (file.type === "image/gif" && !square) return file;

  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = square ? (bitmap.width - side) / 2 : 0;
    const sy = square ? (bitmap.height - side) / 2 : 0;
    const sw = square ? side : bitmap.width;
    const sh = square ? side : bitmap.height;
    const scale = Math.min(1, max / Math.max(sw, sh));
    const width = Math.round(sw * scale);
    const height = Math.round(sh * scale);

    // Already small enough and no crop needed: keep the original file.
    if (!square && scale === 1 && file.type === "image/jpeg") return file;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff"; // JPEG has no transparency
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;
    return !square && blob.size >= file.size ? file : blob;
  } finally {
    bitmap.close();
  }
}

/** First image file in a drop or paste, if any. */
export function imageFromTransfer(data: DataTransfer | null): File | null {
  if (!data) return null;
  for (const file of Array.from(data.files)) {
    if (file.type.startsWith("image/")) return file;
  }
  return null;
}
