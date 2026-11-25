import * as XLSX from "xlsx";
import type { CertificateData, Shield } from "./certificateGenerator";
import { EXAMS, ExamType, MAX_SHIELDS, scoreToShields } from "./exams";

/** Nota lida da planilha; `null` = célula em branco (aluno faltou). */
export type RawScore = number | string | null;

export interface RawScoreData {
  /** Número da linha na planilha (1 = cabeçalho). */
  row: number;
  name: string;
  readingWriting: RawScore;
  listening: RawScore;
  speaking: RawScore;
}

export interface ValidationError {
  row: number;
  column: string;
  value: unknown;
  message: string;
}

/** Aluno com alguma nota em branco: entra com zero escudos naquela habilidade. */
export interface BlankScoreRow {
  row: number;
  name: string;
  fields: string[];
}

const COLUMNS = [
  { key: "readingWriting", label: "Reading/Writing (Coluna B)" },
  { key: "listening", label: "Listening (Coluna C)" },
  { key: "speaking", label: "Speaking (Coluna D)" },
] as const;

const isBlank = (value: unknown) =>
  value === undefined || value === null || (typeof value === "string" && value.trim() === "");

/**
 * Lê uma nota: em branco, 0, "z" ou "Z" valem 0.
 * Aceita números escritos como texto (" 12 "). Devolve NaN para o que não for número.
 */
export const parseScore = (value: RawScore | undefined): number => {
  if (isBlank(value)) return 0;
  if (typeof value === "number") return value;
  const text = String(value).trim();
  if (text.toLowerCase() === "z") return 0;
  return /^-?\d+([.,]\d+)?$/.test(text) ? Number(text.replace(",", ".")) : NaN;
};

const toShield = (count: number): Shield => (count === 0 ? "z" : count);

// Valida e converte notas brutas em escudos
export const convertScoresToShields = (
  rawData: RawScoreData[],
  examType: ExamType,
): {
  shields: CertificateData[];
  errors: ValidationError[];
} => {
  const exam = EXAMS[examType];
  const limits = {
    readingWriting: exam.readingWriting,
    listening: exam.listening,
    speaking: MAX_SHIELDS, // Speaking já vem em escudos
  };

  const shields: CertificateData[] = [];
  const errors: ValidationError[] = [];

  for (const row of rawData) {
    const scores: Partial<Record<(typeof COLUMNS)[number]["key"], number>> = {};
    let valid = true;

    for (const { key, label } of COLUMNS) {
      const score = parseScore(row[key]);
      if (!Number.isInteger(score) || score < 0 || score > limits[key]) {
        errors.push({
          row: row.row,
          column: label,
          value: row[key],
          message:
            key === "speaking"
              ? `Speaking deve ser o número de escudos: inteiro de 0 a ${limits.speaking} (ou z)`
              : `Valor deve ser um número inteiro entre 0 e ${limits[key]} (ou z / em branco)`,
        });
        valid = false;
        continue;
      }
      scores[key] = score;
    }

    if (!valid) continue;

    shields.push({
      name: row.name,
      b: toShield(scoreToShields(scores.readingWriting!, limits.readingWriting)),
      c: toShield(scoreToShields(scores.listening!, limits.listening)),
      d: toShield(scores.speaking!),
    });
  }

  return { shields, errors };
};

/** Formatos aceitos: Excel (.xlsx), Excel com macros (.xlsm) e Excel 97-2003 (.xls). */
export const SPREADSHEET_ACCEPT = ".xlsx,.xlsm,.xls";
export const SPREADSHEET_FORMATS_TEXT = ".xlsx, .xlsm ou .xls";
export const isSpreadsheetFileName = (name: string) => /\.(xlsx|xlsm|xls)$/i.test(name);

/**
 * Lê a primeira aba. `firstRow` é o número (1, 2, …) da linha da planilha que virou rows[0]:
 * o xlsx começa a leitura na primeira linha usada, que nem sempre é a linha 1.
 */
