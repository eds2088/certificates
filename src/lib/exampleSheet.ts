import * as XLSX from "xlsx";

const FIRST_NAMES = [
  "Ana",
  "Bruno",
  "Carla",
  "Daniel",
  "Eduarda",
  "Felipe",
  "Gabriela",
  "Henrique",
  "Isabela",
  "João",
  "Larissa",
  "Mateus",
  "Natália",
  "Otávio",
  "Paula",
  "Rafael",
  "Sofia",
  "Thiago",
  "Valentina",
  "Lucas",
];
const LAST_NAMES = [
  "Silva",
  "Costa",
  "Souza",
  "Lima",
  "Rocha",
  "Alves",
  "Dias",
  "Melo",
  "Nunes",
  "Ramos",
  "Gomes",
  "Barros",
  "Pinto",
  "Castro",
  "Ferreira",
  "Martins",
  "Teixeira",
  "Oliveira",
  "Santos",
  "Pereira",
];

const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const shuffle = <T>(list: T[]) => {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** Escudos de 1 a 5. */
const randomShields = () => 1 + Math.floor(Math.random() * 5);

/**
 * Planilha de escudos de exemplo: 5 alunos com nomes e escudos sorteados.
 * Sempre traz um "z", um 0 e uma célula em branco (em alunos e habilidades sorteados),
 * para mostrar as três formas de indicar que o aluno ficou sem escudo naquela habilidade.
 */
export const generateExampleShieldsSheet = (): Blob => {
  const firstNames = shuffle(FIRST_NAMES).slice(0, 5);
  const rows: (string | number | null)[][] = firstNames.map((first) => [
    `${first} ${pick(LAST_NAMES)}`,
    randomShields(),
    randomShields(),
    randomShields(),
  ]);

  // Três células diferentes (aluno e coluna sorteados) recebem z, 0 e em branco
  const cells = shuffle(
    rows.flatMap((_, r) => [1, 2, 3].map((c) => [r, c] as const)),
  ).slice(0, 3);
  const zeroValues: (string | number | null)[] = ["z", 0, null];
  cells.forEach(([r, c], i) => {
    rows[r][c] = zeroValues[i];
  });

  const ws = XLSX.utils.aoa_to_sheet([
    ["Nome", "Reading/Writing", "Listening", "Speaking"],
    ...rows,
  ]);
  ws["!cols"] = [{ wch: 24 }, { wch: 16 }, { wch: 12 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Escudos");

  const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};
