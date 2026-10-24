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
  vm.runInContext('guardarPuente(origen,destino);restaurarPuente({hash:destino})',c);
  const volver=document.getElementById('sate-regresar');assert.equal(volver.getAttribute('href'),origen.hash);
  assert.equal(volver.textContent,'‹ Regresar a Mapa curricular');volver.onclick();
  vm.runInContext('restaurarPuente({hash:origen.hash})',c);assert.equal(posicion,437);
  c.sessionStorage.getItem=()=>{throw Error('almacen bloqueado')};
  vm.runInContext('restaurarPuente({hash:destino})',c);
}
const css=leer('web/sate/componentes.css');
assert.match(css,/sate-plataformas\{[^}]*flex-wrap:nowrap/);
assert.match(css,/sate-plataformas a\{[^}]*text-decoration:none/);
assert.match(css,/sate-plataformas \[aria-current=page\]\{[^}]*border-color:[^}]*--ipn-aviso/);
assert.match(css,/html\[data-vista=guia-vinculada\] #sate-nombre\{display:none\}/);
assert.match(leer('web/sate/encabezado.css'),/@media\(min-width:768px\) and \(max-width:1439px\)/);
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
const inspector=vm.createContext({cur:()=>({DEMO:['Materia ficticia',3,1]}),prereqs:()=>({}),dependents:()=>({}),ancestors:()=>new Set(),semOf:()=>({}),offeredClaves:()=>new Set(),esc:String,pretty:String,textoCreditos:()=>3,ayudaCreditos:()=>'',porNiveles:()=>false,PLAN_DOS_PERIODOS:false,isPersonal:()=>false,isElec:()=>false,S:{car:'B'},UNIDAD:'unidad',classes:()=>[['B',null,null,'1BM1',null,null,null,null,'DEMO']],SATE:{texto:(k,v={})=>k+':'+(v.n||'')}});
vm.runInContext(nucleo.slice(nucleo.indexOf('function inspParts(k)'),nucleo.indexOf('/* Materias del horario inscrito')),inspector);
const ficha=inspector.inspParts('DEMO');
assert.match(ficha.l2,/horarios\?materia=DEMO/);assert.match(ficha.l2,/sate.puentes.grupos:1/);
assert.match(ficha.l2,/sate.puentes.todo/);assert.doesNotMatch(ficha.l2,/tag-rel|guia\/programas/);
console.log('R16: interruptor, regreso y desplazamiento, almacenamiento bloqueado, enlaces y perfil OK');
