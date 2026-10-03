# Handoff a Claude: UPIBI, analítica SAES y equivalencias

## 1. Instrucción para continuar

Continúa el proyecto en `D:\Documents\Development\UPIITA_DEV`, rama `codex/upibi`. Lee `AGENTS.md` completo y este documento. No publiques, no ejecutes `tools/publicar.sh`, no hagas push, no cambies de rama y no descartes los cambios sin commit. El usuario pidió entregar el contexto de toda esta sesión a Claude, no iniciar otra implementación automática durante el handoff.

Fecha de este handoff: 3 de octubre de 2026, zona America/Mexico_City. Estado del código comprobado antes del commit de documentación: base `3b6928a`, 18 pruebas aprobadas y `git diff --check` sin errores. Hay cambios sin commit en tres archivos. No hay implementación de equivalencias aplicada al código.

El usuario es ingeniero de software y estudiante de Ingeniería Biónica en UPIITA. Prefiere español, profundidad útil, cambios pequeños y seguros, crítica directa y pruebas. No agregar dependencias, módulos ni refactorizaciones generales sin necesidad. No guardar datos reales del alumno en el repositorio, archivos, documentación o logs. SAES solo lectura; nunca automatizar inscripciones o trámites. No pedir contraseñas.

## 2. Objetivo original y evolución

Retomar el pendiente 1 de AGENTS: integrar UPIBI a Horarios y verificar extracción con una sesión de SAES proporcionada por el usuario. Después se corrigieron filas curriculares, encabezado, proyección por semestre, leyenda condicional, tooltips y analítica engañosa. El usuario autorizó ejecutar las etapas A–C del plan de analítica, dejando D para otra entrega. Finalmente pidió analizar todas las correspondencias entre carreras y planes de UPIBI y ahora solicita este handoff.

No reproducir el expediente real que el usuario compartió en el chat. Los artefactos adjuntos contienen únicamente datos académicos institucionales, documentación y capturas recortadas sin identidad del alumno. Las pruebas usan perfiles ficticios.

## 3. Historial de cambios de esta sesión

Las siguientes entradas existen en la rama. Los cambios anteriores a `e40df98` son el punto de partida heredado de Claude.

| Commit | Cambio |
|---|---|
| `e40df98` | Integración UPIBI: captura académica, seis mapas por carrera/plan, oferta y construcción local |
| `0a8ac15` | Corrección de solapamientos y altura de filas de mapas por áreas |
| `09934cd` | Cambio de unidad desde la pantalla; controles de sesión y tema al extremo derecho; conservar encabezado institucional |
| `56648db` | Puntos por semestre futuro, créditos acumulados y referencia de carga UPIBI |
| `ed65e5d` | Alineación de proyección con periodo planeado |
| `df80d47` | Leyenda roja únicamente cuando la tendencia excede la referencia |
| `8084c5e` | Identificación de periodos sin resultados |
| `d8b57c9` | Proyección desde el semestre siguiente al último acreditado; incluir semestre actual como futuro cuando no hay resultados |
| `61baf33` | Quitar la línea gris ideal, a petición del usuario |
| `b11100a` | Etiquetas de créditos y sus detalles interactivos |
| `86fab09` | Tooltip unificado y proximidad proporcional al ancho |
| `666a6a4` | Corrección definitiva de coordenadas SVG bajo zoom CSS |
| `e68ec9b` | Etapa A: sustituir predicciones de notas/riesgo por antecedentes verificables |
| `3b6928a` | Etapa B: saldo coherente, cobertura y denominadores explícitos |

El usuario confirmó que los tooltips quedaron arreglados. No rehacer esa corrección por intuición ni usar coordenadas fijas de capturas. `montarGrafica` corrige `getScreenCTM` con límites visibles y viewBox, considerando zoom CSS, scroll y resize. Todas las gráficas deben pasar por ese helper. La regresión automatizada cubre estos casos.

## 4. Integración UPIBI: fuentes y descubrimientos

Detalles completos en [UPIBI-informe.md](UPIBI-informe.md) junto a este documento. Se capturaron 1,027 filas de oferta, fusionadas en 664 clases. No había oferta del siguiente periodo en la captura. Se integraron Ambiental 06, Biotecnológica 06 y 24, Farmacéutica 06, Alimentos 06 y Biomédica 06. Los planes 06 son por niveles, Biotecnológica 24 por semestres. Los planes 99 no se integraron como mapas del producto; sí se incluyeron después en el análisis de equivalencias.

