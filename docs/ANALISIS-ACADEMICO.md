# Estadísticas y planificación académica

## 1. Datos y cobertura

El lector conserva acreditaciones con nota >=6; no se dispone de todos los intentos históricos. El promedio oficial del SAES no se reconstruye con el número de acreditaciones. Las formas ORD, EXT, ETS y REC se muestran literalmente; EQV, REV y DIC se separan como equivalencias/revalidaciones/dictámenes. Los códigos desconocidos se identifican y excluyen del porcentaje de ordinarios junto con las equivalencias. El denominador es el conjunto de acreditaciones con forma aplicable conocida, no todas las inscripciones. No se agrega primera cursada sin comprobar por unidad que los recursamientos estén identificados aparte.

Notas ausentes, vacías, no finitas o fuera de6–10 se excluyen. Una clave acreditada se cuenta una vez; se conserva el último registro válido recibido. Sin notas propias no hay promedio de área o línea; no se hereda una nota de otra área. Los gráficos de categorías muestran únicamente observaciones existentes y sus conteos en tooltips.

Créditos desconocidos se conservan como null. Se informa cobertura incompleta, equivalencias no resueltas, periodos desconocidos, duplicados y diferencias respecto al saldo oficial. Nunca se asigna la diferencia a un periodo. Una curva histórica se reconstruye solo con créditos/periodos reconocidos y saldo conciliado. El saldo oficial puede seguir utilizándose para un escenario aun si el detalle histórico es incompleto.

## 2. Estadísticas y escenario

Media, mediana, dispersión e histograma comparten las mismas acreditaciones válidas. El promedio oficial se muestra aparte. El cambio entre medias de periodos es independiente del promedio oficial. La simulación añade materias nuevas una vez y usa el mismo saldo en tarjetas, curva y proyección. Créditos pendientes = pendientes oficiales menos nuevos créditos acreditados del escenario. Una inconsistencia del saldo oficial o exceso de créditos simulados impide proyectar hasta revisar los datos. Los originales no se modifican.

Ritmo = media de hasta tres periodos históricos con acreditaciones registradas o cero confirmado, excluyendo el periodo en curso inferido y los resultados simulados. Los huecos desconocidos no se rellenan con cero. El lector actual no confirma periodos completos vacíos; la cobertura se declara parcial. Se admite opcionalmente `periodos_confirmados: [{periodo:"25/2",creditos:0,completo:true}]` como confirmación explícita, nunca creada por ausencia de registros. Media0 es un dato válido, pero no permite dividir para proyectar.

Proyección: pendientes/ritmo, redondeado hacia arriba. Origen = periodo actual inferido a partir de la planeación o siguiente al último registrado, el posterior de ambos; con simulación, comienza después del semestre simulado. Se identifica como conclusión de créditos, no titulación. Un saldo inicial oficial sin curva conciliada es un ancla de cálculo, no acreditación asignada a ese periodo. Los puntos futuros se cortan al completar créditos.

## 3. Observaciones académicas

Se muestran hechos de adeudos, antecedentes pendientes y secuencias del mapa. No se pronostican notas ni se aplican penalizaciones por forma de acreditación. Las líneas muestran sus materias propias acreditadas, nombres y n; las vacías se ocultan. Las relaciones del mapa no constituyen un mínimo reglamentario de periodos hasta verificar su obligatoriedad. Los ciclos impiden presentar una secuencia. La dispersión de créditos acreditados y medias no representa carga inscrita ni produce recomendaciones causales.

## 4. Referencias de plazo

En UPIBI total/carga mínima es únicamente referencia aritmética. La duración del SAES se informa sin resolver su discrepancia. Los colores señalan la referencia indicada, no una determinación de baja. El conteo de periodos del SAES no prueba por sí mismo cómo se computan bajas autorizadas. Permanecen pendientes duración normativa, equivalencias entre claves y obligatoriedad de aristas.

## 5. Validación

Regresiones con perfiles ficticios en `tests/test_upibi.py`: notas ausentes, línea sin datos con antecedente10, ciclo, saldo del escenario, duplicados, desconocidas, formas, ceros explícitos y origen de proyección. Ejecutar construcciones de UPIITA/ESCOM/UPIBI, parseo de scripts, pruebas y revisión móvil/escritorio de los gráficos y sus tooltips. Los diagnósticos de consola contienen únicamente códigos, conteos agregados y banderas, nunca expedientes personales.

## 6. Simulador de meta

Elegir H periodos enteros positivos e incluir/excluir el actual. Con escenario activo, empieza después del semestre simulado. R es el saldo pendiente del mismo escenario; la media necesaria es R/H y la diferencia frente al ritmo es (R/H)/ritmo -1, calculada solo si ritmo>0. Comparar con carga autorizada actual de SAES, sin asumir que permanecerá igual. Bajo carga mínima se informa la necesidad de revisar condiciones, sin invalidar la meta. Si R=0 no se genera fecha futura; sin saldo consistente no se calcula. No estima probabilidades de aprobar, bienestar ni combinaciones exactas de materias.

El origen se infiere de cita/historial y se declara. Preferencias de meta se guardan por carrera en `hu.<unidad>.meta.<carrera>` mediante el almacén existente. El simulador aparece también sin notas si se dispone de saldo oficial. Tests de metas2–6, carga desconocida, saldo0/null, ritmo0 y semestre incluido/excluido. El presupuesto de tiempo (etapa D) permanece fuera de esta entrega.

El conteo proyectado es aproximado: el contador SAES se ancla al periodo actual inferido para mantener el mismo conteo ante escenarios con la misma fecha final. No resuelve la semántica administrativa del contador. Si hay materias inscritas sin correspondencia, se informa; con escenario activo no se proyecta un saldo final completo a partir de una simulación parcial. Los renderizados asíncronos obsoletos se descartan al cambiar carrera o escenario.

## Vistas de estadísticas (2026-10-03)

Tres vistas en lugar de seis gráficas tradicionales:

- **Tu camino en la carrera:** regla del plan completo (acreditado, en curso o simulado, lo que falta) con marcas de los periodos cursados y de la estimación a tu ritmo; aviso si se rebasa el plazo de referencia.
- **Tu kárdex por periodo:** una columna por periodo (promedio, cambio ▲▼ y créditos) con un cuadro por materia que muestra su calificación, color de 6 a 10 y la forma de evaluación (E, T, R); reúne tendencia, distribución y tipo de evaluación.
- **Tus áreas frente a tu promedio:** barras divergentes respecto a tu promedio de aprobadas.

## Promedio meta (2026-10-04)

«¿Qué promedio quieres alcanzar?»: con el promedio sin reprobadas (n materias acreditadas, suma S) y una meta T, el promedio necesario en k materias es (T·(n+k) − S) ÷ k. Se muestra para las materias en curso (este periodo) y para las obligatorias que faltan (al terminar la carrera); si rebasa 10, se indica a cuánto llegarías con 10 en todas. «Probar en la simulación» asigna calificaciones enteras a las materias en curso que suman lo necesario. El promedio oficial del SAES cuenta también reprobadas que el kárdex no detalla; por eso la meta se calcula sobre el promedio sin reprobadas.

Equivalencias, revalidaciones (incluida la movilidad académica) y dictámenes cuentan en los promedios, áreas y créditos; no entran en el promedio por periodo ni en el ritmo porque el SAES las registra al reconocerlas, no en el periodo en que se cursaron.
