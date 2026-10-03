# Plan ejecutable: analítica académica SAES

## 1. Encargo y límites

Trabaja en `D:\Documents\Development\UPIITA_DEV`, rama `codex/upibi`. Lee `AGENTS.md`. Implementa por etapas pequeñas; no publiques, no ejecutes publicar.sh y no hagas push. Conserva los cambios previos: encabezado institucional, selector de unidad, filas curriculares, proyección por semestre y corrección responsiva de tooltips en `montarGrafica`.

No repitas la investigación. Este documento fija el alcance y las decisiones. Verifica solamente los puntos señalados como pendientes. No agregues dependencias, backend, modelos de ML ni refactorizaciones generales. Respeta almacenamiento mediante IPNT.set y aislamiento por unidad. Usa perfiles ficticios; no guardes nombres, boletas, horarios personales ni kárdex reales en archivos o logs.

Objetivo: corregir interpretaciones engañosas y datos ausentes, después incorporar un simulador de créditos por fecha objetivo. No construir todavía un optimizador multisemestral ni un predictor de salud o de calificaciones.

## 2. Archivos y puntos de entrada

| Archivo | Funciones o responsabilidad |
|---|---|
| `web/horarios.template.html` | `simKardex`, `promEstimado`, `plazoReferencia`, `proyeccionCreditos`, `statsDatos`, `renderStats`, `analisis`, `renderAnalisis`; revisar `tr`, `perMeta`, `FORMAS` y gráficos consumidores |
| `tools/lector_saes.js` | Extracción, formas originales, apartados ausentes y claves; hoy filtra acreditaciones con nota >= 6 |
| `tools/build_horarios.py` | Construcción de las tres unidades |
| `tests/test_upibi.py` | Patrón existente de unittest y ejecución de funciones JS con Node; extender sin crear infraestructura nueva |
| `docs/ANALISIS-ACADEMICO.md` | Actualizar contratos, fórmulas, limitaciones y mensajes finales |
| `data/unidades/upibi/` | Consultar planes y correspondencias; no inventar equivalencias |

Las líneas cambian: localiza las funciones por nombre. Edita plantillas/fuentes, nunca solamente HTML generado.

## 3. Decisiones de producto acordadas

### 3.1 Ordinario, extraordinario e intento inicial

El usuario aclara que ORD y EXT pertenecen a la primera inscripción/cursada; recuperaciones posteriores se identifican como ETS o recursamiento. Incorporar esta semántica y verificar cómo la expresa cada unidad en el registro original. No confundir primera cursada con primera evaluación: un extraordinario puede seguir a un ordinario no aprobado en la misma cursada.

Conservar el desglose ORD/EXT/ETS/REC y códigos de equivalencia reconocidos. No penalizar automáticamente EXT o ETS en recomendaciones. Si se presenta un agregado de primera cursada, incluir ORD + EXT, no solo ORD, y restringir su denominador a acreditaciones cuya forma esté identificada y sea aplicable. Explicar exclusiones y n. Nunca llamarlo tasa de aprobación de todo lo inscrito: faltan los intentos/materias aún no acreditados.

Si no puede confirmarse que el código distingue recursamientos en una unidad, conservar allí el desglose literal y omitir el agregado de primera cursada. No bloquear las demás etapas por esto. Ejemplo ficticio: ORD=6, EXT=2, ETS=1, REC=1 implica ordinario=60% y primera cursada=80% de esas diez acreditaciones, no 80% de todas las inscripciones históricas.

### 3.2 Sin datos nunca equivale a 10

El usuario reporta materias/áreas no cursadas mostradas con 10. Es un defecto reportado, no una causa ya identificada. Reproducir y rastrear cálculo y renderizado, incluyendo transferencias de promedios de prerrequisitos u otras áreas y valores de simulación. No asumir que hay un literal `||10`.

Contrato: sin observaciones válidas => media null, n=0, texto “Sin datos” o celda ausente. No 0, 7, 8 ni 10 por defecto. Un área sin materias propias acreditadas no puede recibir la media de sus prerrequisitos como si fuese desempeño observado del área. Si se conservan antecedentes relacionados, mostrarlos separados con las materias fuente. Simulaciones explícitas pueden mostrar notas, siempre identificadas como simuladas y sin contaminar el historial real.

## 4. Etapas de implementación

### Etapa A. Datos ausentes, formas de acreditación y mensajes injustificados

1. Reproducir el área vacía con 10 usando un perfil ficticio. Cubrir también área vacía cuyos prerrequisitos de otra área tengan 10. Corregir el origen y agregar regresión.
2. Normalizar notas con comprobación de null/vacío antes de conversión numérica y de finitud después. No convertir null en 0. Mantener n coherente con las observaciones utilizadas.
3. Aplicar la clasificación de formas de 3.1. No adivinar qué significan códigos desconocidos; mostrar “No identificada”. Distinguir ausencia de datos de lista vacía confirmada.
4. Retirar `pred`, las penalizaciones -.4/-.5/-.6 y “calificación esperada”, “Riesgo alto” y “afinidad” como inferencias personales. No reemplazarlo con nuevos umbrales arbitrarios.
5. Convertir recomendaciones en hechos: materia pendiente/reprobada, requisito pendiente verificado y materias que desbloquea. No generar “Atención” simplemente porque `motivos.length > 0`. Sin evidencia, no afirmar “sin riesgo”.
6. Cambiar afinidad por antecedentes académicos relacionados, con fuentes y n, o suprimir la tarjeta si no aporta información. No atribuir al área un promedio de materias ajenas.
7. Quitar de carga/rendimiento la regresión y “te va mejor con más/menos carga”. Si se conserva la dispersión, titularla “Créditos acreditados y media de acreditaciones”; sin recomendación causal.

