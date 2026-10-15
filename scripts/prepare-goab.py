"""
Genera los derivados de GOAB a partir de los originales (no los modifica):
  - layers/sky.png        cielo con las montañas "borradas" (relleno)
  - layers/mountains.png  montañas y dunas con transparencia sobre la cresta
  - layers/bastian.png    silueta de Bastian (diferencia entre las dos versiones del paisaje)
  - silhouettes/NN.png    cada una de las siluetas de la hoja de poses
Uso:  python -I scripts/prepare-goab.py
"""
import os
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'assets', 'projects', 'goab')
OUT_L = os.path.join(ROOT, 'layers')
OUT_S = os.path.join(ROOT, 'silhouettes')
os.makedirs(OUT_L, exist_ok=True)
os.makedirs(OUT_S, exist_ok=True)


def layers():
    land = Image.open(os.path.join(ROOT, 'landscape.png')).convert('RGB')
    W, H = land.size
    a = np.asarray(land).astype(float)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    # Tierra = tonos anaranjados/marrones (G/R bajo) o zonas oscuras bajo el horizonte
    rows = np.arange(H)[:, None]
    landish = (((g / np.maximum(r, 1)) < 0.86) & (lum < 235) & (rows > H * 0.5)) | ((lum < 120) & (rows > H * 0.6))
    landish[: int(H * 0.5)] = False
    landish = ndimage.binary_opening(landish, iterations=2)
    landish = ndimage.binary_fill_holes(ndimage.binary_closing(landish, iterations=6))

    ridge = np.full(W, H - 1, dtype=float)
    for x in range(W):
        col = landish[:, x]
        run = 0
        for y in range(int(H * 0.5), H):
            run = run + 1 if col[y] else 0
            if run >= 8:
                ridge[x] = y - 7
                break
    ridge = ndimage.median_filter(ridge, size=9)
    ridge = ndimage.gaussian_filter1d(ridge, 1.2)

    yy = np.arange(H)[:, None]
    alpha = np.clip((yy - ridge[None, :] + 2) / 4, 0, 1)  # borde suavizado 4 px
    mountains = np.dstack([a, alpha * 255]).astype(np.uint8)
    Image.fromarray(mountains, 'RGBA').save(os.path.join(OUT_L, 'mountains.png'))

    # Cielo: estira hacia abajo el color que hay justo encima de la cresta y difumina
    sky = a.copy()
    for x in range(W):
        y0 = int(max(ridge[x] - 10, 0))
        sky[y0:, x] = a[max(y0 - 1, 0), x]
    sky_img = Image.fromarray(sky.astype(np.uint8))
    blurred = np.asarray(sky_img.filter(ImageFilter.GaussianBlur(14))).astype(float)
    m = np.clip((yy - (ridge[None, :] - 40)) / 40, 0, 1)[..., None]
    sky = sky * (1 - m) + blurred * m
    Image.fromarray(sky.astype(np.uint8)).save(os.path.join(OUT_L, 'sky.png'))

    # Bastian: diferencia con la versión del paisaje que lo incluye
    withb = Image.open(os.path.join(ROOT, 'landscape-bastian.png')).convert('RGB').resize((W, H), Image.LANCZOS)
    wb = np.asarray(withb).astype(float)
    diff = np.abs(wb - a).sum(axis=2)
    wl = wb.mean(axis=2)
    mask = (diff > 60) & (wl < 95)
    mask = ndimage.binary_opening(mask, iterations=1)
    lab, n = ndimage.label(mask)
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    keep = 1 + int(np.argmax(sizes))
    m = ndimage.binary_dilation(lab == keep, iterations=2)
    m = ndimage.binary_fill_holes(m)
    ys, xs = np.where(m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    soft = ndimage.gaussian_filter(m.astype(float), 0.8)
    rgba = np.dstack([wb, np.clip(soft * 255, 0, 255)]).astype(np.uint8)[y0:y1, x0:x1]
    Image.fromarray(rgba, 'RGBA').save(os.path.join(OUT_L, 'bastian.png'))
    print('bastian box (fracciones):', round(x0 / W, 4), round(y0 / H, 4), round((x1 - x0) / W, 4), round((y1 - y0) / H, 4))
    print('ridge min/max (fracción):', round(ridge.min() / H, 3), round(ridge.max() / H, 3))


def silhouettes():
    im = Image.open(os.path.join(ROOT, 'silhouettes.png')).convert('RGB')
    a = np.asarray(im).astype(float)
    lum = a.mean(axis=2)
    ink = lum < 110
    ink = ndimage.binary_closing(ink, iterations=2)
    lab, n = ndimage.label(ink)
    objs = ndimage.find_objects(lab)
    sizes = ndimage.sum(ink, lab, range(1, n + 1))
    big = [i for i in range(n) if sizes[i] > 3000]
    boxes = [(objs[i], i + 1) for i in big]
    # ordenar por filas (y del centro, en bandas) y luego por x
    rowh = im.size[1] / 3
    boxes.sort(key=lambda bi: (int(((bi[0][0].start + bi[0][0].stop) / 2) // rowh), bi[0][1].start))
    for f in os.listdir(OUT_S):
        os.remove(os.path.join(OUT_S, f))
    for k, (sl, idx) in enumerate(boxes):
        m = lab[sl] == idx
        crop = a[sl]
        alpha = ndimage.gaussian_filter(m.astype(float), 0.6) * 255
        rgba = np.dstack([crop, alpha]).astype(np.uint8)
        Image.fromarray(rgba, 'RGBA').save(os.path.join(OUT_S, f'{k + 1:02d}.png'))
    print('siluetas:', len(boxes))


if __name__ == '__main__':
    layers()
    silhouettes()
