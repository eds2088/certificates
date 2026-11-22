# SECRET OP v2 — Drops Secretos + 22 Pistas + Deathmatch

Add-on original para **Minecraft Bedrock** (celular, Windows, consoles) inspirado no desafio do vídeo
*"Minecraft, But One Block Secretly Drops OP Items.."* (canal Kiingtong). Todo o código, as texturas e os
sons foram criados do zero a partir do relatório do Mod Detector. Nada foi copiado do mod original do vídeo.

| Arquivo | Para que serve |
|---|---|
| `dist/SecretOP_v2_Mundo.mcworld` | **Mundo pronto**: abre já com os dois pacotes ativos, o lobby é construído sozinho e você recebe o Controle. |
| `dist/SecretOP_v2_Drops_e_Pistas.mcaddon` | Os dois pacotes (BP + RP) para colocar em qualquer mundo seu. |
| `dist/colecao_itens.png` | Prévia de todas as texturas (itens, armaduras, Allay, bloco). |
| `gerador/` | Scripts Python que geram tudo (texturas, sons, JSON, mundo), o validador e o simulador de partida. |
| `src/scripts/main.js` | Lógica do jogo (Script API estável). |

---

## 1. Revisão da versão do ChatGPT (v1) comparada com o Mod Detector

| # | O que o relatório/vídeo mostra | Como estava na v1 | Como ficou na v2 |
|---|---|---|---|
| 1 | **22 pistas** com textos próprios ("One block but many slices to share", "Don't turn your back near the cliff's edge"…) | 7 charadas inventadas | As **22 pistas na ordem do vídeo**, traduzidas. Você escolhe jogar 8, 12, 16 ou 22. |
| 2 | Cada pista tem **tempo**; se ninguém acerta, passa ("we missed one"). Entre pistas aparece **NEXT CLUE ----- 49%** | Sem tempo; a porcentagem era só o progresso | Tempo por pista (2 a 10 min), resposta revelada quando o tempo acaba, barra **NEXT CLUE** igual à do vídeo e **dica** na metade do tempo. |
| 3 | Os drops **saltam do bloco/mob** ("the drops went into the wall"), às vezes **MAX DROPS** | Iam direto para o inventário | Os itens saltam do local resolvido com partículas e som; 12% de chance de **MAX DROPS!** |
| 4 | Chat: *"Graser10 solved the clue! The answer was Cobweb"* | Mensagem genérica | "**Fulano resolveu a pista! A resposta era Teia**" (resposta em rosa, como no vídeo) + placar lateral de pistas por jogador. |
| 5 | TNT Cowl explode quando o jogador pega fogo | Usava `player.isOnFire`, que **não existe na API** → nunca explodia | Usa o componente `minecraft:onfire`; explode sem quebrar blocos, apaga o fogo e protege quem usa. |
| 6 | Totem Boost: "ganhe corações extras **carregando** este totem" + ícone com tempo | Só um item de usar | Carregar na hotbar/mão secundária dá **+4 corações**; usar dá 45 s de buffs com **contagem regressiva no HUD**. |
| 7 | Allay modificado **azul** (#3366FF, olhos #99CCFF), que busca itens | Allay normal do jogo + teleporte de itens | **Criatura própria** (modelo, textura, animação de flutuar/asas, ovo), invulnerável, segue o dono e voa até os itens para trazê-los. |
| 8 | Armas: rifle automático, pente de **31**, HUD "031" no canto, recarga | Som de explosão (`random.explode`), 1 tiro por toque | **Sons de tiro próprios** (sintetizados), tiro automático **segurando USAR**, flash, rastro de bala, **HEADSHOT** (×1,5), barra de recarga, HUD `▬▬ HK G3 Battle Rifle 031/31`. Mais pistola, escopeta (7 balins) e **M700 Sniper** (citada no vídeo). |
| 9 | Espada Syntaxium 30 de dano, lentidão, explosão visual | Parcial | 30 de dano, Lentidão II, explosão **só visual** + partículas roxas. |
| 10 | Machado Syntaxium: velocidade ao acertar e **derruba a árvore inteira** | Só fraqueza no alvo | Velocidade II ao acertar e **corta a árvore toda**. |
| 11 | Katanas 18 de dano; Yami's Katana "lança o jogador e o alvo para o ar"; katana para "zip across the world" | Efeitos diferentes | 18 de dano; Yami lança os dois para o ar; Katana de Netherita tem **investida** (USAR). |
| 12 | Netherite Leggings customizadas roxas com **Proteção IV e Inquebrável III** | "Calça Syntaxium" com invisibilidade (não existe no vídeo) | Calças roxas (#4B406A/#7E6EA8) já **encantadas**. |
| 13 | Creeper Shirt **+1 Armadura** | Dava velocidade | +1 de armadura, rosto de creeper no peito do modelo. |
| 14 | Armadura Syntaxium: velocidade e resistência, **acumulam** | Força + resistência no peito, pulo nas botas | Peitoral e botas dão Velocidade/Resistência e **acumulam** (I → II). Capacete Syntaxium (citado no vídeo) dá visão noturna; conjunto completo dá Força. |
| 15 | Atril que liga redstone ao virar a página | Só contava como pista | Vale virar a página **ou** quebrar; o lobby tem uma **demonstração atril + lâmpada de redstone** com livro no baú. |
| 16 | Deathmatch: contagem "Deathmatch: 27", "30 seconds until Deathmatch, get ready!", borda que encolhe | Arena de vidro criada na hora, borda invisível, sozinho não tinha luta | Mensagens do vídeo, contagem **3-2-1**, arena flutuante com lago e coberturas, **parede de partículas vermelhas** mostrando a borda, dano fora dela, espectador para eliminados, **modo solo com Guardiões**. |
| 17 | Bloco de Melancia que pede **picareta de ferro** | Sem exigência de ferramenta | Só solta drops com picareta de ferro/diamante/netherita. |
| 18 | Entrega de um `.mcworld` pronto | **Não havia** | `SecretOP_v2_Mundo.mcworld` com lobby, vitrine de armaduras e armas em suportes, placas e portal de descida. |
| 19 | Visual pixel-art de Minecraft | Ícones 128×128 "pintados"; armas cortadas | Pixel art 16×16 (armas 32×32) seguindo **exatamente as paletas hex das fichas**, armaduras 64×32 no layout vanilla. |
| 20 | — | Eventos duplicados (before + after) para atril/allay/axolote | Um único evento por ação. |

---

## 2. Como instalar

### Mundo pronto (recomendado)
- **Android:** baixe `SecretOP_v2_Mundo.mcworld` → toque no arquivo → *Abrir com Minecraft*. Ele aparece na lista de mundos.
- **iPhone/iPad:** app *Arquivos* → segure o arquivo → *Compartilhar* → *Minecraft*.
- **Windows:** dois cliques no arquivo.
- Entre no mundo **"SECRET OP v2 - Drops & Pistas"**. Em ~3 segundos o lobby roxo é construído no céu, você é levado para lá e recebe o **Controle do Desafio** e o **Diário de Pistas**.

### Só o add-on (num mundo seu)
1. Abra `SecretOP_v2_Drops_e_Pistas.mcaddon` com o Minecraft e espere "Importação concluída".
2. Crie um **mundo novo** → *Pacotes de comportamento* → ative **SECRET OP v2 … | BP** (o RP entra junto).
3. **Não precisa ativar Experimentos.**
4. Se você tinha a v1 instalada, **desative a v1** nesse mundo: as duas usam os mesmos IDs (`secretop:`).

### Realm
Abra o mundo pronto uma vez no seu aparelho; depois, no Realm: *Configurar Realm → Substituir mundo → escolha "SECRET OP v2"*.

---

## 3. Como jogar
1. Segure o **Controle do Desafio** e toque em **USAR** → menu → **▶ INICIAR DESAFIO** (em *Configurações*: nº de pistas, tempo, intervalo, duração do Deathmatch, manter inventário, treino).
2. Contagem **3-2-1** e todos descem para o mundo. Uma pista **CLUE:** aparece acima da hotbar.
3. **Quebre o bloco** ou **derrote o mob** da resposta. Allay, gato, axolote e atril: **interagir** também vale.
4. Quem resolver primeiro faz os **drops OP saltarem** do lugar. Placar à direita mostra quantas pistas cada um acertou.
5. Na metade do tempo aparece uma **Dica**. Se o tempo acabar, a resposta é revelada.
6. Depois da última pista: **30 segundos** e todos vão para a arena do **Deathmatch**. Último vivo vence. Sozinho, derrote os **Guardiões**.
7. No lobby: pise no **ouro** para descer; o Controle também tem "Ir para o lobby".

**Armas:** segure USAR para atirar (rifle é automático) • AGACHAR + USAR recarrega (gasta 1 Caixa de Munição) • tiro na cabeça = HEADSHOT.
**Maçã de Titânio:** seu próximo tiro explode. **Maçã Dourada Compactada:** Regeneração II, Absorção IV, Resistência.

### Pistas (SPOILER)
<details><summary>Mostrar as 22 respostas</summary>

1 Melancia · 2 Cabra · 3 Allay · 4 TNT · 5 Gato · 6 Bloco de Neve · 7 Escada de mão · 8 Afogado · 9 Mesa de Ferraria · 10 Sino · 11 Lula Brilhante · 12 Pedregulho Musgoso · 13 Pedra Luminosa · 14 Axolote · 15 Obsidiana Chorona · 16 Abóbora Esculpida · 17 Atril · 18 Bloco de Ferro · 19 Abelha · 20 Teia · 21 Vaso de Flor · 22 Bloco de Mel (sempre a última, como no vídeo)
</details>

### Comandos de emergência (o mundo pronto já vem com comandos ativados)
```
/give @s secretop:clue_remote
/give @s secretop:hk_g3_rifle
/give @s secretop:ammo_box 16
/give @s secretop:syntaxium_sword
/give @s secretop:totem_boost
```

---

## 4. O que foi verificado fora do jogo
- **Todos os 48 JSON** validados contra os esquemas públicos de Bedrock (Blockception) — itens, bloco, entidade, anexáveis, partículas, modelo, animações, manifestos, sons, atlas de texturas: **0 erros**.
- `main.js` checado com **TypeScript** contra as definições oficiais `@minecraft/server 2.0.0` e `@minecraft/server-ui 2.0.0` (toda função/evento usado existe com essa assinatura).
- **Simulação de partida completa** em Node com uma imitação da API (`gerador/teste/simular.mjs`): entrar → lobby → iniciar → 12 pistas resolvidas → drops → contagem → Deathmatch solo → tiros/HUD de munição → vitória → volta ao lobby. 24 verificações, todas OK.
- Validador próprio (`gerador/validar.py`): toda textura, som, geometria, animação, nome traduzido e ID usado pelo script existe; o `level.dat` é relido byte a byte.

## 5. O que NÃO foi testado (seja honesto com isso)
- **Não foi possível abrir o Minecraft Bedrock real neste ambiente.** Importação, renderização e comportamento no celular/Realm não foram vistos com os olhos.
- **Tiro automático segurando USAR** depende do item entrar em modo "usar" com `minecraft:use_modifiers`. Se no seu aparelho ele não segurar, cada toque ainda dispara (vira semiautomático).
- O `.mcworld` é gerado sem a pasta `db/` (o jogo cria o terreno ao abrir pela primeira vez). O `level.dat` foi escrito à mão no formato NBT do Bedrock; se a sua versão reclamar, use o `.mcaddon` num mundo novo.
- O lobby fica em **Y = 200** acima do ponto onde você nasce e a arena 52 blocos ao sul; tudo é construído por comandos no primeiro login.
- Volumes dos sons sintetizados e tamanhos das partículas podem precisar de ajuste.
- Não testado com outros add-ons de armas (podem conflitar).

## 6. Decisões tomadas onde o vídeo não mostrava (estimado)
- Dano das armas: rifle 8, pistola 7, escopeta 7×4, sniper 24 (headshot ×1,5). Pentes: 31 / 12 / 6 / 5.
- Heavy Syntaxium Sword: 36 de dano, Lentidão IV no alvo e deixa você mais lento enquanto segura.
- Syntaxium Axe 18 de dano; Laser Blade 20; katanas 18 (velocidade de ataque 2.5 aparece só na descrição — o Bedrock não tem recarga de ataque).
- Totem Boost V: +4 corações carregando; uso = 45 s de Absorção V, Força II, Resistência II, Velocidade II e Regeneração II.
- Texto da pista 11 (Lula Brilhante) não aparece no vídeo: foi criado.
- A explosão do TNT Cowl e do tiro explosivo **não quebra blocos** (para não destruir o lobby/arena).
- O ícone de efeito do Java (painel de efeitos com tempo) não existe no Bedrock: o tempo do Totem Boost aparece acima da hotbar e os efeitos reais aparecem no inventário.
- O rifle é um sprite 2D (o modelo 3D do vídeo exigiria testes de posicionamento que não puderam ser feitos aqui).

## 7. Como gerar de novo
```
cd gerador
python3 gerar.py        # gera build/ e dist/
python3 validar.py      # validações
python3 colecao.py      # prévia das texturas
node teste/simular.mjs  # simulação de partida
```
Requisitos: Python 3 com Pillow e numpy, ffmpeg (libvorbis) e Node 18+.
