-- v3.3.0 gestao_e_insights — idempotente

-- 1. Soft delete e arquivar em planos
ALTER TABLE public.planos
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_planos_filho_ativos
  ON public.planos (filho_id, criado_em DESC)
  WHERE deleted_at IS NULL AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_planos_filho_arquivados
  ON public.planos (filho_id, archived_at DESC)
  WHERE deleted_at IS NULL AND archived_at IS NOT NULL;

-- 2. insights_filho
CREATE TABLE IF NOT EXISTS public.insights_filho (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filho_id uuid NOT NULL REFERENCES public.filhos(id) ON DELETE CASCADE,
  resumo_geral text NOT NULL DEFAULT '',
  pontos_fortes jsonb NOT NULL DEFAULT '[]'::jsonb,
  pontos_atencao jsonb NOT NULL DEFAULT '[]'::jsonb,
  sugestao_proximo_plano jsonb,
  topicos_revisao text[] NOT NULL DEFAULT '{}',
  baseado_em_planos uuid[] NOT NULL DEFAULT '{}',
  prompt_version text NOT NULL DEFAULT '3.3.0-insights',
  gerado_em timestamptz NOT NULL DEFAULT now(),
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insights_filho_filho
  ON public.insights_filho (filho_id, gerado_em DESC);

ALTER TABLE public.insights_filho ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "responsavel ve insights do filho" ON public.insights_filho;
CREATE POLICY "responsavel ve insights do filho"
  ON public.insights_filho
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.filhos f
      WHERE f.id = insights_filho.filho_id
        AND f.responsavel_id = auth.uid()
    )
  );

-- INSERT/UPDATE/DELETE: sem policies para roles autenticados → só service_role escreve.