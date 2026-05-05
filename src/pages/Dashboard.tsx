import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MascotJu } from "@/components/MascotJu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { diasAte } from "@/lib/utils";
import type { Filho, Plano } from "@/types";

interface PlanoComFilho extends Plano {
  filho: Pick<Filho, "id" | "nome">;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [filhos, setFilhos] = useState<Filho[]>([]);
  const [planos, setPlanos] = useState<PlanoComFilho[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!|| !supabase || !profile) {
        setLoading(false);
        return;
      }
      const [{ data: f }, { data: p }] = await Promise.all([
        supabase.from("filhos").select("*").eq("responsavel_id", profile.id),
        supabase
          .from("planos")
          .select("*, filho:filhos(id, nome)")
          .order("data_prova", { ascending: true }),
      ]);
      setFilhos((f as Filho[]) ?? []);
      setPlanos((p as PlanoComFilho[]) ?? []);
      setLoading(false);
    }
    load();
  }, [profile]);

  const proximos = planos.filter((p) => p.status !== "concluido");

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Olá, {profile?.nome?.split(" ")[0] ?? "responsável"} 👋
          </h1>
          <p className="text-muted-foreground">Vamos preparar o próximo estudo?</p>
        </div>
        <Button asChild size="lg" className="hidden md:inline-flex">
          <Link to="/novo-plano">
            <Plus size={18} /> Novo plano
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {!loading && proximos.length === 0 && (
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center md:flex-row md:gap-8 md:py-10 md:text-left">
            <MascotJu size={140} pose="happy" />
            <div className="flex-1">
              <h2 className="font-display text-xl font-bold">Nenhum plano ativo ainda.</h2>
              <p className="mt-1 max-w-md text-muted-foreground">
                Quando seu filho receber um roteiro de provas, fotografe o material e eu monto o plano completo.
              </p>
              <Button asChild className="mt-4">
                <Link to="/novo-plano">
                  <Sparkles size={16} /> Criar primeiro plano
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active plans */}
      {proximos.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-bold">Próximas provas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {proximos.map((p) => {
              const dias = diasAte(p.data_prova);
              return (
                <Card key={p.id} className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{p.disciplina}</CardTitle>
                        <CardDescription>
                          {p.filho?.nome ?? "—"}
                        </CardDescription>
                      </div>
                      <Badge variant={dias <= 2 ? "accent" : "secondary"}>
                        {dias <= 0 ? "Hoje" : dias === 1 ? "Amanhã" : `em ${dias} dias`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar size={14} />
                      {new Date(p.data_prova).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "long",
                      })}
                    </div>
                    <Progress value={p.status === "ativo" ? 50 : p.status === "gerando" ? 10 : 100} />
                    <Button asChild variant="ghost" size="sm" className="mt-4 -ml-2">
                      <Link to={`/plano/${p.id}`}>
                        Abrir plano <ArrowRight size={14} />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Children */}
      {filhos.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-bold">Seus alunos</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {filhos.map((f) => (
              <div key={f.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/30 font-display font-bold text-accent-foreground">
                    {f.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-display font-semibold">{f.nome}</p>
                    <p className="text-xs text-muted-foreground">{f.escola ?? "—"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mobile fixed FAB */}
      <Button asChild size="lg" className="fixed bottom-20 right-4 z-20 shadow-lg md:hidden" aria-label="Novo plano">
        <Link to="/novo-plano"><Plus /></Link>
      </Button>
    </div>
  );
}
