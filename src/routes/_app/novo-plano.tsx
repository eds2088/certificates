import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import NovoPlano from "@/pages/NovoPlano";

const novoPlanoSearchSchema = z.object({
  observacoes_pre: fallback(z.string().max(2000), "").default(""),
});

export const Route = createFileRoute("/_app/novo-plano")({
  validateSearch: zodValidator(novoPlanoSearchSchema),
  component: NovoPlano,
});
