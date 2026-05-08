import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Image, decode as decodeImage } from "https://deno.land/x/imagescript@1.2.17/mod.ts";
import { SYSTEM_PROMPT, buildUserPrompt, AI_CONFIG, PROMPT_VERSION } from "./prompts/index.ts";

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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

const MAX_SIDE = 1280;
const TARGET_KB = 400;
const HARD_LIMIT_KB = 600;

async function compressImage(
  raw: Uint8Array,
  mime: string,
  path: string,
): Promise<{ dataUrl: string; sizeKb: number }> {
  // PDFs e formatos não-imagem: passa direto (gemini aceita pdf via image_url? não — então só repassa imagem)
  if (!mime.startsWith("image/")) {
    const sizeKb = Math.round(raw.byteLength / 1024);
    return {
      dataUrl: `data:${mime};base64,${bytesToBase64(raw)}`,
      sizeKb,
    };
  }
  let img;
  try {
    img = await decodeImage(raw);
  } catch (e) {
    throw new Error(`falha decode ${path}: ${(e as Error).message}`);
  }
  // Resize se necessário
  const maxSide = Math.max(img.width, img.height);
  if (maxSide > MAX_SIDE) {
    const scale = MAX_SIDE / maxSide;
    img.resize(Math.round(img.width * scale), Math.round(img.height * scale));
  }
  // Encoda JPEG quality 65
  let encoded = await (img as Image).encodeJPEG(65);
  let sizeKb = Math.round(encoded.byteLength / 1024);
  // Se ainda passar do hard limit, tenta re-encode quality 50
  if (sizeKb > HARD_LIMIT_KB) {
    encoded = await (img as Image).encodeJPEG(50);
    sizeKb = Math.round(encoded.byteLength / 1024);
  }
  if (sizeKb > HARD_LIMIT_KB) {
    const err: any = new Error("imagem_muito_pesada");
    err.codigo = "imagem_muito_pesada";
    err.mensagem = "Uma das fotos está muito grande. Tente reenviar com resolução menor.";
    throw err;
  }
  return {
    dataUrl: `data:image/jpeg;base64,${bytesToBase64(encoded)}`,
    sizeKb,
  };
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
    tipo: e.tipo === "modelo" || e.tipo === "guiado" || e.tipo === "livre" ? e.tipo : undefined,
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

    console.log("[gerar-plano] inicio", { plano_id, paths_count: paths.length });

    if (paths.length > 5) {
      throw new Error("Máximo de 5 imagens por plano.");
    }

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

    // 3. Baixar imagens em paralelo
    const downloads = await Promise.all(
      paths.map(async (p) => {
        const { data: blob, error: eDl } = await supabase.storage
          .from("materiais-prova")
          .download(p);
        if (eDl || !blob) throw new Error(`falha download ${p}: ${eDl?.message}`);
        const buf = new Uint8Array(await blob.arrayBuffer());
        const mime = blob.type && blob.type.startsWith("image/") ? blob.type : mimeFromPath(p);
        return { path: p, raw: buf, mime };
      }),
    );
    const totalBytesRaw = downloads.reduce((s, d) => s + d.raw.byteLength, 0);
    console.log("[gerar-plano] imagens baixadas", {
      count: downloads.length,
      total_bytes_raw: totalBytesRaw,
    });

    // 3b. Comprimir em paralelo
    const compressStart = Date.now();
    let imagens: { dataUrl: string; sizeKb: number }[];
    try {
      imagens = await Promise.all(
        downloads.map((d) => compressImage(d.raw, d.mime, d.path)),
      );
    } catch (e: any) {
      if (e?.codigo === "imagem_muito_pesada") {
        await supabase
          .from("planos")
          .update({
            status: "erro",
            erro_codigo: e.codigo,
            erro_mensagem: e.mensagem,
            prompt_version: PROMPT_VERSION,
            imagens_count: paths.length,
          })
          .eq("id", plano_id);
        return new Response(
          JSON.stringify({ success: false, plano_id, codigo: e.codigo, mensagem: e.mensagem }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw e;
    }
    const compressionMs = Date.now() - compressStart;
    const totalBytesAfter = imagens.reduce((s, i) => s + Math.round(i.sizeKb * 1024), 0);
    console.log("[gerar-plano] imagens comprimidas", {
      count: imagens.length,
      total_bytes_after: totalBytesAfter,
      individual_sizes_kb: imagens.map((i) => i.sizeKb),
      compression_ms: compressionMs,
    });

    // 4. Chamar Lovable AI Gateway usando prompt v3
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

    // Fallback uma única vez se 4xx
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

    // Limpa eventual cerca markdown
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

    // 4b. Fallback estruturado da IA
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

    validatePlano(parsed);
    const conteudo = withIds(parsed);

    // 5. Atualizar plano
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
      })
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
      await supabase
        .from("planos")
        .update({ status: "erro", erro_mensagem: msg, prompt_version: PROMPT_VERSION })
        .eq("id", plano_id);
    }
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});