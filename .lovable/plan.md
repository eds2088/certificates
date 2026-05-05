# Plano: Importar projeto Estudito

Migrar o app **Estudito** (Vite + React Router + Supabase) do zip enviado para este projeto Lovable (TanStack Start + Lovable Cloud), preservando design, conteúdo e funcionalidades.

## Fase 1 — Estrutura base e design system

1. **Design tokens** — converter as variáveis HSL do `src/index.css` original (paleta primary `#1E5F8C`, accent `#F5A623`, cores `ju`) para o formato **oklch** em `src/styles.css`, mantendo o resultado visual idêntico
2. **Fontes** — adicionar Google Fonts (Quicksand display + Inter body) no `__root.tsx`
3. **Animações Tailwind** — recriar `wiggle`, `float` e radius customizados via Tailwind v4
4. **Componentes UI shadcn** — os necessários (button, card, input, label, badge, progress, tabs) já existem no projeto; ajustar variantes se preciso

## Fase 2 — Componentes compartilhados

Copiar e adaptar:
- `Logo.tsx`
- `MascotJu.tsx` (SVG inline, poses happy/wave/study)
- `Navbar.tsx`
- `Footer.tsx`
- `Layout.tsx` (sidebar desktop + bottom nav mobile)
- `ProtectedRoute.tsx` → adaptado para `beforeLoad` do TanStack Router
- `types/index.ts` (tipos compartilhados, incluindo `PlanoConteudo`)

## Fase 3 — Rotas (conversão React Router → TanStack)

Cada página vira um arquivo em `src/routes/` com `head()` próprio para SEO:

**Públicas:**
- `/` → Landing
- `/pricing` → Pricing
- `/login` → Login
- `/signup` → Signup

**Autenticadas (com guard):**
- `/onboarding` → wizard inicial
- `/dashboard` → Dashboard do aluno
- `/novo-plano` → wizard de upload de fotos
- `/plano/$planoId` → PlanoView com tabs (Sessões / Flashcards / Exercícios)
- `/pais` → PaiDashboard com semáforo

**404** → `NotFound` no `__root.tsx`

## Fase 4 — Backend (Lovable Cloud)

1. **Ativar Lovable Cloud** neste projeto
2. **Aplicar o `supabase/schema.sql`** do zip (tabelas: usuarios, criancas, planos, sessoes, flashcards, exercicios, assinaturas, etc. + RLS)
3. **Bucket de storage** `materiais-prova` (privado) com policies de INSERT/SELECT por dono
4. **Auth** — substituir o cliente `src/lib/supabase.ts` pelo cliente Lovable Cloud; manter o hook `useAuth` com mesma API; remover o "modo demo" (Cloud já fica sempre disponível)

## Fase 5 — Edge Function `gerar-plano`

Implementar a função crítica descrita no `LOVABLE.md`:
- Recebe `plano_id`, `paths` das fotos e `observacoes`
- Baixa imagens do bucket
- Chama **Lovable AI Gateway** (Gemini 2.5 Flash com visão) com o prompt da Ju
- Valida JSON contra `PlanoConteudo`
- Atualiza `planos.status` para `ativo` ou `erro`

## Fora do escopo desta importação (Fase 2 do produto)

- Integração Mercado Pago (criar-checkout + webhook)
- Notificações por e-mail/WhatsApp
- App nativo via Capacitor

---

## Detalhes técnicos

- **Roteamento:** todas as rotas serão arquivos planos em `src/routes/` (ex: `pricing.tsx`, `plano.$planoId.tsx`). Sem `BrowserRouter`, sem `<Routes>`.
- **Guard de auth:** `ProtectedRoute` vira `beforeLoad: ({ context }) => { if (!user) throw redirect({ to: "/login" }) }` no route file.
- **Tailwind:** projeto usa v4 com `@theme inline`; vou portar os tokens preservando os nomes (`--color-primary`, `--color-accent`, `--color-ju-*`) para que classes como `bg-primary text-accent-foreground` continuem funcionando.
- **Cliente Supabase:** `@supabase/supabase-js` segue o mesmo, mas a URL/anon key vêm dos envs do Lovable Cloud automaticamente — sem `.env.example` manual.
- **Schema SQL:** aplicado via migration do Lovable Cloud, não rodado manualmente no SQL editor.
- **Não vou copiar:** `.git/`, `package-lock.json`, configs duplicadas (a pasta aninhada `estudito-site/estudito-site/` no zip é redundante e será ignorada).

Quer que eu já inclua a Edge Function `gerar-plano` na primeira leva, ou prefere começar só com o frontend + auth + DB e deixar a função de IA como passo seguinte?
