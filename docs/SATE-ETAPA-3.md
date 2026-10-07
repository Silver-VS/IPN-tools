# SATE: corte de la etapa 3

## 1. Estructura y compatibilidad

`tools/build_sate.py` conserva la construcción de datos del compilador anterior;
`tools/build_horarios.py` queda como envoltura compatible. La fuente activa es
`web/sate/cascaron.html` y los scripts clásicos `nucleo.js`, `mapa.js`, `horarios.js`,
`inicio.js` y `rutas.js`. `web/horarios.template.html` queda como referencia histórica;
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

## 2. Compilación y pruebas sin navegador

Desde la raíz del worktree:

```text
python tools/compilar_sate.py
D:\Tools\nodejs\node.exe tests/qa_sate.mjs
D:\Tools\nodejs\node.exe tests/qa_sate_router.mjs
D:\Tools\nodejs\node.exe tests/qa_sate_motor.mjs
python -m unittest tests.test_contenido tests.test_rutas_mapa tests.test_sate tests.test_dictamen tests.test_upibi
```

El primer comando compila las tres unidades, Electivas y Dictamen. También se puede
usar `UNIDAD` para compilar una sola unidad con cualquiera de los dos compiladores.
`UPIITA_SITE` conserva su función anterior para los marcadores publicados.

Resultados: 35 pruebas de Python; 72 comprobaciones de rutas/redirecciones;
31 bloques o archivos JavaScript parseados con `vm.Script`, incluido el ámbito
conjunto de los tres módulos. La integración con dobles de DOM comprueba carga
única, ciclo de pestañas, navegación, saveData, hashes ajenos y cambio de unidad.
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

| Unidad | Cascarón + núcleo y dependencias + nucleo.json | Vista inicial completa |
|---|---:|---:|
| UPIITA | 457037 | 633781 |
| ESCOM | 439237 | 559470 |
| UPIBI | 496654 | 609195 |

La primera columna suma `index.html`, `nucleo.js`, `inicio.js`, `rutas.js`,
`componentes.js` y `nucleo.json`. La segunda añade `mapa.js` y `oferta.json`:
las sugeridas y los horarios guardados necesitan la oferta para conservar sus
resultados. Se carga antes de mostrar la vista, no se cuenta la pantalla de carga
como cumplimiento. **No se cumple el objetivo de 160000 bytes.** Falta separar
más código del núcleo, cargar los diálogos y el marcador completo al solicitarlos,
y preparar un índice mínimo de oferta que permita dibujar el mapa sin descargar
todos los grupos. La precarga de módulos se programa después de mostrar la vista
con requestIdleCallback o setTimeout, y se omite con saveData o conexión 2g.
La medición es de archivos, no de tiempo de pintado en un navegador.

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
