# Discrepancias de créditos

## 1. Escala y regla de compilación

Los datos capturados del SAES se conservan. En la salida, cada materia se representa como `[nombre, cr, nivel, tipo, metadatos]`; `metadatos.cr` coincide con el segundo elemento. `satca` se agrega cuando existe el dato oficial. Ninguna discrepancia oficial sustituye automáticamente el valor del SAES.

Para filas con horas de teoría o práctica mayores que 10 se asume que son horas semestrales. Con un semestre de 18 semanas, T = horas_teoria / 18 y P = horas_practica / 18. Sustituyendo en TEPIC = 2T + P se obtiene `cr = (2 * horas_teoria + horas_practica) / 18`. Se exceptúan las actividades sin créditos (cr = 0) y las filas ya coherentes con TEPIC (cr = 2T + P, tolerancia 0.001), pues las horas altas no bastan para identificar SATCA. Se conserva el crédito original como `satca` y se marca `cr_calculado: true`. La interfaz muestra ≈. No se redondea el dato; solo su presentación. Esta regla no corrige otras inconsistencias de horas o créditos.

Totales, sugerencias y horarios usan `cr`; SATCA es información secundaria. Las cargas y saldos importados del perfil del SAES conservan sus cifras. Las conversiones se registran en CODEX-SALIDA.md y en el log de compilación.

## 2. Diferencias frente al catálogo oficial

Fuente: `data/creditos_oficiales.json` (emparejamiento por nombre y OCR del orquestador). Valores pendientes de decisión del dueño; no constituyen una corrección institucional.

| Unidad | Carrera/plan | Clave | Materia | SAES | TEPIC oficial | SATCA oficial |
|---|---|---|---|---:|---:|---:|
| ESCOM | A/20 | A403 | DESARROLLO DE APLICACIONES PARA ANALISIS DE DATOS | 7.5 | 10.5 | Sin dato |
| ESCOM | A/20 | A405 | ESTADISTICA | 10.5 | 7.5 | Sin dato |
| UPIBI | A/06 | A107 | PROGRAMACION (TALLER) | 3 | 9 | Sin dato |
| UPIBI | A/06 | A433 | METODOS NUMERICOS (TALLER) | 3 | 6 | Sin dato |
| UPIBI | A/06 | A435 | RIESGO E IMPACTO AMBIENTAL (TALLER) | 3 | 6 | Sin dato |
| UPIBI | B/06 | B106 | FISICA DEL MOVIMIENTO | 9 | 6 | Sin dato |
| UPIBI | B/06 | B107 | INGLES I | 3 | 4.5 | Sin dato |
| UPIBI | B/06 | B212 | ESTADISTICA | 6 | 7.5 | Sin dato |
| UPIBI | B/06 | B213 | INGLES II | 3 | 4.5 | Sin dato |
| UPIBI | B/06 | B323 | INGLES III | 3 | 4.5 | Sin dato |
| UPIBI | B/06 | B428 | ELECTROMECANICA DE PROCESOS | 9 | 7.5 | Sin dato |
| UPIBI | B/06 | B645 | BIOSEPARACIONES MECANICAS | 9 | 6 | Sin dato |
| UPIBI | B/24 | B706 | ESTANCIA PROFESIONAL I | 1.5 | 3 | Sin dato |
| UPIBI | M/06 | M764 | PROYECTO TERMINAL II | 6 | 4.5 | Sin dato |

## 3. Decisiones pendientes

1. Revisar las diferencias de UPIBI antes de modificar cifras.
2. ESCOM LCD A/20: A403 y A405 aparecen intercambiadas en el PDF; se mantienen 7.5 y 10.5 del SAES.
3. ESCOM ISC C/09 se ofrece como opción independiente C_09 junto a C/20. La captura incluye horas semestrales incluso en cuarto nivel (C401: 4.39, 27, 54); la conversión se decide por fila. No se dispone de un plan oficial 2009 publicado para corroborar los créditos calculados.
4. La ayuda se redactó exclusivamente con G-tepic-satca.md (investigación del 9 de octubre de 2026), disponible al terminar la verificación. La fuente distingue 15–16 semanas lectivas de 18 semanas de actividades escolares: dividir entre 18 sigue siendo el supuesto solicitado para estos cálculos aproximados, no una conversión institucional certificada.
