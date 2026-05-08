ALTER TABLE public.planos
ADD COLUMN IF NOT EXISTS flashcards_count integer,
ADD COLUMN IF NOT EXISTS exercicios_count integer,
ADD COLUMN IF NOT EXISTS sessoes_count integer;