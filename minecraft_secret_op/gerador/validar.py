"""Validações fora do jogo: JSON, referências de texturas/sons/geometrias, IDs usados no script, level.dat."""
import json, re, struct, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BP, RP = ROOT / 'build' / 'SecretOP_v2_BP', ROOT / 'build' / 'SecretOP_v2_RP'
erros = []
def err(m): erros.append(m)

js = {}
for p in list(BP.rglob('*.json')) + list(RP.rglob('*.json')):
    try: js[p] = json.loads(p.read_text(encoding='utf-8'))
    except Exception as e: err(f'JSON inválido {p}: {e}')

def tex_exists(path):
    return any((RP / (path + ext)).exists() for ext in ('.png', '.tga', '.jpg'))

items_tex = js[RP / 'textures' / 'item_texture.json']['texture_data']
for k, v in items_tex.items():
    if not tex_exists(v['textures']): err(f'textura de item faltando: {v}')
for k, v in js[RP / 'textures' / 'terrain_texture.json']['texture_data'].items():
    if not tex_exists(v['textures']): err(f'textura de bloco faltando: {v}')

lang = dict(l.split('=', 1) for l in (RP / 'texts' / 'pt_BR.lang').read_text(encoding='utf-8').splitlines() if '=' in l)
item_ids, comps_used = set(), set()
for p in (BP / 'items').glob('*.json'):
    d = js[p]['minecraft:item']; iid = d['description']['identifier']; item_ids.add(iid)
    c = d['components']
    icon = c['minecraft:icon']['textures']['default']
    if icon not in items_tex: err(f'{iid}: ícone {icon} não está no item_texture.json')
    if c['minecraft:display_name']['value'] not in lang: err(f'{iid}: nome sem tradução')
    comps_used |= {k for k in c if not k.startswith('minecraft:')}
for p in (RP / 'attachables').glob('*.json'):
    d = js[p]['minecraft:attachable']['description']
    if d['identifier'] not in item_ids: err(f'attachable sem item: {d["identifier"]}')
    if not tex_exists(d['textures']['default']): err(f'textura de armadura faltando: {d["textures"]["default"]}')
blocks = {js[p]['minecraft:block']['description']['identifier'] for p in (BP / 'blocks').glob('*.json')}
for p in (BP / 'blocks').glob('*.json'):
    c = js[p]['minecraft:block']['components']
    if not (BP / c['minecraft:loot']).exists(): err('loot table faltando')
    if c['minecraft:display_name'] not in lang: err('nome do bloco sem tradução')
ents = {js[p]['minecraft:entity']['description']['identifier'] for p in (BP / 'entities').glob('*.json')}
geos = {g['description']['identifier'] for p in (RP / 'models').rglob('*.json') for g in js[p]['minecraft:geometry']}
anims = {a for p in (RP / 'animations').glob('*.json') for a in js[p]['animations']}
for p in (RP / 'entity').glob('*.json'):
    d = js[p]['minecraft:client_entity']['description']
    if d['identifier'] not in ents: err('client entity sem entidade BP')
    for g in d['geometry'].values():
        if g not in geos: err(f'geometria faltando {g}')
    for a in d['animations'].values():
        if a not in anims: err(f'animação faltando {a}')
    for t in d['textures'].values():
        if not tex_exists(t): err(f'textura de entidade faltando {t}')
particles = {js[p]['particle_effect']['description']['identifier'] for p in (RP / 'particles').glob('*.json')}
sdefs = js[RP / 'sounds' / 'sound_definitions.json']['sound_definitions']
for k, v in sdefs.items():
    for s in v['sounds']:
        if not (RP / (s['name'] + '.ogg')).exists(): err(f'som faltando {s["name"]}')

src = (BP / 'scripts' / 'main.js').read_text(encoding='utf-8')
for comp in comps_used:
    if f"registerCustomComponent('{comp}'" not in src: err(f'componente {comp} não registrado no script')
for m in set(re.findall(r"secretop[:.][a-z0-9_.]+", src)):
    if m.startswith('secretop.'):
        if m not in sdefs: err(f'som usado no script não existe: {m}')
    elif m.endswith(':'): continue
    elif m not in item_ids | blocks | ents | particles and m not in ('secretop:state', 'secretop:use'):
        err(f'ID usado no script não existe: {m}')
