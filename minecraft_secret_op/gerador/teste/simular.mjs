// Simula uma partida completa: entrar no mundo -> iniciar -> resolver todas as pistas -> Deathmatch solo -> vitória.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const MC = await import('./mock/server.js');
const { formQueue } = await import('./mock/server-ui.js');
// copia o main.js trocando os imports reais pelos mocks
const mainSrc = path.join(here, '..', '..', 'src', 'scripts', 'main.js');
const copia = path.join(here, 'main_teste.mjs');
fs.writeFileSync(copia, fs.readFileSync(mainSrc, 'utf8').replace("'@minecraft/server-ui'", "'./mock/server-ui.js'").replace("'@minecraft/server'", "'./mock/server.js'"));
process.argv[2] = 'file://' + copia;
const { world, system, advance, fire, Player, players, log, ItemStack, entities, _dim } = MC;
await import(process.argv[2]);
fire('startup', { itemComponentRegistry: { registerCustomComponent: () => {} }, blockComponentRegistry: {} });
fire('worldLoad', {});
const p = new Player('Tester'); players.push(p);
fire('playerSpawn', { player: p, initialSpawn: true });
advance(120);
const ok = (c, m) => { if (!c) { console.log('FALHOU:', m); console.log(log.slice(-15).join('\n')); process.exit(1); } else console.log('ok -', m); };
const state = () => JSON.parse(world.getDynamicProperty('secretop:state'));
ok(state().lobby, 'lobby criado no primeiro login');
ok(p.inv.slots.some((s) => s?.typeId === 'secretop:clue_remote'), 'jogador recebeu o Controle do Desafio');
// abrir o menu e escolher "INICIAR"
formQueue.push((btns) => ({ selection: btns.findIndex((b) => b.includes('INICIAR')) }));
fire('itemUse', { source: p, itemStack: new ItemStack('secretop:clue_remote') });
await new Promise((r) => setTimeout(r, 5)); advance(100);
ok(state().phase === 'intermission' || state().phase === 'clue', 'desafio iniciou (fase ' + state().phase + ')');
p.location = { x: 500, y: 70, z: 500 };
let solved = 0;
for (let guard = 0; guard < 40 && ['intermission', 'clue'].includes(state().phase); guard++) {
  advance(20 * 25);
  const st = state();
  if (st.phase !== 'clue') continue;
  const c = st.order[st.pos];
  const ab = p.actionbar;
  ok(ab.includes('CLUE:'), `HUD mostra a CLUE ${st.pos + 1}/${st.order.length}`);
  // resolver: quebrar bloco ou matar mob
  const src = await import('fs').then((fs) => fs.readFileSync(process.argv[2].replace('file://', ''), 'utf8'));
  const blk = (await import(process.argv[2])).default; // noop
  const isMob = /kind: 'mob'/.test(src.split('riddle:')[c + 1]);
  const target = src.split('riddle:')[c + 1].match(/targets: \['([^']+)'/)[1];
  if (isMob) {
    const mob = _dim.spawnEntity(target, { x: 501, y: 70, z: 501 });
    fire('entityDie', { deadEntity: mob, damageSource: { damagingEntity: p } });
  } else {
    fire('playerBreakBlock', { player: p, dimension: _dim, block: { location: { x: 501, y: 70, z: 501 } }, brokenBlockPermutation: { type: { id: target } }, itemStackBeforeBreak: new ItemStack('minecraft:iron_pickaxe') });
  }
  solved++;
}
ok(solved === state().order.length, `resolveu as ${solved} pistas`);
ok(log.some((l) => l.includes('resolveu a pista! A resposta era')), 'chat anuncia a resposta');
ok(log.filter((l) => l.startsWith('DROP ')).length >= solved * 3, 'drops OP saltaram (' + log.filter((l) => l.startsWith('DROP ')).length + ' itens)');
ok(state().phase === 'countdown', 'contagem do Deathmatch');
advance(20 * 36);
ok(state().phase === 'deathmatch', 'Deathmatch começou');
ok(entities.filter((e) => e.hasTag('secretop:dm_mob')).length > 0, 'guardiões do modo solo apareceram');
// arma: dar um rifle e atirar
p.inv.slots[0] = new ItemStack('secretop:hk_g3_rifle'); p.selectedSlotIndex = 0;
fire('itemStartUse', { source: p, itemStack: p.inv.slots[0], useDuration: 0 });
advance(40); fire('itemStopUse', { source: p, itemStack: p.inv.slots[0] });
advance(10);
ok(/HK G3 Battle Rifle/.test(p.actionbar) && /0(2|1)\d/.test(p.actionbar), 'HUD de munição: ' + p.actionbar.split('\n')[0].replace(/§./g, ''));
for (const e of [...entities]) if (e.hasTag('secretop:dm_mob')) e.remove();
advance(60);
ok(state().phase === 'finished', 'vitória no modo solo');
advance(20 * 12);
ok(state().phase === 'idle', 'voltou ao lobby');
console.log('\nÚltimas mensagens:\n' + log.filter((l) => !l.startsWith('DROP')).slice(-8).join('\n'));
