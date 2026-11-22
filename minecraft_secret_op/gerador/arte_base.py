"""Ferramentas de pixel art usadas pelo gerador do SECRET OP v2."""
from PIL import Image

def hexc(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

def grid(rows, pal, size=None):
    """Desenha a partir de linhas ASCII. '.' = transparente."""
    h = len(rows); w = max(len(r) for r in rows)
    if size: w, h = size
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch == '.' or ch == ' ':
                continue
            if ch not in pal:
                raise KeyError(f'cor {ch!r} sem paleta (linha {y}: {r})')
            c = pal[ch]
            im.putpixel((x, y), hexc(c) if isinstance(c, str) else c)
    return im

def check_rows(name, rows, w):
    for i, r in enumerate(rows):
        if len(r) != w:
            raise ValueError(f'{name}: linha {i} tem {len(r)} colunas (esperado {w}): {r!r}')

def preview(images, path, scale=8, cols=6, bg=(24, 24, 40, 255)):
    from PIL import ImageDraw
    cell = max(max(im.size) for _, im in images) * scale + 24
    rows = (len(images) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * cell, rows * cell), bg)
    d = ImageDraw.Draw(sheet)
    for i, (name, im) in enumerate(images):
        big = im.resize((im.size[0] * scale, im.size[1] * scale), Image.NEAREST)
        x, y = (i % cols) * cell + 4, (i // cols) * cell + 16
        sheet.alpha_composite(big, (x, y))
        d.text((x, y - 14), name, fill=(255, 255, 120, 255))
    sheet.convert('RGB').save(path)
