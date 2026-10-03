> Actualización 2026-10-03, etapa A: el análisis muestra hechos de pendientes y secuencias orientativas, sin notas pronosticadas ni etiquetas de riesgo. Las líneas usan únicamente materias propias acreditadas y se ocultan si no hay observaciones. Notas ausentes o inválidas se excluyen. La correlación no genera consejos de carga. Se conservan ORD/EXT/ETS/REC y se identifican formas desconocidas; ORD no incluye EXT. No se muestra un agregado de primera cursada hasta verificar que la forma distingue recursamientos por unidad. Las equivalencias EQV/REV/DIC se separan del ritmo. El resto del documento histórico queda pendiente de actualización en la etapa B.

# Estadísticas y análisis académico

Qué se puede calcular con los datos que entrega el Lector (kárdex, estado general, cita y horario) y el mapa
curricular de cada carrera. Todo se calcula en el navegador del alumno; nada sale de su equipo.

## Datos disponibles

| Fuente | Datos |
|---|---|
| Kárdex | Por materia acreditada: calificación, periodo y forma de evaluación (ORD ordinario, REC recurse, ETS, EXT extraordinario, EQV equivalencia por cambio de carrera; REV y DIC si aparecen) |
| Estado general | Reprobadas (periodo y veces cursada), no cursadas y desfasadas (planes por semestre) |
| Cita de reinscripción | Promedio oficial (incluye reprobatorias), créditos obtenidos y faltantes, periodos cursados, duración y carga |
| Horario inscrito | Materias en curso |
| Mapa curricular | Créditos, semestre o nivel, seriación, categoría (área de conocimiento), líneas de especialización |

Limitación importante: el kárdex no trae las calificaciones reprobatorias ni los intentos fallidos. Por eso el
promedio oficial (8.42 en un caso de prueba) es menor que la media del kárdex (9.06): cualquier promedio
estimado parte del oficial.

## Implementado (sección «Ver estadísticas»)

| Análisis | Qué responde | Cómo se calcula |
|---|---|---|
| Promedio y tendencia | ¿Voy mejorando? | Promedio oficial; diferencia entre la media del último periodo y la del anterior |
| Dispersión (σ, mediana, n) | ¿Qué tan parejo es mi desempeño? | Desviación estándar muestral de las calificaciones del kárdex |
| % en ordinario | ¿Cuánto paso a la primera? | Materias en ORD entre las no equivalentes |
| Ritmo y egreso estimado | ¿Cuándo termino a este paso? | Media de créditos de los últimos 3 periodos; créditos faltantes ÷ ritmo |
| Avance acumulado | ¿Voy al ritmo del plan? | Créditos acumulados vs. recta del plan (total ÷ duración), con proyección |
| Promedio por periodo | Altibajos por periodo | Media y rango (mínimo–máximo) |
| Distribución | ¿Dónde se concentran mis calificaciones? | Histograma 6–10 con media y mediana |
| Por categoría | ¿En qué áreas me va mejor? | Puntos por materia y media por área de conocimiento |
| Forma por periodo | ¿Cuándo recurrí a ETS/extra? | Barras apiladas por tipo de evaluación |
| Mapa de calor | Área × periodo | Media por celda |
| Materias que conviene cuidar | ¿Qué materia próxima me puede costar? | Calificación esperada = media ponderada de sus requisitos directos (×2), indirectos (×1) o su área; −0.4 por requisito acreditado fuera de ordinario, −0.5 por reprobada en la cadena, −0.6 si ya se reprobó. Cada resultado muestra sus motivos |
| Afinidad con líneas | ¿Qué especialización encaja con mi desempeño? | Media en los requisitos de la línea y en su área (asignada o la predominante de sus requisitos) |
| Ruta crítica | ¿Cuántos periodos me impone la seriación? | Cadena más larga de obligatorias pendientes en el grafo de seriación |
| Carga vs. rendimiento | ¿Me va mejor con más o menos carga? | Créditos vs. promedio por periodo, regresión lineal y correlación r (aviso si hay menos de 5 periodos) |

La **simulación de fin de semestre** alimenta todo lo anterior: cada materia en curso se marca aprobada (con
calificación) o reprobada, y cada reprobada pendiente puede acreditarse por ETS, recurse o extraordinario con
calificación. El promedio estimado = (promedio oficial × materias del kárdex + calificaciones simuladas) ÷ total,
con 5 por cada reprobada simulada.

## Propuestas para siguientes versiones

- **Probabilidad de desfase:** con la regla de dos periodos, qué reprobadas se desfasan si no se acreditan en el
  siguiente periodo y cuántos créditos retienen.
- **Escenarios comparados:** guardar dos o tres simulaciones (p. ej. «ETS de Fisicoquímica» vs. «recursarla») y
  compararlas lado a lado (promedio, créditos, egreso, ruta crítica).
- **Carga recomendada por periodo:** a partir de la relación carga–rendimiento y de las materias a cuidar, sugerir
  cuántos créditos inscribir y cuáles combinar o separar.
- **Profesores:** con datos de varios alumnos (si algún día se agregan de forma voluntaria y anónima) se podrían
  estimar tasas de aprobación por grupo; con datos de un solo alumno no es posible.
- **Horario vs. rendimiento:** relacionar el turno o los huecos del horario inscrito con el promedio del periodo
  (requiere guardar el horario de cada periodo, que hoy solo se lee el actual).
- **Comparación con la cohorte:** percentil del alumno; requeriría estadísticas agregadas que el SAES no publica.
- **Riesgo de baja por tiempo:** periodos disponibles vs. ruta crítica y créditos faltantes (alerta temprana).
