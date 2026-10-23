from pathlib import Path


def test_sin_control_remoto_de_navegador():
    """Impide reintroducir el mecanismo de control de navegador prohibido."""
    prohibido = 'remote' + '-debugging'
    fallos = [str(p) for p in Path('tests').rglob('*')
              if p.is_file() and '__pycache__' not in p.parts
              and prohibido in p.read_text(encoding='utf-8', errors='replace')]
    assert not fallos, f'Control de navegador prohibido en: {fallos}'
