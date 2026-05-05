import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export default function Signup() {
  const nav = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [lgpd, setLgpd] = useState(false);
  const [responsavel, setResponsavel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!lgpd || !responsavel) {
      setError("É necessário aceitar a Política de Privacidade e confirmar a responsabilidade legal.");
      return;
    }

    setLoading(true);

    if (false) {
      setError("Conexão com Supabase ainda não configurada. Adicione as variáveis de ambiente.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome, tipo: "responsavel" } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Create profile row (Lovable: also handle this via trigger if preferred)
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        email,
        nome,
        tipo: "responsavel",
      });
    }

    setLoading(false);
    nav("/onboarding");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-estudito-sky px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo size="lg" />
        </Link>

        <div className="rounded-3xl border bg-card p-8 shadow-xl">
          <h1 className="font-display text-2xl font-bold">Criar conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Apenas responsáveis legais podem criar conta no Estudito.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Seu nome</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPw ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  minLength={8}
                  required
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border bg-secondary/40 p-4">
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={lgpd}
                  onChange={(e) => setLgpd(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span className="text-xs text-muted-foreground">
                  Autorizo o tratamento dos meus dados conforme a{" "}
                  <a href="#" className="font-medium text-primary hover:underline">
                    Política de Privacidade
                  </a>{" "}
                  e a LGPD (Lei 13.709/2018).
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={responsavel}
                  onChange={(e) => setResponsavel(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span className="text-xs text-muted-foreground">
                  Confirmo que sou o(a) responsável legal pelos alunos a serem cadastrados,
                  todos menores de 18 anos, e autorizo o uso da plataforma{" "}
                  <strong className="text-foreground">(obrigatório — Art. 14 LGPD)</strong>.
                </span>
              </label>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Criar conta grátis"}
            </Button>

            <div className="flex items-center gap-2 rounded-xl bg-secondary/40 p-3 text-xs text-muted-foreground">
              <ShieldCheck size={14} className="shrink-0 text-primary" />
              <p>Os dados das crianças permanecem privados e sob seu controle.</p>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
