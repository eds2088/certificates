CREATE TABLE public.ilustracoes (
  id TEXT PRIMARY KEY,
  arquivo_url TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  disciplinas TEXT[] NOT NULL DEFAULT '{}',
  anos_aplicaveis TEXT[] NOT NULL DEFAULT '{}',
  estilo TEXT DEFAULT 'cartoon_colorido',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ilustracoes_tags ON public.ilustracoes USING GIN (tags);
CREATE INDEX idx_ilustracoes_disciplinas ON public.ilustracoes USING GIN (disciplinas);

ALTER TABLE public.ilustracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ilustracoes_select_all" ON public.ilustracoes
  FOR SELECT USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('ilustracoes', 'ilustracoes', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "ilustracoes_storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'ilustracoes');
