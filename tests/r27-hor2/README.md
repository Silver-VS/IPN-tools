# R27-HOR2

## 1. Cambios

Se retiró la compensación de zoom por `innerWidth`. Los tokens conservan unidades rem; el ancho máximo y el objetivo táctil del encabezado usan rem. En escritorio con ratón los controles admiten una altura de 2.25rem; en dispositivos táctiles conservan 2.75rem.

Los filtros comparten dos filas en escritorio. La procedencia larga de la oferta queda en «Datos de la oferta». El periodo tiene estado y número explícitos, sin intercambiar las claves de captura ni los horarios guardados. `ofertaPeriodos` en `data/sate.json` debe acompañar futuras actualizaciones de la oferta.

El periodo vigente ofrece «Traer mi horario inscrito» y resta protagonismo a cupos. Sin perfil abre el Lector; con horario importado carga la versión activa, la guarda y muestra confirmación. La barra flotante recibe los mismos nodos de SAES, cuenta, ayuda, opinión y tema; los devuelve al encabezado al subir. Usa nombres completos, cortos y menú según el ancho. Las copias locales sin catálogo de logos usan el isologo local del IPN para evitar errores 404.

## 2. Evidencia

| Prueba | Resultado |
|---|---|
| `qa_r27_hor2.mjs` | 27 escenarios, tres unidades, 1440/1024/768/375, escalas 1/0.9 y 1.1 a 1440; sin errores de consola ni desbordamiento horizontal |
| Interacciones | Limpiar filtros, abrir Lector sin perfil, traer horario ficticio, acciones visibles en barra y menú, tema, Escape y retorno de los nodos al encabezado |
| Fechas | 2026-07-31: próximo; 2026-10-31: actual; 2027-01-25: anterior, para la oferta 27/1 |
| `qa_r27_hor.mjs` | Correcto; incluye parseo de scripts compilados, mapa, eliminación de grupos y exportaciones PDF |
| `pytest -q --basetemp=tests/r27-hor2/pytest-temp` | 196 pruebas y 816 subpruebas correctas; 801 omitidas por las condiciones de la suite |
| Revisión posterior de los módulos afectados | `test_sate.py` y `test_r27_pdf.py`: 22 pruebas y 98 subpruebas correctas |

Las capturas `antes-*` y `despues-*` muestran las mismas unidades y tamaños. `despues-barra-*` y `despues-acciones-*` muestran la barra y su menú. Los JSON conservan las medidas de texto, etiquetas y errores. Los TXT contienen las salidas de las pruebas.

La prueba de escala usa `deviceScaleFactor` y viewport inversamente proporcional, sin CDP ni perfil: mide el ancho físico del texto con `Range × devicePixelRatio`. Comprueba la emulación de zoom solicitada, no una interacción manual con el menú de zoom de Chrome.

## 3. Reproducción y pendientes

Ejecutar desde la raíz `python -m http.server 8080` y, en otra terminal, establecer `PLAYWRIGHT_BROWSERS_PATH=D:/Tools/playwright-browsers` y ejecutar `D:/Tools/nodejs/node.exe tests/qa_r27_hor2.mjs`. El servidor sirve la raíz porque la regresión existente usa `/web/dist/sate/index.html`. Cerrar únicamente el PID de ese servidor.

No hubo descargas, instalaciones, commit, push ni publicación. Falta la revisión visual del dueño y, si se desea confirmar la experiencia física, una comprobación manual del zoom nativo del navegador. No se probaron autenticación real ni datos personales.
