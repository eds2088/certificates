"""Sprites 16x16 desenhados à mão (paletas tiradas das fichas do Mod Detector)."""
from arte_base import grid, check_rows

SWORD = [
    "................",
    ".............OOO",
    "............OHLO",
    "...........OHLDO",
    "..........OHLDO.",
    ".........OHLDO..",
    "........OHLDO...",
    "...OO..OHLDO....",
    "...OGOOHLDO.....",
    "....OGHLDO......",
    "....OOGGO.......",
    "...OhhOOGO......",
    "..OhkO..OO......",
    ".OhkO...........",
    "OPkO............",
    "OOO.............",
]
HEAVY = [
    "............OOOO",
    "...........OHLLO",
    "..........OHLMDO",
    ".........OHLMDO.",
    "........OHLMDO..",
    ".......OHLMDO...",
    "......OHLMDO....",
    "..OO.OHLMDO.....",
    "..OGOHLMDO......",
    "..OGGLMDO.......",
    "...OGGGO........",
    "..OhOOGGO.......",
    ".OhkO..OGO......",
    "OhkO....OO......",
    "PkO.............",
    "OO..............",
]
KATANA = [
    "..............OO",
    ".............OHO",
    "............OHDO",
    "...........OHDO.",
    "..........OHDO..",
    ".........OHDO...",
    "........OHDO....",
    ".......OHDO.....",
    "......OHDO......",
    ".....OTTO.......",
    "....OTTTO.......",
    "...OwhOO........",
    "..OhwO..........",
    ".OwhO...........",
    "OhwO............",
    "OOO.............",
]
LASER = [
    ".............ooo",
    "............oWCo",
    "...........oWCBo",
    "..........oWCBo.",
    ".........oWCBo..",
    "........oWCBo...",
    ".......oWCBo....",
    "......oWCBo.....",
    ".....oWCBo......",
    "....OSSSO.......",
    "...OSsSO........",
    "..OsSsO.........",
    ".OSsrO..........",
    "OsSsO...........",
    "OSsO............",
    "OOO.............",
]
AXE = [
    "................",
    "......OOO.......",
    ".....OHLLO......",
    "....OHLMMLO.....",
    "...OHLMMMMLO....",
    "...OLMMDDMMOO...",
    "...OLMDDDDOkO...",
    "....OMDDDOhkO...",
    ".....OODOhkO....",
    ".......OhkO.....",
    "......OhkO......",
    ".....OhkO.......",
    "....OhkO........",
    "...OhkO.........",
    "..OhkO..........",
    "..OOO...........",
]
TOTEM = [
    ".....OOOOOO.....",
    "....ORLLLLRO....",
    "....ORLRRRRO....",
    "....OEeRREeO....",
    "....ORRRRRRO....",
    "....OdRDDRdO....",
    "..OOOOdRRdOOOO..",
    ".ORRLRRGGRRLRRO.",
    ".OdddRRGGRRdddO.",
    "..OOOORRRROOOO..",
    ".....ORRRRO.....",
    ".....ORdRdO.....",
    "....ORRRRRRO....",
    "....OGGGGGGO....",
    "....OdddddDO....",
    ".....OOOOOO.....",
]
HELMET_TNT = [
    "................",
    "................",
    "........SY......",
    ".......OK.......",
    "...OOOOOKOOOO...",
    "..ORRLLLLLLRRO..",
    ".ORLRRRRRRRRLRO.",
    ".ORRRRRRRRRRRRO.",
    ".OYYKYYKKYYKYYO.",
    ".ORdRRRRRRRRdRO.",
    ".ORRO......ORRO.",
    ".ORdO......OdRO.",
    ".OOO........OOO.",
    "................",
    "................",
    "................",
]
HELMET = [
    "................",
    "................",
    "................",
    "....OOOOOOOO....",
    "..OOLLHHHHLLOO..",
    ".OLHMMMMMMMMLMO.",
    ".OLMMMMMMMMMMDO.",
    ".OMMGGGGGGGGMDO.",
    ".OMDMMMMMMMMDDO.",
    ".OMMO......OMDO.",
    ".OMDO......ODDO.",
    ".OOO........OOO.",
    "................",
    "................",
    "................",
    "................",
]
CHEST = [
    "................",
    "..OOOO....OOOO..",
    ".OLLMO....OMLLO.",
    ".OLMMOOOOOOMMDO.",
    ".OMMMMLLLLMMMDO.",
    "..OOMMLGGMMDOO..",
    "....OMLGGMDO....",
    "....OMLMMMDO....",
    "....OMLMMMDO....",
    "....OMLMMMDO....",
    "....OMMMMMDO....",
    "....ODDDDDDO....",
    "....OOOOOOOO....",
    "................",
    "................",
    "................",
]
CREEPER_SHIRT = [
    "................",
    "..OOOO....OOOO..",
    ".OLLAO....OALLO.",
    ".OLAAOOOOOOAADO.",
    ".OAAAALLLLAAADO.",
    "..OOAALAAAADOO..",
    "....OKKAAKKO....",
    "....OKKAAKKO....",
    "....OAAKKAAO....",
    "....OAKKKKAO....",
    "....OAKAAKAO....",
    "....ODDDDDDO....",
    "....OOOOOOOO....",
    "................",
    "................",
    "................",
]
LEGS = [
    "................",
    "................",
    "...OOOOOOOOOOO..",
    "...OLHHHHHHHMO..",
    "...OLMMGGGMMDO..",
    "...OLMMMOMMMDO..",
    "...OLMDO.OLMDO..",
    "...OLMDO.OLMDO..",
    "...OLMDO.OLMDO..",
    "...OLMDO.OLMDO..",
    "...OLMDO.OLMDO..",
    "...OLMDO.OLMDO..",
    "...ODDDO.ODDDO..",
    "...OOOOO.OOOOO..",
    "................",
    "................",
]
BOOTS = [
    "................",
    "................",
    "................",
    "................",
    "................",
    "...OOOO..OOOO...",
    "...OLMO..OLMO...",
    "...OLMO..OLMO...",
    "...OGGO..OGGO...",
    "..OOLMO..OLMOO..",
    ".OLLLMO..OLLLMO.",
    ".OMMMDO..OMMMDO.",
    ".OOOOOO..OOOOOO.",
    "................",
    "................",
    "................",
]
AMMO = [
    "................",
    "................",
    "....T.T.T.T.....",
    "....B.B.B.B.....",
    "..OOOOOOOOOOOO..",
    "..OLLLLLLLLLLO..",
    "..OCCCCCCCCCDO..",
    "..OCCCCKKCCCDO..",
    "..OKKKKKKKKKKO..",
    "..OCCCCKKCCCDO..",
    "..OCCCCCCCCCDO..",
    "..ODDDDDDDDDDO..",
    "..OOOOOOOOOOOO..",
    "................",
    "................",
    "................",
]
REMOTE = [
    "................",
    "....OOOOOOOO....",
    "...OPPPPPPPPO...",
    "...OPSSSSSSPO...",
    "...OPSYYYSSPO...",
    "...OPSSSYSSPO...",
    "...OPSSYYSSPO...",
    "...OPSSYSSSPO...",
    "...OPSSSSSSPO...",
    "...OPSSYSSSPO...",
    "...OPSSSSSSPO...",
    "...OPPPPPPPPO...",
    "...OPbPPPPrPO...",
    "...OPPPPPPPPO...",
    "....OOOOOOOO....",
    "................",
]
BOOK = [
    "................",
    "...OOOOOOOOOO...",
    "..OCCCCCCCCCWO..",
    "..OCGGGGGGGCWO..",
    "..OCGCYYYCGCWO..",
    "..OCGCCCYCGCWO..",
    "..OCGCCYYCGCWO..",
    "..OCGCCYCCGCWO..",
    "..OCGCCCCCGCWO..",
    "..OCGCCYCCGCWO..",
    "..OCGGGGGGGCWO..",
    "..OCCCCCCCCCWO..",
    "..ODDDDDDDDDWO..",
    "..OOWWWWWWWWWO..",
    "...OOOOOOOOOOO..",
    "................",
]
AMULET = [
    "................",
    ".....GG..GG.....",
    "....G..GG..G....",
    "....G......G....",
    ".....G....G.....",
    "......OOOO......",
    ".....OBBBBO.....",
    "....OBLLLLBO....",
    "...OBLEBBELBO...",
    "...OBBBBBBBBO...",
    "...OWBBBBBBWO...",
    "..OWWOBBBBOWWO..",
    "...OO.OBBO.OO...",
    "......OOOO......",
    "................",
    "................",
]
APPLE = [
    "................",
    ".......K........",
    "......K.GG......",
    "....OOKOGGO.....",
    "...OYWYYYYYO....",
    "..OYWWYYYYYdO...",
    "..ObbbbbbbbbO...",
    "..OYWYYYYYYdO...",
    "..OYYYYYYYYdO...",
    "..ObbbbbbbbbO...",
    "..OYYYYYYYddO...",
    "...OYYYYYddO....",
    "....OYdOOddO....",
    ".....OO..OO.....",
    "................",
    "................",
]

