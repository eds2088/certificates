import sys
sys.path.insert(0, '.')
from arte_base import preview
from itens import sprites
from armas import guns
s = sprites(); g = guns()
preview(list(s.items()), sys.argv[1], scale=8, cols=7)
preview(list(g.items()), sys.argv[2], scale=6, cols=4)
