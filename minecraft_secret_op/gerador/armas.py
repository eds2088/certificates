"""Armas de fogo: desenhadas na horizontal com retângulos e giradas 45° (RotSprite simplificado)
para ficarem com o cano para cima-direita, como as ferramentas seguradas na mão."""
from PIL import Image
from arte_base import hexc

def rects(w, h, parts):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for (x0, y0, x1, y1, base, light, dark) in parts:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                c = base
                if light and y == y0:
                    c = light
                elif dark and y == y1 and y1 > y0:
                    c = dark
                im.putpixel((x, y), hexc(c))
    return im

def _scale2x(im):
    w, h = im.size
    src = im.load()
    out = Image.new('RGBA', (w * 2, h * 2))
    dst = out.load()
    g = lambda x, y: src[min(max(x, 0), w - 1), min(max(y, 0), h - 1)]
    for y in range(h):
        for x in range(w):
            P = src[x, y]; A = g(x, y - 1); B = g(x + 1, y); C = g(x - 1, y); D = g(x, y + 1)
            e0 = e1 = e2 = e3 = P
            if C == A and C != D and A != B: e0 = A
            if A == B and A != C and B != D: e1 = B
            if D == C and D != B and C != A: e2 = C
            if B == D and B != A and D != C: e3 = D
            dst[2 * x, 2 * y] = e0; dst[2 * x + 1, 2 * y] = e1
            dst[2 * x, 2 * y + 1] = e2; dst[2 * x + 1, 2 * y + 1] = e3
    return out

def rotsprite(im, angle, out_size=32, outline='#050505'):
    big = _scale2x(_scale2x(_scale2x(im)))
    rot = big.rotate(angle, resample=Image.NEAREST, expand=True)
    k = 8
    bw, bh = rot.size
    w, h = (bw + k - 1) // k, (bh + k - 1) // k
    px = rot.load()
    small = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for y in range(h):
        for x in range(w):
            cx, cy = min(x * k + k // 2, bw - 1), min(y * k + k // 2, bh - 1)
            small.putpixel((x, y), px[cx, cy])
    bbox = small.getbbox()
    small = small.crop(bbox)
    canvas = Image.new('RGBA', (out_size, out_size), (0, 0, 0, 0))
    canvas.paste(small, ((out_size - small.size[0]) // 2, (out_size - small.size[1]) // 2))
    p = canvas.load(); o = hexc(outline); add = []
    for y in range(out_size):
        for x in range(out_size):
            if p[x, y][3] == 0 and any(0 <= x + dx < out_size and 0 <= y + dy < out_size and p[x + dx, y + dy][3] > 0
                                       for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                add.append((x, y))
    for q in add:
        p[q] = o
    return canvas

BLK, BLK_L, BLK_D = '#121212', '#3A3A3A', '#0A0A0A'
TAN, TAN_L, TAN_D = '#CAB89B', '#E2D4BA', '#9C8B6E'
MEC = '#2B2B2B'
WOOD, WOOD_L, WOOD_D = '#8B5A2B', '#B07A42', '#5C3A1A'

def horizontal():
    H = {}
    # HK G3 Battle Rifle (ficha 5.4): corpo/cano preto, partes inferiores bege, luneta preta com luz verde
    H['hk_g3_rifle'] = rects(30, 12, [
        (9, 0, 18, 1, '#0A0A0A', '#2B2B2B', None),       # luneta
        (18, 0, 18, 1, '#00FF00', None, None),           # ponto verde
        (8, 0, 8, 1, '#2B2B2B', None, None),             # ocular
        (11, 2, 11, 2, MEC, None, None), (16, 2, 16, 2, MEC, None, None),  # bases
        (0, 3, 6, 7, BLK, BLK_L, BLK_D),                 # coronha
        (0, 3, 0, 7, MEC, None, None),                   # soleira
        (4, 6, 7, 6, BLK, None, None),
        (7, 3, 18, 5, BLK, BLK_L, None),                 # receptor
        (7, 6, 18, 6, TAN_D, None, None),                # faixa bege inferior
        (19, 3, 25, 5, TAN, TAN_L, TAN_D),               # guarda-mão bege
        (26, 4, 29, 4, BLK, None, None),                 # cano
        (28, 3, 29, 5, MEC, None, None),                 # quebra-chamas
        (9, 7, 11, 10, BLK, BLK_L, BLK_D),               # empunhadura
        (12, 7, 13, 7, MEC, None, None),                 # gatilho
        (14, 7, 16, 11, BLK, BLK_L, BLK_D),              # carregador
    ])
    H['combat_pistol'] = rects(18, 12, [
        (2, 2, 16, 4, '#3C3F44', '#6B7078', '#1E2023'),  # ferrolho
        (3, 1, 3, 1, '#C8C8C8', None, None), (15, 1, 15, 1, '#C8C8C8', None, None),
        (2, 5, 14, 5, BLK, None, None),                  # armação
        (17, 3, 17, 3, BLK, None, None),                 # boca
        (2, 6, 5, 11, MEC, '#4A4A4A', BLK_D),            # empunhadura
        (6, 6, 9, 6, BLK, None, None), (9, 7, 9, 8, BLK, None, None), (6, 8, 8, 8, BLK, None, None),
    ])
    H['scatter_shotgun'] = rects(30, 10, [
        (0, 2, 7, 6, WOOD, WOOD_L, WOOD_D),              # coronha
        (0, 2, 0, 6, '#3A2410', None, None),
        (5, 6, 8, 8, WOOD, None, WOOD_D),                # punho
        (8, 2, 13, 5, MEC, '#4A4A4A', BLK_D),            # receptor
        (14, 2, 29, 3, '#3A3A3A', '#5A5A5A', None),      # cano
        (14, 4, 27, 4, MEC, None, None),                 # tubo
        (17, 4, 22, 6, WOOD, WOOD_L, WOOD_D),            # telha
        (28, 1, 28, 1, '#D0B060', None, None),
        (10, 6, 11, 6, BLK, None, None),
    ])
    H['m700_sniper'] = rects(32, 11, [
        (8, 0, 20, 2, '#0A0A0A', '#333333', None),       # luneta
        (20, 0, 20, 2, '#4FC3F7', None, None),           # lente
        (11, 3, 11, 3, MEC, None, None), (17, 3, 17, 3, MEC, None, None),
        (0, 4, 10, 8, '#6B4423', '#8E6034', '#4A2E16'),  # coronha
        (0, 4, 0, 8, '#2A1A0C', None, None),
        (9, 7, 11, 9, '#6B4423', None, '#4A2E16'),       # punho
        (11, 4, 18, 5, MEC, '#4A4A4A', None),            # ação
        (15, 3, 16, 3, '#9A9A9A', None, None),           # ferrolho
        (11, 6, 22, 7, '#6B4423', '#8E6034', '#4A2E16'),  # telha
        (19, 5, 31, 5, '#1E1E1E', None, None),           # cano
        (13, 8, 14, 8, BLK, None, None),
    ])
    return H

def guns():
    return {k: rotsprite(v, 45) for k, v in horizontal().items()}

def hud_icons():
    """Silhuetas brancas da arma para o HUD (estilo da imagem 'assault_rifle' do vídeo)."""
    out = {}
    for k, v in horizontal().items():
        im = v.copy(); p = im.load()
        for y in range(im.size[1]):
            for x in range(im.size[0]):
                if p[x, y][3] > 0:
                    p[x, y] = (235, 235, 235, 255)
        out[k] = im
    return out
