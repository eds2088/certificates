/*
 * SECRET OP v3 — Drops Secretos + Pistas (adaptação original para Minecraft Bedrock)
 * Inspirado no desafio do vídeo "Minecraft, But One Block Secretly Drops OP Items.." (Kiingtong).
 * Todo o código, texturas e sons deste pacote foram criados do zero.
 *
 * Regras da v3:
 *  - sem botões: o desafio começa sozinho ao entrar no mundo, numa VILA;
 *  - 25 minutos de preparo, sem exceção (não dá para pular nem encerrar antes);
 *  - pistas em português; quem quebra o bloco/derrota o mob certo faz os drops OP saltarem;
 *  - no fim, LUTA FINAL sem área: vale ir para qualquer lugar. Último vivo vence.
 *
 * API: @minecraft/server 2.0.0 (estável, sem Experimentos).
 */
import {
  world, system, ItemStack, EquipmentSlot, GameMode, EntityDamageCause,
  EnchantmentTypes, DisplaySlotId, ObjectiveSortOrder, BlockVolume,
} from '@minecraft/server';

const NS = 'secretop:';
const PREP_SECS = 25 * 60;   // 25 minutos de preparo — fixo
const CLUE_SECS = 120;       // tempo máximo de cada pista
const GAP_SECS = 10;         // barra "PRÓXIMA PISTA"
const SOLO_WAVES = 3;

// ------------------------------------------------------------------ PISTAS
// As 22 pistas na ordem em que aparecem no vídeo. "kill" = matar o mob; "use" = interagir também vale.
const CLUES = [
  { riddle: 'Um bloco só, mas muitas fatias para dividir.', answer: 'Melancia', kind: 'block',
    targets: ['minecraft:melon_block', 'secretop:secret_melon'], hint: 'Selvas e algumas vilas de savana/acácia.',
    featured: ['compacted_golden_apple', 'eff5_pickaxe', 'sharp5_sword', 'totem_boost'] },
  { riddle: 'Não dê as costas perto da beira do penhasco.', answer: 'Cabra', kind: 'mob',
    targets: ['minecraft:goat'], hint: 'Mob dos picos nevados. Precisa derrotar.',
    featured: ['syntaxium_sword', 'hk_g3_rifle', 'ammo_box', 'syntaxium_helmet', 'elytra'] },
  { riddle: 'Seu pequeno ajudante pessoal que busca suas coisas.', answer: 'Allay', kind: 'mob', use: true,
    targets: ['minecraft:allay'], hint: 'Pequeno azul preso em postos de saqueadores e mansões.',
    featured: ['creeper_shirt', 'allay_whistle', 'netherite_katana', 'syntaxium_axe', 'combat_pistol'] },
  { riddle: 'Enterrado na areia do templo, espero o passo descuidado.', answer: 'TNT', kind: 'block',
    targets: ['minecraft:tnt'], hint: 'Embaixo do templo do deserto... ou faça com pólvora e areia.',
    featured: ['syntaxium_axe', 'netherite_leggings', 'totem_boost'] },
  { riddle: 'Os creepers fogem de mim.', answer: 'Gato', kind: 'mob', use: true,
    targets: ['minecraft:cat', 'minecraft:ocelot'], hint: 'Mora nas vilas (e os ocelotes, nas selvas).',
    featured: ['tnt_cowl', 'compacted_golden_apple', 'ammo_box'] },
  { riddle: 'Me compacte com o que cai no inverno.', answer: 'Bloco de Neve', kind: 'block',
    targets: ['minecraft:snow'], hint: '4 bolas de neve na mesa de trabalho.',
    featured: ['syntaxium_axe', 'titanium_apple'] },
  { riddle: 'Eu te faço subir sem um único pulo.', answer: 'Escada de Mão', kind: 'block',
    targets: ['minecraft:ladder'], hint: '7 gravetos. Coloque e quebre.',
    featured: ['netherite_katana', 'hk_g3_rifle', 'ammo_box', 'trident'] },
  { riddle: 'Antes eu andava pela terra, agora surjo das profundezas.', answer: 'Afogado', kind: 'mob',
    targets: ['minecraft:drowned'], hint: 'Zumbi da água: rios e oceanos à noite.',
    featured: ['scatter_shotgun', 'combat_pistol', 'ammo_box'] },
  { riddle: 'Traga-me um molde e sua armadura renasce.', answer: 'Mesa de Ferraria', kind: 'block',
    targets: ['minecraft:smithing_table'], hint: 'Vilas, ou 2 ferros + 4 tábuas.',
    featured: ['syntaxium_chestplate'] },
  { riddle: 'Salvo pelo...', answer: 'Sino', kind: 'block',
    targets: ['minecraft:bell'], hint: 'Fica no centro das vilas.',
    featured: ['syntaxium_boots', 'laser_blade', 'hk_g3_rifle'] },
  { riddle: 'Eu brilho no fundo das cavernas alagadas, mas não sou peixe.', answer: 'Lula Brilhante', kind: 'mob',
    targets: ['minecraft:glow_squid'], hint: 'Água escura subterrânea, abaixo de Y 30.',
    featured: ['tnt_cowl', 'fire_sword', 'ammo_box'] },
  { riddle: 'Pedras que as masmorras vestem com a idade.', answer: 'Pedregulho Musgoso', kind: 'block',
    targets: ['minecraft:mossy_cobblestone'], hint: 'Masmorras, templos da selva ou pedregulho + vinha/musgo.',
    featured: ['compacted_golden_apple', 'fire_sword'] },
  { riddle: 'Pó do Nether prensado em luz.', answer: 'Pedra Luminosa', kind: 'block',
    targets: ['minecraft:glowstone'], hint: 'Tetos do Nether.',
    featured: ['totem_boost', 'totem_of_undying'] },
  { riddle: 'Um bichinho fofo das cavernas, rosa ou azul, que você pega com balde.', answer: 'Axolote', kind: 'mob', use: true,
    targets: ['minecraft:axolotl'], hint: 'Cavernas exuberantes com água. Pegar com balde também vale.',
    featured: ['eff5_pickaxe', 'elytra', 'syntaxium_helmet'] },
  { riddle: 'Choro roxo, me abro, mas não viro portal.', answer: 'Obsidiana Chorona', kind: 'block',
    targets: ['minecraft:crying_obsidian'], hint: 'Portais em ruínas e bastiões.',
    featured: ['m700_sniper', 'ammo_box'] },
  { riddle: 'Me vista e os altos e escuros desviam o olhar.', answer: 'Abóbora Esculpida', kind: 'block',
    targets: ['minecraft:carved_pumpkin', 'minecraft:lit_pumpkin'], hint: 'Abóbora + tesoura.',
    featured: ['syntaxium_axe', 'netherite_leggings'] },
  { riddle: 'Vire a página, energize a redstone.', answer: 'Atril', kind: 'block', use: true,
    targets: ['minecraft:lectern'], hint: 'Bibliotecário da vila. Vire a página ou quebre.',
    featured: ['yami_katana', 'm700_sniper', 'compacted_golden_apple', 'totem_boost'] },
  { riddle: 'Empilhe o metal alto e um guardião pode surgir.', answer: 'Bloco de Ferro', kind: 'block',
    targets: ['minecraft:iron_block'], hint: '9 barras de ferro.',
    featured: ['titanium_apple', 'netherite_leggings', 'ammo_box'] },
  { riddle: 'Cuido das flores, mas pico uma vez e me vou.', answer: 'Abelha', kind: 'mob',
    targets: ['minecraft:bee'], hint: 'Florestas de bétula e campos de flores.',
    featured: ['maxed_boots', 'syntaxium_sword', 'combat_pistol'] },
  { riddle: 'Eu pego o que se move e o deixo lento como um rastejo.', answer: 'Teia', kind: 'block',
    targets: ['minecraft:web'], hint: 'Minas abandonadas.',
    featured: ['heavy_syntaxium_sword', 'netherite_ingot'] },
  { riddle: 'Uma casinha para uma única flor.', answer: 'Vaso de Flor', kind: 'block',
    targets: ['minecraft:flower_pot'], hint: '3 tijolos (argila cozida).',
    featured: ['laser_blade', 'compacted_golden_apple'] },
  { riddle: 'Deslize por mim e eu desacelero sua queda.', answer: 'Bloco de Mel', kind: 'block',
    targets: ['minecraft:honey_block'], hint: '4 garrafas de mel de uma colmeia.',
    featured: ['heavy_syntaxium_sword', 'ammo_box', 'totem_boost'] },
];

