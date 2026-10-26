# Ventanas de SATE

## 1. Inventario y migración (R17-MODAL, 2026-10-26)

| Entrada | Mecanismo anterior | Mecanismo actual |
|---|---|---|
| `componentes.js`: ayudas táctiles, glosario, menú Más y chips | Un único `<dialog>` reutilizado, sustituyendo contenido | `SateUI.modal`, un diálogo por nivel |
| `guia.js`: citas de reglamentos y artículos enlazados desde artículos | Modal común con variante flotante | Misma llamada, apilada; se conserva el texto literal y `data-oficial` |
| `guia.js`: fichas de áreas y departamentos en pantalla estrecha | Modal común | Pila común |
| `tramites.js`: resumen de Dictamen, Electivas y Bajas; formato; confirmación de descarga y error de cita | Modal común | Pila común, con callback propio por nivel |
| `temarios.js`: ficha breve de materia desde el Mapa y Programas | Capa `section[role=dialog]`, velo, foco y Esc propios | `SateUI.modal`; cada carga asíncrona conserva su propio cuerpo |
| `temarios.js`: selector con trayectoria visual | Modal común, cerrado antes de abrir la materia | Pila común; volver recupera búsqueda, filtros y desplazamiento |
| `horarios.js`: ficha de materia, Propuestas, actividades fijas y eliminación | Modal común | Pila común; contenido interno conservado |
| `horarios.js`: Más filtros y horario compacto | `<dialog>` con `showModal` propio | `SateUI.abrirVentana`, adopta los nodos y eventos existentes |
| `exportacion.js`: opciones de exportación | `<dialog id=exp-dlg>` con apertura y cierre propios | `SateUI.abrirVentana` y `cerrarVentana` |
| `recorrido.js` y `componentes.js`: bienvenida y pasos del recorrido | `<dialog class=sate-recorrido>` independiente | Diálogo adoptado, con regreso, × y limpieza al cerrar |
| `calendario.js`: detalle de actividades en teléfono | Hoja con velo, Esc y trampa de foco propios | `SateUI.modal`; el detalle lateral de escritorio permanece en el flujo |
| `inicio.js`: selector de unidad y avisos | Modal común | Pila común |
| `situacion.js`, `mapa.js`, `nucleo.js`: detalle, simbología, supuestos y ayuda | Modal común | Pila común |
| `cupos.js`, `cupos-vista.js`, `cupos-receptor.js`: detalle, consulta y confirmación de choque | Modal común | Pila común |

Las definiciones de `dictamen.js`, `electivas.js` y `bajas.js` usan el asistente de `tramites.js`; no crean otra ventana.
El lector de PoliCORE es contenido incrustado, sin ventana propia.

## 2. Elementos flotantes que no son ventanas

| Elemento | Comportamiento |
|---|---|
| `componentes.js`: `.sate-globo` de ayuda y términos | Descripción por hover/foco en escritorio, sin navegación modal; en teléfono abre la pila |
| `nucleo.js`: `.tip-flot` | Descripción no interactiva; en teléfono usa el modal común |
| Guía: índice, riel de investigación y `details` | Paneles de la vista, sin `aria-modal` ni apertura modal |
| Avisos temporales, barras de navegación y bandeja de planeación | Controles y estados de la página, sin ventana |
| `medicion.js`: panel de diagnóstico | Instrumentación opcional del desarrollo, sin interacción modal |

Los diálogos de cuenta, privacidad, sincronización y bienvenida de `tools/cuenta.py` son un componente externo compartido con otras páginas, fuera del inventario de `web/sate`. Conservan su protocolo de consentimiento y resolución de promesas; este encargo no modifica ese módulo.

## 3. Contrato del componente común

`SateUI.modal(titulo, contenido, opciones)` crea una ventana y devuelve `{elemento, cerrar}`. El contenido es un nodo,
texto o función. `SateUI.abrirVentana(dialogo, opciones)` adopta un diálogo existente sin mover su contenido. La opción
`cierre:true` incorpora × cuando la sección no tiene ese control; `navegacion` permite situar los controles dentro de
la tarjeta del recorrido para evitar superposiciones. `cerrarModal()` cierra la superior;
`cerrarVentana(dialogo)` actúa únicamente si ese diálogo es el superior; `cerrarVentanas()` cierra toda la pila.

La pila conserva hasta cinco ventanas abiertas. Las inferiores tienen `inert` y carecen de `aria-modal`; solo la
superior es modal y recibe Tab, Shift+Tab y Esc. Al regresar se restaura el disparador con `preventScroll`.
No se reconstruyen los nodos inferiores, por lo que conservan campos, selección, eventos y desplazamiento.
La ventana superior ofrece «‹ título anterior» y, desde tres niveles, «Cerrar todo». ×, Esc y el fondo cierran un nivel.
El fondo se distingue del área de contenido por las coordenadas del clic, para no cerrar al pulsar espacios interiores.
Los identificadores de títulos son únicos; el foco inicial en el título permite anunciar el nombre de cada ventana.

Cada apertura agrega `history.pushState` con la URL completa actual, incluido el hash, y conserva las claves ajenas del
estado. `popstate` regresa a las ventanas que aún existen. Los cierres de la interfaz consumen sus entradas en serie;
las aperturas durante ese tránsito esperan para registrar su entrada. Los niveles descartados por el límite se saltan.
Los enlaces `#/…` de una ventana consumen primero las entradas modales y después visitan su ruta, para que un Atrás
pendiente no revierta el destino. Las acciones de cierre también esperan al historial antes de ejecutar su callback;
su resultado precede a `alCerrar`, conservando la resolución de las confirmaciones de descarga.
Adelante no reconstruye ventanas cerradas.

En anchos de hasta 600 px el estilo común presenta cada ventana como hoja inferior casi a pantalla completa.
Los controles usan tokens `--ipn-*`; las etiquetas nuevas se consultan en `contenido/textos/es.toml`.

## 4. Validación y límites

`tests/qa_sate_modales.mjs` usa los componentes, citas de Ventanilla y artículos de la Guía reales, con DOM e historial
en memoria. Recorre Dictamen → RI 98 → otra cita, vuelve dos niveles y comprueba el desplazamiento original; también
verifica literalidad, foco, Tab, Esc, fondo, Atrás, límite de cinco, callbacks y reapertura de diálogos persistentes.
RI 98 no aporta siempre un enlace interno: la prueba incorpora un disparador adicional fuera de la transcripción
para abrir Honor 34, cuyo texto conserva sus referencias reales. Las pruebas existentes se adaptan a diálogos distintos.

Los anchos 1440, 1024, 768, 600, 375 y 320 y ambos temas se recorren en el arnés lógico; no constituyen una inspección
visual, una medición de geometría ni una prueba con lector de pantalla. No se abrió navegador, por instrucción del encargo.

Validación local: 58 archivos `qa_sate*.mjs` aprobados; pytest con 192 pruebas y 801 subpruebas aprobadas, 798 omisiones
declaradas por la suite. Se ejecutó `python -m pytest -q -p no:cacheprovider tests --ignore=tests/test_fuzz_perfiles.py`
con `--basetemp` dentro de este worktree. Las 19 701 huellas oficiales permanecen intactas. Se compilaron ESCOM, UPIBI
y UPIITA; la última compilación es solo UPIITA con `UPIITA_SITE=https://guinda-labs.github.io/prueba/`.
