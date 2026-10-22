# R6-FIL · Filtros de Horarios

Alcance: análisis y maquetas estáticas del selector de oferta y del generador automático, punto 13e. No se modificó `web/` ni código de SATE. Base observada: `web/horarios.template.html` en la rama `claude/r6-fil`.

## 1. Inventario actual

| Zona | Nombre visible | Qué hace realmente | Código | Valor inicial | Se recuerda |
|---|---|---|---|---|---|
| Oferta | Turno | Limita grupos por turno | `#f-turno`, `filtered()` | Todos (`*`) | Sí, `tur` |
| Oferta | Nivel | Limita por nivel curricular, no semestre | `#f-nivel`, `filtered()` | Todos (`*`) | Sí, `niv` |
| Oferta | Buscar | Busca materia, clave, profesor o grupo; selección crea filtros tipo ficha | `#f-q`, `S.chips`, `filtered()` | Vacío | No |
| Oferta | Ver por: Materia / Grupo | Cambia agrupación, no el conjunto de grupos | `[data-view]` | Materia | Sí, `view` |
| Oferta | Solo las elegidas en el mapa | Limita a materias marcadas en Mi trayectoria; si no hay elegidas, queda desactivado | `#f-want`, `filtered()` | Activado | Sí, `onlyWant` |
| Oferta | Ocultar las marcadas como No | Oculta grupos marcados No y grupos de profesores excluidos; grupos ya agregados quedan visibles | `#f-hide`, `filtered()` | Desactivado | Sí, `hide` |
| Oferta | Solo lo que cabe en mi horario | Muestra grupos compatibles con las materias del horario actual; no significa que el generador vaya a usar solo esos grupos | `#f-fit`, `filtered()` | Desactivado | No |
| Oferta | En la escuela: Llegar desde / Salir a más tardar | Excluye grupos que empiezan antes o terminan después del rango | `#g-from`, `#g-to`, `outWin()` | Sin límites | Sí, `gtime.a/b` |
| Oferta | Excluir profesores | Excluye grupos con coincidencia parcial normalizada; también equivale a marcarlos No | `#g-avoid`, `isExcl()` | Vacío | Sí, `excl` |
| Oferta | Quitar hueco | Filtro generado al pulsar un espacio del calendario; muestra grupos que cubren ese intervalo | `S.gap`, `fits()` | Ninguno | No |
| Oferta | Marcas Sí / Quizá / No | Sí y Quizá ordenan preferencias; No excluye. No son filtros directos hasta activar “Ocultar…” o generar | botones `data-mark`, `score()` | Sin marca | Sí, por horario |
| Generador | Turno preferido | Limita el turno de grupos candidatos aunque el selector de oferta use otro turno | `[data-gt]`, `bad()` | Cualquiera | No |
| Generador | Priorizar profesor | Sube puntuación de grupos con coincidencia parcial de profesor | `#g-pref`, `S.gpref`, `pscore()` | Vacío | No |
| Generador | Menos tiempo libre entre clases | Prioriza menos huecos entre clases y penaliza días ocupados; no impone un límite duro | `#g-compact`, `score()` | Activado | No |
| Generador | Días a la semana | Máximo de días para la combinación; “Sin límite” no excluye días | `#g-days`, `GT.days` | Sin límite | Sí, `gtime.days` |
| Generador | Base para generar: Filtros de la oferta | Toma los grupos visibles tras filtros aplicables. Ignora “Solo lo que cabe” y el hueco; aplica sus propias reglas de turno | `#g-src`, `generate()` | Filtros de la oferta | Sí, `gtime.src` |
| Generador | Base para generar: Todas las elegidas | Usa todas las materias elegidas y sus grupos, sin filtros de oferta; sí conserva marcas No y profesores excluidos | `#g-src`, `generate()` | Filtros de la oferta | Sí, `gtime.src` |
| Generador | Materias por horario | Automático elige tamaño según carga; Todas intenta incluir todas; número fijo genera ese tamaño si es menor al conjunto elegible | `#g-n`, `generate()` | Todas | Sí, `gtime.n` |
| Generador | Descansos | Exige intervalo libre mínimo dentro de ventana y días seleccionados; permite varios descansos | `#gbreaks`, `breaksOk()` | Ninguno | Sí, `gtime.breaks` |
| Horario | Mostrar fin de semana | Amplía el calendario mostrado, no filtra la oferta ni genera grupos de fin de semana | `#f-weekend` | Desactivado | Sí, `weekend` |

