// Edge Function: gerar-plano
// v3.0.2 — A compressão/redimensionamento de imagens foi MOVIDA PARA O CLIENTE
// (src/lib/imageCompression.ts). O runtime da Edge Function não tem CPU/memória
// suficiente para processar fotos cruas de smartphone. Aqui só baixamos do
// Storage (já otimizadas), convertemos para base64 e mandamos para a IA.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SYSTEM_PROMPT, buildUserPrompt, AI_CONFIG, PROMPT_VERSION } from "./prompts/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function bytesToBase64(bytes: Uint8Array): string {
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
  if (ext === "pdf") return "application/pdf";
  return fallback;
}

type FaixaIdade = "1-2" | "3-4" | "5-6";

const QUANTIDADES_ESPERADAS: Record<FaixaIdade, {
  flashcards: number; exercicios_total: number; exercicios_mc: number;
  exercicios_diss: number; duracao_min: number;
}> = {
  "1-2": { flashcards: 8, exercicios_total: 5, exercicios_mc: 5, exercicios_diss: 0, duracao_min: 15 },
  "3-4": { flashcards: 10, exercicios_total: 7, exercicios_mc: 5, exercicios_diss: 2, duracao_min: 20 },
  "5-6": { flashcards: 12, exercicios_total: 8, exercicios_mc: 5, exercicios_diss: 3, duracao_min: 30 },
};

function faixaFromAno(ano: string): FaixaIdade | null {
  if (ano === "1_EF" || ano === "2_EF") return "1-2";
  if (ano === "3_EF" || ano === "4_EF") return "3-4";
  if (ano === "5_EF" || ano === "6_EF") return "5-6";
  return null;
}

class QuantidadesInvalidasError extends Error {
  detalhes: Record<string, unknown>;
  constructor(detalhes: Record<string, unknown>) {
    super("Tive uma dificuldade técnica ao montar este plano. Pode tentar novamente?");
    this.name = "QuantidadesInvalidasError";
    this.detalhes = detalhes;
  }
}

