"""Gera o SECRET OP v3: behavior pack, resource pack, .mcaddon e .mcworld.

Uso:  python3 gerar.py            (gera tudo em ../dist)
Requisitos: Python 3.10+, Pillow, numpy e ffmpeg (com libvorbis) para os sons.
"""
import io, json, math, os, random, shutil, struct, subprocess, sys, time, wave, zipfile
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from itens import sprites, axe_hd
from armas_hd import guns_hd
from hd import hd, hd_flat
import modelos as M

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / 'build'
DIST = ROOT / 'dist'
SRC = ROOT / 'src'
VERSION = [3, 0, 0]
ENGINE = [1, 21, 90]
FMT = '1.21.90'
BP_UUID, BP_DATA, BP_SCRIPT = '3119ba24-6408-4356-a35d-0a962767acf9', '8247bbc9-2019-435b-992b-049bcd52001a', '05661b7a-a47a-495e-88e9-72bdc97a56ad'
RP_UUID, RP_RES = '51d67622-8e84-4d24-9822-bb9daf5974b9', '2273856d-d167-4d6d-a2ed-3477843e9874'
NS = 'secretop'

# ---------------------------------------------------------------- definição dos itens
# (id, nome exibido, tipo, extras)
ITEMS = [
    ('syntaxium_sword', '§dEspada Syntaxium', 'sword', dict(damage=30, glint=True)),
    ('heavy_syntaxium_sword', '§cEspada Syntaxium Pesada', 'sword', dict(damage=36)),
    ('syntaxium_axe', '§5Machado Syntaxium', 'axe', dict(damage=18, glint=True)),
    ('netherite_katana', '§8Katana de Netherita', 'sword', dict(damage=18, use=True)),
    ('yami_katana', '§5Katana do Yami', 'sword', dict(damage=18)),
    ('laser_blade', '§bLâmina Laser', 'sword', dict(damage=20)),
    ('hk_g3_rifle', '§fFuzil HK G3', 'gun', {}),
    ('combat_pistol', '§fPistola Tática', 'gun', {}),
    ('scatter_shotgun', '§fEscopeta Secreta', 'gun', {}),
    ('m700_sniper', '§fFuzil de Precisão M700', 'gun', {}),
    ('ammo_box', '§6Caixa de Munição', 'stack', dict(stack=64, use=True)),
    ('totem_boost', '§cTotem Boost V', 'stack', dict(stack=16, use=True, offhand=True)),
    ('tnt_cowl', '§cCapuz de TNT', 'armor', dict(slot='head', protection=3)),
    ('syntaxium_helmet', '§dCapacete Syntaxium', 'armor', dict(slot='head', protection=3, glint=True)),
    ('syntaxium_chestplate', '§dPeitoral Syntaxium', 'armor', dict(slot='chest', protection=8, glint=True)),
    ('netherite_leggings', '§5Calças de Netherita', 'armor', dict(slot='legs', protection=6)),
    ('syntaxium_boots', '§dBotas Syntaxium', 'armor', dict(slot='feet', protection=3, glint=True)),
    ('creeper_shirt', '§aCamisa Creeper', 'armor', dict(slot='chest', protection=1)),
    ('compacted_golden_apple', '§6Maçã Dourada Compactada', 'food', dict(glint=True)),
    ('titanium_apple', '§7Maçã de Titânio', 'food', {}),
    ('allay_whistle', '§bAmuleto do Allay', 'stack', dict(stack=1, use=True)),
]
PT_NAMES = {'ammo_box': '§6Caixa de Munição', 'allay_whistle': '§bAmuleto do Allay', 'clue_remote': '§dControle do Desafio',
            'clue_book': '§5Diário de Pistas', 'compacted_golden_apple': '§6Maçã Dourada Compactada', 'titanium_apple': '§7Maçã de Titânio',
            'creeper_shirt': '§aCamisa Creeper', 'netherite_leggings': '§5Calças de Netherita'}