Las claves de Biotecnológica se reutilizan entre planes. La identidad interna distingue Biotecnológica 06 (`B_06`) de 24 (`B`); revisar `carrera_plan` y `DATA.opciones_plan`. No resolver perfiles con plan desconocido eligiendo arbitrariamente uno.

Biotecnológica 2024: los 354 créditos de la extracción PDF omitían Electiva B612 de 18, por lo que 354 + 18 = 372. Existe otra diferencia independiente: Estancia Profesional I B706 vale 3 en PDF y 1.5 en SAES. El producto conserva la fuente SAES y señala la discrepancia, sin forzar el total. Hay otras diferencias de horas y algunos créditos enumeradas en el informe. Categorías por áreas y flechas extraídas requieren revisión académica; no declarar obligatorias todas las aristas.

Archivos clave: `tools/extract_mapa_upibi.py`, `tools/build_horarios.py`, `data/unidades/upibi/`, `web/horarios.template.html`, `tests/test_upibi.py`. Editar fuentes y plantillas, no únicamente HTML generado. Logos institucionales solo en `web/dist`.

## 5. Investigación y decisiones de analítica

El plan completo es [PLAN-ANALITICA-SAEs.md](PLAN-ANALITICA-SAEs.md). No repetir toda la investigación. Fuentes y límites:

| Fuente | Uso y límite |
|---|---|
| Reglamento General de Estudios IPN, artículos 49 y 52: https://www.esm.ipn.mx/assets/files/esm/docs/estudiantes/gestion-escolar/plan-de-estudios/reglamento-general-de-estudios.pdf | Verificar plazos y condiciones; no inventar cómo computa SAES bajas y periodos |
| Plan Biomédica: https://www.upibi.ipn.mx/assets/files/upibi/docs/Estudiantes/Gesti%C3%B3n%20Escolar/plandeestudiosdeingenieriabiomedica.pdf | Contrastar mapa y cargas |
| Huntington-Klein y Gill: https://pmc.ncbi.nlm.nih.gov/articles/PMC7568764/ | La carga y el rendimiento no justifican una regla individual de sobrecarga por créditos |
| CCRC: https://ccrc.tc.columbia.edu/publications/momentum-15-credit-course-load.html | Asociación observacional; créditos de EE. UU. no trasladables directamente al IPN |
| Creswell et al.: https://doi.org/10.1073/pnas.2209123120 | Sueño y rendimiento poblacional; no predictor individual |
| AASM/SRS: https://www.aasm.org/resources/pdf/adultsleepdurationconsensus.pdf | Referencia general de descanso, no umbral de créditos saludables |

La relación histórica del expediente entre créditos acreditados y notas no prueba que inscribir más carga cause mejores resultados. No usar regresiones de cinco periodos para recomendar carga. No entrenar ML, pronosticar notas, declarar riesgo probabilístico o certificar salud con un solo expediente.

El usuario aclaró que ORD y EXT corresponden a la primera cursada cuando los recursamientos se clasifican aparte como REC/ETS. Esto no es necesariamente primera evaluación y no da una tasa de aprobación de todo lo inscrito. Mientras no se confirme la codificación por unidad, mostrar formas literales y omitir el agregado de primera cursada. ORD+EXT podría agregarse más adelante con denominador declarado.

En UPIBI, 438/36.5 = 12 es una referencia aritmética a carga mínima, no un plazo reglamentario confirmado. SAES mostraba duración 15 y máxima 23, una discrepancia aún no resuelta. Mantener aviso y no convertir referencia roja en amenaza administrativa de baja.

## 6. Implementación confirmada: etapas A y B

### 6.1 Etapa A, commit e68ec9b

`notaValida` rechaza null, vacío, no finito y valores fuera de 6–10. Sin observaciones propias no hay promedio: null/n=0, nunca nota 10 heredada de otra área. Se eliminaron predicciones `pred`, penalizaciones arbitrarias por forma, “Riesgo alto”, “calificación esperada”, afinidad inferida y consejos causales sobre carga.

`analisis`/`renderAnalisis` muestran adeudos, antecedentes pendientes y materias que desbloquea el mapa. Las líneas de especialización solo muestran sus materias propias acreditadas, nombres y n; las vacías se ocultan. La secuencia pendiente usa detección de ciclos y no se presenta como mínimo reglamentario. El gráfico de créditos y medias es descriptivo.

