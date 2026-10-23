# R13-EST: consistencia visual de SATE

## 1. Sistema y alcance

Las acciones usan `--ipn-radio` y `--ipn-control-alto` (44 px, también para la variante chica; cambia su espacio horizontal). Es una altura mínima: las etiquetas largas pueden envolver sin recortes. Paneles y tarjetas usan el mismo radio; los bordes contiguos y las hojas que ocupan toda la pantalla conservan esquinas rectas. `--ipn-radio-pastilla` (999 px) queda reservado a filtros y estados; `--ipn-radio-circulo` (50 %) a pasos e íconos, incluidos indicadores de estado. Las barras de progreso, pestañas, selectores, acciones y fechas dejan de introducir otras geometrías.

Los tokens se definen una sola vez en `web/sate/encabezado.css`, compartido por el cascarón y las páginas hermanas. No se cambiaron reglas académicas, contenido, dependencias ni datos.

| Vista | Componentes modificados |
| --- | --- |
| Tu perfil | Acciones y Editar, simulación y filtros, tarjetas de estadísticas/avisos, barras de avance, minimapa, notas y encabezado del Kárdex, controles de plan. |
| Mapa | Cajas de unidades de aprendizaje, leyendas, indicadores, pestañas, acciones del inspector, menú y bandeja del plan; encabezado de áreas. |
| Horarios | Acciones, segmentados, tarjetas de grupos/horarios, avisos, exportación, buscadores, controles de cupos y temario, filtros fijos y panel lateral. |
| Ventanilla | Volver y Descartar con el mismo radio, altura, peso y espacio vertical; Editar y acciones de tarjetas; paneles y estados; resumen de electivas y vista previa fija. |
| Calendario | Tarjetas, selector, controles de vista, fichas, eventos, días/fecha actual, lista y detalle móvil; barras de avance y panel lateral fijo. |
| Guía y reglamentos | Acciones de contacto, pasos, índice y riel fijo, encabezados jerárquicos, margen de anclas y desplazamiento del lector PoliCORE. |
| Temarios | Modal, acciones, relaciones, selector y explorador; activo del índice con radio, fondo suave y peso 600 como reglamentos; títulos sin banda ni fijación; lateral y anclas. |
| Compartidos | Botones, enlaces de regreso, chips, segmentados, pestañas, barra inferior, cierres e íconos; barra flotante medida con ResizeObserver. |

## 2. Inventario y pruebas

`D:/Tools/nodejs/node.exe tests/qa_sate_consistencia.mjs --inventario` emite JSON con variantes de radio/altura y cada selector con dimensiones, fondo, borde, espacio, color y tipografía. Sin la opción imprime el resumen y verifica el sistema. Se detectaron 25 variantes iniciales de radio, reducidas a radio común, pastilla, círculo y cero estructural (con combinaciones para esquinas de hojas).

El guardia rechaza radios literales, radios individuales fuera del sistema, pastillas/círculos usados fuera de su función y `sticky` vertical con `top` que omite `--sate-barra-alto`, incluso si la declaración está en una segunda regla. Incluye casos negativos e integración del encabezado con barra oculta/visible, redimensionamiento fraccionario y cambio a móvil. La barra publica su borde inferior visible y vuelve a cero cuando se oculta; las anclas y el Kárdex comparten esa medida.

Se ejecutaron las tres compilaciones: 46 de 47 `tests/qa_sate*.mjs` pasan; la excepción previa se detalla abajo. Pytest sin fuzz: 171 pruebas y 765 subpruebas aprobadas, una omitida. El registro completo y el inventario quedan en `_encargo/r13-qa.log` y `_encargo/r13-inventario.json`. La compilación final corresponde solo a UPIITA con `UPIITA_SITE=https://guinda-labs.github.io/prueba/`. `git diff --check` pasa; se conserva `claude/r13-est`, sin commit ni push.

## 3. Limitaciones y pendientes

Revisión de fuentes para claro/oscuro y reglas responsivas de 1440, 1024, 768, 375 y 320 px: geometría compartida y colores semánticos existentes. No hay navegador integrado disponible; no se ejecutó automatización propia ni se midieron capturas, desbordes, consola o disposición visual en esos anchos. Puntaje visual antes/después pendiente, sin inventar una medición.

Fallo previo confirmado en `HEAD`: `qa_sate_diseno.mjs` exige `.95em` en `.box .plan-marca`, mientras el cascarón ya define `.72em`. No se modifica esa tipografía ajena al encargo ni se debilita su aserción.