ARMOR = {  # slot -> (wearable slot, enchant slot, geometria, variável do parent_setup)
    'head': ('slot.armor.head', 'armor_head', 'geometry.humanoid.armor.helmet', 'variable.helmet_layer_visible = 0.0;'),
    'chest': ('slot.armor.chest', 'armor_torso', 'geometry.humanoid.armor.chestplate', 'variable.chest_layer_visible = 0.0;'),
    'legs': ('slot.armor.legs', 'armor_legs', 'geometry.humanoid.armor.leggings', 'variable.leg_layer_visible = 0.0;'),
    'feet': ('slot.armor.feet', 'armor_feet', 'geometry.humanoid.armor.boots', 'variable.boot_layer_visible = 0.0;'),
}
ARMOR_TEX = {'tnt_cowl': 'tnt_cowl', 'syntaxium_helmet': 'syntaxium', 'syntaxium_chestplate': 'syntaxium',
             'syntaxium_boots': 'syntaxium', 'netherite_leggings': 'netherite_legs', 'creeper_shirt': 'creeper_shirt'}


def wjson(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')


def item_json(iid, kind, ex):
    c = {
        'minecraft:display_name': {'value': f'item.{NS}:{iid}.name'},
        'minecraft:icon': {'textures': {'default': f'{NS}_{iid}'}},
        'minecraft:max_stack_size': {'value': ex.get('stack', 1)},
    }
    cat = 'equipment'
    if ex.get('glint'):
        c['minecraft:glint'] = {'value': True}
    if kind in ('sword', 'axe'):
        c['minecraft:damage'] = {'value': ex['damage']}
        c['minecraft:hand_equipped'] = {'value': True}
        c['minecraft:durability'] = {'max_durability': 4000}
        c['minecraft:enchantable'] = {'slot': 'sword' if kind == 'sword' else 'axe', 'value': 15}
        c['minecraft:can_destroy_in_creative'] = {'value': False}
        c['minecraft:tags'] = {'tags': ['minecraft:is_sword' if kind == 'sword' else 'minecraft:is_axe']}
        if kind == 'axe':
            c['minecraft:digger'] = {'use_efficiency': True, 'destroy_speeds': [
                {'block': {'tags': "q.any_tag('wood', 'log')"}, 'speed': 14}]}
    elif kind == 'gun':
        c['minecraft:use_modifiers'] = {'use_duration': 300, 'movement_modifier': 0.85}
        c['minecraft:use_animation'] = {'value': 'bow'}
        c['minecraft:can_destroy_in_creative'] = {'value': False}
        ex = {**ex, 'use': True}
    elif kind == 'armor':
        slot, ench, _, _ = ARMOR[ex['slot']]
        c['minecraft:wearable'] = {'slot': slot, 'protection': ex['protection']}
        c['minecraft:durability'] = {'max_durability': 2000}
        c['minecraft:enchantable'] = {'slot': ench, 'value': 15}
    elif kind == 'food':
        c['minecraft:food'] = {'nutrition': 6, 'saturation_modifier': 1.2, 'can_always_eat': True}
        c['minecraft:use_modifiers'] = {'use_duration': 1.6, 'movement_modifier': 0.35}
        c['minecraft:use_animation'] = {'value': 'eat'}
        c['minecraft:max_stack_size'] = {'value': 16}
        cat = 'items'
    elif kind == 'stack':
        cat = 'items'
    if ex.get('offhand'):
        c['minecraft:allow_off_hand'] = {'value': True}
    if ex.get('use'):
        c[f'{NS}:use'] = {}
    return {'format_version': FMT, 'minecraft:item': {
        'description': {'identifier': f'{NS}:{iid}', 'menu_category': {'category': cat}}, 'components': c}}


def manifest(kind):
    if kind == 'bp':
        return {'format_version': 2, 'header': {
            'name': 'SECRET OP v3 - Drops & Pistas | BP', 'description': 'Começa na vila, 25 min de preparo, 22 pistas, drops OP e luta final sem área (v3)',
            'uuid': BP_UUID, 'version': VERSION, 'min_engine_version': ENGINE},
            'modules': [{'type': 'data', 'uuid': BP_DATA, 'version': VERSION},
                        {'type': 'script', 'language': 'javascript', 'entry': 'scripts/main.js', 'uuid': BP_SCRIPT, 'version': VERSION}],
            'dependencies': [{'uuid': RP_UUID, 'version': VERSION},
                             {'module_name': '@minecraft/server', 'version': '2.0.0'},
                             ],
            'metadata': {'authors': ['SECRET OP v3'], 'product_type': 'addon'}}
    return {'format_version': 2, 'header': {
        'name': 'SECRET OP v3 - Drops & Pistas | RP', 'description': 'Texturas, sons e partículas originais do SECRET OP (v3)',
        'uuid': RP_UUID, 'version': VERSION, 'min_engine_version': ENGINE},
        'modules': [{'type': 'resources', 'uuid': RP_RES, 'version': VERSION}],
        'dependencies': [{'uuid': BP_UUID, 'version': VERSION}],
        'metadata': {'authors': ['SECRET OP v3'], 'product_type': 'addon'}}


def particle(pid, color, count=10, life=0.6, speed=2.0, size=0.08, radius=0.3, gravity=-2.0, shape='sphere', instant=True, drag=2.0):
    comps = {
        'minecraft:emitter_rate_instant': {'num_particles': count},
        'minecraft:emitter_lifetime_once': {'active_time': 0.05},
        'minecraft:particle_lifetime_expression': {'max_lifetime': life},
        'minecraft:particle_initial_speed': speed,
        'minecraft:particle_motion_dynamic': {'linear_acceleration': [0, gravity, 0], 'linear_drag_coefficient': drag},
        'minecraft:particle_appearance_billboard': {
            'size': [f'{size} * (1 - v.particle_age / v.particle_lifetime * 0.6)', f'{size} * (1 - v.particle_age / v.particle_lifetime * 0.6)'],
            'facing_camera_mode': 'lookat_xyz',
            'uv': {'texture_width': 128, 'texture_height': 128, 'uv': [0, 0], 'uv_size': [8, 8]}},
        'minecraft:particle_appearance_tinting': {'color': color},
    }
    if shape == 'sphere':
        comps['minecraft:emitter_shape_sphere'] = {'radius': radius, 'direction': 'outwards'}
    else:
        comps['minecraft:emitter_shape_point'] = {'direction': [0, 1, 0]}
    return {'format_version': '1.10.0', 'particle_effect': {
        'description': {'identifier': f'{NS}:{pid}', 'basic_render_parameters': {'material': 'particles_alpha', 'texture': 'textures/particle/particles'}},
        'components': comps}}


PARTICLES = {
    'op_burst': dict(color=[1.0, 0.85, 0.25, 1.0], count=40, life=1.0, speed=5, size=0.12, radius=0.4, gravity=-3),
    'purple_burst': dict(color=[0.61, 0.19, 1.0, 1.0], count=16, life=0.6, speed=3, size=0.09),
    'muzzle_flash': dict(color=[1.0, 0.95, 0.7, 1.0], count=6, life=0.12, speed=1.5, size=0.16, radius=0.05, gravity=0),
    'bullet_trail': dict(color=[1.0, 0.9, 0.55, 0.9], count=1, life=0.15, speed=0, size=0.05, shape='point', gravity=0),
    'bullet_impact': dict(color=[0.8, 0.75, 0.6, 1.0], count=8, life=0.4, speed=2, size=0.07, radius=0.05, gravity=-6),
    'border_wall': dict(color=[1.0, 0.15, 0.15, 0.9], count=1, life=0.7, speed=0.3, size=0.18, shape='point', gravity=0.6, drag=1),
    'allay_sparkle': dict(color=[0.8, 0.93, 1.0, 1.0], count=6, life=0.8, speed=0.8, size=0.07, radius=0.3, gravity=0.4),
    'dark_slash': dict(color=[0.25, 0.0, 0.45, 1.0], count=24, life=0.5, speed=4, size=0.1, radius=0.5, gravity=0),
    'laser_spark': dict(color=[0.5, 0.97, 1.0, 1.0], count=18, life=0.35, speed=4, size=0.06, radius=0.1, gravity=-4),
}


# ---------------------------------------------------------------- sons sintetizados
SR = 44100


def _env(n, attack, decay):
    t = np.arange(n) / SR
    e = np.minimum(1.0, t / max(attack, 1e-4)) * np.exp(-t / decay)
    return e


def _lowpass(x, k):
    if k <= 1:
        return x
    c = np.cumsum(np.insert(x, 0, 0.0))
    y = (c[k:] - c[:-k]) / k
    return np.concatenate([y, np.zeros(k - 1)])


def synth_shot(dur, decay, thump_hz, noise_lp, crack=0.6, tail=0.0, seed=1):
    rng = np.random.default_rng(seed)
    n = int(SR * dur)
    t = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n)
    body = _lowpass(noise, noise_lp) * _env(n, 0.0008, decay) * 2.2
    crk = noise * _env(n, 0.0002, 0.012) * crack
    thump = np.sin(2 * np.pi * thump_hz * t * (1 - t * 2)) * _env(n, 0.001, decay * 1.4) * 0.9
    sig = body + crk + thump
    if tail:
        sig += _lowpass(rng.uniform(-1, 1, n), 30) * _env(n, 0.03, tail) * 0.5
    return sig


