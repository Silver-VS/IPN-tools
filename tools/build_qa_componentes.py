"""Genera web/qa-componentes.html: todos los componentes de web/sate/componentes.{js,css} en claro y oscuro.

Uso:  python tools/build_qa_componentes.py
Los qa-* no se publican (están en .gitignore). Inyecta tokens de ipn-comun, el formateador js/texto.js y los textos TOML.
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import comun, contenido  # noqa: E402

PAGINA = r"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Componentes de SATE (prueba)</title>
<style>/*__TOKENS__*/</style>
<style>
body{margin:0;background:var(--ipn-fondo);color:var(--ipn-texto);font:var(--ipn-tamano-m)/1.5 var(--ipn-fuente-texto)}
main{max-width:60rem;margin:0 auto;padding:var(--ipn-esp-4)}
h1{font-size:var(--ipn-tamano-xl);margin:0 0 var(--ipn-esp-3)}
h2{font-size:var(--ipn-tamano-m);margin:var(--ipn-esp-6) 0 var(--ipn-esp-2);color:var(--ipn-tenue);font-weight:600}
.fila{display:flex;align-items:center;gap:var(--ipn-esp-3);flex-wrap:wrap}
.panel{padding:var(--ipn-esp-3) 0;font-size:var(--ipn-tamano-s)}
</style>
<style>/*__COMPONENTES_CSS__*/</style>
</head><body>
<main>
<div class="fila"><h1 data-t="qa.titulo"></h1>
<span class="sate-pestanas sate-pestanas--seg" id="sel-tema" role="group"><button class="sate-pestana" data-tema-set="claro" data-t="qa.tema.claro"></button><button class="sate-pestana" data-tema-set="oscuro" data-t="qa.tema.oscuro"></button></span></div>
<h2 data-t="qa.seccion.chips"></h2><div id="demo-chips"></div>
<h2 data-t="qa.seccion.avisos"></h2><div id="demo-avisos"></div>
<h2 data-t="qa.seccion.modal"></h2><div class="fila"><button class="sate-btn sate-btn--primario" id="abrir-modal" data-t="qa.modal.abrir"></button></div>
<h2 data-t="qa.seccion.ayuda"></h2><div class="fila"><span data-t="qa.ayuda.etiqueta"></span><span id="demo-ayuda"></span></div>
<h2 data-t="qa.seccion.desplegable"></h2><div id="demo-desp"></div>
<h2 data-t="qa.seccion.pestanas"></h2><div id="demo-tabs"></div>
<div id="p-uno" class="panel" data-t="qa.panel.uno"></div><div id="p-dos" class="panel" data-t="qa.panel.dos"></div><div id="p-tres" class="panel" data-t="qa.panel.tres"></div>
<h2 data-t="qa.seccion.barra"></h2><div id="demo-barra"></div>
</main>
<script>/*__TEXTO_JS__*/</script>
<script>/*__TEXTOS__*/</script>
<script>/*__COMPONENTES_JS__*/</script>
<script>
(function(){
  var r=document.documentElement,q=location.search.match(/tema=(claro|oscuro)/);
  if(q)r.setAttribute('data-tema',q[1]);
  Texto.registrar('es',T);
  var t=window.t=Texto.t;
  document.querySelectorAll('[data-t]').forEach(function(n){n.innerHTML=t(n.dataset.t)});
  document.title=t('qa.titulo');
  SateUI.usarTextos(t);
  document.querySelectorAll('[data-tema-set]').forEach(function(b){b.addEventListener('click',function(){r.setAttribute('data-tema',b.dataset.temaSet)})});
  var info={titulo:t('qa.chip.modal.titulo'),contenido:t('qa.chip.modal.cuerpo')};
  SateUI.chips([
    {id:'situacion',estado:'ok',texto:t('qa.chip.situacion'),abre:info},
    {id:'desfase',estado:'aviso',texto:t('qa.chip.desfase'),abre:info},
    {id:'ets',estado:'error',texto:t('qa.chip.ets'),abre:info},
    {id:'cita',estado:'info',texto:t('qa.chip.cita'),abre:info},
    {id:'dictamen',estado:'aviso',texto:t('qa.chip.dictamen')}
  ],document.getElementById('demo-chips'));
  var acc={texto:t('qa.aviso.accion'),onclick:function(){SateUI.modal(t('qa.chip.modal.titulo'),t('qa.chip.modal.cuerpo'))}};
  document.getElementById('demo-avisos').appendChild(SateUI.avisos(['ok','aviso','error','info'].map(function(e){
    return {estado:e,titulo:t('qa.aviso.'+e+'.titulo'),cuerpo:t('qa.aviso.'+e+'.cuerpo'),accion:acc}})));
  document.getElementById('abrir-modal').addEventListener('click',function(){
    SateUI.modal(t('qa.modal.titulo'),t('qa.modal.cuerpo'),{acciones:[{texto:t('qa.modal.cancelar')},{texto:t('qa.modal.aceptar'),primaria:true}]})});
  document.getElementById('demo-ayuda').appendChild(SateUI.ayuda('qa.ayuda.texto'));
  document.getElementById('demo-desp').appendChild(SateUI.desplegable({clave:'qa',titulo:t('qa.desplegable.titulo'),contenido:t('qa.desplegable.cuerpo'),ayuda:'qa.ayuda.texto'}));
  var items=[{id:'uno',texto:t('qa.pestana.uno'),panel:'p-uno'},{id:'dos',texto:t('qa.pestana.dos'),panel:'p-dos'},{id:'tres',texto:t('qa.pestana.tres'),panel:'p-tres'}];
  document.getElementById('demo-tabs').appendChild(SateUI.pestanas({items:items,activa:'uno',etiqueta:t('qa.seccion.pestanas')}));
  var barra=SateUI.barraInferior({items:['situacion','mapa','horarios','desempeno','tramites'].map(function(p){return {id:p,texto:t('sate.pestana.'+p+'.corto')}}),activa:'situacion'});
  document.body.appendChild(barra);
})();
</script></body></html>
"""


def main():
    texto = (comun.VENDOR / "js" / "texto.js").read_text(encoding="utf-8")
    texto = re.sub(r"^export ", "", texto, flags=re.M)
    texto = "var Texto=(function(){" + texto + "\nreturn {t:t,registrar:registrar,usarIdioma:usarIdioma};})();"
    html = PAGINA
    for marca, valor in (("/*__TOKENS__*/", comun.css()),
                         ("/*__COMPONENTES_CSS__*/", (ROOT / "web/sate/componentes.css").read_text(encoding="utf-8")),
                         ("/*__TEXTO_JS__*/", texto), ("/*__TEXTOS__*/", contenido.js()),
                         ("/*__COMPONENTES_JS__*/", (ROOT / "web/sate/componentes.js").read_text(encoding="utf-8"))):
        html = html.replace(marca, valor, 1)
    out = ROOT / "web" / "qa-componentes.html"
    out.write_text(html, encoding="utf-8")
    print(out, len(html) // 1024, "KB")


if __name__ == "__main__":
    main()