### 6.2 Etapa B, commit 3b6928a

Separar promedio oficial del SAES y media de acreditaciones. No reconstruir el promedio oficial multiplicándolo por el número de aprobadas. Media, mediana, dispersión e histograma usan la misma población válida. La simulación no modifica el promedio oficial.

Una clave acreditada se cuenta una vez, conservando el último registro válido. `simKardex` suma únicamente nuevas acreditaciones del escenario, sin doble conteo. `statsDatos` comparte saldo entre tarjetas, curva y proyección. Créditos desconocidos son null, no cero. Diferencia entre historial reconocido y saldo oficial se informa, nunca se asigna a un semestre inventado. Inconsistencias de total/obtenidos/faltantes o exceso simulado desactivan la proyección dependiente.

ORD/EXT/ETS/REC forman el denominador de acreditaciones con forma conocida. EQV/REV/DIC se separan; formas desconocidas quedan identificadas y excluidas de ese porcentaje. No interpretar 91% ORD como aprobación de 91% de todas las inscripciones.

Ritmo: hasta tres periodos históricos anteriores al actual inferido, excluyendo resultados simulados. Los huecos no equivalen a cero. Se admite `periodos_confirmados:[{periodo:'25/2',creditos:0,completo:true}]`; el lector no inventa esa confirmación. Cobertura parcial visible. Sin curva conciliada, el saldo oficial puede ser ancla de cálculo, nunca una acreditación atribuida a un periodo.

Diagnósticos `ST_DIAG`: conteos y banderas agregados, una vez por firma; ningún expediente personal en consola. Documentación vigente en `docs/ANALISIS-ACADEMICO.md`.

## 7. Cambios sin commit: etapa C y ajustes finales

Estado exacto: tres archivos modificados respecto a HEAD. `tools/build_horarios.py` y el lector no tienen cambios pendientes. Se adjunta [cambios-pendientes-etapa-C.patch](cambios-pendientes-etapa-C.patch), basado en HEAD 3b6928a. Si Claude continúa en el mismo checkout, **no aplicar el parche**, los cambios ya están presentes.

| Archivo | Cambio pendiente |
|---|---|
| `web/horarios.template.html` | `metaCreditos`, `metaResumen`, `metaPanel`, entrada delegada `cambiarMeta`, CSS responsivo, descarte de renders obsoletos `ST_RENDER`, protección ante claves inscritas desconocidas y ajustes de conteo |
| `tests/test_upibi.py` | Regresión del simulador y escenario parcial, ajuste del punto de extracción de `montarGrafica` |
| `docs/ANALISIS-ACADEMICO.md` | Contrato de simulador y limitaciones |

Meta: R créditos pendientes / H periodos enteros positivos. Mostrar créditos necesarios, comparación (R/H)/ritmo - 1 si ritmo>0, carga autorizada **actual**, carga mínima y periodo final inferido. “Cabe por créditos; falta comprobar seriación y oferta”, nunca garantía de viabilidad. R=0 no añade semestre; R desconocido no inventa cálculo. Con simulación activa, inicia después del semestre simulado y deshabilita incluir el actual. Guardar preferencias por carrera en el almacén existente, mediante IPNT.set.

El panel funciona incluso sin notas si hay saldo oficial. El input actualiza el resultado sin volver a dibujar todo el gráfico. Tarjeta “Créditos del escenario” evita aparentar resultado garantizado. Conteo proyectado rotulado aproximado según contador SAES y consistente entre escenarios con igual fecha final.

Si una materia inscrita no existe en el plan, se informa. Con simulación activa se anula el saldo final proyectable porque el escenario está incompleto. Esto detectó las claves A213/A318 del alumno Biomédica. No arreglarlo con alias inferidos por nombre.

Etapa D no implementada: presupuesto semanal de tiempo, horas presenciales, choques/huecos, trabajo/traslado/descanso opcionales. No inferir horas de estudio usando una constante universal por crédito ni evaluar salud. Seguir el plan si se autoriza esa siguiente entrega.

## 8. Equivalencias: investigación completa, aún no integrada

Fuente: https://www.saes.upibi.ipn.mx/Academica/Equivalencias.aspx. El usuario abrió el apartado y pidió revisar todas las correspondencias, insistiendo en conservar planes. Captura mediante selectores visibles del navegador, solo lectura. No usar endpoints internos ni alterar SAES.

