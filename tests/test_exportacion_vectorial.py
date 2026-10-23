"""Verifica los PDF vectoriales generados por el QA local de exportación."""
from pathlib import Path
import subprocess

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
MUESTRAS = ROOT / "muestras-r5-pdf"


def test_exportacion_pdf_vectorial_sin_imagenes():
    subprocess.run(
        [r"D:\Tools\nodejs\node.exe", "tests/qa_sate_exportacion_vectorial.mjs"],
        cwd=ROOT, check=True, capture_output=True, text=True,
    )
    nombres = [
        f"{estilo}-{caso}.pdf"
        for estilo in ("color", "min")
        for caso in ("uno", "todos-uno-por-hoja", "todos-dos-por-hoja")
    ]
    for nombre in nombres:
        lector = PdfReader(MUESTRAS / nombre)
        paginas = lector.pages
        texto = "\n".join(p.extract_text() or "" for p in paginas)
        assert "Álgebra y análisis" in texto, (nombre, texto)
        assert "G-A" in texto, (nombre, texto)
        assert "Aula A-101" in texto, (nombre, texto)
        assert "Física" in texto, (nombre, texto)
        assert "Lab. Física 2" in texto, (nombre, texto)
        if "todos" in nombre:
            assert "G-C" in texto and "Aula B-201" in texto, (nombre, texto)
            assert "G-D" in texto and "Laboratorio 3" in texto, (nombre, texto)
        assert all(
            not (pagina.get("/Resources") or {}).get("/XObject")
            or not any(obj.get_object().get("/Subtype") == "/Image"
                       for obj in pagina["/Resources"]["/XObject"].values())
            for pagina in paginas
        ), nombre
        esperado = 2 if "dos-por-hoja" in nombre else 3 if "todos-uno-por-hoja" in nombre else 1
        assert len(paginas) == esperado, nombre
