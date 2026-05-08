import { useEffect, useState } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
const Route = getRouteApi("/_app/plano/$id");
import * as Tabs from "@radix-ui/react-tabs";
import {
  ArrowLeft, Loader2, BookOpen, Brain, FileText, Calendar,
  CheckCircle2, Circle, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MascotJu } from "@/components/MascotJu";
import { supabase } from "@/integrations/supabase/client";
import { diasAte } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Plano } from "@/types";

export default function PlanoView() {
  const { id } = Route.useParams();
  const [plano, setPlano] = useState<Plano | null>(null);
  const [loading, setLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("planos").select("*").eq("id", id).single();
      setPlano(data as Plano);
      setLoading(false);

      // Realtime: subscribe to status changes (Lovable can refine)
      const sub = supabase
        .channel(`plano-${id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "planos", filter: `id=eq.${id}` },
          (payload) => setPlano(payload.new as Plano)
        )
        .subscribe();
      return () => { sub.unsubscribe(); };
    }
    load();
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
        <Button asChild className="mt-4">
          <Link to="/dashboard">Voltar</Link>
        </Button>
      </div>
    );
  }

  // Loading state — Ju is preparing
  if (plano.status === "gerando") {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="mx-auto animate-float">
            <MascotJu size={140} pose="study" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">Estou estudando o material…</h1>
          <p className="mt-2 text-muted-foreground">Isso costuma levar 30 a 60 segundos.</p>
          <div className="mx-auto mt-6 max-w-xs">
            <Progress value={45} className="h-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
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
          <Button asChild className="mt-6">
            <Link to="/novo-plano">Tentar novamente</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const conteudo = plano.conteudo_json;
  const dias = diasAte(plano.data_prova);
  const sessoesConcluidas = conteudo?.sessoes.filter((s) => s.concluida).length ?? 0;
  const totalSessoes = conteudo?.sessoes.length ?? 0;
  const progresso = totalSessoes > 0 ? (sessoesConcluidas / totalSessoes) * 100 : 0;

  function toggleFlip(cardId: string) {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      next.has(cardId) ? next.delete(cardId) : next.add(cardId);
      return next;
    });
  }

  async function toggleSessao(sessaoId: string) {
    if (!plano || !conteudo) return;
    const updatedSessoes = conteudo.sessoes.map((s) =>
      s.id === sessaoId ? { ...s, concluida: !s.concluida } : s
    );
    const newConteudo = { ...conteudo, sessoes: updatedSessoes };
    setPlano({ ...plano, conteudo_json: newConteudo });
    await supabase.from("planos").update({ conteudo_json: newConteudo as any }).eq("id", plano.id);
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

      <Tabs.Root defaultValue="sessoes" className="w-full">
        <Tabs.List className="flex gap-2 overflow-x-auto rounded-2xl border bg-card p-1.5">
          {[
            { v: "sessoes", l: "Sessões", icon: BookOpen },
            { v: "flashcards", l: "Flashcards", icon: Brain },
            { v: "exercicios", l: "Exercícios", icon: FileText },
          ].map(({ v, l, icon: Icon }) => (
            <Tabs.Trigger
              key={v}
              value={v}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Icon size={16} /> {l}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Sessões */}
        <Tabs.Content value="sessoes" className="mt-5 space-y-3">
          {conteudo?.sessoes.map((s, idx) => (
            <Card key={s.id} className={cn(s.concluida && "opacity-70")}>
              <CardContent className="flex gap-4 p-4">
                <button
                  type="button"
                  onClick={() => toggleSessao(s.id)}
                  className="mt-0.5 shrink-0 text-primary"
                  aria-label={s.concluida ? "Desmarcar" : "Marcar como concluída"}
                >
                  {s.concluida ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                </button>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="font-display font-semibold">{idx + 1}. {s.titulo}</p>
                    <Badge variant="secondary" className="text-[10px]">{s.duracao_min} min</Badge>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {s.objetivos.map((obj, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary">•</span> {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </Tabs.Content>

        {/* Flashcards */}
        <Tabs.Content value="flashcards" className="mt-5 grid gap-3 sm:grid-cols-2">
          {conteudo?.flashcards.map((fc) => {
            const flipped = flippedCards.has(fc.id);
            return (
              <button
                key={fc.id}
                type="button"
                onClick={() => toggleFlip(fc.id)}
                className={cn(
                  "min-h-[140px] rounded-2xl border p-5 text-left transition-all",
                  flipped ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:shadow-md"
                )}
              >
                <p className="text-xs uppercase tracking-wide opacity-70">
                  {flipped ? "Resposta" : "Pergunta · clique para virar"}
                </p>
                <p className="mt-2 font-display text-base font-medium">
                  {flipped ? fc.verso : fc.frente}
                </p>
              </button>
            );
          })}
        </Tabs.Content>

        {/* Exercícios */}
        <Tabs.Content value="exercicios" className="mt-5 space-y-4">
          {conteudo?.exercicios.map((ex, idx) => (
            <Card key={ex.id}>
              <CardContent className="p-5">
                <p className="font-display font-semibold">Questão {idx + 1}</p>
                <p className="mt-2">{ex.enunciado}</p>
                {ex.alternativas && (
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {ex.alternativas.map((alt, i) => (
                      <li key={i} className="rounded-lg border bg-secondary/40 px-3 py-2">
                        {String.fromCharCode(97 + i)}) {alt}
                      </li>
                    ))}
                  </ul>
                )}
                <details className="group mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-primary">
                    Ver gabarito
                  </summary>
                  <div className="mt-2 rounded-lg border bg-[hsl(var(--ju-soft))] p-3 text-sm">
                    <p className="font-semibold">Resposta: {ex.resposta_correta}</p>
                    {ex.explicacao && <p className="mt-1 text-muted-foreground">{ex.explicacao}</p>}
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