ALL = {k: v for k, v in globals().items() if k.isupper() and isinstance(v, list)}
for _n, _r in ALL.items():
    check_rows(_n, _r, 16)

def sprites():
    P = {}
    # Espada Syntaxium — #4B0082 #330066 #9B30FF #DDA0DD / cabo #2F2F2F #A9A9A9 #000000
    P['syntaxium_sword'] = grid(SWORD, {'O': '#1A0033', 'H': '#DDA0DD', 'L': '#9B30FF', 'D': '#4B0082',
                                         'G': '#A9A9A9', 'h': '#2F2F2F', 'k': '#000000', 'P': '#9B30FF'})
    # Heavy Syntaxium — #7F1919 #B23030 #330000 #1A1A1A #3B1C1C
    P['heavy_syntaxium_sword'] = grid(HEAVY, {'O': '#330000', 'H': '#E06060', 'L': '#B23030', 'M': '#7F1919',
                                               'D': '#4A0E0E', 'G': '#3B1C1C', 'h': '#3B1C1C', 'k': '#1A1A1A', 'P': '#B23030'})
    # Machado Syntaxium — #5A2A82 #7B34A3 #3F1A5F #B76FE9 #2E1352
    P['syntaxium_axe'] = axe_sprite('#B76FE9', '#7B34A3', '#5A2A82', '#3F1A5F', '#2E1352', '#5A2A82', '#3F1A5F')
    # Katana de Netherita — #1a1a1a #4d4d4d #3d2b1f #2e2e2e #000000
    P['netherite_katana'] = grid(KATANA, {'O': '#000000', 'H': '#6E6E6E', 'D': '#2E2E2E', 'T': '#4D4D4D',
                                           'w': '#5A4232', 'h': '#3D2B1F'})
    # Katana de Yami — lâmina negra com aura roxa (anti-magia)
    P['yami_katana'] = grid(KATANA, {'O': '#12001F', 'H': '#8A2BE2', 'D': '#1A1A1A', 'T': '#C9A227',
                                      'w': '#E8E8E8', 'h': '#141414'})
    # Laser Blade — ciano brilhante
    P['laser_blade'] = grid(LASER, {'o': '#1B7E8C', 'W': '#FFFFFF', 'C': '#7FF6FF', 'B': '#22C8E0',
                                     'O': '#0D1418', 'S': '#5C6670', 's': '#2C333A', 'r': '#FF3B3B'})
    # Totem Boost V — #7B0000 #F7ED96 #9F1B1B #CBCBCB
    P['totem_boost'] = grid(TOTEM, {'O': '#2A0000', 'R': '#9F1B1B', 'L': '#C83A3A', 'd': '#7B0000', 'D': '#4A0000',
                                     'E': '#F7ED96', 'e': '#CBCBCB', 'G': '#E8C547'})
    # TNT Cowl — #8B0000 + #FFD700
    P['tnt_cowl'] = grid(HELMET_TNT, {'O': '#2B0000', 'R': '#B01818', 'L': '#D84040', 'd': '#8B0000', 'Y': '#FFD700',
                                       'K': '#1A1A1A', 'S': '#FFF6B0'})
    syn = {'O': '#1C0436', 'H': '#B19CD9', 'L': '#8A2BE2', 'M': '#6A0DAD', 'D': '#2E0854', 'G': '#B19CD9'}
    P['syntaxium_helmet'] = grid(HELMET, syn)
    P['syntaxium_chestplate'] = grid(CHEST, syn)
    P['syntaxium_boots'] = grid(BOOTS, syn)
    # Netherite Leggings customizadas — #4B406A #7E6EA8 #000000 #A18FCF #9379CA
    P['netherite_leggings'] = grid(LEGS, {'O': '#000000', 'H': '#A18FCF', 'L': '#9379CA', 'M': '#4B406A',
                                           'D': '#2E2742', 'G': '#7E6EA8'})
    # Creeper Shirt — #A3D977 #7AB34B #3E571B #D4F57C
    P['creeper_shirt'] = grid(CREEPER_SHIRT, {'O': '#22330E', 'L': '#D4F57C', 'A': '#A3D977', 'D': '#7AB34B', 'K': '#3E571B'})
    P['ammo_box'] = grid(AMMO, {'O': '#1A1A12', 'L': '#8C9C52', 'C': '#6B7A3A', 'D': '#4A5428', 'K': '#2B2B2B',
                                 'T': '#F2D16B', 'B': '#C8952E'})
    P['clue_remote'] = grid(REMOTE, {'O': '#4A1038', 'P': '#E04DB0', 'S': '#1E2A3A', 'Y': '#FFE45C',
                                      'b': '#4DA6FF', 'r': '#FF4D4D'})
    P['clue_book'] = grid(BOOK, {'O': '#1E0B30', 'C': '#5A2A82', 'D': '#3F1A5F', 'G': '#E8C547', 'Y': '#FFE45C',
                                  'W': '#E9EBDC'})
    # Amuleto do Allay — #3366FF #99CCFF #4D85FF #CCEEFF
    P['allay_whistle'] = grid(AMULET, {'O': '#14286B', 'B': '#3366FF', 'L': '#4D85FF', 'E': '#99CCFF',
                                        'W': '#CCEEFF', 'G': '#E8C547'})
    P['compacted_golden_apple'] = grid(APPLE, {'O': '#5C3A00', 'Y': '#F5C842', 'W': '#FFF4B8', 'd': '#C99A1E',
                                                'b': '#A87C10', 'K': '#5A3A1A', 'G': '#4CAF50'})
    P['titanium_apple'] = grid(APPLE, {'O': '#2A3138', 'Y': '#C9D3DC', 'W': '#FFFFFF', 'd': '#8E9AA6',
                                        'b': '#6F7C88', 'K': '#3A3A3A', 'G': '#4FC3F7'})
    return P


