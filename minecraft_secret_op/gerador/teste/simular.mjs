// Simula uma rodada completa da v3: entrar -> vila -> 25 min de preparo com pistas -> luta final solo -> vitória -> /scriptevent reiniciar.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const MC = await import('./mock/server.js');
const mainSrc = path.join(here, '..', '..', 'src', 'scripts', 'main.js');
const src = fs.readFileSync(mainSrc, 'utf8');
const copia = path.join(here, 'main_teste.mjs');
fs.writeFileSync(copia, src.replace("'@minecraft/server'", "'./mock/server.js'"));
const { world, advance, fire, Player, players, log, ItemStack, entities, _dim, commands } = MC;
await import('file://' + copia);
const ok = (c, m) => { if (!c) { console.log('FALHOU:', m); console.log(log.slice(-12).join('\n')); process.exit(1); } console.log('ok -', m); };
const st = () => JSON.parse(world.getDynamicProperty('secretop:state'));
fire('startup', { itemComponentRegistry: { registerCustomComponent: () => {} } });
fire('worldLoad', {});
const p = new Player('Tester'); players.push(p);
fire('playerSpawn', { player: p, initialSpawn: true });
advance(200);
ok(st().village, `vila pronta (${st().village?.kind})`);
ok(commands.some((c) => c.includes('bell')) || st().village.kind !== 'construída', 'vila tem sino');
ok(commands.some((c) => c.includes('lectern')), 'vila tem biblioteca com atril');
ok(!p.inv.slots.some(Boolean), 'sem itens de botão no inventário');
ok(st().phase === 'intro' || st().phase === 'prep', 'desafio começou sozinho');
let introS = 0; while (st().phase !== 'prep' && introS < 60) { advance(20); introS++; }
ok(st().phase === 'prep', `preparo de 25:00 começou após ${introS}s de apresentação`);
ok(commands.includes('gamerule pvp false'), 'PvP desligado no preparo');
const clueSrc = src.split('const CLUES = [')[1].split('];')[0].split('riddle:').slice(1);
let solved = 0, seconds = 0;
const elapsedBefore = 0;
p.location = { x: 400, y: 70, z: 400 };
while (st().phase === 'prep') {
  advance(20); seconds++;
  const s = st();
  if (s.clue.mode === 'clue' && s.clue.left === 100 && s.clue.pos % 3 !== 2) {   // resolve 2 de cada 3 pistas
    const block = clueSrc[s.clue.pos];
    const target = block.match(/targets: \['([^']+)'/)[1];
    ok(p.actionbar.includes('PISTA:'), `HUD: ${p.actionbar.split('\n').map((l) => l.replace(/§./g, '')).join(' / ').slice(0, 110)}`);
    if (/kind: 'mob'/.test(block)) fire('entityDie', { deadEntity: _dim.spawnEntity(target, { x: 401, y: 70, z: 401 }), damageSource: { damagingEntity: p } });
    else fire('playerBreakBlock', { player: p, dimension: _dim, block: { location: { x: 401, y: 70, z: 401 } }, brokenBlockPermutation: { type: { id: target } }, itemStackBeforeBreak: new ItemStack('minecraft:iron_pickaxe') });
    solved++;
  }
  if (seconds > 1600) break;
}
const total = seconds + elapsedBefore;
ok(total >= 1499 && total <= 1501, `luta começou após ${total}s de preparo (25:00 sem exceção)`);
ok(solved > 0 && log.filter((l) => l.startsWith('DROP ')).length >= solved * 3, `${solved} pistas resolvidas, ${log.filter((l) => l.startsWith('DROP ')).length} drops OP`);
ok(st().phase === 'fight', 'LUTA FINAL');
ok(commands.includes('gamerule pvp true'), 'PvP ligado na luta');
ok(!commands.some((c) => /tickingarea|red_stained_glass/.test(c)), 'sem arena/borda');
for (let w = 1; w <= 3; w++) {
  advance(20 * 10);
  ok(entities.filter((e) => e.hasTag('secretop:dm_mob')).length > 0, `onda ${w} de guardiões perto do jogador`);
  for (const e of [...entities]) if (e.hasTag('secretop:dm_mob')) e.remove();
}
advance(40);
ok(st().phase === 'finished' && st().winner === 'Tester', 'vitória no modo solo');
fire('scriptEventReceive', { id: 'secretop:reiniciar', message: '' });
advance(40);
ok(st().phase === 'intro' && st().round === 2, 'nova rodada via /scriptevent secretop:reiniciar');
console.log('\n' + log.filter((l) => !l.startsWith('DROP')).slice(-6).join('\n'));
