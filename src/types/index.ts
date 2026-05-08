export type TipoUsuario = "responsavel" | "aluno";

export interface Profile {
  id: string;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  criado_em: string;
}

export interface Filho {
  id: string;
  responsavel_id: string;
  nome: string;
  ano_escolar: AnoEscolar;
  escola: string | null;
  data_nascimento: string | null;
  criado_em: string;
}

export type AnoEscolar =
  | "1_EF" | "2_EF" | "3_EF" | "4_EF" | "5_EF" | "6_EF"
  | "olimpiadas";

export const ANOS_ESCOLARES: { value: AnoEscolar; label: string; emoji?: string }[] = [
  { value: "1_EF", label: "1º ano (EF)" },
  { value: "2_EF", label: "2º ano (EF)" },
  { value: "3_EF", label: "3º ano (EF)" },
  { value: "4_EF", label: "4º ano (EF)" },
  { value: "5_EF", label: "5º ano (EF)" },
  { value: "6_EF", label: "6º ano (EF)" },
  { value: "olimpiadas", label: "Olimpíadas", emoji: "🏆" },
];

export type StatusPlano = "gerando" | "ativo" | "concluido" | "erro";

export interface Plano {
  id: string;
  filho_id: string;
  disciplina: string;
  data_prova: string;
  status: StatusPlano;
  conteudo_json: PlanoConteudo | null;
  criado_em: string;
  erro_mensagem?: string | null;
  prompt_version?: string | null;
}

export interface PlanoConteudo {
  resumo: string;
  topicos: string[];
  sessoes: SessaoEstudo[];
  flashcards: Flashcard[];
  exercicios: Exercicio[];
  erro?: boolean;
  codigo?: string;
}

export interface SessaoEstudo {
  id: string;
  titulo: string;
  duracao_min: number;
  objetivos: string[];
  concluida: boolean;
}

export interface Flashcard {
  id: string;
  frente: string;
  verso: string;
}

export interface Exercicio {
  id: string;
  enunciado: string;
  alternativas?: string[];
  resposta_correta: string;
  explicacao?: string;
  tipo?: "modelo" | "guiado" | "livre";
}
