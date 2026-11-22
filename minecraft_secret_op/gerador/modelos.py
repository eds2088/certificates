"""Texturas de armadura (64x32, layout vanilla), Allay modificado (geometria própria),
bloco de melancia secreta, ícones de pacote."""
import random
from PIL import Image, ImageDraw, ImageFont
from arte_base import hexc

def box_faces(u, v, w, h, d):
    return {
        'top': (u + d, v, w, d), 'bottom': (u + d + w, v, w, d),
        'right': (u, v + d, d, h), 'front': (u + d, v + d, w, h),
        'left': (u + d + w, v + d, d, h), 'back': (u + 2 * d + w, v + d, w, h),
    }

def fill(im, rect, color):
    x, y, w, h = rect
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            im.putpixel((xx, yy), hexc(color) if isinstance(color, str) else color)

def shade_face(im, rect, base, light, dark, seed=0, noise=None):
    x, y, w, h = rect
    rnd = random.Random(seed)
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            c = base
            if noise and rnd.random() < 0.18:
                c = rnd.choice(noise)
            if yy == y or xx == x:
                c = light
            if yy == y + h - 1 or xx == x + w - 1:
                c = dark
            im.putpixel((xx, yy), hexc(c))

def paint_box(im, u, v, w, h, d, base, light, dark, noise=None, seed=1):
    for i, (name, r) in enumerate(box_faces(u, v, w, h, d).items()):
        shade_face(im, r, base, light, dark, seed + i, noise)

SYN = dict(base='#4B0082', light='#B19CD9', dark='#2E0854', noise=['#6A0DAD', '#5B1A9A', '#3D0A6E'])

def armor_syntaxium():
    im = Image.new('RGBA', (64, 32), (0, 0, 0, 0))
    paint_box(im, 0, 0, 8, 8, 8, **SYN)
    paint_box(im, 16, 16, 8, 12, 4, **SYN)
    paint_box(im, 40, 16, 4, 12, 4, **SYN)
    paint_box(im, 0, 16, 4, 12, 4, **SYN)
    # viseira do capacete (frente da cabeça = 8,8 8x8)
    for x in range(9, 15): im.putpixel((x, 12), hexc('#8A2BE2'))
    for x in range(10, 14): im.putpixel((x, 11), hexc('#DDA0DD'))
    # núcleo brilhante em V no peito (frente do corpo = 20,20 8x12)
    for i in range(4):
        im.putpixel((21 + i, 21 + i), hexc('#B19CD9')); im.putpixel((26 - i, 21 + i), hexc('#B19CD9'))
    fill(im, (23, 25, 2, 2), '#DDA0DD')
    for x in range(20, 28): im.putpixel((x, 31), hexc('#8A2BE2'))
    # ombreiras (topo dos braços) e frisos
    fill(im, (44, 16, 4, 4), '#8A2BE2')
    for y in range(20, 32, 4):
        for x in range(40, 56): im.putpixel((x, y), hexc('#6A0DAD'))
    # botas: parte de baixo das pernas mais clara e com sola
    for y in range(27, 32):
        for x in range(0, 16): im.putpixel((x, y), hexc('#6A0DAD' if y < 31 else '#1C0436'))
    for x in range(0, 16): im.putpixel((x, 27), hexc('#B19CD9'))
    return im

def armor_netherite_legs():
    im = Image.new('RGBA', (64, 32), (0, 0, 0, 0))
    pal = dict(base='#4B406A', light='#7E6EA8', dark='#000000', noise=['#9379CA', '#3E3558', '#4B406A'])
    paint_box(im, 16, 16, 8, 12, 4, **pal)
    paint_box(im, 0, 16, 4, 12, 4, **pal)
    # cinto
    for x in range(16, 40): im.putpixel((x, 20), hexc('#A18FCF'))
    for x in range(16, 40): im.putpixel((x, 21), hexc('#000000'))
    fill(im, (23, 22, 2, 2), '#A18FCF')
    # placas nos joelhos
    for x in (4, 12):
        fill(im, (x, 24, 4, 2), '#7E6EA8'); fill(im, (x + 1, 24, 2, 1), '#A18FCF')
    return im

