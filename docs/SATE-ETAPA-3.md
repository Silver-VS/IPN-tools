# SATE: corte de la etapa 3

## 1. Estructura y compatibilidad

`tools/build_sate.py` conserva la construcción de datos del compilador anterior;
`tools/build_horarios.py` queda como envoltura compatible. La fuente activa es
`web/sate/cascaron.html` y los scripts clásicos `nucleo.js`, `mapa.js`, `horarios.js`,
`inicio.js`, `rutas.js`, `desempeno.js` y `exportacion.js`. `web/horarios.template.html` queda como referencia histórica;
las pruebas de funciones ahora leen el núcleo nuevo.

La salida tiene una sola entrada, `web/dist/sate/index.html`, y datos en
`sate/datos/<unidad>/{nucleo,oferta,tramites}.json`. La oferta conserva sus índices y
los mapas conservan sus rutas. El calendario mínimo también permanece en núcleo
para las reglas académicas existentes; `tramites.json` conserva una copia para su
migración posterior. No se añadieron reglas académicas ni dependencias.

Las rutas son `#/<unidad>/<pestaña>`; se admite `#/pestaña` usando la unidad actual.
El registro `SATE.pestana(id,{montar,mostrar,ocultar})` carga cada script una vez y
monta cada pestaña una vez. Cambiar de unidad recarga la misma entrada para aislar
los globales existentes. Se recuerda `ipnt.unidad` y la ruta mediante el almacén
`hu.ruta` o `hu.<unidad>.ruta`, con `IPNT.set` fuera del modo de demostración.

`horarios.html` y `horarios-*.html` son redirecciones. Conservan search y hashes
ajenos; para `#demo`, `#code=` o `#error=` la unidad se agrega como `sateUnidad` en
search sin sustituir el hash. Electivas y Dictamen mantienen sus páginas actuales.
`data/sate.json` activa Situación y Ventanilla en UPIITA; Mapa, Horarios y Desempeño
están disponibles en las tres unidades. Situación y Desempeño todavía reutilizan
la trayectoria actual. Plot solo se solicita al abrir Desempeño con datos.

Las pestañas y la barra inferior usan `SateUI`; el selector de unidad y la ayuda
de teléfono usan su modal. SAES, cuenta y exportación conservan sus diálogos con
estado. Se conserva `data-theme`, los neutros y el acento histórico `#750946`.

Revisión del 2026-10-06: la identidad usa el nombre de cada unidad del catálogo y
el logo opcional de `data/sate.json` (claro/oscuro, alt y enlace). UPIITA tiene logo;
ESCOM y UPIBI no pintan uno mientras no se configure. Las imágenes resuelven desde
`sate/` a `../assets/`. El nombre completo de SATE aparece solo bajo el h1; las
migas usan `proyecto.nombre = "SARES"`, versión de textos 2026.10.5.
El diálogo SAES y su marcador se generan en `saes-dialogo.js` y se conectan al
primer uso, conservando el callback y el estado. La vista, filtros y generador de
Horarios se cargan al abrir esa pestaña. Exportación carga su diálogo y código al
pulsar el botón. Desempeño difiere su render pesado hasta mostrarse; sus cálculos
compartidos permanecen en núcleo. No se precargan las pestañas ocultas.

## 2. Compilación y pruebas sin navegador

Desde la raíz del worktree:

```text
python tools/compilar_sate.py
D:\Tools\nodejs\node.exe tests/qa_sate.mjs
D:\Tools\nodejs\node.exe tests/qa_sate_router.mjs
D:\Tools\nodejs\node.exe tests/qa_sate_cargas.mjs
D:\Tools\nodejs\node.exe tests/qa_sate_motor.mjs
python -m unittest tests.test_contenido tests.test_rutas_mapa tests.test_sate tests.test_dictamen tests.test_upibi
```

El primer comando compila las tres unidades, Electivas y Dictamen. También se puede
usar `UNIDAD` para compilar una sola unidad con cualquiera de los dos compiladores.
`UPIITA_SITE` conserva su función anterior para los marcadores publicados.

