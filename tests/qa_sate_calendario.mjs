// Integración local con DOM en memoria; no abre navegador ni transmite datos.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const leer=p=>readFileSync(p,'utf8'), data=JSON.parse(leer('data/calendario.json'));
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const base=JSON.parse(leer('data/calendario_ipn.json'));
assert.deepEqual(config.calendarioBase,base);
for(const u of ['upiita','escom','upibi']) assert.ok(config.unidades[u].pestanas.includes('calendario'));
assert.equal(leer('web/dist/sate/index.html').split('"ciclo":"2026-2027"').length,2,'Base inyectada una vez');
for(const e of [...base.eventos,...data.upiita.actividades,...data.upiita.eventos]){
  for(const f of [e.desde,e.hasta]){assert.match(f,/^\d{4}-\d{2}-\d{2}$/);assert.equal(new Date(f+'T00:00:00Z').toISOString().slice(0,10),f)}
  assert.ok(e.desde<=e.hasta);assert.ok(e.titulo&&e.simbolo&&e.audiencia.length);
}
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

const c=vm.createContext({SATE,DATA:{calendario:data.upiita},SATE_CONFIG:config,SATE_UNIDAD:'upiita',document,console,
  perMeta:()=>0,perName:()=> '27/1',isPersonal:()=>false,conSim:(_,fn)=>fn(),tr:()=>({fail:[]})});
