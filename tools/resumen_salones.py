"""Resume aulas con clases nuevas, retiradas o reasignadas frente al HEAD."""
import json
import subprocess
import sys
from pathlib import Path


def clave(clase):
    return (clase.get('grupo'), clase.get('dia'), clase.get('inicio'), clase.get('fin'), clase.get('materia'))


def main(ruta):
    nuevo = json.loads(Path(ruta).read_text(encoding='utf-8'))
    try:
        anterior = json.loads(subprocess.check_output(['git', 'show', f'HEAD:{ruta}'], text=True, encoding='utf-8'))
    except (subprocess.CalledProcessError, json.JSONDecodeError):
        anterior = {'clases': []}
    antes = {clave(c): c.get('aula', '') for c in anterior.get('clases', [])}
    despues = {clave(c): c.get('aula', '') for c in nuevo.get('clases', [])}
    cambios = [(k, antes.get(k, 'sin aula'), despues.get(k, 'sin aula'))
               for k in antes.keys() | despues.keys() if antes.get(k) != despues.get(k)]
    if not cambios:
        return 'No se detectaron cambios de aula en las clases.'
    return '\n'.join(f"- {k[0]} {k[4]} ({k[2]}): {a} → {b}" for k, a, b in sorted(cambios, key=lambda x: str(x[0])))


if __name__ == '__main__':
    print(main(sys.argv[1]))
