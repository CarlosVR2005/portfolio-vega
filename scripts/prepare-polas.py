"""
Derivados de POLAS (los originales no se tocan):
  - derived/cover-front.png      portada frontal (vertical) recortada de la cubierta
  - derived/perception-0N.png    versiones del personaje para la sección "Percepción"
Uso:  python -I scripts/prepare-polas.py
"""
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'assets', 'projects', 'polas')
OUT = os.path.join(ROOT, 'derived')
os.makedirs(OUT, exist_ok=True)


def crop(name, box):
    im = Image.open(os.path.join(ROOT, name)).convert('RGBA')
    w, h = im.size
    return im.crop((int(box[0] * w), int(box[1] * h), int(box[2] * w), int(box[3] * h)))


def on_canvas(im, size=(1000, 1250), bg=(255, 255, 255, 255), fill=0.92, anchor='center'):
    c = Image.new('RGBA', size, bg)
    im = im.copy()
    im.thumbnail((int(size[0] * fill), int(size[1] * fill)), Image.LANCZOS)
    x = (size[0] - im.width) // 2
    y = (size[1] - im.height) // 2 if anchor == 'center' else size[1] - im.height
    c.alpha_composite(im, (x, y))
    return c.convert('RGB')


# Portada frontal: la mitad derecha de la cubierta, con el título POLAS
front = crop('cover-polas.png', (0.42, 0, 1, 1)).convert('RGB')
front.save(os.path.join(OUT, 'cover-front.png'))

# Percepción: cuatro versiones del mismo personaje
versions = [
    on_canvas(crop('spread-03-snail-girl.png', (0.56, 0.28, 0.96, 1.0)), anchor='bottom', fill=1),
    on_canvas(Image.open(os.path.join(ROOT, 'character-spine.png')).convert('RGBA'), fill=0.9),
    Image.open(os.path.join(ROOT, 'spread-05-face-flow.png')).convert('RGB').crop((0, 0, 991, 1239)).resize((1000, 1250), Image.LANCZOS),
    Image.open(os.path.join(ROOT, 'spread-04-eye-child.png')).convert('RGB').crop((560, 0, 1551, 1239)).resize((1000, 1250), Image.LANCZOS),
]
for i, v in enumerate(versions):
    v.save(os.path.join(OUT, f'perception-{i + 1:02d}.png'))
print('ok', front.size)
