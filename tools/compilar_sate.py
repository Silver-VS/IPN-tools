"""Compilación y verificación local, sin red ni navegador."""
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
for unidad in ('upiita', 'escom', 'upibi'):
    env = dict(os.environ, UNIDAD=unidad)
    subprocess.run([sys.executable, 'tools/build_horarios.py'], cwd=ROOT, env=env, check=True)
for herramienta in ('electivas', 'dictamen'):   # se integraron a la Ventanilla: solo se compilan si aún existen
    if not (ROOT / 'tools' / f'build_{herramienta}.py').exists():
        continue
    subprocess.run([sys.executable, f'tools/build_{herramienta}.py'], cwd=ROOT, check=True)
