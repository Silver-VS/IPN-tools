// Catálogo real en las dos entradas. DOM en memoria, sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {crearEntorno} from './dom_minimo.mjs';
const leer=p=>readFileSync(p,'utf8');
const datos=JSON.parse(leer('web/dist/sate/datos/upiita/guia.json'));
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const texto=(k,v={})=>(config.textos[k]||k).replace(/\{(\w+)\}/g,(_,k)=>v[k]??'');
const css=leer('web/sate/componentes.css'), catalogo=css.slice(css.indexOf('/* Catálogo'),css.indexOf('/* barra inferior:'));
assert.doesNotMatch(catalogo,/text-overflow:ellipsis|line-clamp|--sate-|#[\da-f]{3,8}\b/);
assert.match(catalogo,/@media\(max-width:600px\)/);
assert.match(catalogo,/linear-gradient\(to right,transparent,var\(--ipn-hundido\)\)/);
assert.match(catalogo,/white-space:normal/);
assert.match(catalogo,/align-content:start/);
assert.deepEqual(datos.actividades,JSON.parse(leer('data/guia/actividades-upiita.json')));
for(const ancho of [1440,1024,768,600,390,375,320])for(const tema of ['claro','oscuro']){
 const {document}=crearEntorno();document.createElementNS=(_,tag)=>document.createElement(tag);
 document.documentElement.setAttribute('data-tema',tema);
 let pestana;const mensajes=[];
 const c=vm.createContext({document,setTimeout,clearTimeout,console:{...console,debug(){},warn:(...m)=>mensajes.push(m)},
  matchMedia:q=>({matches:q.includes('600px')?ancho<=600:ancho<900}),innerWidth:ancho,
  location:{hash:'#/upiita/guia',pathname:'/',search:'',href:'https://sitio.test/'},history:{replaceState(){}},
  scrollTo(){},addEventListener(){},removeEventListener(){},SATE_UNIDAD:'upiita',SATE_CONFIG:config,
  SATE:{texto,json:async()=>datos,pestana:(_,p)=>pestana=p,error:e=>{throw e;}}});
 vm.runInContext(leer('web/sate/componentes.js'),c);c.SateUI.usarTextos(texto);
 vm.runInContext(leer('web/sate/guia.js'),c);
 const caja=document.createElement('div');caja.setAttribute('id','sate-guia');document.body.appendChild(caja);
 const abrir=async partes=>{await pestana.mostrar({partes});assert.deepEqual(mensajes,[],'la vista carga sin errores');};
 for(const partes of [['ruta','aprovecha'],['actividades']]){
  await abrir(partes);
  assert.equal(caja.querySelectorAll('.sate-catalogo').length,1);
  assert.equal(caja.querySelectorAll('.guia-ruta-panel,.guia-toca,.guia-mas,details').length,0);
  assert.doesNotMatch(caja.textContent,/¿Qué necesitas resolver\?|Lo que te toca|¿Qué quieres consultar\?|temario para preparar el ETS/);
  const ruta=datos.orientacion.rutas.find(r=>r.id==='aprovecha');
  assert.equal(caja.querySelectorAll('[data-pregunta]').length,ruta.preguntas.length);
  for(const cat of datos.actividades.categorias){
   const tab=caja.querySelector('[data-id="'+cat+'"]');
   const opciones=datos.actividades.elementos.filter(a=>a.categoria===cat);
   assert.ok(tab.textContent.endsWith(' '+opciones.length));tab.click();
   assert.equal(tab.getAttribute('aria-selected'),'true');
   const botones=caja.querySelectorAll('[data-actividad]');assert.equal(botones.length,opciones.length);
   for(const [i,b] of botones.entries()){
    assert.equal(b.querySelector('.sate-catalogo__nombre').textContent,opciones[i].nombre,'nombre literal sin elipsis');
    b.focus();b.click();
    const dialogo=document.querySelector('dialog'),ficha=ancho<=600?dialogo.querySelector('.sate-catalogo__ficha'):caja.querySelector('.sate-catalogo__ficha');
    const a=opciones[i];assert.equal(ficha.querySelector('h3').textContent,a.nombre);
    assert.ok(ficha.textContent.includes(a.ofrece));assert.ok(ficha.textContent.includes(a.donde));
    for(const k of ['requisitos','inscripcion'])if(a[k])assert.ok(ficha.textContent.includes(a[k]),k+': conserva el dato y su puntuación');
    assert.equal(ficha.querySelector('.sate-btn').getAttribute('href'),a.url);
    assert.ok(ficha.querySelector('footer').textContent.includes(a.url.split('/')[2]));
    assert.ok(ficha.querySelector('footer').textContent.includes('2026'));
    for(const enlace of ficha.querySelectorAll('.sate-catalogo__relacionado')){
     assert.ok(enlace.getAttribute('href').includes('/guia/acudir/'));assert.ok(enlace.querySelector('[data-oficial]'));
    }
    if(ancho<=600){
     assert.equal(dialogo.querySelector('.sate-modal__volver').textContent,'‹ volver');
     assert.equal(caja.querySelectorAll('dialog').length,0,'no empuja la lista');
     c.SateUI.modal('Nivel de prueba',document.createElement('p'));
     assert.equal(dialogo.inert,true);c.SateUI.cerrarModal();assert.equal(dialogo.inert,false);
     dialogo.querySelector('.sate-modal__volver').click();assert.equal(document.activeElement,b);
    }
   }
  }
  caja.querySelector('[data-pregunta]').click();
  assert.ok(document.querySelector('dialog .guia-respuesta'),'pregunta en ventana de lectura');c.SateUI.cerrarModal();
 }
 await abrir(['actividades','deporte']);assert.equal(caja.querySelector('[aria-selected="true"]').getAttribute('data-id'),'deporte');
 c.location.hash='#/upiita/guia/actividades/idiomas?actividad=3';await abrir(['actividades','idiomas']);
 assert.equal(caja.querySelector('[data-actividad="3"]').getAttribute('aria-current'),'true');
 if(ancho<=600)c.SateUI.cerrarModal();
}
console.log('OK R18: catálogo compartido, datos literales, categorías, selección, preguntas, enlaces profundos, fuente, ventana y retorno de foco; 1440–320 claro/oscuro. DOM sin geometría visual.');