### Confusiones y solapamientos

- **“Solo lo que cabe en mi horario”** y **“Filtros de la oferta”** parecen equivalentes. El primero revisa choques contra el horario actual; la segunda base alimenta al generador y respeta turno, nivel, búsqueda, materias, profesor excluido y rango en escuela, pero desactiva “Solo lo que cabe” y el filtro de huecos.
- **Turno / Turno preferido** duplican el criterio con alcances distintos y persistencia distinta. La etiqueta “preferido” sugiere una prioridad, aunque el código lo usa como exclusión estricta.
- **Solo las elegidas en el mapa** no cubre materias seleccionadas por el buscador; el texto es más estrecho que su implicación. Además el generador, sin ese filtro, limita materias a las elegidas en trayectoria si existen.
- **Ocultar las marcadas como No** también oculta profesores excluidos. “Excluir profesores” produce el mismo efecto para esos grupos y además el generador lo respeta aunque el ocultamiento esté apagado.
- **Nivel** puede leerse como semestre. Para planes por nivel es literal; la tabla y opciones dependen del mapa de la carrera.
- **Materias por horario: Todas** no quiere decir todas las elegidas necesariamente: la cantidad se aplica al conjunto final de materias candidatas y hay materias obligatorias que se agregan aparte.
- **Menos tiempo libre** oculta su efecto secundario en días ocupados. “Generar” no muestra qué filtros se aplicaron salvo mensajes de resultados vacíos.
- **Restablecer filtros** también borra preferencias del generador y todas las marcas, pero no horarios. El nombre promete un alcance menor o ambiguo.
- Las fichas activas muestran materia/profesor/grupo, exclusiones y hueco, pero no turno, nivel, rango horario, opción de mapa, grupos No ni filtros del generador. El estado efectivo queda repartido.

## 2. Direcciones propuestas

**A · Grupos con filtros activos.** Conserva la barra compacta, pero separa “Oferta” de “Cómo se arma el horario”; los criterios aplicados aparecen como fichas removibles y un solo botón quita filtros. Turno y nivel se describen como límites de resultados. Recomendada para continuidad con la pantalla actual.

**B · Preguntas de planeación.** Panel lateral en escritorio y panel plegable en móvil. Preguntas cortas (“¿Qué materias?”, “¿En qué turno?”, “¿A qué hora?”) unen cada control con su efecto. El generador expone el origen de grupos y criterios propios. Hace más explícitos los alcances, con mayor recorrido vertical.

**C · Resumen de resultados.** Barra superior “Mostrando N de M grupos”, resumen textual de restricciones y enlace “¿Por qué?” por cada resultado. Las opciones menos frecuentes van a “Más filtros”. Reduce controles expuestos y hace legible el impacto, pero requiere mantener conteos explicables.

Las tres páginas HTML son archivos autocontenidos, con tokens `--ipn-*`, interruptor de tema y tamaños 1440/375 CSS. Son maquetas de presentación, no conectadas a datos ni al comportamiento real.

## 3. Verificación y pendientes

Revisión estática de los controles, valores iniciales, lecturas/escrituras de almacenamiento y funciones `filtered()`, `generate()` y `breaksOk()` en `web/horarios.template.html`; captura revisada: `cupos_desbordados.png`, donde la barra y “Más filtros” concentran controles heterogéneos en una línea larga. No se compilaron páginas ni se ejecutaron pruebas: este encargo no modifica la aplicación, y R4 §6 prohíbe la automatización de navegador. Las maquetas deben elegirse/revisarse antes de convertirlas en cambios de SATE.
