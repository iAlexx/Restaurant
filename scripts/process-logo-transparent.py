"""Remove outer black canvas from restaurant logo; preserve logo design."""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(
    r"C:\Users\Master aLEX\.cursor\projects\c-Users-Master-aLEX-Desktop-Restaurant\assets\c__Users_Master_aLEX_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_______3-dede51ba-baa6-4c97-8547-94e376e42636.png"
)
OUT_DIR = ROOT / "public" / "images"
OUT_PNG = OUT_DIR / "restaurant-logo-transparent.png"
OUT_WEBP = OUT_DIR / "restaurant-logo-transparent.webp"

BLACK_THRESHOLD = 42
SAFE_MARGIN_PX = 12


def is_removable_black(r: int, g: int, b: int, a: int) -> bool:
    if a == 0:
        return True
    return r <= BLACK_THRESHOLD and g <= BLACK_THRESHOLD and b <= BLACK_THRESHOLD


def flood_remove_corner_black(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    visited = [[False] * width for _ in range(height)]
    queue: deque[tuple[int, int]] = deque()

    for x, y in (
        (0, 0),
        (width - 1, 0),
        (0, height - 1),
        (width - 1, height - 1),
    ):
        r, g, b, a = pixels[x, y]
        if is_removable_black(r, g, b, a):
            queue.append((x, y))
            visited[y][x] = True

    while queue:
        x, y = queue.popleft()
        pixels[x, y] = (0, 0, 0, 0)

        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if nx < 0 or ny < 0 or nx >= width or ny >= height:
                continue
            if visited[ny][nx]:
                continue
            r, g, b, a = pixels[nx, ny]
            if is_removable_black(r, g, b, a):
                visited[ny][nx] = True
                queue.append((nx, ny))

    return rgba


def trim_with_margin(img: Image.Image, margin: int) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img

    left, top, right, bottom = bbox
    width, height = img.size
    left = max(0, left - margin)
    top = max(0, top - margin)
    right = min(width, right + margin)
    bottom = min(height, bottom + margin)
    return img.crop((left, top, right, bottom))


def corners_transparent(img: Image.Image) -> bool:
    w, h = img.size
    corners = ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))
    return all(img.getpixel(c)[3] == 0 for c in corners)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    source = SOURCE if SOURCE.exists() else ROOT / "public" / "images" / "restaurant-logo.webp"
    img = Image.open(source)
    original_size = img.size

    processed = flood_remove_corner_black(img)
    trimmed = trim_with_margin(processed, SAFE_MARGIN_PX)

    trimmed.save(OUT_PNG, format="PNG", optimize=True)
    trimmed.save(OUT_WEBP, format="WEBP", lossless=True, method=6)

    print(f"source: {source}")
    print(f"original: {original_size[0]}x{original_size[1]}")
    print(f"trimmed: {trimmed.size[0]}x{trimmed.size[1]}")
    print(f"png: {OUT_PNG} ({OUT_PNG.stat().st_size} bytes)")
    print(f"webp: {OUT_WEBP} ({OUT_WEBP.stat().st_size} bytes)")
    print(f"corners_transparent: {corners_transparent(trimmed)}")

    # Spot-check internal logo black (beard area) still opaque
    cx = trimmed.size[0] // 2
    cy = trimmed.size[1] // 3
    sample = trimmed.getpixel((cx, cy))
    print(f"center_upper_pixel_rgba: {sample}")


if __name__ == "__main__":
    main()
