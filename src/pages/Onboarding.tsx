import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Loader2, Plus, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MascotJu } from "@/components/MascotJu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ANOS_ESCOLARES, type AnoEscolar } from "@/types";
import { cn } from "@/lib/utils";

interface FilhoForm {
  nome: string;
  ano_escolar: AnoEscolar | "";
  escola: string;
}

const FILHO_VAZIO: FilhoForm = { nome: "", ano_escolar: "", escola: "" };

export default function Onboarding() {
  const nav = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [filhos, setFilhos] = useState<FilhoForm[]>([{ ...FILHO_VAZIO }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 2;

  function updateFilho(idx: number, patch: Partial<FilhoForm>) {
    setFilhos((fs) => fs.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  function addFilho() {
    if (filhos.length >= 3) return;
    setFilhos((fs) => [...fs, { ...FILHO_VAZIO }]);
  }

  function removeFilho(idx: number) {
    setFilhos((fs) => fs.filter((_, i) => i !== idx));
  }

  function canAdvance(): boolean {
    if (step === 0) return true; // welcome
    if (step === 1)
      return filhos.every((f) => f.nome.trim() && f.ano_escolar);
    return true;
  }

  async function handleFinish(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!user) {
      setError("Configure o Supabase para finalizar o cadastro.");
      setLoading(false);
      return;
    }

    const rows = filhos.map((f) => ({
      responsavel_id: user.id,
      nome: f.nome.trim(),
      ano_escolar: f.ano_escolar,
      escola: f.escola.trim() || null,
    }));

    const { error: e1 } = await supabase.from("filhos").insert(rows);
    if (e1) {
      setError("Não foi possível salvar. Tente novamente.");
      setLoading(false);
      return;
    }

    await refreshProfile();
    setLoading(false);
    nav({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-estudito-sky">
      <header className="container flex h-16 items-center">
        <Logo size="md" />
      </header>

      <main className="container max-w-2xl py-6">
        {/* Progress */}
        <div className="mb-6 flex gap-2">
          {Array.from({ length: totalSteps + 1 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-border"
              )}
            />
          ))}
        </div>

        <div className="rounded-3xl border bg-card p-6 shadow-lg md:p-10">
          {step === 0 && (
            <div className="text-center">
              <div className="mx-auto mb-4 animate-float">
                <MascotJu size={140} pose="wave" />
              </div>
              <h1 className="font-display text-3xl font-bold">Oi! Eu sou a Ju.</h1>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Antes de começar, me conta um pouco sobre seus filhos. Isso me ajuda a
                montar planos no nível certo para cada um.
              </p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h1 className="font-display text-2xl font-bold">Quem vai estudar?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Você pode cadastrar até 3 filhos. Adicione pelo menos um para começar.
              </p>

              <div className="mt-6 space-y-5">
                {filhos.map((f, idx) => (
                  <div key={idx} className="rounded-2xl border bg-secondary/40 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-display font-semibold">Filho(a) {idx + 1}</h3>
                      {filhos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFilho(idx)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Remover"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`nome-${idx}`}>Nome</Label>
                        <Input
                          id={`nome-${idx}`}
                          value={f.nome}
                          onChange={(e) => updateFilho(idx, { nome: e.target.value })}
                          placeholder="Ex.: Pedro"
                          className="mt-1.5"
                        />
                      </div>

                      <div>
                        <Label>Ano escolar</Label>
                        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {ANOS_ESCOLARES.map((a) => (
                            <button
                              key={a.value}
                              type="button"
                              onClick={() => updateFilho(idx, { ano_escolar: a.value })}
                              className={cn(
                                "rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                                f.ano_escolar === a.value
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-input bg-card hover:border-primary/40"
                              )}
                            >
                              {a.emoji && <span className="mr-1">{a.emoji}</span>}
                              {a.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`escola-${idx}`}>
                          Escola <span className="text-muted-foreground">(opcional)</span>
                        </Label>
                        <Input
                          id={`escola-${idx}`}
                          value={f.escola}
                          onChange={(e) => updateFilho(idx, { escola: e.target.value })}
                          placeholder="Nome da escola"
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {filhos.length < 3 && (
                  <button
                    type="button"
                    onClick={addFilho}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-input py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    <Plus size={16} /> Adicionar mais um filho
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="mx-auto mb-4 animate-float">
                <MascotJu size={140} pose="happy" />
              </div>
              <h1 className="font-display text-2xl font-bold">Tudo pronto!</h1>
              <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Quando uma prova chegar, é só fotografar o material e eu monto o plano.
                Vamos começar?
              </p>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={loading}>
                <ChevronLeft size={16} /> Voltar
              </Button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
                Continuar <ChevronRight size={16} />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={loading || !canAdvance()}>
                {loading ? <Loader2 className="animate-spin" size={16} /> : "Começar"}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
