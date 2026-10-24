// R15: regresión de decisiones, navegación y DOM. Sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {crearEntorno} from './dom_minimo.mjs';
const leer=p=>readFileSync(p,'utf8'), json=p=>JSON.parse(leer(p));
const config=json('data/sate.json'), orientacion=json('data/guia/rutas.json');
const textos=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]).textos;
const texto=(k,v={})=>(textos[k]||k).replace(/\{(\w+)\}/g,(_,k)=>v[k]??k);
const pure=vm.createContext({});vm.runInContext(leer('web/sate/guia.js'),pure);
const G=pure.SateGuia;
assert.equal(G.resolverRuta(null,{motivo:'recursamiento',dictamen:'no'}),null,'sin regla no se inventa dictamen');
assert.equal(G.resolverRuta({rd:{n:1,ok:true}},{motivo:'antiguas',dictamen:'no'}),'oportunidades-reprobar','respeta excepción transitoria');
assert.equal(G.resolverRuta({rd:{n:1,ok:false}},{motivo:'antiguas',dictamen:'no'}),'formato-dictamen');
assert.equal(G.resolverRuta({rd:{n:1,ok:false}},{motivo:'antiguas',dictamen:'si'}),null,'dictamen vigente requiere revisión');
assert.equal(G.resolverRuta({rd:{n:1,ok:false}},{motivo:'antiguas',dictamen:'desconocido'}),'formato-dictamen','usa la regla calculada aunque no se responda el formulario');
assert.equal(G.nombreMateria('ONDAS ELECTROMAGNÉTICAS'),'Ondas electromagnéticas');
assert.equal(G.motivoInicial({nDes:2,fis:[{veces:2}]}),'recursamiento');
assert.equal(G.motivoInicial({nDes:1,fis:[{veces:1}]}),'antiguas');
const rutaIrregular=orientacion.rutas.find(r=>r.id==='irregular'),rutaActividades=orientacion.rutas.find(r=>r.id==='aprovecha');
for(const id of ['cambio-carrera','carrera-simultanea'])assert.ok(rutaIrregular.preguntas.includes(id));
assert.deepEqual(rutaActividades.consultas,['idiomas-celex-upiita']);
assert.deepEqual(rutaActividades.muestrasActividades,['deporte','salud']);
assert.equal(G.resolverRuta(null,{motivo:'pausa',dictamen:'desconocido'}),'baja-temporal');
const source=leer('web/sate/guia.js'), css=leer('web/sate/guia.css');
const nuevoCss=css.slice(0,css.indexOf('.guia-etapas{'));
assert.doesNotMatch(nuevoCss,/#[\da-f]{3,8}\b|(?:color|background):\s*(?:white|black)/i);
assert.ok(new Set([...nuevoCss.matchAll(/font-size:var\((--ipn-tamano-\w+)\)/g)].map(m=>m[1])).size<=5);
assert.match(nuevoCss,/@media\(max-width:1024px\)/);
assert.match(nuevoCss,/@media\(max-width:768px\)/);
assert.match(nuevoCss,/@media\(max-width:479px\).*grid-template-columns:minmax\(0,1fr\)/s);
assert.match(nuevoCss,/overflow-x:auto/);
assert.match(nuevoCss,/min-height:var\(--ipn-control-alto\)/);
assert.match(nuevoCss,/:focus-visible/);
for(const unidad of ['upiita','escom','upibi']){
 const datos=json('web/dist/sate/datos/'+unidad+'/guia.json');
 assert.ok(!G.buscarSoluciones(datos,'reprobe el recurse').some(p=>p.id==='titulacion'),'excluye coincidencias débiles');
 assert.deepEqual(datos.orientacion,orientacion);
 for(const p of datos.preguntas)assert.equal(orientacion.rutas.filter(r=>r.preguntas.includes(p.id)).length,1,p.id);
 for(const id of config.unidades[unidad].tramites)assert.equal(orientacion.rutas.filter(r=>r.tramites.includes(id)).length,1,id);
 for(const a of datos.actividades?.elementos||[])assert.equal(orientacion.rutas.filter(r=>r.actividades?.includes(a.categoria)).length,1,a.nombre);
 for(const [q,id] of [['reprobe el recurse','veces-cursar-materia'],['baja temporal','baja-temporal'],['ingles titulacion','titulacion']])assert.equal(G.buscarSoluciones(datos,q)[0]?.id,id);
 for(const ancho of [1300,1024,768,375])for(const tema of ['claro','oscuro']){
  const {document,Evento}=crearEntorno();document.createElementNS=(_,tag)=>document.createElement(tag);
  document.documentElement.setAttribute('data-tema',tema);
  const perfil={adeudos:['DEMO','UNO'],fis:[{k:'DEMO',veces:2,estado:'desfasada'},{k:'UNO',veces:1,estado:'desfasada'}],nDes:2,rd:{n:2,ok:false,des:[{k:'DEMO',veces:2,estado:'desfasada'},{k:'UNO',veces:1,estado:'desfasada'}]},D:{obt:5,total:10}};
  let s=null,pestana;
  const c=vm.createContext({document,console,setTimeout,clearTimeout,innerWidth:ancho,
   location:{hash:'#/'+unidad+'/guia',pathname:'/',search:''},history:{replaceState(_,__,hash){c.location.hash=hash;}},scrollTo(){},addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:ancho<900}),
   SATE_UNIDAD:unidad,SATE_CONFIG:config,situacionDatos:()=>s,cur:()=>({DEMO:['ONDAS ELECTROMAGNÉTICAS'],UNO:['CÁLCULO']}),
   calItems:()=>({items:[{para:'dictamen',pasada:true,titulo:'Dictamen anterior',hasta:'2026-10-01'},{para:'dictamen',pasada:false,titulo:'Dictamen ficticio',hasta:'2026-11-02'}]}),
   SATE:{texto,json:async ruta=>ruta.includes('/busqueda/')?json('web/dist/sate/'+ruta):datos,pestana:(_,p)=>pestana=p,error:e=>{throw e;},calendario:{recorte:tipo=>{assert.equal(tipo,'guia');return [{titulo:'ETS ficticio',desde:'2026-11-01'}];}}}});
  config.unidades[unidad].guiaDatos=true;
  vm.runInContext(leer('web/sate/componentes.js'),c);vm.runInContext(source,c);vm.runInContext(leer('web/sate/rutas.js'),c);
  const caja=document.createElement('div');caja.setAttribute('id','sate-guia');document.body.appendChild(caja);
  const abrir=async(...partes)=>{await pestana.mostrar({partes});assert.equal(caja.querySelector('[role="alert"]'),null,ancho+'/'+tema);};
  await abrir();
  assert.equal(caja.querySelectorAll('[data-ruta]').length,4);
  assert.equal(caja.querySelector('.sate-tarjetas-nav'),null,'sin rejilla vieja');
  assert.equal(caja.querySelector('.guia-hoy'),null,'sin perfil no hay franja');
  s=perfil;await abrir();assert.ok(caja.querySelector('.guia-hoy'));assert.equal(caja.querySelector('[data-ruta="irregular"]').getAttribute('aria-current'),'true');
  assert.equal(caja.querySelectorAll('.guia-estado').length,2);
  assert.match(caja.querySelector('.guia-hoy').textContent,/ETS ficticio/);
  assert.ok(caja.querySelector('.guia-busqueda-campo svg'));
  assert.match(caja.querySelector('[data-ruta="aprovecha"]').textContent,/actividades deportivas.*atención a la salud/);
  assert.doesNotMatch(caja.querySelector('[data-ruta="aprovecha"]').textContent,/\d+ formatos?/);
  for(const tarjeta of caja.querySelectorAll('[data-ruta]'))assert.doesNotMatch(tarjeta.textContent,/0 formatos|1 formatos/);
  for(const q of ['reprobe el recurse','baja temporal','ingles titulacion']){
   const input=caja.querySelector('#guia-q');input.value=q;input.dispatchEvent(new Evento('input'));await new Promise(r=>setTimeout(r,190));
   assert.ok(caja.querySelector('.guia-busqueda-grupos h3'));assert.ok(caja.querySelectorAll('.guia-busqueda-grupos a').length);
   assert.ok(c.location.hash.endsWith('?q='+encodeURIComponent(q)));
   input.dispatchEvent(new Evento('keydown',{key:'ArrowDown'}));assert.equal(document.activeElement.tagName,'A');
   const href=document.activeElement.getAttribute('href');input.dispatchEvent(new Evento('keydown',{key:'Enter'}));assert.equal(c.location.hash,href,'Enter abre el resultado seleccionado');
   input.dispatchEvent(new Evento('keydown',{key:'Escape'}));assert.equal(input.value,'');
  }
  for(const r of orientacion.rutas){
   assert.ok(c.SateRutas.ruta('#/'+unidad+'/guia/ruta/'+r.id,unidad,config.unidades));
   await abrir('ruta',r.id);assert.ok(caja.querySelector('.guia-ruta-panel'));assert.ok(caja.querySelector('.guia-mas'));
   if(r.id==='irregular'){
    assert.equal(caja.querySelector('.guia-toca h3').textContent,'Pide dictamen antes de reinscribirte');
    assert.doesNotMatch(caja.querySelector('.guia-toca').textContent,/Falta información/);
    if(config.unidades[unidad].tramites.includes('dictamen'))assert.equal(caja.querySelector('.guia-toca-principal').getAttribute('href'),'#/'+unidad+'/tramites/dictamen');
    else assert.equal(caja.querySelector('.guia-toca-principal'),null,'no enlaza a un trámite ausente');
    assert.equal(caja.querySelectorAll('.guia-toca-datos dt').length,3);
    assert.equal(caja.querySelector('.guia-toca-datos time').getAttribute('datetime'),'2026-11-02');
    assert.doesNotMatch(caja.querySelector('.guia-toca-datos').textContent,/Dictamen anterior/);
    assert.match(caja.querySelector('.guia-toca').textContent,/Ondas electromagnéticas/);
    const opciones=caja.querySelectorAll('.guia-opciones button');
    assert.ok([...opciones].some(b=>b.textContent==='Cálculo · 1 vez cursada'));
    assert.ok([...opciones].some(b=>b.textContent==='Reprobé el recursamiento'&&b.getAttribute('aria-pressed')==='true'));
   }
   assert.equal(caja.querySelectorAll('.guia-mas li').length,datos.preguntas.filter(p=>r.preguntas.includes(p.id)).length,'todas las respuestas aparecen también debajo de la ruta');
  }
  s=null;c.location.hash='#/'+unidad+'/guia?q=reprobe%20el%20recurse';await abrir();await new Promise(r=>setTimeout(r,190));assert.ok(caja.querySelector('.guia-busqueda-grupos h3'));
 }
}
console.log('OK R15: rutas sin huérfanos en tres unidades, decisiones conservadoras, búsqueda, teclado, enlaces profundos, DOM 1300/1024/768/375 claro/oscuro y reglas CSS. Sin medición visual de geometría.');
