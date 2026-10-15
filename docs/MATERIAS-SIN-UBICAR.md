# Materias sin ubicar en el mapa

## 1. Criterio y reproducción

Generado con `python tools/materias_sin_ubicar.py` después de compilar las tres unidades. Usa la misma función `clasificar` que el compilador. Se cruzan las claves compiladas de ambos periodos con cada carrera/plan, sin comparar nombres para determinar alcance.

Una clave se puede elegir desde el mapa si tiene caja propia o pertenece a una línea seleccionable. Un espacio vacío de optativa no abre un selector: `slotFill` solo coloca elecciones previas (tipo P, nivel coincidente si el espacio lo especifica y cualquier nivel si no lo especifica). Se distinguen las materias con espacio compatible pero sin selector de las que tampoco tienen espacio compatible. Sin trayectoria, la cuadrícula incluye todo el catálogo. No depende de cupos ocupados, avance ni de la vista Pendientes. Las electivas se separan por la misma regla de `isElec` de SATE.

El compilador ya normaliza las claves SAES a mayúsculas en catálogo y oferta. Las claves internas con `~` indican oferta sin correspondencia con el catálogo SAES.

## 2. Casos por unidad y carrera/plan

### UPIITA · INGENIERÍA BIÓNICA (B)

1 sin ubicar; 4 electivas ofertadas (separadas).

**Sin acceso desde el mapa**

| Clave | Nombre | Tipo | Nivel | Periodos | Motivo probable |
|---|---|---|---|---|---|
| B307 | COMUNICACIÓN ORAL Y ESCRITA | Optativa | 3 | actual, proximo | Espacio de optativa compatible, pero sin caja ni línea para elegirla; slotFill solo la coloca después de elegirla. |

**Electivas por actividades**

| Clave | Nombre | Tipo | Nivel | Periodos | Motivo probable |
|---|---|---|---|---|---|
| B113 | ELECTIVA I | Obligatoria | 1 | actual | Electiva: acreditación por actividades; consultar el trámite de la unidad. |
| B214 | ELECTIVA II | Obligatoria | 2 | actual | Electiva: acreditación por actividades; consultar el trámite de la unidad. |
| B411 | ELECTIVA III | Obligatoria | 4 | actual | Electiva: acreditación por actividades; consultar el trámite de la unidad. |
| B507 | ELECTIVA IV | Obligatoria | 5 | actual | Electiva: acreditación por actividades; consultar el trámite de la unidad. |

### UPIITA · INGENIERÍA EN ENERGÍA (E)

0 sin ubicar; 0 electivas ofertadas (separadas).

### UPIITA · INGENIERÍA MECATRÓNICA (M)

0 sin ubicar; 3 electivas ofertadas (separadas).

**Electivas por actividades**

| Clave | Nombre | Tipo | Nivel | Periodos | Motivo probable |
|---|---|---|---|---|---|
| M325 | ELECTIVA I | Obligatoria | 3 | actual | Electiva: acreditación por actividades; consultar el trámite de la unidad. |
| M411 | ELECTIVA II | Obligatoria | 4 | actual | Electiva: acreditación por actividades; consultar el trámite de la unidad. |
| M502 | ELECTIVA III | Obligatoria | 5 | actual | Electiva: acreditación por actividades; consultar el trámite de la unidad. |

### UPIITA · ING. EN SISTEMAS AUTOMOTRICES (S)

0 sin ubicar; 0 electivas ofertadas (separadas).

### UPIITA · INGENIERÍA TELEMÁTICA (T)

7 sin ubicar; 4 electivas ofertadas (separadas).

**Sin acceso desde el mapa**