def synth_click(freqs, gap=0.07, seed=2):
    rng = np.random.default_rng(seed)
    parts = []
    for f in freqs:
        n = int(SR * gap)
        t = np.arange(n) / SR
        s = (np.sin(2 * np.pi * f * t) * 0.6 + rng.uniform(-1, 1, n) * 0.4) * _env(n, 0.0005, 0.012)
        parts.append(s)
    return np.concatenate(parts)


def synth_ding():
    n = int(SR * 0.35)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1760 * t) + 0.5 * np.sin(2 * np.pi * 2640 * t)) * _env(n, 0.002, 0.09) * 0.6


def write_ogg(sig, path: Path):
    sig = sig / max(1e-6, np.max(np.abs(sig))) * 0.92
    pcm = (sig * 32767).astype(np.int16)
    path.parent.mkdir(parents=True, exist_ok=True)
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    r = subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'wav', '-i', 'pipe:0', '-c:a', 'libvorbis', '-q:a', '4', str(path)],
                       input=buf.getvalue(), capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.decode())


SOUNDS = {
    'rifle': lambda: synth_shot(0.45, 0.07, 95, 6, crack=0.7, tail=0.18, seed=3),
    'pistol': lambda: synth_shot(0.35, 0.05, 140, 4, crack=0.8, tail=0.1, seed=4),
    'shotgun': lambda: synth_shot(0.7, 0.12, 70, 12, crack=0.5, tail=0.3, seed=5),
    'sniper': lambda: synth_shot(1.1, 0.1, 60, 8, crack=1.0, tail=0.5, seed=6),
    'reload': lambda: np.concatenate([synth_click([900, 600]), np.zeros(int(SR * 0.35)), synth_click([1200, 1500], 0.06, 7)]),
    'empty': lambda: synth_click([2200], 0.08, 8),
    'headshot': synth_ding,
}
SOUND_IDS = {'rifle': 'gun.rifle', 'pistol': 'gun.pistol', 'shotgun': 'gun.shotgun', 'sniper': 'gun.sniper',
             'reload': 'gun.reload', 'empty': 'gun.empty', 'headshot': 'headshot'}


