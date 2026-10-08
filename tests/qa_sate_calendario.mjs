// Datos y vista real con DOM en memoria; no abre navegador ni utiliza red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const leer=p=>readFileSync(p,'utf8'), data=JSON.parse(leer('data/calendario.json'));
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const categorias=['academico','gestion','becas','servicios','tt','feriado'];
let checks=0;
for(const [u,c] of Object.entries(data).filter(([k])=>!k.startsWith('_'))){
  const eventos=[...c.actividades,...c.eventos];
  for(const e of eventos){
    for(const f of [e.desde,e.hasta]){assert.match(f,/^\d{4}-\d{2}-\d{2}$/);assert.equal(new Date(f+'T00:00:00Z').toISOString().slice(0,10),f)}
    assert.ok(e.desde<=e.hasta);assert.ok(categorias.includes(e.categoria));assert.ok(e.fuente?.trim());assert.ok(e.titulo?.trim());checks++;
  }
  assert.equal(JSON.stringify(JSON.parse(leer('web/dist/sate/datos/'+u+'/nucleo.json')).calendario),JSON.stringify(c));
  assert.equal(new Set(eventos.map(e=>[e.desde,e.hasta,e.titulo].join('|'))).size,eventos.length);
}
assert.equal(data.upiita.eventos.length,22);
assert.ok(!data.upiita.eventos.some(e=>/ETS|evaluacion/i.test(e.titulo)));
class Nodo{
  constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.style={};this.listeners={}}
  appendChild(n){this.children.push(n);n.parent=this;return n}
  addEventListener(k,fn){this.listeners[k]=fn}
  querySelector(s){return this.all().find(n=>n.className?.split(' ').includes(s.slice(1)))||null}
  insertBefore(n,antes){this.children.splice(antes?this.children.indexOf(antes):0,0,n);n.parent=this;return n}
  get firstChild(){return this.children[0]}
  remove(){this.parent.children=this.parent.children.filter(n=>n!==this)}
  replaceChildren(){this.children=[];this.text=''}
  set textContent(t){this.text=String(t)}get textContent(){return (this.text||'')+this.children.map(n=>n.textContent).join(' ')}
  setAttribute(k,v){this.attrs[k]=String(v)}getAttribute(k){return this.attrs[k]}
  focus(){document.activeElement=this}
  all(){return this.children.flatMap(n=>[n,...n.all()])}
}
const paneles=Object.fromEntries(['v-hor','v-tray','sate-trayectoria'].map(id=>[id,new Nodo('section')]));
const box=new Nodo('section'), document={addEventListener(){},createElement:t=>new Nodo(t),createElementNS:(_,t)=>new Nodo(t),getElementById:id=>paneles[id]|| (id==='sate-calendario'?box:box.all().find(n=>n.id===id))};
const SATE={modulos:{},texto:(k,v={})=>(config.textos[k]||k).replace(/\{(\w+)\}/g,(_,k)=>v[k]??'{'+k+'}'),pestana(id,m){this.modulos[id]=m}};
const guardado={};
const c=vm.createContext({SATE,DATA:{calendario:data.upiita},document,console,localStorage:{getItem:k=>guardado[k]??null},IPNT:{set:(k,v)=>guardado[k]=v},perMeta:()=>0,perName:i=>i===0?'27/1':'26/2',perIdx:()=>0});
const nucleo=leer('web/dist/sate/nucleo.js');
vm.runInContext(nucleo.slice(nucleo.indexOf('SATE.calendario={'),nucleo.indexOf('let CALAP=')),c);
SATE.calendario.hoy=()=> '2026-10-20';
assert.equal(SATE.calendario.eventos().length,34);
assert.equal(SATE.calendario.proximos(0).length,0);
assert.equal(SATE.calendario.proximos(2,['becas']).length,2);
assert.equal(SATE.calendario.proximos(1,['becas'])[0].desde,'2026-10-26');
assert.ok(SATE.calendario.proximos(99).some(e=>e.desde==='2026-10-19'),'Incluye eventos en curso');
assert.ok(SATE.calendario.proximos(99).every(e=>e.hasta>='2026-10-20'));
assert.equal(SATE.calendario.proximos(5,[]).length,0);
vm.runInContext(leer('web/dist/sate/calendario.js'),c);
const mostrar=()=>SATE.modulos.calendario.mostrar();mostrar();
const dias=()=>box.all().filter(n=>n.getAttribute('data-fecha'));
const nodos=clase=>box.all().filter(n=>n.className?.split(' ').includes(clase)||n.getAttribute('class')===clase);
const periodoEventos=SATE.calendario.eventos().filter(e=>e.periodo==='27/1');
assert.equal(nodos('calendario-anillo').length,1);assert.equal(nodos('calendario-banda').length,1);
assert.equal(nodos('calendario-arco').length,periodoEventos.length*2);
assert.equal(nodos('calendario-proceso').length,periodoEventos.length);
const proximo=[...periodoEventos].sort((a,b)=>a.desde.localeCompare(b.desde)||a.hasta.localeCompare(b.hasta)).find(e=>e.desde>SATE.calendario.hoy());
assert.equal(nodos('calendario-detalle-evento').length,1,'El detalle inicial no queda vacío');
assert.ok(nodos('calendario-detalle')[0].textContent.includes(proximo.titulo));
assert.equal(nodos('calendario-proceso').filter(n=>n.getAttribute('aria-pressed')==='true').length,1);
const leyenda=nodos('calendario-categorias')[0];
assert.equal(leyenda.children.length,new Set(periodoEventos.map(e=>e.categoria)).size);
for(const item of leyenda.children)assert.equal(item.textContent.trim(),config.textos['sate.calendario.categoria_'+item.getAttribute('data-categoria')]);
assert.equal(nodos('calendario-anillo')[0].all().filter(n=>n.getAttribute('class')==='calendario-pista').length,1,'Solo una guía exterior');
assert.ok(box.children.indexOf(nodos('calendario-layout')[0])<box.children.indexOf(nodos('calendario-lista')[0]),'El detalle queda antes de la lista también en teléfono');
assert.equal(nodos('calendario-aguja').length,2);
const arcos=nodos('calendario-anillo')[0].all().filter(n=>n.getAttribute('class')==='calendario-arco');
for(const arco of arcos){assert.equal(arco.getAttribute('role'),'button');assert.equal(arco.getAttribute('tabindex'),'0');assert.match(arco.getAttribute('aria-label'),/2026|2027/)}
arcos[0].onmouseenter();
assert.equal(nodos('calendario-proceso').filter(n=>n.getAttribute('data-resaltado')==='true').length,1);
assert.equal(nodos('calendario-proceso').filter(n=>n.getAttribute('data-atenuado')==='true').length,periodoEventos.length-1);
arcos[0].onfocus();arcos[0].onmouseleave();
assert.equal(nodos('calendario-proceso').filter(n=>n.getAttribute('data-resaltado')==='true').length,1,'El foco conserva el resaltado al salir el cursor');
arcos[0].onblur();assert.ok(nodos('calendario-proceso').every(n=>n.getAttribute('data-atenuado')==='false'));
assert.ok(arcos.some(n=>n.tagName==='circle')&&arcos.some(n=>n.tagName==='path'),'Puntos y arcos distinguen fechas puntuales y rangos');
for(const a of arcos)for(const b of arcos)if(a!==b&&a.getAttribute('data-pista')===b.getAttribute('data-pista'))assert.ok(a.getAttribute('data-hasta')<b.getAttribute('data-desde')||b.getAttribute('data-hasta')<a.getAttribute('data-desde'),'Las pistas no contienen procesos solapados');
arcos.find(n=>n.getAttribute('aria-label').includes('registro de protocolo')).onkeydown({key:'Enter',preventDefault(){}});
assert.match(nodos('calendario-detalle')[0].textContent,/Trabajo Terminal, UPIITA/);
assert.equal(document.activeElement.id,'cal-detalle-titulo');
document.getElementById('cal-vista-mes').onclick();assert.equal(guardado['hu.cal.vista'],'mes');
assert.equal(dias().filter(n=>n.getAttribute('data-fecha').startsWith('2026-10')).length,31);
assert.equal(nodos('calendario-dias-semana')[0].children.length,7);
assert.equal(dias().filter(n=>n.tabIndex===0).length,1);assert.equal(dias().find(n=>n.getAttribute('aria-current')==='date').getAttribute('data-fecha'),'2026-10-20');
assert.ok(!box.textContent.includes('sate.calendario.'));
const dia19=dias().find(n=>n.getAttribute('data-fecha')==='2026-10-19');dia19.onclick();assert.match(nodos('calendario-detalle')[0].textContent,/registro de protocolo/);assert.match(nodos('calendario-detalle')[0].textContent,/Trabajo Terminal, UPIITA/);
assert.ok(nodos('calendario-pill').some(n=>n.getAttribute('data-continua')==='true'&&n.style.gridColumn==='1 / 6'));
assert.ok(nodos('calendario-mas').some(n=>n.children.length));
nodos('calendario-mas').find(n=>n.children.length).children[0].onclick();assert.match(nodos('calendario-detalle')[0].textContent,/registro de protocolo/);
document.getElementById('cal-filtro-tt').checked=false;document.getElementById('cal-filtro-tt').onchange();assert.equal(document.getElementById('cal-filtro-tt').checked,false);assert.ok(!box.textContent.includes('Entrega de constancias'));
const dia=dias().find(n=>n.getAttribute('data-fecha')==='2026-10-20');dia.onkeydown({key:'ArrowRight',preventDefault(){}});assert.equal(document.activeElement.getAttribute('data-fecha'),'2026-10-21');
document.activeElement.onkeydown({key:'ArrowDown',preventDefault(){}});assert.equal(document.activeElement.getAttribute('data-fecha'),'2026-10-28');
document.getElementById('cal-proximo').onclick();assert.equal(dias().filter(n=>n.getAttribute('data-fecha').startsWith('2026-11')).length,30);assert.ok(nodos('calendario-feriado').length);
document.getElementById('cal-hoy').onclick();assert.equal(document.getElementById('cal-mes').textContent,'octubre 2026');
document.getElementById('cal-escala-semana').onclick();assert.equal(dias().length,7);assert.equal(dias()[0].getAttribute('data-fecha'),'2026-10-19');
document.getElementById('cal-proximo').onclick();assert.equal(dias().filter(n=>n.tabIndex===0).length,1,'Una fecha enfocable también en semanas sin hoy');
while(!document.getElementById('cal-anterior').disabled)document.getElementById('cal-anterior').onclick();
assert.equal(dias()[0].getAttribute('data-fecha'),'2026-09-28','La primera semana incluye el inicio del mes');
document.getElementById('cal-escala-mes').onclick();
// El horizonte cambia con el periodo planeado; ambos meses de reinscripción 27/2 quedan accesibles.
c.perName=i=>i===0?'27/2':'27/1';mostrar();
while(document.getElementById('cal-proximo').disabled!==true)document.getElementById('cal-proximo').onclick();
assert.equal(document.getElementById('cal-mes').textContent,'julio 2027');
c.DATA.calendario=null;mostrar();assert.equal(dias().length,0);assert.match(box.textContent,/Sin eventos confirmados/);assert.equal(SATE.calendario.proximos(5).length,0);
c.DATA.calendario=data.upiita;
SATE.calendario.hoy=()=> '2099-01-01';assert.equal(SATE.calendario.proximos(5).length,0);
mostrar();assert.equal(document.getElementById('cal-hoy').disabled,true);
assert.equal(nodos('calendario-detalle-evento').length,1,'Un periodo terminado conserva detalle disponible');
document.getElementById('cal-vista-periodo').onclick();assert.equal(guardado['hu.cal.vista'],'periodo');assert.equal(nodos('calendario-aguja').length,0);
// La preferencia se lee al montar de nuevo el módulo; solo se escribe al elegir una vista.
guardado['hu.cal.vista']='mes';vm.runInContext(leer('web/dist/sate/calendario.js'),c);mostrar();assert.ok(nodos('calendario-mes').length);
for(const categoria of categorias){const check=document.getElementById('cal-filtro-'+categoria);check.checked=false;check.onchange()}
assert.equal(nodos('calendario-pill').length,0);assert.match(box.textContent,/Sin eventos confirmados/);
assert.equal(nodos('calendario-detalle-evento').length,0,'El detalle respeta los filtros');
document.getElementById('cal-vista-periodo').onclick();assert.equal(nodos('calendario-arco').length,0);assert.equal(nodos('calendario-proceso').length,0);
assert.equal(nodos('calendario-pista').length,0,'Sin procesos no se dibujan pistas vacías');
const css=leer('web/sate/componentes.css'), bloque=css.slice(css.indexOf('#sate-calendario{'),css.indexOf('.situacion-cifras'));
assert.ok([...bloque.matchAll(/var\((--[^),]+)/g)].every(m=>m[1].startsWith('--ipn-')||m[1]==='--sate-realce'),'Tokens institucionales y realce local');
for(const regla of bloque.matchAll(/([^{}]+)\{([^{}]+)\}/g))if(regla[2].includes('--sate-realce')){
  assert.ok(regla[1].includes(':focus-visible'),'Realce reservado al foco');
  assert.match(regla[2],/outline:2px solid var\(--sate-realce\)/);
}
assert.match(bloque,/@media\(max-width:720px\)/);assert.match(bloque,/\.calendario-anillo\{display:none\}/);assert.match(bloque,/\.calendario-banda\{display:block\}/);
for(const categoria of categorias)assert.ok(bloque.includes(`color:var(--ipn-cal-${categoria})`),'Token categórico compartido: '+categoria);
assert.match(bloque,/\[data-theme=dark\] #sate-calendario/);assert.match(bloque,/prefers-color-scheme:dark/);
assert.match(bloque,/\.calendario-pill\{[^}]*color-mix\(in srgb,currentColor 8%/);
assert.match(bloque,/\.calendario-dia\[aria-current=date\]\{[^}]*border-radius:50%/);
// Resolver los colores reales compartidos y locales, incluida la mezcla de las píldoras.
const declaraciones=s=>Object.fromEntries([...s.matchAll(/(--[\w-]+):\s*([^;\n}]+)/g)].map(m=>[m[1],m[2].trim()]));
const tokens=leer('vendor/ipn-comun/dist/tokens.css'), cascaron=leer('web/sate/cascaron.html');
const rgb=s=>s.slice(1).match(/../g).map(n=>parseInt(n,16)/255);
const luminancia=c=>c.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const contraste=(a,b)=>{const x=luminancia(a),y=luminancia(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
for(const oscuro of [false,true]){
  const valores={...declaraciones(tokens.match(/:root \{([^}]+)\}/)[1]),...declaraciones(cascaron.match(/:root\{([^}]+)\}/)[1]),...declaraciones(bloque.match(/#sate-calendario\{([^}]+)\}/)[1])};
  if(oscuro){Object.assign(valores,declaraciones(tokens.match(/:root\[data-tema="oscuro"\] \{([^}]+)\}/)[1]),declaraciones(cascaron.match(/:root\[data-theme="dark"\]\{([^}]+)\}/)[1]),declaraciones(bloque.match(/\[data-theme=dark\] #sate-calendario\{([^}]+)\}/)[1]))}
  Object.assign(valores,{'--ipn-acento':'var(--accent)','--ipn-ok':'var(--ok)','--ipn-superficie':'var(--surface)'});
  const resolver=k=>valores[k].startsWith('var(')?resolver(valores[k].slice(4,-1)):valores[k];
  const superficie=rgb(resolver('--ipn-superficie')), colores=categorias.map(c=>resolver('--ipn-cal-'+c));
  assert.equal(new Set(colores).size,6,'Seis colores distintos en '+(oscuro?'oscuro':'claro'));
  for(const [i,color] of colores.entries()){
    const c=rgb(color), fondo=c.map((v,j)=>v*.08+superficie[j]*.92), ratio=contraste(c,fondo);
    assert.ok(ratio>=4.5,`${categorias[i]} en ${oscuro?'oscuro':'claro'}: contraste ${ratio.toFixed(2)} < 4.5`);
  }
}
// Caso ficticio: mes bisiesto, barras que cruzan meses y cinco procesos simultáneos.
c.DATA.calendario={periodo:'28/2',actividades:[],eventos:[...categorias.slice(0,4).map((categoria,i)=>({desde:'2028-02-01',hasta:'2028-03-10',titulo:'Proceso ficticio '+i,categoria,periodo:'28/2',fuente:'Fuente ficticia'})),{desde:'2028-02-29',hasta:'2028-02-29',titulo:'Fecha ficticia bisiesta',categoria:'feriado',periodo:'28/2',fuente:'Fuente ficticia'}]};
c.perName=()=> '28/2';SATE.calendario.hoy=()=> '2028-02-29';guardado['hu.cal.vista']='mes';
vm.runInContext(leer('web/dist/sate/calendario.js'),c);mostrar();
assert.equal(dias().filter(n=>n.getAttribute('data-fecha').startsWith('2028-02')).length,29);
assert.match(nodos('calendario-detalle')[0].textContent,/Proceso ficticio 0/,'Sin procesos futuros, selecciona uno vigente');
assert.ok(nodos('calendario-pill').some(n=>n.style.gridColumn==='1 / 8'),'La barra ocupa la semana completa');
for(const b of nodos('calendario-pill')){const [a,z]=b.style.gridColumn.split(' / ').map(Number);assert.ok(a>=1&&z<=8&&a<z)}
const masBisiesto=nodos('calendario-mas').flatMap(n=>n.children).find(n=>n.getAttribute('aria-label').includes('29 de febrero'));
assert.equal(masBisiesto.textContent,'+2 más');masBisiesto.onclick();assert.equal(nodos('calendario-detalle-evento').length,5);
document.getElementById('cal-proximo').onclick();assert.equal(document.getElementById('cal-mes').textContent,'marzo 2028');
nodos('calendario-pill')[0].onclick();assert.match(nodos('calendario-detalle')[0].textContent,/1 de febrero de 2028 al 10 de marzo de 2028/,'El detalle conserva el rango completo');
document.getElementById('cal-vista-periodo').onclick();const pistasFicticias=nodos('calendario-arco').map(n=>n.getAttribute('data-pista'));assert.equal(new Set(pistasFicticias).size,5);
assert.ok(!box.textContent.includes('sate.calendario.'));
assert.ok(!config.unidades.escom.pestanas.includes('calendario'));assert.ok(!config.unidades.upibi.pestanas.includes('calendario'));
// Recortes: componentes y selección del calendario reales, sin navegador ni red.
c.SATE_CONFIG=config;c.SATE_UNIDAD='upiita';c.isPersonal=()=>false;
c.conSim=(_,fn)=>fn();c.tr=()=>({fail:[]});c.addEventListener=()=>{};
vm.runInContext('window=globalThis',c);vm.runInContext(leer('web/dist/sate/componentes.js'),c);c.SateUI.usarTextos(SATE.texto);
c.DATA.calendario=data.upiita;SATE.calendario.hoy=()=> '2026-10-07';c.perName=()=> '27/1';
let destino;SATE.ir=id=>destino=id;
const api=SATE.calendario;
const ordenados=api.proximos(Infinity);assert.ok(ordenados.every((e,i)=>!i||ordenados[i-1].desde<=e.desde),'Orden por fecha civil');
assert.equal(api.recorte('calendario').length,0);
assert.equal(api.recorte('mapa')[0].titulo,'Inicio del periodo 27/1','Sin adeudos no propone ETS');
assert.equal(api.recorte('horarios')[0].titulo,'Citas publicadas');
assert.equal(api.recorte('horarios').length,2);
assert.equal(api.recorte('trayectoria')[0].titulo,api.proximos(1)[0].titulo);
for(const id of ['horarios','mapa','trayectoria']){
  api.pintarRecorte(id);api.pintarRecorte(id);
  const p=paneles[id==='horarios'?'v-hor':id==='mapa'?'v-tray':'sate-trayectoria'];
  assert.equal(p.all().filter(n=>n.className==='sate-recorte-calendario').length,1,'No duplica al repintar');
  assert.equal(p.firstChild.className,'sate-recorte-calendario');
}
api.pintarRecorte('calendario');assert.equal(nodos('sate-recorte-calendario').length,0);
assert.equal(c.SateUI.recorteCalendario([]),null);
assert.equal(c.SateUI.recorteCalendario(api.recorte('horarios')).children[1].textContent,'+1 más');
assert.equal(c.SateUI.recorteCalendario(api.recorte('horarios').slice(0,1)).children.length,1);
const b=paneles['v-hor'].firstChild;assert.match(b.getAttribute('aria-label'),/Citas publicadas, 7 de octubre de 2026/);
b.listeners.click();assert.equal(destino,'calendario');mostrar();
assert.match(nodos('calendario-detalle')[0].textContent,/Citas publicadas/);assert.equal(document.activeElement.id,'cal-detalle-titulo');
assert.equal(nodos('calendario-proceso').filter(n=>n.getAttribute('aria-pressed')==='true').length,1);
const siguiente=api.eventos().find(e=>e.periodo==='27/2');api.abrirProceso(siguiente);mostrar();
assert.ok(nodos('calendario-detalle')[0].textContent.includes(siguiente.titulo),'Abre el periodo del proceso elegido');
c.isPersonal=()=>true;c.tr=()=>({fail:['DEMO']});c.ALUMNO={cita:{}};
assert.match(api.recorte('mapa')[0].titulo,/ETS/,'Con adeudos incluye ETS en curso');
c.ALUMNO={cita:{inicio:'08/10/2026 10:00:00 a. m.',fin:'08/10/2026 10:30:00 a. m.'}};c.perDeFecha=()=>0;
assert.equal(api.cita().desde,'2026-10-08');assert.equal(api.recorte('horarios')[1].personal,true);
const cita=api.cita();api.abrirProceso(cita);mostrar();assert.match(nodos('calendario-detalle')[0].textContent,/Tu cita de reinscripción/);
assert.match(nodos('calendario-detalle')[0].textContent,/10:00:00/);
c.ALUMNO={cita:{}};assert.equal(api.cita(),null);
SATE.calendario.hoy=()=> '2099-01-01';assert.equal(api.recorte('horarios').length,0);api.pintarRecorte('horarios');assert.equal(paneles['v-hor'].children.length,0);
c.DATA.calendario=null;assert.equal(api.proximos(1).length,0);assert.equal(api.recorte('mapa').length,0);
for(const u of ['escom','upibi']){c.SATE_UNIDAD=u;assert.equal(api.recorte('trayectoria').length,0)}
const recorteCSS=css.slice(css.indexOf('.sate-recorte-calendario{'),css.indexOf('/* Dos filas'));
assert.ok([...recorteCSS.matchAll(/var\((--[^),]+)/g)].every(m=>m[1].startsWith('--ipn-')||m[1]==='--sate-realce'));
assert.match(recorteCSS,/\.sate-recorte-calendario:focus-visible\{outline:2px solid var\(--sate-realce\)/);
assert.match(recorteCSS,/height:28px/);assert.match(recorteCSS,/white-space:nowrap/);
console.log('Recortes: orden, filtro por pestaña/adeudos, cita SAES ficticia, +1, ausencia, repintado y clic al detalle del proceso/periodo. OK.');
console.log(`Calendario: ${checks} eventos válidos; pistas sin solapamientos, guía exterior, leyenda, resaltado por cursor/foco, detalle inicial y respaldos, paleta con contraste AA claro/oscuro, filtros, mes/semana, hoy, teclado, continuidad y +N. OK.`);
