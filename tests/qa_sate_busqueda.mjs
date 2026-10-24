// Índice completo, enlaces, carga acotada y literalidad DOM, sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {crearEntorno} from './dom_minimo.mjs';
const leer = p => readFileSync(p,'utf8'), json = p => JSON.parse(leer(p));
const pure=vm.createContext({}); vm.runInContext(leer('web/sate/guia.js'),pure);
const G=pure.SateGuia;
const html=leer('web/dist/sate/index.html');
const config=JSON.parse(html.match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const texto=(k,v={})=>(config.textos[k]||k).replace(/\{(\w+)\}/g,(_,k)=>v[k]??k);
const esperar=()=>new Promise(r=>setTimeout(r,190));
for(const unidad of Object.keys(config.unidades)){
 const base='web/dist/sate/datos/'+unidad+'/busqueda/', manifiesto=json(base+'indice.json');
 const entradas=Object.entries(manifiesto.fuentes).flatMap(([fuente,m])=>m.partes.flatMap(p=>G.expandirIndice(json(base+p.archivo)).map(e=>({...e,fuente}))));
 const reglamentos=new Map();
 for(const e of entradas.filter(e=>e.fuente==='reglamentos'&&e.ruta.includes('/art-'))){
  if(!reglamentos.has(e.doc))reglamentos.set(e.doc,json('data/reglamentos/'+e.doc+'.json'));
  const [n,fr]=e.ruta.split('?')[0].split('/art-')[1].split('.'),a=reglamentos.get(e.doc).articulos.find(a=>String(a.n)===n);
  const posicion=new URLSearchParams(e.ruta.split('?')[1]||'').get('frpos');
  assert.equal(e.texto,fr?(posicion?a.fracciones[Number(posicion)-1]:a.fracciones.find(f=>f.fr===fr)).texto:a.texto,'el índice conserva el artículo o fracción completo y literal');
 }
 for(const f of ['preguntas','reglamentos','acudir','formatos','calendario'])assert.ok(entradas.some(e=>e.fuente===f),unidad+': '+f);
 const opciones={orientacion:manifiesto.orientacion};
 assert.ok(G.buscarIndice(entradas,'baja temporal',opciones).some(e=>e.ruta.includes('/baja-temporal')));
 assert.ok(G.buscarIndice(entradas,'interrumpir sus efectos',opciones).some(e=>e.ruta.includes('/honor/art-44')));
 const acotados=G.buscarIndice(entradas,'baja temporal',{...opciones,fuente:'reglamentos',doc:'rge'});
 assert.ok(acotados.length);assert.ok(acotados.every(e=>e.doc==='rge'));
 if(Object.keys(manifiesto.carreras).length){
  assert.ok(G.buscarIndice(entradas,'control',opciones).some(e=>e.fuente==='programas'));
  assert.ok(G.buscarIndice(entradas,'Gauss-Jordan',opciones).some(e=>e.ruta.includes('/B103/objetivo')));
  const resultados=G.buscarIndice(entradas,'control',{...opciones,fuente:'programas',carrera:'bionica'});
  assert.ok(resultados.length);assert.ok(resultados.every(e=>e.carrera==='bionica'&&e.carreraNombre));
 }
 for(const ancho of [1300,1024,768,375])for(const tema of ['claro','oscuro']){
  const {document,Evento}=crearEntorno(),pedidos=[]; document.documentElement.setAttribute('data-tema',tema);
  document.createElementNS=(_,tag)=>document.createElement(tag);
  let pestana;
  const c=vm.createContext({document,console,setTimeout,clearTimeout,innerWidth:ancho,
   location:{hash:'#/'+unidad+'/guia'},history:{replaceState(){}},addEventListener(){},removeEventListener(){},scrollTo(){},matchMedia:()=>({matches:ancho<769}),
   SATE_CONFIG:config,SATE_UNIDAD:unidad,SATE:{texto,pestana:(_,m)=>pestana=m,error:e=>{throw e;},json:async ruta=>{pedidos.push(ruta);return json('web/dist/sate/'+ruta);}}});
  vm.runInContext(leer('web/sate/componentes.js'),c);vm.runInContext(leer('web/sate/guia.js'),c);
  const raiz=document.createElement('div');document.body.appendChild(raiz);
  raiz.appendChild(c.SATE.guia.buscador({fuente:'reglamentos',doc:'rge',nombre:'Reglamento General de Estudios'}));
  assert.equal(pedidos.length,0,'no descarga antes de buscar');
  const input=raiz.querySelector('input');input.value='baja temporal';input.dispatchEvent(new Evento('input'));await esperar();
  assert.ok(raiz.querySelectorAll('.guia-busqueda-grupos li').length);
  assert.ok(raiz.querySelector('mark'));
  assert.ok(pedidos.every(p=>p.endsWith('indice.json')||p.endsWith('reglamentos-rge.json')),'carga únicamente la fuente acotada');
  assert.ok(raiz.textContent.includes('En Reglamento General de Estudios'));
  assert.ok(raiz.textContent.includes('Buscar en toda la Guía'));
  input.value='';input.dispatchEvent(new Evento('input'));await esperar();assert.equal(raiz.querySelectorAll('li').length,0);
  const posicion=document.scrolled;
  await c.SATE.articulo('honor','34');
  const original=json('data/reglamentos/honor.json').articulos.find(a=>a.n==='34');
  assert.equal(document.querySelector('.guia-articulo-literal').textContent,original.texto,'envolver referencias conserva cada carácter');
  assert.ok(document.querySelector('.sate-modal--flotante'));
  assert.ok(document.querySelectorAll('.guia-articulo-literal button').length>0,'referencias reales envueltas');
  document.querySelector('dialog').dispatchEvent(new Evento('cancel'));
  assert.equal(document.querySelector('dialog').open,false,'Esc cierra la consulta');
  assert.equal(document.scrolled,posicion,'no mueve el lector');
 }
}
const refs=json('data/referencias/reglamentos.json');
assert.ok(refs.length>100);
const css=leer('web/sate/componentes.css');
assert.match(css,/\.rgl-contexto\{position:sticky/);
assert.match(css,/\.sate-modal--flotante::backdrop\{background:transparent/);
assert.match(css,/min-height:var\(--ipn-control-alto\)/);
assert.match(leer('web/sate/inicio.js'),/document.title = texto\(actual.tramite/);
console.log('OK búsqueda: todas las fuentes, destinos internos, carreras, acotación y carga perezosa en tres unidades; DOM 1300/1024/768/375 claro/oscuro. Sin geometría visual.');
