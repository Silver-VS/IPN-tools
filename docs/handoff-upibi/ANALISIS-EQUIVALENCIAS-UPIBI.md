# Análisis de equivalencias UPIBI

## 1. Alcance y evidencia

Consulta del 3 de octubre de 2026 al [apartado de equivalencias del SAES](https://www.saes.upibi.ipn.mx/Academica/Equivalencias.aspx). Se recorrieron cinco carreras, cuatro planes (06, 14, 24, 99) y todas las especialidades que expone cada selector. Las 400 combinaciones iniciales se amplían a 625 al incluir Biotecnológica 24 (tronco común, G y P) y Biotecnológica 99 (sin especialidad, E, G y P). Algunos pares carrera/plan tienen el selector de especialidad vacío; se consultaron igualmente y se conserva ese estado.

Solo se guardaron filtros y tablas académicas. No se guardaron datos del alumno ni credenciales. Cada consulta comprueba sus filtros; las filas comprueban los prefijos de ambas carreras. Estas verificaciones no certifican que el catálogo institucional sea completo ni que esté libre de errores.

## 2. Resultados

| Medida | Resultado |
|---|---:|
| Consultas | 625 |
| Consultas con filas | 127 |
| Filas capturadas, incluyendo repeticiones | 1487 |
| Relaciones dirigidas únicas | 1494 |
| Relaciones sin inversa explícita en la captura | 18 |
| Orígenes con múltiples destinos en un mismo contexto de destino | 27 |
| Claves con descripciones distintas | 67 |

La flecha se interpreta conforme a su orientación en pantalla: → de la columna izquierda a la derecha; ← al revés; ← → en ambos sentidos. Las filas repetidas de consultas inversas se deduplican como relaciones dirigidas. No se crean relaciones por transitividad. Una consulta vacía significa que esta pantalla no mostró equivalencias para sus filtros, no que un trámite individual sea imposible.

### Filas por planes de ambos extremos

| Plan izquierda | Plan derecha | Filas |
|---|---|---:|
| 06 | 06 | 522 |
| 06 | 14 | 141 |
| 06 | 24 | 141 |
| 06 | 99 | 109 |
| 14 | 06 | 141 |
| 24 | 06 | 141 |
| 99 | 06 | 91 |
| 99 | 99 | 201 |

## 3. Inglés: caso confirmado

Ambiental 06 y Biomédica 06 muestran A106 ↔ M106, A213 ↔ M212 y A318 ↔ M324. La correspondencia incluye planes y especialidades de ambos extremos. No se extiende automáticamente a 14, 24, 99 ni a otra carrera.

### Ejemplos de claves reutilizadas

| Clave | Carrera / plan / descripción mostrada |
|---|---|
| B107 | B / 06 / INGLES I<br>B / 14 / QUÍMICA INORGÁNICA PARA BIOINGENIEROS<br>B / 24 / QUÍMICA GENERAL<br>B / 99 / TALLER DE COMUNICACION |
| A101 | A / 06 / BIOTECNOLOGIA Y SOCIEDAD<br>A / 14 / CALCULO DIFERENCIAL E INTEGRAL<br>A / 99 / BIOLOGIA |
| A103 | A / 06 / CALCULO DIFERENCIAL E INTEGRAL<br>A / 14 / FISICA PARA BIOINGENIEROS<br>A / 99 / FISICA |
| A104 | A / 06 / COMUNICA. Y SIST. DE INFORMACION (TALLER)<br>A / 14 / INGLES I<br>A / 99 / LAB. DE CIENCIAS BASICAS |
| A105 | A / 06 / FISICA DEL MOVIMIENTO APLICADA<br>A / 14 / LABORATORIO DE FÍSICA<br>A / 99 / MATEMATICAS I |
| A106 | A / 06 / INGLES I<br>A / 14 / LÓGICA Y COMUNICACIÓN<br>A / 99 / QUIMICA GENERAL |
| A107 | A / 06 / PROGRAMACION (TALLER)<br>A / 14 / QUÍMICA INORGÁNICA PARA BIOINGENIEROS<br>A / 99 / TALLER DE COMUNICACION |
| A209 | A / 06 / ALGEBRA VECTORIAL<br>A / 99 / ETICA |
| A211 | A / 06 / ESTADISTICA<br>A / 99 / PROGRAMACION |
| A212 | A / 06 / FISICA DE LA ENERGIA APLICADA<br>A / 99 / QUIMICA AMBIENTAL I |
| A213 | A / 06 / INGLES II<br>A / 99 / QUIMICA ORGANICA |
| A318 | A / 06 / INGLES III<br>A / 99 / QUIMICA AMBIENTAL II |

Los 67 casos cuentan descripciones literales diferentes, no 67 errores: puede haber cambios de nombre, acentos o abreviaturas. Al comparar la identidad completa de cada extremo, no aparecen dos descripciones distintas para una misma identidad en esta captura.

### Casos reconsultados en pantalla

| Caso | Evidencia | Consecuencia |
|---|---|---|
| Ambiental 06 A105 → Biotecnológica 24 | Apunta a B104 Física del movimiento y B105 Laboratorio de Física del movimiento, ambos con flecha bidireccional | Posible equivalencia conjunta. No elegir arbitrariamente un destino ni acreditar ambos sin aclarar la regla. |
| Ambiental 06 A213 ↔ Biotecnológica 24 B408 | Inglés II aparece expresamente en la tabla | Sí pueden existir vínculos entre 2006 y 2024. Hay que consultar la relación exacta; no generalizar a Inglés I o III. |
| Biotecnológica 99, especialidad E, E739 ↔ Farmacéutica 06 F101 | Administración de la producción aparece vinculada a Biología celular | Relación sospechosa confirmada en pantalla; requiere aclaración institucional. No corregir ni usar automáticamente por cuenta propia. |

La tabla de equivalencias no incluye créditos. Deben obtenerse por separado del mapa correspondiente a cada extremo. En los mapas disponibles, Inglés de 2006 tiene 3 créditos y el de Biotecnológica 2024 tiene 4.5; esa diferencia no invalida por sí sola una relación que el catálogo muestra.

## 4. Resolución segura para el perfil

La identidad de una materia debe ser `(unidad, carrera, plan, especialidad, clave)`. El prefijo de la clave no identifica su plan; las especialidades de Biotecnológica 99 usan también claves E, G y P. La captura actual del lector conserva el plan del alumno, pero sus listas de acreditaciones y el horario inscrito no conservan el plan y la especialidad de cada materia externa. Ese dato faltante impide aplicar todas estas relaciones con certeza. El nombre puede detectar incompatibilidades, pero no sustituye el plan de origen.

1. Conservar el registro original del SAES y construir una correspondencia derivada, sin reescribir el kárdex.
2. Resolver primero las materias identificadas dentro del plan del alumno. Para una clave externa, exigir su contexto de origen obtenido de la oferta o de otra fuente explícita.
3. Filtrar relaciones por el destino exacto del alumno y respetar dirección y especialidad. Si no hay una relación, mostrar “sin correspondencia verificada”.
4. Si quedan varios destinos, mostrar la relación múltiple y no elegir uno por similitud del nombre. Puede requerirse un conjunto de materias. Si varios registros se vinculan a un mismo destino, evitar doble conteo de créditos y conservar la procedencia.
5. Usar los créditos de la materia del plan de destino para su avance; conservar aparte los créditos de origen cuando existan. Una equivalencia no implica igualdad de créditos.
6. Separar “equivalencia registrada en catálogo” de “acreditación reconocida en el expediente”. Tampoco demuestra cupo, horario compatible o autorización para inscribirla.

## 5. Validación y decisiones pendientes

Los archivos adjuntos contienen todas las consultas, las filas en CSV, las relaciones dirigidas deduplicadas y los casos con destinos múltiples. Antes de integrarlos al sitio hay que ampliar la identificación del origen de cada materia externa, comprobar la lectura de las flechas con Gestión Escolar si se usa para recomendaciones de inscripción y establecer cómo tratar equivalencias de varias materias o especialidades. No se ha modificado el funcionamiento del sitio ni se ha publicado esta captura.

Se corrigió una lectura transitoria detectada por un prefijo incompatible con los filtros; su reconsulta confirmó el resultado correcto. Se validaron 625 combinaciones sin duplicar contextos, coincidencia entre filtros solicitados y leídos, prefijos de carrera o especialidad, direcciones reconocidas y consistencia del nombre de cada identidad completa. Los estados vacíos no se descartan.

Pruebas para la implementación: aislamiento entre planes; clave reutilizada B107; relación solo en un sentido; especialidad desconocida; varios destinos; doble acreditación del mismo destino; ausencia de tabla; conservación de la clave original; créditos de origen y destino distintos.