for key in re.findall(r"NS \+ '([a-z0-9_]+)'", src):
    full = 'secretop:' + key
    if full not in item_ids | blocks | ents and key not in ('state', 'ammo', 'owner', 'welcomed', 'showcase', 'fighter', 'dm_mob', 'explosive_shot'):
        err(f'NS + {key} não corresponde a nenhum item/bloco/entidade')
for key in re.findall(r"['\[ ]([a-z0-9_]+)['\]]", src):
    pass
# chaves de itens usadas em pistas/loot/vitrines
lore_keys = set(re.findall(r"^  ([a-z0-9_]+): \[", src, re.M))
for k in lore_keys:
    if 'secretop:' + k not in item_ids: err(f'LORE de item inexistente: {k}')
vanilla_extras = set(re.findall(r"^  ([a-z0-9_]+): \{ id: 'minecraft:", src, re.M))
for k in set(re.findall(r"'([a-z0-9_]+)'", ' '.join(re.findall(r"featured: \[([^\]]*)\]", src)))) | \
         set(re.findall(r"\['([a-z0-9_]+)', \d+\]", src.split('const RANDOM_POOL')[1].split('];')[0])):
    if 'secretop:' + k not in item_ids and k not in vanilla_extras: err(f'recompensa desconhecida: {k}')
for k in re.findall(r"(?:head|chest|legs|feet|hand): '([a-z0-9_]+)'", src):
    if 'secretop:' + k not in item_ids: err(f'vitrine com item desconhecido: {k}')
for k in re.findall(r"textures/secretop/items/([a-z0-9_]+)'", src):
    if not (RP / 'textures' / 'secretop' / 'items' / f'{k}.png').exists(): err(f'ícone de botão faltando: {k}')

# level.dat
def read_nbt(b, i, t):
    if t == 1: return b[i], i + 1
    if t == 3: return struct.unpack_from('<i', b, i)[0], i + 4
    if t == 4: return struct.unpack_from('<q', b, i)[0], i + 8
    if t == 8:
        n = struct.unpack_from('<H', b, i)[0]; return b[i + 2:i + 2 + n].decode(), i + 2 + n
    if t == 9:
        st, n = struct.unpack_from('<bi', b, i); i += 5; out = []
        for _ in range(n): v, i = read_nbt(b, i, st); out.append(v)
        return out, i
    if t == 10:
        out = {}
        while True:
            tt = b[i]; i += 1
            if tt == 0: return out, i
            n = struct.unpack_from('<H', b, i)[0]; name = b[i + 2:i + 2 + n].decode(); i += 2 + n
            out[name], i = read_nbt(b, i, tt)
    raise ValueError(t)
w = zipfile.ZipFile(ROOT / 'dist' / 'SecretOP_v2_Mundo.mcworld')
names = w.namelist()
for need in ('level.dat', 'levelname.txt', 'world_behavior_packs.json', 'world_resource_packs.json',
             'behavior_packs/SecretOP_v2_BP/manifest.json', 'resource_packs/SecretOP_v2_RP/manifest.json'):
    if need not in names: err(f'mcworld sem {need}')
ld = w.read('level.dat')
ver, ln = struct.unpack_from('<ii', ld, 0)
if ln != len(ld) - 8: err('level.dat: tamanho do cabeçalho errado')
tag, nlen = struct.unpack_from('<bH', ld, 8)
root, end = read_nbt(ld, 11 + nlen, 10)
if end != len(ld): err('level.dat: bytes sobrando')
a = zipfile.ZipFile(ROOT / 'dist' / 'SecretOP_v2_Drops_e_Pistas.mcaddon').namelist()
if 'SecretOP_v2_BP/manifest.json' not in a or 'SecretOP_v2_RP/manifest.json' not in a: err('mcaddon sem manifestos na raiz das pastas')

print(f'JSON: {len(js)} | itens: {len(item_ids)} | partículas: {len(particles)} | sons: {len(sdefs)} | level.dat: {len(root)} tags, LevelName={root["LevelName"]!r}')
if erros:
    print('\n'.join('ERRO: ' + e for e in erros)); sys.exit(1)
print('TUDO OK')
