/*
 * SECRET OP v2 — Drops Secretos + Pistas (adaptação original para Minecraft Bedrock)
 * Inspirado no desafio do vídeo "Minecraft, But One Block Secretly Drops OP Items.." (Kiingtong).
 * Todo o código, texturas e sons deste pacote foram criados do zero.
 *
 * API: @minecraft/server 2.0.0 + @minecraft/server-ui 2.0.0 (estáveis, sem Experimentos).
 */
import {
  world, system, ItemStack, EquipmentSlot, GameMode, EntityDamageCause,
  EnchantmentTypes, DisplaySlotId, ObjectiveSortOrder,
} from '@minecraft/server';
import { ActionFormData, ModalFormData } from '@minecraft/server-ui';

const NS = 'secretop:';
const LOBBY_Y = 200;
const ARENA_OFFSET_Z = 52;
const ARENA_RADIUS = 30;

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
const DEFAULT_SETTINGS = { count: 12, clueMin: 5, gapSecs: 20, dmSecs: 180, keepInv: true, training: true };
let S = null; // estado do jogo, salvo em propriedade dinâmica

function freshState() {
  return {
    phase: 'idle', order: [], pos: 0, timeLeft: 0, total: 0, log: [],
    settings: { ...DEFAULT_SETTINGS }, lobby: null, arenaBuilt: false, alive: [], solo: false, winner: '',
  };
}
function load() {
  try {
    const raw = world.getDynamicProperty(NS + 'state');
    S = raw ? { ...freshState(), ...JSON.parse(String(raw)) } : freshState();
    S.settings = { ...DEFAULT_SETTINGS, ...(S.settings || {}) };
  } catch { S = freshState(); }
}
function save() { try { world.setDynamicProperty(NS + 'state', JSON.stringify(S)); } catch { /* cheio */ } }

const currentClue = () => (S.phase === 'clue' || S.phase === 'intermission') ? CLUES[S.order[S.pos]] : undefined;

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
function inLobby(loc) {
  const L = S?.lobby; if (!L) return false;
  return Math.abs(loc.x - L.x) <= 12 && Math.abs(loc.z - L.z) <= 12 && loc.y >= LOBBY_Y - 3 && loc.y <= LOBBY_Y + 8;
}
function arenaCenter() { const L = S.lobby; return L ? { x: L.x, y: LOBBY_Y, z: L.z + ARENA_OFFSET_Z } : undefined; }
function inArena(loc) {
  const C = arenaCenter(); if (!C) return false;
  return Math.hypot(loc.x - C.x, loc.z - C.z) <= ARENA_RADIUS + 3 && loc.y >= LOBBY_Y - 6 && loc.y <= LOBBY_Y + 12;
}