// ------------------------------------------------------------------ ITENS / LOOT
const LORE = {
  syntaxium_sword: ['§7Quando na mão principal:', '§2 30 Dano de Ataque', '§9Aplica Lentidão II', '§9Explosão visual ao acertar'],
  heavy_syntaxium_sword: ['§7Quando na mão principal:', '§2 36 Dano de Ataque', '§9Empurrão pesado + Lentidão IV', '§8Pesada: você fica mais lento'],
  syntaxium_axe: ['§7Quando na mão principal:', '§2 18 Dano de Ataque', '§9Ganha Velocidade ao acertar', '§9Derruba a árvore inteira'],
  netherite_katana: ['§7Quando na mão principal:', '§2 18 Dano de Ataque', '§2 2.5 Velocidade de Ataque', '§9USAR: investida rápida'],
  yami_katana: ['§7Lâmina empunhada por Yami', '§7Quando na mão principal:', '§2 18 Dano de Ataque', '§2 2.5 Velocidade de Ataque', '§9Lança você e o alvo para o ar'],
  laser_blade: ['§7Quando na mão principal:', '§2 20 Dano de Ataque', '§9Faíscas de laser'],
  hk_g3_rifle: ['§7Rifle de batalha automático', '§fPente: §e31', '§7SEGURE USAR: atirar', '§7AGACHAR + USAR: recarregar'],
  combat_pistol: ['§7Pistola semiautomática', '§fPente: §e12', '§7AGACHAR + USAR: recarregar'],
  scatter_shotgun: ['§7Escopeta: 7 balins', '§fPente: §e6', '§7AGACHAR + USAR: recarregar'],
  m700_sniper: ['§7Fuzil de precisão', '§fPente: §e5', '§7Tiro na cabeça: dano x1.5'],
  ammo_box: ['§7Cada caixa enche um pente'],
  totem_boost: ['§cTotem Boost V', '§7Carregue para ganhar §c+4 corações', '§7USAR: 45s de Absorção, Força,', '§7Resistência, Velocidade e Regeneração'],
  tnt_cowl: ['§9+1 Armadura', '§cExplode se você pegar fogo'],
  syntaxium_helmet: ['§9+3 Armadura', '§7Visão noturna e respiração aquática'],
  syntaxium_chestplate: ['§9+8 Armadura', '§7Ganha Velocidade e Resistência'],
  syntaxium_boots: ['§9+3 Armadura', '§7Ganha Velocidade e Resistência', '§7(acumula com o peitoral)'],
  netherite_leggings: ['§9+6 Armadura', '§7Inquebrável III', '§7Proteção IV'],
  creeper_shirt: ['§9+1 Armadura', '§aEstilo Creeper'],
  compacted_golden_apple: ['§7Regeneração II por 10s', '§7Absorção IV e Resistência'],
  titanium_apple: ['§7Seu próximo tiro explode!'],
  allay_whistle: ['§7Invoca um Allay ajudante', '§7que busca os itens para você'],
};

const VANILLA_EXTRAS = {
  eff5_pickaxe: { id: 'minecraft:netherite_pickaxe', name: '§bPicareta OP', ench: [['efficiency', 5], ['unbreaking', 3], ['fortune', 3]] },
  sharp5_sword: { id: 'minecraft:diamond_sword', name: '§bEspada Afiada', ench: [['sharpness', 5], ['unbreaking', 3]] },
  fire_sword: { id: 'minecraft:diamond_sword', name: '§6Espada de Fogo', ench: [['fire_aspect', 2], ['sharpness', 3]] },
  maxed_boots: { id: 'minecraft:diamond_boots', name: '§bBotas Maximizadas', ench: [['mending', 1], ['unbreaking', 3], ['protection', 4], ['feather_falling', 4], ['depth_strider', 3]] },
  elytra: { id: 'minecraft:elytra' },
  trident: { id: 'minecraft:trident', ench: [['loyalty', 3], ['impaling', 3]] },
  netherite_ingot: { id: 'minecraft:netherite_ingot', amount: 2 },
  totem_of_undying: { id: 'minecraft:totem_of_undying' },
  golden_apples: { id: 'minecraft:golden_apple', amount: 4 },
  ender_pearls: { id: 'minecraft:ender_pearl', amount: 4 },
  diamonds: { id: 'minecraft:diamond', amount: 6 },
  bow: { id: 'minecraft:bow', ench: [['power', 4], ['infinity', 1]] },
  arrows: { id: 'minecraft:arrow', amount: 16 },
  food: { id: 'minecraft:cooked_beef', amount: 16 },
  xp: { id: 'minecraft:experience_bottle', amount: 16 },
  shield: { id: 'minecraft:shield' },
};

const RANDOM_POOL = [
  ['syntaxium_sword', 2], ['heavy_syntaxium_sword', 1], ['syntaxium_axe', 2], ['netherite_katana', 2], ['yami_katana', 1],
  ['laser_blade', 2], ['hk_g3_rifle', 2], ['combat_pistol', 3], ['scatter_shotgun', 2], ['m700_sniper', 1],
  ['ammo_box', 6], ['totem_boost', 3], ['tnt_cowl', 2], ['syntaxium_helmet', 2], ['syntaxium_chestplate', 2],
  ['syntaxium_boots', 2], ['netherite_leggings', 2], ['creeper_shirt', 2], ['compacted_golden_apple', 3],
  ['titanium_apple', 2], ['allay_whistle', 1],
  ['eff5_pickaxe', 2], ['sharp5_sword', 2], ['fire_sword', 1], ['maxed_boots', 1], ['elytra', 1], ['trident', 1],
  ['netherite_ingot', 1], ['totem_of_undying', 1], ['golden_apples', 4], ['ender_pearls', 3], ['diamonds', 3],
  ['bow', 2], ['arrows', 3], ['food', 4], ['xp', 3], ['shield', 2],
];

function makeItem(key) {
  const extra = VANILLA_EXTRAS[key];
  let stack;
  if (extra) {
    stack = new ItemStack(extra.id, extra.amount ?? 1);
    if (extra.name) stack.nameTag = extra.name;
    if (extra.ench) enchant(stack, extra.ench);
  } else {
    stack = new ItemStack(NS + key, key === 'ammo_box' ? 3 : 1);
    if (LORE[key]) { try { stack.setLore(LORE[key]); } catch { /* lore opcional */ } }
    if (key === 'netherite_leggings') enchant(stack, [['protection', 4], ['unbreaking', 3]]);
  }
  return stack;
}

function enchant(stack, list) {
  try {
    const comp = stack.getComponent('minecraft:enchantable');
    if (!comp) return;
    for (const [id, level] of list) {
      try {
        const type = EnchantmentTypes.get(id);
        if (type) comp.addEnchantment({ type, level });
      } catch { /* encantamento incompatível com o item */ }
    }
  } catch { /* sem componente */ }
}

function rollPool() {
  const total = RANDOM_POOL.reduce((s, [, w]) => s + Number(w), 0);
  let r = Math.random() * total;
  for (const [k, w] of RANDOM_POOL) { if ((r -= Number(w)) <= 0) return String(k); }
  return 'ammo_box';
}

// ------------------------------------------------------------------ ESTADO
let S = null;
function freshState(village = null) {
  return {
    phase: 'setup', prepLeft: PREP_SECS, introLeft: 0,
    clue: { pos: 0, mode: 'gap', left: GAP_SECS, total: GAP_SECS },
    log: [], village, alive: [], solo: false, wave: 0, waveDelay: 0, winner: '', round: 1,
  };
}
function load() {
  try {
    const raw = world.getDynamicProperty(NS + 'state');
    S = raw ? { ...freshState(), ...JSON.parse(String(raw)) } : freshState();
  } catch { S = freshState(); }
}
function save() { try { world.setDynamicProperty(NS + 'state', JSON.stringify(S)); } catch { /* */ } }
const currentClue = () => (S.phase === 'prep' && S.clue.mode !== 'done') ? CLUES[S.clue.pos] : undefined;
const clueActive = () => S.phase === 'prep' && S.clue.mode === 'clue';

