# data/guia

Contenido de la Guía politécnica de SATE. Formato completo: `coordinacion-wt/ipt-estado/ipn-tools/diseno/FORMATO-GUIA7.md`.

- `comun.json`: lo genérico del IPN, compartido por todas las unidades (documentos, glosario, a quién acudo central y
  preguntas fundadas en reglamentos con artículo).
- `upiita.json`, `escom.json`, `upibi.json`: solo lo propio de cada unidad (documentos propios, áreas de la unidad con su
  manual y página, preguntas que dependen de la unidad). Una pregunta de la unidad con el mismo `id` que una común y
  `"reemplaza": true` sustituye a la común.
- Marcas en línea: `[[g:clave|texto]]` abre el glosario; `[[a:doc:n|texto]]` abre el artículo `n` de
  `data/reglamentos/<doc>.json`. Las definiciones del glosario no llevan marcas.
- Solo entra lo verificado en el texto literal del reglamento. Se valida con `python -m unittest tests.test_guia_datos`.
