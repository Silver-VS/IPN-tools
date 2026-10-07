# SATE: corte de la etapa 4

## 1. Entrega y límites

`web/sate/situacion.js` se registra con `SATE.pestana` y solo se carga cuando la
unidad incluye Situación en `data/sate.json` (actualmente UPIITA). Tiene panel
propio: chips accesibles, tarjetas ordenadas por gravedad, cuatro cifras y opciones
por materia. Sin perfil muestra el Lector y la demostración existente. Los datos de
Situación son reales aunque esté activa una simulación; se conserva su estado.

Las reglas siguen siendo `failInfo`, `reglaDesfase`, `statsDatos`, `retenidos`,
`perMeta` y `SAES.autorizada`. `situacionDatos` reúne sus resultados sin añadir un
detector de causales. Los avisos informan y piden confirmar con Gestión Escolar;
una cita ausente no se interpreta como falta de reinscripción ni baja. El detector
de la etapa 7 deberá preguntar por baja temporal autorizada antes de orientar sobre
esa causal. El Lector todavía no confirma dictamen vigente.

## 2. Contenido trasladado

| Desde Mapa | Destino |
|---|---|
| Veredicto de desfase, ETS, lista de adeudos, cifras y recordatorio de lectura | Situación |
| `desf-note` | Modal «Cómo funciona el desfase» |
| Calendario y alerta independiente | Ventanilla › Reinscripción y globo/modal de Situación |
| Equivalencias del horario inscrito (`est-eqv`) | Horarios |
| Botón de análisis y controles de simulación | Se muestran solo en Desempeño; su separación completa es etapa 5 |

Se retiró `hor-cal`. La oferta y su selector se muestran solo en Horarios.
Situación muestra «Lo que sigue para ti» con calendario completo en hover o modal;
el modal reutiliza `drawCals`, sin segunda implementación del calendario.
`sate.situacion.*` y `sate.calendario.*` están en TOML, versión `2026.10.6`, con
registro en `contenido/CAMBIOS.md`. El CSS añadido usa tokens `--ipn-*`.

## 3. Validación sin navegador

```text
python tools/compilar_sate.py
D:\Tools\nodejs\node.exe tests/qa_sate.mjs
D:\Tools\nodejs\node.exe tests/qa_sate_router.mjs
D:\Tools\nodejs\node.exe tests/qa_sate_cargas.mjs
D:\Tools\nodejs\node.exe tests/qa_sate_situacion.mjs
D:\Tools\nodejs\node.exe tests/qa_sate_motor.mjs
python tests/qa_sate_python.py
python tools/contenido.py
```

El compilador genera las tres unidades, Electivas y Dictamen. El ejecutor Python
corre `tests.test_contenido`, `tests.test_rutas_mapa` y `tests.test_sate` (15 pruebas)
con los temporales de los fixtures dentro del worktree. QA verifica 80 contratos y
37 scripts; router verifica la carga independiente de Situación sin oferta. La
prueba nueva ejecuta componentes reales sobre DOM en memoria: cuatro cifras,
orden de tarjetas, texto de estado de chips, calendario vigente/ajeno, simulación,
Tab/Shift+Tab, cancelación Esc y retorno de foco. No comprueba píxeles ni un lector
de pantalla real. El fuzz añade la invariante de situación real, sin adeudos
duplicados o acreditados y sin cambiar la simulación: 33 perfiles por unidad,
246 generaciones con resultados, sin fallas. Los avisos de cobertura incompleta
son de perfiles deliberadamente sucios.

## 4. Primer pintado

Bytes UTF-8 sin comprimir, sin imágenes ni fuentes externas. La base suma
`index.html`, `nucleo.js`, `inicio.js`, `rutas.js`, `componentes.js` y `nucleo.json`.
Situación añade solo `situacion.js`; Mapa añade `mapa.js` y `oferta.json`.

| Unidad | Base | Situación | Mapa |
|---|---:|---:|---:|
| UPIITA | 346061 | 354243 | 522625 |
| ESCOM | 328261 | No habilitada | 448314 |
| UPIBI | 385678 | No habilitada | 498039 |

El presupuesto de 160000 bytes sigue sin cumplirse. Es peso de archivos necesarios,
no una medición de tiempo ni una captura de pantalla de carga.

## 5. Revisión del orquestador y decisiones pendientes

Revisar `#/upiita/situacion` sin datos y con DEMO a 375 y 1280 px, claro/oscuro:
primera tarjeta grave completa, cuatro cifras, hover del calendario, toque y
teclado, cierre Esc y foco de regreso. Verificar navegación a Ventanilla y Lector,
demostración y su salida; Mapa sin duplicados, equivalencias en Horarios y
simulación/análisis en Desempeño. Confirmar consola sin errores y que Situación
no descarga oferta, Mapa ni Plot. Verificar que ESCOM/UPIBI no tienen Situación.

No se abrió navegador ni se usó red; no hay revisión visual en este corte.
En la primera ejecución directa de unittest no se fijó el directorio temporal de
los fixtures existentes. Las siguientes ejecuciones usan el ejecutor del worktree;
los fixtures se eliminan al terminar sus contextos.
Pendiente institucional para etapa 7: cómo confirmar una baja temporal autorizada
y el estado del dictamen. No se hicieron commits, push ni publicación.