// ------------------------------------------------------------------ UTILITÁRIOS
const tick = () => system.currentTick;
const players = () => world.getPlayers();
const say = (m) => { try { world.sendMessage(m); } catch { /* */ } };
const tell = (p, m) => { try { p.sendMessage(m); } catch { /* */ } };
const sfx = (p, id, pitch = 1, volume = 1) => { try { p.playSound(id, { pitch, volume }); } catch { /* */ } };
const wsfx = (dim, id, loc, pitch = 1, volume = 1) => { try { dim.playSound(id, loc, { pitch, volume }); } catch { /* */ } };
const fx = (dim, id, loc) => { try { dim.spawnParticle(id, loc); } catch { /* */ } };
const cmd = (dim, c) => { try { return dim.runCommand(c).successCount > 0; } catch { return false; } };
const effect = (e, id, dur, amp = 0, particles = false) => { try { e.addEffect(id, dur, { amplifier: amp, showParticles: particles }); } catch { /* */ } };
const title = (p, t, sub = '', stay = 50) => {
  try { p.onScreenDisplay.setTitle(t, { subtitle: sub, fadeInDuration: 4, stayDuration: stay, fadeOutDuration: 10 }); } catch { /* */ }
};
const mmss = (s) => { s = Math.max(0, Math.ceil(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const norm = (v) => { const l = Math.hypot(v.x, v.y, v.z) || 1; return { x: v.x / l, y: v.y / l, z: v.z / l }; };
const inv = (p) => { try { return p.getComponent('minecraft:inventory')?.container; } catch { return undefined; } };
const heldItem = (p) => { try { return inv(p)?.getItem(p.selectedSlotIndex); } catch { return undefined; } };
const equip = (p, slot) => { try { return p.getComponent('minecraft:equippable')?.getEquipment(slot); } catch { return undefined; } };
const cooldowns = new Map();
function ready(p, key, ticks) {
  const k = p.id + key; const last = cooldowns.get(k) ?? -1e9;
  if (tick() - last < ticks) return false;
  cooldowns.set(k, tick()); return true;
}
function give(p, stack) {
  try {
    const c = inv(p);
    const left = c ? c.addItem(stack) : stack;
    if (left) p.dimension.spawnItem(left, p.location);
  } catch { /* */ }
}
function countItem(p, id) {
  const c = inv(p); let n = 0; if (!c) return 0;
  for (let i = 0; i < c.size; i++) { const it = c.getItem(i); if (it?.typeId === id) n += it.amount; }
  return n;
}
function takeItem(p, id, amount = 1) {
  const c = inv(p); if (!c) return false;
  for (let i = 0; i < c.size && amount > 0; i++) {
    const it = c.getItem(i);
    if (it?.typeId !== id) continue;
    const take = Math.min(amount, it.amount); amount -= take;
    if (it.amount - take <= 0) c.setItem(i, undefined); else { it.amount -= take; c.setItem(i, it); }
  }
  return amount <= 0;
}
// ------------------------------------------------------------------ PLACAR (lateral direita)
function board() {
  try {
    return world.scoreboard.getObjective('secretop_pistas') ?? world.scoreboard.addObjective('secretop_pistas', '§e§lSECRET OP §r§7pistas');
  } catch { return undefined; }
}
function showBoard() {
  try {
    const o = board(); if (!o) return;
    world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, { objective: o, sortOrder: ObjectiveSortOrder.Descending });
    for (const p of players()) if (o.getScore(p) === undefined) o.setScore(p, 0);
  } catch { /* */ }
}
function resetBoard() {
  try { const o = board(); if (o) for (const pt of o.getParticipants()) o.removeParticipant(pt); } catch { /* */ }
  showBoard();
}

// ------------------------------------------------------------------ FLUXO
const overworld = () => world.getDimension('overworld');

function beginIntro() {
  S.phase = 'intro'; S.introLeft = 14; S.prepLeft = PREP_SECS;
  S.clue = { pos: 0, mode: 'gap', left: GAP_SECS, total: GAP_SECS };
  S.log = []; S.alive = []; S.wave = 0; S.winner = ''; save();
  resetBoard();
  cmd(overworld(), 'gamerule pvp false');
  cmd(overworld(), 'gamerule keepinventory true');
  for (const p of players()) toVillage(p);
}

function introSecond() {
  const msgs = {
    13: ['§l§dSECRET OP', '§fVocê começou na §avila§f!'],
    10: ['§e25 minutos', '§fde preparo — sem exceção'],
    7: ['§6PISTAS', '§fQuebre o bloco ou derrote o mob certo'],
    4: ['§bDROPS OP', '§fsaltam de quem acertar primeiro'],
    2: ['§cLUTA FINAL', '§fno fim, sem área: vale ir a qualquer lugar'],
  };
  const m = msgs[S.introLeft];
  if (m) for (const p of players()) { title(p, m[0], m[1], 50); sfx(p, 'note.pling', 0.9 + S.introLeft / 30); }
  if (S.introLeft <= 0) {
    S.phase = 'prep'; save();
    say('§d[SECRET OP] §aVALENDO! §f25:00 de preparo começaram. Pistas em instantes...');
    for (const p of players()) { title(p, '§a§lVALENDO!', '§f25:00 de preparo', 40); sfx(p, 'random.levelup'); }
  }
}

function prepSecond() {
  S.prepLeft--;
  const left = S.prepLeft;
  if ([1200, 900, 600, 300, 60].includes(left)) {
    const min = left / 60;
    say(`§e⏳ Faltam §l${min} minuto${min > 1 ? 's' : ''}§r§e para a LUTA FINAL!`);
    for (const p of players()) { title(p, ' ', `§eFaltam ${min} min para a luta`, 30); sfx(p, 'note.bell', 1.2); }
  }
  if (left <= 10 && left > 0) for (const p of players()) { title(p, `§c${left}`, '§fLUTA FINAL', 14); sfx(p, 'note.hat', 1.5); }
  if (left <= 0) { startFight(); return; }
  // máquina das pistas (só durante o preparo)
  const c = S.clue;
  if (c.mode === 'done') return;
  c.left--;
  if (c.mode === 'gap' && c.left <= 0) beginClue();
  else if (c.mode === 'clue' && c.left === Math.floor(c.total / 2)) say(`§8[Dica] §7${CLUES[c.pos].hint}`);
  else if (c.mode === 'clue' && c.left <= 0) expireClue();
}

function beginClue() {
  const k = CLUES[S.clue.pos];
  S.clue.mode = 'clue'; S.clue.left = CLUE_SECS; S.clue.total = CLUE_SECS; save();
  say(`§6§lPISTA ${S.clue.pos + 1}: §r§f${k.riddle}`);
  for (const p of players()) { title(p, `§6PISTA ${S.clue.pos + 1}`, `§f${k.riddle}`, 70); sfx(p, 'note.pling', 1.4); }
}

function nextClue() {
  S.clue.pos++;
  if (S.clue.pos >= CLUES.length) {
    S.clue.mode = 'done'; save();
    say('§eTodas as pistas acabaram! Use o tempo que resta para se preparar para a §cLUTA FINAL§e.');
  } else {
    S.clue.mode = 'gap'; S.clue.left = GAP_SECS; S.clue.total = GAP_SECS; save();
  }
}

function solve(p, loc) {
  if (!clueActive()) return;
  const k = CLUES[S.clue.pos];
  try { board()?.addScore(p, 1); } catch { /* */ }
  S.log.push({ i: S.clue.pos, by: p.name });
  say(`§a${p.name} §fresolveu a pista! A resposta era §d${k.answer}`);
  for (const q of players()) {
    if (q.id === p.id) { title(q, '§aPISTA RESOLVIDA!', `§fA resposta era §d${k.answer}`, 50); sfx(q, 'random.levelup'); }
    else { title(q, `§c${p.name} resolveu!`, `§fA resposta era §d${k.answer}`, 40); sfx(q, 'note.bass', 0.7); }
  }
  dropRewards(p, loc, k);
  nextClue();
}

function expireClue() {
  const k = CLUES[S.clue.pos];
  S.log.push({ i: S.clue.pos, by: '' });
  say(`§7Ninguém resolveu a tempo! A resposta era §d${k.answer}`);
  for (const p of players()) sfx(p, 'note.bass', 0.5);
  nextClue();
}

function dropRewards(p, loc, clue) {
  const keys = [...clue.featured];
  const max = clue.extra === undefined && Math.random() < 0.12;
  const extra = clue.extra ?? (2 + Math.floor(Math.random() * 3) + (max ? 4 : 0));
  for (let i = 0; i < extra; i++) keys.push(rollPool());
  const dim = p.dimension;
  const at = loc && dist(loc, p.location) < 10 ? { x: loc.x, y: loc.y + 0.6, z: loc.z } : { x: p.location.x, y: p.location.y + 1.2, z: p.location.z };
  fx(dim, 'secretop:op_burst', at); fx(dim, 'minecraft:totem_particle', at);
  wsfx(dim, 'random.totem', at, 1.2, 0.7);
  keys.forEach((k, i) => system.runTimeout(() => {
    try {
      const e = dim.spawnItem(makeItem(k), at);
      const a = Math.random() * Math.PI * 2;
      e.applyImpulse({ x: Math.cos(a) * 0.18, y: 0.32 + Math.random() * 0.12, z: Math.sin(a) * 0.18 });
      wsfx(dim, 'random.pop', at, 0.8 + Math.random() * 0.6, 0.6);
    } catch { give(p, makeItem(k)); }
  }, i * 3));
  if (max) { title(p, '§6§lMAX DROPS!', `§e${keys.length} itens OP`, 40); say(`§6${p.name} conseguiu MAX DROPS!`); }
}

// ------------------------------------------------------------------ LUTA FINAL (sem área)
function startFight() {
  const list = players().filter((p) => p.getGameMode() !== GameMode.Spectator && p.getGameMode() !== GameMode.Creative);
  S.phase = 'fight'; S.alive = list.map((p) => p.id); S.solo = list.length <= 1; S.wave = 0; S.waveDelay = 4; S.winner = ''; save();
  cmd(overworld(), 'gamerule pvp true');
  say('§c§lLUTA FINAL! §r§fSem área e sem borda: vale ir para qualquer lugar. Último vivo vence!');
  for (const p of players()) { title(p, '§c§lLUTA FINAL!', '§fSem área — vá para onde quiser!', 60); sfx(p, 'mob.wither.spawn', 1, 0.5); }
  if (S.solo) say('§7Modo solo: sobreviva a §c3 ondas de Guardiões§7 que vão te caçar onde você estiver.');
}

function spawnWave(p) {
  S.wave++;
  const dim = p.dimension;
  const pool = ['minecraft:vindicator', 'minecraft:zombie', 'minecraft:skeleton', 'minecraft:pillager', 'minecraft:husk', 'minecraft:stray'];
  const n = 2 + S.wave * 2;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = 9 + Math.random() * 6;
    const x = p.location.x + Math.cos(a) * r, z = p.location.z + Math.sin(a) * r;
    let y = p.location.y;
    try { const top = dim.getTopmostBlock({ x, z }); if (top && Math.abs(top.location.y - p.location.y) < 12) y = top.location.y + 1; } catch { /* */ }
    try {
      const e = dim.spawnEntity(pool[(i + S.wave) % pool.length], { x, y, z });
      e.addTag(NS + 'dm_mob'); e.nameTag = `§cGuardião ${S.wave}`;
    } catch { /* */ }
  }
  say(`§cOnda ${S.wave}/${SOLO_WAVES}: ${n} Guardiões estão vindo!`);
  title(p, `§cONDA ${S.wave}`, `§f${n} Guardiões`, 30);
  save();
}

function fightSecond() {
  const alive = players().filter((p) => S.alive.includes(p.id));
  if (alive.length === 0) return finish(undefined);
  if (S.solo) {
    let left = 0;
    try { left = overworld().getEntities({ tags: [NS + 'dm_mob'] }).length; } catch { /* */ }
    for (const d of ['nether', 'the_end']) { try { left += world.getDimension(d).getEntities({ tags: [NS + 'dm_mob'] }).length; } catch { /* */ } }
    if (left === 0) {
      if (S.wave >= SOLO_WAVES) return finish(alive[0]);
      if (--S.waveDelay <= 0) { spawnWave(alive[0]); S.waveDelay = 8; }
    }
  } else {
    if (alive.length === 1) return finish(alive[0]);
    S.fightSecs = (S.fightSecs ?? 0) + 1;
    if (S.fightSecs % 60 === 0) {
      say('§7📍 Posições: ' + alive.map((p) => `§f${p.name} §7(${Math.round(p.location.x)}, ${Math.round(p.location.z)})`).join(' §8| '));
    }
  }
}

function finish(winner) {
  S.phase = 'finished'; S.winner = winner?.name ?? ''; save();
  try { for (const e of overworld().getEntities({ tags: [NS + 'dm_mob'] })) e.remove(); } catch { /* */ }
  cmd(overworld(), 'gamerule pvp true');
  if (winner) {
    say(`§6§l${winner.name} VENCEU O SECRET OP!`);
    for (const p of players()) { title(p, p.id === winner.id ? '§6§lVOCÊ VENCEU!' : `§6${winner.name} venceu!`, '§eGG!', 100); sfx(p, 'random.totem'); }
    for (let i = 0; i < 6; i++) system.runTimeout(() => { try { fx(winner.dimension, 'minecraft:totem_particle', winner.location); } catch { /* */ } }, i * 6);
  } else say('§7A luta final terminou sem vencedor.');
  say('§8Para jogar outra rodada, digite: §f/scriptevent secretop:reiniciar');
}

function restartRound() {
  for (const p of players()) {
    try {
      p.setGameMode(GameMode.Survival);
      cmd(p, 'clear @s'); cmd(p, 'effect @s clear'); cmd(p, 'effect @s instant_health 1 20 true');
    } catch { /* */ }
  }
  try { for (const e of overworld().getEntities({ tags: [NS + 'dm_mob'] })) e.remove(); } catch { /* */ }
  const v = S.village; const round = (S.round ?? 1) + 1;
  S = freshState(v); S.round = round;
  say(`§d[SECRET OP] §fNova rodada (§e${round}§f)! Todos de volta para a vila.`);
  beginIntro();
}

// ------------------------------------------------------------------ VILA INICIAL
// 1) procura uma vila natural perto do spawn (sino); 2) tenta gerar uma vila do jogo com /place;
// 3) se nada der certo, constrói a vila do SECRET OP (casas, poço, sino, fazenda, biblioteca, ferreiro).
const SOLID_SKIP = /(air|leaves|log|vine|tallgrass|short_grass|tall_grass|fern|flower|snow_layer|double_plant|sapling|bush|water|kelp|seagrass)/;

function groundY(dim, x, z) {
  try {
    const top = dim.getTopmostBlock({ x, z });
    if (!top) return undefined;
    let y = top.location.y;
    for (let i = 0; i < 40; i++) {
      const b = dim.getBlock({ x, y, z });
      if (!b) return undefined;
      if (!SOLID_SKIP.test(b.typeId)) return y + 1;
      y--;
    }
    return top.location.y + 1;
  } catch { return undefined; }
}

function findBell(dim, center, radius, done) {
  const tiles = [];
  for (let dx = -radius; dx < radius; dx += 16) for (let dz = -radius; dz < radius; dz += 16) tiles.push([dx, dz]);
  tiles.sort((a, b) => Math.hypot(...a) - Math.hypot(...b));
  let i = 0;
  const h = system.runInterval(() => {
    for (let k = 0; k < 4 && i < tiles.length; k++, i++) {
      const [dx, dz] = tiles[i];
      const from = { x: center.x + dx, y: center.y - 20, z: center.z + dz };
      const to = { x: center.x + dx + 15, y: center.y + 30, z: center.z + dz + 15 };
      try {
        const vol = new BlockVolume(from, to);
        if (dim.containsBlock(vol, { includeTypes: ['minecraft:bell'] })) {
          const it = dim.getBlocks(vol, { includeTypes: ['minecraft:bell'] }).getBlockLocationIterator();
          const r = it.next();
          if (!r.done) { system.clearRun(h); done(r.value); return; }
        }
      } catch { /* chunk não carregado */ }
    }
    if (i >= tiles.length) { system.clearRun(h); done(undefined); }
  }, 1);
}

function setupVillage(p) {
  if (S.phase !== 'setup' || S.settingUp) return;
  S.settingUp = true;
  const dim = overworld();
  const cx = Math.floor(p.location.x), cz = Math.floor(p.location.z);
  const gy = groundY(dim, cx, cz) ?? Math.floor(p.location.y);
  title(p, '§dSECRET OP', '§7Preparando a vila...', 80);
  findBell(dim, { x: cx, y: gy, z: cz }, 64, (bell) => {
    if (bell) return useVillage({ x: bell.x, y: bell.y, z: bell.z }, 'natural');
    const placed = ['village_plains', 'minecraft:village_plains'].some((n) => cmd(dim, `place structure ${n} ${cx} ${gy} ${cz}`));
    if (!placed) return useVillage(buildVillage(dim, cx, gy, cz), 'construída');
    system.runTimeout(() => findBell(dim, { x: cx, y: gy, z: cz }, 48, (b2) => {
      useVillage(b2 ? { x: b2.x, y: b2.y, z: b2.z } : buildVillage(dim, cx, gy, cz), b2 ? 'gerada' : 'construída');
    }), 40);
  });
}

function useVillage(center, kind) {
  const dim = overworld();
  const y = groundY(dim, center.x + 2, center.z + 2) ?? center.y;
  S.village = { x: center.x + 2, y, z: center.z + 2, kind };
  S.settingUp = false;
  try { world.setDefaultSpawnLocation({ x: S.village.x, y: S.village.y, z: S.village.z }); } catch { /* */ }
  if (kind !== 'construída') populate(dim, center, 0);
  beginIntro();
}

function toVillage(p) {
  const v = S.village; if (!v) return;
  try {
    p.teleport({ x: v.x + 0.5 + (Math.random() * 4 - 2), y: v.y + 0.2, z: v.z + 0.5 + (Math.random() * 4 - 2) }, { dimension: overworld() });
    effect(p, 'resistance', 100, 4);
  } catch { /* */ }
}

function populate(dim, c, gy) {
  const y = gy || c.y;
  const spawn = (id, dx, dz, name) => { try { const e = dim.spawnEntity(id, { x: c.x + dx + 0.5, y: y + 0.2, z: c.z + dz + 0.5 }); if (name) e.nameTag = name; } catch { /* */ } };
  for (const [dx, dz] of [[4, 3], [-4, 3], [3, -4], [-3, -5], [6, 0], [-6, 1]]) spawn('minecraft:villager_v2', dx, dz);
  spawn('minecraft:iron_golem', 0, 7);
  spawn('minecraft:cat', 5, 5); spawn('minecraft:cat', -5, -6);
  for (const [dx, dz] of [[-9, 9], [-11, 10], [-8, 12]]) spawn('minecraft:chicken', dx, dz);
}

function buildVillage(dim, cx, gy, cz) {
  const F = (x1, y1, z1, x2, y2, z2, b) => cmd(dim, `fill ${x1} ${y1} ${z1} ${x2} ${y2} ${z2} ${b}`);
  const B = (x, y, z, ...opts) => opts.some((b) => cmd(dim, `setblock ${x} ${y} ${z} ${b}`));
  const R = 28;
  // terreno plano
  for (const [a, b] of [[0, 7], [8, 15], [16, 23]]) F(cx - R, gy + a, cz - R, cx + R, gy + b, cz + R, 'air');
  F(cx - R, gy - 4, cz - R, cx + R, gy - 2, cz + R, 'dirt');
  F(cx - R, gy - 1, cz - R, cx + R, gy - 1, cz + R, 'grass_block');
  // ruas em cruz
  F(cx - R, gy - 1, cz - 1, cx + R, gy - 1, cz + 1, 'grass_path');
  F(cx - 1, gy - 1, cz - R, cx + 1, gy - 1, cz + R, 'grass_path');
  // praça e poço
  F(cx - 4, gy - 1, cz - 4, cx + 4, gy - 1, cz + 4, 'grass_path');
  F(cx - 2, gy - 4, cz - 2, cx + 2, gy, cz + 2, 'cobblestone');
  F(cx - 1, gy - 3, cz - 1, cx + 1, gy - 1, cz + 1, 'water');
  F(cx - 1, gy, cz - 1, cx + 1, gy, cz + 1, 'air');
  for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) F(cx + dx, gy + 1, cz + dz, cx + dx, gy + 2, cz + dz, 'oak_fence');
  F(cx - 2, gy + 3, cz - 2, cx + 2, gy + 3, cz + 2, 'cobblestone');
  B(cx, gy + 4, cz, 'lantern');
  // sino da vila (pista "Salvo pelo...")
  B(cx + 4, gy - 1, cz + 4, 'polished_andesite');
  B(cx + 4, gy, cz + 4, 'bell ["attachment"="standing"]', 'bell');
  // postes de luz
  for (const [dx, dz] of [[8, 3], [-8, -3], [16, -3], [-16, 3], [3, 10], [-3, -10], [3, -18], [-3, 18], [22, 3], [-22, -3]]) {
    F(cx + dx, gy, cz + dz, cx + dx, gy + 2, cz + dz, 'oak_fence');
    B(cx + dx, gy + 3, cz + dz, 'lantern');
  }
  // casas: [x0, z0, x1, z1, porta ('S' ou 'N'), tipo, parede, telhado]
  const houses = [
    [6, -15, 14, -8, 'S', 'biblioteca', 'oak_planks', 'dark_oak_planks'],
    [-14, -15, -6, -8, 'S', 'ferreiro', 'cobblestone', 'stone_bricks'],
    [17, -13, 23, -7, 'S', 'casa', 'birch_planks', 'spruce_planks'],
    [-23, -13, -17, -7, 'S', 'casa', 'spruce_planks', 'dark_oak_planks'],
    [6, 8, 12, 14, 'N', 'casa', 'oak_planks', 'spruce_planks'],
    [16, 8, 22, 14, 'N', 'casa', 'birch_planks', 'dark_oak_planks'],
  ];
  const chests = [];
  for (const [ax0, az0, ax1, az1, door, type, wall, roof] of houses) {
    const x0 = cx + ax0, z0 = cz + az0, x1 = cx + ax1, z1 = cz + az1, h = 4;
    F(x0, gy - 1, z0, x1, gy - 1, z1, 'cobblestone');
    F(x0 + 1, gy - 1, z0 + 1, x1 - 1, gy - 1, z1 - 1, type === 'ferreiro' ? 'stone_bricks' : 'oak_planks');
    F(x0, gy, z0, x1, gy + h - 1, z1, wall);
    F(x0 + 1, gy, z0 + 1, x1 - 1, gy + h - 1, z1 - 1, 'air');
    for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) F(x, gy, z, x, gy + h - 1, z, 'oak_log');
    F(x0, gy + h - 1, z0, x1, gy + h - 1, z0, 'stripped_oak_log'); F(x0, gy + h - 1, z1, x1, gy + h - 1, z1, 'stripped_oak_log');
    // janelas
    const mz = Math.floor((z0 + z1) / 2), mx = Math.floor((x0 + x1) / 2);
    F(x0, gy + 1, mz, x0, gy + 2, mz, 'glass_pane'); F(x1, gy + 1, mz, x1, gy + 2, mz, 'glass_pane');
    const back = door === 'S' ? z0 : z1, front = door === 'S' ? z1 : z0;
    F(mx - 2, gy + 1, back, mx - 2, gy + 2, back, 'glass_pane'); F(mx + 2, gy + 1, back, mx + 2, gy + 2, back, 'glass_pane');
    B(mx - 2, gy + 1, front, 'glass_pane'); B(mx + 2, gy + 1, front, 'glass_pane');
    // telhado em degraus
    for (let i = 0; ; i++) {
      const a = x0 - 1 + i, b = x1 + 1 - i, c = z0 - 1 + i, d = z1 + 1 - i;
      if (a > b || c > d) break;
      F(a, gy + h + i, c, b, gy + h + i, d, roof);
      if (a + 1 <= b - 1 && c + 1 <= d - 1) F(a + 1, gy + h + i, c + 1, b - 1, gy + h + i, d - 1, i === 0 ? 'air' : roof);
    }
    F(x0 + 1, gy + h, z0 + 1, x1 - 1, gy + h, z1 - 1, wall === 'cobblestone' ? 'stone_bricks' : 'oak_planks');
    // porta e caminho até a rua
    F(mx, gy, front, mx, gy + 1, front, 'air');
    const dir = door === 'S' ? 'south' : 'north', dnum = door === 'S' ? 1 : 3;
    B(mx, gy, front, `oak_door ["minecraft:cardinal_direction"="${dir}","upper_block_bit"=false]`, `oak_door ["direction"=${dnum},"upper_block_bit"=false]`);
    B(mx, gy + 1, front, `oak_door ["minecraft:cardinal_direction"="${dir}","upper_block_bit"=true]`, `oak_door ["direction"=${dnum},"upper_block_bit"=true]`);
    const step = door === 'S' ? 1 : -1;
    for (let z = front + step; Math.abs(z - cz) > 1; z += step) B(mx, gy - 1, z, 'grass_path');
    B(mx + 1, gy + 2, front + step, 'lantern');
    B(mx + 1, gy + 1, front + step, 'oak_fence'); B(mx + 1, gy, front + step, 'oak_fence');
    // interior
    const ix0 = x0 + 1, ix1 = x1 - 1, iz0 = z0 + 1, iz1 = z1 - 1;
    const backIn = door === 'S' ? iz0 : iz1;
    B(mx, gy + 3, Math.floor((iz0 + iz1) / 2), 'lantern ["hanging"=true]', 'lantern');
    if (type === 'biblioteca') {
      F(ix0, gy, backIn, ix1, gy + 1, backIn, 'bookshelf');
      F(ix0, gy, iz0, ix0, gy + 1, iz1, 'bookshelf');
      B(mx, gy, Math.floor((iz0 + iz1) / 2), 'lectern');
      B(mx + 1, gy, Math.floor((iz0 + iz1) / 2), 'redstone_lamp');
      chests.push({ x: ix1, y: gy, z: backIn, items: [['minecraft:writable_book', 1], ['minecraft:book', 3], ['minecraft:paper', 6]] });
    } else if (type === 'ferreiro') {
      B(ix0, gy, backIn, 'smithing_table'); B(ix0 + 1, gy, backIn, 'furnace'); B(ix0 + 2, gy, backIn, 'furnace');
      B(ix1, gy, backIn, 'anvil'); B(ix1, gy, iz0 + 2, 'blast_furnace');
      chests.push({ x: ix1 - 1, y: gy, z: backIn, items: [['minecraft:iron_ingot', 6], ['minecraft:iron_pickaxe', 1], ['minecraft:coal', 8]] });
    } else {
      B(ix0, gy, backIn, 'crafting_table'); B(ix0 + 1, gy, backIn, 'barrel'); B(ix1, gy, backIn, 'flower_pot');
      B(ix1, gy, backIn + (door === 'S' ? 1 : -1), 'composter');
      chests.push({ x: ix0 + 2, y: gy, z: backIn, items: [['minecraft:bread', 6], ['minecraft:carrot', 8], ['minecraft:apple', 3]] });
    }
  }
  for (const c of chests) B(c.x, c.y, c.z, 'chest');
  // fazenda
  const fx0 = cx - 21, fz0 = cz + 6, fx1 = cx - 7, fz1 = cz + 15;
  F(fx0, gy - 1, fz0, fx1, gy - 1, fz1, 'oak_log');
  F(fx0 + 1, gy - 1, fz0 + 1, fx1 - 1, gy - 1, fz1 - 1, 'farmland');
  F(fx0 + 1, gy - 1, Math.floor((fz0 + fz1) / 2), fx1 - 1, gy - 1, Math.floor((fz0 + fz1) / 2), 'water');
  F(fx0 + 1, gy, fz0 + 1, fx1 - 1, gy, Math.floor((fz0 + fz1) / 2) - 1, 'wheat ["growth"=7]');
  F(fx0 + 1, gy, Math.floor((fz0 + fz1) / 2) + 1, fx1 - 1, gy, fz1 - 1, 'carrots ["growth"=7]');
  for (const [x, z] of [[fx0, fz0], [fx1, fz0], [fx0, fz1], [fx1, fz1]]) B(x, gy, z, 'hay_block');
  B(fx1 + 1, gy, fz0, 'composter');
  // abóboras perto da fazenda (pista da abóbora esculpida)
  for (const [dx, dz] of [[-24, 8], [-24, 10], [-25, 13]]) B(cx + dx, gy, cz + dz, 'pumpkin');
  system.runTimeout(() => {
    for (const c of chests) {
      try {
        const inv2 = dim.getBlock({ x: c.x, y: c.y, z: c.z })?.getComponent('minecraft:inventory')?.container;
        c.items.forEach(([id, n], i) => inv2?.setItem(i * 2, new ItemStack(id, n)));
      } catch { /* */ }
    }
    signs(dim, cx, gy, cz);
    populate(dim, { x: cx, y: gy, z: cz }, gy);
  }, 10);
  return { x: cx, y: gy, z: cz };
}

