"""Genera web/qa-temarios.html: página de revisión local del lector de documentos de PoliCORE y del adaptador de temarios.

Uso:  python tools/build_qa_temarios.py   y abrir web/qa-temarios.html (por ejemplo con python -m http.server --directory web).
Los qa-* no se publican (están en .gitignore). Muestra un temario real en página y en un panel angosto, y un documento
que no es temario (reglamento ficticio) para comprobar que el lector es genérico. Claro/oscuro y anchos de 1440 a 375 px.
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import comun, contenido  # noqa: E402

PAGINA = r"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lector de PoliCORE (prueba)</title>
<style>/*__TOKENS__*/</style>
<style>
body{margin:0;background:var(--ipn-fondo);color:var(--ipn-texto);font:var(--ipn-tamano-m)/1.5 var(--ipn-fuente-texto)}
main{margin:0 auto;padding:var(--ipn-esp-4);max-width:100%}
h1{font-size:var(--ipn-tamano-xl);margin:0 0 var(--ipn-esp-3)}
h2.qa{font-size:var(--ipn-tamano-m);margin:var(--ipn-esp-6) 0 var(--ipn-esp-2);color:var(--ipn-tenue);font-weight:600}
.barra{display:flex;flex-wrap:wrap;gap:var(--ipn-esp-2);align-items:center;margin-bottom:var(--ipn-esp-3)}
.barra button{min-height:2.5rem;padding:.3rem .8rem;border:1px solid var(--ipn-linea);border-radius:var(--ipn-radio);background:var(--ipn-superficie);color:inherit;font:inherit;cursor:pointer}
.barra button[aria-pressed=true]{background:var(--ipn-acento-suave);border-color:var(--ipn-acento);color:var(--ipn-acento);font-weight:600}
#marco{margin:0 auto;padding:var(--ipn-esp-4);border:1px dashed var(--ipn-linea);border-radius:var(--ipn-radio);background:var(--ipn-fondo)}
#panel{width:min(34rem,100%);height:32rem;overflow:auto;padding:var(--ipn-esp-4);border:1px solid var(--ipn-linea);border-radius:var(--ipn-radio);background:var(--ipn-superficie)}
</style>
<style>/*__LECTOR_CSS__*/</style>
</head><body>
<main>
<h1 data-t="qa.temarios.titulo"></h1>
<div class="barra" role="group"><span data-t="qa.tema.etiqueta"></span>
<button type="button" data-tema-set="claro" data-t="qa.tema.claro"></button><button type="button" data-tema-set="oscuro" data-t="qa.tema.oscuro"></button>
<span data-t="qa.temarios.ancho"></span>
<button type="button" data-ancho="1440">1440</button><button type="button" data-ancho="1024">1024</button><button type="button" data-ancho="768">768</button><button type="button" data-ancho="414">414</button><button type="button" data-ancho="375">375</button></div>
<h2 class="qa" data-t="qa.temarios.seccion_temario"></h2><div id="marco"><div id="temario"></div></div>
<h2 class="qa" data-t="qa.temarios.seccion_panel"></h2><div id="panel"></div>
<h2 class="qa" data-t="qa.temarios.seccion_otro"></h2><div id="otro"></div>
</main>
<script>/*__TEXTO_JS__*/</script>
<script>/*__TEXTOS__*/</script>
<script>/*__LECTOR_JS__*/</script>
<script>/*__TEMARIOS_JS__*/</script>
<script>
(function(){
  var DATOS=/*__DATOS__*/null, REGLAMENTO=/*__REGLAMENTO__*/null;
  var r=document.documentElement,q=location.search.match(/tema=(claro|oscuro)/);
  if(q)r.setAttribute('data-tema',q[1]);
  Texto.registrar('es',T);
  var t=Texto.t;
  PoliCORE.texto=t;
  document.querySelectorAll('[data-t]').forEach(function(n){n.innerHTML=t(n.dataset.t)});
  document.title=t('qa.temarios.titulo');
  document.querySelectorAll('[data-tema-set]').forEach(function(b){b.addEventListener('click',function(){r.setAttribute('data-tema',b.dataset.temaSet)})});
  var marco=document.getElementById('marco');
  function ancho(px){marco.style.width=Math.min(px+32,document.documentElement.clientWidth)+'px';
    document.querySelectorAll('[data-ancho]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.ancho==String(px)))})}
  document.querySelectorAll('[data-ancho]').forEach(function(b){b.addEventListener('click',function(){ancho(+b.dataset.ancho)})});
  ancho(1024);
  var d=DATOS[0], doc=SateTemarios.documento(d.registro,{t:t,carrera:d.carrera,plan:d.plan});
  PoliCORE.lector.montar(document.getElementById('temario'),doc,{texto:t,modo:'pagina',consulta:(location.search.match(/q=([^&]+)/)||[])[1]&&decodeURIComponent(location.search.match(/q=([^&]+)/)[1])});
  PoliCORE.lector.montar(document.getElementById('panel'),SateTemarios.documento(DATOS[1].registro,{t:t,carrera:DATOS[1].carrera,plan:DATOS[1].plan}),{texto:t,modo:'panel',nivelTitulo:2});
  PoliCORE.lector.montar(document.getElementById('otro'),REGLAMENTO,{texto:t,modo:'pagina'});
})();
</script></body></html>
"""