const nucleo=leer('web/dist/sate/nucleo.js');
vm.runInContext(nucleo.slice(nucleo.indexOf('SATE.calendario={'),nucleo.indexOf('let CALAP=')),c);
const api=SATE.calendario;api.hoy=()=> '2026-10-20';
const e=(categoria,desde,extra={})=>({categoria,desde,hasta:desde,periodo:'27/1',titulo:categoria,audiencia:['alumnos'],simbolo:'relleno',...extra});
const pruebaBase={fuente:'Calendario académico IPN',eventos:[e('inicio','2026-08-24'),e('descanso','2026-09-16'),e('descanso','2026-11-16')]};
const local={periodo:'27/1',fuente:'Aviso ficticio',actividades:[e('gestion','2026-10-07')],eventos:[e('inicio','2026-10-19',{reemplaza:true}),e('descanso','2026-11-16',{reemplaza:true})]};
const fusion=api.fusion(pruebaBase,local);
assert.equal(fusion.length,4);assert.ok(!fusion.some(e=>e.desde==='2026-08-24'));
assert.ok(fusion.some(e=>e.desde==='2026-09-16'&&e.origen==='ipn'),'Un descanso no borra los restantes');
assert.equal(fusion.filter(e=>e.desde==='2026-11-16').length,1);
assert.ok(fusion.some(e=>e.categoria==='gestion'&&e.origen==='unidad'));
assert.equal(api.fusion(pruebaBase,null).length,3);
assert.equal(api.fusion(null,local).length,3);
c.SATE_CONFIG={...config,calendariosUnidad:{encb:local}};c.SATE_UNIDAD='encb';c.DATA.calendario=null;
assert.ok(api.eventos().some(e=>e.desde==='2026-10-19'&&e.origen==='unidad'),'Aviso de unidad sin plan');
c.SATE_CONFIG=config;c.SATE_UNIDAD='upiita';c.DATA.calendario=data.upiita;
const audiencias=['alumnos','nuevo_ingreso','docentes','posgrado','nms'].map(a=>e('gestion','2026-10-01',{audiencia:[a]}));
assert.equal(api.filtrarAudiencia(audiencias).length,2);
assert.equal(api.filtrarAudiencia(audiencias,false,{avance:{cursados:1}}).length,2);
assert.equal(api.filtrarAudiencia(audiencias,false,{avance:{cursados:2}}).length,1);
assert.equal(api.filtrarAudiencia(audiencias,true,{avance:{cursados:2}}).length,4);
assert.equal(api.filtrarAudiencia(audiencias,true).length,5);
const mixto=e('inicio','2026-08-24',{audiencia:['nuevo_ingreso','alumnos']});
assert.equal(api.fusion({eventos:[mixto]}, {periodo:'27/1',eventos:[{...mixto,desde:'2026-10-19',audiencia:['alumnos','nuevo_ingreso'],reemplaza:true}]}).length,1,'Orden de audiencias no altera el reemplazo');
assert.equal(api.eventos().filter(e=>e.categoria==='inicio'&&e.periodo==='27/1').length,1);
assert.equal(api.eventos().find(e=>e.categoria==='inicio'&&e.periodo==='27/1').desde,'2026-10-19');
assert.ok(api.eventos().some(e=>e.origen==='ipn')&&api.eventos().some(e=>e.origen==='unidad'));
assert.ok(api.eventos().every(e=>!e.audiencia.includes('docentes')));
assert.ok(api.eventos(true).some(e=>e.audiencia.includes('docentes')));
assert.equal(api.proximos(0).length,0);assert.equal(api.proximos(3,[]).length,0);
assert.equal(api.proximos(2,['becas']).length,2);
vm.runInContext(leer('web/dist/sate/calendario.js'),c);
const mostrar=()=>SATE.modulos.calendario.mostrar();mostrar();
const dias=()=>box.all().filter(n=>n.getAttribute('data-fecha'));
const nodos=clase=>box.all().filter(n=>n.className?.split(' ').includes(clase)||n.getAttribute('class')===clase);
assert.equal(nodos('calendario-semicirculo').length,1);
assert.equal(nodos('calendario-mes').length,1);
assert.equal(nodos('calendario-anillo').length,0);assert.equal(nodos('calendario-banda').length,0);
assert.equal(document.getElementById('cal-vista-periodo'),undefined);
assert.equal(nodos('calendario-lista')[0].tagName,'details');assert.equal(nodos('calendario-lista')[0].children[0].textContent,'Ver como lista');
assert.equal(nodos('calendario-detalle')[0].parent,nodos('calendario-contenido')[0]);
const eventos=api.eventos().filter(e=>e.periodo==='27/1');
assert.equal(nodos('calendario-arco').length,eventos.length);
const paths=box.all().filter(n=>n.tagName==='textPath');assert.equal(paths.length,eventos.filter(e=>e.desde!==e.hasta).length);
assert.ok(paths.some(n=>n.textContent.endsWith('…')));
for(const t of paths){assert.ok(t.getAttribute('href').startsWith('#cal-arco-'));assert.equal(t.getAttribute('startOffset'),'50%')}
assert.equal(nodos('calendario-aguja').length,1);
assert.ok(nodos('calendario-semicirculo')[0].getAttribute('viewBox').split(' ').map(Number)[3]<nodos('calendario-semicirculo')[0].getAttribute('viewBox').split(' ').map(Number)[2],'Medio círculo');
const guia=nodos('calendario-pista')[0].getAttribute('d').match(/M ([\d.]+) ([\d.]+) A ([\d.]+) ([\d.]+) 0 0 1 ([\d.]+) ([\d.]+)/);
assert.ok(guia&&Number(guia[1])<Number(guia[5]));assert.ok(Math.abs(Number(guia[2])-Number(guia[6]))<.001,'Inicio izquierdo y fin derecho a igual altura');
const arcos=()=>nodos('calendario-arco');
for(const a of arcos())for(const b of arcos())if(a!==b&&a.getAttribute('data-pista')===b.getAttribute('data-pista'))assert.ok(a.getAttribute('data-hasta')<b.getAttribute('data-desde')||b.getAttribute('data-hasta')<a.getAttribute('data-desde'));
assert.equal(nodos('calendario-dias-semana')[0].children.map(n=>n.textContent).join(' '),'D L M M J V S');
assert.equal(dias().filter(n=>n.getAttribute('data-fecha').startsWith('2026-10')).length,31);
assert.equal(dias().filter(n=>n.tabIndex===0).length,1);
const protocolo=arcos().find(n=>n.getAttribute('aria-label').includes('registro de protocolo'));
protocolo.onkeydown({key:'Enter',preventDefault(){}});
assert.match(nodos('calendario-detalle')[0].textContent,/Aviso de Gestión Escolar UPIITA/);
assert.equal(dias().filter(n=>n.getAttribute('data-seleccionado')==='true').length,5);
assert.equal(document.activeElement.id,'cal-detalle-titulo');
const dia19=dias().find(n=>n.getAttribute('data-fecha')==='2026-10-19');dia19.onclick();
assert.ok(arcos().filter(n=>n.getAttribute('aria-pressed')==='true').length>1,'Un día resalta todos sus procesos');
dia19.onkeydown({key:'ArrowRight',preventDefault(){}});assert.equal(document.activeElement.getAttribute('data-fecha'),'2026-10-20');
document.activeElement.onkeydown({key:'ArrowDown',preventDefault(){}});assert.equal(document.activeElement.getAttribute('data-fecha'),'2026-10-27');
const tt=document.getElementById('cal-filtro-tt');tt.checked=false;tt.onchange();assert.ok(!box.textContent.includes('Entrega de constancias'));
document.getElementById('cal-proximo').onclick();assert.equal(document.getElementById('cal-mes').textContent,'noviembre 2026');
assert.ok(nodos('calendario-rayado').length&&nodos('calendario-sindical').length);
document.getElementById('cal-audiencia').checked=true;document.getElementById('cal-audiencia').onchange();
assert.ok(nodos('calendario-proceso').some(n=>n.getAttribute('aria-label').includes('Planeación')));
// Sin aviso local, ESCOM y UPIBI conservan las fechas oficiales.
c.DATA.calendario=null;c.perName=()=> '27/2';api.hoy=()=> '2027-06-15';mostrar();
assert.equal(api.eventos().find(e=>e.categoria==='inicio'&&e.periodo==='27/2').desde,'2027-01-25');
assert.equal(dias().find(n=>n.getAttribute('data-fecha')==='2027-06-15').getAttribute('data-categoria'),'ordinaria');
assert.ok(box.all().some(n=>n.getAttribute('data-simbolo')==='triangulo_invertido'));
arcos().find(n=>n.getAttribute('data-categoria')==='politecnico').onclick();
assert.equal(document.getElementById('cal-mes').textContent,'mayo 2027');assert.ok(box.all().some(n=>n.getAttribute('data-simbolo')==='estrella'));
// Bisiesto y procesos superpuestos: selección íntegra y navegación civil.
c.SATE_CONFIG={...config,calendarioBase:null};c.DATA.calendario={periodo:'28/2',eventos:[
 e('ets','2028-02-01',{hasta:'2028-03-10',periodo:'28/2'}),e('descanso','2028-02-29',{periodo:'28/2',simbolo:'rayado'})]};