function signs(dim, cx, gy, cz) {
  const put = (x, z, text, rot) => {
    try {
      cmd(dim, `setblock ${x} ${gy} ${z} standing_sign ["ground_sign_direction"=${rot}]`) || cmd(dim, `setblock ${x} ${gy} ${z} standing_sign`);
      dim.getBlock({ x, y: gy, z })?.getComponent('minecraft:sign')?.setText(text);
    } catch { /* */ }
  };
  put(cx - 4, cz - 4, '§l§dSECRET OP§r\n§f25 min de preparo\n§fdepois: §cLUTA\n§cFINAL', 6);
  put(cx + 4, cz - 4, '§6PISTAS§r\nQuebre o bloco\nou derrote o mob\nda resposta', 10);
  put(cx - 4, cz + 4, '§bDROPS OP§r\nsaltam de quem\nacertar primeiro!', 2);
}

// ------------------------------------------------------------------ ARMAS DE FOGO
const GUNS = {
  'secretop:hk_g3_rifle': { name: 'Fuzil HK G3', mag: 31, dmg: 8, range: 80, delay: 4, auto: true, spread: 0.012, pellets: 1, sound: 'secretop.gun.rifle', reload: 40 },
  'secretop:combat_pistol': { name: 'Pistola Tática', mag: 12, dmg: 7, range: 45, delay: 5, auto: false, spread: 0.01, pellets: 1, sound: 'secretop.gun.pistol', reload: 25 },
  'secretop:scatter_shotgun': { name: 'Escopeta Secreta', mag: 6, dmg: 4, range: 22, delay: 16, auto: false, spread: 0.11, pellets: 7, sound: 'secretop.gun.shotgun', reload: 45 },
  'secretop:m700_sniper': { name: 'Fuzil M700', mag: 5, dmg: 24, range: 150, delay: 30, auto: false, spread: 0, pellets: 1, sound: 'secretop.gun.sniper', reload: 55 },
};
const ammo = new Map();      // playerId -> { gunId: balas }
const reloading = new Map(); // playerId -> { gun, until }
const firing = new Set();    // jogadores segurando USAR com arma automática
const lastShot = new Map();

