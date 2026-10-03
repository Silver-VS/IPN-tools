"""Versión institucional (para hospedar en el servidor de la UPIITA) de las páginas generadas.

La versión que se comparte fuera del servidor oficial no lleva logotipos institucionales.
La versión institucional agrega el encabezado con las firmas Educación (SEP) / IPN y el nombre de la
unidad, según el Manual de Identidad Gráfica IPN 2026 (convivencia SEP/IPN, área de protección,
medida mínima digital de 2 cm) y el Manual de Diseño Web IPN 2025 (título "| IPN").
Los archivos de logotipo NO se incluyen: deben ser los oficiales que entrega la Coordinación de
Imagen Institucional (www.ipn.mx/imageninstitucional/identidad-institucional.html) y la propia unidad.
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "web" / "dist"

HEADER = """<style>
.inst{background:var(--surface);border-bottom:3px solid var(--accent);padding-inline:16px}
.inst-in{max-width:1480px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:12px 28px;padding-block:12px}
.inst-in img{height:80px;width:auto;display:block}
.inst-in .unit img{height:72px}
.inst-in .unit{margin-left:auto}
/* versión del logo según el tema (sistema o selector claro/oscuro de la página) */
.inst .logo-dk{display:none}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .inst .logo-dk{display:block}:root:not([data-theme="light"]) .inst .logo-lt{display:none}}
:root[data-theme="dark"] .inst .logo-dk{display:block}:root[data-theme="dark"] .inst .logo-lt{display:none}
.inst-name{max-width:1480px;margin:0 auto;padding-block:0 10px;font:600 .95rem "Noto Sans",system-ui,sans-serif;color:var(--fg)}
.inst-foot{background:#fff;margin-top:40px;border-top:1px solid var(--line)}
.inst-foot img{display:block;width:min(1100px,100%);height:auto;margin:0 auto}
@media (max-width:640px){.inst-in{flex-wrap:nowrap;gap:10px}.inst-in img{height:76px}.inst-in .unit img{height:44px}.inst-in .unit{margin-left:auto}.inst-name{font-size:.78rem;font-weight:500}}
@media (max-height:520px) and (orientation:landscape){.inst-in{padding-block:6px}.inst-in img{height:76px}.inst-in .unit img{height:44px}.inst-name{display:none}}
</style>
<header class="inst" role="banner">
  <div class="inst-in">
    <span><img class="logo-lt" src="assets/logos/ipn-horizontal-guinda.webp" alt="Instituto Politécnico Nacional. La Técnica al Servicio de la Patria" width="264" height="80"><img class="logo-dk" src="assets/logos/ipn-horizontal-calado.webp" alt="Instituto Politécnico Nacional. La Técnica al Servicio de la Patria" width="264" height="80"></span>
    <a class="unit" href="https://www.upiita.ipn.mx/"><img class="logo-lt" src="assets/logos/upiita-oro.webp" alt="UPIITA, inicio del sitio de la unidad" width="91" height="72"><img class="logo-dk" src="assets/logos/upiita-blanco.webp" alt="UPIITA, inicio del sitio de la unidad" width="91" height="72"></a>
  </div>
  <div class="inst-name">Unidad Profesional Interdisciplinaria en Ingeniería y Tecnologías Avanzadas</div>
</header>"""

FOOTER = """<footer class="inst-foot" role="contentinfo"><img src="assets/logos/pleca-horizontal.webp" alt="Educación, Secretaría de Educación Pública. Instituto Politécnico Nacional" width="1600" height="269" loading="lazy"></footer>"""

README = """# Logotipos oficiales

| Archivo | Fuente |
|---|---|
| `ipn-horizontal-guinda.webp`, `ipn-horizontal-calado.webp` | Coordinación de Imagen Institucional, carpeta "Logotipo IPN / Logo Horizontal" (convertidos de PNG a WebP) |
| `pleca-horizontal.webp` | CII, "Plecas SEP IPN / PNG Sin leyenda PEF" (Plecas 2026 V.0.4-02) |
| `upiita-oro.webp`, `upiita-blanco.webp`, `upiita-gris.webp`, `upiita-negro.webp` | upiita.ipn.mx/transparencia/logotipo-institucional (convertidos a WebP) |
| `upiita-30-color.webp`, `upiita-30-blanco.webp` | CII, logos de 30 aniversario de la UPIITA (uso temporal, con vigencia) |

Originales (PNG/PDF/AI) en `data/identidad/originales/`, fuera de lo que se publica.

Reglas del Manual de Identidad Gráfica IPN 2026:
- Solo colores oficiales; sin degradados, sombras, contornos ni transparencias. No deformar.
- Medida mínima digital del escudo: 2 cm. Respetar área de protección y la convivencia Educación (SEP) | IPN.
- Toda inserción con imagen institucional requiere visto bueno del Departamento de Diseño de la
  Coordinación de Imagen Institucional (oficio del director, asunto "Solicitud de Visto bueno", correspondenciacii@ipn.mx).
"""


def write_dist(name, html, title_suffix=" | UPIITA IPN"):
    """Escribe web/dist/<name>.html con el encabezado institucional y el título del sitio."""
    DIST.mkdir(parents=True, exist_ok=True)
    logos = DIST / "assets" / "logos"
    logos.mkdir(parents=True, exist_ok=True)
    (logos / "README.md").write_text(README, encoding="utf-8")
    html = html.replace("<!--__INST_HEADER__-->", HEADER, 1)
    # pleca SEP | IPN al pie: retirada a petición del equipo (2026-10-01); FOOTER se conserva por si se vuelve a requerir
    # "Horarios UPIITA" -> "Horarios | UPIITA IPN" (manual web: nombre de la marca al final del título)
    html = re.sub(r"<title>([^<]+)</title>", lambda m: f"<title>{re.sub(r'\s*UPIITA$', '', m.group(1))}{title_suffix}</title>", html, count=1)
    if not html.lstrip().lower().startswith("<!doctype"):
        # las plantillas omiten <html>/<head>/<body> (el navegador los infiere); aquí se fija idioma y viewport
        html = '<!doctype html>\n<html lang="es">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n' + html
    html = html.replace("</title>", '</title>\n<link rel="icon" href="assets/icono/favicon.ico">', 1)   # ícono de la app (docs/marca)
    out = DIST / f"{name}.html"
    out.write_text(html, encoding="utf-8")
    return out
