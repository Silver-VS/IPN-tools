# Rutina, tiempo y carga académica (propuesta)

Propuesta para un apartado opcional «Mi semana» en Horarios: el alumno registra su rutina (trabajo, traslados,
descanso, otras responsabilidades) y la herramienta la usa para armar horarios, estimar su tiempo disponible y avisar
de sobrecargas. Continúa la «Etapa D» del plan de Codex (`docs/handoff-upibi/PLAN-ANALITICA-SAEs.md`).

## 1. Qué dice la evidencia

| Factor | Hallazgo | Uso en IPN-tools | Límite |
|---|---|---|---|
| Trabajo remunerado | Hasta ~15 h/semana no se asocia con peor desempeño; más de 15 h, sí (peores calificaciones, más entregas tardías, menor conclusión). En México ~30 % del alumnado trabaja, en promedio 28 h/semana; más de 20 h/semana es factor de abandono, sobre todo por incompatibilidad de horarios. | Aviso cuando trabajo > 15 h y la carga es alta; bloquear horas de trabajo en el generador. | Asociación observacional; no es un límite personal. |
| Traslado | Más tiempo de traslado se asocia con peores calificaciones, menos asistencia y menos horas de estudio; cada 10 min extra reduce ligeramente la permanencia en primer año. | Contar el traslado por cada día en la escuela; preferir horarios con menos días si el traslado es largo. | El efecto se estabiliza después de 15–20 min. |
| Clases temprano | Clases a primera hora se asocian con menos sueño (~1 h), menos asistencia y menor promedio (Yeo et al., *Nature Human Behaviour*, 2023). | Preferencia «no antes de…» y aviso si se combinan clases temprano con traslado largo o trabajo nocturno. | Efecto poblacional. |
| Sueño | Se recomiendan 7 h o más para adultos (AASM/SRS); dormir menos se asocia con peor rendimiento. | Las horas de sueño entran al presupuesto semanal (dato editable, sin preguntar por salud). | Referencia general, no diagnóstico. |
| Huecos y días en la escuela | El alumnado prioriza no tener huecos de más de 3 h ni ir por una sola clase; la evidencia sobre rendimiento es débil. | Preferencias del generador (ya existen «menos tiempo libre» y «días a la semana»). | Comodidad, no predicción. |
| Gestión del tiempo | Asociación positiva moderada con el desempeño (~6 % de la variación); practicar la planeación funciona mejor que solo informarse. | Planear bloques de estudio y ver el tiempo disponible, no solo recibir consejos. | — |
| Carga y avance | Más créditos por periodo se asocian con terminar antes, pero no prueban causalidad (ver referencias de Codex). | Comparar carga con tiempo disponible; nunca recomendar «más carga» por sí sola. | Observacional. |
| Créditos IPN (SATCA) | 1 crédito ≈ 16 h de actividad de aprendizaje; las horas de clase de cada materia vienen del horario. | Horas presenciales desde el horario; el estudio fuera de clase es un supuesto editable (p. ej. 1 h por hora de clase). | No hay constante universal de estudio. |

## 2. Datos que el alumno podría registrar (todo opcional)

- **Trabajo:** días y horario, o horas por semana.
- **Traslado:** minutos de ida y de vuelta (o por día si varía).
- **Descanso:** horas de sueño que quiere conservar.
- **Otras responsabilidades:** cuidado de familiares, deporte, actividades fijas (bloques en el calendario).
- **Estudio:** horas por semana que quiere dedicar fuera de clase (supuesto inicial editable).
- **Preferencias:** no antes de cierta hora, máximo de días en la escuela, hora de comida.

Privacidad: se guarda solo en el navegador y, si inicia sesión, en su propio OneDrive o Google Drive (perfil `ipnt`).
No se envía a ningún servidor ni se comparte de forma individual. No se piden datos de salud ni motivos personales.
Se puede borrar en cualquier momento. El texto de la interfaz debe decirlo de forma breve y visible.

## 3. Cómo se usaría

1. **Generador de horarios:** bloquea trabajo y responsabilidades fijas; agrega el traslado antes y después de cada
   día en la escuela; respeta «no antes de…»; con traslado largo, prioriza menos días en la escuela.
