# SECRET OP v3 — Começa na Vila · 25 min de preparo · Luta final sem área

Add-on original para **Minecraft Bedrock** (celular, Windows, consoles) inspirado no desafio do vídeo
*"Minecraft, But One Block Secretly Drops OP Items.."* (canal Kiingtong). Código, texturas e sons foram criados do zero.

| Arquivo | Para que serve |
|---|---|
| `dist/SecretOP_v3_Mundo.mcworld` | **Mundo pronto.** Abre, monta a vila e o desafio começa sozinho. |
| `dist/SecretOP_v3_Drops_e_Pistas.mcaddon` | Os dois pacotes (BP + RP) para usar num mundo novo seu. |
| `dist/colecao_itens.png` | Prévia de todas as texturas. |

## O que mudou na v3 (pedido de ajustes)
| Pedido | Como ficou |
|---|---|
| Layout mais bonito e realista | Texturas em **resolução dobrada** com luz, volume e brilho. Armas redesenhadas em **64 px** com metal em degradê, madeira com veios, trilho, janela de ejeção e luneta. Machado em meia-lua, melancia com casca ondulada, armaduras 128×64 e Allay 64×64. |
| A gente começa na vila | Ao entrar, o jogo **procura uma vila de verdade** perto do spawn. Se não achar, tenta gerar uma vila do próprio jogo; se não conseguir, **constrói a vila do SECRET OP**: poço, sino, biblioteca com atril e lâmpada de redstone, ferreiro com mesa de ferraria, 4 casas, fazenda, postes de luz, aldeões, golem e gatos. Todos nascem nela. |
| Dicas em português do Brasil | Tudo em PT-BR: pistas, dicas, nomes dos itens, descrições, placas, avisos e HUD (**PISTA:**, **PRÓXIMA PISTA**, **PREPARO**, **LUTA FINAL**). |
| Quebrou, dropa itens OP | Quebre o bloco (ou derrote o mob) da pista: os **itens OP saltam do lugar**, com chance de **MAX DROPS**. |
| Sem botão | **Não existe mais Controle nem menu.** O desafio começa sozinho ao entrar no mundo e o inventário começa vazio. |
| Luta no final sem área | A **LUTA FINAL** acontece no mundo inteiro: sem arena, sem borda, sem teleporte. Vale fugir, se esconder ou ir ao Nether. A cada minuto o chat mostra a posição de cada sobrevivente, para ninguém se esconder para sempre. Último vivo vence. Sozinho, você enfrenta 3 ondas de Guardiões que nascem onde você estiver. |
| 25 minutos de preparo, sem exceção | O preparo dura **exatamente 25:00**. Não dá para pular, encerrar ou adiantar. O relógio aparece acima da hotbar, com avisos aos 20, 15, 10, 5 e 1 minuto e contagem dos últimos 10 s. Se as pistas acabarem antes, o tempo continua até 25:00. PvP fica **desligado no preparo** e liga na luta. |

## Como instalar
- **Android:** toque em `SecretOP_v3_Mundo.mcworld` → *Abrir com Minecraft*.
- **iPhone/iPad:** *Arquivos* → segure o arquivo → *Compartilhar* → *Minecraft*.
- **Windows:** dois cliques.
- Entre no mundo **"SECRET OP v3 - Vila"** e espere uns segundos: "Preparando a vila..." → apresentação → **VALENDO!**
- **Só o add-on:** importe o `.mcaddon`, crie um **mundo novo** e ative o *SECRET OP v3 | BP*. Não precisa de Experimentos.
- Já tinha a v2? A v3 usa os mesmos códigos de pacote e **substitui** a v2 ao importar.

## Como jogar
1. Você começa na vila. Uma **PISTA** aparece acima da hotbar, com 2 min para resolver. Na metade aparece uma **Dica**.
2. Quebre o bloco certo ou derrote o mob certo. Allay, gato, axolote e atril: interagir também vale.
3. Quem acertar primeiro faz os drops OP saltarem. O placar à direita conta as pistas de cada um.
4. Entre uma pista e outra, a barra **PRÓXIMA PISTA** enche em 10 s.
5. Aos **25:00** começa a **LUTA FINAL**, sem área.
6. Para jogar outra rodada (precisa de comandos, que já vêm ligados no mundo pronto):
```
/scriptevent secretop:reiniciar
```
Esse comando limpa os inventários e leva todos de volta à vila.

**Armas:** segure USAR para atirar • AGACHAR + USAR recarrega (gasta 1 Caixa de Munição) • tiro na cabeça = HEADSHOT.

<details><summary>Respostas das 22 pistas (spoiler)</summary>

Melancia · Cabra · Allay · TNT · Gato · Bloco de Neve · Escada de mão · Afogado · Mesa de Ferraria · Sino · Lula Brilhante · Pedregulho Musgoso · Pedra Luminosa · Axolote · Obsidiana Chorona · Abóbora Esculpida · Atril · Bloco de Ferro · Abelha · Teia · Vaso de Flor · Bloco de Mel
</details>

## O que foi verificado fora do jogo
- Os 46 arquivos de configuração (itens, bloco, criatura, armaduras, partículas, modelo, animações, sons, texturas e manifestos) passaram nos esquemas públicos do Bedrock, com **0 erros**.
- `main.js` checado com TypeScript contra as definições oficiais `@minecraft/server 2.0.0`.
- **Simulação de rodada completa** (`gerador/teste/simular.mjs`), com 32 verificações OK:
  - a vila é montada e o jogo começa sozinho, sem itens de botão;
  - o PvP fica desligado no preparo e a luta começa **exatamente aos 1500 s**;
  - 15 pistas foram resolvidas, com mais de 100 drops;
  - a luta não usa arena nem borda;
  - as 3 ondas de Guardiões vêm e a vitória é registrada;
  - o comando `/scriptevent` reinicia a rodada.

## O que NÃO foi testado
- **Não deu para abrir o Minecraft Bedrock real aqui.** Ninguém viu ainda o resultado rodando num aparelho.
- **Vila real ou gerada:** a busca por vila natural só olha os chunks carregados (cerca de 64 blocos). O comando `/place` pode não existir na sua versão; nesse caso o jogo constrói a vila do SECRET OP.
- **Terreno da vila construída:** a vila é aplainada num quadrado de 57×57 blocos. Em montanhas ou perto de água pode ficar com degraus nas bordas.
- **Portas e sinos:** os estados de bloco mudam entre versões. Se a porta falhar, fica só a passagem aberta.
- **Tiro automático:** se segurar USAR não funcionar no seu aparelho, cada toque dispara um tiro.
- **Mundo pronto:** o `.mcworld` vem sem a pasta `db/`; o terreno é gerado ao abrir.

## Como gerar de novo
```
cd gerador
python3 gerar.py && python3 validar.py && python3 colecao.py && node teste/simular.mjs
```
