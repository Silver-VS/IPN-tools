# data/guia

Contenido de la Guía politécnica de SATE: preguntas frecuentes con respuesta breve, pasos, a quién acudir, formato y fuente
oficial; reglamentos y a quién acudo. Un archivo por unidad académica (`upiita.json`).

- Lo edita quien redacta la Guía; solo entra lo verificado en la fuente oficial (G-GUIA1 y G-NORM1 en `coordinacion-wt`).
- Los documentos se declaran una vez en `documentos` y las preguntas los citan por id con su artículo.
- El formato de baja se resuelve en la compilación desde `data/gestion_escolar/bajas.json` (`formato.ref`).
- Se valida con `python -m unittest tests.test_guia` y `node tests/qa_sate_guia.mjs`; se compila con `python tools/build_sate.py`.
