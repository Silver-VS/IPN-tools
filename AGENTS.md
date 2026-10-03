# Instrucciones para agentes de IA (IPN-tools)

Lee este archivo completo antes de cambiar algo. Varios agentes (Claude, ChatGPT/Codex) trabajan en este
repositorio en momentos distintos; el dueño es Víctor Serrano (Silver-VS), alumno de Ingeniería Biónica de la
UPIITA-IPN. Comunícate con él en **español**.

## Qué es

Herramientas web estáticas de libre acceso para el alumnado del IPN (sin servidor ni base de datos):

- **Horarios** (`web/horarios.template.html`): mapa curricular, trayectoria con datos del SAES, minimapa de avance,
  simulación de fin de semestre, estadísticas y análisis, oferta del SAES y armado/generación de horarios.
  Unidades: UPIITA (`horarios.html`), ESCOM (`horarios-escom.html`, `UNIDAD=escom`) y UPIBI (`horarios-upibi.html`, `UNIDAD=upibi`).
- **Electivas** (`web/electivas.template.html`): DIE-03 por modalidad y formulario (solo UPIITA).
- **Lector** (`tools/lector_saes.js`): marcador que lee el SAES del alumno (solo lectura) en cualquier unidad.
- **Capturador** (`tools/captura_saes.js`): oferta y mapa curricular del SAES de cualquier unidad.
- **Cuenta** (`tools/cuenta.py`): perfil `ipnt` 1 (docs/FORMATO-PERFIL.md) sincronizado en OneDrive o Google Drive
  del propio alumno; respaldo en archivo; bienvenida por unidad.

Sitio en vivo: https://silver-vs.github.io/upiita/ (se publica desde el repositorio `Silver-VS/Silver-VS.github.io`).

## Reglas (no negociables)

1. **Trabaja en una rama** (`codex/<tema>`), nunca directo en `main`. **No publiques** al sitio ni ejecutes
   `tools/publicar.sh`, no crees etiquetas ni releases: el dueño o Claude revisan y publican.
2. **Datos personales:** nunca escribas en el repositorio, en `web/` ni en `docs/` datos reales de alumnos (boletas,
   nombres, kárdex). Si el dueño te pasa datos para probar, úsalos solo en memoria o en el navegador y no los
   guardes. Para pruebas usa el perfil ficticio de `web/revision.html` (`DEMO`) o crea uno ficticio.
3. **SAES:** solo lectura. Nunca automatices inscripciones, trámites ni envíos. No pidas ni uses contraseñas.
4. **Logos institucionales:** solo en la versión publicada (`web/dist`, encabezado de `tools/institucional.py`).
5. **Archivos ignorados** (`.gitignore`): `programas/`, `ESCOM/`, `UPIBI/`, `docs/presentacion/`,
   `docs/consulta-carga.md`, `docs/propuesta-planeacion-anual.md`, salidas `web/*.html` y `web/dist/`. No los subas.
6. Redacción en español, profesional; términos del IPN («unidad académica», «alumnado», «UPIITA-IPN»).

## Compilar y probar

```bash
export UPIITA_SITE=https://silver-vs.github.io/upiita/
python tools/build_horarios.py              # UPIITA -> web/dist/horarios.html (+ index, legales, íconos)
UNIDAD=escom python tools/build_horarios.py # ESCOM  -> web/dist/horarios-escom.html
python tools/build_electivas.py
python -m http.server 8080 --directory web  # http://localhost:8080/dist/horarios.html
```

Comprobación mínima tras cada cambio: compila sin errores, los `<script>` de `web/dist/*.html` se parsean
(p. ej. `node -e "new Function(src)"` por bloque) y la página carga sin errores en consola. Prueba con y sin datos
del SAES (perfil ficticio en `localStorage['saes.alumno']`), en la UPIITA y en la ESCOM, y a ancho de teléfono.

Cuidado al editar con scripts de Python: secuencias como `\b`, `\1` dentro de cadenas normales se convierten en
caracteres de control; usa cadenas crudas (`r"..."`) o el editor.

## Mapa del código

| Ruta | Contenido |
|---|---|
| `web/horarios.template.html` | Toda la lógica de Horarios (HTML+CSS+JS en un archivo). Datos inyectados en `const DATA=` |
| `tools/build_horarios.py` | Compila Horarios; `UNIDAD` elige `data/unidades/<u>/`; `layout_de` (trazado del PDF) y `layout_por_areas` (columnas por categoría, un renglón por semestre, flechas con pistas propias y reducción transitiva; prueba en `tests/test_rutas_mapa.py`) |
| `tools/cuenta.py`, `tools/saes.py`, `tools/skins.py`, `tools/institucional.py` | Módulos inyectados (cuenta, Lector, tema, encabezado) |
| `data/` | UPIITA: oferta, mapa curricular, trayectorias, seriación, especialidades, salones, formatos DIE |
| `data/categorias.json` | Catálogo común de categorías (áreas de conocimiento) para todas las carreras |
| `data/unidades/escom/` | ESCOM: oferta, mapa curricular, trayectorias extraídas, `areas_<c>.json`, `optativas.json` |
| `data/unidades/upibi/` | UPIBI: oferta y mapa del SAES, 6 trayectorias por carrera/plan, áreas y optativas; contexto en `docs/handoff-upibi/` |
| `tools/extract_mapa*.py`, `tools/categorias_escom.py`, `tools/optativas_escom.py` | Extracción de PDFs y clasificación |
| `docs/` | ESTADO, AUTOHOSPEDAJE, FORMATO-PERFIL, CUENTA-ENTRA/GOOGLE, SAES-UNIDADES, CATEGORIAS-ESCOM, ANALISIS-ACADEMICO |

Almacenamiento del navegador: claves `hu.*` (UPIITA), `hu.<unidad>.*` (otras), `ue.*` (Electivas),
`saes.alumno` (datos del Lector, con campo `unidad`), `ipnt.*` (cuenta). Toda escritura pasa por `IPNT.set`.

## Estado (2026-10-03) y pendientes

Publicado: v1.2.0 + cambios posteriores (categorías, minimapa y enfoque, estadísticas con Observable Plot,
simulación ampliada, análisis) + rama `codex/upibi` (UPIBI, analítica etapas A–C, meta de créditos, nuevo trazado de
flechas en mapas por áreas). Pendientes, en orden sugerido:

1. **UPIBI:** integrada y publicada (2026-10-03). Pendientes en `docs/handoff-upibi/HANDOFF-CLAUDE-UPIBI.md`:
   equivalencias entre planes (sin integrar), etapa D de analítica, discrepancias PDF/SAES (B706) y aclaraciones
   institucionales (E739/F101, duración normativa).
2. **IIA y LCD (ESCOM):** confirmar si las filas de sus tablas de optativas son seriaciones 6.º → 7.º; si sí,
   agregarlas en `tools/optativas_escom.py` (`req`).
3. **Propuestas de `docs/ANALISIS-ACADEMICO.md`:** probabilidad de desfase, comparar escenarios de simulación,
   carga recomendada por periodo, alerta de baja por tiempo.
4. **Revisión de categorías** de `docs/CATEGORIAS-ESCOM.md` con academias.
5. Cuentas: avisos controlados por `data/cuenta.json` (`institucionalPendiente`, `googlePrueba`); cambiar a
   `false` cuando TI del IPN autorice la app o Google apruebe la marca.

Al terminar un trabajo: commits pequeños y descriptivos en tu rama, `git push`, y un resumen para el dueño con
qué cambió, cómo se probó y qué falta. No modifiques `/upiita` del repositorio del sitio.