Cierre A: cero notas inventadas, desglose de formas correcto y sin recomendaciones probabilísticas. Se puede entregar independientemente del simulador.

### Etapa B. Coherencia de estadísticas y simulación existente

1. Separar promedio oficial de media de acreditaciones. El histograma, su línea de media, dispersión y n deben usar exactamente el mismo conjunto declarado. No asociar al promedio oficial un delta de otra población.
2. `promEstimado` no puede reconstruir el promedio oficial con `promedio * acreditadas.length` sin conocer su denominador. Mantener promedio oficial y mostrar aparte “Media de acreditaciones del escenario”. No asignar 5 universal a reprobaciones para simular promedio oficial.
3. Materia no reconocida no equivale a créditos 0. Conservarla y marcar créditos desconocidos; el total oficial sigue mostrándose. Suprimir/identificar cálculos parciales dependientes de esos créditos.
4. Conciliar créditos acreditados del historial con total oficial. No inventar periodos para una diferencia. Identificar equivalencias y evitar doble conteo o sumar todas las alternativas de optativas.
5. Simulación: sumar únicamente créditos nuevos acreditados en el escenario; restar esos mismos créditos de pendientes una vez. Curva, tarjetas, proyección y simulador deben usar el mismo saldo. No sumar de nuevo una materia ya acreditada.
6. Distinguir periodos completos observados, cero acreditaciones confirmado, periodo desconocido y semestre en curso. No rellenar huecos con ceros por suposición. Excluir curso incompleto del ritmo base; el escenario puede modificar saldo sin convertirse en evidencia histórica.
7. Si solo hay periodos con acreditaciones y no puede verificarse continuidad, rotular el ritmo como “media de los últimos N periodos con acreditaciones registradas”, con cobertura parcial. No llamarlo últimos tres semestres completos. No presentar precisión estadística ni intervalos de confianza inventados.
8. Mantener proyección por cada semestre, incluido el actual si corresponde al escenario, un solo punto final y corte al completar créditos. Fecha de origen explícita; ningún tramo pasado desconocido debe presentarse como hecho o predicción futura.
9. Renombrar egreso a “Proyección de conclusión de créditos”. El plazo a carga mínima es referencia aritmética, no declaración administrativa. Color/mensaje de excedencia debe identificar qué referencia se supera; advertencia reglamentaria únicamente con plazo confirmado.

Cierre B: datos reales, escenario y proyección diferenciados; consistencia del saldo y explicación de cobertura.

### Etapa C. Simulador mínimo de meta

Integrar junto al avance, con estilos y controles existentes. Entrada: número entero positivo de periodos restantes; indicar si incluye el actual. Mostrar fecha resultante solo cuando el periodo inicial es conocido. Reusar los helpers de periodo; no comparar etiquetas cronológicas como cadenas.

Definiciones: R = créditos faltantes del escenario; H = periodos elegidos; L = carga autorizada aplicable.

- Media necesaria a acreditar: R/H. Es una media, no una combinación exacta de materias.
- Comparación con ritmo observado: (R/H)/ritmo - 1, solo si ritmo > 0 y con su limitación de cobertura.
- Si R/H > L: “Supera la carga autorizada actual si se mantiene en todos esos periodos”. No declarar imposibilidad absoluta ante vías extraordinarias no modeladas.
- Si R/H <= L: “Cabe por créditos; falta comprobar seriación y oferta”. No afirmar viabilidad completa.
- Si la media está bajo carga mínima: mostrar que puede requerir revisar condiciones de inscripción; no invalidar automáticamente la meta ni asumir una excepción.
- Si R=0: “Créditos completos”; no añadir semestre futuro. Si faltan R o L, no inventar valores.
- Conservar secuencias como orientación cuando su carácter obligatorio no esté confirmado. Solo calcular un límite inferior por seriación con aristas estrictas verificadas; no equiparar niveles a semestres.

Ejemplo numérico ficticio: R=198; H=2/3/4/5/6 => 99/66/49.5/39.6/33. Con L=73, H=2 supera ese límite; H=3 no prueba viabilidad. Con ritmo49.5, H=3 requiere33.33% más. Redondeo solo visual; no acumular error.

No recomendar inscribir créditos extra usando una supuesta probabilidad de reprobar. No optimizar automáticamente materias entre futuros semestres en esta etapa.

Cierre C: meta utilizable, límites claros y recalculada inmediatamente al cambiar el escenario.

