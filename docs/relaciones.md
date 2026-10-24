# Relaciones de SATE

## 1. Fuentes y generación

`tools/relaciones_sate.py`, llamado por `tools/build_sate.py`, genera
`web/dist/sate/datos/<unidad>/relaciones.json`. La misma proyección se incluye en
`nucleo.json` para disponer de ella antes de abrir Mapa o Ventanilla. No consulta
la red ni modifica textos documentales. Cada arista lleva `fuente`.

| Relación | Regla y fuente existente |
|---|---|
| Pregunta → artículo | Extrae exclusivamente `[[a:doc:art\|…]]` de `respuesta` y `pasos` de la Guía fusionada. Conserva documento, número y pregunta; elimina duplicados dentro de cada pregunta. |
| Situación → pregunta | Copia `data/guia/rutas.json`, `aplicabilidad`, sin búsqueda por palabras ni por similitud. |
| Desfasada o recursando → oportunidades de la materia | `web/sate/guia.js`, `resolverRuta`, y `data/guia/comun.json`, `veces-cursar-materia`: oportunidades de recursamiento y límite del art. 98 del RI. No usa `plan-desfasado`, que trata un cambio del plan de estudios. |
| Trámite → pregunta → artículos | Usa `data/sate.json`, `unidades.<unidad>.guiaTramites`, y une sin duplicados los fundamentos de `citasVentanilla` que ya usan `dictamen.js` y `bajas.js` (prefijos de sus claves). |
| Dictamen → área de entrega | La fila `entrega` de `rutaGuiada`, caso `formato-dictamen`, en `web/sate/guia.js`, ya enlaza a Gestión Escolar. |
| Bajas → área de entrega | Los pasos de `baja-temporal` y `baja-definitiva` dicen expresamente presentar o entregar la solicitud en Gestión Escolar. La lista `acudir` por sí sola no prueba entrega. |
| Electivas → artículos y entrega | La capacidad `electivas.tramite` identifica el trámite; el preámbulo de `data/gestion_escolar/instructivo.txt`, página 3, enumera los artículos del RI y RGE. Se extraen sus números, sin copiar ni corregir la transcripción. El instructivo desarrolla el nombre del DIE y dice «El alumno entrega la constancia en el DIE.» (tabla IX); el nombre y destino se toman de su ficha existente `innovacion_educativa`. |

## 2. Situación real de cada materia

`relacionesMateria` ejecuta las reglas existentes con `conSim(false)` y el periodo
base, sin modificar el perfil. No usa el estado visual del mapa ni materias ajenas
a la carrera del perfil. Una acreditada y la ausencia de perfil producen cero vínculos.

| Dato real | Situación o trámite |
|---|---|
| `tr().adeudos` contiene la clave | Preguntas con aplicabilidad `adeudos`. |
| `failInfo(clave).veces >= 2` | Preguntas con aplicabilidad `recursamiento`. |
| Clave en curso y con antecedente `failInfo` | Recursando: pregunta `veces-cursar-materia`. |
| `desfS` contiene la clave o `failInfo.estado` es `desfasada` | Pregunta de oportunidades de esa materia, incluidos los artículos de desfase. |
| `reglaDesfase().por[clave]` es `dictamen` o `agotada` | Preguntas de dictamen y trámite existente de dictamen. |
| Sin regla transitoria, materia pendiente desfasada o con dos intentos | Misma decisión de `guia.js#resolverRuta`: dictamen. |

La excepción transitoria `oficio` no se convierte en dictamen; tampoco se aplica el
dictamen de otra materia a todas las de su perfil. Una materia en curso no recibe
una solicitud de dictamen como si estuviera pendiente de inscripción.

## 3. Presentación y límites

La ficha añade como máximo dos párrafos: artículos únicos y trámite con área.
Los artículos abren `SATE.articulo`, la vista flotante existente; el área conserva
su nombre literal, `data-oficial` y la ruta `guia/acudir/<id>`. Ventanilla muestra
los mismos vínculos en lista, resumen y formulario, fuera del botón de la tarjeta.

Electivas usa su instructivo existente, no una pregunta inexistente de la Guía.
Los fundamentos sin asociación existente quedan ausentes.
La revisión responsiva es estática: no se abrió ningún navegador.

## 4. Validación y pendientes

Se compilaron ESCOM, UPIBI y, al final, solo UPIITA con
`UPIITA_SITE=https://guinda-labs.github.io/prueba/`. Pruebas nuevas: extracción
trazable y coincidencia de las tres salidas; perfil ficticio 4 con artículo 98,
dictamen y área; acreditada y ausencia de perfil sin extras; simulación sin alterar
el resultado; clic de artículo dirigido a la vista flotante; lista y resumen de
los cuatro trámites con fundamento y receptor.

| Unidad | Situación → pregunta | Pregunta → artículo | Trámites | Trámite → artículo | Trámite → área |
|---|---:|---:|---:|---:|---:|
| UPIITA | 10 | 72 | 4 | 23 | 4 |
| ESCOM | 10 | 72 | 0 | 0 | 0 |
| UPIBI | 10 | 72 | 0 | 0 | 0 |

QA completo: 55 de 57 pasan. `qa_sate_diseno.mjs` rechaza `font-size:0` del botón
de ayuda del encabezado; `qa_sate_puentes.mjs` espera `color:transparent` y un
pseudo-elemento en la leyenda, mientras el CSS original usa el botón de ayuda.
`web/sate/encabezado.css` coincide con `HEAD`; no se modifica por la exclusión
expresa de R4-COMUN §3. Pendiente: conciliar esos dos contratos con el encabezado
en su encargo correspondiente. No se reducen ni se silencian las aserciones.

Pytest (última ejecución): 192 pasan, 798 omitidas por las marcas existentes, 801 subpruebas pasan;
se excluye `test_fuzz_perfiles.py` según R4-COMUN §6. Las 19 701 huellas oficiales
permanecen intactas. Los temporales de la última ejecución permanecen en
`_encargo/vin-temporales`, dentro del worktree. Sin red, navegador, commit ni push.
