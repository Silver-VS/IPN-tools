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
assert.equal(api.eventos().find(e=>e.categoria==='fin'&&e.periodo==='27/1').desde,'2027-02-15');
assert.ok(!api.eventos(true).some(e=>e.origen==='ipn'&&data.upiita.periodosPropios.includes(e.periodo)),'UPIITA no hereda procesos del calendario incompatible');
for(const p of ['26/2','27/1','27/2'])assert.ok(api.eventos().filter(e=>e.categoria==='ets'&&e.periodo===p).every(e=>e.origen==='unidad'&&e.fuenteOriginal.includes('Gestión Escolar UPIITA')));
assert.deepEqual(Array.from(api.eventos().filter(e=>e.categoria==='ets'&&e.periodo==='26/2').map(e=>[e.desde,e.hasta])),[['2026-10-07','2026-10-09'],['2026-10-12','2026-10-12']]);
assert.equal(data.upiita.eventos.filter(e=>e.verificar).length,3);
const fechasLocales={
 '27/1|ordinaria':['2026-11-18:2026-11-20','2027-01-04:2027-01-06','2027-02-08:2027-02-10'],
 '27/1|extraordinaria':['2027-02-11:2027-02-12'],
 '27/1|ets':['2027-02-18:2027-02-19','2027-02-22:2027-02-24'],
 '27/2|ordinaria':['2027-04-16:2027-04-16','2027-05-19:2027-05-20','2027-05-24:2027-05-26','2027-06-25:2027-06-25','2027-06-28:2027-06-29'],
 '27/2|extraordinaria':['2027-06-30:2027-07-01'],
 '27/2|ets':['2027-07-07:2027-07-09','2027-07-12:2027-07-13'],
};
for(const [clave,fechas] of Object.entries(fechasLocales))assert.deepEqual(Array.from(api.eventos().filter(e=>e.periodo+'|'+e.categoria===clave).map(e=>e.desde+':'+e.hasta)),fechas,'Transcripción UPIITA: '+clave);
c.SATE_UNIDAD='escom';c.DATA.calendario=null;
assert.equal(api.eventos().find(e=>e.categoria==='inicio'&&e.periodo==='27/1').desde,'2026-08-24');
assert.ok(api.eventos().filter(e=>e.categoria==='ets').every(e=>e.origen==='ipn'));
c.SATE_UNIDAD='upiita';c.DATA.calendario=data.upiita;
assert.ok(api.eventos().some(e=>e.origen==='ipn')&&api.eventos().some(e=>e.origen==='unidad'));
assert.ok(api.eventos().every(e=>!e.audiencia.includes('docentes')));
assert.ok(api.eventos(true).some(e=>e.audiencia.includes('docentes')));
assert.equal(api.proximos(0).length,0);assert.equal(api.proximos(3,[]).length,0);
assert.equal(api.proximos(2,['becas']).length,2);
vm.runInContext(leer('web/dist/sate/calendario.js'),c);
const mostrar=()=>SATE.modulos.calendario.mostrar();mostrar();
const dias=()=>box.all().filter(n=>n.getAttribute('data-fecha'));
const nodos=clase=>box.all().filter(n=>n.className?.split(' ').includes(clase)||n.getAttribute('class')?.split(' ').includes(clase));
assert.equal(nodos('calendario-semicirculo').length,1);
assert.equal(nodos('calendario-mes').length,1);
assert.equal(nodos('calendario-anillo').length,0);assert.equal(nodos('calendario-banda').length,0);
assert.equal(document.getElementById('cal-vista-periodo'),undefined);
assert.equal(nodos('calendario-lista')[0].tagName,'details');assert.equal(nodos('calendario-lista')[0].children[0].textContent,'Ver como lista');
assert.equal(nodos('calendario-detalle')[0].parent,nodos('calendario-contenido')[0]);
const eventos=api.eventos().filter(e=>e.periodo==='27/1');
assert.ok(nodos('calendario-arco').length<=eventos.length);
const paths=box.all().filter(n=>n.tagName==='textPath');
const letras=n=>(n.textContent.match(/\p{L}/gu)||[]).length;
for(const n of [...paths,...nodos('calendario-etiqueta-nombre')]){assert.ok(letras(n)>=6,n.textContent);assert.ok(!n.textContent.includes('…'))}
assert.ok(nodos('calendario-etiqueta-exterior').length>0);
const cajas=()=>box.all().filter(n=>n.getAttribute('data-caja')).map(n=>n.getAttribute('data-caja').split(',').map(Number));
const sinColision=()=>{const cs=cajas();for(let i=0;i<cs.length;i++)for(let j=i+1;j<cs.length;j++){const [x,y,w,h]=cs[i],[a,b,c,d]=cs[j];assert.ok(x+w<=a||a+c<=x||y+h<=b||b+d<=y,'Cajas de etiquetas exteriores separadas')}};sinColision();
assert.deepEqual(nodos('calendario-anillo-categoria').map(n=>n.getAttribute('data-categoria')),Array.from(api.categorias.filter(c=>eventos.some(e=>e.categoria===c&&e.desde!==e.hasta))));
assert.ok(nodos('calendario-insignia').length>0);
for(const n of nodos('calendario-anillo-categoria'))assert.ok(Number(n.getAttribute('stroke-width'))>=12);
for(const t of paths){assert.ok(t.getAttribute('href').startsWith('#cal-arco-'));assert.equal(t.getAttribute('startOffset'),'50%')}
assert.equal(nodos('calendario-aguja').length,1);
assert.ok(nodos('calendario-semicirculo')[0].getAttribute('viewBox').split(' ').map(Number)[3]<nodos('calendario-semicirculo')[0].getAttribute('viewBox').split(' ').map(Number)[2],'Medio círculo: '+nodos('calendario-semicirculo')[0].getAttribute('viewBox'));
const guia=nodos('calendario-pista')[0].getAttribute('d').match(/M ([\d.]+) ([\d.]+) A ([\d.]+) ([\d.]+) 0 0 1 ([\d.]+) ([\d.]+)/);
assert.ok(guia&&Number(guia[1])<Number(guia[5]));assert.ok(Math.abs(Number(guia[2])-Number(guia[6]))<.001,'Inicio izquierdo y fin derecho a igual altura');
const arcos=()=>nodos('calendario-arco');
for(const a of arcos())for(const b of arcos())if(a!==b&&a.getAttribute('data-pista')===b.getAttribute('data-pista'))assert.ok(a.getAttribute('data-hasta')<b.getAttribute('data-desde')||b.getAttribute('data-hasta')<a.getAttribute('data-desde'));
const insignia=nodos('calendario-insignia')[0],fechaGrupo=insignia.getAttribute('data-fecha-grupo');insignia.onclick();assert.equal(document.activeElement.getAttribute('data-fecha'),fechaGrupo);
document.getElementById('cal-hoy').onclick();
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
assert.ok(box.all().some(n=>n.getAttribute('data-simbolo')==='contorno')&&nodos('calendario-sindical').length);
document.getElementById('cal-audiencia').checked=true;document.getElementById('cal-audiencia').onchange();
assert.ok(nodos('calendario-proceso').some(n=>n.getAttribute('aria-label').includes('Planeación')));
// Sin aviso local, ESCOM y UPIBI conservan las fechas oficiales.
c.DATA.calendario=null;c.perName=()=> '27/2';api.hoy=()=> '2027-06-15';document.getElementById('cal-periodo').value='27/2';document.getElementById('cal-periodo').onchange();
assert.equal(api.eventos().find(e=>e.categoria==='inicio'&&e.periodo==='27/2').desde,'2027-01-25');
assert.equal(dias().find(n=>n.getAttribute('data-fecha')==='2027-06-15').getAttribute('data-categoria'),'ordinaria');
assert.ok(box.all().some(n=>n.getAttribute('data-simbolo')==='triangulo_invertido'));
nodos('calendario-proceso').find(n=>n.getAttribute('data-categoria')==='politecnico').onclick();
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
assert.match(bloque,/\.calendario-semicirculo\{display:block;width:100%;height:auto/);
assert.match(bloque,/overflow-wrap:anywhere/);assert.match(bloque,/@media\(max-width:720px\)/);
assert.doesNotMatch(bloque,/min-width:(?:14rem|[4-9]\d\dpx)|\.calendario-anillo\{|calendario-banda/);
assert.match(bloque,/\.calendario-dia\.calendario-rayado\{background:repeating-linear-gradient/);
assert.match(bloque,/\.calendario-sindical \.calendario-numero\{border:2px solid #3470b0;border-radius:50%/);
const rgb=s=>s.slice(1).match(/../g).map(n=>parseInt(n,16)/255);
const lum=s=>rgb(s).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
for(const m of bloque.matchAll(/\[data-categoria=([\w]+)\]\{--cal-fill:(#[\da-f]+);--cal-ink:(#[\da-f]+)/g))assert.ok(ratio(m[2],m[3])>=4.5,'AA relleno/texto '+m[1]);
for(const m of bloque.matchAll(/--cal-fondo:(#[\da-f]+);--cal-texto:(#[\da-f]+);--cal-tenue:(#[\da-f]+)/g)){assert.ok(ratio(m[1],m[2])>=4.5);assert.ok(ratio(m[1],m[3])>=4.5)}
// Una instancia nueva elige hoy o el próximo periodo, aunque el plan señale otro.
const reiniciar=()=>{vm.runInContext(leer('web/dist/sate/calendario.js'),c);mostrar()};
// El año de la etiqueta corresponde al cierre del ciclo escolar, no al inicio.
const periodos=vm.createContext({});vm.runInContext(nucleo.slice(nucleo.indexOf('const perIdx='),nucleo.indexOf('/* Agenda escolar')),periodos);
assert.equal(vm.runInContext("perName(perDeFecha('19/10/2026'))",periodos),'27/1');
assert.equal(vm.runInContext("perName(perDeFecha('16/08/2027'))",periodos),'28/1');
assert.equal(vm.runInContext("perName(perDeFecha('25/02/2027'))",periodos),'27/2');
c.SATE_CONFIG=config;c.DATA.calendario=data.upiita;c.perName=()=> '27/2';api.hoy=()=> '2026-10-09';reiniciar();
assert.equal(document.getElementById('cal-periodo').children.find(n=>n.selected).value,'27/1');
sinColision();assert.equal(box.getAttribute('data-calendario-propio'),'true');
assert.match(nodos('calendario-svg-hoy')[0].textContent,/hoy · 9 oct/);
api.hoy=()=> '2027-02-10';reiniciar();assert.equal(document.getElementById('cal-periodo').children.find(n=>n.selected).value,'27/1','UPIITA sigue en 27/1 cuando la base oficial ya inició 27/2');
api.hoy=()=> '2027-06-15';reiniciar();assert.equal(document.getElementById('cal-periodo').children.find(n=>n.selected).value,'27/2');
c.SATE_CONFIG={...config,calendarioBase:null};c.DATA.calendario={periodo:'28/1',eventos:[e('ets','2028-01-01',{hasta:'2028-01-05',periodo:'28/1'}),e('ets','2028-02-01',{hasta:'2028-02-05',periodo:'28/2'})]};
api.hoy=()=> '2028-01-20';reiniciar();assert.equal(document.getElementById('cal-periodo').children.find(n=>n.selected).value,'28/2');
// Solapamientos de una categoría usan subpistas; otras categorías conservan su anillo.
c.DATA.calendario={periodo:'28/2',eventos:[e('ets','2028-02-01',{hasta:'2028-02-12',periodo:'28/2'}),e('ets','2028-02-03',{hasta:'2028-02-08',periodo:'28/2'}),e('saberes','2028-02-02',{hasta:'2028-02-09',periodo:'28/2'})]};api.hoy=()=> '2028-02-04';reiniciar();
assert.equal(nodos('calendario-anillo-categoria').length,2);assert.equal(nodos('calendario-anillo-categoria')[0].getAttribute('data-subpistas'),'2');sinColision();
// Teléfono: únicamente la selección tiene etiqueta exterior, incluyendo un día agrupado.
c.SATE_CONFIG=config;c.DATA.calendario=data.upiita;c.matchMedia=()=>({matches:true});box.clientWidth=375;api.hoy=()=> '2026-10-09';reiniciar();
assert.ok(nodos('calendario-etiqueta-exterior').length>0);assert.ok(nodos('calendario-etiqueta-exterior').every(n=>n.getAttribute('data-seleccionada')==='true'));sinColision();
for(const n of nodos('calendario-anillo-categoria'))assert.ok(Number(n.getAttribute('stroke-width'))>=8);
arcos().find(n=>n.getAttribute('aria-label').includes('protocolo')).onclick();assert.ok(nodos('calendario-etiqueta-nombre').some(n=>n.textContent==='Protocolo TT'));
assert.equal(nodos('calendario-fuente')[0].tagName,'details');assert.equal(nodos('calendario-fuente')[0].children[0].textContent,'Fuente');
assert.match(nodos('calendario-svg-hoy')[0].textContent,/hoy · 9 oct/);
sinColision();
const [vx,vy,vw,vh]=nodos('calendario-semicirculo')[0].getAttribute('viewBox').split(' ').map(Number);
for(const [x,y,w,h] of cajas())assert.ok(x>=vx&&x+w<=vx+vw&&y>=vy&&y+h<=vy+vh,'Meses, hoy y etiquetas dentro del viewBox a 375 px');
const capas=nodos('calendario-semicirculo')[0].children;
for(const n of nodos('calendario-insignia'))assert.ok(capas.indexOf(nodos('calendario-aguja')[0])<capas.indexOf(n),'Aguja debajo de insignias');
assert.equal(nodos('calendario-audiencia-corta')[0].textContent,'Incluir docentes y posgrado');
assert.match(bloque,/data-unidad=upiita\]\[data-calendario-propio=true\] \[data-categoria=inscripcion_ets\]\{--cal-fill:#f5c5a5/);
assert.match(bloque,/@media\(max-width:599px\)\{\.calendario-audiencia\{flex:0 0 100%\}/);
assert.match(bloque,/\.calendario-audiencia-larga\{display:none\}\.calendario-audiencia-corta\{display:inline\}/);
document.getElementById('cal-audiencia').checked=true;document.getElementById('cal-audiencia').onchange();
for(const n of nodos('calendario-anillo-categoria'))assert.ok(Number(n.getAttribute('d').match(/ A ([\d.-]+)/)[1])>0,'Radio positivo al ampliar audiencia');
console.log('CAL5: calendario propio UPIITA, base oficial ESCOM, ETS locales, nomenclatura, colisiones compartidas, márgenes a 375 px, capas y controles móviles. OK.');
