"""Armas desenhadas direto em alta resolução (64 px de largura), com materiais:
metal (degradê + brilho), polímero (preto fosco), madeira (veios) e bege (guarda-mão do G3)."""
import random
from PIL import Image
from arte_base import hexc

def _shade(c, f):
    return tuple(max(0, min(255, int(v * f))) for v in c[:3]) + (255,)

class Canvas:
    def __init__(self, w, h, seed=1):
        self.im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); self.p = self.im.load(); self.r = random.Random(seed)
        self.w, self.h = w, h
    def put(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.p[x, y] = c
    def part(self, x0, y0, x1, y1, color, mat='metal', skew=None):
        """Retângulo [x0..x1]x[y0..y1]; skew(i) desloca a linha i (para empunhaduras inclinadas)."""
        base = hexc(color); hgt = max(1, y1 - y0)
        for y in range(y0, y1 + 1):
            t = (y - y0) / hgt
            off = skew(y - y0) if skew else 0
            for x in range(x0 + off, x1 + 1 + off):
                if mat == 'metal':
                    f = 1.35 - 0.6 * t
                    if y == y0: f = 1.75
                elif mat == 'polymer':
                    f = 1.25 - 0.4 * t + self.r.uniform(-0.05, 0.05)
                    if y == y0: f = 1.6
                elif mat == 'wood':
                    grain = 0.12 if ((y * 7 + (x // 5) * 3) % 5 == 0) else 0
                    f = 1.15 - 0.35 * t - grain + self.r.uniform(-0.04, 0.04)
                    if y == y0: f = 1.3
                elif mat == 'tan':
                    f = 1.1 - 0.3 * t + self.r.uniform(-0.03, 0.03)
                    if y == y0: f = 1.2
                else:
                    f = 1.0
                self.put(x, y, _shade(base, f))
    def dot(self, x, y, color):
        self.put(x, y, hexc(color))
    def outline(self, color='#050505'):
        o = hexc(color); add = []
        for y in range(self.h):
            for x in range(self.w):
                if self.p[x, y][3] == 0 and any(0 <= x + a < self.w and 0 <= y + b < self.h and self.p[x + a, y + b][3] > 0
                                                for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    add.append((x, y))
        for q in add:
            self.p[q] = o
        return self

    def square(self, size=64):
        bb = self.im.getbbox(); crop = self.im.crop(bb)
        out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        out.paste(crop, ((size - crop.size[0]) // 2, (size - crop.size[1]) // 2))
        return out

def g3():
    c = Canvas(64, 30, 1)
    BLK, DK = '#1E1E1E', '#2B2B2B'
    c.part(13, 1, 38, 6, '#161616', 'metal')                 # luneta
    c.part(36, 0, 40, 7, '#1A1A1A', 'metal')                 # objetiva
    c.part(10, 2, 13, 5, '#1A1A1A', 'metal')                 # ocular
    for y in range(2, 6): c.dot(41, y, '#0A3A0A')
    c.dot(41, 3, '#00FF00'); c.dot(41, 4, '#00FF00'); c.dot(40, 3, '#7CFF7C')
    c.part(17, 7, 19, 8, DK, 'metal'); c.part(31, 7, 33, 8, DK, 'metal')   # bases
    c.part(0, 10, 13, 18, BLK, 'polymer')                    # coronha
    c.part(0, 9, 2, 20, '#333333', 'polymer')                # soleira
    c.part(8, 9, 13, 10, BLK, 'polymer')
    c.part(13, 9, 41, 15, '#141414', 'metal')                # receptor
    for x in range(14, 41, 2): c.dot(x, 9, '#3C3C3C')        # trilho
    c.part(27, 11, 32, 12, '#050505', 'flat')                # janela de ejeção
    c.part(15, 15, 41, 17, '#CAB89B', 'tan')                 # receptor inferior bege
    c.part(19, 18, 24, 27, BLK, 'polymer', skew=lambda i: -(i // 3))   # empunhadura
    c.part(25, 18, 31, 18, DK, 'flat'); c.part(31, 18, 31, 21, DK, 'flat'); c.part(25, 21, 31, 21, DK, 'flat')  # guarda-mato
    c.dot(27, 19, '#5A5A5A'); c.dot(27, 20, '#5A5A5A')       # gatilho
    c.part(32, 18, 37, 28, '#181818', 'polymer', skew=lambda i: i // 4)  # carregador
    c.part(41, 10, 54, 16, '#CAB89B', 'tan')                 # guarda-mão bege
    for x in range(43, 53, 3): c.part(x, 12, x, 14, '#7A6A50', 'flat')   # ventilação
    c.part(51, 6, 52, 9, '#1A1A1A', 'metal')                 # massa de mira
    c.part(54, 12, 60, 14, '#2E2E2E', 'metal')               # cano
    c.part(60, 11, 63, 15, '#202020', 'metal')               # quebra-chamas
    c.dot(61, 13, '#050505'); c.dot(62, 13, '#050505')
    return c.outline().square()

def pistol():
    c = Canvas(52, 34, 2)
    c.part(6, 4, 44, 11, '#6E737B', 'metal')                 # ferrolho
    for x in range(8, 16, 2): c.part(x, 5, x, 10, '#3E434A', 'flat')    # serrilhado
    c.part(26, 6, 31, 7, '#2A2D31', 'flat')                  # janela de ejeção
    c.dot(8, 3, '#DDDDDD'); c.dot(42, 3, '#DDDDDD')          # miras
    c.part(44, 6, 46, 9, '#2A2D31', 'metal')                 # boca
    c.part(8, 12, 42, 15, '#1E1E1E', 'polymer')              # armação
    c.part(9, 16, 18, 32, '#262626', 'polymer', skew=lambda i: -(i // 4))   # empunhadura
    for y in range(18, 31, 2):
        for x in range(10, 17, 2): c.dot(x - (y - 16) // 4, y, '#3A3A3A')
    c.part(19, 16, 29, 16, '#1E1E1E', 'flat'); c.part(29, 16, 29, 21, '#1E1E1E', 'flat'); c.part(19, 21, 29, 21, '#1E1E1E', 'flat')
    c.dot(23, 17, '#8A8A8A'); c.dot(23, 18, '#8A8A8A')
    return c.outline().square()

def shotgun():
    c = Canvas(64, 24, 3)
    W = '#8B5A2B'
    c.part(0, 7, 16, 16, W, 'wood', skew=None)               # coronha
    c.part(0, 6, 2, 18, '#3A2410', 'flat')                   # soleira
    c.part(10, 16, 16, 21, W, 'wood', skew=lambda i: -(i // 2))   # punho
    c.part(16, 5, 28, 14, '#3A3A3A', 'metal')                # receptor
    c.dot(21, 9, '#C8A040'); c.dot(22, 9, '#C8A040')         # detalhe dourado
    c.part(28, 5, 63, 8, '#4A4A4A', 'metal')                 # cano
    c.part(28, 9, 60, 11, '#333333', 'metal')                # tubo do carregador
    c.part(34, 9, 47, 14, W, 'wood')                         # telha
    for x in range(35, 47, 2): c.part(x, 12, x, 14, '#5C3A1A', 'flat')
    c.dot(62, 4, '#E8C547')                                  # massa
    c.part(18, 15, 25, 15, '#2A2A2A', 'flat'); c.part(25, 15, 25, 18, '#2A2A2A', 'flat')
    return c.outline().square()

def sniper():
    c = Canvas(64, 26, 4)
    W = '#6B4423'
    c.part(14, 0, 40, 5, '#151515', 'metal')                 # luneta
    c.part(11, 1, 14, 5, '#1C1C1C', 'metal'); c.part(39, 0, 43, 6, '#1C1C1C', 'metal')
    for y in range(1, 6): c.dot(44, y, '#2C7FB8')
    c.dot(44, 2, '#9FE3FF')
    c.part(20, 6, 22, 7, '#2B2B2B', 'metal'); c.part(33, 6, 35, 7, '#2B2B2B', 'metal')
    c.part(0, 9, 26, 18, W, 'wood')                          # coronha
    c.part(0, 8, 2, 20, '#2A1A0C', 'flat')
    c.part(12, 18, 18, 23, W, 'wood', skew=lambda i: -(i // 2))
    c.part(24, 8, 40, 12, '#2E2E2E', 'metal')                # ação
    c.part(34, 12, 35, 15, '#9A9A9A', 'metal'); c.part(33, 15, 36, 16, '#C8C8C8', 'metal')  # ferrolho
    c.part(26, 13, 46, 16, W, 'wood')                        # telha
    c.part(40, 9, 63, 11, '#1E1E1E', 'metal')                # cano longo
    c.part(27, 17, 33, 17, '#1E1E1E', 'flat'); c.part(33, 17, 33, 19, '#1E1E1E', 'flat')
    return c.outline().square()

def guns_hd():
    return {'hk_g3_rifle': g3(), 'combat_pistol': pistol(), 'scatter_shotgun': shotgun(), 'm700_sniper': sniper()}
