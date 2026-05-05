import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const PLANO_SCHEMA = {
  type: "object",
  properties: {
    resumo: { type: "string", description: "Resumo curto e amigável do que será estudado." },
    topicos: { type: "array", items: { type: "string" }, minItems: 1 },
    sessoes: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          titulo: { type: "string" },
          duracao_min: { type: "integer", minimum: 10, maximum: 60 },
          objetivos: { type: "array", items: { type: "string" }, minItems: 1 },
        },
        required: ["titulo", "duracao_min", "objetivos"],
      },
    },
    flashcards: {
      type: "array",
      minItems: 8,
      maxItems: 12,
      items: {
        type: "object",
        properties: {
          frente: { type: "string" },
          verso: { type: "string" },
        },
        required: ["frente", "verso"],
      },
    },
    exercicios: {
      type: "array",
      minItems: 4,
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          enunciado: { type: "string" },
          alternativas: { type: "array", items: { type: "string" } },
          resposta_correta: { type: "string" },
          explicacao: { type: "string" },
        },
        required: ["enunciado", "resposta_correta"],
      },
    },
  },
  required: ["resumo", "topicos", "sessoes", "flashcards", "exercicios"],
  additionalProperties: false,
} as const;

function blobToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function mimeFromPath(path: string, fallback = "image/jpeg"): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return fallback;
}

function validatePlano(p: unknown): asserts p is Record<string, unknown> {
  if (!p || typeof p !== "object") throw new Error("conteudo invalido: nao e objeto");
  const o = p as Record<string, unknown>;
  if (typeof o.resumo !== "string" || !o.resumo.trim()) throw new Error("resumo ausente");
  if (!Array.isArray(o.topicos) || o.topicos.length < 1) throw new Error("topicos invalidos");
  if (!Array.isArray(o.sessoes) || o.sessoes.length < 3 || o.sessoes.length > 6)
    throw new Error("sessoes deve ter entre 3 e 6 itens");
  if (!Array.isArray(o.flashcards) || o.flashcards.length < 8 || o.flashcards.length > 12)
    throw new Error("flashcards deve ter entre 8 e 12 itens");
  if (!Array.isArray(o.exercicios) || o.exercicios.length < 4 || o.exercicios.length > 8)
    throw new Error("exercicios deve ter entre 4 e 8 itens");
}