2. **Presupuesto semanal:** 168 h − sueño − clases − traslados (días en la escuela × ida y vuelta) − trabajo − otras
   = tiempo disponible, comparado con el estudio planeado. Categorías excluyentes para no restar dos veces; aviso si la
   suma rebasa 168 h.
3. **Avisos (no bloquean nada):** trabajo > 15 h con carga alta; tiempo disponible menor que el estudio planeado;
   traslado semanal > 10 h; clases antes de las 8:00 con traslado > 60 min; días sin espacio para comer.
4. **Sugeridas:** si el presupuesto no alcanza, se explica y se sugiere una carga menor (sin imponerla).
5. **Historial personal:** guardar un resumen de la rutina de cada periodo para que, con el tiempo, el alumno vea su
   propia relación entre horas de trabajo o traslado y su promedio (tendencia personal, no predicción).

## 4. Sobre «predicciones»

Con el expediente de un solo alumno no se puede entrenar ni validar un modelo predictivo honesto. Lo responsable es:
reglas basadas en la evidencia anterior, explicadas, y la tendencia personal del propio alumno. Un modelo real
requeriría datos agregados de muchos alumnos, consentimiento explícito, anonimización y validación externa; queda
fuera del alcance actual y requeriría autorización institucional.

## 5. Etapas sugeridas

1. **Mi semana + generador:** formulario y bloques en el calendario; el generador los respeta.
2. **Presupuesto y avisos:** barra semanal de horas y avisos en Planeación y en Estadísticas.
3. **Sugeridas según el tiempo:** ajuste explicado de la carga sugerida.
4. **Historial por periodo:** resumen de rutina guardado en el perfil para comparar periodos.

## Fuentes

- Trabajo y desempeño: [Universidad de Edimburgo, 2023](https://careers.ed.ac.uk/sites/default/files/2024-05/Balancing%20work%20and%20university%20life%20%282023%29_0.pdf);
  [VŠE Praga](https://vskp.vse.cz/english/31536); [Nazarbayev University, 2018](https://ie.nu.edu.kz/wp-content/uploads/2020/07/IR-MFF-Issue-01-2018-Does-Combining-Study-and-Work-Affect-NU-Undergraduate-Students_-Academic-Performance.pdf).
- Trabajo en México: [Revista de la Educación Superior (ANUIES)](https://www.scielo.org.mx/pdf/resu/v42n166/v42n166a1.pdf);
  [Guanajuato, deserción](https://sabes.edu.mx/revista-electronica/15/pdfs/2_analisis-de-desercion-escolar-en-el-nivel-de-educacion-superior-una-aproximacion-a-la-realizada-de-la-poblacion-estudiantil-del-estado-de-guanajuato.pdf).
- Traslado: [Politecnico di Milano (arXiv 2407.11893)](https://arxiv.org/pdf/2407.11893); [Tinbergen Institute](https://tinbergen.nl/publication/160488/student-commute-time-university-presence-and-academic-achievement);
  [THE, abandono y traslado](https://www.timeshighereducation.com/node/678306).
- Clases temprano: [Duke-NUS, Nature Human Behaviour 2023](https://www.duke-nus.edu.sg/allnews/early-classes-correlate-with-poor-sleep-and-academic-performance).
- Sueño: [AASM/SRS](https://www.aasm.org/resources/pdf/adultsleepdurationconsensus.pdf); Creswell et al., [PNAS 2023](https://doi.org/10.1073/pnas.2209123120).
- Huecos: [Sheffield Hallam SU, encuesta de horarios](https://www.hallamstudentsunion.com/pageassets/union/publications/Timetabling-Survey-Report-Updated.pdf).
- Gestión del tiempo: [metaanálisis 2025 (resumen)](https://wbgsv0a.gigazine.net/gsc_news/en/20260523-college-students-time-management); [PMC7933620](https://pmc.ncbi.nlm.nih.gov/articles/PMC7933620/).
- Créditos SATCA en el IPN: [formato SIP-30](https://www.ceprobi.ipn.mx/assets/files/ceprobi/docs/02b4221.pdf).
- Carga y avance: ver la sección 7 de `docs/handoff-upibi/PLAN-ANALITICA-SAEs.md`.