function getAmmo(p, gid) {
  let m = ammo.get(p.id);
  if (!m) {
    try { m = JSON.parse(String(p.getDynamicProperty(NS + 'ammo') ?? '{}')); } catch { m = {}; }
    ammo.set(p.id, m);
  }
  if (m[gid] === undefined) m[gid] = GUNS[gid].mag;
  return m[gid];
}
function setAmmo(p, gid, n) {
  getAmmo(p, gid); ammo.get(p.id)[gid] = n;
  try { p.setDynamicProperty(NS + 'ammo', JSON.stringify(ammo.get(p.id))); } catch { /* */ }
}

function tryReload(p, gid) {
  const g = GUNS[gid];
  if (reloading.has(p.id)) return;
  if (getAmmo(p, gid) >= g.mag) { tell(p, '§7Pente cheio.'); return; }
  if (!takeItem(p, NS + 'ammo_box', 1)) { title(p, ' ', '§cSEM MUNIÇÃO! Ache Caixas de Munição', 30); sfx(p, 'secretop.gun.empty'); return; }
  reloading.set(p.id, { gun: gid, until: tick() + g.reload, start: tick() });
  sfx(p, 'secretop.gun.reload');
}

function triggerGun(p, gid, fromHold) {
  const g = GUNS[gid];
  if (p.isSneaking) { if (ready(p, 'reload', 10)) tryReload(p, gid); return; }
  const r = reloading.get(p.id); if (r) return;
  const last = lastShot.get(p.id) ?? -1e9;
  if (tick() - last < g.delay) return;
  if (!fromHold && !g.auto && tick() - last < g.delay + 1) return;
  const left = getAmmo(p, gid);
  if (left <= 0) {
    if (ready(p, 'empty', 15)) { sfx(p, 'secretop.gun.empty'); if (countItem(p, NS + 'ammo_box') > 0) tryReload(p, gid); else title(p, ' ', '§cSEM MUNIÇÃO!', 20); }
    return;
  }
  lastShot.set(p.id, tick());
  setAmmo(p, gid, left - 1);
  shoot(p, g);
}

