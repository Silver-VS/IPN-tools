# IPN-tools

Herramientas web de apoyo a la reinscripción y a la gestión escolar para alumnos del IPN, nacidas en la
UPIITA. Son páginas estáticas: no hay servidor ni base de datos y todo corre en el navegador del alumno.
Los datos del SAES solo se consultan (lectura) y se quedan en ese navegador.

| Herramienta | Qué hace | Alcance |
|---|---|---|
| **Horarios** (`web/horarios.template.html`) | Mapa curricular y trayectoria, oferta del SAES, armado y generación de horarios, exportación a imagen, PDF y Excel | Trayectoria: UPIITA. Armado de horarios: **cualquier unidad** del IPN (ver [autohospedaje](docs/AUTOHOSPEDAJE.md)) |
| **Ventanilla** (`web/sate/`, `web/tramites/`) | Asistentes de Dictamen y Electivas, con generación de solicitudes PDF | UPIITA |
| **Guía de revisión** (`web/revision.html`) | Instructivo, perfil de demostración y casos de prueba | UPIITA |

Versión de prueba publicada: https://silver-vs.github.io/upiita/

## Construir

Requisitos: Python 3.10+ (`pdfplumber` solo para `tools/salones.py` y los extractores de mapas).

```bash
python tools/build_horarios.py
```

- Salida para compartir sin logos: `web/horarios.html`.
- Salida institucional con logos: `web/dist/` (lo que se publica).
- Con `UPIITA_SITE=https://<tu-sitio>/` se generan además `lector.js` (lector del SAES) y `captura.js`
  (capturador de la oferta), y los marcadores apuntan a ese sitio.

Vista local: `python -m http.server 8080 --directory web`.

## Estructura

```
data/    capturas del SAES, mapas curriculares, seriación, salones, formatos oficiales y logos
tools/   compiladores (build_*.py), capturador y lector del SAES, extractores de PDF
web/     plantillas de las páginas, índice y guía de revisión
docs/    estado técnico (ESTADO.md), identidad gráfica y autohospedaje
```

## Versiones y publicación

Este repositorio guarda el código y las versiones (etiquetas `vX.Y.Z`). Cuando una versión se da por
funcional, se publica en https://silver-vs.github.io/upiita/ con `tools/publicar.sh` (copia `web/dist/`,
`web/index.html` y `web/revision.html` al repositorio del sitio).

## Aviso

Herramienta independiente hecha por un alumno; no sustituye al SAES ni a la información oficial de
Gestión Escolar. La inscripción se realiza únicamente en el SAES.

Autor: Víctor Serrano, Ingeniería Biónica, UPIITA-IPN. Basado en el trabajo de trayectorias compartido por el
Prof. Juan Carlos Guzmán Salgado (julio de 2024).
