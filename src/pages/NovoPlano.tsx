import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Loader2, Camera, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Filho } from "@/types";

const DISCIPLINAS = [
  "Matemática", "Português", "Ciências", "História",
  "Geografia", "Inglês", "Artes", "Outra",
];

export default function NovoPlano() {
  const nav = useNavigate();
  const { profile } = useAuth();
  const [step, setStep] = useState(0);
  const [filhos, setFilhos] = useState<Filho[]>([]);

  // Form state
  const [filhoId, setFilhoId] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [dataProva, setDataProva] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 3;

  useEffect(() => {
    async function load() {
      if (!profile) return;
      const { data } = await supabase
        .from("filhos")
        .select("*")
        .eq("responsavel_id", profile.id);
      setFilhos((data as Filho[]) ?? []);
    }
    load();
  }, [profile]);

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const next = [...fotos, ...Array.from(files)].slice(0, 6);
    setFotos(next);
  }

  function removeFoto(idx: number) {
    setFotos((fs) => fs.filter((_, i) => i !== idx));
  }

  function canAdvance(): boolean {
    if (step === 0) return Boolean(filhoId && disciplina && dataProva);
    if (step === 1) return fotos.length > 0;
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (false) {
      setError("Configure o Supabase para continuar.");
      setLoading(false);
      return;
    }

    try {
      // 1. Insert plano with status "gerando"
      const { data: plano, error: e1 } = await supabase
        .from("planos")
        .insert({
          filho_id: filhoId,
          disciplina,
          data_prova: dataProva,
          status: "gerando",
        })
        .select()
        .single();

      if (e1 || !plano) throw e1 ?? new Error("Falha ao criar plano");

      // 2. Upload photos to Supabase Storage
      // LOVABLE: configurar bucket "materiais-prova" no Supabase, com RLS
      // permitindo apenas o responsável_id dono do filho gravar/ler.
      const uploads = await Promise.all(
        fotos.map(async (file, idx) => {
          const path = `${plano.id}/${idx}-${Date.now()}.${file.name.split(".").pop()}`;
          const { error } = await supabase!
            .storage
            .from("materiais-prova")
            .upload(path, file);
          if (error) throw error;
          return path;
        })
      );

      // 3. Trigger AI generation
      // LOVABLE: criar uma server function "gerar-plano" que recebe { plano_id, paths, observacoes }
      // e chama o Lovable AI Gateway (Gemini Vision) para gerar o conteudo_json,
      // depois atualiza o plano com status "ativo" e o conteudo_json populado.
      const { error: e3 } = await supabase.functions.invoke("gerar-plano", {
        body: { plano_id: plano.id, paths: uploads, observacoes },
      });

      if (e3) {
        // mark error so PlanoView shows retry UI
        await supabase.from("planos").update({ status: "erro" }).eq("id", plano.id);
        throw e3;
      }

      nav({ to: "/plano/$id", params: { id: plano.id } });
    } catch (err) {
      setError("Não conseguimos gerar seu plano agora. Verifique se as fotos estão legíveis e tente de novo.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-border")}
          />
        ))}
      </div>

      <Card>
        <CardContent className="p-6 md:p-8">
          {step === 0 && (
            <>
              <h1 className="font-display text-2xl font-bold">Sobre a prova</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Conte rapidamente sobre o que vai estudar.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <Label>Para qual filho?</Label>
                  <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {filhos.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFilhoId(f.id)}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-all",
                          filhoId === f.id
                            ? "border-primary bg-primary/10"
                            : "border-input bg-card hover:border-primary/40"
                        )}
                      >
                        <p className="font-display font-semibold">{f.nome}</p>
                        <p className="text-xs text-muted-foreground">{f.ano_escolar.replace("_", "º ")}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Disciplina</Label>
                  <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {DISCIPLINAS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDisciplina(d)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                          disciplina === d
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-input bg-card hover:border-primary/40"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="data">Data da prova</Label>
                  <Input
                    id="data"
                    type="date"
                    value={dataProva}
                    onChange={(e) => setDataProva(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="font-display text-2xl font-bold">Foto do material</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Roteiro de estudo, apostila ou caderno. Quanto mais legível, melhor o plano.
              </p>

              <label className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-input bg-secondary/40 py-12 transition-colors hover:border-primary/50 hover:bg-primary/5">
                <Camera size={32} className="text-primary" />
                <p className="font-display font-semibold">Adicionar fotos</p>
                <p className="text-xs text-muted-foreground">JPG, PNG · até 6 imagens</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  className="hidden"
                  onChange={handleFiles}
                />
              </label>

              {fotos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {fotos.map((f, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={URL.createObjectURL(f)}
                        alt={`Material ${idx + 1}`}
                        className="aspect-square w-full rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFoto(idx)}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                        aria-label="Remover"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6">
                <Label htmlFor="obs">
                  Observações <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <textarea
                  id="obs"
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex.: foque em frações; ele tem dificuldade com problemas com texto."
                  className="mt-1.5 flex w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="text-center">
              <BookOpen size={48} className="mx-auto text-primary" />
              <h1 className="mt-4 font-display text-2xl font-bold">Tudo certo!</h1>
              <p className="mt-2 text-muted-foreground">
                Vou olhar o material com cuidado e montar um plano sob medida.
                Isso costuma levar 30 a 60 segundos.
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

            {step < totalSteps - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance()}>
                Continuar <ChevronRight size={16} />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading || !canAdvance()} size="lg">
                {loading ? (
                  <><Loader2 className="animate-spin" size={16} /> Gerando…</>
                ) : (
                  "Gerar plano"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
