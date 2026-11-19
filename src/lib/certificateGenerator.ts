import jsPDF from "jspdf";
import { readWorkbookRows } from "./shieldConverter";
import JSZip from "jszip";

/** Escudos de uma habilidade: 1 a 5, ou "z" para zero (escudos apagados). */
export type Shield = number | "z";

export interface CertificateData {
  name: string;
  b: Shield; // Reading/Writing
  c: Shield; // Listening
  d: Shield; // Speaking
}

export interface OverlaySettings {
  position: { x: number; y: number };
  size: number;
  width: number;
}

/** Largura da prévia em pixels; as posições do nome e dos escudos usam essa escala. */
export const PREVIEW_WIDTH = 420;
export const PREVIEW_HEIGHT = 595;

/** Lê um valor de escudos da planilha no formato antigo. Em branco, 0, "z" ou "Z" = zero. */
export const parseShield = (value: unknown): Shield | null => {
  if (value === undefined || value === null) return "z";
  const text = String(value).trim();
  if (text === "" || text === "0" || text.toLowerCase() === "z") return "z";
  const n = Number(text);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
};

export interface ShieldFileError {
  row: number;
  column: string;
  value: unknown;
}

/** Planilha de escudos no formato antigo: A = nome, B/C/D = escudos (0–5 ou z). */
export const parseExcelFile = async (
  file: File,
): Promise<{ certificates: CertificateData[]; errors: ShieldFileError[] }> => {
  const { rows, firstRow } = await readWorkbookRows(file);

  const certificates: CertificateData[] = [];
  const errors: ShieldFileError[] = [];

  rows.slice(1).forEach((row, index) => {
    const name = String(row[0] ?? "").trim();
    if (!name) return;
    const cols = ["B", "C", "D"] as const;
    const parsed = cols.map((col, i) => {
      const shield = parseShield(row[i + 1]);
      if (shield === null) errors.push({ row: firstRow + 1 + index, column: col, value: row[i + 1] });
      return shield;
    });
    if (parsed.every((s) => s !== null)) {
      certificates.push({ name, b: parsed[0]!, c: parsed[1]!, d: parsed[2]! });
    }
  });

  return { certificates, errors };
};

/** Caminhos das imagens de escudos de um aluno (B, C e D). */
export const getOverlayPaths = (cert: CertificateData): string[] => [
  `/overlays/B-${cert.b}.png`,
  `/overlays/C-${cert.c}.png`,
  `/overlays/D-${cert.d}.png`,
];

// eslint-disable-next-line no-control-regex -- caracteres de controle também são inválidos em nomes de arquivo
const INVALID_FILENAME_CHARS = /[\\/:*?"<>|\u0000-\u001f]/g;

/** Limpa um trecho de nome de arquivo e troca espaços por "_". */
export const filenamePart = (text: string): string =>
  text.replace(INVALID_FILENAME_CHARS, "").trim().replace(/\s+/g, "_");

/** Ex.: turma 121, "Ana Silva", Starters, 2026 → "121_Ana_Silva_Starters_2026.pdf" */
export const certificateFileName = (turma: string, name: string, examLabel: string, year: string | number) =>
  [turma, name, examLabel, String(year)].map(filenamePart).filter(Boolean).join("_");

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Não foi possível carregar a imagem ${src}`));
    img.src = src;
  });

/**
 * Desenha um certificado num canvas. Usado tanto na prévia quanto no PDF:
 * `width` define a resolução e tudo é escalado a partir da prévia (420 px).
 * Ordem: fundo branco → fundo do certificado → escudos → nome.
 */
export const drawCertificate = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  images: { base: HTMLImageElement; overlays: HTMLImageElement[] },
  name: string,
  textPosition: { x: number; y: number },
  fontSize: number,
  overlaySettings: OverlaySettings,
) => {
  const scale = width / PREVIEW_WIDTH;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(images.base, 0, 0, width, height);
  for (const img of images.overlays) {
    ctx.drawImage(
      img,
      overlaySettings.position.x * scale,
      overlaySettings.position.y * scale,
      overlaySettings.width * scale,
      overlaySettings.size * scale,
    );
  }
  ctx.font = `${fontSize * scale}px Helvetica, Arial, sans-serif`;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.fillText(name, textPosition.x * scale, textPosition.y * scale);
};

// A5 a 600 DPI (mesma qualidade das imagens originais)
const PDF_WIDTH = 3496;
const PDF_HEIGHT = 4961;
const A5_MM = { width: 148, height: 210 };

/**
 * A página é desenhada em duas faixas (metade de cima e metade de baixo) em vez de um
 * canvas só: 3496 × 4961 px passa do limite de canvas do Safari no iPad/iPhone
 * (16,7 milhões de pixels). As faixas se sobrepõem em 2 px para não aparecer emenda.
 */
const OVERLAP = 2;
const TILES = [
  { y: 0, height: Math.ceil(PDF_HEIGHT / 2) + OVERLAP },
  { y: Math.ceil(PDF_HEIGHT / 2) - OVERLAP, height: PDF_HEIGHT - (Math.ceil(PDF_HEIGHT / 2) - OVERLAP) },
];

export const generateAllPDFsAsZip = async (
  certificates: CertificateData[],
  baseImage: string,
  textPosition: { x: number; y: number },
  fontSize: number,
  overlaySettings: OverlaySettings,
  fileNameFor: (cert: CertificateData) => string,
  resolveAsset: (path: string) => string = (path) => path,
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> => {
  const zip = new JSZip();
  const base = await loadImage(baseImage);
  const overlayCache = new Map<string, Promise<HTMLImageElement>>();
  const overlay = (src: string) => {
    if (!overlayCache.has(src)) overlayCache.set(src, loadImage(src));
    return overlayCache.get(src)!;
  };

  const canvas = document.createElement("canvas");
  canvas.width = PDF_WIDTH;
  canvas.height = TILES[0].height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Could not get canvas context");

  const usedNames = new Map<string, number>();

  for (const [i, cert] of certificates.entries()) {
    const overlays = await Promise.all(getOverlayPaths(cert).map((p) => overlay(resolveAsset(p))));
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5", compress: true });

    for (const tile of TILES) {
      canvas.height = tile.height; // também limpa o canvas
      ctx.setTransform(1, 0, 0, 1, 0, -tile.y);
      drawCertificate(ctx, PDF_WIDTH, PDF_HEIGHT, { base, overlays }, cert.name, textPosition, fontSize, overlaySettings);
      const mmPerPx = A5_MM.height / PDF_HEIGHT;
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        tile.y * mmPerPx,
        A5_MM.width,
        tile.height * mmPerPx,
        undefined,
        "FAST",
      );
    }

    // Nomes repetidos ganham _2, _3…
    const baseName = fileNameFor(cert);
    const count = (usedNames.get(baseName.toLowerCase()) ?? 0) + 1;
    usedNames.set(baseName.toLowerCase(), count);
    zip.file(`${count > 1 ? `${baseName}_${count}` : baseName}.pdf`, pdf.output("blob"));

    onProgress?.(i + 1, certificates.length);
    // Deixa a tela atualizar entre um certificado e outro
    await new Promise((r) => setTimeout(r, 0));
  }

  return await zip.generateAsync({ type: "blob" });
};

export { loadImage };
