#!/usr/bin/env bash
# Publica la versión actual en https://silver-vs.github.io/upiita/
# Uso: tools/publicar.sh <ruta al clon de Silver-VS.github.io> [mensaje]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="${1:?Indica la ruta al clon de Silver-VS.github.io}"
MSG="${2:-Publica $(git -C "$ROOT" describe --tags --always)}"

cd "$ROOT"
export UPIITA_SITE="https://silver-vs.github.io/upiita/"
python tools/build_horarios.py
python tools/build_electivas.py
for u in data/unidades/*/; do   # otras unidades (data/unidades/<unidad>/): horarios-<unidad>.html
  UNIDAD="$(basename "$u")" python tools/build_horarios.py
done

mkdir -p "$SITE/upiita"
cp -r web/dist/. "$SITE/upiita/"

git -C "$SITE" add upiita
git -C "$SITE" commit -m "$MSG"
git -C "$SITE" push
