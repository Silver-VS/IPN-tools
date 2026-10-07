"""Ejecuta las pruebas solicitadas con sus temporales dentro del worktree."""
from pathlib import Path
import sys
import tempfile
import unittest

raiz = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(raiz))
temporal = raiz / '.qa-sate-temporal'
temporal.mkdir(exist_ok=True)
tempfile.tempdir = str(temporal)
try:
    suite = unittest.defaultTestLoader.loadTestsFromNames([
        'tests.test_contenido', 'tests.test_rutas_mapa', 'tests.test_sate'])
    resultado = unittest.TextTestRunner(verbosity=1).run(suite)
finally:
    temporal.rmdir()
sys.exit(0 if resultado.wasSuccessful() else 1)