// ------------------------------------------------------------------ SCOREBOARD (lateral direita)
function board() {
  try {
    let o = world.scoreboard.getObjective('secretop_pistas');
    if (!o) o = world.scoreboard.addObjective('secretop_pistas', '§e§lSECRET OP §r§7pistas');
    return o;
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

// ------------------------------------------------------------------ FLUXO DO DESAFIO
function startChallenge(starter) {
  const st = S.settings;
  const count = Math.min(CLUES.length, Math.max(4, st.count));
  let order = CLUES.map((_, i) => i);
  if (count < CLUES.length) {
    const last = CLUES.length - 1; // a última pista é sempre o Bloco de Mel, como no vídeo
    const pool = order.slice(0, last).sort(() => Math.random() - 0.5).slice(0, count - 1).sort((a, b) => a - b);
    order = [...pool, last];
  }
  S.order = order; S.pos = 0; S.log = []; S.alive = []; S.winner = '';
  S.phase = 'intermission'; S.total = 8; S.timeLeft = 8;
  save(); resetBoard();
  cmd(world.getDimension('overworld'), `gamerule keepinventory ${st.keepInv ? 'true' : 'false'}`);
  say(`§d[SECRET OP] §f${starter.name} §ainiciou o desafio! §f${order.length} pistas. Quem resolver primeiro ganha os drops OP!`);
  [3, 2, 1].forEach((n, i) => system.runTimeout(() => {
    for (const p of players()) { title(p, `§e${n}`, '', 14); sfx(p, 'note.pling', 0.8 + i * 0.2); }
  }, 20 + i * 20));
  system.runTimeout(() => {
    for (const p of players()) {
      title(p, '§aVAMOS LÁ!', '§fResolva as pistas e pegue os drops OP', 40); sfx(p, 'random.levelup');
      if (inLobby(p.location)) dropToWorld(p);
    }
  }, 80);
}

function beginClue() {
  const c = currentClue(); if (!c) return;
  S.phase = 'clue'; S.total = S.settings.clueMin * 60; S.timeLeft = S.total; save();
  say(`§6§lCLUE: §r§f${c.riddle} §7(pista ${S.pos + 1}/${S.order.length})`);
  for (const p of players()) { title(p, '§6NOVA PISTA', `§f${c.riddle}`, 60); sfx(p, 'note.pling', 1.4); }
}

function nextAfterClue() {
  S.pos++;
  if (S.pos >= S.order.length) {
    S.phase = 'countdown'; S.total = 30; S.timeLeft = 30; save();
    say('§eEnigma final resolvido! Preparem-se para o Deathmatch.');
    say('§e30 segundos até o Deathmatch, preparem-se!');
    for (const p of players()) { title(p, '§cDEATHMATCH', '§fem 30 segundos', 50); sfx(p, 'random.anvil_land', 0.6); }
  } else {
    S.phase = 'intermission'; S.total = S.settings.gapSecs; S.timeLeft = S.total; save();
  }
}

function solve(p, loc) {
  if (S.phase !== 'clue') return;
  const c = currentClue(); if (!c) return;
  const o = board();
  try { o?.addScore(p, 1); } catch { /* */ }
  S.log.push({ i: S.order[S.pos], by: p.name });
  say(`§a${p.name} §fresolveu a pista! A resposta era §d${c.answer}`);
  for (const q of players()) {
    if (q.id === p.id) { title(q, '§aPISTA RESOLVIDA!', `§fA resposta era §d${c.answer}`, 50); sfx(q, 'random.levelup'); }
    else { title(q, `§c${p.name} resolveu!`, `§fA resposta era §d${c.answer}`, 40); sfx(q, 'note.bass', 0.7); }
  }
  dropRewards(p, loc, c);
  nextAfterClue();
}

function expireClue() {
  const c = currentClue(); if (!c) return;
  S.log.push({ i: S.order[S.pos], by: '' });
  say(`§7Ninguém resolveu a tempo! A resposta era §d${c.answer}`);
  for (const p of players()) sfx(p, 'note.bass', 0.5);
  nextAfterClue();
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

function dropToWorld(p) {
  try {
    const dim = world.getDimension('overworld');
    const L = S.lobby ?? { x: p.location.x, z: p.location.z };
    const ox = L.x + (Math.random() * 6 - 3), oz = L.z - 16 + (Math.random() * 6 - 3);
    const hit = dim.getBlockFromRay({ x: ox, y: LOBBY_Y - 12, z: oz }, { x: 0, y: -1, z: 0 }, { maxDistance: 300, includeLiquidBlocks: true });
    const y = hit ? hit.block.location.y + 1.2 : 90;
    p.teleport({ x: ox, y, z: oz }, { dimension: dim });
    effect(p, 'slow_falling', 60); effect(p, 'resistance', 100, 4);
    fx(dim, 'secretop:op_burst', p.location);
  } catch { /* */ }
}
function goLobby(p) {
  const L = S.lobby; if (!L) return;
  try { p.teleport({ x: L.x + 0.5, y: LOBBY_Y + 1, z: L.z + 0.5 }, { dimension: world.getDimension('overworld') }); } catch { /* */ }
}

// ------------------------------------------------------------------ DEATHMATCH
function startDeathmatch() {
  const dim = world.getDimension('overworld');
  const C = arenaCenter();
  if (!C) { S.phase = 'idle'; save(); return; }
  buildArena(dim);
  const list = players();
  S.phase = 'deathmatch'; S.total = S.settings.dmSecs; S.timeLeft = S.total;
  S.alive = list.map((p) => p.id); S.solo = list.length <= 1; S.winner = ''; save();
  list.forEach((p, i) => {
    const a = (i / Math.max(1, list.length)) * Math.PI * 2;
    try {
      p.setGameMode(GameMode.Survival);
      p.teleport({ x: C.x + Math.cos(a) * 18 + 0.5, y: C.y + 1, z: C.z + Math.sin(a) * 18 + 0.5 }, { dimension: dim, facingLocation: C });
      effect(p, 'resistance', 100, 4); give(p, makeItem('ammo_box'));
      p.addTag(NS + 'fighter');
    } catch { /* */ }
  });
  [3, 2, 1].forEach((n, i) => system.runTimeout(() => {
    for (const p of players()) { title(p, `§c${n}`, '§fÚltimo sobrevivente vence!', 14); sfx(p, 'note.pling', 0.7 + i * 0.2); }
  }, i * 20));
  system.runTimeout(() => {
    for (const p of players()) { title(p, '§c§lLUTEM!', '', 30); sfx(p, 'mob.wither.spawn', 1, 0.5); }
    if (S.solo) spawnGuardians(dim, C);
  }, 60);
  say(`§cDEATHMATCH! §f${list.length} jogador(es). A borda vai encolher — fique dentro!`);
}

function spawnGuardians(dim, C) {
  const mobs = ['minecraft:vindicator', 'minecraft:vindicator', 'minecraft:zombie', 'minecraft:zombie', 'minecraft:skeleton',
    'minecraft:skeleton', 'minecraft:pillager', 'minecraft:husk'];
  mobs.forEach((id, i) => {
    const a = (i / mobs.length) * Math.PI * 2 + 0.4;
    try {
      const e = dim.spawnEntity(id, { x: C.x + Math.cos(a) * 10, y: C.y + 1, z: C.z + Math.sin(a) * 10 });
      e.addTag(NS + 'dm_mob'); e.nameTag = '§cGuardião';
    } catch { /* */ }
  });
  say('§7Modo solo: derrote os §cGuardiões §7antes que a borda feche!');
}

function borderRadius() {
  const prog = 1 - S.timeLeft / Math.max(1, S.total);
  return Math.max(5, Math.round(ARENA_RADIUS - (ARENA_RADIUS - 5) * prog));
}

function deathmatchSecond() {
  const dim = world.getDimension('overworld');
  const C = arenaCenter(); if (!C) return;
  const r = borderRadius();
  const alive = players().filter((p) => S.alive.includes(p.id));
  for (const p of alive) {
    const d = Math.hypot(p.location.x - C.x, p.location.z - C.z);
    if (d > r) {
      try { p.applyDamage(2, { cause: EntityDamageCause.magic }); } catch { /* */ }
      title(p, ' ', '§cVolte para dentro da borda!', 10);
    }
  }
  if (S.solo) {
    let left = 0;
    try { left = dim.getEntities({ tags: [NS + 'dm_mob'], location: C, maxDistance: 60 }).length; } catch { /* */ }
    if (alive.length === 0) return finish(undefined);
    if (S.timeLeft < S.total - 5 && left === 0) return finish(alive[0]);
    if (S.timeLeft <= 0) return finish(alive[0]);
  } else {
    if (alive.length <= 1) return finish(alive[0]);
    if (S.timeLeft <= 0) {
      const best = alive.sort((a, b) => (hp(b) - hp(a)))[0];
      return finish(best);
    }
  }
}
const hp = (p) => { try { return p.getComponent('minecraft:health')?.currentValue ?? 0; } catch { return 0; } };

function finish(winner) {
  S.phase = 'finished'; S.timeLeft = 10; S.total = 10; S.winner = winner?.name ?? ''; save();
  const dim = world.getDimension('overworld');
  try { for (const e of dim.getEntities({ tags: [NS + 'dm_mob'] })) e.remove(); } catch { /* */ }
  if (winner) {
    say(`§6§l${winner.name} VENCEU O SECRET OP!`);
    for (const p of players()) { title(p, p.id === winner.id ? '§6§lVOCÊ VENCEU!' : `§6${winner.name} venceu!`, '§eGG!', 80); sfx(p, 'random.totem'); }
    try { for (let i = 0; i < 6; i++) system.runTimeout(() => fx(dim, 'minecraft:totem_particle', winner.location), i * 6); } catch { /* */ }
  } else {
    say('§7O Deathmatch terminou sem vencedor.');
  }
}

function resetToLobby() {
  S.phase = 'idle'; S.alive = []; S.timeLeft = 0; save();
  for (const p of players()) {
    try { p.setGameMode(GameMode.Survival); p.removeTag(NS + 'fighter'); } catch { /* */ }
    goLobby(p);
  }
  say('§d[SECRET OP] §fDe volta ao lobby. Use o §dControle do Desafio §fpara jogar de novo.');
}

// ------------------------------------------------------------------ CONSTRUÇÃO (lobby + arena)
function buildLobby(dim, cx, cz) {
  const y = LOBBY_Y;
  const F = (a, b, block) => cmd(dim, `fill ${a.x} ${a.y} ${a.z} ${b.x} ${b.y} ${b.z} ${block}`);
  F({ x: cx - 11, y: y - 1, z: cz - 11 }, { x: cx + 11, y: y + 7, z: cz + 11 }, 'air');
  F({ x: cx - 11, y: y - 2, z: cz - 11 }, { x: cx + 11, y: y - 2, z: cz + 11 }, 'polished_deepslate');
  F({ x: cx - 10, y: y - 1, z: cz - 10 }, { x: cx + 10, y: y - 1, z: cz + 10 }, 'purpur_block');
  F({ x: cx - 11, y: y - 1, z: cz - 11 }, { x: cx + 11, y: y - 1, z: cz - 11 }, 'polished_blackstone_bricks');
  F({ x: cx - 11, y: y - 1, z: cz + 11 }, { x: cx + 11, y: y - 1, z: cz + 11 }, 'polished_blackstone_bricks');
  F({ x: cx - 11, y: y - 1, z: cz - 11 }, { x: cx - 11, y: y - 1, z: cz + 11 }, 'polished_blackstone_bricks');
  F({ x: cx + 11, y: y - 1, z: cz - 11 }, { x: cx + 11, y: y - 1, z: cz + 11 }, 'polished_blackstone_bricks');
  for (const [dx, dz] of [[-6, -6], [6, -6], [-6, 6], [6, 6], [0, 0]]) F({ x: cx + dx, y: y - 1, z: cz + dz }, { x: cx + dx, y: y - 1, z: cz + dz }, 'sea_lantern');
  // paredes de vidro roxo
  F({ x: cx - 11, y, z: cz - 11 }, { x: cx + 11, y: y + 3, z: cz - 11 }, 'purple_stained_glass');
  F({ x: cx - 11, y, z: cz + 11 }, { x: cx + 11, y: y + 3, z: cz + 11 }, 'purple_stained_glass');
  F({ x: cx - 11, y, z: cz - 11 }, { x: cx - 11, y: y + 3, z: cz + 11 }, 'purple_stained_glass');
  F({ x: cx + 11, y, z: cz - 11 }, { x: cx + 11, y: y + 3, z: cz + 11 }, 'purple_stained_glass');
  for (const [dx, dz] of [[-11, -11], [11, -11], [-11, 11], [11, 11]]) F({ x: cx + dx, y, z: cz + dz }, { x: cx + dx, y: y + 4, z: cz + dz }, 'amethyst_block');
  // portal de saída (lado norte): ouro + tapete roxo
  F({ x: cx - 1, y: y - 1, z: cz - 9 }, { x: cx + 1, y: y - 1, z: cz - 7 }, 'gold_block');
  F({ x: cx - 1, y: y + 3, z: cz - 9 }, { x: cx + 1, y: y + 3, z: cz - 7 }, 'end_rod');
  // demonstração do atril + redstone (ficha 5.8)
  cmd(dim, `setblock ${cx + 7} ${y} ${cz - 7} lectern`);
  cmd(dim, `setblock ${cx + 8} ${y} ${cz - 7} redstone_lamp`);
  cmd(dim, `setblock ${cx + 7} ${y} ${cz - 8} chest`);
  // pedestal do Bloco de Melancia Secreto
  cmd(dim, `setblock ${cx - 7} ${y - 1} ${cz - 7} gold_block`);
  cmd(dim, `setblock ${cx - 7} ${y} ${cz - 7} secretop:secret_melon`);
  system.runTimeout(() => {
    try {
      const chest = dim.getBlock({ x: cx + 7, y, z: cz - 8 })?.getComponent('minecraft:inventory')?.container;
      if (chest) {
        chest.setItem(0, new ItemStack('minecraft:writable_book', 1));
        chest.setItem(1, new ItemStack('minecraft:iron_pickaxe', 1));
        chest.setItem(2, new ItemStack('minecraft:bread', 16));
      }
    } catch { /* */ }
    sign(dim, { x: cx, y, z: cz + 9 }, '§l§dSECRET OP§r\n§fUse o §dControle\n§fpara começar!', true);
    sign(dim, { x: cx - 2, y, z: cz - 10 }, '§6CLUE§r\nResolva a pista:\nquebre o bloco ou\nderrote o mob');
    sign(dim, { x: cx + 2, y, z: cz - 10 }, '§aDescer§r\nPise no §6ouro\n§fpara ir ao mundo');
    sign(dim, { x: cx + 6, y, z: cz - 7 }, '§9Atril§r\nPonha o livro e\nvire a página:\na lâmpada acende!');
    sign(dim, { x: cx - 6, y, z: cz - 7 }, '§2Melancia\nSecreta§r\nQuebre com\npicareta de ferro');
    showcase(dim, cx, y, cz);
  }, 10);
}

function sign(dim, loc, text, facingNorth = false) {
  try {
    const b = dim.getBlock(loc); if (!b) return;
    cmd(dim, `setblock ${loc.x} ${loc.y} ${loc.z} standing_sign${facingNorth ? ' ["ground_sign_direction"=8]' : ''}`);
    b.getComponent('minecraft:sign')?.setText(text);
  } catch { /* */ }
}

function showcase(dim, cx, y, cz) {
  try { for (const e of dim.getEntities({ tags: [NS + 'showcase'] })) e.remove(); } catch { /* */ }
  const stands = [
    { dx: -9, dz: -2, name: '§5Conjunto Syntaxium', head: 'syntaxium_helmet', chest: 'syntaxium_chestplate', legs: 'netherite_leggings', feet: 'syntaxium_boots', hand: 'syntaxium_sword' },
    { dx: -9, dz: 2, name: '§cTNT Cowl', head: 'tnt_cowl', chest: 'creeper_shirt', hand: 'heavy_syntaxium_sword' },
    { dx: -9, dz: 6, name: '§8Katana de Netherita', hand: 'netherite_katana', chest: 'syntaxium_chestplate' },
    { dx: 9, dz: -2, name: '§fHK G3 Battle Rifle', hand: 'hk_g3_rifle', head: 'syntaxium_helmet' },
    { dx: 9, dz: 2, name: '§bLaser Blade', hand: 'laser_blade', feet: 'syntaxium_boots' },
    { dx: 9, dz: 6, name: '§5Katana de Yami', hand: 'yami_katana', legs: 'netherite_leggings' },
  ];
  for (const s of stands) {
    try {
      const e = dim.spawnEntity('minecraft:armor_stand', { x: cx + s.dx + 0.5, y, z: cz + s.dz + 0.5 });
      e.addTag(NS + 'showcase'); e.nameTag = s.name;
      e.setRotation({ x: 0, y: s.dx < 0 ? -90 : 90 });
      const put = (slot, key) => key && cmd(e, `replaceitem entity @s ${slot} 0 ${NS}${key}`);
      put('slot.armor.head', s.head); put('slot.armor.chest', s.chest); put('slot.armor.legs', s.legs);
      put('slot.armor.feet', s.feet); put('slot.weapon.mainhand', s.hand);
    } catch { /* */ }
  }
}

function buildArena(dim) {
  const C = arenaCenter(); if (!C) return false;
  if (!dim.getBlock({ x: C.x, y: C.y, z: C.z })) return false;
  const R = ARENA_RADIUS + 2, y = C.y;
  const F = (x1, y1, z1, x2, y2, z2, b) => cmd(dim, `fill ${x1} ${y1} ${z1} ${x2} ${y2} ${z2} ${b}`);
  for (let dz = -R; dz <= R; dz++) {
    const w = Math.floor(Math.sqrt(R * R - dz * dz));
    F(C.x - w, y - 6, C.z + dz, C.x + w, y + 8, C.z + dz, 'air');
    F(C.x - w, y - 3, C.z + dz, C.x + w, y - 3, C.z + dz, 'stone');
    F(C.x - w, y - 2, C.z + dz, C.x + w, y - 2, C.z + dz, 'dirt');
    F(C.x - w, y - 1, C.z + dz, C.x + w, y - 1, C.z + dz, 'grass_block');
  }
  for (let a = 0; a < 360; a += 2) {
    const x = Math.round(C.x + Math.cos(a * Math.PI / 180) * R), z = Math.round(C.z + Math.sin(a * Math.PI / 180) * R);
    F(x, y - 1, z, x, y + 3, z, 'red_stained_glass');
  }
  // lago (no vídeo, alguém cai na água com a borda encolhendo)
  F(C.x + 6, y - 2, C.z + 4, C.x + 10, y - 1, C.z + 7, 'water');
  // coberturas
  F(C.x - 12, y, C.z - 4, C.x - 12, y + 2, C.z + 4, 'cobblestone');
  F(C.x + 14, y, C.z - 6, C.x + 14, y + 2, C.z - 1, 'mossy_stone_bricks');
  F(C.x - 4, y, C.z - 14, C.x + 4, y + 1, C.z - 14, 'stone_bricks');
  F(C.x - 3, y, C.z + 15, C.x + 3, y + 2, C.z + 15, 'oak_planks');
  // torre central
  F(C.x - 1, y, C.z - 1, C.x + 1, y + 4, C.z + 1, 'polished_deepslate');
  F(C.x - 2, y + 5, C.z - 2, C.x + 2, y + 5, C.z + 2, 'polished_blackstone_bricks');
  F(C.x, y + 5, C.z, C.x, y + 5, C.z, 'sea_lantern');
  // árvores
  for (const [tx, tz] of [[-18, 10], [17, -12], [-15, -16]]) {
    F(C.x + tx - 2, y + 3, C.z + tz - 2, C.x + tx + 2, y + 5, C.z + tz + 2, 'oak_leaves');
    F(C.x + tx, y, C.z + tz, C.x + tx, y + 4, C.z + tz, 'oak_log');
  }
  S.arenaBuilt = true; save();
  return true;
}

function ensureWorld(p) {
  const dim = world.getDimension('overworld');
  if (!S.lobby) {
    const cx = Math.floor(p.location.x), cz = Math.floor(p.location.z);
    S.lobby = { x: cx, z: cz }; save();
    buildLobby(dim, cx, cz);
    try { world.setDefaultSpawnLocation({ x: cx, y: LOBBY_Y, z: cz }); } catch { /* */ }
    cmd(dim, `tickingarea add circle ${cx} ${LOBBY_Y} ${cz + ARENA_OFFSET_Z} 3 secretop_arena`);
    cmd(dim, `gamerule keepinventory ${S.settings.keepInv ? 'true' : 'false'}`);
    let tries = 0;
    const h = system.runInterval(() => {
      tries++;
      if (buildArena(dim) || tries > 30) system.clearRun(h);
    }, 40);
  }
}

// ------------------------------------------------------------------ ARMAS DE FOGO
const GUNS = {
  'secretop:hk_g3_rifle': { name: 'HK G3 Battle Rifle', mag: 31, dmg: 8, range: 80, delay: 4, auto: true, spread: 0.012, pellets: 1, sound: 'secretop.gun.rifle', reload: 40 },
  'secretop:combat_pistol': { name: 'Tactical Pistol', mag: 12, dmg: 7, range: 45, delay: 5, auto: false, spread: 0.01, pellets: 1, sound: 'secretop.gun.pistol', reload: 25 },
  'secretop:scatter_shotgun': { name: 'Secret Shotgun', mag: 6, dmg: 4, range: 22, delay: 16, auto: false, spread: 0.11, pellets: 7, sound: 'secretop.gun.shotgun', reload: 45 },
  'secretop:m700_sniper': { name: 'M700 Sniper Rifle', mag: 5, dmg: 24, range: 150, delay: 30, auto: false, spread: 0, pellets: 1, sound: 'secretop.gun.sniper', reload: 55 },
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
      const h = hits.find((x) => x.entity.id !== p.id && !x.entity.hasTag(NS + 'showcase') && x.entity.typeId !== 'secretop:op_allay');
      if (h) { target = h.entity; tDist = h.distance; }
    } catch { /* */ }
    // rastro da bala
    const steps = Math.min(24, Math.floor(tDist / 1.5));
    for (let s = 1; s <= steps; s += (g.pellets > 1 ? 2 : 1)) fx(dim, 'secretop:bullet_trail', { x: head.x + dir.x * s * 1.5, y: head.y + dir.y * s * 1.5 - 0.1, z: head.z + dir.z * s * 1.5 });
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
  switch (key) {
    case 'clue_remote': openMenu(p); break;
    case 'clue_book': openDiary(p); break;
    case 'totem_boost': useTotem(p); break;
    case 'allay_whistle': summonAllay(p); break;
    case 'netherite_katana': katanaDash(p); break;
    case 'ammo_box': {
      const h = Object.keys(GUNS).find((g) => countItem(p, g) > 0);
      tell(p, h ? '§7Segure a arma e use §fAGACHAR + USAR §7para recarregar.' : '§7Você ainda não tem uma arma de fogo.');
      break;
    }
    default: break;
  }
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
      // lobby: sem fome nem dano
      if (S.lobby && inLobby(p.location)) { effect(p, 'saturation', 40, 0); effect(p, 'resistance', 40, 4); }
    } catch { /* */ }
  }
}

