"""Verifica el contraste (WCAG 2.2) de los pares de color de las plantillas, en tema claro y oscuro.

Uso:  python tools/contraste.py
Mínimos: 4.5:1 texto normal (AA), 3:1 texto grande y componentes de interfaz (AA, 1.4.11).
"""
import re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
# (texto, fondo, mínimo, descripción)
PAIRS = [
    ("--fg", "--bg", 4.5, "texto / fondo"), ("--fg", "--surface", 4.5, "texto / tarjeta"), ("--fg", "--sunken", 4.5, "texto / bloque hundido"),
    ("--muted", "--surface", 4.5, "texto secundario / tarjeta"), ("--muted", "--bg", 4.5, "texto secundario / fondo"), ("--muted", "--sunken", 4.5, "texto secundario / bloque"),
    ("--accent", "--surface", 4.5, "enlace o acento / tarjeta"), ("--accent", "--bg", 4.5, "enlace o acento / fondo"),
    ("--accent-fg", "--accent", 4.5, "texto en botón principal"), ("--accent", "--accent-soft", 4.5, "acento / fondo suave"),
    ("--ok", "--ok-soft", 4.5, "aviso correcto"), ("--warn", "--warn-soft", 4.5, "advertencia"), ("--bad", "--bad-soft", 4.5, "error"),
    ("--ok", "--surface", 4.5, "verde / tarjeta"), ("--bad", "--surface", 4.5, "rojo / tarjeta"),
    ("--line", "--surface", 1.3, "bordes (decorativo)"),
]


def lum(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def tokens(block):
    return dict(re.findall(r"(--[\w-]+):\s*(#[0-9a-fA-F]{6})", block))


def check(path):
    s = pathlib.Path(path).read_text(encoding="utf-8")
    light = tokens(s.split("@media (prefers-color-scheme: dark)")[0])
    dark = {**light, **tokens(re.search(r":root\[data-theme=\"dark\"\]\{(.*?)\}", s, re.S).group(1))}
    bad = 0
    for name, t in (("claro", light), ("oscuro", dark)):
        for a, b, mn, d in PAIRS:
            if a in t and b in t:
                r = ratio(t[a], t[b])
                ok = r >= mn
                bad += not ok
                print(f"  {'OK ' if ok else 'BAJO'} {name:6} {r:5.2f}:1 (mín {mn}) {d}  {t[a]} sobre {t[b]}")
    return bad


if __name__ == "__main__":
    total = 0
    for f in sorted((ROOT / "web").glob("*.template.html")):
        print(f.name)
        total += check(f)
    print("pares bajo el mínimo:", total)
