# Handoff UPIBI a Claude

Lee primero [HANDOFF-CLAUDE-UPIBI.md](HANDOFF-CLAUDE-UPIBI.md). Trabaja en `codex/upibi`; no publiques ni hagas push.

## 1. Documentos

* [Handoff completo](HANDOFF-CLAUDE-UPIBI.md)
* [Plan de analítica A–D y bibliografía](PLAN-ANALITICA-SAEs.md)
* [Informe de integración UPIBI](UPIBI-informe.md)
* [Análisis de equivalencias entre carreras, planes y especialidades](ANALISIS-EQUIVALENCIAS-UPIBI.md)

## 2. Evidencia y datos académicos

* [Captura de 625 consultas SAES](equivalencias-upibi-saes.json)
* [Inventario de especialidades](especialidades-upibi-saes.json)
* [Filas de equivalencias en CSV](equivalencias-upibi-filas.csv)
* [Relaciones analizadas y casos múltiples](equivalencias-upibi-analizadas.json)
* [Evidencia recortada de relación que necesita revisión](equivalencia-saes-requiere-revision.png)

## 3. Código pendiente

[Snapshot de etapa C](cambios-pendientes-etapa-C.patch), sobre base `3b6928a`. Los cambios ya están en el checkout compartido: no aplicar de nuevo el parche. Esta carpeta contiene documentación y datos institucionales; no incluye expedientes del alumnado.
