import { createFileRoute } from "@tanstack/react-router";
import Login from "@/pages/Login";
export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Estudito" }] }),
  component: Login,
});
