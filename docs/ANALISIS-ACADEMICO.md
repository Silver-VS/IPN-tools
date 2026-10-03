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