c.perName=()=> '28/2';api.hoy=()=> '2028-02-29';mostrar();
assert.equal(dias().filter(n=>n.getAttribute('data-fecha').startsWith('2028-02')).length,29);
dias().find(n=>n.getAttribute('data-fecha')==='2028-02-29').onclick();assert.equal(nodos('calendario-detalle-evento').length,2);
document.getElementById('cal-proximo').onclick();assert.equal(document.getElementById('cal-mes').textContent,'marzo 2028');
api.hoy=()=> '2099-01-01';mostrar();assert.equal(nodos('calendario-aguja').length,0);assert.equal(document.getElementById('cal-hoy').disabled,true);
c.DATA.calendario=null;mostrar();assert.equal(dias().length,0);assert.equal(api.proximos(1).length,0);
// Recortes existentes: clic al proceso, fuente, cita personal y ausencia.
c.SATE_CONFIG=config;c.DATA.calendario=data.upiita;c.perName=()=> '27/1';api.hoy=()=> '2026-10-07';
c.addEventListener=()=>{};vm.runInContext('window=globalThis',c);vm.runInContext(leer('web/dist/sate/componentes.js'),c);c.SateUI.usarTextos(SATE.texto);
let destino;SATE.ir=id=>destino=id;
assert.equal(api.recorte('calendario').length,0);assert.equal(api.recorte('horarios')[0].titulo,'Citas publicadas');
for(const id of ['horarios','mapa','trayectoria']){api.pintarRecorte(id);api.pintarRecorte(id);const p=paneles[id==='horarios'?'v-hor':id==='mapa'?'v-tray':'sate-trayectoria'];assert.equal(p.all().filter(n=>n.className==='sate-recorte-calendario').length,1)}
paneles['v-hor'].firstChild.listeners.click();mostrar();assert.equal(destino,'calendario');assert.match(nodos('calendario-detalle')[0].textContent,/Citas publicadas/);
c.isPersonal=()=>true;c.ALUMNO={cita:{inicio:'08/10/2026 10:00:00',fin:'08/10/2026 10:30:00'}};c.perDeFecha=()=>0;
assert.equal(api.cita().desde,'2026-10-08');api.abrirProceso(api.cita());mostrar();assert.match(nodos('calendario-detalle')[0].textContent,/10:00:00/);
assert.match(nodos('calendario-detalle')[0].textContent,/SAES del alumno/);assert.ok(!box.textContent.includes('sate.calendario.'));
const css=leer('web/sate/componentes.css'),bloque=css.slice(css.indexOf('#sate-calendario{'),css.indexOf('.sate-sr{'));
assert.match(bloque,/@media\(min-width:1024px\)\{\.calendario-layout\{grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
assert.match(bloque,/\.calendario-layout\{display:grid;grid-template-columns:minmax\(0,1fr\)/);
assert.match(bloque,/grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/);
assert.match(bloque,/\.calendario-semicirculo\{display:block;width:100%;max-width:38rem;height:auto/);
assert.match(bloque,/overflow-wrap:anywhere/);assert.match(bloque,/@media\(max-width:720px\)/);
assert.doesNotMatch(bloque,/min-width:(?:14rem|[4-9]\d\dpx)|calendario-anillo|calendario-banda/);
assert.match(bloque,/\.calendario-dia\.calendario-rayado\{background:repeating-linear-gradient/);
assert.match(bloque,/\.calendario-sindical \.calendario-numero\{border:2px solid #3470b0;border-radius:50%/);
const rgb=s=>s.slice(1).match(/../g).map(n=>parseInt(n,16)/255);
const lum=s=>rgb(s).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
for(const m of bloque.matchAll(/\[data-categoria=([\w]+)\]\{--cal-fill:(#[\da-f]+);--cal-ink:(#[\da-f]+)/g))assert.ok(ratio(m[2],m[3])>=4.5,'AA relleno/texto '+m[1]);
for(const m of bloque.matchAll(/--cal-fondo:(#[\da-f]+);--cal-texto:(#[\da-f]+);--cal-tenue:(#[\da-f]+)/g)){assert.ok(ratio(m[1],m[2])>=4.5);assert.ok(ratio(m[1],m[3])>=4.5)}
console.log('CAL3: base única, fusión, audiencias, semicírculo/textPath/aguja, selección bidireccional, símbolos, teclado, bisiesto, recortes, CSS móvil y contraste AA. OK.');
