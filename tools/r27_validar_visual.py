"""Ejecuta el recorrido y detiene únicamente el servidor hijo por su PID."""
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SALIDA = ROOT / 'web/dist/qa-r27-act'
SALIDA.mkdir(parents=True, exist_ok=True)
temporal = SALIDA / 'tmp'
temporal.mkdir(exist_ok=True)
entorno = dict(os.environ, PLAYWRIGHT_BROWSERS_PATH='D:/Tools/playwright-browsers',
               TEMP=str(temporal), TMP=str(temporal))
# Si el puerto está ocupado no se toca el proceso ajeno.
with socket.socket() as puerto:
    puerto.bind(('127.0.0.1', 8080))
with (SALIDA / 'servidor.log').open('w', encoding='utf-8') as registro:
    servidor = subprocess.Popen([sys.executable, '-m', 'http.server', '8080', '--bind', '127.0.0.1'],
                                cwd=ROOT, stdout=registro, stderr=registro, env=entorno)
    print('Servidor propio PID:', servidor.pid, flush=True)
    try:
        for _ in range(100):
            try:
                with socket.create_connection(('127.0.0.1', 8080), timeout=.2):
                    break
            except OSError:
                time.sleep(.1)
        else:
            raise RuntimeError('El servidor no respondió en 10 segundos')
        resultado = subprocess.run(['D:/Tools/nodejs/node.exe', 'tests/qa_sate_actividades_visual.mjs'],
                                   cwd=ROOT, env=entorno)
    finally:
        servidor.terminate()
        servidor.wait(timeout=10)
        print('Servidor detenido PID:', servidor.pid, flush=True)
raise SystemExit(resultado.returncode)
