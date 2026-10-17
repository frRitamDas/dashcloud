"""Procedurally renders public/logo.png (512x512) so the repo never needs a binary asset.
Regenerate with: python3 scripts/gen-logo.py
Drop your own artwork over public/logo.png at any time - the app prefers the file if present."""
import math, struct, zlib, os

S = 512
PAD = 24
R = 118

def lerp(a, b, t): return a + (b - a) * t
def clamp(v, lo=0.0, hi=1.0): return max(lo, min(hi, v))
def mix(c1, c2, t): return tuple(lerp(c1[i], c2[i], t) for i in range(3))

def sd_round_box(px, py, cx, cy, hw, hh, r):
    dx = abs(px - cx) - hw + r
    dy = abs(py - cy) - hh + r
    ax, ay = max(dx, 0.0), max(dy, 0.0)
    return math.hypot(ax, ay) + min(max(dx, dy), 0.0) - r

def sd_poly(px, py, pts):
    n = len(pts)
    area = sum(pts[i][0] * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * pts[i][1] for i in range(n))
    sgn = 1.0 if area > 0 else -1.0
    d = -1e9
    for i in range(n):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % n]
        ex, ey = x2 - x1, y2 - y1
        length = math.hypot(ex, ey) or 1.0
        nx, ny = sgn * ey / length, -sgn * ex / length
        d = max(d, (px - x1) * nx + (py - y1) * ny)
    return d

def aa(d, w=1.6): return clamp(0.5 - d / w)

INK = (8, 10, 17)
INK_TOP = (26, 32, 56)
BRAND = (109, 92, 255)
CYAN = (34, 211, 238)
WHITE = (255, 255, 255)

TRI_MAIN = [(176, 152), (176, 360), (396, 256)]
TRI_INNER = [(216, 198), (216, 314), (350, 256)]
BOLT = [(232, 128), (188, 268), (238, 262), (206, 392), (330, 236), (268, 244)]

rows = []
for y in range(S):
    row = bytearray()
    for x in range(S):
        px, py = x + 0.5, y + 0.5
        tile = sd_round_box(px, py, S / 2, S / 2, S / 2 - PAD, S / 2 - PAD, R)
        a_tile = aa(tile)
        if a_tile <= 0.001:
            row += bytes((0, 0, 0, 0))
            continue

        t_vert = clamp((py - PAD) / (S - 2 * PAD))
        base = mix(INK_TOP, INK, t_vert)
        glow = math.exp(-((px - 380) ** 2 + (py - 380) ** 2) / (2 * 190 ** 2))
        base = mix(base, BRAND, clamp(glow * 0.55))
        glow2 = math.exp(-((px - 130) ** 2 + (py - 120) ** 2) / (2 * 170 ** 2))
        base = mix(base, CYAN, clamp(glow2 * 0.22))

        rim = aa(abs(tile + 2.2) - 2.2, 2.0)
        base = mix(base, mix(BRAND, CYAN, clamp((px + py) / S)), rim * 0.85)

        d_main = sd_poly(px, py, TRI_MAIN)

        grad_t = clamp((px - 160) / 240)
        a_main = aa(d_main)
        halo = clamp(math.exp(-(max(d_main, 0.0) ** 2) / (2 * 18 ** 2)) * (1 - aa(-d_main)), 0, 1)
        base = mix(base, mix(BRAND, CYAN, grad_t), halo * 0.55)
        mark = mix(WHITE, mix(BRAND, CYAN, grad_t), 0.22 + 0.35 * clamp((px - 200) / 190))
        base = mix(base, mark, a_main)

        sheen = clamp(1.0 - (py - PAD) / 190) ** 2 * 0.10
        base = mix(base, WHITE, sheen * a_tile)

        r, g, b = (int(clamp(c, 0, 255)) for c in base)
        row += bytes((r, g, b, int(255 * a_tile)))
    rows.append(bytes((0,)) + bytes(row))

raw = b"".join(rows)

def chunk(tag, data):
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

png = b"\x89PNG\r\n\x1a\n"
png += chunk(b"IHDR", struct.pack(">IIBBBBB", S, S, 8, 6, 0, 0, 0))
png += chunk(b"IDAT", zlib.compress(raw, 9))
png += chunk(b"IEND", b"")

out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "logo.png")
with open(out, "wb") as f:
    f.write(png)
print("wrote", out, len(png), "bytes")
