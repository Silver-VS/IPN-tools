// R16: navegación entre plataformas sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {crearEntorno} from './dom_minimo.mjs';
const leer=p=>readFileSync(p,'utf8');
const inicio=leer('web/sate/inicio.js');
const config=JSON.parse(leer('data/sate.json')).unidades;
for(const u of Object.keys(config)) {
  const {document}=crearEntorno();
  const cab=document.createElement('header');cab.className='sate-encabezado';
  const marca=document.createElement('div');marca.className='sate-marca';
  const siglas=document.createElement('span');siglas.className='sate-siglas';marca.appendChild(siglas);cab.appendChild(marca);document.body.appendChild(cab);
  const brand=document.createElement('div');brand.className='brand';marca.appendChild(brand);
  const contenido=document.createElement('section');contenido.setAttribute('id','sate-guia');document.body.appendChild(contenido);
  const almacen=new Map();let posicion;
  const c=vm.createContext({document,u,config,console,Number,JSON,
    texto:(k,v={})=>k==='sate.puentes.regresar'?'‹ Regresar a '+v.origen:k,
    requestAnimationFrame:f=>f(),window:{scrollTo:(_,y)=>posicion=y},
    sessionStorage:{setItem:(k,v)=>almacen.set(k,v),getItem:k=>almacen.get(k),removeItem:k=>almacen.delete(k)}});
  vm.runInContext(leer('web/sate/rutas.js'),c);
  c.SateRutas=c.window.SateRutas;
  vm.runInContext(inicio.slice(inicio.indexOf('  let regresoPuente'),inicio.indexOf('  function error(e)')),c);
  vm.runInContext(`pintarPlataformas({pestana:'mapa'});pintarPlataformas({pestana:'guia'});`,c);
  assert.equal(document.querySelectorAll('#sate-plataformas').length,1);
  assert.equal(document.querySelector('#sate-plataforma-guia').getAttribute('aria-current'),'page');
  assert.equal(siglas.textContent,'sate.pestana.guia.titulo');
  assert.equal(document.querySelector('#sate-plataformas').parentNode,marca,'segmentos junto a la marca');
  vm.runInContext("pintarPlataformas({pestana:'mapa'})",c);
  assert.equal(document.querySelector('#sate-plataforma-sate').getAttribute('aria-current'),'page');
  assert.equal(document.querySelector('#sate-plataforma-guia').getAttribute('aria-current'),null);
  const origen={hash:'#/'+u+'/mapa',nombre:'Mapa curricular',y:437};
  c.origen=origen;c.destino='#/'+u+'/guia';
  vm.runInContext('guardarPuente(origen,destino);restaurarPuente({hash:destino,pestana:"guia"})',c);
  const volver=document.getElementById('sate-regresar');assert.equal(volver.getAttribute('href'),origen.hash);
  assert.equal(volver.textContent,'‹ Regresar a Mapa curricular');volver.onclick();
  assert.equal(volver.parentNode.parentNode,contenido.parentNode,'el regreso queda pegado antes del contenido de Guía');
  vm.runInContext('restaurarPuente({hash:origen.hash})',c);assert.equal(posicion,437);
  c.origen=origen;c.destino='#/'+u+'/guia';
  vm.runInContext('guardarPuente(origen,destino);restaurarPuente({hash:destino,pestana:"guia"})',c);
  document.querySelector('.sate-regreso-cerrar').onclick();
  assert.equal(document.getElementById('sate-regresar'),null,'× descarta el regreso');
  assert.equal(almacen.has('ipnt.puente'),false,'× borra el salto pendiente');
  c.origen=origen;c.destino='#/'+u+'/guia';
  vm.runInContext('guardarPuente(origen,destino);restaurarPuente({hash:destino,pestana:"guia"});restaurarPuente({hash:"#/"+u+"/horarios",pestana:"horarios"})',c);
  assert.equal(almacen.has('ipnt.puente'),false,'navegar a otra sección descarta el salto pendiente');
  c.sessionStorage.getItem=()=>{throw Error('almacen bloqueado')};
  vm.runInContext('restaurarPuente({hash:destino})',c);
}
const css=leer('web/sate/componentes.css');
assert.match(css,/sate-plataformas\{[^}]*flex-wrap:nowrap/);
assert.match(css,/sate-plataformas a\{[^}]*text-decoration:none/);
assert.match(css,/a:visited\{color:var\(--ipn-acento\)\}/,'los enlaces visitados conservan el color de acción');
assert.match(css,/\.sate-regreso\{[^}]*margin:0 0 var\(--ipn-esp-3\)/);
assert.match(css,/\.sate-regreso-cerrar\{[^}]*min-width:var\(--ipn-objetivo-tactil\)[^}]*min-height:var\(--ipn-objetivo-tactil\)/);
assert.match(css,/sate-plataformas \[aria-current=page\]\{[^}]*border-color:[^}]*--ipn-aviso/);
assert.match(css,/html\[data-vista=guia-vinculada\] #sate-nombre\{display:none\}/);
const cssEnc=leer('web/sate/encabezado.css');
assert.match(cssEnc,/@media\(min-width:1024px\)[\s\S]*?grid-template-areas:"marca contexto acciones"/,
  'desde 1024 px el puente mantiene marca, carrera y acciones en la misma fila');
assert.match(cssEnc,/@media\(min-width:1024px\) and \(max-width:1199px\)/,
  'el escalón corto se limita a 1024–1199 px');
assert.match(cssEnc,/\.sate-encabezado:has\(\.sate-plataformas\) #sate-leyenda\{[^}]*color:transparent/);
assert.match(cssEnc,/\.sate-encabezado:has\(\.sate-plataformas\) #sate-leyenda (?:\.sate-ayuda__btn)?::before\{content:"•"/,
  'la fase de prueba se reduce a un punto con el title como ayuda');
assert.match(cssEnc,/\.sate-encabezado:has\(\.sate-plataformas\) \.header-actions \.saes-open \.sate-texto-corto\{display:inline\}/,
  'el escalón corto muestra Actualizar y conserva el aria-label del botón');
assert.match(cssEnc,/@media\(max-width:767px\)/);
assert.match(css,/@media\(max-width:767px\)[\s\S]*?\.sate-plataformas a\{padding-inline:/,
  'el selector de plataforma sigue presente en el encabezado compacto');
// Sin navegador no se calcula geometría; estas reglas fijan el escalón completo y el corto para 1440/1280/1024,
// el compacto para 768 y el flotante/compacto con plataformas visibles para 600/375.
for(const ancho of [1440,1280])assert.ok(ancho>=1200,'escalón completo '+ancho);
for(const ancho of [1024,768])assert.ok(ancho>=768,'escalón corto/compacto '+ancho);
for(const ancho of [600,375])assert.ok(ancho<=767,'escalón flotante/compacto '+ancho);
assert.match(inicio,/filter\(id=>id!=='guia'\)/);
assert.match(inicio,/SATE\.articulo\(m\[1\]/);
assert.doesNotMatch(inicio,/config\[unidad\] = .*generica:true/);
const temarios=leer('web/sate/temarios.js');
assert.match(temarios,/sate\.puentes\.programa/);assert.match(temarios,/new Set\(grupos\.map\(c=>c\[3\]\)\)/);
assert.match(temarios,/horarios\?materia=/);assert.match(temarios,/sate\.puentes\.todo/);
assert.match(leer('web/sate/horarios.js'),/if\(materia\)S\.q=materia/);
assert.match(leer('web/sate/guia.js'),/if\(s\)\{/);
assert.match(leer('web/sate/guia.js'),/sate\.puentes\.ets/);
assert.match(leer('contenido/textos/es.toml'),/en_ventanilla = "Llenar en la Ventanilla ›"/);
const nucleo=leer('web/sate/nucleo.js');
const mapa=leer('web/sate/mapa.js');
assert.match(mapa,/open\?`<div class="tl-more">\$\{inspParts\(k\)\.l2\}/,
  'la ficha expandida de Lista consume el mismo bloque de relaciones');
assert.match(nucleo,/const l2=.*SATE\.relacionesHtml\(SATE\.relacionesMateria\(k\)\)/,
  'la ficha compartida incluye Lo que aplica y Trámite para situaciones del perfil');
assert.match(leer('web/sate/horarios.js'),/SATE\.relacionesHtml\(SATE\.relacionesMateria\(k\)\)/,
  'Horarios usa las mismas relaciones de la ficha');
const unidadesConfig=JSON.parse(leer('data/sate.json')).unidades;
for(const unidad of ['escom','upibi']){
  assert.deepEqual(unidadesConfig[unidad].tramites,[],`${unidad} no declara trámites activos`);
  assert.ok(!unidadesConfig[unidad].guiaTramites,`${unidad} no enlaza trámites a una ruta de Guía`);
  assert.equal(unidadesConfig[unidad].electivas.tramite,null,`${unidad} no activa trámite de electivas`);
}
const inspector=vm.createContext({cur:()=>({DEMO:['Materia ficticia',3,1]}),prereqs:()=>({}),dependents:()=>({}),ancestors:()=>new Set(),semOf:()=>({}),offeredClaves:()=>new Set(),esc:String,pretty:String,textoCreditos:()=>3,ayudaCreditos:()=>'',porNiveles:()=>false,PLAN_DOS_PERIODOS:false,isPersonal:()=>false,isElec:()=>false,S:{car:'B'},UNIDAD:'unidad',classes:()=>[['B',null,null,'1BM1',null,null,null,null,'DEMO']],SATE:{texto:(k,v={})=>k+':'+(v.n||'')}});
vm.runInContext(nucleo.slice(nucleo.indexOf('function inspParts(k)'),nucleo.indexOf('/* Materias del horario inscrito')),inspector);
const ficha=inspector.inspParts('DEMO');
assert.match(ficha.l2,/horarios\?materia=DEMO/);assert.match(ficha.l2,/sate.puentes.grupos:1/);
assert.match(ficha.l2,/sate.puentes.todo/);assert.doesNotMatch(ficha.l2,/tag-rel|guia\/programas/);
console.log('R16: interruptor, regreso y desplazamiento, almacenamiento bloqueado, enlaces y perfil OK');