Se revisaron cinco carreras × cuatro planes en ambos extremos = 400 combinaciones, más especialidades = 625 contextos distintos. Biotecnológica 24: tronco común, G, P. Biotecnológica 99: sin especialidad, E, G, P. Algunos pares carrera/plan tienen especialidad vacía; se conservaron como consultas sin opciones. Se guardaron únicamente tablas y filtros académicos.

| Resultado | Conteo |
|---|---:|
| Consultas | 625 |
| Consultas con filas | 127 |
| Filas incluyendo repeticiones | 1,487 |
| Relaciones dirigidas únicas | 1,494 |
| Relaciones dirigidas sin inversa explícita | 18 |
| Orígenes con múltiples destinos en un mismo contexto destino | 27 |
| Claves con descripciones literales distintas | 67 |

Las 67 no son 67 errores: pueden incluir abreviaturas/acentos o cambios reales de materia entre planes. No hubo nombres contradictorios para una misma identidad completa en la captura. Flechas: → izquierda a derecha; ← al revés; ← → ambos. No añadir inversas ni transitividad que no estén registradas.

El SAES actualiza asíncronamente sus filtros. Se detectó una tabla transitoria con prefijo incompatible y se reconsultó/corrigió. Se verificaron filtros solicitados frente a leídos, contextos únicos, prefijos de carrera o especialidad y consistencia de descripciones. Un selector con el valor nuevo no basta por sí solo para demostrar que terminó de cargar la tabla.

### 8.1 Casos confirmados en pantalla

* Ambiental 06 ↔ Biomédica 06: A106 ↔ M106, A213 ↔ M212, A318 ↔ M324. Explica las claves de Inglés en un horario de otra carrera. Conservar clave original.
* Ambiental 06 A213 ↔ Biotecnológica 24 B408: Inglés II sí tiene relación explícita entre planes. La diferencia de créditos (3 frente a 4.5 en mapas disponibles) no invalida automáticamente la tabla. Mi propuesta inicial de limitar todo Inglés a 2006 resultó demasiado restrictiva; no implementarla.
* Ambiental 06 A105 aparece equivalente a B104 Física del movimiento **y** B105 Laboratorio de Física del movimiento de Biotecnológica 24. Puede ser una equivalencia conjunta; no elegir una arbitrariamente ni acreditar ambas sin aclarar la regla.
* Biotecnológica 99, especialidad E: E739 Administración de la producción ↔ Farmacéutica 06 F101 Biología celular. Relación sospechosa reconsultada y confirmada en pantalla. Requiere aclaración institucional antes de automatizar. Captura recortada adjunta.

### 8.2 Condiciones para implementación posterior

Identidad: unidad + carrera + plan + especialidad + clave. El prefijo no identifica el plan, y especialidades 99 usan E/G/P. El lector actual guarda el plan del alumno, pero no el plan/especialidad de origen de cada materia externa en sus listas. Obtener ese contexto de oferta u otra fuente explícita antes de resolver. Nombre puede detectar una incompatibilidad, pero no sustituye el plan.

Preservar datos originales y derivar vínculos. Usar créditos del destino para avance del plan; conservar origen aparte. No confundir catálogo de equivalencias con reconocimiento en expediente ni autorización para inscripción. Tabla vacía significa “sin equivalencias mostradas para esta consulta”, no imposibilidad legal de otro trámite. No inferir equivalencias entre unidades académicas.

**Advertencia de scratch:** `work/ingles_alias.py` es un borrador que nunca se ejecutó. Su propuesta de alias amplios por nombre/créditos quedó descartada por la investigación oficial. No ejecutarlo. Tampoco volver a ejecutar los scripts mutadores `analitica_a.py`, `analitica_b.py`, `analitica_c.py`, `analitica_final.py` o sus scripts de tests: ya se aplicaron y podrían duplicar código.

## 9. Pruebas y revisión visual

Al preparar el handoff se ejecutaron nuevamente 18 pruebas con resultado OK y diff check sin errores. Durante la implementación se construyeron UPIITA, ESCOM y UPIBI, se verificó sintaxis de scripts ejecutables y se revisaron páginas sin errores de consola.

