// Mock mínimo da API @minecraft/server para testar o fluxo do main.js fora do jogo.
export const log = [];
const handlers = {};
const mkEvt = (name) => ({ subscribe: (f) => { (handlers[name] ||= []).push(f); return f; } });
export const fire = (name, ev) => (handlers[name] || []).forEach((f) => f(ev));
let tickN = 0; const timers = []; let tid = 0;
export const system = {
  get currentTick() { return tickN; },
  runInterval(f, n) { const id = ++tid; timers.push({ id, f, n, next: tickN + n, rep: true }); return id; },
  runTimeout(f, n = 1) { const id = ++tid; timers.push({ id, f, n, next: tickN + n, rep: false }); return id; },
  run(f) { return this.runTimeout(f, 1); },
  clearRun(id) { const i = timers.findIndex((t) => t.id === id); if (i >= 0) timers.splice(i, 1); },
  beforeEvents: { startup: mkEvt('startup') },
  afterEvents: { scriptEventReceive: mkEvt('scriptEventReceive') },
};
export function advance(n) {
  for (let k = 0; k < n; k++) {
    tickN++;
    for (const t of [...timers]) if (t.next <= tickN) {
      if (t.rep) t.next += t.n; else system.clearRun(t.id);
      t.f();
    }
  }
}
export class ItemStack {
  constructor(typeId, amount = 1) { this.typeId = typeId.includes(':') ? typeId : 'minecraft:' + typeId; this.amount = amount; this.nameTag = undefined; this.lore = []; }
  setLore(l) { this.lore = l; }
  getComponent(id) { return id === 'minecraft:enchantable' ? { addEnchantment: (e) => { if (!e.type) throw new Error('sem tipo'); } } : undefined; }
}
export const EquipmentSlot = { Head: 'Head', Chest: 'Chest', Legs: 'Legs', Feet: 'Feet', Mainhand: 'Mainhand', Offhand: 'Offhand' };
export const GameMode = { Survival: 'Survival', Spectator: 'Spectator', Creative: 'Creative', Adventure: 'Adventure' };
export const EntityDamageCause = { magic: 'magic', projectile: 'projectile', entityAttack: 'entityAttack' };
export class BlockVolume { constructor(a, b) { this.from = a; this.to = b; } }
export const EnchantmentTypes = { get: (id) => ({ id }) };
export const DisplaySlotId = { Sidebar: 'Sidebar' };
export const ObjectiveSortOrder = { Descending: 1 };
const props = {};
const scores = new Map();
const objective = { getScore: (p) => scores.get(p.name), setScore: (p, v) => scores.set(p.name, v), addScore: (p, v) => scores.set(p.name, (scores.get(p.name) || 0) + v),
  getParticipants: () => [...scores.keys()], removeParticipant: (k) => scores.delete(k) };
export const commands = [];
class Container {
  constructor() { this.size = 36; this.slots = new Array(36).fill(undefined); }
  getItem(i) { return this.slots[i]; }
  setItem(i, it) { this.slots[i] = it; }
  addItem(it) { const i = this.slots.findIndex((s) => !s); if (i < 0) return it; this.slots[i] = it; return undefined; }
}
export const entities = [];
class Entity {
  constructor(typeId, loc, dim) { this.typeId = typeId; this.location = { ...loc }; this.dimension = dim; this.id = 'e' + (++tid); this.tags = new Set(); this.dp = {}; this.isValid = true; entities.push(this); }
  addTag(t) { this.tags.add(t); return true; } removeTag(t) { return this.tags.delete(t); } hasTag(t) { return this.tags.has(t); }
  applyImpulse() {} applyKnockback(h, v) { if (typeof h !== 'object') throw new Error('applyKnockback v2 espera objeto'); } applyDamage() { return true; }
  setRotation() {} remove() { this.isValid = false; const i = entities.indexOf(this); if (i >= 0) entities.splice(i, 1); }
  runCommand(c) { commands.push(c); return { successCount: 1 }; }
  teleport(l) { this.location = { ...l }; }
  getDynamicProperty(k) { return this.dp[k]; } setDynamicProperty(k, v) { this.dp[k] = v; }
  getHeadLocation() { return { x: this.location.x, y: this.location.y + 1.6, z: this.location.z }; }
  addEffect() { return undefined; } getComponent() { return undefined; }
}
const dim = {
  id: 'minecraft:overworld',
  runCommand(c) { commands.push(c); return { successCount: 1 }; },
  getTopmostBlock(l) { return { location: { x: l.x, y: 64, z: l.z } }; },
  containsBlock() { return false; },
  getBlock(l) { return { location: l, typeId: l.y <= 64 ? 'minecraft:grass_block' : 'minecraft:air', getComponent: (id) => id === 'minecraft:inventory' ? { container: new Container() } : id === 'minecraft:sign' ? { setText() {} } : undefined }; },
  spawnItem(it, l) { log.push('DROP ' + it.typeId); return new Entity('minecraft:item', l, dim); },
  spawnEntity(t, l) { return new Entity(t, l, dim); },
  getEntities(q = {}) { return entities.filter((e) => e.isValid && (!q.type || e.typeId === q.type) && (!q.tags || q.tags.every((t) => e.tags.has(t)))); },
  spawnParticle() {}, playSound() {}, createExplosion() { log.push('EXPLOSAO'); return true; },
  getBlockFromRay(o) { return { block: { location: { x: Math.floor(o.x), y: 64, z: Math.floor(o.z) } }, faceLocation: { x: 0.5, y: 1, z: 0.5 } }; },
  getEntitiesFromRay() { return entities.filter((e) => e.typeId === 'minecraft:zombie').map((e) => ({ entity: e, distance: 5 })); },
};
export class Player extends Entity {
  constructor(name) {
    super('minecraft:player', { x: 10, y: 70, z: 20 }, dim); this.name = name; this.selectedSlotIndex = 0; this.isSneaking = false; this.gm = 'Survival';
    this.inv = new Container(); this.equip = {}; this.titles = []; this.actionbar = '';
    this.onScreenDisplay = { setTitle: (t, o) => this.titles.push(t + ' | ' + (o?.subtitle ?? '')), setActionBar: (t) => { this.actionbar = t; } };
  }
  getComponent(id) {
    if (id === 'minecraft:inventory') return { container: this.inv };
    if (id === 'minecraft:equippable') return { getEquipment: (s) => this.equip[s] };
    if (id === 'minecraft:health') return { currentValue: 20 };
    return undefined;
  }
  sendMessage(m) { log.push(`[${this.name}] ${m}`); } playSound() {}
  setGameMode(g) { this.gm = g; } getGameMode() { return this.gm; }
  getViewDirection() { return { x: 0, y: 0, z: 1 }; } extinguishFire() {}
}
export const players = [];
export const world = {
  afterEvents: Object.fromEntries(['worldLoad', 'itemUse', 'itemStartUse', 'itemStopUse', 'itemCompleteUse', 'entityHitEntity', 'playerBreakBlock',
    'playerInteractWithBlock', 'playerInteractWithEntity', 'entityDie', 'playerSpawn'].map((n) => [n, mkEvt(n)])),
  getPlayers: () => players, getDimension: () => dim,
  getDynamicProperty: (k) => props[k], setDynamicProperty: (k, v) => { props[k] = v; },
  sendMessage: (m) => log.push(m), setDefaultSpawnLocation() {},
  scoreboard: { getObjective: () => objective, addObjective: () => objective, setObjectiveAtDisplaySlot() {} },
};
export const _dim = dim;
