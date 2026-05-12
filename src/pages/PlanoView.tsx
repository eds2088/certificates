import { useEffect, useMemo, useState } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
const Route = getRouteApi("/_app/plano/$id");
import {
  ArrowLeft, Loader2, Calendar, CheckCircle2, AlertCircle, Shuffle,
  ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MascotJu } from "@/components/MascotJu";
import { PlaceholderIlustracao } from "@/components/PlaceholderIlustracao";
import { supabase } from "@/integrations/supabase/client";
import { diasAte, cn } from "@/lib/utils";
import type {
  Plano, SessaoEstudo, Exercicio, ExercicioDificuldade, ExercicioTipo, WorkedExample,
} from "@/types";

const TIPO_LABEL: Record<ExercicioTipo, string> = {
  modelo: "Modelo", guiado: "Guiado", livre: "Livre",
};
const TIPO_CLASS: Record<ExercicioTipo, string> = {
  modelo: "bg-emerald-100 text-emerald-800 border-emerald-200",
  guiado: "bg-amber-100 text-amber-800 border-amber-200",
  livre: "bg-violet-100 text-violet-800 border-violet-200",
};
const DIFICULDADE_NIVEL: Record<ExercicioDificuldade, number> = {
  muito_facil: 1, facil: 2, medio: 3, dificil: 4, muito_dificil: 5,
};

const SECTION_TITLES = [
  "Vamos começar?",
  "Vamos aprender",
  "Vamos pensar juntos",
  "Vamos praticar",
  "Pra fechar",
];

// ---------- progresso intermediário (localStorage) ----------
type ProgressoSessao = { secao: number; aberturaResp?: string; fechamentoResp?: string };
function progressoKey(planoId: string, sessaoId: string) {
  return `estudito:progresso:${planoId}:${sessaoId}`;
}
function loadProgresso(planoId: string, sessaoId: string): ProgressoSessao {
  try {
    const raw = localStorage.getItem(progressoKey(planoId, sessaoId));
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return { secao: 0 };
}
function saveProgresso(planoId: string, sessaoId: string, p: ProgressoSessao) {
  try { localStorage.setItem(progressoKey(planoId, sessaoId), JSON.stringify(p)); } catch { /* noop */ }
}

// ---------- exercício card ----------
function ExercicioCard({ ex, idx }: { ex: Exercicio; idx: number }) {
  const nivel = DIFICULDADE_NIVEL[ex.dificuldade] ?? 3;
  const isModelo = ex.tipo === "modelo";
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-display font-semibold">Questão {idx + 1}</p>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {ex.tipo && (
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", TIPO_CLASS[ex.tipo])}>
                {TIPO_LABEL[ex.tipo]}
              </span>
            )}
            <span className="flex items-center gap-0.5" aria-label={`Dificuldade: ${ex.dificuldade}`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i < nivel ? "bg-primary" : "bg-muted")} />
              ))}
            </span>
            {ex.interleavado && (
              <Badge variant="accent" className="gap-1 text-[10px]">
                <Shuffle size={10} /> Mistura tópicos!
              </Badge>
            )}
          </div>
        </div>
        <p className={cn(
          "mt-2 rounded-lg p-3 text-sm leading-relaxed",
          isModelo ? "bg-[hsl(var(--ju-soft))] border border-[hsl(var(--ju-soft))]" : "",
        )}>
          {ex.enunciado}
        </p>
        {ex.descricao_visual && (
          <div className="mt-3 flex justify-center">
            <PlaceholderIlustracao descricao_visual={ex.descricao_visual} size="sm" />
          </div>
        )}
        {ex.alternativas && ex.alternativas.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-sm">
            {ex.alternativas.map((alt, i) => (
              <li key={i} className="rounded-lg border bg-secondary/40 px-3 py-2">
                {String.fromCharCode(97 + i)}) {alt}
              </li>
            ))}
          </ul>
        )}
        <details className="group mt-3">
          <summary className="cursor-pointer text-sm font-medium text-primary">Ver gabarito</summary>
          <div className="mt-2 rounded-lg border bg-[hsl(var(--ju-soft))] p-3 text-sm">
            <p className="font-semibold">Resposta: {ex.resposta_correta}</p>
            {ex.explicacao && <p className="mt-1 text-muted-foreground">{ex.explicacao}</p>}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