# ---------------------------------------------------------------- level.dat (NBT little-endian)
def nbt_payload(tag_type, value):
    if tag_type == 1: return struct.pack('<b', value)
    if tag_type == 3: return struct.pack('<i', value)
    if tag_type == 4: return struct.pack('<q', value)
    if tag_type == 5: return struct.pack('<f', value)
    if tag_type == 8:
        b = value.encode('utf-8'); return struct.pack('<H', len(b)) + b
    if tag_type == 9:
        sub, items = value
        return struct.pack('<bi', sub, len(items)) + b''.join(nbt_payload(sub, v) for v in items)
    if tag_type == 10:
        out = b''
        for name, (t, v) in value.items():
            nb = name.encode('utf-8')
            out += struct.pack('<bH', t, len(nb)) + nb + nbt_payload(t, v)
        return out + b'\x00'
    raise ValueError(tag_type)


def level_dat(name, seed):
    B, I, L, S, LIST, C, F = 1, 3, 4, 8, 9, 10, 5
    ver = [1, 21, 90, 0, 0]
    now = int(time.time())
    root = {
        'LevelName': (S, name), 'StorageVersion': (I, 10), 'NetworkVersion': (I, 818),
        'lastOpenedWithVersion': (LIST, (I, ver)), 'MinimumCompatibleClientVersion': (LIST, (I, ver)),
        'InventoryVersion': (S, '1.21.90'), 'GameType': (I, 0), 'Difficulty': (I, 2), 'Generator': (I, 1),
        'RandomSeed': (L, seed), 'SpawnX': (I, 0), 'SpawnY': (I, 32767), 'SpawnZ': (I, 0),
        'LastPlayed': (L, now), 'Time': (L, 0), 'currentTick': (L, 0), 'worldStartCount': (L, 0),
        'commandsEnabled': (B, 1), 'cheatsEnabled': (B, 1), 'hasBeenLoadedInCreative': (B, 0), 'IsHardcore': (B, 0),
        'keepinventory': (B, 1), 'showcoordinates': (B, 1), 'dodaylightcycle': (B, 1), 'domobspawning': (B, 1),
        'doweathercycle': (B, 1), 'naturalregeneration': (B, 1), 'pvp': (B, 1), 'spawnMobs': (B, 1),
        'MultiplayerGame': (B, 1), 'MultiplayerGameIntent': (B, 1), 'LANBroadcast': (B, 1), 'LANBroadcastIntent': (B, 1),
        'XBLBroadcastIntent': (I, 3), 'PlatformBroadcastIntent': (I, 3), 'texturePacksRequired': (B, 0),
        'isFromWorldTemplate': (B, 0), 'isWorldTemplateOptionLocked': (B, 0), 'eduOffer': (I, 0), 'ForceGameType': (B, 0),
        'experiments': (C, {'experiments_ever_used': (B, 0), 'saved_with_toggled_experiments': (B, 0)}),
        'BiomeOverride': (S, ''), 'serverChunkTickRange': (I, 4), 'spawnradius': (I, 5),
    }
    body = nbt_payload(10, root)
    payload = struct.pack('<bH', 10, 0) + body
    return struct.pack('<ii', 10, len(payload)) + payload