function shoot(p, g) {
  const dim = p.dimension;
  const head = p.getHeadLocation();
  const view = p.getViewDirection();
  const explosive = p.hasTag(NS + 'explosive_shot');
  let didExplode = false;
  wsfx(dim, g.sound, head, 0.95 + Math.random() * 0.1, 1);
  const right = norm({ x: -view.z, y: 0, z: view.x });
  fx(dim, 'secretop:muzzle_flash', { x: head.x + view.x * 1.1 + right.x * 0.35, y: head.y + view.y * 1.1 - 0.25, z: head.z + view.z * 1.1 + right.z * 0.35 });
  for (let k = 0; k < g.pellets; k++) {
    const dir = norm({ x: view.x + (Math.random() - 0.5) * g.spread * 2, y: view.y + (Math.random() - 0.5) * g.spread * 2, z: view.z + (Math.random() - 0.5) * g.spread * 2 });
    let maxD = g.range; let impact;
    try {
      const bh = dim.getBlockFromRay(head, dir, { maxDistance: g.range });
      if (bh) {
        impact = { x: bh.block.location.x + bh.faceLocation.x, y: bh.block.location.y + bh.faceLocation.y, z: bh.block.location.z + bh.faceLocation.z };
        maxD = dist(head, impact);
      }
    } catch { /* */ }
    let target; let tDist = maxD;
    try {
      const hits = dim.getEntitiesFromRay(head, dir, { maxDistance: maxD, excludeTypes: ['minecraft:item', 'minecraft:xp_orb', 'minecraft:arrow'], excludeGameModes: [GameMode.Spectator, GameMode.Creative] });
      const h = hits.find((x) => x.entity.id !== p.id && x.entity.typeId !== 'secretop:op_allay');
      if (h) { target = h.entity; tDist = h.distance; }
    } catch { /* */ }
    // rastro da bala
    const steps = Math.min(24, Math.floor(tDist / 1.5));
    for (let s = 1; s <= steps; s += (g.pellets > 1 ? 2 : 1)) fx(dim, 'secretop:bullet_trail', { x: head.x + dir.x * s * 1.5, y: head.y + dir.y * s * 1.5 - 0.1, z: head.z + dir.z * s * 1.5 });
    if (target && target.typeId === 'minecraft:player' && S.phase !== 'fight') target = undefined; // sem PvP no preparo
    if (target) {
      const hitY = head.y + dir.y * tDist;
      let head2 = false;
      try { head2 = hitY >= target.getHeadLocation().y - 0.3; } catch { /* */ }
      const dmg = g.dmg * (head2 ? 1.5 : 1);
      try { target.applyDamage(dmg, { cause: EntityDamageCause.projectile, damagingEntity: p }); } catch { /* */ }
      const at = { x: head.x + dir.x * tDist, y: hitY, z: head.z + dir.z * tDist };
      fx(dim, 'minecraft:critical_hit_emitter', at);
      if (head2 && g.pellets === 1) { try { p.onScreenDisplay.setActionBar('§c§lHEADSHOT!'); } catch { /* */ } sfx(p, 'secretop.headshot'); }
      if (explosive && !didExplode) { didExplode = true; try { dim.createExplosion(at, 2.5, { breaksBlocks: false, source: p }); } catch { /* */ } }
    } else if (impact) {
      fx(dim, 'secretop:bullet_impact', impact);
      if (explosive && !didExplode) { didExplode = true; try { dim.createExplosion(impact, 2.5, { breaksBlocks: false, source: p }); } catch { /* */ } }
    }
  }
  if (didExplode) { try { p.removeTag(NS + 'explosive_shot'); } catch { /* */ } tell(p, '§6Tiro explosivo usado!'); }
}

function gunLoop() {
  for (const id of [...firing]) {
    const p = players().find((q) => q.id === id);
    const it = p && heldItem(p);
    const g = it && GUNS[it.typeId];
    if (!p || !g || !g.auto) { firing.delete(id); continue; }
    triggerGun(p, it.typeId, true);
  }
  for (const [id, r] of [...reloading]) {
    if (tick() >= r.until) {
      reloading.delete(id);
      const p = players().find((q) => q.id === id);
      if (p) { setAmmo(p, r.gun, GUNS[r.gun].mag); sfx(p, 'random.click', 1.4); }
    }
  }
}

// ------------------------------------------------------------------ USO DE ITENS
const totemUntil = new Map();

function onUseItem(p, stack) {
  const id = stack?.typeId; if (!id || !id.startsWith(NS)) return;
  if (GUNS[id]) { triggerGun(p, id, false); return; }
  const key = id.slice(NS.length);
  if (!ready(p, 'use:' + key, 6)) return;
  if (key === 'totem_boost') useTotem(p);
  else if (key === 'allay_whistle') summonAllay(p);
  else if (key === 'netherite_katana') katanaDash(p);
  else if (key === 'ammo_box') tell(p, '§7Segure a arma e use §fAGACHAR + USAR §7para recarregar.');
}