# Documento que no es temario: demuestra que el lector solo conoce el formato genérico (contenido ficticio de prueba).
REGLAMENTO = {
    "titulo": "Reglamento de ejemplo",
    "subtitulo": "Documento ficticio para probar el lector; no es un texto oficial",
    "metadatos": [{"etiqueta": "Tipo", "valor": "Reglamento"}, {"etiqueta": "Vigencia", "valor": "Ejemplo"}],
    "secciones": [
        {"id": "objeto", "titulo": "Objeto", "tipo": "texto",
         "contenido": "Este texto sirve para comprobar la tipografía del texto oficial, la búsqueda con resaltado y los enlaces a cada sección.\nUn segundo párrafo permite revisar el espacio entre párrafos y el ajuste de líneas largas en teléfono."},
        {"id": "derechos", "titulo": "Derechos", "tipo": "lista",
         "contenido": ["Recibir información clara sobre sus trámites.", "Presentar solicitudes por escrito.", "Conocer el resultado en los plazos señalados."]},
        {"id": "titulos", "titulo": "Estructura", "tipo": "unidades", "rotulo": "Título",
         "contenido": [{"numero": "I", "titulo": "Disposiciones generales", "subtemas": ["Alcance", "Definiciones"]},
                       {"numero": "II", "titulo": "Procedimiento", "subtemas": []}]},
        {"id": "fuentes", "titulo": "Fuentes", "tipo": "bibliografia",
         "contenido": [{"texto": "Gaceta de ejemplo, número 1.", "tipo": "Primarias"}, {"texto": "Nota explicativa de ejemplo.", "tipo": "Complementarias"}]},
    ],
    "fuente": {"texto": "Documento ficticio.", "url": "https://www.ipn.mx/"},
    "avisos": ["Contenido de prueba: no lo uses como referencia."],
}


def muestras():
    """Tres temarios reales de la UPIITA (uno por carrera) con créditos, contenidos y bibliografía."""
    salida = []
    for carrera in ("bionica", "mecatronica", "telematica"):
        d = json.loads((ROOT / "data/temarios/upiita" / (carrera + ".json")).read_text(encoding="utf-8"))
        r = next(m for m in d["materias"] if m["objetivo"] and m["contenidos"] and m["bibliografia"] and m["creditos"] and m["vigencia"])
        salida.append({"registro": r, "carrera": carrera.capitalize(), "plan": d["plan"]})
    return salida


def main():
    texto = (comun.VENDOR / "js" / "texto.js").read_text(encoding="utf-8")
    texto = re.sub(r"^export ", "", texto, flags=re.M)
    texto = "var Texto=(function(){" + texto + "\nreturn {t:t,registrar:registrar,usarIdioma:usarIdioma};})();"
    html = PAGINA
    for marca, valor in (("/*__TOKENS__*/", comun.css()),
                         ("/*__LECTOR_CSS__*/", (ROOT / "web/policore/lector.css").read_text(encoding="utf-8")),
                         ("/*__TEXTO_JS__*/", texto), ("/*__TEXTOS__*/", contenido.js()),
                         ("/*__LECTOR_JS__*/", (ROOT / "web/policore/lector.js").read_text(encoding="utf-8")),
                         ("/*__TEMARIOS_JS__*/", (ROOT / "web/sate/temarios.js").read_text(encoding="utf-8")),
                         ("/*__DATOS__*/null", json.dumps(muestras(), ensure_ascii=False).replace("</", "<\\/")),
                         ("/*__REGLAMENTO__*/null", json.dumps(REGLAMENTO, ensure_ascii=False))):
        html = html.replace(marca, valor, 1)
    out = ROOT / "web" / "qa-temarios.html"
    out.write_text(html, encoding="utf-8")
    print(out, len(html) // 1024, "KB")


if __name__ == "__main__":
    main()
