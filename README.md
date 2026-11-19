# Gerador de Certificados Cambridge (STARTERS, MOVERS e FLYERS)

Transforma uma planilha com as notas dos alunos em certificados em PDF. Cada certificado leva o nome do aluno e os escudos de cada habilidade. No final, todos os certificados são baixados juntos em um arquivo `.zip`.

Tudo roda no navegador: as planilhas não são enviadas nem guardadas em lugar nenhum.

## Como rodar localmente

Requer Node.js e npm.

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # gera a versão final em dist/
```

Tecnologias: Vite, TypeScript, React, shadcn-ui e Tailwind CSS.

## Acesso

- O site abre numa tela de login (usuário e senha). O login vale enquanto a aba estiver aberta.
- Os ajustes do nome e dos escudos e a engrenagem de imagens pedem uma segunda senha, a senha de ajustes.

As senhas não estão neste repositório: peça-as a quem administra o site. O código guarda só um hash de cada uma (`src/lib/passwordCheck.ts`). O arquivo explica como gerar um hash novo para trocar uma senha.

## Caminho de uso

Login → enviar a planilha de notas → escolher STARTERS, MOVERS ou FLYERS → conferir os escudos (e baixar a planilha recalculada, se quiser) → usar nos certificados → visualizar → preencher a turma → baixar o `.zip` com os PDFs.

## 1. Calculadora de Escudos (página inicial)

### Planilha de notas (.xlsx)

4 colunas: Nome, Reading/Writing, Listening e Speaking. O cabeçalho é a primeira linha preenchida.

| Prova    | Reading/Writing | Listening | Speaking         |
|----------|-----------------|-----------|------------------|
| STARTERS | 0–25            | 0–20      | 0–5 (escudos)    |
| MOVERS   | 0–35            | 0–25      | 0–5 (escudos)    |
| FLYERS   | 0–50            | 0–25      | 0–5 (escudos)    |

Depois do envio, uma janela pergunta qual é a prova. Essa escolha define a regra de cálculo, o fundo do certificado e o nome dos arquivos.

### Regras da planilha

- **Aluno que faltou:** nota em branco, `0`, `z` ou `Z` vale zero escudos, e o certificado mostra os escudos apagados (cinza). O aluno continua recebendo certificado. Depois do envio, o site lista quem teve nota em branco.
- **Speaking:** a planilha já traz o número de escudos (0 a 5), sem conversão.
- **Nota fora da faixa ou que não é número inteiro** (ex.: `12.5`, `dez`, `99`): o site mostra um erro com a linha e a coluna. Todos os erros aparecem de uma vez.
- **Linha com notas mas sem nome:** também dá erro, para nenhum aluno sumir sem aviso.

### Conversão em escudos

A nota máxima de cada habilidade é dividida em 5 faixas iguais. Zero continua zero.

**STARTERS**

| Habilidade              | 0 | 1   | 2    | 3     | 4     | 5     |
|-------------------------|---|-----|------|-------|-------|-------|
| Reading/Writing (0–25)  | 0 | 1–5 | 6–10 | 11–15 | 16–20 | 21–25 |
| Listening (0–20)        | 0 | 1–4 | 5–8  | 9–12  | 13–16 | 17–20 |

**MOVERS**

| Habilidade              | 0 | 1   | 2    | 3     | 4     | 5     |
|-------------------------|---|-----|------|-------|-------|-------|
| Reading/Writing (0–35)  | 0 | 1–7 | 8–14 | 15–21 | 22–28 | 29–35 |
| Listening (0–25)        | 0 | 1–5 | 6–10 | 11–15 | 16–20 | 21–25 |

**FLYERS**

| Habilidade              | 0 | 1    | 2     | 3     | 4     | 5     |
|-------------------------|---|------|-------|-------|-------|-------|
| Reading/Writing (0–50)  | 0 | 1–10 | 11–20 | 21–30 | 31–40 | 41–50 |
| Listening (0–25)        | 0 | 1–5  | 6–10  | 11–15 | 16–20 | 21–25 |

**Speaking (todas as provas):** a nota é o próprio número de escudos (0 a 5).

As provas e as notas máximas ficam em `src/lib/exams.ts`; a leitura da planilha, em `src/lib/shieldConverter.ts`.

### O que a tela entrega

- Uma tabela com as primeiras 10 linhas convertidas.
- Uma planilha recalculada (.xlsx) com nome e escudos. Zero escudos aparece como `z`.
- Um botão que leva os dados direto para o Gerador de Certificados.

### Planilhas de exemplo

A pasta [`exemplos/`](exemplos/) tem planilhas para conferir o cálculo:

- `entrada_starters.xlsx`, `entrada_movers.xlsx`, `entrada_flyers.xlsx`: 17 crianças, cada uma com um tipo de nota (nota máxima, limites de cada faixa, zero, `z`, em branco, texto…).
- `entrada_com_erros.xlsx`: notas inválidas, para ver as mensagens de erro.
- `resumo_escudos.xlsx`: quantos escudos cada criança deve receber nas três provas, e as faixas de cada prova.

Para gerar de novo: `python3 exemplos/gerar_exemplos.py` (precisa do pacote `openpyxl`).

## 2. Gerador de Certificados

### Passo 1: Upload

Os dados já chegam carregados se você veio da Calculadora. Também aceita uma planilha de escudos no formato antigo: coluna A com o nome e colunas B, C e D com escudos de 1 a 5, ou `0` / `z` / em branco para zero.

O botão **Baixar planilha exemplo** baixa uma planilha de escudos com 5 alunos e escudos sorteados, para usar como modelo. Ela sempre traz um `z`, um `0` e uma célula em branco: se o aluno não tiver nota em uma avaliação, coloque Z, 0 ou deixe em branco, e ele fica sem escudo naquela avaliação.

### Passo 2: Visualização

- **Turma, Prova e Ano:** preencha a turma antes de baixar. O ano já vem com o ano atual. Quando os dados vêm da Calculadora, a prova fica travada (os escudos já foram calculados com ela); para mudar, envie a planilha de novo na Calculadora. Com a planilha no formato antigo, escolha a prova aqui.
- Fundos (em pé, proporção A4): `public/base.png` (STARTERS), `public/basemovers.jpg` (MOVERS) e `public/baseflyers.jpg` (FLYERS).
- Escudos: imagens em camadas sobre o fundo, em `public/overlays/`:
  - Coluna B (Reading/Writing): `B-1` a `B-5` e `B-z`
  - Coluna C (Listening): `C-1` a `C-5` e `C-z`
  - Coluna D (Speaking): `D-1` a `D-5` e `D-z`
- Nome do aluno em Helvetica.
- Os ajustes do nome e dos escudos ficam travados e só abrem com a senha de ajustes.

### Passo 3: Download

- Um PDF por aluno, com um certificado por página: A4 em pé, em alta resolução (cerca de 420 DPI, mais que a resolução das imagens de fundo).
- Nome de cada arquivo: `turma_Nome_Sobrenome_Prova_Ano.pdf`, por exemplo `121_Ana_Silva_Starters_2026.pdf`. Espaços viram `_`, e os caracteres que não podem estar em nome de arquivo (`/ \ : * ? " < > |`) são retirados. Dois alunos com o mesmo nome recebem `_2`, `_3`…
- Todos os PDFs vêm num único `.zip`, por exemplo `121_Starters_2026.zip`.

O código da geração está em `src/lib/certificateGenerator.ts`.

## 3. Engrenagem: troca das imagens

A engrenagem, no canto da página de certificados, abre a área para trocar os fundos e os escudos. Ela vem bloqueada e abre com a senha de ajustes até a página ser recarregada.

Envie imagens `.png` ou `.jpg`, várias de uma vez ou dentro de um `.zip`, com os mesmos nomes do site: `base`, `basemovers` e `baseflyers` para os fundos; `B-1`… `B-5` e `B-z` (ou `B-0`, que também troca a `B-z`), e o mesmo para `C-` e `D-`, para os escudos. A troca aparece na prévia e nos PDFs na hora.

Como o site não tem servidor, a troca vale só naquele navegador, até a página ser recarregada. Para trocar uma imagem de vez, substitua o arquivo em `public/` (ou `public/overlays/`) mantendo o mesmo nome e faça um novo commit.

## Limites

- Só planilhas `.xlsx` são aceitas.
- Fechar ou recarregar a página apaga os dados carregados, as imagens trocadas e trava de novo as áreas desbloqueadas.