| Clave | Nombre | Tipo | Nivel | Periodos | Motivo probable |
|---|---|---|---|---|---|
| T121 | SOCIEDAD, CIENCIA Y TECNOLOGÍA | Optativa | 1 | actual, proximo | Sin caja ni línea; no hay espacio de optativa compatible con su tipo/nivel. |
| T220 | MÉTODOS NUMÉRICOS | Optativa | 2 | actual, proximo | Espacio de optativa compatible, pero sin caja ni línea para elegirla; slotFill solo la coloca después de elegirla. |
| T221 | ELECTRÓNICA PARA COMUNICACIONES | Optativa | 2 | actual, proximo | Espacio de optativa compatible, pero sin caja ni línea para elegirla; slotFill solo la coloca después de elegirla. |
| T222 | ÓPTICA | Optativa | 2 | actual, proximo | Espacio de optativa compatible, pero sin caja ni línea para elegirla; slotFill solo la coloca después de elegirla. |
| T223 | DESARROLLO SUSTENTABLE | Optativa | 2 | actual, proximo | Espacio de optativa compatible, pero sin caja ni línea para elegirla; slotFill solo la coloca después de elegirla. |
| T224 | ECONOMÍA PARA INGENIEROS | Optativa | 2 | actual, proximo | Espacio de optativa compatible, pero sin caja ni línea para elegirla; slotFill solo la coloca después de elegirla. |
| T225 | INGLÉS IV | Optativa | 2 | actual | Espacio de optativa compatible, pero sin caja ni línea para elegirla; slotFill solo la coloca después de elegirla. |

**Electivas por actividades**

| Clave | Nombre | Tipo | Nivel | Periodos | Motivo probable |
|---|---|---|---|---|---|
| T407 | ELECTIVA I | Obligatoria | 4 | actual | Electiva: acreditación por actividades; consultar el trámite de la unidad. |
| T408 | ELECTIVA II | Obligatoria | 4 | actual | Electiva: acreditación por actividades; consultar el trámite de la unidad. |
| T409 | ELECTIVA III | Obligatoria | 4 | actual | Electiva: acreditación por actividades; consultar el trámite de la unidad. |
| T410 | ELECTIVA IV | Obligatoria | 4 | actual | Electiva: acreditación por actividades; consultar el trámite de la unidad. |

### ESCOM · LICENCIATURA EN CIENCIA DE DATOS (A)

1 sin ubicar; 0 electivas ofertadas (separadas).

**Sin acceso desde el mapa**

| Clave | Nombre | Tipo | Nivel | Periodos | Motivo probable |
|---|---|---|---|---|---|
| A205 | FUNDAMENTOS ECONÓMICOS | Obligatoria | 2 | actual | Sin caja ni línea; no hay espacio de optativa compatible con su tipo/nivel. |

### ESCOM · INGENIERÍA EN INTELIGENCIA ARTIFICIAL (B)

0 sin ubicar; 0 electivas ofertadas (separadas).

### ESCOM · ING. EN SIS. COMPUTACIONALES (plan 2009) (C_09)

0 sin ubicar; 0 electivas ofertadas (separadas).

### ESCOM · ING. EN SIS. COMPUTACIONALES (plan 2020) (C)

0 sin ubicar; 0 electivas ofertadas (separadas).

### ESCOM · ING. EN SISTEMAS AUTOMOTRICES (S)

0 sin ubicar; 0 electivas ofertadas (separadas).

### UPIBI · INGENIERÍA AMBIENTAL (A)

0 sin ubicar; 0 electivas ofertadas (separadas).

### UPIBI · INGENIERÍA BIOTECNOLÓGICA (plan 2006) (B_06)

0 sin ubicar; 0 electivas ofertadas (separadas).

### UPIBI · INGENIERÍA BIOTECNOLÓGICA (plan 2024) (B)

0 sin ubicar; 0 electivas ofertadas (separadas).

### UPIBI · INGENIERÍA FARMACÉUTICA (F)

0 sin ubicar; 0 electivas ofertadas (separadas).

### UPIBI · INGENIERÍA EN ALIMENTOS (L)

0 sin ubicar; 0 electivas ofertadas (separadas).

### UPIBI · INGENIERÍA BIOMÉDICA (M)

0 sin ubicar; 0 electivas ofertadas (separadas).

## 3. Modo genérico y límites

El modo genérico no carga oferta de carrera/plan: representa las materias que el Lector informa en memoria, todas con caja en su cuadrícula. No hay casos estructurales ni selección de oferta que diagnosticar; Pendientes solo filtra las acreditadas. No se infieren claves, créditos ni reglas académicas ausentes del SAES.

## 4. Aclaración del reporte original

`b307` se normaliza a `B307`. En Biónica sí hay un espacio de optativa compatible de nivel 3; el defecto es la falta de un control para elegirla desde el mapa. El cajón ofrece ese acceso sin modificar el plan ni las reglas de acreditación.