function useTotem(p) {
  if (!takeItem(p, NS + 'totem_boost', 1)) return;
  for (const [e, d, a] of [['absorption', 900, 4], ['resistance', 900, 1], ['strength', 900, 1], ['speed', 900, 1], ['regeneration', 300, 1]]) effect(p, String(e), Number(d), Number(a), true);
  totemUntil.set(p.id, tick() + 900);
  title(p, '§cTOTEM BOOST V', '§fAbsorção • Força • Resistência • Velocidade', 40);
  sfx(p, 'random.totem'); fx(p.dimension, 'minecraft:totem_particle', p.location);
}

function katanaDash(p) {
  if (!ready(p, 'dash', 40)) { tell(p, '§7Investida recarregando...'); return; }
  const v = p.getViewDirection();
  try { p.applyKnockback({ x: v.x * 3.2, z: v.z * 3.2 }, 0.35); } catch { /* */ }
  effect(p, 'resistance', 20, 2);
  sfx(p, 'item.trident.riptide_1', 1.3); fx(p.dimension, 'secretop:dark_slash', p.location);
}

function summonAllay(p) {
  if (!ready(p, 'allay', 200)) { tell(p, '§7O amuleto ainda está recarregando.'); return; }
  const dim = p.dimension;
  try { for (const e of dim.getEntities({ type: 'secretop:op_allay' })) if (e.getDynamicProperty(NS + 'owner') === p.id) e.remove(); } catch { /* */ }
  try {
    const a = dim.spawnEntity('secretop:op_allay', { x: p.location.x + 1, y: p.location.y + 1.5, z: p.location.z + 1 });
    a.setDynamicProperty(NS + 'owner', p.id);
    a.nameTag = `§bAllay de ${p.name}`;
    tell(p, '§bSeu Allay ajudante chegou! Ele busca os itens perto de você.');
    sfx(p, 'mob.allay.item_given'); fx(dim, 'secretop:allay_sparkle', a.location);
  } catch { tell(p, '§cNão foi possível invocar o Allay aqui.'); }
}

function onEat(p, stack) {
  const id = stack?.typeId;
  if (id === NS + 'compacted_golden_apple') {
    effect(p, 'regeneration', 200, 1, true); effect(p, 'absorption', 2400, 3, true); effect(p, 'resistance', 600, 0, true); effect(p, 'fire_resistance', 600, 0, true);
    title(p, ' ', '§6Maçã Dourada Compactada!', 30);
  } else if (id === NS + 'titanium_apple') {
    effect(p, 'absorption', 1200, 1, true);
    try { p.addTag(NS + 'explosive_shot'); } catch { /* */ }
    title(p, ' ', '§7Seu próximo tiro §6explode!', 40);
  }
}

// ------------------------------------------------------------------ CORPO A CORPO
function onMelee(attacker, target) {
  if (attacker.typeId !== 'minecraft:player') return;
  if (target.typeId === 'minecraft:player' && S.phase !== 'fight') return; // sem PvP durante o preparo
  const id = heldItem(attacker)?.typeId; if (!id?.startsWith(NS)) return;
  const dim = target.dimension;
  let at; try { at = { x: target.location.x, y: target.location.y + 1, z: target.location.z }; } catch { return; }
  const dir = norm({ x: target.location.x - attacker.location.x, y: 0, z: target.location.z - attacker.location.z });
  switch (id) {
    case NS + 'syntaxium_sword':
      effect(target, 'slowness', 60, 1);
      fx(dim, 'secretop:purple_burst', at); fx(dim, 'minecraft:large_explosion', at);
      wsfx(dim, 'random.explode', at, 1.5, 0.35);
      break;
    case NS + 'heavy_syntaxium_sword':
      effect(target, 'slowness', 50, 3);
      try { target.applyKnockback({ x: dir.x * 2.2, z: dir.z * 2.2 }, 0.45); } catch { /* */ }
      fx(dim, 'minecraft:huge_explosion_emitter', at); wsfx(dim, 'random.explode', at, 0.8, 0.5);
      break;
    case NS + 'syntaxium_axe':
      effect(attacker, 'speed', 100, 1, true); fx(dim, 'secretop:purple_burst', at);
      break;
    case NS + 'netherite_katana':
      fx(dim, 'minecraft:critical_hit_emitter', at); wsfx(dim, 'item.trident.hit', at, 1.4, 0.6);
      break;
    case NS + 'yami_katana':
      try { target.applyKnockback({ x: dir.x * 0.4, z: dir.z * 0.4 }, 1.1); } catch { /* */ }
      try { attacker.applyKnockback({ x: 0, z: 0 }, 1.0); } catch { /* */ }
      effect(attacker, 'slow_falling', 80); fx(dim, 'secretop:dark_slash', at);
      wsfx(dim, 'mob.enderdragon.flap', at, 1.2, 0.8);
      break;
    case NS + 'laser_blade':
      fx(dim, 'secretop:laser_spark', at); wsfx(dim, 'beacon.power', at, 2, 0.4);
      break;
    default: break;
  }
}

// derrubar árvore inteira com o Machado Syntaxium
function fellTree(p, block, logId) {
  const dim = p.dimension; const start = block.location;
  const seen = new Set(); const queue = [start]; let n = 0;
  while (queue.length && n < 96) {
    const b = queue.shift();
    for (let dx = -1; dx <= 1; dx++) for (let dy = 0; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const q = { x: b.x + dx, y: b.y + dy, z: b.z + dz }; const k = `${q.x},${q.y},${q.z}`;
      if (seen.has(k)) continue; seen.add(k);
      let blk; try { blk = dim.getBlock(q); } catch { continue; }
      if (blk?.typeId !== logId) continue;
      queue.push(q); n++;
      system.runTimeout(() => { cmd(dim, `setblock ${q.x} ${q.y} ${q.z} air destroy`); fx(dim, 'secretop:purple_burst', { x: q.x + 0.5, y: q.y + 0.5, z: q.z + 0.5 }); }, Math.min(40, n));
    }
  }
}

// ------------------------------------------------------------------ ARMADURAS / BUFFS (a cada 1 s)
function armorSecond() {
  for (const p of players()) {
    try {
      const head = equip(p, EquipmentSlot.Head)?.typeId, chest = equip(p, EquipmentSlot.Chest)?.typeId, feet = equip(p, EquipmentSlot.Feet)?.typeId;
      const synChest = chest === NS + 'syntaxium_chestplate', synBoots = feet === NS + 'syntaxium_boots';
      const lvl = (synChest ? 1 : 0) + (synBoots ? 1 : 0);
      if (lvl) { effect(p, 'speed', 40, lvl - 1); effect(p, 'resistance', 40, lvl - 1); }
      if (head === NS + 'syntaxium_helmet') { effect(p, 'night_vision', 400); effect(p, 'water_breathing', 60); }
      if (head === NS + 'syntaxium_helmet' && synChest && synBoots) effect(p, 'strength', 40, 0);
      if (head === NS + 'tnt_cowl' && p.getComponent('minecraft:onfire') && ready(p, 'cowl', 200)) {
        effect(p, 'resistance', 30, 4); effect(p, 'fire_resistance', 100);
        try { p.extinguishFire(); } catch { /* */ }
        try { p.dimension.createExplosion(p.location, 3, { breaksBlocks: false, source: p }); } catch { /* */ }
        title(p, ' ', '§cTNT COWL: BOOM!', 25);
      }
      if (heldItem(p)?.typeId === NS + 'heavy_syntaxium_sword') effect(p, 'slowness', 30, 0);
      // Totem Boost V carregado na barra rápida ou na mão secundária
      let carry = equip(p, EquipmentSlot.Offhand)?.typeId === NS + 'totem_boost';
      const c = inv(p);
      for (let i = 0; !carry && c && i < 9; i++) if (c.getItem(i)?.typeId === NS + 'totem_boost') carry = true;
      if (carry) effect(p, 'health_boost', 100, 1);
    } catch { /* */ }
  }
}

// ------------------------------------------------------------------ ALLAY AJUDANTE
function allayTick() {
  const dim = world.getDimension('overworld');
  let list = [];
  try { list = dim.getEntities({ type: 'secretop:op_allay' }); } catch { return; }
  for (const a of list) {
    try {
      const owner = players().find((p) => p.id === a.getDynamicProperty(NS + 'owner'));
      if (!owner || owner.dimension.id !== a.dimension.id) continue;
      const home = { x: owner.location.x, y: owner.location.y + 1.8, z: owner.location.z };
      if (dist(a.location, home) > 20) { a.teleport(home); continue; }
      const items = a.dimension.getEntities({ type: 'minecraft:item', location: owner.location, maxDistance: 12 })
        .filter((i) => dist(i.location, owner.location) > 1.6);
      let goal = home;
      if (items.length) {
        items.sort((x, y) => dist(x.location, a.location) - dist(y.location, a.location));
        const it = items[0];
        goal = { x: it.location.x, y: it.location.y + 0.4, z: it.location.z };
        if (dist(a.location, goal) < 1.3) {
          it.teleport({ x: owner.location.x, y: owner.location.y + 0.3, z: owner.location.z });
          fx(a.dimension, 'secretop:allay_sparkle', owner.location);
          sfx(owner, 'mob.allay.item_taken', 1.2, 0.6);
          continue;
        }
      } else if (dist(a.location, home) < 3) {
        if (Math.random() < 0.2) fx(a.dimension, 'secretop:allay_sparkle', a.location);
        continue;
      }
      const d = dist(a.location, goal); const step = Math.min(0.75, d);
      const v = norm({ x: goal.x - a.location.x, y: goal.y - a.location.y, z: goal.z - a.location.z });
      a.teleport({ x: a.location.x + v.x * step, y: a.location.y + v.y * step, z: a.location.z + v.z * step }, { facingLocation: goal });
      if (Math.random() < 0.3) fx(a.dimension, 'secretop:allay_sparkle', a.location);
    } catch { /* */ }
  }
}

