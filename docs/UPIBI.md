# Integración de UPIBI

## 1. Fuentes y alcance

Tablas académicas del SAES y seis mapas oficiales PDF. Sin datos personales del alumnado. Captura inicial del 2 de octubre de 2026 de planes 2006 y 2024; los planes 1999 quedan fuera de esta integración. Oferta actual: 1,027 filas del SAES, fusionadas en 664 clases. El próximo periodo no tiene filas publicadas en la captura.
Clasificación por categorías propuesta, pendiente de revisión por las academias. Los planes 2006 son por niveles; Biotecnológica 2024 es semestral.

## 2. Empates y diferencias

| Carrera y plan | Materias PDF | Espacios optativos | Diferencias PDF / SAES |
|---|---:|---:|---|
| Ingeniería Ambiental 06 | 60 | 2 | A102 HT: PDF 4.5, SAES 5.0; A105 HP: PDF 1.5, SAES 2.0; A103 HT: PDF 4.5, SAES 5.0; A326 HT: PDF 4.5, SAES 5.0; A863 HP: PDF 1.5, SAES 2.0; A212 HP: PDF 1.5, SAES 2.0; A209 HT: PDF 4.5, SAES 5.0; A323 HT: PDF 4.5, SAES 5.0; A325 HP: PDF 1.5, SAES 2.0; A542 HT: PDF 4.5, SAES 5.0; A537 HT: PDF 4.5, SAES 5.0; A756 HP: PDF 4.5, SAES 5.0; A646 HP: PDF 4.5, SAES 5.0; A758 HP: PDF 1.5, SAES 2.0; A321 HT: PDF 4.5, SAES 5.0 |
| Ingeniería Biotecnológica 06 | 59 | 2 | Ninguna en las materias empatadas |
| Ingeniería Biotecnológica 24 | 64 | 4 | B706 créditos: PDF 3.0, SAES 1.5; B802 HT: PDF 0.0, SAES 1.5; B802 HP: PDF 1.5, SAES 0.0 |
| Ingeniería Farmacéutica 06 | 60 | 3 | F213 HT: PDF 4.5, SAES 5.0; F103 HT: PDF 4.5, SAES 5.0; F651 HT: PDF 1.5, SAES 2.0; F651 HP: PDF 1.5, SAES 2.0; F758 HT: PDF 1.5, SAES 2.0; F863 HT: PDF 1.5, SAES 2.0; F209 HT: PDF 4.5, SAES 5.0; F321 HT: PDF 4.5, SAES 5.0; F427 HT: PDF 4.5, SAES 5.0; F547 HT: PDF 4.5, SAES 5.0; F428 HT: PDF 4.5, SAES 5.0; F429 HT: PDF 1.5, SAES 2.0; F540 HT: PDF 4.5, SAES 4.0; F759 HT: PDF 4.5, SAES 4.0; F860 HP: PDF 4.5, SAES 4.0; F542 HT: PDF 1.5, SAES 2.0; F650 HT: PDF 4.5, SAES 4.0; F541 créditos: PDF 9.0, SAES 4.5; F541 HP: PDF 4.5, SAES 4.0; F317 HT: PDF 4.5, SAES 5.0 |
| Ingeniería en Alimentos 06 | 59 | 2 | L762 HT: PDF 0.0, SAES 1.5; L762 HP: PDF 1.5, SAES 0.0 |
| Ingeniería Biomédica 06 | 65 | 3 | M320 HP: PDF 1.5, SAES 2.0; M105 HP: PDF 1.5, SAES 2.0; M103 HT: PDF 4.5, SAES 5.0; M211 HP: PDF 1.5, SAES 2.0; M213 HP: PDF 1.5, SAES 2.0; M209 HT: PDF 4.5, SAES 5.0; M316 HT: PDF 4.5, SAES 5.0; M323 HP: PDF 1.5, SAES 2.0; M427 HP: PDF 1.5, SAES 2.0; M429 HP: PDF 1.5, SAES 2.0; M434 HP: PDF 1.5, SAES 2.0; M433 HP: PDF 1.5, SAES 2.0; M542 HP: PDF 1.5, SAES 2.0; M652 HT: PDF 1.5, SAES 2.0; M652 HP: PDF 1.5, SAES 2.0; M764 HT: PDF 1.5, SAES 2.0; M873 HT: PDF 1.5, SAES 2.0; M651 HP: PDF 1.5, SAES 2.0; M319 HT: PDF 4.5, SAES 5.0 |

## 3. Créditos de Biotecnológica 2024

La extracción de 354 créditos omite Electiva (18 créditos, B612): 354 + 18 = 372, igual al encabezado del PDF.
Persiste una diferencia independiente: Estancia Profesional I tiene 3 créditos en el PDF y 1.5 en el SAES. El mapa usa los créditos del SAES y señala la discrepancia; no fuerza el total a 372.

## 4. Validación local

Ejecutar `python tools/extract_mapa_upibi.py --integrar` y `UNIDAD=upibi python tools/build_horarios.py`.
Biotecnológica se ofrece por separado para 2024 y 2006. Las opciones optativas se consultan en el panel de optativas; las cajas del mapa representan los espacios del plan.

## 5. Pendientes de revisión

Confirmar la diferencia de Estancia Profesional I con Gestión Escolar. Validar categorías y flechas extraídas con las academias.
No se infieren reglas de seriación entre optativas, equivalencias entre planes ni restricciones de inscripción ausentes en las fuentes.

## 6. Resultado de verificación

Siete pruebas automatizadas: planes con claves repetidas, perfiles con plan ausente o desconocido, salones por bloque, empates explícitos, clasificación, referencias de los seis mapas y sintaxis JavaScript de las tres unidades.

UPIBI, UPIITA y ESCOM compilan. Revisión en navegador con y sin perfiles ficticios y a 390 px: sin errores de consola. Los perfiles ficticios se retiraron al terminar. Ningún dato personal de la sesión SAES se guardó.

Trabajo local en `codex/upibi`, sin publicación.
