ALTER TABLE public.planos
  ADD COLUMN IF NOT EXISTS prompt_version text NOT NULL DEFAULT '3.0.0-pre-yuki',
  ADD COLUMN IF NOT EXISTS erro_mensagem text;