// Helpers para a sugestão "Criar plano de revisão" (Painel Família → NovoPlano).
// Converte slugs técnicos vindos de insights_filho.topicos_revisao em texto
// legível em português, e monta a string final pré-preenchida no textarea
// de observações.

const LABELS_CONHECIDOS: Record<string, string> = {
  preposicoes_on_in: "preposições (on, in)",
  preposicoes_at_in_on: "preposições (at, in, on)",
  vocabulario_roupas: "vocabulário de roupas",
  vocabulario_familia: "vocabulário de família",
  vocabulario_comidas: "vocabulário de comidas",
  vocabulario_cores: "vocabulário de cores",
  verbo_to_be: "verbo to be",
  presente_simples: "presente simples",
  passado_simples: "passado simples",
  fracoes: "frações",
  multiplicacao: "multiplicação",
  divisao: "divisão",
  problemas_com_texto: "problemas com texto",
  interpretacao_texto: "interpretação de texto",
  ortografia: "ortografia",
  acentuacao: "acentuação",
};

/** Converte um slug `snake_case` em texto legível: "vocabulario_roupas" → "vocabulário de roupas" quando conhecido, senão "vocabulario roupas". */
export function slugParaTextoLegivel(slug: string): string {
  const limpo = slug.trim().toLowerCase();
  if (LABELS_CONHECIDOS[limpo]) return LABELS_CONHECIDOS[limpo];
  return limpo.replace(/_/g, " ");
}

/**
 * Monta o texto pré-preenchido a partir dos `topicos_revisao` do insight.
 * Formato: "Foco em: a, b, c. (Sugestão da Ju com base na análise das últimas sessões.)"
 */
export function montarObservacoesPreRevisao(topicos: string[]): string {
  const itens = topicos
    .filter((t) => typeof t === "string" && t.trim().length > 0)
    .map(slugParaTextoLegivel);
  if (itens.length === 0) return "";
  return `Foco em: ${itens.join(", ")}. (Sugestão da Ju com base na análise das últimas sessões.)`;
}

/** Constrói a URL para a tela de novo plano com o pré-preenchimento aplicado. */
export function linkNovoPlanoComRevisao(topicos: string[]): string {
  const texto = montarObservacoesPreRevisao(topicos);
  if (!texto) return "/novo-plano";
  return `/novo-plano?observacoes_pre=${encodeURIComponent(texto)}`;
}