// ------------------------------------------------------------------ HUD (barra de ação acima da hotbar)
function bar(pct, size = 20) {
  const f = Math.round(pct * size);
  return '§a' + '-'.repeat(f) + '§8' + '-'.repeat(size - f);
}
function hud() {
  for (const p of players()) {
    const lines = [];
    const it = heldItem(p); const g = it && GUNS[it.typeId];
    if (g) {
      const r = reloading.get(p.id);
      if (r) {
        const pr = (tick() - r.start) / Math.max(1, r.until - r.start);
        lines.push(`§e${g.name}  §fRECARREGANDO ${bar(pr, 10)}`);
      } else {
        const n = getAmmo(p, it.typeId);
        lines.push(`§7▬▬ §f${g.name}  §l${n <= Math.ceil(g.mag / 4) ? '§c' : '§f'}${String(n).padStart(3, '0')}§r§7/${g.mag}  §8| §6${countItem(p, NS + 'ammo_box')} caixas`);
      }
    }
    const tu = totemUntil.get(p.id);
    if (tu && tu > tick()) lines.push(`§c✚ Totem Boost V §f${mmss((tu - tick()) / 20)}`);
    const c = currentClue();
    if (S.phase === 'clue' && c) {
      lines.push(`§6§lCLUE: §r§f${c.riddle} §7${mmss(S.timeLeft)}`);
      if (S.timeLeft <= S.total / 2) lines.push(`§8Dica: §7${c.hint}`);
    } else if (S.phase === 'intermission') {
      const pct = 1 - S.timeLeft / Math.max(1, S.total);
      lines.push(`§6§lNEXT CLUE: ${bar(pct)} §f${Math.round(pct * 100)}%`);
    } else if (S.phase === 'countdown') {
      lines.push(`§fDeathmatch: §c§l${S.timeLeft}`);
    } else if (S.phase === 'deathmatch') {
      const alive = players().filter((q) => S.alive.includes(q.id)).length;
      lines.push(`§c§lDEATHMATCH §r§7| §eBorda: ${borderRadius()} §7| §f${S.solo ? 'Guardiões' : alive + ' vivos'} §7| ${mmss(S.timeLeft)}`);
    }
    if (lines.length) { try { p.onScreenDisplay.setActionBar(lines.join('\n')); } catch { /* */ } }
  }
}