// ---------- worked example interativo ----------
function WorkedExampleCard({ we }: { we: WorkedExample }) {
  const [revealed, setRevealed] = useState(0); // quantidade de passos revelados
  const total = we.resolucao_passo_a_passo.length;
  const allRevealed = revealed >= total;

  function reveal() {
    if (revealed === 0) {
      // revela passo 1 imediatamente, depois agenda os próximos
      setRevealed(1);
      let i = 1;
      const id = setInterval(() => {
        i++;
        setRevealed(i);
        if (i >= total) clearInterval(id);
      }, 1500);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <p className="text-sm leading-relaxed">{we.enunciado}</p>
        {we.descricao_visual && (
          <div className="flex justify-center">
            <PlaceholderIlustracao descricao_visual={we.descricao_visual} size="md" />
          </div>
        )}

        {revealed === 0 ? (
          <Button onClick={reveal} className="w-full" size="lg">
            <Sparkles size={16} /> Ver como resolver
          </Button>
        ) : (
          <ol className="space-y-2">
            {we.resolucao_passo_a_passo.slice(0, revealed).map((p, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border bg-[hsl(var(--ju-soft))] p-3 text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                <span className="font-display font-bold text-primary">{i + 1}.</span>
                <span>{p}</span>
              </li>
            ))}
          </ol>
        )}

        {allRevealed && (
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Resposta</p>
            <p className="mt-1 font-display font-semibold text-emerald-900">{we.resposta_final}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- seção colapsável ----------
function Secao({
  idx, titulo, atual, concluida, children, onConcluir,
}: {
  idx: number; titulo: string; atual: boolean; concluida: boolean;
  children: React.ReactNode; onConcluir?: () => void;
}) {
  const [aberta, setAberta] = useState(true);
  useEffect(() => { setAberta(atual || !concluida); }, [atual, concluida]);

  const headerColor = concluida ? "bg-emerald-50 border-emerald-200" : atual ? "bg-primary/5 border-primary/30" : "bg-card";

  return (
    <section className={cn("rounded-2xl border", headerColor)}>
      <button
        type="button"
        onClick={() => setAberta((a) => !a)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            concluida ? "bg-emerald-500 text-white" : atual ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}>
            {concluida ? <CheckCircle2 size={16} /> : idx + 1}
          </span>
          <div>
            <p className="font-display font-semibold">{titulo}</p>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Etapa {idx + 1} de 5</p>
          </div>
        </div>
        {aberta ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {aberta && (
        <div className="space-y-4 border-t p-4">
          {children}
          {atual && !concluida && onConcluir && (
            <div className="flex justify-end pt-2">
              <Button onClick={onConcluir} size="lg">Continuar</Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ---------- view de uma sessão (aula completa) ----------
function SessaoView({
  plano, sessao, idxSessao, totalSessoes, onVoltar, onConcluida,
}: {
  plano: Plano; sessao: SessaoEstudo; idxSessao: number; totalSessoes: number;
  onVoltar: () => void; onConcluida: () => Promise<void>;
}) {
  const inicial = useMemo(() => loadProgresso(plano.id, sessao.id), [plano.id, sessao.id]);
  const [secao, setSecao] = useState<number>(sessao.concluida ? 5 : inicial.secao);
  const [aberturaResp, setAberturaResp] = useState(inicial.aberturaResp ?? "");
  const [fechamentoResp, setFechamentoResp] = useState(inicial.fechamentoResp ?? "");
  const [celebrando, setCelebrando] = useState(false);

  useEffect(() => {
    saveProgresso(plano.id, sessao.id, { secao, aberturaResp, fechamentoResp });
  }, [plano.id, sessao.id, secao, aberturaResp, fechamentoResp]);

  const exercicios = plano.conteudo_json?.exercicios ?? [];
  const mc = exercicios.filter((e) => e.formato !== "dissertativo");
  const diss = exercicios.filter((e) => e.formato === "dissertativo");

  const progressoPct = (Math.min(secao, 5) / 5) * 100;

  async function fechar() {
    setCelebrando(true);
    await new Promise((r) => setTimeout(r, 900));
    await onConcluida();
  }

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-10 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onVoltar} className="-ml-2">
            <ArrowLeft size={16} /> Voltar ao plano
          </Button>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
            {plano.disciplina}
          </Badge>
        </div>
        <h1 className="mt-2 font-display text-xl font-bold leading-snug">{sessao.titulo}</h1>
        <p className="text-xs text-muted-foreground">
          Sessão {idxSessao + 1} de {totalSessoes} • {sessao.duracao_min} min de estudo
        </p>
        <div className="mt-2">
          <Progress value={progressoPct} className="h-1.5" />
          <p className="mt-1 text-[11px] text-muted-foreground">{Math.min(secao, 5)}/5 etapas</p>
        </div>
      </div>

      {/* Seção 1 — abertura */}
      <Secao
        idx={0} titulo={SECTION_TITLES[0]}
        atual={secao === 0} concluida={secao > 0}
        onConcluir={() => setSecao(1)}
      >
        <div className="flex gap-3">
          <MascotJu size={56} pose="study" />
          <p className="flex-1 rounded-xl bg-[hsl(var(--ju-soft))] p-3 text-sm leading-relaxed">
            {sessao.abertura_metacognitiva}
          </p>
        </div>
        <textarea
          rows={3}
          value={aberturaResp}
          onChange={(e) => setAberturaResp(e.target.value)}
          placeholder="Pode escrever aqui o que vier à cabeça (opcional)…"
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Secao>

      {/* Seção 2 — conteúdo de ensino */}
      <Secao
        idx={1} titulo={SECTION_TITLES[1]}
        atual={secao === 1} concluida={secao > 1}
        onConcluir={() => setSecao(2)}
      >
        <Card>
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed">{sessao.conteudo_ensino.introducao}</p>
          </CardContent>
        </Card>
        <div className="grid gap-3 md:grid-cols-2">
          {sessao.conteudo_ensino.conceitos.map((c, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-4">
                <h3 className="font-display font-semibold">{c.nome}</h3>
                <PlaceholderIlustracao descricao_visual={c.descricao_visual} size="md" className="my-1" />
                <p className="text-sm leading-relaxed text-muted-foreground">{c.explicacao}</p>
                <div className="rounded-lg border bg-secondary/50 p-3 text-sm italic">
                  {c.exemplo}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Secao>

      {/* Seção 3 — worked examples */}
      <Secao
        idx={2} titulo={SECTION_TITLES[2]}
        atual={secao === 2} concluida={secao > 2}
        onConcluir={() => setSecao(3)}
      >
        <div className="space-y-3">
          {sessao.worked_examples.map((we) => <WorkedExampleCard key={we.id} we={we} />)}
        </div>
      </Secao>

      {/* Seção 4 — exercícios */}
      <Secao
        idx={3} titulo={SECTION_TITLES[3]}
        atual={secao === 3} concluida={secao > 3}
        onConcluir={() => setSecao(4)}
      >
        {mc.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Múltipla escolha</Badge>
              <span className="text-xs text-muted-foreground">{mc.length} {mc.length === 1 ? "questão" : "questões"}</span>
            </div>
            <div className="space-y-3">
              {mc.map((ex, i) => <ExercicioCard key={ex.id} ex={ex as Exercicio} idx={i} />)}
            </div>
          </div>
        )}
        {diss.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100">Responda com suas palavras</Badge>
              <span className="text-xs text-muted-foreground">{diss.length} {diss.length === 1 ? "questão" : "questões"}</span>
            </div>
            <div className="space-y-3">
              {diss.map((ex, i) => <ExercicioCard key={ex.id} ex={ex as Exercicio} idx={mc.length + i} />)}
            </div>
          </div>
        )}
      </Secao>

      {/* Seção 5 — fechamento */}
      <Secao
        idx={4} titulo={SECTION_TITLES[4]}
        atual={secao === 4} concluida={secao >= 5}
      >
        <div className="flex gap-3">
          <MascotJu size={56} pose="study" />
          <p className="flex-1 rounded-xl bg-[hsl(var(--ju-soft))] p-3 text-sm leading-relaxed">
            {sessao.fechamento_metacognitivo}
          </p>
        </div>
        <textarea
          rows={3}
          value={fechamentoResp}
          onChange={(e) => setFechamentoResp(e.target.value)}
          placeholder="Pode escrever aqui o que vem à cabeça (opcional)…"
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          onClick={() => { setSecao(5); fechar(); }}
          size="lg" className="w-full"
          disabled={secao >= 5}
        >
          Concluir sessão
        </Button>
      </Secao>

      {celebrando && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/90 backdrop-blur animate-in fade-in">
          <div className="animate-float"><MascotJu size={140} pose="study" /></div>
          <p className="font-display text-2xl font-bold">Sessão concluída!</p>
          <p className="text-sm text-muted-foreground">Mandou bem.</p>
        </div>
      )}
    </div>
  );
}

// ---------- página principal ----------
export default function PlanoView() {
  const { id } = Route.useParams();
  const [plano, setPlano] = useState<Plano | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessaoAbertaId, setSessaoAbertaId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let sub: { unsubscribe: () => void } | null = null;
    async function load() {
      if (!id) { setLoading(false); return; }
      const { data } = await supabase.from("planos").select("*").eq("id", id).single();
      if (cancelled) return;
      setPlano(data as Plano);
      setLoading(false);
      const channel = supabase.channel(`plano-${id}`);
      channel.on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "planos", filter: `id=eq.${id}` },
        (payload) => setPlano(payload.new as Plano),
      );
      channel.subscribe();
      sub = channel;
    }
    load();
    return () => { cancelled = true; sub?.unsubscribe(); };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }
  if (!plano) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Plano não encontrado.</p>
        <Button asChild className="mt-4"><Link to="/dashboard">Voltar</Link></Button>
      </div>
    );
  }

  if (plano.status === "gerando") {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="mx-auto animate-float"><MascotJu size={140} pose="study" /></div>
          <h1 className="mt-4 font-display text-2xl font-bold">Estou estudando o material…</h1>
          <p className="mt-2 text-muted-foreground">Isso costuma levar até 1 minuto.</p>
          <div className="mx-auto mt-6 max-w-xs"><Progress value={45} className="h-2" /></div>
        </CardContent>
      </Card>
    );
  }
  if (plano.status === "erro") {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <AlertCircle size={48} className="mx-auto text-destructive" />
          <h1 className="mt-4 font-display text-2xl font-bold">Algo deu errado</h1>
          <p className="mt-2 text-muted-foreground">
            {plano.erro_mensagem ||
              "Não conseguimos analisar o material. Verifique se as fotos estão legíveis e tente de novo."}
          </p>
          <Button asChild className="mt-6"><Link to="/novo-plano">Tentar novamente</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const conteudo = plano.conteudo_json;
  const dias = diasAte(plano.data_prova);
  const sessoes = conteudo?.sessoes ?? [];
  const sessoesConcluidas = sessoes.filter((s) => s.concluida).length;
  const totalSessoes = sessoes.length;
  const progresso = totalSessoes > 0 ? (sessoesConcluidas / totalSessoes) * 100 : 0;
  const sessaoAberta = sessoes.find((s) => s.id === sessaoAbertaId) ?? null;
  const idxAberta = sessaoAberta ? sessoes.findIndex((s) => s.id === sessaoAberta.id) : -1;

  async function marcarSessaoConcluida(sessaoId: string) {
    if (!plano || !conteudo) return;
    const updated = conteudo.sessoes.map((s) => s.id === sessaoId ? { ...s, concluida: true } : s);
    const novo = { ...conteudo, sessoes: updated };
    setPlano({ ...plano, conteudo_json: novo });
    await supabase.from("planos").update({ conteudo_json: novo as any }).eq("id", plano.id);
    setSessaoAbertaId(null);
  }

  if (sessaoAberta) {
    return (
      <SessaoView
        plano={plano}
        sessao={sessaoAberta}
        idxSessao={idxAberta}
        totalSessoes={totalSessoes}
        onVoltar={() => setSessaoAbertaId(null)}
        onConcluida={() => marcarSessaoConcluida(sessaoAberta.id)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/dashboard"><ArrowLeft size={16} /> Voltar</Link>
      </Button>

      <header>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{plano.disciplina}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar size={14} />
              {new Date(plano.data_prova).toLocaleDateString("pt-BR", {
                weekday: "long", day: "2-digit", month: "long",
              })}
            </div>
          </div>
          <Badge variant={dias <= 2 ? "accent" : "secondary"} className="shrink-0">
            {dias <= 0 ? "Hoje" : dias === 1 ? "Amanhã" : `em ${dias} dias`}
          </Badge>
        </div>

        <div className="mt-4 rounded-2xl border bg-card p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Progresso</span>
            <span className="text-muted-foreground">{sessoesConcluidas} / {totalSessoes} sessões</span>
          </div>
          <Progress value={progresso} />
        </div>
      </header>

      {conteudo?.resumo && (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-relaxed text-muted-foreground">{conteudo.resumo}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold">Sessões</h2>
        {sessoes.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSessaoAbertaId(s.id)}
            className={cn(
              "block w-full rounded-2xl border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm",
              s.concluida && "opacity-70",
            )}
          >
            <div className="flex items-start gap-3">
              <span className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                s.concluida ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary",
              )}>
                {s.concluida ? <CheckCircle2 size={18} /> : idx + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="font-display font-semibold">{s.titulo}</p>
                  <Badge variant="secondary" className="text-[10px]">{s.duracao_min} min</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Aula completa • abertura, conteúdo, exemplos, exercícios, fechamento
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
