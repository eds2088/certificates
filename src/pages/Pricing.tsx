import { Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Mensal",
    price: "R$ 49",
    period: "/mês",
    description: "Flexibilidade total. Cancele quando quiser.",
    cta: "Começar grátis",
    featured: false,
  },
  {
    name: "Anual",
    price: "R$ 39",
    period: "/mês",
    badge: "Economize 20%",
    description: "Cobrado 1x ao ano (R$ 469). Melhor custo-benefício.",
    cta: "Assinar plano anual",
    featured: true,
  },
];

const features = [
  "Planos de estudo gerados a partir do material da escola",
  "Até 2 filhos por conta inclusos",
  "Painel da família com semáforo semanal",
  "Banco de olimpíadas (OBMEP, Canguru, OBA, OBI e mais)",
  "Provas em PDF para imprimir, com gabarito",
  "Flashcards e exercícios calibrados pela IA",
  "Suporte por e-mail em até 24 horas",
  "Curadoria pedagógica revisada por professora ativa",
];

export default function Pricing() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="bg-estudito-sky py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="accent" className="mb-4">
              <Sparkles size={12} className="mr-1" /> 7 dias grátis em qualquer plano
            </Badge>
            <h1 className="font-display text-4xl font-bold md:text-5xl">
              Um preço justo para uma família participativa.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Menos do que uma aula particular. Para o ano todo.
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.featured
                    ? "relative rounded-3xl border-2 border-primary bg-card p-8 shadow-xl"
                    : "relative rounded-3xl border bg-card p-8"
                }
              >
                {plan.badge && (
                  <Badge variant="accent" className="absolute -top-3 left-8">
                    {plan.badge}
                  </Badge>
                )}
                <h2 className="font-display text-2xl font-bold">{plan.name}</h2>
                <div className="mt-4 flex items-baseline">
                  <span className="font-display text-5xl font-bold text-primary">{plan.price}</span>
                  <span className="ml-1 text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

                <Button
                  asChild
                  size="lg"
                  className="mt-7 w-full"
                  variant={plan.featured ? "default" : "outline"}
                >
                  <Link to="/cadastro">{plan.cta}</Link>
                </Button>

                <div className="my-7 h-px bg-border" />

                <ul className="space-y-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={18} className="mt-0.5 shrink-0 text-[var(--success)]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">3 filhos ou mais?</strong> Adicione novos
              alunos por R$ 12 cada/mês no plano anual. Fale com a gente em{" "}
              <a href="mailto:contato@estudito.com.br" className="font-semibold text-primary underline-offset-2 hover:underline">
                contato@estudito.com.br
              </a>.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
