# Diferencias del SAES entre unidades

Observaciones de sesiones reales de alumno, en modo de solo lectura y registrando únicamente la estructura (ids,
encabezados y formas), sin datos personales.

| Aspecto | UPIITA | ESCOM (2026-10-02, semestre en curso) |
|---|---|---|
| Prefijo de ids | `ctl00_mainCopy_…` | `mainCopy_…` (se buscan por terminación: `[id$="mainCopy_X"]`) |
| Horarios de clase (grid) | `ctl00_mainCopy_dbgHorarios` | `mainCopy_dbgHorarios`; trae Edificio y Salón |
| Mapa curricular | GridView1 | GridView1 con columna extra «No periodo» |
| Kárdex | `Lbl_Kardex`: tablas por semestre, Clave, Materia, Fecha, Periodo, Forma Eval., Calificación | Igual |
| Cita de reinscripción | Tablas encabezado/valor; `Lbl_General` con BOLETA y NOMBRE | Mismas tablas; `Lbl_General` sin boleta (la boleta está en un renglón «BOLETA:») |
| Estado general | `GV_Reprobadas` (clave, periodo, veces) | Tres secciones con título: **MATERIAS REPROBADAS**, **MATERIAS NO CURSADAS** (`GV_Adeudadas`: No_Periodo, Materia, Descripción, Periodo_escolar vacío, Veces) y **MATERIAS DESFASADAS** |
| Horario del alumno | `GV_Horario` (Lunes…Sábado) | `GV_Horario` (Lunes…Viernes) |
| Claves | Letra + 3 dígitos | Letra + 3 dígitos; algunas optativas con letras y un dígito |

## Consecuencias

- **Modelo por semestres (ESCOM, Energía):** el propio SAES calcula las materias no cursadas y las desfasadas
  (con su semestre). El Lector las lee tal cual (`no_cursadas`, `desfasadas_saes`), así que no hay que
  reconstruir la regla de desfase.
- El Lector funciona en cualquier `saes.<unidad>.ipn.mx` y marca la unidad en los datos (`unidad`). La versión
  UPIITA de la herramienta rechaza datos de otra unidad con un aviso.
- Pendiente con alumnos inscritos de otras unidades: comparar la Cita de reinscripción con fechas vigentes y
  un Estado general con desfasadas.