export const readWorkbookRows = async (file: File): Promise<{ rows: unknown[][]; firstRow: number }> => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const notASpreadsheet = new Error(
    "este arquivo não é uma planilha Excel de verdade. Talvez seja uma página da web salva com esse nome. " +
      "Abra o arquivo no Excel e salve de novo (.xlsx, .xlsm ou .xls), ou baixe o arquivo original outra vez.",
  );

  // .xlsx e .xlsm são ZIP e começam com "PK"; o .xls do Excel começa com D0 CF 11 E0.
  // Um .xls também pode ser uma tabela exportada por outro sistema (HTML/XML): o leitor
  // tenta abrir. Um .xlsx/.xlsm que não começa com "PK" costuma ser uma página da web
  // salva com esse nome (ex.: "Salvar link como" no GitHub).
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  const isOle = bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  const isXls = /\.xls$/i.test(file.name);
  if (!isZip && !isOle && !isXls) throw notASpreadsheet;

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(bytes, { type: "array" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/password|encrypt/i.test(message)) {
      throw new Error(
        "a planilha está protegida por senha. Abra no Excel, tire a senha e salve de novo antes de enviar.",
      );
    }
    throw notASpreadsheet;
  }
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const ref = firstSheet?.["!ref"];
  const firstRow = ref ? XLSX.utils.decode_range(ref).s.r + 1 : 1;
  const rows = firstSheet
    ? (XLSX.utils.sheet_to_json(firstSheet, { header: 1, blankrows: true, defval: null }) as unknown[][])
    : [];
  // Linhas vazias antes do cabeçalho não contam: o cabeçalho é a primeira linha preenchida
  const isEmptyRow = (row: unknown[]) => row.every((v) => isBlank(v));
  let skip = 0;
  while (skip < rows.length && isEmptyRow(rows[skip])) skip++;
  return { rows: rows.slice(skip), firstRow: firstRow + skip };
};

// Lê planilha de notas brutas
export const parseScoresFile = async (
  file: File,
): Promise<{
  data: RawScoreData[];
  errors: ValidationError[];
  blanks: BlankScoreRow[];
}> => {
  const errors: ValidationError[] = [];
  const blanks: BlankScoreRow[] = [];

  let rows: unknown[][];
  let firstRow: number;
  try {
    ({ rows, firstRow } = await readWorkbookRows(file));
  } catch (error) {
    errors.push({
      row: 0,
      column: "Arquivo",
      value: null,
      message: `Erro ao ler arquivo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    });
    return { data: [], errors, blanks };
  }

  if (rows.length < 2) {
    errors.push({ row: 0, column: "Arquivo", value: null, message: "O arquivo está vazio ou não contém dados" });
    return { data: [], errors, blanks };
  }

  const data: RawScoreData[] = [];

  rows.slice(1).forEach((row, index) => {
    const rowNumber = firstRow + 1 + index; // a primeira linha lida é o cabeçalho
    const name = String(row[0] ?? "").trim();
    const values = [row[1], row[2], row[3]] as RawScore[];

    if (!name) {
      // Linha sem nome mas com notas: provavelmente esqueceram o nome
      if (values.some((v) => !isBlank(v))) {
        errors.push({ row: rowNumber, column: "Nome (Coluna A)", value: null, message: "Linha com notas mas sem nome" });
      }
      return;
    }

    const blankFields = COLUMNS.filter((_, i) => isBlank(values[i])).map((c) => c.label.split(" (")[0]);
    if (blankFields.length > 0) blanks.push({ row: rowNumber, name, fields: blankFields });

    data.push({
      row: rowNumber,
      name,
      readingWriting: values[0] ?? null,
      listening: values[1] ?? null,
      speaking: values[2] ?? null,
    });
  });

  if (data.length === 0 && errors.length === 0) {
    errors.push({ row: 0, column: "Arquivo", value: null, message: "Nenhum aluno encontrado na planilha" });
  }

  return { data, errors, blanks };
};

// Gera planilha Excel com escudos
export const generateShieldsExcel = (shields: CertificateData[]): Blob => {
  const wsData = [["Nome", "Reading/Writing", "Listening", "Speaking"], ...shields.map((s) => [s.name, s.b, s.c, s.d])];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Escudos");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};
