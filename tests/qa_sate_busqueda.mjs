// Índice completo, enlaces, carga acotada y literalidad DOM, sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {crearEntorno} from './dom_minimo.mjs';
const leer = p => readFileSync(p,'utf8'), json = p => JSON.parse(leer(p));
const pure=vm.createContext({}); vm.runInContext(leer('web/sate/guia.js'),pure);
const G=pure.SateGuia;
const grupos=G.agruparReglamentos([
 {doc:'portada',titulo:'Consejo consultivo',ruta:'/portada',texto:'Consejo consultivo',_pesoBusqueda:10000},
 {doc:'uno',titulo:'Uno',ruta:'/uno/art-1',texto:'Consejo consultivo',_pesoBusqueda:100},
 {doc:'dos',titulo:'Dos',ruta:'/dos/art-1',texto:'Consejo consultivo'},
 {doc:'dos',titulo:'Dos',ruta:'/dos/art-1.I',texto:'Consejo consultivo'},
 {doc:'dos',titulo:'Dos',ruta:'/dos/art-2',texto:'Consejo consultivo'},
 {doc:'solo-migas',titulo:'Consejo consultivo',ruta:'/migas/art-1',texto:'Asunto distinto',_pesoBusqueda:10000}
],'consejo consultivo');
assert.deepEqual(Array.from(grupos,g=>[g.doc,g.articulos]),[['dos',2],['uno',1],['portada',0],['solo-migas',0]],'ordena por artículos reales, sin contar fracciones ni títulos como artículos');
const html=leer('web/dist/sate/index.html');
const config=JSON.parse(html.match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const texto=(k,v={})=>(config.textos[k]||k).replace(/\{(\w+),\s*plural,\s*((?:[^{}]*\{[^{}]*\})+)\s*\}/g,(_,clave,cuerpo)=>{const n=Number(v[clave]),opciones=Object.fromEntries([...cuerpo.matchAll(/(=?\w+)\s*\{([^{}]*)\}/g)].map(([,op,tx])=>[op,tx]));return (opciones['='+n]??opciones[n===1?'one':'other']).replace(/#/g,String(n));}).replace(/\{(\w+)\}/g,(_,k)=>v[k]??k);
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
 assert.equal(G.textoVisibleIndice('Puedes [[g:baja_temporal|baja temporal]] ([[a:rge:55|art. 55]])'), 'Puedes baja temporal (art. 55)', 'limpia marcas internas antes de buscar/resaltar fragmentos');
 assert.equal(G.fragmento('Puedes [[g:baja_temporal|baja temporal]] ([[a:rge:55|art. 55]])','baja temporal'), 'Puedes baja temporal (art. 55)', 'el fragmento nunca expone claves internas');
 assert.equal(texto('sate.guia.busqueda.coincidencias_reglamento',{n:1}), '1 coincidencia');
 assert.equal(texto('sate.guia.busqueda.coincidencias_reglamento',{n:2}), '2 coincidencias');
 assert.ok(G.buscarIndice(entradas,'baja temporal',opciones).some(e=>e.ruta.includes('/baja-temporal')));
 assert.ok(G.buscarIndice(entradas,'interrumpir sus efectos',opciones).some(e=>e.ruta.includes('/honor/art-44')));
 const acotados=G.buscarIndice(entradas,'baja temporal',{...opciones,fuente:'reglamentos',doc:'rge'});
 assert.ok(acotados.length);assert.ok(acotados.every(e=>e.doc==='rge'));
 if(unidad==='upiita') assert.equal(G.agruparReglamentos(G.buscarIndice(entradas,'baja temporal',{...opciones,fuente:'reglamentos'}))[0].doc,'rge','el RGE encabeza la búsqueda de baja temporal');
 if(Object.keys(manifiesto.carreras).length){
  assert.ok(G.buscarIndice(entradas,'control',opciones).some(e=>e.fuente==='programas'));
  assert.ok(G.buscarIndice(entradas,'Gauss-Jordan',opciones).some(e=>e.ruta.includes('/B103/objetivo')));
  const resultados=G.buscarIndice(entradas,'control',{...opciones,fuente:'programas',carrera:'bionica'});
  assert.ok(resultados.length);assert.ok(resultados.every(e=>e.carrera==='bionica'&&e.carreraNombre));
 }
 const datos=json('web/dist/sate/datos/'+unidad+'/guia.json');
 const directa=G.respuestaDirecta(datos,'consejo consultivo');
 assert.deepEqual(Array.from(directa.definiciones,g=>g.id).sort(),['cgc','ctce']);
 assert.equal(directa.pregunta,null);
 assert.deepEqual(Array.from(G.respuestaDirecta(datos,'qué es el Consejo General Consultivo').definiciones,g=>g.id),['cgc']);
 assert.deepEqual(Array.from(G.respuestaDirecta(datos,'consejo tecnico consultivo escolar').definiciones,g=>g.id),['ctce']);
 assert.ok(directa.definiciones.find(g=>g.id==='cgc').definicionFuentes.some(f=>f.doc==='ri'&&f.arts.includes('184')));
 assert.equal(G.respuestaDirecta(datos,'solicitud extraterrestre').pregunta,null);
 assert.equal(G.respuestaDirecta({preguntas:[{pregunta:'¿Quién resuelve mi dictamen?',respuesta:'Consejo consultivo'}]},'consejo consultivo').pregunta,null,'la respuesta vecina no supera el umbral');
 for(const q of ['baja temporal','reprobe el recurse','ingles titulacion'])assert.ok(G.respuestaDirecta(datos,q).pregunta || G.respuestaDirecta(datos,q).definiciones.length,'conserva las sugerencias');
 for(const ancho of [1440,1024,768,375,320])for(const tema of ['claro','oscuro']){
  const {document,Evento}=crearEntorno(),pedidos=[]; document.documentElement.setAttribute('data-tema',tema);
  document.createElementNS=(_,tag)=>document.createElement(tag);
  let pestana;
  const c=vm.createContext({document,console,setTimeout,clearTimeout,innerWidth:ancho,
   location:{hash:'#/'+unidad+'/guia'},history:{replaceState(){}},addEventListener(){},removeEventListener(){},scrollTo(){},matchMedia:()=>({matches:ancho<769}),
   SATE_CONFIG:config,SATE_UNIDAD:unidad,SATE:{texto,pestana:(_,m)=>pestana=m,error:e=>{throw e;},json:async ruta=>{pedidos.push(ruta);return json('web/dist/sate/'+ruta);}}});
  vm.runInContext(leer('web/sate/componentes.js'),c);vm.runInContext(leer('web/sate/guia.js'),c);
  const raiz=document.createElement('div');raiz.setAttribute('id','sate-guia');document.body.appendChild(raiz);
  raiz.appendChild(c.SATE.guia.buscador({fuente:'reglamentos',doc:'rge',nombre:'Reglamento General de Estudios'}));
  assert.equal(pedidos.length,0,'no descarga antes de buscar');
  const input=raiz.querySelector('input');input.value='baja temporal';input.dispatchEvent(new Evento('input'));await esperar();
  assert.ok(raiz.querySelectorAll('.guia-busqueda-grupos li').length);
  assert.ok(raiz.querySelector('mark'));
  for(const [original,q] of [
   ['Consejo Técnico Consultivo Escolar (CTCE)','consejo consultivo'],
   ['Situación académica y resolución','situacion resolucion'],
   ['Puedes [[g:baja_temporal|baja temporal]] sin perder espacios','baja temporal'],
   ['Situacio\u0301n y te\u0301cnica','situacion tecnica']
  ]){
   const a=document.createElement('a');a.append(...c.SateGuia.resaltar(original,q));
   assert.equal(a.textContent,G.textoVisibleIndice(original));
   assert.ok(a.querySelector('mark'));
   assert.doesNotMatch(a.textContent,/\[\[|\]\]/);
  }
  assert.ok(pedidos.every(p=>p.endsWith('indice.json')||p.endsWith('reglamentos-rge.json')),'carga únicamente la fuente acotada');
  assert.ok(raiz.textContent.includes('En Reglamento General de Estudios'));
  assert.ok(raiz.textContent.includes('Buscar en toda la Guía'));
  input.value='';input.dispatchEvent(new Evento('input'));await esperar();assert.equal(raiz.querySelectorAll('li').length,0);
  c.location.hash='#/'+unidad+'/guia?q=consejo%20consultivo';
  await pestana.mostrar({partes:[]});await esperar();
  const respuesta=raiz.querySelector('.guia-respuesta-directa');
  assert.equal(respuesta.querySelector('h3').textContent,'Qué es');
  assert.ok(respuesta.textContent.includes(datos.glosario.cgc.definicion));
  assert.ok(respuesta.textContent.includes(datos.glosario.ctce.definicion));
  for(const id of ['consejo-general','ctce'])if(datos.acudir.some(a=>a.id===id))assert.ok([...respuesta.querySelectorAll('a')].some(a=>a.getAttribute('href')==='#/'+unidad+'/guia/acudir/'+id));
  for(const [doc,ns] of [['ri',['184','185','202','203']],['lo',['25','27','28']]]){
   const reg=json('data/reglamentos/'+doc+'.json');
   for(const n of ns){
    const a=reg.articulos.find(a=>a.n===n), p=G.partesArticulo(a);
    assert.ok([...respuesta.querySelectorAll('blockquote')].some(b=>b.textContent===p.intro&&b.getAttribute('data-oficial')===doc));
    for(const fr of p.fracciones)assert.ok([...respuesta.querySelectorAll('blockquote')].some(b=>b.textContent===fr.texto&&b.getAttribute('data-oficial')===doc));
   }
  }
  const llamada=[...respuesta.querySelectorAll('button')].find(b=>b.textContent.includes('art. 184'));
  llamada.click();await esperar();assert.ok(document.querySelector('.sate-modal--flotante'));
  document.querySelector('dialog').dispatchEvent(new Evento('cancel'));
  let fraccion;
  const abrirArticulo=c.SATE.articulo;c.SATE.articulo=(...args)=>{fraccion=args;};
  [...respuesta.querySelectorAll('button')].find(b=>b.textContent.includes('art. 25')&&b.textContent.endsWith('fracción I')).click();
  assert.deepEqual(fraccion,['lo','25','I'],'la cita abre la fracción literal en el flotante');c.SATE.articulo=abrirArticulo;
  const global=raiz.querySelector('input');global.value='consulta extraterrestre';global.dispatchEvent(new Evento('input'));await esperar();
  assert.equal(respuesta.children.length,0,'no deja respuesta previa o irrelevante');
  const posicion=document.scrolled;
  await c.SATE.articulo('honor','34');
  const original=json('data/reglamentos/honor.json').articulos.find(a=>a.n==='34');
  assert.equal(document.querySelector('.guia-articulo-literal').textContent,original.texto,'envolver referencias conserva cada carácter');
  assert.ok(document.querySelector('.sate-modal--flotante'));
  assert.ok(document.querySelectorAll('.guia-articulo-literal button').length>0,'referencias reales envueltas');
  document.querySelector('dialog').dispatchEvent(new Evento('cancel'));
  assert.equal(document.querySelector('dialog[open]'),null,'Esc cierra la consulta');
  assert.equal(document.scrolled,posicion,'no mueve el lector');
 }
}
const refs=json('data/referencias/reglamentos.json');
assert.ok(refs.length>100);
const css=leer('web/sate/componentes.css');
assert.match(css,/\.rgl-contexto\{position:sticky/);
assert.match(css,/\.sate-modal--flotante::backdrop\{background:transparent/);
assert.match(css,/min-height:var\(--ipn-control-alto\)/);
assert.match(css,/\.guia-busqueda-grupos\{[^}]*grid-template-columns:minmax\(0,1fr\)/);
assert.match(css,/\.guia-busqueda-grupos a,[^{]+\{display:block/,'el enlace no convierte palabras y espacios en elementos flex');
assert.match(css,/\.guia-respuesta-directa\{max-width:68ch/);
assert.match(css,/\.guia-resultado\{[^}]*line-height:1\.6/);
assert.match(leer('web/sate/inicio.js'),/document.title = texto\(actual.tramite/);
console.log('OK búsqueda R17: espacios, acentos, Qué es, RI 184, citas literales y fracciones, umbral, grupos, carreras y sugerencias; tres unidades, DOM 1440/1024/768/375/320 claro/oscuro. Sin geometría visual.');