function borderParticles() {
  if (S.phase !== 'deathmatch') return;
  const C = arenaCenter(); if (!C) return;
  const dim = world.getDimension('overworld'); const r = borderRadius();
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    for (const dy of [0.5, 1.6]) fx(dim, 'secretop:border_wall', { x: C.x + 0.5 + Math.cos(a) * r, y: C.y + dy, z: C.z + 0.5 + Math.sin(a) * r });
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

// ------------------------------------------------------------------ MENUS (Controle do Desafio)
const PHASE_NAME = { idle: '§7Aguardando', intermission: '§eNEXT CLUE', clue: '§6Pista ativa', countdown: '§cDeathmatch em breve', deathmatch: '§cDEATHMATCH', finished: '§6Fim de jogo' };

function openMenu(p) {
  const c = currentClue();
  let body = `§fEstado: ${PHASE_NAME[S.phase] ?? S.phase}\n`;
  if (S.order.length && S.phase !== 'idle') body += `§fPista: §e${Math.min(S.pos + 1, S.order.length)}/${S.order.length}\n`;
  if (S.phase === 'clue' && c) body += `\n§6§lCLUE: §r§f${c.riddle}\n§7Tempo: ${mmss(S.timeLeft)}\n`;
  body += `\n§7Config: ${S.settings.count} pistas • ${S.settings.clueMin} min cada • Deathmatch ${S.settings.dmSecs}s`;
  const f = new ActionFormData().title('§l§dSECRET OP §r§8- Controle').body(body);
  const actions = [];
  const add = (label, icon, fn) => { f.button(label, icon); actions.push(fn); };
  if (S.phase === 'idle' || S.phase === 'finished') {
    add('§a§l▶ INICIAR DESAFIO', 'textures/secretop/items/clue_remote', () => startChallenge(p));
    add('§0Configurações', 'textures/secretop/items/clue_book', () => openSettings(p));
  } else if (S.phase === 'clue' || S.phase === 'intermission') {
    if (S.phase === 'clue' && S.settings.training) add('§0Treino: criar o alvo perto de mim', 'textures/secretop/items/allay_whistle', () => trainingTarget(p));
    add('§0Pular esta pista', 'textures/secretop/items/ammo_box', () => { if (S.phase === 'clue') expireClue(); else { S.timeLeft = 1; } });
    add('§c§lIniciar Deathmatch agora', 'textures/secretop/items/hk_g3_rifle', () => { S.phase = 'countdown'; S.total = 30; S.timeLeft = 30; save(); say('§e30 segundos até o Deathmatch, preparem-se!'); });
  }
  if (inLobby(p.location)) add('§0Descer para o mundo', 'textures/secretop/items/syntaxium_boots', () => dropToWorld(p));
  else if (S.phase !== 'deathmatch' && S.phase !== 'countdown') add('§0Ir para o lobby', 'textures/secretop/items/totem_boost', () => goLobby(p));
  add('§0Como jogar', 'textures/secretop/items/clue_book', () => howTo(p));
  if (S.phase !== 'idle') add('§4Encerrar desafio', 'textures/secretop/items/tnt_cowl', () => { say(`§7${p.name} encerrou o desafio.`); resetToLobby(); });
  f.show(p).then((r) => {
    if (r.canceled || r.selection === undefined) return;
    try { actions[r.selection]?.(); } catch { /* */ }
  }).catch(() => { /* */ });
}

function openSettings(p) {
  const st = S.settings; const counts = [8, 12, 16, 22];
  new ModalFormData().title('§l§dSECRET OP §r§8- Configurações')
    .dropdown('Número de pistas', ['8 (rápido)', '12 (normal)', '16', '22 (todas, como no vídeo)'], { defaultValueIndex: Math.max(0, counts.indexOf(st.count)) })
    .slider('Tempo por pista (minutos)', 2, 10, { defaultValue: st.clueMin, valueStep: 1 })
    .slider('Intervalo NEXT CLUE (segundos)', 10, 60, { defaultValue: st.gapSecs, valueStep: 5 })
    .slider('Duração do Deathmatch (segundos)', 90, 300, { defaultValue: st.dmSecs, valueStep: 30 })
    .toggle('Manter inventário ao morrer', { defaultValue: st.keepInv })
    .toggle('Permitir "Treino" (criar o alvo perto)', { defaultValue: st.training })
    .show(p).then((r) => {
      if (r.canceled || !r.formValues) return;
      const v = r.formValues;
      S.settings = { count: counts[Number(v[0])] ?? 12, clueMin: Number(v[1]), gapSecs: Number(v[2]), dmSecs: Number(v[3]), keepInv: !!v[4], training: !!v[5] };
      save(); cmd(world.getDimension('overworld'), `gamerule keepinventory ${S.settings.keepInv ? 'true' : 'false'}`);
      tell(p, '§aConfigurações salvas.');
    }).catch(() => { /* */ });
}

function openDiary(p) {
  let body = '';
  if (!S.log.length && S.phase === 'idle') body = '§7Nenhuma pista ainda. Use o §dControle do Desafio §7para começar.';
  S.log.forEach((e, n) => {
    const c = CLUES[e.i];
    body += `§e${n + 1}. §fCLUE: ${c.riddle}\n   §7→ §d${c.answer} ${e.by ? `§7(por §a${e.by}§7)` : '§8(ninguém)'}\n`;
  });
  const c = currentClue();
  if (S.phase === 'clue' && c) body += `\n§6§lAGORA: §r§f${c.riddle}\n§7Tempo restante: ${mmss(S.timeLeft)}${S.timeLeft <= S.total / 2 ? `\n§8Dica: §7${c.hint}` : ''}`;
  new ActionFormData().title('§l§5Diário de Pistas').body(body || ' ').button('Fechar').show(p).catch(() => { /* */ });
}

function howTo(p) {
  new ActionFormData().title('§l§dComo jogar').body([
    '§e1.§f Uma §6CLUE§f aparece acima da hotbar. Descubra o bloco ou mob.',
    '§e2.§f Quebre o bloco (ou derrote o mob). Allay, gato, axolote e atril: interagir também vale.',
    '§e3.§f Quem resolver primeiro faz os §dDROPS OP§f saltarem do lugar!',
    '§e4.§f Se o tempo acabar, a resposta é revelada e vem a próxima (barra §6NEXT CLUE§f).',
    '§e5.§f Na metade do tempo aparece uma §8Dica§f.',
    '§e6.§f Depois da última pista: 30 s e começa o §cDeathmatch§f com borda que encolhe.',
    '',
    '§7Armas: SEGURE USAR para atirar. AGACHAR + USAR recarrega (gasta 1 Caixa de Munição).',
    '§7Totem Boost V: carregue para +4 corações; USE para 45 s de buffs.',
    '§7Katana de Netherita: USAR = investida. Machado Syntaxium derruba a árvore toda.',
  ].join('\n')).button('Entendi!').show(p).catch(() => { /* */ });
}

function trainingTarget(p) {
  const c = currentClue(); if (!c) return;
  const dim = p.dimension;
  const pos = { x: Math.floor(p.location.x) + 2, y: Math.floor(p.location.y), z: Math.floor(p.location.z) + 2 };
  if (inLobby(pos) || inArena(pos)) { tell(p, '§cO treino não funciona no lobby/arena. Desça para o mundo.'); return; }
  const t = c.targets[0];
  if (c.kind === 'block') {
    cmd(dim, `setblock ${pos.x} ${pos.y} ${pos.z} ${t}`);
  } else {
    try { dim.spawnEntity(t, { x: pos.x + 0.5, y: pos.y + 0.2, z: pos.z + 0.5 }); } catch { tell(p, '§cNão consegui criar o mob aqui.'); return; }
  }
  say(`§8[Treino] §7${p.name} criou o alvo da pista atual.`);
}

// ------------------------------------------------------------------ EVENTOS
system.beforeEvents.startup.subscribe((ev) => {
  ev.itemComponentRegistry.registerCustomComponent('secretop:use', {
    onUse: (e) => { const p = e.source; const s = e.itemStack; system.run(() => onUseItem(p, s)); },
  });
});

world.afterEvents.itemUse.subscribe((e) => {
  if (e.itemStack?.typeId?.startsWith(NS)) onUseItem(e.source, e.itemStack);
});
world.afterEvents.itemStartUse.subscribe((e) => {
  const g = GUNS[e.itemStack?.typeId];
  if (!g) return;
  if (g.auto && !e.source.isSneaking) firing.add(e.source.id);
  triggerGun(e.source, e.itemStack.typeId, false);
});
world.afterEvents.itemStopUse.subscribe((e) => { firing.delete(e.source.id); });
world.afterEvents.itemCompleteUse.subscribe((e) => onEat(e.source, e.itemStack));

world.afterEvents.entityHitEntity.subscribe((e) => { try { onMelee(e.damagingEntity, e.hitEntity); } catch { /* */ } });

world.afterEvents.playerBreakBlock.subscribe((e) => {
  const id = e.brokenBlockPermutation.type.id;
  const loc = { x: e.block.location.x + 0.5, y: e.block.location.y + 0.5, z: e.block.location.z + 0.5 };
  // Bloco de Melancia Secreto: precisa de picareta de ferro ou melhor
  if (id === NS + 'secret_melon') {
    const tool = e.itemStackBeforeBreak?.typeId ?? '';
    if (/(iron|diamond|netherite)_pickaxe$/.test(tool)) {
      if (!inLobby(loc)) dropRewards(e.player, loc, { featured: [rollPool()] });
      else if (ready(e.player, 'lobbymelon', 20 * 60 * 5)) dropRewards(e.player, loc, { featured: [], extra: 1 });
      else tell(e.player, '§7A Melancia Secreta do lobby recarrega a cada 5 minutos por jogador.');
      if (inLobby(loc)) system.runTimeout(() => cmd(e.dimension, `setblock ${e.block.location.x} ${e.block.location.y} ${e.block.location.z} secretop:secret_melon`), 100);
    } else {
      tell(e.player, '§cA Melancia Secreta precisa de uma picareta de ferro (ou melhor)!');
      if (inLobby(loc)) system.runTimeout(() => cmd(e.dimension, `setblock ${e.block.location.x} ${e.block.location.y} ${e.block.location.z} secretop:secret_melon`), 20);
    }
  }
  if (e.itemStackBeforeBreak?.typeId === NS + 'syntaxium_axe' && /(_log|_stem)$/.test(id)) fellTree(e.player, e.block, id);
  const c = currentClue();
  if (S.phase === 'clue' && c && c.kind === 'block' && c.targets.includes(id)) {
    if (inLobby(loc) || inArena(loc)) { tell(e.player, '§7Blocos do lobby/arena não contam. Ache um no mundo!'); return; }
    solve(e.player, loc);
  }
});

world.afterEvents.playerInteractWithBlock.subscribe((e) => {
  if (!e.isFirstEvent) return;
  const c = currentClue();
  if (S.phase === 'clue' && c?.use && c.kind === 'block' && c.targets.includes(e.block.typeId)) {
    const loc = { x: e.block.location.x + 0.5, y: e.block.location.y + 1, z: e.block.location.z + 0.5 };
    if (inLobby(loc) || inArena(loc)) { tell(e.player, '§7O atril do lobby é só demonstração. Ache um no mundo!'); return; }
    solve(e.player, loc);
  }
});

world.afterEvents.playerInteractWithEntity.subscribe((e) => {
  const c = currentClue();
  if (S.phase === 'clue' && c?.use && c.kind === 'mob' && c.targets.includes(e.target.typeId)) {
    let loc; try { loc = { ...e.target.location }; } catch { loc = e.player.location; }
    solve(e.player, loc);
  }
});

world.afterEvents.entityDie.subscribe((e) => {
  const dead = e.deadEntity;
  let typeId; try { typeId = dead.typeId; } catch { return; }
  if (typeId === 'minecraft:player') {
    if (S.phase === 'deathmatch' && S.alive.includes(dead.id)) {
      S.alive = S.alive.filter((x) => x !== dead.id); save();
      say(`§c☠ ${Reflect.get(dead, 'name') ?? 'Jogador'} foi eliminado! §7(${S.alive.length} restante(s))`);
    }
    return;
  }
  const killer = e.damageSource?.damagingEntity;
  const c = currentClue();
  if (S.phase === 'clue' && c?.kind === 'mob' && c.targets.includes(typeId) && killer?.typeId === 'minecraft:player') {
    let loc; try { loc = { ...dead.location }; } catch { loc = killer.location; }
    solve(killer, loc);
  }
});

world.afterEvents.playerSpawn.subscribe((e) => {
  const p = e.player;
  system.runTimeout(() => {
    if (!S) return;
    if (e.initialSpawn) {
      ensureWorld(p);
      showBoard();
      if (!p.getDynamicProperty(NS + 'welcomed')) {
        p.setDynamicProperty(NS + 'welcomed', true);
        give(p, new ItemStack(NS + 'clue_remote', 1));
        give(p, new ItemStack(NS + 'clue_book', 1));
        system.runTimeout(() => goLobby(p), 20);
        title(p, '§l§dSECRET OP', '§fSegure o §dControle §fe toque em USAR', 80);
      }
      tell(p, '§d[SECRET OP] §fBem-vindo! Use o §dControle do Desafio §f(USAR) para abrir o menu.');
    }
    if (S.phase === 'idle' && p.getGameMode() === GameMode.Spectator) { try { p.setGameMode(GameMode.Survival); goLobby(p); } catch { /* */ } }
    if (S.phase === 'deathmatch' && !S.alive.includes(p.id)) {
      try { p.setGameMode(GameMode.Spectator); const C = arenaCenter(); if (C) p.teleport({ x: C.x, y: C.y + 12, z: C.z }); } catch { /* */ }
    }
  }, 30);
});

// ------------------------------------------------------------------ LAÇOS
function secondTick() {
  if (players().length === 0) return;
  if (S.phase === 'intermission' || S.phase === 'clue' || S.phase === 'countdown' || S.phase === 'deathmatch' || S.phase === 'finished') {
    S.timeLeft--;
    if (S.phase === 'intermission' && S.timeLeft <= 0) beginClue();
    else if (S.phase === 'clue' && S.timeLeft <= 0) expireClue();
    else if (S.phase === 'clue' && S.timeLeft === Math.floor(S.total / 2)) say(`§8[Dica] §7${currentClue()?.hint ?? ''}`);
    else if (S.phase === 'countdown' && S.timeLeft <= 0) startDeathmatch();
    else if (S.phase === 'countdown' && S.timeLeft <= 5) for (const p of players()) sfx(p, 'note.hat', 1.5);
    else if (S.phase === 'deathmatch') deathmatchSecond();
    else if (S.phase === 'finished' && S.timeLeft <= 0) resetToLobby();
    if (S.timeLeft % 5 === 0) save();
  }
  armorSecond();
}

function lobbyPortal() {
  if (!S.lobby) return;
  for (const p of players()) {
    const l = p.location;
    if (Math.abs(l.x - (S.lobby.x + 0.5)) <= 1.6 && l.z >= S.lobby.z - 9 && l.z <= S.lobby.z - 6 && Math.abs(l.y - LOBBY_Y) < 1.5) {
      if (ready(p, 'portal', 40)) { title(p, ' ', '§aBoa caçada!', 20); dropToWorld(p); }
    }
  }
}

world.afterEvents.worldLoad.subscribe(() => {
  load();
  if (S.phase === 'deathmatch' || S.phase === 'countdown' || S.phase === 'finished') { S.phase = 'idle'; save(); }
  system.runInterval(gunLoop, 1);
  system.runInterval(allayTick, 2);
  system.runInterval(() => { hud(); borderParticles(); lobbyPortal(); }, 10);
  system.runInterval(secondTick, 20);
});
