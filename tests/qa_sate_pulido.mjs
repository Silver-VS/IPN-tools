// Regresiones de estructura y reglas CSS. Sin motor de composición visual.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {crearEntorno} from './dom_minimo.mjs';
const leer=p=>readFileSync(p,'utf8');
const fuente=leer('web/sate/horarios.js');
const css=leer('web/sate/componentes.css');
const shell=leer('web/sate/cascaron.html');
for(const ancho of [1300,1024,768,375])for(const oscuro of [false,true]){
  const {document,Elemento}=crearEntorno();
  Object.defineProperty(Elemento.prototype,'innerHTML',{set(html){
    this.replaceChildren();const pila=[this];
    for(const m of html.matchAll(/<\/([\w-]+)\s*>|<([\w-]+)([^>]*)>|([^<]+)/g)){
      if(m[1]){if(pila.length>1)pila.pop();continue}
      if(m[4]){pila.at(-1).appendChild(document.createTextNode(m[4]));continue}
      const n=document.createElement(m[2]);
      for(const a of m[3].matchAll(/([\w-]+)(?:="([^"]*)")?/g))n.setAttribute(a[1],a[2]||'');
      pila.at(-1).appendChild(n);pila.push(n);
    }
  }});
  document.body.innerHTML='<div id="genres"></div><button id="b-gen-clear"></button><details id="d-opciones" open><summary id="d-opciones-resumen"></summary></details>';
  const cs=[['','','','G1','','',[[0,600,690]],45,'A'],['','','','G2','','',[[0,690,780]],45,'B']];
  const c=vm.createContext({document,innerWidth:ancho,matchMedia:()=>({matches:oscuro}),
    $:s=>document.querySelector(s),S:{gen:{top:[{cs,days:[0],miss:[]}],subj:[]}},GT:{days:0},
    txH:(k,v={})=>k+JSON.stringify(v),esc:s=>String(s).replaceAll('"','&quot;'),fmtCr:String,name:c=>c[8],pretty:s=>s,ws:()=>({plan:'A'})});
  vm.runInContext(fuente.slice(fuente.indexOf('function renderGen(){'),fuente.indexOf('function renderOffer(){')),c);
  vm.runInContext('renderGen()',c);
  assert.match(document.querySelector('#d-opciones-resumen').textContent,/d_dias_sin_limite/);
  assert.equal(document.querySelectorAll('#genres details').length,1);
  assert.match(document.querySelector('[data-propuesta]').textContent,/d_sin_huecos/);
  assert.equal(document.querySelectorAll('#genres li').length,2);
}
assert.match(shell,/hor-propuestas \.genres\{[^}]*max-height:none;overflow:visible/);
assert.doesNotMatch(shell,/hor-propuestas \.genres\{[^}]*overflow-x:auto/);
assert.match(css,/\.cal \.blk b\{[^}]*overflow-wrap:normal;word-break:normal;hyphens:none;text-overflow:ellipsis/);
assert.match(css,/\.tramite-miniatura-hoja\{[^}]*display:grid[^}]*transform:scale\(\.25\)/);
assert.match(css,/\.tramite-miniatura--ampliada\{width:100%/);
assert.match(css,/\.tramite-cita\{[^}]*min-height:var\(--ipn-control-alto\)/);
assert.match(css,/\.tramite-rejilla\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
console.log('R15: DOM y contratos CSS en 1300/1024/768/375, claro/oscuro. Sin validación visual.');