// ------------------------------------------------------------------ HUD (acima da hotbar)
function bar(pct, size = 20) {
  const f = Math.round(pct * size);
  return '§a' + '|'.repeat(f) + '§8' + '|'.repeat(size - f);
}
function hud() {
  for (const p of players()) {
    const lines = [];
    const it = heldItem(p); const g = it && GUNS[it.typeId];
    if (g) {
      const r = reloading.get(p.id);
      if (r) lines.push(`§e${g.name}  §fRECARREGANDO ${bar((tick() - r.start) / Math.max(1, r.until - r.start), 10)}`);
      else {
        const n = getAmmo(p, it.typeId);
        lines.push(`§7▬▬ §f${g.name}  §l${n <= Math.ceil(g.mag / 4) ? '§c' : '§f'}${String(n).padStart(3, '0')}§r§7/${g.mag}  §8| §6${countItem(p, NS + 'ammo_box')} caixas`);
      }
    }
    const tu = totemUntil.get(p.id);
    if (tu && tu > tick()) lines.push(`§c✚ Totem Boost V §f${mmss((tu - tick()) / 20)}`);
    if (S.phase === 'setup') lines.push('§7Preparando a vila...');
    else if (S.phase === 'intro') lines.push(`§dSECRET OP §7• começa em §f${S.introLeft}s`);
    else if (S.phase === 'prep') {
      const c = S.clue;
      lines.push(`§e⏳ PREPARO §f§l${mmss(S.prepLeft)}§r §7• pista ${Math.min(c.pos + 1, CLUES.length)}/${CLUES.length}`);
      if (c.mode === 'clue') {
        lines.push(`§6§lPISTA: §r§f${CLUES[c.pos].riddle} §7${mmss(c.left)}`);
        if (c.left <= c.total / 2) lines.push(`§8Dica: §7${CLUES[c.pos].hint}`);
      } else if (c.mode === 'gap') {
        const pct = 1 - c.left / Math.max(1, c.total);
        lines.push(`§6§lPRÓXIMA PISTA: ${bar(pct)} §f${Math.round(pct * 100)}%`);
      } else lines.push('§7Sem mais pistas — prepare-se para a §cLUTA FINAL');
    } else if (S.phase === 'fight') {
      const alive = players().filter((q) => S.alive.includes(q.id)).length;
      lines.push(S.solo ? `§c§lLUTA FINAL §r§7• §fOnda ${Math.max(1, S.wave)}/${SOLO_WAVES} §7• sem área` : `§c§lLUTA FINAL §r§7• §f${alive} vivos §7• sem área`);
    } else if (S.phase === 'finished') {
      lines.push(S.winner ? `§6§lVENCEDOR: ${S.winner}` : '§7Fim de jogo');
    }
    if (lines.length) { try { p.onScreenDisplay.setActionBar(lines.join('\n')); } catch { /* */ } }
  }
}

// ------------------------------------------------------------------ EVENTOS
system.beforeEvents.startup.subscribe((ev) => {
  ev.itemComponentRegistry.registerCustomComponent('secretop:use', {
    onUse: (e) => { const p = e.source; const s = e.itemStack; system.run(() => onUseItem(p, s)); },
  });
});

world.afterEvents.itemUse.subscribe((e) => { if (e.itemStack?.typeId?.startsWith(NS)) onUseItem(e.source, e.itemStack); });
world.afterEvents.itemStartUse.subscribe((e) => {
  const g = GUNS[e.itemStack?.typeId]; if (!g) return;
  if (g.auto && !e.source.isSneaking) firing.add(e.source.id);
  triggerGun(e.source, e.itemStack.typeId, false);
});
world.afterEvents.itemStopUse.subscribe((e) => { firing.delete(e.source.id); });
world.afterEvents.itemCompleteUse.subscribe((e) => onEat(e.source, e.itemStack));
world.afterEvents.entityHitEntity.subscribe((e) => { try { onMelee(e.damagingEntity, e.hitEntity); } catch { /* */ } });

world.afterEvents.playerBreakBlock.subscribe((e) => {
  const id = e.brokenBlockPermutation.type.id;
  const loc = { x: e.block.location.x + 0.5, y: e.block.location.y + 0.5, z: e.block.location.z + 0.5 };
  if (id === NS + 'secret_melon') {
    const tool = e.itemStackBeforeBreak?.typeId ?? '';
    if (/(iron|diamond|netherite)_pickaxe$/.test(tool)) dropRewards(e.player, loc, { featured: [rollPool()] });
    else tell(e.player, '§cA Melancia Secreta precisa de uma picareta de ferro (ou melhor)!');
  }
  if (e.itemStackBeforeBreak?.typeId === NS + 'syntaxium_axe' && /(_log|_stem)$/.test(id)) fellTree(e.player, e.block, id);
  const c = currentClue();
  if (clueActive() && c.kind === 'block' && c.targets.includes(id)) solve(e.player, loc);
});

world.afterEvents.playerInteractWithBlock.subscribe((e) => {
  if (!e.isFirstEvent) return;
  const c = currentClue();
  if (clueActive() && c.use && c.kind === 'block' && c.targets.includes(e.block.typeId)) {
    solve(e.player, { x: e.block.location.x + 0.5, y: e.block.location.y + 1, z: e.block.location.z + 0.5 });
  }
});

world.afterEvents.playerInteractWithEntity.subscribe((e) => {
  const c = currentClue();
  if (clueActive() && c.use && c.kind === 'mob' && c.targets.includes(e.target.typeId)) {
    let loc; try { loc = { ...e.target.location }; } catch { loc = e.player.location; }
    solve(e.player, loc);
  }
});

world.afterEvents.entityDie.subscribe((e) => {
  const dead = e.deadEntity;
  let typeId; try { typeId = dead.typeId; } catch { return; }
  if (typeId === 'minecraft:player') {
    if (S.phase === 'fight' && S.alive.includes(dead.id)) {
      S.alive = S.alive.filter((x) => x !== dead.id); save();
      say(`§c☠ ${Reflect.get(dead, 'name') ?? 'Jogador'} foi eliminado! §7(${S.alive.length} restante(s))`);
    }
    return;
  }
  const killer = e.damageSource?.damagingEntity;
  const c = currentClue();
  if (clueActive() && c.kind === 'mob' && c.targets.includes(typeId) && killer?.typeId === 'minecraft:player') {
    let loc; try { loc = { ...dead.location }; } catch { loc = killer.location; }
    solve(killer, loc);
  }
});

world.afterEvents.playerSpawn.subscribe((e) => {
  const p = e.player;
  system.runTimeout(() => {
    if (!S) return;
    showBoard();
    if (S.phase === 'setup') { setupVillage(p); return; }
    if (e.initialSpawn) {
      if (!p.getDynamicProperty(NS + 'joined')) { p.setDynamicProperty(NS + 'joined', true); toVillage(p); }
      if (S.phase === 'prep') tell(p, `§d[SECRET OP] §fDesafio em andamento: faltam §e${mmss(S.prepLeft)}§f para a luta final.`);
    }
    if (S.phase === 'fight' && !S.alive.includes(p.id)) {
      try { p.setGameMode(GameMode.Spectator); } catch { /* */ }
      tell(p, '§7Você está assistindo. Voe até os sobreviventes!');
    }
  }, 30);
});

system.afterEvents.scriptEventReceive.subscribe((e) => {
  if (e.id === 'secretop:reiniciar') {
    if (S.phase === 'prep' || S.phase === 'intro' || S.phase === 'fight') {
      say('§7[SECRET OP] Reiniciando a rodada a pedido de um administrador.');
    }
    if (S.village) restartRound();
  }
});

// ------------------------------------------------------------------ LAÇOS
function secondTick() {
  if (players().length === 0) return;
  if (S.phase === 'intro') { S.introLeft--; introSecond(); }
  else if (S.phase === 'prep') prepSecond();
  else if (S.phase === 'fight') fightSecond();
  if (S.phase === 'prep' && S.prepLeft % 5 === 0) save();
  armorSecond();
}

world.afterEvents.worldLoad.subscribe(() => {
  load();
  S.settingUp = false;
  if (S.phase === 'setup' && S.village) beginIntro();
  system.runInterval(gunLoop, 1);
  system.runInterval(allayTick, 2);
  system.runInterval(hud, 10);
  system.runInterval(secondTick, 20);
});
