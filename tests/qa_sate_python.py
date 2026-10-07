"""Ejecuta las pruebas solicitadas con sus temporales dentro del worktree."""
from pathlib import Path
import os
import subprocess
import sys

raiz = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(raiz))
temporal = raiz / '.qa-sate-temporal'
temporal.mkdir(exist_ok=True)
try:
    # El proceso de unittest y sus fixtures usan exclusivamente el worktree.
    resultado = subprocess.run([sys.executable, '-m', 'unittest', '-v',
        'tests.test_contenido', 'tests.test_rutas_mapa', 'tests.test_sate'],
        cwd=raiz, env=dict(os.environ, TMP=str(temporal), TEMP=str(temporal), TMPDIR=str(temporal)))
finally:
    temporal.rmdir()
sys.exit(resultado.returncode)
