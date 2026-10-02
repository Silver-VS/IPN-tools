# Identidad institucional para las páginas de UPIITA_DEV

Resumen de lo que aplica a estas herramientas web, tomado de los documentos vigentes de la
Coordinación de Imagen Institucional (CII) del IPN. Fuente y descargas:
www.ipn.mx/imageninstitucional/identidad-institucional.html

- *Manual de Identidad Gráfica IPN 2026* (v0.6, actualizado 18/09/2026)
- *Manual de Diseño Web Institucional IPN 2025* (y su edición 2025-26)
- Framework y portal gob.mx (colores y tipografía de la barra del Gobierno de México)

## Color

| Uso | Valor | Origen |
|---|---|---|
| Guinda web (principal) | `#750946` | Manual de Diseño Web, paleta principal |
| Guinda logotipo / impresos | Pantone 222 C · `#6F1D46` | Manual de Identidad |
| Gris institucional | Cool Gray 10 C · `#636569` | Ambos manuales |
| Negro / Blanco | `#000000` / `#FFFFFF` | Ambos manuales |
| Secundaria (apoyos, gráficos, estados) | `#5B1237` `#721E45` `#AA325A` `#999999` `#666666` `#F5F5F5` `#F7F0F3` `#EBE5D5` `#DDC9A3` `#A76987` `#8A98C7` `#C4CEE2` `#4D6F8D` `#343254` `#577D63` | Manual de Diseño Web, paleta secundaria (opcional) |
| Barra Gobierno de México | `#611232` (y `#9B2247`, `#3A0B1E`) | framework-gb.cdn.gob.mx |

En las páginas, los tokens están en el bloque `:root` de cada plantilla (`web/*.template.html`).
El modo oscuro deriva los mismos tonos aclarados para mantener contraste.

## Confort visual y accesibilidad (WCAG 2.2, nivel AA)

- Contraste mínimo 4.5:1 en texto y 3:1 en componentes; se verifica con `python tools/contraste.py`
  (claro y oscuro de ambas plantillas, debe terminar en "pares bajo el mínimo: 0").
- Sin negro puro sobre blanco puro: texto `#2B2427` sobre neutros cálidos `#F6F4F5` / `#FEFDFD` (~14:1).
- Modo oscuro alrededor de 12–13.5:1 (más contraste produce halo y fatiga).
- El guinda se usa en acentos, botones principales y la materia elegida; los estados seleccionados de
  pestañas, chips y filtros usan fondo suave con borde guinda, no relleno sólido.
- Colores del mapa (niveles y estados) tomados de la paleta secundaria IPN, con saturación reducida.
- Texto base de 16 px con interlineado 1.5; respeta `prefers-reduced-motion`, `prefers-contrast: more`
  y el modo de colores forzados de Windows; foco visible en todos los controles.

## Estilo visual: Aurora

Estilo elegido (tools/skins.py), inspirado en Vercel Geist / Linear sobre la paleta IPN: neutros zinc,
radios de 12 px, sombras suaves y un brillo muy tenue guinda-oro en la parte superior. Las variantes
Institucional, Laboratorio (IBM Carbon) y Plano técnico siguen disponibles para comparar abriendo la
página con `#estilos`. `python tools/contraste.py` también valida las variantes.

## Tipografía

- **Noto Sans**: obligatoria en todos los materiales (texto y títulos). Se carga desde Google Fonts.
- **Patria**: secundaria, solo para títulos o destacados; no está en Google Fonts (la sirve el framework gob.mx).
- Datos tabulares: Noto Sans Mono (misma familia).
- Menús y etiquetas en mayúsculas y minúsculas, no todo en mayúsculas (Manual web, punto 11).

## Logotipos

- No se redibujan ni se recrean: se usan los archivos oficiales (CII para Educación/SEP e IPN; la unidad para UPIITA).
- Colores solo oficiales; prohibido degradar, sombrear, contornear, deformar o aplicar transparencias.
- Medida mínima digital del escudo: 2 cm. Respetar área de protección y la convivencia Educación (SEP) | IPN.
- Toda inserción con imagen institucional requiere visto bueno del Departamento de Diseño de la CII
  (oficio del director, asunto "Solicitud de Visto bueno", correspondenciacii@ipn.mx).

Por eso hay dos salidas de cada página:

| Salida | Logos | Uso |
|---|---|---|
| `web/horarios.html`, `web/electivas.html` | No | Compartir y probar fuera del servidor oficial; dice "herramienta independiente". |
| `web/dist/*.html` | Encabezado IPN + UPIITA (la pleca Educación (SEP) / IPN al pie se retiró a petición del equipo, 2026-10-01; `FOOTER` en `tools/institucional.py` si se vuelve a requerir) | Versión de trabajo de gestión escolar y la que se hospeda en el servidor de la UPIITA. Logos en `web/dist/assets/logos/` (fuentes en su README). |

Fuentes de los logos: Coordinación de Imagen Institucional (logo IPN horizontal y plecas SEP/IPN) y
upiita.ipn.mx/transparencia/logotipo-institucional (logotipo UPIITA en oro, blanco, gris y negro, más PDF
vectorial). Los originales están en `data/identidad/originales/`.

## Diseño web (Manual de Diseño Web IPN)

- Retícula responsiva de 12 columnas; fondos sólidos detrás de texto; no poner texto sobre patrones.
- Un solo carrusel por página; imágenes en `.webp`, `.jpg` o `.svg` (no `.png`), máximo 200 KB.
- Iconos en SVG o CSS; `alt` descriptivo en todas las imágenes.
- Un solo `H1` por página y jerarquía H1–H6 sin saltos.
- Título de página de 50–60 caracteres con la marca al final; meta descripción de 150–160 caracteres.
- URLs cortas y sin acentos; correos institucionales `@ipn.mx`.
- No usar iframes para PDF ni páginas completas: enlazar directamente.
- Las páginas de las unidades viven en la Plataforma Web Institucional (MODx v3); estas herramientas
  son páginas estáticas que se pueden enlazar desde ella o hospedar en el servidor de la unidad.