# ---------------------------------------------------------------- construção dos pacotes
def build():
    if BUILD.exists():
        shutil.rmtree(BUILD)
    bp, rp = BUILD / 'SecretOP_v3_BP', BUILD / 'SecretOP_v3_RP'
    spr = sprites()
    guns_h = guns_hd()

    # ---- texturas de itens
    item_tex = {}
    for iid, _, _, _ in ITEMS:
        im = guns_h[iid] if iid in guns_h else (axe_hd() if iid == 'syntaxium_axe' else hd(spr[iid]))
        p = rp / 'textures' / NS / 'items' / f'{iid}.png'
        p.parent.mkdir(parents=True, exist_ok=True)
        im.save(p)
        item_tex[f'{NS}_{iid}'] = {'textures': f'textures/{NS}/items/{iid}'}
    wjson(rp / 'textures' / 'item_texture.json', {'resource_pack_name': 'secretop_v3', 'texture_name': 'atlas.items', 'texture_data': item_tex})

    # ---- armaduras
    arm = {'syntaxium': hd_flat(M.armor_syntaxium()), 'netherite_legs': hd_flat(M.armor_netherite_legs()),
           'tnt_cowl': hd_flat(M.armor_tnt_cowl()), 'creeper_shirt': hd_flat(M.armor_creeper_shirt())}
    for k, im in arm.items():
        p = rp / 'textures' / NS / 'models' / 'armor' / f'{k}.png'
        p.parent.mkdir(parents=True, exist_ok=True); im.save(p)

    # ---- bloco
    (rp / 'textures' / NS / 'blocks').mkdir(parents=True, exist_ok=True)
    M.melon_side_hd().save(rp / 'textures' / NS / 'blocks' / 'secret_melon_side.png')
    M.melon_top_hd().save(rp / 'textures' / NS / 'blocks' / 'secret_melon_top.png')
    wjson(rp / 'textures' / 'terrain_texture.json', {
        'resource_pack_name': 'secretop_v3', 'texture_name': 'atlas.terrain', 'padding': 8, 'num_mip_levels': 4,
        'texture_data': {f'{NS}_melon_side': {'textures': f'textures/{NS}/blocks/secret_melon_side'},
                         f'{NS}_melon_top': {'textures': f'textures/{NS}/blocks/secret_melon_top'}}})
    wjson(rp / 'blocks.json', {'format_version': [1, 1, 0], f'{NS}:secret_melon': {'sound': 'wood'}})

    # ---- Allay modificado
    (rp / 'textures' / NS / 'entity').mkdir(parents=True, exist_ok=True)
    hd_flat(M.allay_texture(), noise=0.03).save(rp / 'textures' / NS / 'entity' / 'op_allay.png')
    wjson(rp / 'models' / 'entity' / 'op_allay.geo.json', M.allay_geometry())
    wjson(rp / 'animations' / 'op_allay.animation.json', {'format_version': '1.8.0', 'animations': {
        'animation.secretop.op_allay.float': {'loop': True, 'bones': {'root': {'position': [0, 'math.sin(q.life_time * 180) * 1.2', 0]}}},
        'animation.secretop.op_allay.wings': {'loop': True, 'bones': {
            'right_wing': {'rotation': [0, '-25 - math.sin(q.life_time * 1300) * 25', 0]},
            'left_wing': {'rotation': [0, '25 + math.sin(q.life_time * 1300) * 25', 0]},
            'right_arm': {'rotation': ['-35 + math.sin(q.life_time * 200) * 12', 0, 0]},
            'left_arm': {'rotation': ['-35 - math.sin(q.life_time * 200) * 12', 0, 0]}}}}})
    wjson(rp / 'entity' / 'op_allay.entity.json', {'format_version': '1.10.0', 'minecraft:client_entity': {'description': {
        'identifier': f'{NS}:op_allay', 'materials': {'default': 'entity_alphatest'},
        'textures': {'default': f'textures/{NS}/entity/op_allay'}, 'geometry': {'default': 'geometry.secretop.op_allay'},
        'animations': {'float': 'animation.secretop.op_allay.float', 'wings': 'animation.secretop.op_allay.wings'},
        'scripts': {'animate': ['float', 'wings']}, 'render_controllers': ['controller.render.default'],
        'spawn_egg': {'base_color': '#3366FF', 'overlay_color': '#99CCFF'}}}})
    wjson(bp / 'entities' / 'op_allay.json', {'format_version': '1.21.0', 'minecraft:entity': {
        'description': {'identifier': f'{NS}:op_allay', 'is_spawnable': True, 'is_summonable': True},
        'components': {
            'minecraft:type_family': {'family': ['secretop_allay', 'mob']},
            'minecraft:collision_box': {'width': 0.35, 'height': 0.6},
            'minecraft:health': {'value': 20, 'max': 20},
            'minecraft:damage_sensor': {'triggers': [{'cause': 'all', 'deals_damage': 'no'}]},
            'minecraft:physics': {'has_gravity': False},
            'minecraft:movement': {'value': 0.3},
            'minecraft:flying_speed': {'value': 0.15},
            'minecraft:can_fly': {},
            'minecraft:movement.hover': {},
            'minecraft:navigation.hover': {'can_path_over_water': True, 'can_sink': False, 'can_pass_doors': True,
                                           'can_path_from_air': True, 'avoid_water': True, 'avoid_damage_blocks': True},
            'minecraft:behavior.look_at_player': {'priority': 7, 'look_distance': 8},
            'minecraft:jump.static': {},
            'minecraft:nameable': {'always_show': True, 'allow_name_tag_renaming': True},
            'minecraft:persistent': {},
            'minecraft:fire_immune': {},
            'minecraft:breathable': {'total_supply': 15, 'suffocate_time': 0, 'breathes_water': True, 'breathes_air': True},
            'minecraft:knockback_resistance': {'value': 1.0},
        }}})

    # ---- itens (BP) + anexáveis de armadura (RP)
    for iid, _, kind, ex in ITEMS:
        wjson(bp / 'items' / f'{iid}.json', item_json(iid, kind, ex))
        if kind == 'armor':
            _, _, geo, setup = ARMOR[ex['slot']]
            wjson(rp / 'attachables' / f'{iid}.json', {'format_version': '1.10.0', 'minecraft:attachable': {'description': {
                'identifier': f'{NS}:{iid}', 'materials': {'default': 'armor', 'enchanted': 'armor_enchanted'},
                'textures': {'default': f'textures/{NS}/models/armor/{ARMOR_TEX[iid]}', 'enchanted': 'textures/misc/enchanted_actor_glint'},
                'geometry': {'default': geo}, 'scripts': {'parent_setup': setup}, 'render_controllers': ['controller.render.armor']}}})

    # ---- bloco (BP)
    wjson(bp / 'blocks' / 'secret_melon.json', {'format_version': FMT, 'minecraft:block': {
        'description': {'identifier': f'{NS}:secret_melon', 'menu_category': {'category': 'nature'}},
        'components': {
            'minecraft:display_name': f'tile.{NS}:secret_melon.name',
            'minecraft:destructible_by_mining': {'seconds_to_destroy': 1.2},
            'minecraft:destructible_by_explosion': {'explosion_resistance': 3},
            'minecraft:geometry': 'minecraft:geometry.full_block',
            'minecraft:material_instances': {
                '*': {'texture': f'{NS}_melon_side', 'render_method': 'opaque'},
                'up': {'texture': f'{NS}_melon_top', 'render_method': 'opaque'},
                'down': {'texture': f'{NS}_melon_top', 'render_method': 'opaque'}},
            'minecraft:loot': 'loot_tables/blocks/secretop_empty.json',
            'minecraft:map_color': '#5BA14A'}}})
    wjson(bp / 'loot_tables' / 'blocks' / 'secretop_empty.json', {'pools': []})

    # ---- script
    (bp / 'scripts').mkdir(parents=True, exist_ok=True)
    shutil.copy(SRC / 'scripts' / 'main.js', bp / 'scripts' / 'main.js')

    # ---- partículas
    for pid, kw in PARTICLES.items():
        wjson(rp / 'particles' / f'{pid}.json', particle(pid, **kw))

    # ---- sons
    defs = {}
    for k, fn in SOUNDS.items():
        write_ogg(fn(), rp / 'sounds' / NS / f'{k}.ogg')
        defs[f'{NS}.{SOUND_IDS[k]}'] = {'category': 'player', 'min_distance': 4, 'max_distance': 64,
                                         'sounds': [{'name': f'sounds/{NS}/{k}', 'volume': 1.0}]}
    wjson(rp / 'sounds' / 'sound_definitions.json', {'format_version': '1.14.0', 'sound_definitions': defs})

    # ---- textos
    en, pt = [], []
    for iid, name, _, _ in ITEMS:
        en.append(f'item.{NS}:{iid}.name={name}')
        pt.append(f'item.{NS}:{iid}.name={name}')
    for lst, mel, egg, allay in ((en, '§2Bloco de Melancia Secreto', 'Gerar Allay Modificado', 'Allay Modificado'),
                                 (pt, '§2Bloco de Melancia Secreto', 'Gerar Allay Modificado', 'Allay Modificado')):
        lst.append(f'tile.{NS}:secret_melon.name={mel}')
        lst.append(f'entity.{NS}:op_allay.name={allay}')
        lst.append(f'item.spawn_egg.entity.{NS}:op_allay.name={egg}')
        lst.append('pack.name=SECRET OP v3')
        lst.append('pack.description=Drops secretos, 22 pistas e Deathmatch')
    (rp / 'texts').mkdir(parents=True, exist_ok=True)
    (rp / 'texts' / 'en_US.lang').write_text('\n'.join(en) + '\n', encoding='utf-8')
    (rp / 'texts' / 'pt_BR.lang').write_text('\n'.join(pt) + '\n', encoding='utf-8')
    (rp / 'texts' / 'pt_PT.lang').write_text('\n'.join(pt) + '\n', encoding='utf-8')
    wjson(rp / 'texts' / 'languages.json', ['en_US', 'pt_BR', 'pt_PT'])

    # ---- manifestos e ícones
    wjson(bp / 'manifest.json', manifest('bp'))
    wjson(rp / 'manifest.json', manifest('rp'))
    M.pack_icon(spr, 'Behavior Pack v3').save(bp / 'pack_icon.png')
    M.pack_icon(spr, 'Resource Pack v3').save(rp / 'pack_icon.png')
    return bp, rp, spr


