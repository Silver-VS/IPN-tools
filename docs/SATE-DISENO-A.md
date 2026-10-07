# SATE: diseño visual, sesión 04, §1–§3a

## 1. Entrega

Rama `codex/sate-diseno-a`. Solo nombres, pestañas y minimapa del presente.
`sate.pestana.horarios.titulo` y `sate.pestana.calendario.titulo` usan «Horarios de
clase» y «Calendario escolar». Los ids, las rutas y los nombres cortos se conservan.
Textos nuevos en `sate.minimapa.*`, versión `2026.10.15`, registrados en
`contenido/CAMBIOS.md`.

El cascarón declara `data-pestanas="v3"` en `<html>`. Cambiarlo a `v1` muestra
ícono y texto. `?pestanas=v1` o `?pestanas=v3` sustituyen la variante para comparar;
un valor desconocido conserva el atributo. La barra usa fondo hundido, selección
elevada, divisor de 1 px, hover y foco visible. v3 añade un punto de acento bajo
la activa. La barra inferior mantiene SVG y etiqueta corta en ambas variantes.
Se respeta movimiento reducido y el área segura del teléfono.

`minimapaCurricular` y `slotFill` se extraen a núcleo. Mapa y el presente comparten
puntos, optativas y leyenda. El presente muestra datos reales, incluso con
simulación o pincel N+1, sin cargar Mapa ni oferta. El minimapa ocupa la esquina
superior derecha; a ≤720 px queda debajo del resumen. El botón nativo abre
`mapa` con clic, toque o Enter. Sin SAES se omite. Las carreras sin trazado usan
sus niveles del mapa SAES. Acreditadas: verde; en curso: guinda; pendientes: gris;
reprobadas: naranja; desfasadas: rojo. «late fail» cuenta como desfasada.

## 2. Verificación sin navegador

| Comando o prueba | Resultado |
|---|---|
| `python tools/compilar_sate.py` | OK: UPIITA, ESCOM, UPIBI, Electivas y Dictamen. |
| `tests/qa_sate.mjs` | OK: 86 contratos y 39 scripts parseados. |
| `tests/qa_sate_router.mjs` | OK: rutas, módulos, grupos e identidad por unidad. |
| `tests/qa_sate_cargas.mjs` | OK: tres unidades, render con/sin SAES, planeación y minimapa compartido. |
| `tests/qa_sate_situacion.mjs` | OK: presente, SAES real con simulación/N+1, minimapa oculto sin datos, clic a Mapa, foco de modal. |
| `tests/qa_sate_desempeno.mjs` | OK: tres unidades, carga diferida, cancelación, error/reintento, DEMO y chip global. |
| `tests/qa_sate_calendario.mjs` | OK: 34 eventos, filtros, meses, teclado, continuidad y detalle. |
| `tests/qa_sate_motor.mjs` | OK: 99 perfiles ficticios; 246 generaciones con resultados (78/87/81). |
| `tests/qa_sate_diseno.mjs` (nueva) | OK: nombres, atributo/URL, SVG, grupos, flechas/Home/End, selección, barra móvil, reglas de foco y posición, contraste de ambos temas y cinco estados. |
| `tests.test_contenido` | OK: 11 pruebas. |
| `tests.test_rutas_mapa` | OK: 2 pruebas. |
| `tests.test_sate` | OK: 2 pruebas. |
| `python tools/contenido.py` | OK: 353 textos válidos. |

Los `.mjs` se ejecutan con `D:\Tools\nodejs\node.exe`. Python se ejecuta mediante
`python tests/qa_sate_python.py`: inicia `python -m unittest -v` con los tres módulos
solicitados y dirige los temporales de los fixtures al worktree. Las advertencias
del motor corresponden a perfiles ficticios incompletos; las de gráficas son
fallas simuladas. No hubo acceso a red.

## 3. Limitaciones y revisión pendiente

El contraste calculado es ≥4.5:1 para texto y ≥3:1 para puntos y foco sobre las
superficies de ambos temas. Las pruebas de DOM en memoria no verifican píxeles,
layout real ni la activación por Enter del navegador: se usa un botón nativo.
Revisar ambas variantes a 375 y 1280 px, temas, teclado y minimapa con/sin DEMO.
No se abrió navegador ni se ejecutaron las pruebas prohibidas. No hay commits,
push ni publicación. El calendario conserva su comportamiento previo.
