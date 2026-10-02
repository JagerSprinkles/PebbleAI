"""Build PebbleAI-Plus pixel app icons.

Color master: 48x48 (store/app). 144 is 3x nearest-neighbor.
Menu icon: 25x25 black and white (Pebble IMAGE_MENU_ICON limit).
"""
from pathlib import Path

from PIL import Image

# Color palette (48 / 144)
T = (0, 0, 0, 0)
OUT = (8, 55, 50, 255)
BODY = (16, 163, 127, 255)
BODY2 = (12, 120, 95, 255)
HL = (120, 230, 200, 255)
EYE = (255, 255, 255, 255)
PUP = (15, 23, 32, 255)
MOUTH = (8, 55, 50, 255)
ANT = (16, 163, 127, 255)
PLUS = (255, 196, 64, 255)

# Menu palette (1-bit style)
BLACK = (0, 0, 0, 255)
WHITE = (255, 255, 255, 255)

SIZE = 48
MENU = 25


def put(px, size: int, x: int, y: int, color) -> None:
    if 0 <= x < size and 0 <= y < size:
        px[x, y] = color


def fill_rect(px, size: int, x0: int, y0: int, x1: int, y1: int, color) -> None:
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            put(px, size, x, y, color)


def fill_circle(px, size: int, cx: int, cy: int, r: int, color) -> None:
    r2 = r * r
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r2:
                put(px, size, x, y, color)


def stroke_circle(px, size: int, cx: int, cy: int, r: int, color) -> None:
    for y in range(cy - r - 1, cy + r + 2):
        for x in range(cx - r - 1, cx + r + 2):
            d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy)
            if (r - 0.6) ** 2 <= d2 <= (r + 0.6) ** 2:
                put(px, size, x, y, color)


def draw_plus(px, size: int, cx: int, cy: int, arm: int, thick: int, color) -> None:
    t = thick // 2
    fill_rect(px, size, cx - t, cy - arm, cx + t, cy + arm, color)
    fill_rect(px, size, cx - arm, cy - t, cx + arm, cy + t, color)


def build_master() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), T)
    px = img.load()
    s = SIZE

    cx, cy = 23, 24
    r = 16

    fill_rect(px, s, cx - 1, 2, cx + 1, 7, OUT)
    fill_circle(px, s, cx, 3, 2, ANT)
    put(px, s, cx, 3, HL)

    fill_circle(px, s, cx, cy, r, BODY)
    for y in range(cy + 4, cy + r):
        for x in range(cx - r, cx + r + 1):
            if (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r:
                put(px, s, x, y, BODY2)
    for y in range(cy - r, cy - 4):
        for x in range(cx - r, cx + 2):
            if (x - cx) * (x - cx) + (y - cy) * (y - cy) <= (r - 2) * (r - 2):
                if (x - cx) * (x - cx) + (y - (cy - 6)) * (y - (cy - 6)) <= 64:
                    put(px, s, x, y, HL)

    stroke_circle(px, s, cx, cy, r, OUT)
    stroke_circle(px, s, cx, cy, r - 1, OUT)

    fill_rect(px, s, cx - 4, cy + r - 1, cx + 4, cy + r + 3, OUT)
    fill_rect(px, s, cx - 3, cy + r, cx + 3, cy + r + 2, BODY2)

    fill_rect(px, s, cx - 9, cy - 4, cx - 4, cy + 1, EYE)
    fill_rect(px, s, cx - 8, cy - 5, cx - 5, cy + 2, EYE)
    fill_rect(px, s, cx - 7, cy - 3, cx - 6, cy, PUP)
    fill_rect(px, s, cx + 4, cy - 4, cx + 9, cy + 1, EYE)
    fill_rect(px, s, cx + 5, cy - 5, cx + 8, cy + 2, EYE)
    fill_rect(px, s, cx + 6, cy - 3, cx + 7, cy, PUP)

    fill_rect(px, s, cx - 5, cy + 6, cx + 5, cy + 7, MOUTH)
    put(px, s, cx - 6, cy + 5, MOUTH)
    put(px, s, cx + 6, cy + 5, MOUTH)

    draw_plus(px, s, 41, 41, 4, 3, PLUS)
    return img


def build_menu_icon() -> Image.Image:
    """25x25 B/W bot. Round head with 2px-thick lines."""
    img = Image.new("RGBA", (MENU, MENU), T)
    px = img.load()
    s = MENU

    cx, cy, r = 11, 11, 10

    # Solid 2px outline: black disc, then white inner disc
    fill_circle(px, s, cx, cy, r, BLACK)
    fill_circle(px, s, cx, cy, r - 2, WHITE)

    # Antenna (2px wide)
    fill_rect(px, s, cx - 1, 0, cx, 1, BLACK)

    # Eyes (2x2)
    fill_rect(px, s, cx - 5, cy - 2, cx - 4, cy - 1, BLACK)
    fill_rect(px, s, cx + 4, cy - 2, cx + 5, cy - 1, BLACK)

    # Mouth (2px tall)
    fill_rect(px, s, cx - 3, cy + 2, cx + 3, cy + 3, BLACK)

    # Neck (2px tall)
    fill_rect(px, s, cx - 4, cy + r, cx + 4, cy + r + 1, BLACK)

    # Plus cross — 2px thick, bottom-right
    fill_rect(px, s, 20, 19, 21, 23, BLACK)
    fill_rect(px, s, 18, 20, 23, 21, BLACK)

    return img


def scale_nn(src: Image.Image, size: int) -> Image.Image:
    return src.resize((size, size), Image.NEAREST)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    out_dir = root / "resources" / "images"
    out_dir.mkdir(parents=True, exist_ok=True)

    master = build_master()
    master.save(out_dir / "icon_48.png", "PNG")
    print(f"wrote {out_dir / 'icon_48.png'}")

    out_144 = scale_nn(master, 144)
    out_144.save(out_dir / "icon_144.png", "PNG")
    print(f"wrote {out_dir / 'icon_144.png'}")

    menu = build_menu_icon()
    menu.save(out_dir / "icon_menu_25.png", "PNG")
    print(f"wrote {out_dir / 'icon_menu_25.png'}")


if __name__ == "__main__":
    main()
