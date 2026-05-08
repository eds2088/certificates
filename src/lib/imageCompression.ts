const MAX_SIDE = 1280;
const QUALITY = 0.7;
const HARD_LIMIT_BYTES = 800 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Comprime uma imagem no navegador via Canvas.
 * - Lado maior: 1280px
 * - JPEG quality 0.7
 * - Se resultado >800KB, devolve original.
 * - Se file não for imagem (ex: PDF), devolve sem mexer.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const img = await loadImage(file);
    const maxSide = Math.max(img.width, img.height);
    const scale = maxSide > MAX_SIDE ? MAX_SIDE / maxSide : 1;
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", QUALITY),
    );
    if (!blob) return file;

    if (blob.size > HARD_LIMIT_BYTES) {
      console.warn(
        `[compressImage] ${file.name} ainda grande após compressão (${Math.round(blob.size / 1024)}KB), usando original`,
      );
      return file;
    }

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
  } catch (e) {
    console.warn("[compressImage] falha, usando original", file.name, e);
    return file;
  }
}