def axe_sprite(edge, light, mid, dark, outline, handle, handle_dark):
    """Machado procedural: lâmina em leque (fio claro na borda externa) + cabo diagonal."""
    from PIL import Image
    from arte_base import hexc
    im = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    cx, cy = 10.0, 6.0
    for y in range(16):
        for x in range(16):
            dx, dy = x + 0.5 - cx, y + 0.5 - cy
            d = (dx * dx + dy * dy) ** 0.5
            side = (x + 0.5) + (y + 0.5) - 16.0  # < 0: acima/esquerda do cabo
            if d <= 6.6 and side <= -1.2 and dx <= 0.6 and dy <= 2.6:
                c = edge if d > 5.5 else light if d > 4.3 else mid if d > 2.8 else dark
                im.putpixel((x, y), hexc(c))
    for x in range(2, 14):
        y = 15 - x
        im.putpixel((x, y), hexc(handle))
        if x + 1 < 16:
            im.putpixel((x + 1, y), hexc(handle_dark))
    p = im.load(); add = []
    for y in range(16):
        for x in range(16):
            if p[x, y][3] == 0 and any(0 <= x + a < 16 and 0 <= y + b < 16 and p[x + a, y + b][3] > 0
                                       for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                add.append((x, y))
    for q in add:
        p[q] = hexc(outline)
    return im


def axe_hd(n=32):
    """Machado Syntaxium em 32x32: lâmina em meia-lua com fio brilhante, alvado e cabo com faixas."""
    from PIL import Image
    from arte_base import hexc
    im = Image.new('RGBA', (n, n), (0, 0, 0, 0)); p = im.load()
    def put(x, y, c):
        if 0 <= x < n and 0 <= y < n: p[x, y] = hexc(c)
    # cabo diagonal (de baixo-esquerda para cima-direita), 3 px de espessura
    for i in range(4, 28):
        x, y = i, 31 - i
        put(x, y, '#5A2A82'); put(x + 1, y, '#3F1A5F'); put(x, y - 1, '#7B34A3')
        if i % 5 == 0:
            put(x, y, '#B76FE9'); put(x + 1, y, '#7B34A3')
    # lâmina: meia-lua à esquerda do topo do cabo
    cx, cy = 21.5, 10.5
    for y in range(n):
        for x in range(n):
            dx, dy = x + 0.5 - cx, y + 0.5 - cy
            d = (dx * dx + dy * dy) ** 0.5
            if d < 12.5 and dx < -1.5 and -9.5 < dy < 9.5 and (x + y) < 33:
                t = d / 12.5
                c = '#E3C2FF' if d > 11.3 else '#B76FE9' if d > 9.5 else '#7B34A3' if d > 6.5 else '#5A2A82'
                if c != '#E3C2FF' and (x + 2 * y) % 9 == 0 and d > 6:
                    c = '#8E45BC'
                put(x, y, c)
    # alvado (onde a lâmina encaixa no cabo)
    for y in range(6, 16):
        for x in range(18, 23):
            if (x + y) in range(25, 33): put(x, y, '#3F1A5F' if (x + y) % 2 else '#2E1352')
    # contorno
    add = []
    for y in range(n):
        for x in range(n):
            if p[x, y][3] == 0 and any(0 <= x + a < n and 0 <= y + b < n and p[x + a, y + b][3] > 0 for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                add.append((x, y))
    for q in add: p[q] = hexc('#1A0833')
    return im
