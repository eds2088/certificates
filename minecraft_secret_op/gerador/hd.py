"""Passo "HD": dobra a resolução (Scale2x, sem borrar o pixel art) e aplica iluminação
de cima-esquerda, chanfro nas bordas, brilho especular e textura sutil do material."""
import random
from PIL import Image
from armas import _scale2x

def _lum(c):
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]

def _mul(c, f):
    return tuple(max(0, min(255, int(round(v * f)))) for v in c[:3]) + (c[3],)

def _mix(c, d, t):
    return tuple(int(round(a + (b - a) * t)) for a, b in zip(c[:3], d[:3])) + (c[3],)

def hd(im, times=1, bevel=0.22, grad=0.16, noise=0.035, spec=True, seed=3):
    big = im.convert('RGBA')
    for _ in range(times):
        big = _scale2x(big)
    w, h = big.size
    src = big.load()
    out = big.copy(); dst = out.load()
    rnd = random.Random(seed)
    bbox = big.getbbox() or (0, 0, w, h)
    bw, bh = max(1, bbox[2] - bbox[0]), max(1, bbox[3] - bbox[1])
    def solid(x, y):
        if not (0 <= x < w and 0 <= y < h):
            return False
        c = src[x, y]
        return c[3] > 0 and _lum(c) > 28
    for y in range(h):
        for x in range(w):
            c = src[x, y]
            if c[3] == 0 or _lum(c) <= 28:
                continue  # transparente ou contorno escuro: mantém
            f = 1.0 + grad * (0.5 - ((x - bbox[0]) / bw + (y - bbox[1]) / bh) / 2)
            if not solid(x - 1, y - 1) or not solid(x, y - 1) or not solid(x - 1, y):
                f += bevel
            elif not solid(x + 1, y + 1) or not solid(x, y + 1) or not solid(x + 1, y):
                f -= bevel * 0.8
            f += rnd.uniform(-noise, noise)
            nc = _mul(c, f)
            if spec and not solid(x - 2, y - 2) and solid(x + 1, y + 1) and _lum(c) > 90 and rnd.random() < 0.5:
                nc = _mix(nc, (255, 255, 255, 255), 0.45)
            dst[x, y] = nc
    return out

def hd_flat(im, times=1, noise=0.05, seed=5):
    """Para texturas de bloco/armadura: dobra e acrescenta ruído fino de material (sem chanfro)."""
    big = im.convert('RGBA')
    for _ in range(times):
        big = _scale2x(big)
    rnd = random.Random(seed); p = big.load()
    for y in range(big.size[1]):
        for x in range(big.size[0]):
            c = p[x, y]
            if c[3]:
                p[x, y] = _mul(c, 1 + rnd.uniform(-noise, noise))
    return big
