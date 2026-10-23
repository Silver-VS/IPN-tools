// R2-HOR: rango, cupos y exportación reales con DOM/lienzo en memoria, sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const leer=f=>readFileSync(f,'utf8'),c=vm.createContext({document:{addEventListener(){}},addEventListener(){}});
vm.runInContext(leer('web/sate/componentes.js'),c);
const propiedades={},animaciones=[],cal={innerHTML:'',dataset:{},animate:(...args)=>animaciones.push(args),style:{setProperty:(k,v)=>propiedades[k]=v}};
c.matchMedia=()=>({matches:true});
const hm=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const op={S:{weekend:false},slots:x=>x.own?x.h:x[6],START:420,BLOCK:90,SLOT:30,SLOTPX:22,$:()=>cal,
  DAYS:['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],hm,esc,txH:k=>k,hue:()=>1,keyOf:x=>x[3]+'|'+x[8],
  name:x=>x.nombre||x[8],profs:()=>'',roomAt:()=>'',insignia:()=>'<span class="cupos-insignia">10 lugares</span>'};
const grupo=(a,b,d=0)=>['X','V',1,'G1',0,[],[[d,a,b]],4,'K1'];
function pintar(cs,extra={}){
  const antes=JSON.stringify(cs),items=c.SateUI.cuadriculaHorario(cs,{...op,...extra});
  assert.equal(JSON.stringify(cs),antes,'La vista conserva las materias y actividades');
  const horas=cal.innerHTML.match(/class="hours" style="height:([\d.]+)px">([\s\S]*?)<\/div><div class="day"/);
  assert.ok(horas,'La cuadrícula tiene un eje de horas');
  const etiquetas=[...horas[2].matchAll(/>(\d\d:\d\d)<\/div>/g)].map(m=>m[1].split(':').map(Number)).map(([h,m])=>h*60+m);
  const lo=etiquetas[0],span=Number(horas[1])/(extra.SLOTPX||op.SLOTPX)*op.SLOT,end=lo+span;
  for(const b of items){assert.ok(b.a>=lo&&b.b<=end,JSON.stringify({lo,end,d:b.d,a:b.a,b:b.b}));}
  assert.ok(span>=450,'Alto mínimo equivalente a cinco bloques');
  assert.ok(lo>=0&&end<=1440,'No hay horas negativas ni posteriores a medianoche');
  return {lo,end,span,items};
}
const vacio=pintar([]);assert.equal(vacio.lo,420);assert.equal(vacio.end,870);
for(const [a,b] of [[420,510],[480,600],[960,1050],[1080,1170],[0,30],[1410,1440]]){
  const r=pintar([grupo(a,b)]);
  assert.equal(r.span,vacio.span,'Una selección corta conserva el alto inicial');
  if(a>=420&&b<=1230){assert.ok(r.lo>=420,'El rango no empieza antes de la jornada');assert.ok(r.end<=1320||r.end>=b,'El rango termina a las 22:00 salvo clase posterior');}
  if(a>420&&b<1320)assert.ok(a-r.lo>=Math.min(90,a-420)&&r.end-b>=Math.min(90,1320-b),'Conserva margen disponible sin salir de la jornada');
}
const siete=pintar([grupo(420,510)]);assert.equal(siete.lo,420);assert.equal(siete.end,870,'El alto mínimo se desplaza dentro de la jornada');
const tarde=pintar([grupo(960,1050)]);assert.ok(tarde.lo>420,'No muestra la mañana vacía');
const animadas=animaciones.length;pintar([grupo(960,1050)]);assert.equal(animaciones.length,animadas,'No anima cada actualización de cupos');
c.matchMedia=()=>({matches:false});pintar([grupo(420,510)]);assert.equal(animaciones.length,animadas,'Respeta movimiento reducido');
c.matchMedia=()=>({matches:true});
pintar([grupo(420,510),grupo(1200,1290,4)]);
const actividad={own:true,i:0,n:'Actividad ficticia',h:[[5,1080,1170]]};
assert.ok(pintar([actividad]).lo>420);assert.equal(propiedades['--days'],6);
assert.equal(pintar([{...actividad,oculto:true}]).lo,420,'Solo horas no altera el rango');
pintar([grupo(960,990)]);assert.match(cal.innerHTML,/blk-cupo/);
assert.match(cal.innerHTML,/class="cupos-insignia">10 lugares<\/span><span class="horario-contenido">/,'Cupo antes del contenido truncable');
assert.equal((cal.innerHTML.match(/class="cupos-insignia"/g)||[]).length,1,'Una sola insignia por bloque');
const larga=grupo(960,1050);larga.nombre='Unidad de aprendizaje ficticia con un nombre que ocupa varios renglones';
for(const etiqueta of ['Sin lugares','1 lugar','120 lugares','Sin consulta']){
  pintar([larga],{insignia:()=>'<span class="cupos-insignia">'+etiqueta+'</span>'});
  assert.ok(cal.innerHTML.indexOf(etiqueta)<cal.innerHTML.indexOf('<span class="horario-contenido">'),'El cupo no depende de la longitud del nombre: '+etiqueta);
}
pintar([grupo(960,1050),grupo(990,1080)]);assert.equal(propiedades['--ipn-horario-solapes'],2);
pintar([grupo(960,1050)],{soloLectura:true,SLOTPX:18});assert.doesNotMatch(cal.innerHTML,/data-k=|data-gap=/);
assert.match(cal.innerHTML,/cupos-insignia/);
pintar([grupo(960,1050)],{insignia:null});assert.doesNotMatch(cal.innerHTML,/blk-cupo|cupos-insignia/);

// Oferta compilada de 2027/1: turnos de las carreras de los perfiles ficticios 2 y 4.
const oferta=JSON.parse(leer('web/dist/sate/datos/upiita/oferta.json')).periodos.proximo;
const indice=JSON.parse(leer('data/perfiles-prueba/indice.json')).perfiles;
for(const caso of [2,4]){
  const ficha=indice.find(p=>p.caso===caso),perfil=JSON.parse(leer('data/perfiles-prueba/'+ficha.archivo));
  assert.equal(perfil.carrera,ficha.carrera);
  pintar([]);
  const propias=oferta.filter(x=>x[0]===perfil.carrera&&x[6].length);
  const manana=propias.find(x=>x[6].every(b=>b[1]<720&&b[2]<=900));
  const vespertina=propias.find(x=>x[6].every(b=>b[1]>=900));
  assert.ok(manana&&vespertina,'Oferta con ambos turnos para el perfil ficticio '+caso);
  for(const cs of [[manana],[vespertina],[manana,vespertina],[vespertina,actividad]])pintar(cs);
}

// El PNG que alimenta el PDF y el formato en tabla ya recortan a las horas elegidas.
const exportacion=leer('web/sate/exportacion.js'),trazos=[];
let elegidas=[grupo(960,1050)],propias=[];
const g=new Proxy({measureText:t=>({width:String(t).length*7})},{get:(o,k)=>k in o?o[k]:(...args)=>trazos.push([k,...args])});
const canvas={getContext:()=>g};
const e=vm.createContext({document:{fonts:{ready:Promise.resolve()},createElement:()=>canvas},
  selected:()=>elegidas,ownVis:()=>propias,EXP:{dark:false,show:{g:true,p:false}},SATE_CONFIG:{unidades:{X:{realce:{claro:'gray'}}}},
  UNIDAD:'X',S:{car:'X',per:'proximo'},DATA:{carreras:{X:'Carrera ficticia'},capturado:'2026-10-01'},
  START:420,BLOCK:90,DAYS:op.DAYS,hm,hue:()=>1,name:op.name,profs:()=>'',pretty:String,
  fmtCr:String,ws:()=>({plan:'A'}),isPersonal:()=>false,txH:k=>k});
vm.runInContext(exportacion.slice(exportacion.indexOf('function scheduleData('),exportacion.indexOf('async function drawTable(')),e);
for(const cs of [[grupo(480,570)],[grupo(960,1050)],[grupo(480,570),grupo(1200,1290)]]){
  elegidas=cs;trazos.length=0;
  await e.drawSchedule('week',1);
  assert.ok(canvas.height>0&&Number.isFinite(canvas.height));
  assert.ok(trazos.some(x=>x[0]==='fillText'&&x[1]===hm(cs[0][6][0][1])),'La imagen conserva el inicio seleccionado');
  for(const x of trazos.filter(x=>x[0]==='rect'))assert.ok(x[2]>=154&&x[2]+x[4]<=canvas.height,'Clase dentro del PNG/PDF');
  const tabla=e.weekGrid();assert.equal(tabla.rows[0][0],cs[0][6][0][1]);assert.equal(tabla.rows.at(-1)[1],cs.at(-1)[6][0][2]);
}
elegidas=[];propias=[{n:'Actividad ficticia',d:[5],a:1080,b:1170}];
await e.drawSchedule('week',1);assert.equal(e.weekGrid().rows[0][0],1080);

const css=leer('web/sate/componentes.css').split('/* R2-HOR:')[1];
assert.match(css,/grid-template-rows:auto minmax\(0,1fr\)/,'La insignia tiene una fila propia');
assert.match(css,/minmax\(var\(--ipn-horario-columna-min/,'Los traslapes conservan ancho por carril');
assert.match(css,/\.sate-cupos-consultar\.btn\{[^}]*min-height:var\(--ipn-control-alto\)/);
assert.match(css,/:focus-visible/);
const html=leer('web/sate/cascaron.html');
assert.match(html,/id="f-cupo"/,'El filtro de cupo aparece en Más filtros');
assert.match(html,/id="f-cupo-ayuda"/,'El filtro explica si faltan datos y cuándo se consultaron');
assert.match(leer('web/sate/horarios.js'),/S\.soloCupo&&!plan\(\)\.sel\.includes\(keyOf\(c\)\)/,'El generador conserva los grupos elegidos al filtrar cupos');
assert.match(leer('web/sate/temarios.js'),/SATE\.temarios = \{[^}]*\babrir,/,'Horarios reutiliza el vistazo compartido del temario');
assert.match(leer('web/sate/horarios.js'),/montar\(\)\{[^}]*SATE\.cargarTemarios\?\.\(\)\?\.then\(\(\)=>\{if\(SATE\.actual\?\.pestana==='horarios'\)renderHor\(\)\}\)/,'Horarios carga temarios en segundo plano y repinta al terminar');
assert.match(html,/\.temario-mini\{[^}]*min-width:44px[^}]*min-height:var\(--ipn-control-alto\)/,'El botón del temario tiene objetivo táctil');
assert.equal([...html.matchAll(/class="btn sate-cupos-consultar"[^>]*data-cupos-ayuda/g)].length,2);
assert.equal([...html.matchAll(/<span data-cupos-etiqueta>/g)].length,2);
assert.match(leer('web/sate/cupos.js'),/querySelector\?\.\('\[data-cupos-etiqueta\]'\)/,'Actualizar el texto conserva el ícono');
console.log('R2-HOR: rango centrado, bordes del día, actividades, traslapes, cupos sin duplicados, oferta 2027/1 con perfiles 2/4 y lienzo/tabla de exportación. OK. Sin revisión visual.');
