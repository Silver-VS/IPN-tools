# SATE: corte de la etapa 5

## 1. Entrega

Desempeño tiene panel propio `sate-desempeno` y se registra con `SATE.pestana`.
El enrutador descarga `desempeno.js` al abrir la pestaña, sin cargar Mapa ni oferta.
El módulo reúne `kstats`, render de metas y observaciones, gráficas y eventos de
simulación. La simulación de fin de semestre queda en un desplegable cerrado.
Sin perfil ofrece el Lector y la demostración existente. Está habilitado en
UPIITA, ESCOM y UPIBI conforme al catálogo.

Los cálculos compartidos permanecen en núcleo, sin segunda implementación.
Situación sigue usando `situacionDatos` con datos reales y conserva el escenario.
Mapa conserva las comparaciones por bloque y las sugeridas, sin controles del
simulador ni estadísticas. El chip global «Simulación activa» contempla tanto el
interruptor como las comparaciones por bloque; «Quitar» apaga ambos, conserva las
calificaciones del escenario y vuelve a pintar la pestaña actual. No cambia el SAES.

D3 7.9.0 y Observable Plot 0.6.17 se solicitan secuencialmente desde Desempeño
cuando hay calificaciones para graficar. Se conservan SRI y carga única. No hay
referencias a estas bibliotecas en los scripts iniciales ni precarga en el HTML.
Salir antes del render diferido impide iniciar la descarga; salir durante la carga
invalida el render pendiente. Una falla muestra el mensaje y registra unidad,
ruta, URL e integridad; un siguiente render puede reintentar.

Los textos nuevos y los controles trasladados están en `sate.desempeno.*`, versión
`2026.10.8`, con cuenta de materias en plural ICU y registro en `contenido/CAMBIOS.md`.
El doble de `SATE.texto` del motor usa los textos generados y resuelve plurales.

## 2. Pruebas sin navegador

Compilación final: `python tools/compilar_sate.py`, que genera las tres unidades,
Electivas y Dictamen. Comandos ejecutados después de los cambios:

| Prueba | Resultado |
|---|---|
| `tests/qa_sate.mjs` | 80 contratos y 37 scripts parseados, incluidos el ámbito global conjunto y Dictamen. |
| `tests/qa_sate_router.mjs` | Ciclo de módulos, Desempeño sin oferta/Mapa, panel propio, rutas, hashes e identidad correctos. |
| `tests/qa_sate_cargas.mjs` | Mapa con/sin perfil y módulos diferidos correctos en las tres unidades. |
| `tests/qa_sate_situacion.mjs` | Datos reales con simulación, cifras, chips, calendario y foco correctos. |
| `tests/qa_sate_desempeno.mjs` | HTML/JS generado sin precarga de Plot/D3; carga diferida única, cancelación, error/reintento, DEMO, plurales y chip global correctos en las tres unidades. |
| `tests/qa_sate_motor.mjs` | 33 perfiles por unidad, 246 generaciones con resultados (78/87/81); invariantes correctas, salida 0. |
| `tests.test_contenido` | 11 pruebas, OK. |
| `tests.test_rutas_mapa` | 2 pruebas, OK. |
| `tests.test_sate` | 2 pruebas, OK. |
| `python tools/contenido.py` | 287 textos válidos. |

`python tests/qa_sate_python.py` ejecuta `python -m unittest -v` con los tres
módulos solicitados y dirige todos los temporales al worktree, nunca a `%TEMP%`.
Los avisos de biblioteca no disponible en la prueba nueva son fallas simuladas,
sin acceso a red. Los avisos de cobertura del motor proceden de perfiles ficticios
deliberadamente incompletos. No se ejecutaron las pruebas que abren Chrome.

## 3. Peso del primer pintado

Bytes UTF-8 locales sin comprimir, entrada directa con caché vacía. La base suma
HTML (con CSS y catálogo de textos), núcleo, inicio, rutas, componentes y datos
de núcleo. Mapa y Horarios añaden oferta y su módulo; Desempeño añade solamente
su módulo; Situación añade su módulo; Ventanilla añade datos de trámites.

| Unidad | Base | Situación | Mapa | Horarios | Desempeño | Ventanilla |
|---|---:|---:|---:|---:|---:|---:|
| UPIITA | 328745 | 336977 | 505309 | 542965 | 361889 | 331807 |
| ESCOM | 310945 | No habilitada | 430998 | 468654 | 344089 | No habilitada |
| UPIBI | 368362 | No habilitada | 480723 | 518379 | 401506 | No habilitada |

No se incluyen imágenes, fuentes ni transferencias CDN de D3/Plot: estas últimas
se requieren al graficar en Desempeño y no se midieron por la restricción sin red.
No es una medición de tiempo ni del peso total transferido al graficar. El
presupuesto previo de 160000 bytes sigue sin cumplirse.

## 4. Revisión pendiente del orquestador

Abrir las tres unidades con/sin DEMO a 375 y 1280 px, claro/oscuro y teclado.
Comprobar KPI, metas, kárdex, áreas, observaciones y desplegable inicialmente
cerrado; resultados y calificaciones simuladas; persistencia al navegar y recargar;
chip global y Quitar desde cada pestaña; Situación siempre real y Mapa sin
duplicados. En la pestaña Red comprobar cero solicitudes D3/Plot antes de abrir
Desempeño, una carga al graficar, consola, tooltips y respuesta sin conexión.

No se abrió navegador, no se usó red y no hay validación visual en este corte.
No se hicieron commits, push ni publicación.
