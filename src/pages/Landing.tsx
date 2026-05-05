import { Link } from "@tanstack/react-router";
import {
  ArrowRight, Camera, Sparkles, ShieldCheck, Heart, Trophy,
  GraduationCap, Calendar, Users, CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Logo";
import { MascotJu } from "@/components/MascotJu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="bg-estudito-sky">
        <div className="container grid gap-10 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="animate-fade-in-up">
            <Badge variant="accent" className="mb-5">
              <Sparkles size={12} className="mr-1" /> Novo · IA pedagógica
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
              Cada criança no seu ritmo,
              <br />
              <span className="text-primary">a família ao lado.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground md:text-xl">
              O Estudito ajuda pais a participarem ativamente do estudo dos filhos no
              Ensino Fundamental — com planos sob medida feitos a partir do material da
              própria escola.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/cadastro">
                  Começar grátis por 7 dias
                  <ArrowRight size={18} />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#como-funciona">Ver como funciona</a>
              </Button>
            </div>

            <div className="mt-6 flex items-center gap-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-[var(--success)]" />
                Sem cartão para testar
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-[var(--success)]" />
                Cancele quando quiser
              </div>
            </div>
          </div>

          {/* Mascot block */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-dots opacity-40" />
            <div className="relative animate-float">
              <MascotJu size={280} pose="wave" />
            </div>
            <div className="absolute -bottom-2 right-6 hidden rounded-2xl border bg-card px-4 py-3 shadow-lg md:block">
              <p className="font-display text-sm font-semibold">Oi, eu sou a Ju!</p>
              <p className="text-xs text-muted-foreground">Vou estudar com seu filho.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="border-y bg-card py-16 md:py-24" id="para-pais">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              A semana de prova chegou.
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Você quer ajudar seu filho — mas por onde começar?
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Não sei o conteúdo de hoje",
                body: "BNCC, alfabetização nova, matemática construtivista. O que você aprendeu não é o que ele aprende.",
              },
              {
                title: "Não tenho tempo de planejar",
                body: "Entre trabalho e jantar, montar um plano de estudo decente vira mais uma tarefa pesada.",
              },
              {
                title: "Quando vejo, a prova já foi",
                body: "Sem acompanhar a prática, só fica claro onde travou depois que a nota chegou.",
              },
            ].map((p, i) => (
              <div
                key={i}
                className="rounded-2xl border bg-secondary/40 p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-16 md:py-24" id="como-funciona">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <Badge className="mb-3">Como funciona</Badge>
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Três passos. Pronto.
            </h2>
          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              {
                step: "1",
                icon: Camera,
                title: "Fotografe o material",
                body: "Roteiro de estudos, apostila, caderno. A Ju olha tudo e entende o que vai cair.",
              },
              {
                step: "2",
                icon: Sparkles,
                title: "Receba o plano feito",
                body: "Sessões curtas, exercícios calibrados, flashcards e até prova em PDF para imprimir.",
              },
              {
                step: "3",
                icon: GraduationCap,
                title: "Estude junto, do seu jeito",
                body: "Você acompanha pelo painel parental enquanto seu filho avança com a Ju.",
              },
            ].map((s, i) => (
              <div key={i} className="relative">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                    <s.icon size={22} />
                  </div>
                  <span className="font-display text-5xl font-bold text-secondary">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="border-y bg-secondary/40 py-16 md:py-24">
        <div className="container">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <Badge variant="accent" className="mb-3">
                <Heart size={12} className="mr-1" /> Pais no centro
              </Badge>
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Você não substitui a escola. Você participa dela.
              </h2>
              <p className="mt-4 text-muted-foreground">
                O Estudito não é um app de joguinhos para deixar a criança sozinha.
                É uma ferramenta para você acompanhar de perto — com método, sem
                substituir o professor.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  { icon: ShieldCheck, t: "Privacidade radical com menores", d: "LGPD by-design. Cadastro só por responsável legal." },
                  { icon: GraduationCap, t: "Curadoria pedagógica real", d: "Conteúdo validado por professora ativa de Ensino Fundamental." },
                  { icon: Trophy, t: "Banco de olimpíadas incluído", d: "OBMEP, Canguru, OBA, OBI e mais — com gabarito comentado." },
                  { icon: Calendar, t: "Acompanha o calendário da escola", d: "Você diz a data da prova; o plano se adapta ao tempo que sobrar." },
                ].map((f, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                      <f.icon size={18} />
                    </div>
                    <div>
                      <p className="font-display font-semibold">{f.t}</p>
                      <p className="text-sm text-muted-foreground">{f.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock parental panel preview */}
            <div className="relative">
              <div className="rounded-3xl border bg-card p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Painel da Família
                    </p>
                    <h3 className="font-display text-xl font-bold">
                      Esta semana — Pedro
                    </h3>
                  </div>
                  <Badge variant="success">Verde · 92%</Badge>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {[1, 1, 0.6, 1, 1, 0.4, 0].map((v, i) => (
                    <div key={i} className="text-center">
                      <div
                        className="mb-1 rounded-md bg-primary"
                        style={{ height: `${28 + v * 36}px`, opacity: v || 0.18 }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {["S", "T", "Q", "Q", "S", "S", "D"][i]}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  <div className="rounded-xl border bg-secondary/40 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">Matemática · Frações</p>
                      <span className="text-xs text-muted-foreground">em 3 dias</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background">
                      <div className="h-full w-3/4 bg-primary" />
                    </div>
                  </div>
                  <div className="rounded-xl border bg-secondary/40 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">Português · Crônicas</p>
                      <span className="text-xs text-muted-foreground">em 7 dias</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background">
                      <div className="h-full w-2/5 bg-primary" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border bg-card px-4 py-3 shadow-lg md:block">
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-primary" />
                  <div>
                    <p className="font-display text-sm font-semibold">Vincule cada filho</p>
                    <p className="text-xs text-muted-foreground">Até dois por conta.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="overflow-hidden rounded-3xl bg-primary p-10 text-primary-foreground shadow-xl md:p-16">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">
                  A próxima prova não precisa ser por sorte.
                </h2>
                <p className="mt-3 max-w-xl text-primary-foreground/80">
                  Comece grátis por 7 dias. A Ju está esperando para conhecer seu filho.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" variant="accent">
                    <Link to="/cadastro">
                      Criar minha conta
                      <ArrowRight size={18} />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  >
                    <Link to="/precos">Ver preços</Link>
                  </Button>
                </div>
              </div>
              <div className="hidden md:block">
                <MascotJu size={180} pose="happy" />
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Plataforma desenvolvida em São Paulo. Curadoria pedagógica por professora ativa.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
