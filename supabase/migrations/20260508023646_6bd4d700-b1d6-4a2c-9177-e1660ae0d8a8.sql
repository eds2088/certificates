ALTER TABLE public.planos
  ALTER COLUMN prompt_version SET DEFAULT '3.0.1-pre-yuki',
  ADD COLUMN IF NOT EXISTS erro_codigo text,
  ADD COLUMN IF NOT EXISTS latency_ms integer,
  ADD COLUMN IF NOT EXISTS imagens_count integer,
  ADD COLUMN IF NOT EXISTS payload_kb integer;