def armor_tnt_cowl():
    im = Image.new('RGBA', (64, 32), (0, 0, 0, 0))
    paint_box(im, 0, 0, 8, 8, 8, base='#8B0000', light='#C02020', dark='#4A0000', noise=['#A01010', '#7A0000'])
    # faixa dourada em volta (linha 12 das faces laterais/frente/trás)
    for x in range(0, 32):
        im.putpixel((x, 12), hexc('#FFD700')); im.putpixel((x, 13), hexc('#C9A227'))
    # "TNT" em blocos na testa
    for (x, y) in [(9, 9), (10, 9), (11, 9), (10, 10), (12, 9), (12, 10), (13, 10), (13, 9), (14, 9), (14, 10)]:
        im.putpixel((x, y), hexc('#F0F0F0'))
    # pavio no topo
    fill(im, (11, 3, 2, 2), '#1A1A1A'); im.putpixel((12, 2), hexc('#FFD700'))
    return im

def armor_creeper_shirt():
    im = Image.new('RGBA', (64, 32), (0, 0, 0, 0))
    pal = dict(base='#A3D977', light='#D4F57C', dark='#7AB34B', noise=['#8CC860', '#B5E58A', '#7AB34B'])
    paint_box(im, 16, 16, 8, 12, 4, **pal)
    paint_box(im, 40, 16, 4, 12, 4, **pal)
    face = ["........",
            ".KK..KK.",
            ".KK..KK.",
            "...KK...",
            "..KKKK..",
            "..KKKK..",
            "..K..K..",
            "........"]
    for yy, row in enumerate(face):
        for xx, ch in enumerate(row):
            if ch == 'K':
                im.putpixel((20 + xx, 21 + yy), hexc('#3E571B'))
    return im

# ---------------- Allay modificado ----------------
ALLAY_GEO_CUBES = {
    # bone: (origin, size, uv, pivot)
    'head': ((-2.5, 6, -2.5), (5, 5, 5), (0, 0), (0, 6, 0)),
    'body': ((-1.5, 2, -1), (3, 4, 2), (0, 10), (0, 6, 0)),
    'right_arm': ((-2.5, 2.5, -0.5), (1, 3, 1), (20, 0), (-2, 5.5, 0)),
    'left_arm': ((1.5, 2.5, -0.5), (1, 3, 1), (24, 0), (2, 5.5, 0)),
    'right_wing': ((-0.5, 0.5, 1), (0, 6, 8), (0, 16), (-0.5, 5.5, 1)),
    'left_wing': ((0.5, 0.5, 1), (0, 6, 8), (16, 16), (0.5, 5.5, 1)),
}

def allay_geometry():
    bones = [{'name': 'root', 'pivot': [0, 0, 0]}]
    for name, (origin, size, uv, pivot) in ALLAY_GEO_CUBES.items():
        b = {'name': name, 'parent': 'root', 'pivot': list(pivot),
             'cubes': [{'origin': list(origin), 'size': list(size), 'uv': list(uv)}]}
        bones.append(b)
    return {'format_version': '1.12.0', 'minecraft:geometry': [{
        'description': {'identifier': 'geometry.secretop.op_allay', 'texture_width': 32, 'texture_height': 32,
                        'visible_bounds_width': 2, 'visible_bounds_height': 2, 'visible_bounds_offset': [0, 0.5, 0]},
        'bones': bones}]}

