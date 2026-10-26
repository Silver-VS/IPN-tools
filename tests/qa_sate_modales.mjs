// Componentes, citas de Ventanilla y Guía reales; DOM e historial en memoria, sin red ni navegador.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {crearEntorno} from './dom_minimo.mjs';
const leer=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8'), json=p=>JSON.parse(leer(p));
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
for(const ancho of [1440,1024,768,600,375,320])for(const oscuro of [false,true]){
  const {document,Elemento,Evento}=crearEntorno(), tareas=[], eventos={};
  Elemento.prototype.showModal=function(){this.open=true};
  Elemento.prototype.close=function(){this.open=false;tareas.push(()=>this.dispatchEvent(new Evento('close')))};
  Object.defineProperty(Elemento.prototype,'offsetParent',{get(){return this.closest('[hidden],[inert]')?null:document.body}});
  const ruta='https://sitio.test/sate/index.html#/upiita/tramites/dictamen';
  const entradas=[{state:{ajeno:42},url:ruta}];let posicion=0;
  const location={href:ruta,hash:'#/upiita/tramites/dictamen'};
  const history={get state(){return entradas[posicion].state},pushState(state,_,url){entradas.splice(++posicion);entradas.push({state,url})},back(){tareas.push(()=>{assert.ok(posicion>0,'no abandona la ruta base');posicion--;eventos.popstate({state:this.state})})}};
  const vaciar=()=>{let limite=100;while(tareas.length){assert.ok(limite--,'historial sin bucles');tareas.shift()()}};
  const texto=(k,v={})=>(config.textos[k]||k).replace(/\{(\w+)\}/g,(_,k)=>v[k]??'');
  const c=vm.createContext({document,console,location,history,setTimeout,clearTimeout,
    addEventListener:(k,f)=>eventos[k]=f,matchMedia:q=>({matches:q.includes('dark')?oscuro:ancho<=600}),
    SATE_CONFIG:config,SATE_UNIDAD:'upiita',
    SATE:{texto,pestana(){},json:async p=>json(p.includes('referencias')?'data/referencias/reglamentos.json':p.includes('reglamentos/')?'data/reglamentos/'+p.split('/').at(-1):'data/guia/comun.json')}});
  vm.runInContext('window=globalThis',c);
  for(const f of ['componentes','tramites','guia'])vm.runInContext(leer('web/sate/'+f+'.js'),c,{filename:f});
  c.SateUI.usarTextos(texto);
  const top=()=>document.querySelectorAll('dialog').filter(d=>d.open&&!d.inert).at(-1);
  const disparador=document.createElement('button');document.body.appendChild(disparador);disparador.focus();
  const cuerpo=document.createElement('div');
  c.SateTramites.citas(cuerpo,'dictamen.fund_i1');
  c.SateTramites.citas(cuerpo,'dictamen.fund_i2');
  const dictamen=c.SateUI.modal(texto('sate.tramite.dictamen.titulo'),cuerpo).elemento;
  const scroll=dictamen.querySelector('.sate-modal__cuerpo');scroll.scrollTop=437;
  const cita=cuerpo.querySelector('button');cita.focus();await cita.onclick();
  const articulo=top();assert.notEqual(articulo,dictamen);
  assert.equal(dictamen.inert,true);assert.equal(dictamen.getAttribute('aria-modal'),null);
  assert.equal(articulo.getAttribute('aria-modal'),'true');
  assert.equal(articulo.querySelector('.sate-modal__volver').textContent,'‹ '+texto('sate.tramite.dictamen.titulo'));
  // RI 98 no siempre contiene referencias internas. Añadimos un disparador real de otra cita,
  // sin editar la transcripción, para ejercitar el tercer nivel desde el artículo.
  const otra=document.createElement('button');articulo.querySelector('.sate-modal__cuerpo').appendChild(otra);
  otra.addEventListener('click',()=>c.SATE.articulo('honor','34'));otra.focus();otra.click();
  for(let i=0;i<20&&top()===articulo;i++)await Promise.resolve();
  const tercera=top();assert.notEqual(tercera,articulo);assert.equal(articulo.inert,true);
  assert.equal(tercera.querySelector('.sate-modal__navegacion .sate-enlace').hidden,false);
  const literal=json('data/reglamentos/honor.json').articulos.find(a=>a.n==='34').texto;
  assert.equal(tercera.querySelector('.pc-lector.pc-oficial').textContent,literal);
  assert.ok(tercera.querySelector('.pc-lector.pc-oficial button'),'también hay citas enlazadas dentro del texto oficial');
  tercera.querySelector('.sate-modal__volver').click();vaciar();
  assert.equal(top()===articulo,true);assert.equal(document.activeElement===otra,true);
  articulo.querySelector('.sate-modal__volver').click();vaciar();
  assert.equal(top()===dictamen,true);assert.equal(document.activeElement===cita,true);assert.equal(scroll.scrollTop,437);
  // Esc y Tab solo afectan al nivel superior.
  cita.focus();await cita.onclick();const esc=top();
  const f=esc.querySelectorAll('button,a[href]').filter(n=>!n.closest('[hidden]'));
  f.at(-1).focus();esc.dispatchEvent(new Evento('keydown',{key:'Tab'}));assert.equal(document.activeElement===f[0],true);
  esc.dispatchEvent(new Evento('keydown',{key:'Escape'}));vaciar();assert.equal(top()===dictamen,true);
  // Atrás usa entradas con la misma URL, y conserva el resto de history.state.
  cita.focus();await cita.onclick();history.back();vaciar();assert.equal(top()===dictamen,true);assert.equal(scroll.scrollTop,437);
  assert.ok(entradas.every(e=>e.url===ruta&&e.state.ajeno===42));assert.equal(location.hash,'#/upiita/tramites/dictamen');
  c.SateUI.cerrarVentanas();vaciar();assert.equal(posicion,0);assert.equal(document.activeElement===disparador,true);
  // Límite, callbacks una sola vez, fondo y cierre total.
  let cierres=0;const niveles=[];
  for(let n=0;n<6;n++)niveles.push(c.SateUI.modal('Nivel '+n,document.createElement('div'),{alCerrar:()=>cierres++}).elemento);
  assert.equal(document.querySelectorAll('dialog').length,5);assert.equal(cierres,1);
  const ultimo=top();ultimo.dispatchEvent(new Evento('click',{target:ultimo,clientX:-1,clientY:-1}));vaciar();assert.equal(top()===niveles[4],true);
  c.SateUI.cerrarVentanas();vaciar();assert.equal(cierres,6);assert.equal(posicion,0);
  // Atrás también salta el nivel descartado al alcanzar la ventana más antigua.
  for(let n=0;n<6;n++)c.SateUI.modal('Nivel '+n,'');
  for(let n=0;n<5;n++){history.back();vaciar()}
  assert.equal(top(),undefined);assert.equal(posicion,0);
  // Los diálogos de sección se adoptan sin perder sus nodos y se pueden reabrir.
  const persistente=document.createElement('dialog'), h=document.createElement('h2');h.textContent='Horario';persistente.appendChild(h);document.body.appendChild(persistente);
  c.SateUI.abrirVentana(persistente);c.SateUI.cerrarVentana(persistente);vaciar();
  c.SateUI.abrirVentana(persistente);assert.equal(persistente.querySelectorAll('nav').length,1);
  persistente.close();vaciar();assert.equal(posicion,0);assert.equal(persistente.isConnected,true);
  // Cerrar y abrir en el mismo turno no inserta el nivel nuevo sobre una entrada vieja.
  const fugaz=c.SateUI.modal('Primera','');fugaz.cerrar();
  const nueva=c.SateUI.modal('Segunda','');vaciar();assert.equal(posicion,1);
  nueva.cerrar();vaciar();assert.equal(posicion,0);
  // Un enlace de ruta espera el Atrás pendiente, sin dejar ventanas antiguas en el destino.
  const enlace=document.createElement('a');enlace.setAttribute('href','#/upiita/guia');
  const navegable=c.SateUI.modal('Dictamen',enlace).elemento;
  c.SateUI.modal('Artículo','');
  top().dispatchEvent(new Evento('click',{target:enlace}));
  assert.equal(location.hash,'#/upiita/tramites/dictamen');vaciar();
  assert.equal(location.hash,'#/upiita/guia');assert.equal(posicion,0);assert.equal(navegable.open,false);
  let aceptado=false, alCerrar=false;
  c.SateUI.modal('Confirmar','',{acciones:[{texto:'Ir',onclick(){aceptado=true;location.hash='#/upiita/mapa'}}],alCerrar(){assert.equal(aceptado,true);alCerrar=true}});
  top().querySelector('.sate-modal__pie button').click();
  assert.equal(aceptado,false);vaciar();assert.equal(alCerrar,true);
  assert.equal(location.hash,'#/upiita/mapa');assert.equal(posicion,0);
}
assert.match(leer('web/sate/componentes.css'),/@media\(max-width:600px\)/);
const estilos=leer('web/sate/componentes.css');
assert.match(estilos,/\.sate-modal\{position:fixed;inset-block:var\(--ipn-esp-3\);[\s\S]*?max-height:calc\(100dvh - 2 \* var\(--ipn-esp-3\)\)/,'la ventana tiene límites visibles en escritorio');
assert.match(estilos,/\.sate-modal__cab\{[^}]*flex:none/,'el encabezado conserva título y cierre');
assert.match(estilos,/\.sate-modal__navegacion\{[^}]*flex:none/,'la navegación de la pila queda fija');
assert.match(estilos,/\.sate-modal__cuerpo\{[^}]*overflow:auto;overscroll-behavior:contain/,'solo el cuerpo desplaza su contenido y contiene el gesto');
assert.match(estilos,/\.sate-modal__pie\{[^}]*flex:none/,'el pie de acciones queda fijo');
assert.doesNotMatch(estilos,/\.sate-modal\[open\]\{animation:sate-sube/,'la apertura no traslada el diálogo fuera del área visible');
console.log('Modales: Dictamen → cita → cita, estado, scroll, foco, Esc/Tab/fondo, Atrás, límite 5 y diálogos persistentes; 6 anchos y 2 temas, DOM sin renderizado.');