function validatePlano(p: unknown, faixa: FaixaIdade | null): asserts p is Record<string, unknown> {
  if (!p || typeof p !== "object") throw new Error("conteudo invalido: nao e objeto");
  const o = p as Record<string, unknown>;
  // Erros fatais: estrutura/tipos/vazio
  if (typeof o.resumo !== "string" || o.resumo.trim().length < 20)
    throw new Error("resumo ausente ou muito curto (<20 chars)");
  if (!Array.isArray(o.topicos) || o.topicos.length < 1) throw new Error("topicos ausentes ou invalidos");
  if (!Array.isArray(o.sessoes) || o.sessoes.length < 1) throw new Error("sessoes ausentes ou invalidas");
  if (!Array.isArray(o.flashcards) || o.flashcards.length < 1) throw new Error("flashcards ausentes ou invalidos");
  if (!Array.isArray(o.exercicios) || o.exercicios.length < 1) throw new Error("exercicios ausentes ou invalidos");

  if (!faixa) {
    console.warn("[gerar-plano] faixa de idade desconhecida — pulando validacao de quantidades");
    return;
  }

  const esperado = QUANTIDADES_ESPERADAS[faixa];
  const flashcards = o.flashcards as unknown[];
  const exercicios = o.exercicios as Array<Record<string, unknown>>;
  const sessoes = o.sessoes as Array<Record<string, unknown>>;
  const mcCount = exercicios.filter((e) => e.formato === "multipla_escolha").length;
  const dissCount = exercicios.filter((e) => e.formato === "dissertativo").length;
  const duracoes = sessoes.map((s) => Number(s.duracao_min));
  const duracoesInvalidas = duracoes.filter((d) => d !== esperado.duracao_min);

  const problemas: string[] = [];
  if (flashcards.length !== esperado.flashcards)
    problemas.push(`flashcards=${flashcards.length} (esperado ${esperado.flashcards})`);
  if (exercicios.length !== esperado.exercicios_total)
    problemas.push(`exercicios=${exercicios.length} (esperado ${esperado.exercicios_total})`);
  if (mcCount !== esperado.exercicios_mc)
    problemas.push(`MC=${mcCount} (esperado ${esperado.exercicios_mc})`);
  if (dissCount !== esperado.exercicios_diss)
    problemas.push(`dissertativos=${dissCount} (esperado ${esperado.exercicios_diss})`);
  if (duracoesInvalidas.length > 0)
    problemas.push(`duracoes_invalidas=${JSON.stringify(duracoes)} (esperado ${esperado.duracao_min} em todas)`);

  if (problemas.length > 0) {
    throw new QuantidadesInvalidasError({
      faixa,
      esperado,
      recebido: {
        flashcards: flashcards.length,
        exercicios_total: exercicios.length,
        exercicios_mc: mcCount,
        exercicios_diss: dissCount,
        duracoes,
      },
      problemas,
    });
  }
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
  const exercicios = (plano.exercicios as any[]).map((e) => {
    const formato = e.formato === "dissertativo" ? "dissertativo" : "multipla_escolha";
    return {
      id: e.id ?? crypto.randomUUID(),
      enunciado: String(e.enunciado),
      alternativas: Array.isArray(e.alternativas) ? e.alternativas.map(String) : null,
      resposta_correta: String(e.resposta_correta),
      explicacao: e.explicacao ? String(e.explicacao) : "",
      tipo: e.tipo === "modelo" || e.tipo === "guiado" || e.tipo === "livre" ? e.tipo : "livre",
      formato,
      formato_papel_compativel:
        typeof e.formato_papel_compativel === "boolean"
          ? e.formato_papel_compativel
          : formato === "multipla_escolha",
      dificuldade: ["muito_facil", "facil", "medio", "dificil", "muito_dificil"].includes(e.dificuldade)
        ? e.dificuldade
        : "medio",
      interleavado: e.interleavado === true,
    };
  });
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

    console.log("[gerar-plano] inicio", { plano_id, paths_count: paths.length });

    if (paths.length > 5) {
      throw new Error("Máximo de 5 imagens por plano.");
    }

    // 1. Buscar plano + filho
    const { data: plano, error: ePlano } = await supabase
      .from("planos")
      .select("disciplina, data_prova, filho_id")
      .eq("id", plano_id)
      .single();
    if (ePlano || !plano) throw new Error(`plano nao encontrado: ${ePlano?.message}`);

    const { data: filho, error: eFilho } = await supabase
      .from("filhos")
      .select("nome, ano_escolar")
      .eq("id", plano.filho_id)
      .single();
    if (eFilho || !filho) throw new Error(`filho nao encontrado: ${eFilho?.message}`);

    // 2. Baixar imagens (já comprimidas pelo cliente) em paralelo e converter pra base64
    const imagens = await Promise.all(
      paths.map(async (p) => {
        const { data: blob, error: eDl } = await supabase.storage
          .from("materiais-prova")
          .download(p);
        if (eDl || !blob) throw new Error(`falha download ${p}: ${eDl?.message}`);
        const buf = new Uint8Array(await blob.arrayBuffer());
        const mime = blob.type && blob.type.startsWith("image/") ? blob.type : mimeFromPath(p);
        return {
          dataUrl: `data:${mime};base64,${bytesToBase64(buf)}`,
          sizeKb: Math.round(buf.byteLength / 1024),
        };
      }),
    );
    const totalKb = imagens.reduce((s, i) => s + i.sizeKb, 0);
    console.log("[gerar-plano] imagens baixadas", {
      count: imagens.length,
      individual_sizes_kb: imagens.map((i) => i.sizeKb),
      total_kb: totalKb,
    });

    // 3. Montar payload IA
    const diasAteProva = Math.max(
      0,
      Math.ceil((new Date(plano.data_prova).getTime() - Date.now()) / 86400000),
    );
    const userText = buildUserPrompt({
      filho_nome: filho.nome,
      ano_escolar: filho.ano_escolar,
      disciplina: plano.disciplina,
      data_prova: plano.data_prova,
      dias_ate_prova: diasAteProva,
      observacoes_pais: observacoes || undefined,
    });

    const aiBody = {
      model: AI_CONFIG.model,
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.max_tokens,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            ...imagens.map((i) => ({ type: "image_url", image_url: { url: i.dataUrl } })),
          ],
        },
      ],
      response_format: { type: "json_object" as const },
    };

    const payloadKb = Math.round(JSON.stringify(aiBody).length / 1024);
    let modelUsed = AI_CONFIG.model;
    console.log("[gerar-plano] chamando IA", { model: modelUsed, payload_kb: payloadKb });

    const aiStart = Date.now();
    let aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiBody),
    });

    // 4. Fallback uma única vez se 4xx (modelo indisponível)
    if (aiResp.status >= 400 && aiResp.status < 500 && aiResp.status !== 429 && aiResp.status !== 402) {
      const txt = await aiResp.text();
      console.warn("[gerar-plano] modelo principal falhou, tentando fallback", {
        status: aiResp.status,
        body_first_200: txt.slice(0, 200),
      });
      modelUsed = (AI_CONFIG as any).model_fallback ?? "google/gemini-2.5-flash-lite";
      aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...aiBody, model: modelUsed }),
      });
    }
    const latencyMs = Date.now() - aiStart;

    if (aiResp.status === 429) throw new Error("Limite de requisicoes atingido. Tente novamente em alguns minutos.");
    if (aiResp.status === 402) throw new Error("Creditos de IA esgotados. Adicione creditos em Settings > Workspace > Usage.");
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("[gerar-plano] IA erro", { status: aiResp.status, body_first_500: t.slice(0, 500) });
      throw new Error(`AI gateway erro ${aiResp.status}: ${t.slice(0, 200)}`);
    }

    const aiJson = await aiResp.json();
    const rawContent = aiJson.choices?.[0]?.message?.content;
    console.log("[gerar-plano] IA respondeu", {
      status: aiResp.status,
      latency_ms: latencyMs,
      model: modelUsed,
      response_first_200_chars: typeof rawContent === "string" ? rawContent.slice(0, 200) : null,
    });
    if (typeof rawContent !== "string" || !rawContent.trim()) {
      throw new Error("IA nao retornou conteudo");
    }

    // 5. Parse + validação
    const cleaned = rawContent.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("[gerar-plano] parse JSON falhou", {
        erro: (e as Error).message,
        raw_first_500: rawContent.slice(0, 500),
      });
      throw new Error(`JSON invalido da IA: ${(e as Error).message}`);
    }

    // 5b. Fallback estruturado da IA
    if (parsed && parsed.erro === true) {
      const codigo = String(parsed.codigo ?? "desconhecido");
      const mensagem = String(parsed.mensagem ?? "Nao foi possivel gerar o plano.");
      console.warn("[gerar-plano] IA retornou erro estruturado", { plano_id, codigo, mensagem });
      await supabase
        .from("planos")
        .update({
          status: "erro",
          erro_codigo: codigo,
          erro_mensagem: mensagem,
          prompt_version: PROMPT_VERSION,
          latency_ms: latencyMs,
          imagens_count: imagens.length,
          payload_kb: payloadKb,
        })
        .eq("id", plano_id);
      return new Response(
        JSON.stringify({ success: false, plano_id, codigo, mensagem }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const faixa = faixaFromAno(filho.ano_escolar);
    validatePlano(parsed, faixa);
    const conteudo = withIds(parsed);

    // 6. Atualizar plano
    const { error: eUp } = await supabase
      .from("planos")
      .update({
        status: "ativo",
        conteudo_json: conteudo,
        erro_codigo: null,
        erro_mensagem: null,
        prompt_version: PROMPT_VERSION,
        latency_ms: latencyMs,
        imagens_count: imagens.length,
        payload_kb: payloadKb,
        flashcards_count: conteudo.flashcards.length,
        exercicios_count: conteudo.exercicios.length,
        sessoes_count: conteudo.sessoes.length,
      })
      .eq("id", plano_id);
    if (eUp) throw new Error(`falha ao atualizar plano: ${eUp.message}`);

    console.log("[gerar-plano] sucesso", { plano_id, latency_ms: latencyMs });
    return new Response(JSON.stringify({ success: true, plano_id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const isQty = err instanceof QuantidadesInvalidasError;
    const msg = err instanceof Error ? err.message : String(err);
    const codigo = isQty ? "quantidades_invalidas" : "erro_interno";
    if (isQty) {
      console.error("[gerar-plano] quantidades_invalidas", (err as QuantidadesInvalidasError).detalhes);
    } else {
      console.error("[gerar-plano] erro", msg);
    }
    if (plano_id) {
      await supabase
        .from("planos")
        .update({
          status: "erro",
          erro_codigo: codigo,
          erro_mensagem: msg,
          prompt_version: PROMPT_VERSION,
        })
        .eq("id", plano_id);
    }
    return new Response(JSON.stringify({ success: false, error: msg, codigo }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});