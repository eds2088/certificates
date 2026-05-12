# Estudito — notas do projeto

## Roadmap futuro — Modo papel híbrido (v4.0 e v4.5)

O Estudito vai oferecer dois canais de resposta:

- Modo digital (atual): tudo no app.
- Modo papel impresso (v4.0+): pai imprime PDF formatado da sessão,
  criança responde no papel. Exercícios de múltipla escolha são
  marcados pintando quadradinhos pretos. Exercícios dissertativos
  permanecem no app.

### V4.0 (mês 4-6): geração de PDF da sessão

- Endpoint `POST /api/gerar-pdf-sessao` recebe `sessao_id`, retorna PDF.
- Layout A4 com cabeçalho Estudito, Ju, tópicos, worked examples,
  exercícios de múltipla escolha com quadradinhos 8mm.
- Flashcards impressos em grade recortável no verso ou em folha
  separada.

### V4.5 (mês 7-9): OCR de quadradinhos

- Endpoint `POST /api/processar-foto-sessao` recebe foto de folha
  respondida, retorna alternativas marcadas + correção contra
  gabarito interno.
- IA reconhece quadradinhos pintados (não letra cursiva — risco
  técnico).
- Painel parental atualiza automaticamente como se respondido no app.

NÃO IMPLEMENTAR AGORA. Apenas anotado para visibilidade.