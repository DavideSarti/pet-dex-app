"""
True pixel art leopard gecko using polygon drawing.
48x36 native, scaled 12x. No anti-aliasing.
"""
from PIL import Image, ImageDraw

BG    = (15, 56, 15)
BLACK = (0, 0, 0)
SKIN  = (232, 197, 71)
DOTS  = (139, 105, 20)
BELLY = (245, 230, 184)
EYE   = (45, 45, 45)
WHITE = (255, 255, 255)

W, H = 48, 36
img = Image.new('RGB', (W, H), BG)
draw = ImageDraw.Draw(img)

# Full body silhouette (black outline)
body = [
    (8,9),(6,9),(4,10),(3,11),(2,13),(2,15),(2,17),
    (3,19),(4,20),(6,21),(8,22),
    (10,23),(12,24),(14,25),(18,25),(20,24),(22,23),
    (24,22),(26,21),(28,20),(30,19),(32,18),
    (34,16),(35,14),(36,12),(37,10),(37,8),(36,7),
    (35,7),(34,8),(33,9),(31,10),(29,11),
    (27,12),(25,13),(23,13),(20,13),(17,12),
    (14,11),(12,10),(10,9),
]
draw.polygon(body, fill=BLACK)

# Skin fill (1px inside outline)
skin = [
    (8,10),(6,10),(5,11),(4,12),(3,13),(3,15),(3,17),
    (4,19),(5,20),(7,21),
    (9,22),(11,23),(13,24),(17,24),(19,23),(21,22),
    (23,21),(25,20),(27,19),(29,18),(31,17),
    (33,15),(34,13),(35,11),(36,9),(36,8),
    (35,8),(34,9),(33,10),(31,11),
    (29,12),(27,13),(24,14),(21,14),(18,13),
    (15,12),(13,11),(11,10),
]
draw.polygon(skin, fill=SKIN)

# Belly — just the lower portion of the head/body
belly = [
    (4,17),(3,16),(3,15),
    (4,17),(5,18),(6,19),(7,20),
    (9,21),(11,22),(14,23),(17,23),
    (18,22),(16,22),(13,21),(11,20),(9,19),
    (7,18),(5,17),
]
draw.polygon(belly, fill=BELLY)

# Front leg
draw.polygon([(7,22),(10,22),(10,29),(7,29)], fill=BLACK)
draw.rectangle([8,23,9,28], fill=SKIN)
draw.rectangle([8,27,9,28], fill=BELLY)
# Toes
for x in [7,10]:
    img.putpixel((x, 29), BLACK)

# Back leg
draw.polygon([(19,24),(22,24),(22,29),(19,29)], fill=BLACK)
draw.rectangle([20,25,21,28], fill=SKIN)
draw.rectangle([20,27,21,28], fill=BELLY)
for x in [19,22]:
    img.putpixel((x, 29), BLACK)

# Eye (big and cute)
draw.rectangle([4,13,7,16], fill=EYE)
img.putpixel((4,13), WHITE)
img.putpixel((5,13), WHITE)

# Mouth
img.putpixel((3,18), BLACK)

# Dots scattered on skin only
dots = [
    (8,12),(10,11),(9,14),
    (14,13),(17,14),(20,13),(12,14),
    (16,12),(19,12),(13,16),(16,15),
    (19,16),(10,15),(15,14),(21,15),
    (25,15),(27,14),(24,16),
    (29,13),(31,12),(33,11),(35,10),
    (30,15),(32,14),(34,12),
]
for dx, dy in dots:
    if 0 <= dx < W and 0 <= dy < H:
        if img.getpixel((dx, dy)) == SKIN:
            img.putpixel((dx, dy), DOTS)

# Scale up
scale = 12
big = img.resize((W * scale, H * scale), Image.NEAREST)

import os
out = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'gecko-sprite.png')
big.save(out)
print(f"Saved {big.width}x{big.height} to {out}")