def zipdir(zf: zipfile.ZipFile, folder: Path, arc_prefix: str):
    for p in sorted(folder.rglob('*')):
        if p.is_file():
            zf.write(p, f'{arc_prefix}/{p.relative_to(folder).as_posix()}')


def package(bp, rp, spr):
    DIST.mkdir(exist_ok=True)
    addon = DIST / 'SecretOP_v3_Drops_e_Pistas.mcaddon'
    with zipfile.ZipFile(addon, 'w', zipfile.ZIP_DEFLATED) as z:
        zipdir(z, bp, bp.name); zipdir(z, rp, rp.name)
    world_dir = BUILD / 'world'
    if world_dir.exists():
        shutil.rmtree(world_dir)
    world_dir.mkdir(parents=True)
    (world_dir / 'level.dat').write_bytes(level_dat('SECRET OP v3 - Vila', 20261122))
    (world_dir / 'levelname.txt').write_text('SECRET OP v3 - Vila', encoding='utf-8')
    wjson(world_dir / 'world_behavior_packs.json', [{'pack_id': BP_UUID, 'version': VERSION}])
    wjson(world_dir / 'world_resource_packs.json', [{'pack_id': RP_UUID, 'version': VERSION}])
    icon = M.pack_icon(spr, 'Começa na vila').convert('RGB').resize((256, 256))
    icon.save(world_dir / 'world_icon.jpeg', quality=92)
    shutil.copytree(bp, world_dir / 'behavior_packs' / bp.name)
    shutil.copytree(rp, world_dir / 'resource_packs' / rp.name)
    mcworld = DIST / 'SecretOP_v3_Mundo.mcworld'
    with zipfile.ZipFile(mcworld, 'w', zipfile.ZIP_DEFLATED) as z:
        zipdir_flat(z, world_dir)
    return addon, mcworld


def zipdir_flat(zf, folder: Path):
    for p in sorted(folder.rglob('*')):
        if p.is_file():
            zf.write(p, p.relative_to(folder).as_posix())


if __name__ == '__main__':
    random.seed(7)
    bp, rp, spr = build()
    a, w = package(bp, rp, spr)
    print('OK', a.name, a.stat().st_size, w.name, w.stat().st_size)
