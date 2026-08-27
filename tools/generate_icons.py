"""
Genera los iconos PWA (PNG) y el favicon (SVG) a partir de la imagen de
calculadora que aporto el usuario como referencia (icons/icon-source.png).
No se redibuja nada: cada salida es esa misma imagen reescalada y
centrada sobre un lienzo cuadrado blanco (mas margen en la variante
maskable, como exige el safe-zone de iconos adaptativos de Android/PWA).

Uso: python tools/generate_icons.py
Salida: icons/icon-192.png, icons/icon-512.png, icons/icon-maskable-512.png,
        icons/icon.svg
"""
import base64
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "icons"
SOURCE = OUT / "icon-source.png"

BG = (255, 255, 255, 255)


def fit_on_square(im, size, content_frac):
    """Reescala `im` manteniendo proporcion para que quepa en un cuadro de
    `content_frac * size`, centrado sobre un lienzo cuadrado blanco."""
    target = int(size * content_frac)
    scale = min(target / im.width, target / im.height)
    new_w, new_h = round(im.width * scale), round(im.height * scale)
    resized = im.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), BG)
    canvas.paste(resized, ((size - new_w) // 2, (size - new_h) // 2), resized)
    return canvas


def write_svg(src_path):
    """El favicon es simplemente esta misma imagen envuelta en un <svg>,
    para que escale sin depender de los PNG generados aparte."""
    data = src_path.read_bytes()
    b64 = base64.b64encode(data).decode("ascii")
    with Image.open(src_path) as im:
        w, h = im.size
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">\n'
        f'  <image href="data:image/png;base64,{b64}" x="0" y="0" width="{w}" height="{h}"/>\n'
        f"</svg>\n"
    )
    (OUT / "icon.svg").write_text(svg, encoding="utf-8")
    print(f"  -> icons/icon.svg ({w}x{h} embebido)")


def main():
    src = Image.open(SOURCE).convert("RGBA")

    fit_on_square(src, 512, 0.94).convert("RGB").save(OUT / "icon-512.png")
    print("  -> icons/icon-512.png (512x512)")

    fit_on_square(src, 192, 0.94).convert("RGB").save(OUT / "icon-192.png")
    print("  -> icons/icon-192.png (192x192)")

    # maskable: mas margen de seguridad porque el SO recorta con su propia mascara
    fit_on_square(src, 512, 0.70).convert("RGB").save(OUT / "icon-maskable-512.png")
    print("  -> icons/icon-maskable-512.png (512x512, maskable)")

    write_svg(SOURCE)


if __name__ == "__main__":
    main()
