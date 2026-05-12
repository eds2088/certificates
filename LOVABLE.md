# Estudito — notas do projeto

## v3.2.0-aula-completa (atual)

Cada sessão agora tem estrutura de aula completa com 5 blocos:

- Abertura metacognitiva (pergunta da Ju ativa conhecimento prévio)
- Conteúdo de ensino estruturado (introducao + 2-4 conceitos)
- 2 worked examples (resolução passo a passo, revelação animada)
- Exercícios calibrados (mantido da v3.1: quantidades rígidas + ordem
  modelo→guiado→livre + interleavado no último)
- Fechamento metacognitivo (pergunta da Ju para auto-avaliação)

Suporte a línguas estrangeiras com formato bilíngue: títulos
"Idioma (português)", conceitos com termo bilíngue, flashcards
mistos 60% PT→idioma / 40% idioma→PT, validação cruzada.

Infraestrutura SVG pronta (tabela `ilustracoes` + bucket Storage
público `ilustracoes`), mas sem população. Por enquanto a IA sempre
retorna `ilustracao_id: null` e o frontend cai em
`<PlaceholderIlustracao />` (caixa cinza com `descricao_visual`
em itálico abaixo).

Progresso intermediário da sessão (qual seção a criança está,
respostas opcionais de abertura/fechamento) salvo em `localStorage`
por `plano_id+sessao_id`.

## Roadmap próximo

### v3.3 (mês 1-2): popular biblioteca de ilustrações

- Decidir caminho (gratuito + IA, ilustrador profissional, ou híbrido)
- Popular tabela `ilustracoes` com ~150-300 SVGs iniciais
- IA passa a fazer tool_call para buscar SVGs por tags
- Substituir placeholder cinza por SVG real quando
  `ilustracao_id != null`

### v4.0 (mês 4-6): modo papel

- PDF impresso de cada sessão com layout pedagógico
- Quadradinhos 8mm para múltipla escolha
- Conteúdo de ensino + worked examples impressos
- Dissertativos permanecem só no app

### v4.5 (mês 7-9): OCR

- Pai fotografa folha respondida
- IA lê marcações de quadradinhos
- Painel parental atualiza automaticamente

NÃO IMPLEMENTAR AGORA. Apenas anotado para visibilidade.