function withIds(plano: Record<string, unknown>) {
  const sessoes = (plano.sessoes as any[]).map((s) => ({
    id: s.id ?? crypto.randomUUID(),
    titulo: String(s.titulo),
    duracao_min: Number(s.duracao_min),
    objetivos: Array.isArray(s.objetivos) ? s.objetivos.map(String) : [],
    concluida: false,
  }));
  const flashcards = (plano.flashcards as any[]).map((f) => ({
    id: f.id ?? crypto.randomUUID(),
    frente: String(f.frente),
    verso: String(f.verso),
  }));
  const exercicios = (plano.exercicios as any[]).map((e) => ({
    id: e.id ?? crypto.randomUUID(),
    enunciado: String(e.enunciado),
    alternativas: Array.isArray(e.alternativas) ? e.alternativas.map(String) : undefined,
    resposta_correta: String(e.resposta_correta),
    explicacao: e.explicacao ? String(e.explicacao) : undefined,
  }));
  return {
    resumo: String(plano.resumo),
    topicos: (plano.topicos as any[]).map(String),
    sessoes,
    flashcards,
    exercicios,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let plano_id = "";

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.plano_id !== "string" || !Array.isArray(body.paths) || body.paths.length === 0) {
      return new Response(JSON.stringify({ error: "plano_id e paths sao obrigatorios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    plano_id = body.plano_id;
    const paths: string[] = body.paths;
    const observacoes: string = body.observacoes ?? "";

    console.log("[gerar-plano] inicio", { plano_id, paths: paths.length });

    // 1. Buscar plano
    const { data: plano, error: ePlano } = await supabase
      .from("planos")
      .select("disciplina, data_prova, filho_id")
      .eq("id", plano_id)
      .single();
    if (ePlano || !plano) throw new Error(`plano nao encontrado: ${ePlano?.message}`);

    // 2. Buscar filho
    const { data: filho, error: eFilho } = await supabase
      .from("filhos")
      .select("nome, ano_escolar")
      .eq("id", plano.filho_id)
      .single();
    if (eFilho || !filho) throw new Error(`filho nao encontrado: ${eFilho?.message}`);

    // 3. Baixar imagens
    const imagens: { dataUrl: string }[] = [];
    for (const p of paths) {
      const { data: blob, error: eDl } = await supabase.storage
        .from("materiais-prova")
        .download(p);
      if (eDl || !blob) throw new Error(`falha download ${p}: ${eDl?.message}`);
      const buf = await blob.arrayBuffer();
      const mime = blob.type && blob.type.startsWith("image/") ? blob.type : mimeFromPath(p);
      imagens.push({ dataUrl: `data:${mime};base64,${blobToBase64(buf)}` });
    }
    console.log("[gerar-plano] imagens baixadas", imagens.length);

    // 4. Chamar Lovable AI Gateway com tool calling
    const systemPrompt = `Voce e a Ju, uma tutora carinhosa e didatica especializada em criancas do Ensino Fundamental brasileiro. Voce monta planos de estudo curtos, claros e divertidos, adaptados a idade da crianca.`;

    const userText = `Crie um plano de estudos para a prova abaixo, com base nas fotos do material enviadas.

Aluno: ${filho.nome} (${filho.ano_escolar})
Disciplina: ${plano.disciplina}
Data da prova: ${plano.data_prova}
${observacoes ? `Observacoes do responsavel: ${observacoes}` : ""}

Regras:
- Linguagem adequada a idade do aluno.
- Sessoes de 15 a 45 minutos, com objetivos concretos.
- Flashcards curtos (frente=pergunta, verso=resposta direta).
- Exercicios com enunciado claro e resposta correta; inclua alternativas quando fizer sentido.

Use a funcao "salvar_plano" para devolver o resultado estruturado.`;

    const aiBody = {
      model: "google/gemini-2.0-flash-exp",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            ...imagens.map((i) => ({ type: "image_url", image_url: { url: i.dataUrl } })),
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "salvar_plano",
            description: "Salva o plano de estudos estruturado.",
            parameters: PLANO_SCHEMA,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "salvar_plano" } },
    };

    let aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiBody),
    });

    // Fallback se modelo nao disponivel
    if (aiResp.status === 400 || aiResp.status === 404) {
      const txt = await aiResp.text();
      console.warn("[gerar-plano] modelo principal falhou, tentando fallback", aiResp.status, txt);
      aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...aiBody, model: "google/gemini-2.5-flash" }),
      });
    }

    if (aiResp.status === 429) throw new Error("Limite de requisicoes atingido. Tente novamente em alguns minutos.");
    if (aiResp.status === 402) throw new Error("Creditos de IA esgotados. Adicione creditos em Settings > Workspace > Usage.");
    if (!aiResp.ok) {
      const t = await aiResp.text();
      throw new Error(`AI gateway erro ${aiResp.status}: ${t}`);
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("IA nao retornou tool call");

    const parsed = JSON.parse(toolCall.function.arguments);
    validatePlano(parsed);
    const conteudo = withIds(parsed);

    // 5. Atualizar plano
    const { error: eUp } = await supabase
      .from("planos")
      .update({ status: "ativo", conteudo_json: conteudo })
      .eq("id", plano_id);
    if (eUp) throw new Error(`falha ao atualizar plano: ${eUp.message}`);

    console.log("[gerar-plano] sucesso", plano_id);
    return new Response(JSON.stringify({ success: true, plano_id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[gerar-plano] erro", msg);
    if (plano_id) {
      await supabase.from("planos").update({ status: "erro" }).eq("id", plano_id);
    }
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});