### Etapa D. Tiempo y sostenibilidad, segunda entrega

Solo después de A-C. Mostrar horas de clase semanales, choques y huecos a partir del horario. No deducir horas de estudio de créditos mediante una constante universal. Entradas opcionales de trabajo, traslado, descanso y otras responsabilidades; no exigir datos de salud.

Presupuesto semanal = 168 - sueño - clases - trabajo - traslados - otras necesidades. Definir categorías excluyentes para no restar dos veces. En choques, distinguir suma de sesiones de tiempo presencial sin superposición. Tiempo de estudio fuera de clase editable, identificado como supuesto. Avisar inconsistencias (suma >168), no diagnosticar agotamiento ni certificar una carga como saludable. No bloquear inscripción por estas estimaciones.

## 5. Pruebas obligatorias

Extender infraestructura existente. Probar funciones reales, no copiar su lógica dentro del test. Unitarias más integración del HTML construido con datos ficticios.

| Caso | Resultado esperado |
|---|---|
| Sin acreditaciones / área vacía / prerrequisitos ajenos con10 | Ningún promedio10 inventado; n=0 y sin datos |
| Una materia propia con10 | Media10, n=1, sin etiqueta de dominio/riesgo |
| Nota null, vacía o no numérica | Excluida, sin transformarla en0 |
| ORD6 EXT2 ETS1 REC1, más forma desconocida/equivalencia | Denominadores explícitos, exclusiones verificadas, sin confundir métricas |
| Falta un apartado SAES | Desconocido, no “ninguno” |
| Clave no encontrada | Materia preservada y créditos desconocidos |
| Simular +12 sobre saldo198 | Saldo186; apagar vuelve a198; sin doble conteo |
| Un cero confirmado y un periodo desconocido | Tratamiento diferente y cobertura visible |
| R198, metas2..6, L73 | Valores de etapa C; H3 no etiquetado viable sin restricciones |
| R0, ritmo0/null, H0/fracción | Sin división inválida; no semestre adicional; validar entrada |
| Cadena recomendada vs estricta; ciclo | Sin mínimo oficial falso ni recursión infinita |
| Cambiar unidad / activar simulación | Sin contaminación entre perfiles o escenarios |

Regresión visual: UPIITA, ESCOM y UPIBI, con y sin perfil ficticio; móvil y escritorio; temas claro/oscuro; tooltips sobre puntos con zoom90% y100%, tras scroll y resize. No modificar `montarGrafica` salvo evidencia de fallo nuevo.

Comandos PowerShell desde el repositorio:

```powershell
$env:UNIDAD='upiita'
python tools/build_horarios.py
$env:UNIDAD='escom'
python tools/build_horarios.py
$env:UNIDAD='upibi'
python tools/build_horarios.py
python -m unittest discover -s tests -p 'test_*.py'
```

Verificar además parseo de scripts ejecutables generados con Node y carga sin errores de consola. Respetar el procedimiento de AGENTS.md. Logs solo ante inconsistencias: etapa, código de diagnóstico y conteos agregados suficientes para reproducir con fixture; nunca expediente personal. No añadir logs por cada render normal.

## 6. Entrega y manejo de bloqueos

Cada etapa: implementar, probar, actualizar `docs/ANALISIS-ACADEMICO.md`, commit pequeño en rama, resumir cambios y limitaciones. No push/publicación. Conservar pruebas existentes.

Pendientes de verificación externa: duración normativa UPIBI y cómputo de bajas; significado de cursados/disponibles; códigos de recursamiento por unidad; equivalencias entre claves; obligatoriedad de cada arista. No inventar respuestas. Ante incertidumbre desactivar únicamente la afirmación dependiente y continuar las demás tareas.

## 7. Referencias y límites de la evidencia

- Reglamento General de Estudios IPN, artículos49 y52: https://www.esm.ipn.mx/assets/files/esm/docs/estudiantes/gestion-escolar/plan-de-estudios/reglamento-general-de-estudios.pdf
- Plan Biomédica: https://www.upibi.ipn.mx/assets/files/upibi/docs/Estudiantes/Gesti%C3%B3n%20Escolar/plandeestudiosdeingenieriabiomedica.pdf
- Huntington-Klein y Gill, carga y rendimiento: https://pmc.ncbi.nlm.nih.gov/articles/PMC7568764/ . No justifica ni reducir automáticamente carga ni diagnosticar sobrecarga por créditos.
- CCRC, momentum: https://ccrc.tc.columbia.edu/publications/momentum-15-credit-course-load.html . Asociación observacional, créditos estadounidenses no transferibles directamente al IPN.
- Creswell et al., sueño y rendimiento: https://doi.org/10.1073/pnas.2209123120 . Asociación poblacional, no modelo individual de notas.
- AASM/SRS: https://www.aasm.org/resources/pdf/adultsleepdurationconsensus.pdf . Referencia general de descanso adulto, no umbral de créditos saludables.

No entrenar predictores ni presentar probabilidades con un solo expediente. Un futuro modelo exigiría datos longitudinales adecuados, validación fuera de muestra y evaluación de calibración y sesgos; está fuera del alcance.