QA con perfiles ficticios: escritorio y ancho 390 px; UPIBI claro/oscuro; UPIITA/ESCOM; sin perfil; con saldo y sin notas; simulación activada; cambio de periodos y opción incluir semestre. En móvil UPIBI no había desbordamiento horizontal. El promedio oficial y el ritmo histórico permanecían iguales al simular, mientras cambiaban saldo y origen. Las páginas QA son clones ignorados con almacén en memoria, no escriben en el perfil real.

Los scripts `work/qa_analitica.py` y `work/qa_vacios.py` generan clones QA ficticios y sí pueden regenerarse. El navegador usado en esta sesión fue el de Codex; no asumir que sus IDs de pestaña o la sesión SAES seguirán disponibles en Claude. El servidor local 8080 sirve `web`; verificar que siga activo antes de usarlo.

Comandos PowerShell desde el repo:

```powershell
git -c safe.directory=D:/Documents/Development/UPIITA_DEV status --short
$env:UNIDAD='upiita'
python tools/build_horarios.py
$env:UNIDAD='escom'
python tools/build_horarios.py
$env:UNIDAD='upibi'
python tools/build_horarios.py
python -m unittest discover -s tests -p 'test_*.py'
git -c safe.directory=D:/Documents/Development/UPIITA_DEV diff --check
```

Los avisos Git de conversión CRLF/LF no fueron fallos. No tratar las salidas `web/*.html`/`web/dist` como fuentes ni añadirlas al commit. Cerrar C con revisión final y commit pequeño cuando se retome implementación; no push.

## 10. Artefactos y orden de continuación

Los artefactos de entrega están versionados en `docs/handoff-upibi/` de la rama `codex/upibi`. Claude puede leerlos directamente del repositorio, sin descargar ni mover archivos. El parche es un snapshot del código sin commit, no debe aplicarse sobre este mismo checkout.

| Artefacto | Contenido |
|---|---|
| [PLAN-ANALITICA-SAEs.md](PLAN-ANALITICA-SAEs.md) | Plan A–D, decisiones, pruebas y bibliografía |
| [UPIBI-informe.md](UPIBI-informe.md) | Fuentes, seis mapas y diferencias PDF/SAES |
| [ANALISIS-EQUIVALENCIAS-UPIBI.md](ANALISIS-EQUIVALENCIAS-UPIBI.md) | Hallazgos y resolución segura |
| [equivalencias-upibi-saes.json](equivalencias-upibi-saes.json) | Las 625 consultas con filtros y filas, fuente y fecha |
| [especialidades-upibi-saes.json](especialidades-upibi-saes.json) | Inventario de opciones por contexto |
| [equivalencias-upibi-filas.csv](equivalencias-upibi-filas.csv) | Filas brutas para inspección |
| [equivalencias-upibi-analizadas.json](equivalencias-upibi-analizadas.json) | Relaciones dirigidas deduplicadas, destinos múltiples y claves reutilizadas |
| [equivalencia-saes-requiere-revision.png](equivalencia-saes-requiere-revision.png) | Evidencia académica recortada de relación sospechosa |
| [cambios-pendientes-etapa-C.patch](cambios-pendientes-etapa-C.patch) | Snapshot del diff actual sobre HEAD 3b6928a |
| `README.md` | Índice con enlaces relativos a los documentos y datos |

Orden recomendado: comprobar rama y cambios presentes; leer plan y documentación vigente; revisar/confirmar etapa C sin tocar tooltips; acordar estrategia de origen/planes para equivalencias; integrar solo relaciones verificadas y resolubles con pruebas; dejar reglas múltiples/sospechosas pendientes de aclaración; no comenzar D ni trámites administrativos por iniciativa propia.

Pendientes externos: duración normativa UPIBI y cómputo de bajas; significado administrativo de cursados/disponibles; códigos REC por unidad; obligatoriedad de aristas; reglas de equivalencia conjunta; anomalía E739/F101; discrepancia B706 y revisión de categorías. Desactivar únicamente la afirmación que depende del dato faltante, no inventar una solución.


## 11. Ubicación versionada

Este handoff y todos sus anexos están en `docs/handoff-upibi/`. El commit de documentación no incluye los tres archivos de implementación pendientes. HEAD puede ser posterior a 3b6928a por este commit; 3b6928a sigue siendo la base del parche de etapa C. Los scripts temporales de `work/` citados arriba estaban fuera del repositorio y no son necesarios para continuar: los cambios aplicados ya están en las fuentes y la captura completa está en esta carpeta.
