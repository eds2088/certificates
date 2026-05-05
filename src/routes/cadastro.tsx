import { createFileRoute } from "@tanstack/react-router";
import Signup from "@/pages/Signup";
export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Criar conta — Estudito" }] }),
  component: Signup,
});
