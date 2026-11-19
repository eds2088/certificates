export type ExamType = "STARTERS" | "MOVERS" | "FLYERS";

export interface ExamConfig {
  /** Nome usado na tela e no nome do arquivo (ex.: "Starters"). */
  label: string;
  /** Nota máxima de Reading/Writing. */
  readingWriting: number;
  /** Nota máxima de Listening. */
  listening: number;
  /** Fundo do certificado (em public/). */
  background: string;
}

/** Speaking já vem em escudos (0 a 5) em todas as provas. */
export const MAX_SHIELDS = 5;

export const EXAMS: Record<ExamType, ExamConfig> = {
  STARTERS: { label: "Starters", readingWriting: 25, listening: 20, background: "/base.png" },
  MOVERS: { label: "Movers", readingWriting: 35, listening: 25, background: "/basemovers.jpg" },
  FLYERS: { label: "Flyers", readingWriting: 50, listening: 25, background: "/baseflyers.jpg" },
};

export const EXAM_TYPES = Object.keys(EXAMS) as ExamType[];

/**
 * Converte uma nota em escudos (0 a 5) dividindo a nota máxima em 5 faixas iguais.
 * Ex.: máximo 25 → 1–5 = 1, 6–10 = 2, …, 21–25 = 5. Zero continua zero.
 */
export const scoreToShields = (score: number, max: number): number =>
  score <= 0 ? 0 : Math.ceil((score * MAX_SHIELDS) / max);

/** Faixas de cada escudo, para mostrar a regra na tela (ex.: ["1–5", "6–10", …]). */
export const shieldRanges = (max: number): string[] =>
  Array.from({ length: MAX_SHIELDS }, (_, i) => {
    const from = Math.floor((i * max) / MAX_SHIELDS) + 1;
    const to = Math.floor(((i + 1) * max) / MAX_SHIELDS);
    return from === to ? `${from}` : `${from}–${to}`;
  });
