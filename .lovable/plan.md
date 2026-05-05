## Edge Function `gerar-plano`

Cria a Edge Function que recebe fotos do material, chama o Lovable AI Gateway (Gemini com visão) e popula o `conteudo_json` do plano.

### 1. Arquivo: `supabase/functions/gerar-plano/index.ts`

Fluxo do handler (POST):

1. **CORS + parse** — responde a `OPTIONS`, faz `await req.json()` e valida `plano_id` (string) e `paths` (array não vazio). Retorna 400 em entrada inválida.
2. **Clientes Supabase** — usa `createClient` do `@supabase/supabase-js` com `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS para ler plano/filho e baixar do bucket privado).
3. **Buscar plano + filho** — `select disciplina, data_prova, filho_id` em `planos`; depois `select ano_escolar, nome` em `filhos`. Aborta com erro se não encontrar.
4. **Baixar imagens** — para cada `path`: `supabase.storage.from("materiais-prova").download(path)` → converte o `Blob` em base64 e em `data:<mime>;base64,...` (usa `blob.type` ou infere por extensão; default `image/jpeg`).
5. **Chamar Lovable AI Gateway** — `POST https://ai.gateway.lovable.dev/v1/chat/completions` com:
   - `Authorization: Bearer ${LOVABLE_API_KEY}`
   - modelo `google/gemini-2.0-flash-exp` (conforme pedido do usuário)
   - mensagem `system` com a persona "Ju" e instruções de saída JSON
   - mensagem `user` com array de `content`: um `text` (disciplina, ano escolar, data da prova, observações, esquema esperado de `PlanoConteudo`) + um `image_url` por foto
   - **tool calling** com schema JSON estrito para `PlanoConteudo` (resumo, topicos, sessoes 3–6, flashcards 8–12, exercicios 4–8) — força saída estruturada (mais confiável que pedir JSON em texto)
   - `tool_choice` forçando a função
6. **Tratar 429/402** — se a gateway responder 429 ou 402, marca `status='erro'` e devolve mensagem amigável.
7. **Validar conteúdo** — extrai `tool_calls[0].function.arguments`, faz `JSON.parse`, e valida com Zod inline (ou checks manuais):
   - `resumo: string` não vazio
   - `topicos: string[]` ≥ 1
   - `sessoes: 3..6` itens com `id, titulo, duracao_min, objetivos[], concluida=false`
   - `flashcards: 8..12` com `id, frente, verso`
   - `exercicios: 4..8` com `id, enunciado, resposta_correta` (alternativas/explicacao opcionais)
   - Gera `id`s com `crypto.randomUUID()` se vierem faltando.
8. **Atualizar plano**:
   - sucesso → `update planos set status='ativo', conteudo_json=<json>`
   - falha (qualquer throw acima) → `update planos set status='erro'` e responde 500
9. **Resposta** — `200 { success: true, plano_id }` ou `500 { success: false, error }`. Sempre com headers CORS.

### 2. `supabase/config.toml`

Adicionar bloco para a função (sem alterar `project_id`):

```toml
[functions.gerar-plano]
verify_jwt = false
```

(invocada via `supabase.functions.invoke` do cliente; deixar `verify_jwt=false` evita 401 quando a sessão ainda está sendo propagada — a função usa service role internamente e valida o `plano_id` recebido).

### 3. Sem alterações em outros arquivos

- `NovoPlano.tsx` já chama `supabase.functions.invoke("gerar-plano", { body: { plano_id, paths, observacoes } })` e já marca `status='erro'` se a invocação falhar — o contrato bate.
- `PlanoConteudo` em `src/types/index.ts` é usado apenas como referência (Edge Function é Deno, não importa o tipo TS — o schema é replicado no tool definition).

### Detalhes técnicos

- **Secrets**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY` já estão configurados no projeto (vistos em `<secrets>`).
- **Modelo**: usuário pediu `google/gemini-2.0-flash-exp`. Esse modelo não está na lista oficial atual da Lovable AI Gateway (que lista `google/gemini-2.5-flash`, `2.5-pro`, etc.). Vou usar exatamente o que foi pedido; se a gateway rejeitar, faço fallback para `google/gemini-2.5-flash` (também multimodal) e logo um aviso.
- **Storage download**: o bucket `materiais-prova` é privado — service role consegue baixar sem problema.
- **Tamanho de payload**: limitamos a 6 imagens (já forçado no frontend); se cada base64 ficar grande, o Worker aguenta — sem streaming necessário.
- **Logs**: `console.log/error` em pontos chave (plano carregado, nº de imagens baixadas, status da gateway, validação) para debug via `edge_function_logs`.

Pronto para implementar?