def allay_texture():
    im = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
    BODY, SH, LIGHT = '#3366FF', '#4D85FF', '#6E9BFF'
    hf = box_faces(0, 0, 5, 5, 5)
    for n, r in hf.items():
        shade_face(im, r, BODY, LIGHT, '#2450CC', seed=len(n), noise=[SH])
    # olhos grandes (#99CCFF com contorno #2673CC) na frente da cabeça
    fx, fy, _, _ = hf['front']
    for (x, y) in [(fx + 0, fy + 2), (fx + 1, fy + 2), (fx + 3, fy + 2), (fx + 4, fy + 2)]:
        im.putpixel((x, y), hexc('#2673CC'))
    for (x, y) in [(fx + 0, fy + 1), (fx + 1, fy + 1), (fx + 3, fy + 1), (fx + 4, fy + 1)]:
        im.putpixel((x, y), hexc('#99CCFF'))
    im.putpixel((fx + 1, fy + 1), hexc('#E6F4FF')); im.putpixel((fx + 4, fy + 1), hexc('#E6F4FF'))
    for n, r in box_faces(0, 10, 3, 4, 2).items():
        shade_face(im, r, BODY, LIGHT, '#2450CC', seed=7, noise=[SH])
    for u in (20, 24):
        for n, r in box_faces(u, 0, 1, 3, 1).items():
            fill(im, r, SH)
    # asas translúcidas (recorte) #CCEEFF
    for u in (0, 16):
        for n, r in box_faces(u, 16, 0, 6, 8).items():
            x, y, w, h = r
            for yy in range(y, y + h):
                for xx in range(x, x + w):
                    if (xx + yy) % 3 != 0:
                        im.putpixel((xx, yy), hexc('#CCEEFF', 230))
                    else:
                        im.putpixel((xx, yy), hexc('#99CCFF', 230))
    return im

# ---------------- Bloco de melancia ----------------
def melon_side():
    rnd = random.Random(42)
    im = Image.new('RGBA', (16, 16))
    for y in range(16):
        for x in range(16):
            stripe = (x % 4) in (0, 1)
            c = '#3D722B' if stripe else '#5BA14A'
            if stripe and rnd.random() < 0.25: c = '#2E521D'
            if not stripe and rnd.random() < 0.22: c = '#8ECD56'
            im.putpixel((x, y), hexc(c))
    for (x, y) in [(3, 2), (11, 6), (7, 12), (14, 13)]:
        im.putpixel((x, y), hexc('#FFFFFF'))
    return im

def melon_top():
    im = Image.new('RGBA', (16, 16))
    for y in range(16):
        for x in range(16):
            r = max(abs(x - 7.5), abs(y - 7.5))
            ring = int(r) % 3
            c = ['#5BA14A', '#3D722B', '#8ECD56'][ring]
            if r < 1.6: c = '#6B5A2E'
            im.putpixel((x, y), hexc(c))
    for x in range(16):
        im.putpixel((x, 0), hexc('#2E521D')); im.putpixel((x, 15), hexc('#2E521D'))
        im.putpixel((0, x), hexc('#2E521D')); im.putpixel((15, x), hexc('#2E521D'))
    return im

def font(size):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            pass
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()

def pack_icon(sprites, subtitle):
    im = Image.new('RGBA', (256, 256), hexc('#120A24'))
    d = ImageDraw.Draw(im)
    for i in range(0, 256, 16):
        d.line([(i, 0), (i, 256)], fill=hexc('#1B1036')); d.line([(0, i), (256, i)], fill=hexc('#1B1036'))
    big = sprites['syntaxium_sword'].resize((144, 144), Image.NEAREST)
    im.alpha_composite(big, (8, 70))
    tot = sprites['totem_boost'].resize((96, 96), Image.NEAREST)
    im.alpha_composite(tot, (148, 96))
    d.text((128, 30), 'SECRET OP', font=font(40), fill=hexc('#FFE45C'), anchor='mm', stroke_width=3, stroke_fill=hexc('#3F1A5F'))
    d.text((128, 232), subtitle, font=font(22), fill=hexc('#FFFFFF'), anchor='mm', stroke_width=2, stroke_fill=hexc('#000000'))
    return im
