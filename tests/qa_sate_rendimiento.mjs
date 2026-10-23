// Medición reproducible sin navegador: CPU/DOM simulado, no representa pintura ni red.
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {crearEntorno} from './dom_minimo.mjs';
const leer=p=>readFileSync(p,'utf8'), costos=[];
function medir(nombre,fn){const t=performance.now(), r=fn();costos.push({nombre,ms:+(performance.now()-t).toFixed(3)});return r;}
for(const f of readdirSync('web/sate').filter(f=>f.endsWith('.js')))
  medir('parse JS '+f,()=>new vm.Script(leer('web/sate/'+f)));
for(const f of readdirSync('web/dist/sate/datos/upiita').filter(f=>f.endsWith('.json')))
  medir('parse JSON '+f,()=>JSON.parse(leer('web/dist/sate/datos/upiita/'+f)));
assert.match(leer('web/sate/cascaron.html'),/id="sate-fuentes"[^>]*media="print"/,'fuentes externas sin bloquear el arranque');
const rutas=vm.createContext({});vm.runInContext(leer('web/sate/rutas.js'),rutas);
const ruta=rutas.SateRutas.ruta('#/ficticia/guia/reglamentos/ri#art-55','ficticia',{ficticia:{pestanas:['guia']}});
assert.equal(ruta.partes[2],'art-55','segundo # conserva el artículo');
const {document,Elemento}=crearEntorno(), eventos=new Map(), idle=[];
Elemento.prototype.append=function(...ns){for(const n of ns)if(n)this.appendChild(n)};
document.createElementNS=(_,tag)=>document.createElement(tag);
const config=JSON.parse(leer('data/sate.json'));config.unidades.ficticia={guiaDatos:true,tramites:['dictamen']};
let pestana;
const c=vm.createContext({document,console,performance,setTimeout:fn=>{idle.push(fn);return idle.length},clearTimeout(){},
  requestIdleCallback:fn=>{idle.push(fn);return idle.length},cancelIdleCallback(){},
  requestAnimationFrame:fn=>{fn();return 1},cancelAnimationFrame(){},
  addEventListener:(t,f)=>eventos.set(t,f),removeEventListener:t=>eventos.delete(t),matchMedia:()=>({matches:false}),scrollTo(){},
  location:{href:'http://localhost/',hash:''},history:{pushState(){},replaceState(){}},SATE_CONFIG:config,SATE_UNIDAD:'ficticia',
  SATE:{texto:(k,v={})=>k+Object.values(v).join(' '),pestana:(_,p)=>pestana=p,error:e=>{throw e}},
  fetch:async url=>({ok:true,json:async()=>JSON.parse(leer(url.includes('/reglamentos/')?'data/reglamentos/'+url.split('/').pop():'data/guia/comun.json'))})});
for(const f of ['componentes.js','guia.js'])vm.runInContext(leer('web/sate/'+f),c);
const caja=document.createElement('div');caja.setAttribute('id','sate-guia');document.body.appendChild(caja);
for(const partes of [['situacion'],['reglamentos','ri'],['reglamentos','ri','art-55'],['reglamentos','ri','art-106.III']]){
  const t=performance.now();await pestana.mostrar({partes});
  costos.push({nombre:'montar '+partes.join('/'),ms:+(performance.now()-t).toFixed(3)});
  if(partes[2])assert.ok(caja.querySelector('.sate-resalte'),'ancla revelada');
  if(eventos.has('beforeprint')){
    const inicial=caja.querySelectorAll('.rgl-cuerpo').length;
    assert.ok(inicial<30,'solo vecindad inicial');
    eventos.get('beforeprint')();
    assert.ok(caja.querySelectorAll('.rgl-cuerpo').length>=295,'impresión completa');
  }
  pestana.ocultar();while(idle.length)idle.shift()({timeRemaining:()=>10});
}
if(process.argv[3]){
  const base=new URL(process.argv[3]);
  assert.ok(['localhost','127.0.0.1'].includes(base.hostname),'solo servidor local');
  const recursos=new Set(['index.html','nucleo.js','situacion.js','datos/upiita/nucleo.json','datos/reglamentos/ri.json']);
  const cfg=JSON.parse(leer('data/sate.json')).unidades.upiita;
  for(const id of cfg.pestanas)for(const url of rutas.SateRutas.recursos(cfg,'upiita',id))recursos.add(url);
  for(const url of recursos){
    const t=performance.now(), respuesta=await fetch(new URL(url,base));assert.ok(respuesta.ok,url);
    const bytes=(await respuesta.arrayBuffer()).byteLength;
    costos.push({nombre:'HTTP '+url,ms:+(performance.now()-t).toFixed(3),bytes});
  }
}
costos.sort((a,b)=>b.ms-a.ms);
console.table(costos.slice(0,10));
if(process.argv[2])writeFileSync(process.argv[2],JSON.stringify(costos,null,2)+'\n');
console.log('OK rendimiento: DOM en memoria, anclas y finalización para impresión.');
