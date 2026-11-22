"""Gera dist/colecao_itens.png (prévia de todos os itens, armaduras, Allay e bloco)."""
import json
from pathlib import Path
from PIL import Image, ImageDraw
import modelos as M
from arte_base import hexc
ROOT = Path(__file__).resolve().parent.parent
RP = ROOT / 'build' / 'SecretOP_v2_RP'
lang = dict(l.split('=', 1) for l in (RP / 'texts' / 'en_US.lang').read_text(encoding='utf-8').splitlines() if '=' in l)
items = sorted((RP / 'textures' / 'secretop' / 'items').glob('*.png'))
order = ['syntaxium_sword', 'heavy_syntaxium_sword', 'syntaxium_axe', 'netherite_katana', 'yami_katana', 'laser_blade',
         'hk_g3_rifle', 'combat_pistol', 'scatter_shotgun', 'm700_sniper', 'ammo_box', 'totem_boost',
         'tnt_cowl', 'syntaxium_helmet', 'syntaxium_chestplate', 'netherite_leggings', 'syntaxium_boots', 'creeper_shirt',
         'compacted_golden_apple', 'titanium_apple', 'allay_whistle', 'clue_remote', 'clue_book']
cols, cw, ch = 6, 200, 112
rows = (len(order) + cols - 1) // cols
im = Image.new('RGBA', (cols * cw, 70 + rows * ch + 190), hexc('#120A24'))
d = ImageDraw.Draw(im)
d.text((20, 18), 'SECRET OP v2 - COLEÇÃO DE ITENS', font=M.font(26), fill=hexc('#FFE45C'))
strip = lambda s: __import__('re').sub('§.', '', s)
for i, k in enumerate(order):
    x, y = (i % cols) * cw + 14, 70 + (i // cols) * ch
    src = Image.open(RP / 'textures' / 'secretop' / 'items' / f'{k}.png')
    s = 64 if src.size[0] == 16 else 64
    icon = src.resize((s, s) if src.size[0] == 16 else (64, 64), Image.NEAREST)
    d.rectangle([x - 4, y - 4, x + 68, y + 68], fill=hexc('#1E1E1E'), outline=hexc('#3F1A5F'))
    im.alpha_composite(icon, (x, y))
    name = strip(lang.get(f'item.secretop:{k}.name', k))
    words = name.split(' '); line1, line2 = '', ''
    for w in words:
        if len(line1 + ' ' + w) <= 14 and not line2: line1 = (line1 + ' ' + w).strip()
        else: line2 = (line2 + ' ' + w).strip()
    d.text((x + 76, y + 18), line1, font=M.font(14), fill=hexc('#FFFFFF'))
    d.text((x + 76, y + 36), line2, font=M.font(14), fill=hexc('#FFFFFF'))
y0 = 70 + rows * ch + 10
d.text((20, y0), 'Texturas de armadura (64x32) · Allay modificado · Bloco de Melancia Secreto', font=M.font(16), fill=hexc('#B19CD9'))
x = 20
for f in ['syntaxium', 'netherite_legs', 'tnt_cowl', 'creeper_shirt']:
    a = Image.open(RP / 'textures' / 'secretop' / 'models' / 'armor' / f'{f}.png').resize((192, 96), Image.NEAREST)
    im.alpha_composite(a, (x, y0 + 30)); x += 210
al = Image.open(RP / 'textures' / 'secretop' / 'entity' / 'op_allay.png').resize((128, 128), Image.NEAREST)
im.alpha_composite(al, (x, y0 + 30)); x += 150
for f in ['secret_melon_side', 'secret_melon_top']:
    b = Image.open(RP / 'textures' / 'secretop' / 'blocks' / f'{f}.png').resize((64, 64), Image.NEAREST)
    im.alpha_composite(b, (x, y0 + 30)); x += 74
im.convert('RGB').save(ROOT / 'dist' / 'colecao_itens.png')
print('ok', im.size)
