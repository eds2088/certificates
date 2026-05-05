import { createFileRoute } from "@tanstack/react-router";
import Pricing from "@/pages/Pricing";
export const Route = createFileRoute("/precos")({
  head: () => ({ meta: [{ title: "Preços — Estudito" }, { name: "description", content: "Planos do Estudito: mensal e anual com 7 dias grátis." }] }),
  component: Pricing,
});
