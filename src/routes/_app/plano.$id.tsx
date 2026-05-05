import { createFileRoute } from "@tanstack/react-router";
import PlanoView from "@/pages/PlanoView";
export const Route = createFileRoute("/_app/plano/$id")({ component: PlanoView });