Resultados de la revisión: 35 pruebas de Python; 80 comprobaciones de rutas,
redirecciones y cargas; 35 bloques o archivos JavaScript parseados con `vm.Script`, incluido el ámbito
conjunto de los cinco módulos. La integración con dobles de DOM comprueba carga
única, ciclo de pestañas, navegación, saveData, hashes ajenos y cambio de unidad.
También verifica identidad en las tres unidades, render real de Mapa con/sin
perfil sin descargar Horarios, y carga única del diálogo SAES y de exportación.
El motor ejecutó 33 perfiles ficticios por unidad, semilla 1, con 246 generaciones
que produjeron resultados, sin fallas de invariantes. Los avisos de cobertura
incompleta corresponden a los escenarios deliberadamente sucios del fuzz.

`qa_sate_motor.mjs` reutiliza las invariantes existentes con `FUZZ_SIN_DOM`; omite
render y textos del DOM explícitamente. No equivale a una prueba de interfaz.
`tests.test_fuzz_perfiles` no se ejecutó. Su fixture fue adaptado a los JSON y
scripts nuevos: genera `web/dist/sate/qa-fuzz-<unidad>.html` autocontenido para que
el orquestador pueda ejecutar la prueba de navegador autorizada posteriormente.

## 3. Presupuesto y limitaciones

Medición en bytes UTF-8 sin comprimir, build local con `UPIITA_SITE` vacío:

| Unidad | Base antes | Base después | Vista completa antes | Vista completa después |
|---|---:|---:|---:|---:|
| UPIITA | 457037 | 345356 | 633781 | 522100 |
| ESCOM | 439237 | 327556 | 559470 | 447789 |
| UPIBI | 496654 | 384973 | 609195 | 497514 |

La base suma `index.html`, `nucleo.js`, `inicio.js`, `rutas.js`,
`componentes.js` y `nucleo.json`. La vista completa añade `mapa.js` y `oferta.json`:
las sugeridas y los horarios guardados necesitan la oferta para conservar sus
resultados. Se carga antes de mostrar la vista, no se cuenta la pantalla de carga
como cumplimiento. **No se cumple el objetivo de 160000 bytes.** Se quitaron
111681 bytes de cada base y vista completa. Queda separar cuenta/sincronización,
CSS y render compartido, y preparar un índice mínimo de oferta que permita
dibujar el mapa sin descargar todos los grupos, manteniendo sugerencias y horarios.
El HTML todavía pesa 117152 bytes y `nucleo.js` 152548; los demás scripts iniciales
suman 25105. Datos de núcleo: 50551 / 32751 / 90168 bytes; oferta:
158953 / 102442 / 94750 bytes (UPIITA / ESCOM / UPIBI). Los archivos diferidos
SAES / exportación / Horarios / render de Desempeño pesan
47812 / 26834 / 55320 / 14218 bytes. Los diálogos de cuenta permanecen iniciales
porque la recuperación de sesión y la sincronización los usan al arrancar.
La medición es de archivos UTF-8 sin comprimir, no de tiempo en navegador; conserva
el criterio del corte previo y no incluye imágenes ni fuentes externas.

## 4. Continuación y revisión del orquestador

Etapas 4 y 5: dividir Situación y Desempeño, ordenar sus bloques y reducir el núcleo.
Etapas 6 y 7: sustituir los accesos provisionales por los datos y procedimientos de
ETS/Reinscripción y el detector/formularios de Dictamen. Etapa 8: integrar Electivas.
Etapa 9: migrar textos y tokens restantes, retirar la referencia histórica y cerrar
la migración del calendario y de la portada. Ventanilla permite navegar sus rutas;
ETS muestra preparación, Reinscripción reutiliza el calendario y Dictamen/Electivas
abren las herramientas existentes.

Revisar `sate/index.html#/upiita/mapa`, `#/upiita/horarios`, `#/upiita/situacion`,
`#/upiita/desempeno`, `#/upiita/tramites/reinscripcion`, y Mapa/Horarios en ESCOM y
UPIBI. Probar con/sin DEMO, 375 y 1280 px, temas, flechas de pestañas y foco de modal,
atrás/adelante, selección de materias, generador y exportación. Revisar los cuatro
enlaces antiguos con search y `#demo`, y el retorno real de cuenta con `#code=` o
`#error=`; el enrutador no los toca, pero el proveedor necesita validar su retorno.
No se abrió navegador ni se verificó visualmente esta etapa.

## 5. Decisión pendiente del dueño

Confirmar el registro de `sate/index.html` como URI de retorno de la aplicación de
cuenta institucional. El callback de ventana emergente sigue en `../auth.html`.
