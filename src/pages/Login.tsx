import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) {
      setError("Não foi possível entrar com o Google.");
    }
  }

  async function handleApple() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) {
      setError("Não foi possível entrar com a Apple.");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);

    if (error) {
      setError("E-mail ou senha incorretos.");
      return;
    }
    nav({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-estudito-sky px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center">
          <Logo size="lg" />
        </Link>

        <div className="rounded-3xl border bg-card p-8 shadow-xl">
          <h1 className="font-display text-2xl font-bold">Entrar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bom te ver de volta.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                  required
                  autoComplete="current-password"
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

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Entrar"}
            </Button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleGoogle}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              Continuar com Google
            </Button>

            <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleApple}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <path d="M16.365 1.43c0 1.14-.466 2.234-1.225 3.02-.804.84-2.116 1.49-3.205 1.402-.135-1.108.43-2.265 1.169-3.013.83-.84 2.244-1.466 3.261-1.41zM20.5 17.34c-.55 1.27-.812 1.836-1.522 2.96-.99 1.566-2.388 3.516-4.122 3.532-1.541.014-1.937-1.004-4.027-.992-2.09.011-2.527 1.01-4.07.996-1.733-.016-3.057-1.776-4.047-3.342C-.04 16.103-.33 11.04 1.41 8.342c1.235-1.916 3.187-3.04 5.022-3.04 1.866 0 3.04 1.025 4.582 1.025 1.497 0 2.41-1.026 4.57-1.026 1.633 0 3.363.89 4.594 2.428-4.038 2.213-3.382 7.98.322 9.61z"/>
              </svg>
              Continuar com Apple
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link to="/cadastro" className="font-semibold text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
