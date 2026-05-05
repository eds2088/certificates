import { useEffect, useState } from "react";
import { Users, ShieldCheck, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Filho } from "@/types";
import { cn } from "@/lib/utils";

type Cor = "verde" | "amarelo" | "vermelho";

interface FilhoComStatus extends Filho {
  semaforo: Cor;
  horasEstudadas: number;
  horasMeta: number;
}

const semaforoLabel: Record<Cor, { label: string; classe: string }> = {
  verde:    { label: "Em dia",      classe: "bg-[var(--success)]" },
  amarelo:  { label: "Atenção",     classe: "bg-[hsl(var(--warning))]" },
  vermelho: { label: "Precisa apoio", classe: "bg-destructive" },
};

export default function PaiDashboard() {
  const { profile } = useAuth();
  const [filhos, setFilhos] = useState<FilhoComStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!|| !supabase || !profile) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("filhos")
        .select("*")
        .eq("responsavel_id", profile.id);

      // LOVABLE: este cálculo de semáforo deve vir de uma view/RPC no Supabase,
      // baseada nas sessões concluídas dos últimos 7 dias vs sessões previstas.
      // Por enquanto, mock estável para preview.
      const enriched: FilhoComStatus[] = (data as Filho[] ?? []).map((f, i) => ({
        ...f,
        semaforo: (["verde", "amarelo", "verde"][i % 3] as Cor),
        horasEstudadas: 4 + i,
        horasMeta: 6,
      }));
      setFilhos(enriched);
      setLoading(false);
    }
    load();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Família</h1>
        <p className="text-muted-foreground">Acompanhe como cada filho está estudando.</p>
      </div>

      <div className="rounded-2xl border bg-[hsl(var(--ju-soft))] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-sm text-foreground">
            <strong>Privacidade:</strong> você vê o progresso de estudo, nunca o conteúdo
            das fotos enviadas. Esses materiais são privados de cada aluno.
          </p>
        </div>
      </div>

      {loading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Carregando…</CardContent></Card>
      ) : filhos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users size={36} className="mx-auto text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">Nenhum aluno cadastrado ainda.</p>
            <Button asChild className="mt-4">
              <a href="/onboarding"><Plus size={16} /> Adicionar filho</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filhos.map((f) => (
            <Card key={f.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/30 font-display font-bold text-accent-foreground">
                      {f.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle>{f.nome}</CardTitle>
                      <CardDescription>{f.ano_escolar.replace("_", "º ")}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1.5">
                    <span className={cn("h-2 w-2 rounded-full", semaforoLabel[f.semaforo].classe)} />
                    {semaforoLabel[f.semaforo].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl bg-secondary/40 p-3">
                  <p className="text-xs text-muted-foreground">Esta semana</p>
                  <p className="font-display text-lg font-bold">
                    {f.horasEstudadas}h <span className="text-sm font-normal text-muted-foreground">de {f.horasMeta}h previstas</span>
                  </p>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {[1, 0.8, 1, 0.5, 1, 0, 0].map((v, i) => (
                    <div key={i} className="text-center">
                      <div className="mb-1 rounded-md bg-primary" style={{ height: `${20 + v * 32}px`, opacity: v || 0.18 }} />
                      <span className="text-[10px] text-muted-foreground">
                        {["S","T","Q","Q","S","S","D"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
