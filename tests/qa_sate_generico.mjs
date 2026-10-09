// Parser real del Lector y entrada SATE real con DOM en memoria; sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const leer=f=>readFileSync(f,'utf8'), lector=leer('tools/lector_saes.js');
const limpio=s=>s.replace(/<[^>]*>/g,'').trim();
// Doble de las tablas de estos fixtures: conserva caption, encabezados y título anterior.
function kardex(html) {
  const tablas=[];let fin=0;
  for(const m of html.matchAll(/<table\b([^>]*)>([\s\S]*?)<\/table>/g)){
    const anterior=html.slice(fin,m.index).match(/<h3>(.*?)<\/h3>/);
    const tabla={id:(m[1].match(/id="([^"]+)"/)||[])[1]||'',tagName:'TABLE',caption:m[2].includes('<caption>')?{textContent:limpio(m[2].match(/<caption>(.*?)<\/caption>/)[1])}:null,
      previousElementSibling:anterior?{tagName:'H3',textContent:anterior[1]}:null,rows:[]};
    for(const fila of m[2].matchAll(/<tr>([\s\S]*?)<\/tr>/g)){
      const cells=[...fila[1].matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/g)].map(c=>({textContent:limpio(c[1])}));
      tabla.rows.push({cells,textContent:cells.map(c=>c.textContent).join(' '),closest:()=>tabla});
    }
    tablas.push(tabla);fin=m.index+m[0].length;
  }
  return {querySelectorAll:()=>tablas};
}
const parser=lector.slice(lector.indexOf('    var acred ='),lector.indexOf('    /* materias reprobadas'));
for(const [f,esperado] of [['titulos',{Z101:['Álgebra ficticia',1],Z301:['Control ficticio',3],Z401:['Laboratorio ficticio',4]}],
  ['sin_titulos',{Z101:['Álgebra ficticia',1],Z201:['Física ficticia',2]}]]){
  const c=vm.createContext({kx:kardex(leer('tests/fixtures/kardex_generico_'+f+'.html')),
    CLAVE:/^(?=[A-Z0-9]*\d)[A-Z][A-Z0-9]{2,6}$/i,clean:s=>String(s||'').replace(/\s+/g,' ').trim(),num:s=>{const n=String(s).match(/\d+(?:\.\d+)?/);return n?+n[0]:null}});
  vm.runInContext(parser,c);
  assert.deepEqual(JSON.parse(JSON.stringify(c.materias)),esperado);
  assert.equal(c.acred[0][0],'Z101');assert.equal(c.acred[0][1],8);
  assert.equal(c.semestreTitulo('SEGUNDO SEMESTRE'),2);assert.equal(c.semestreTitulo('TERCERO SEMESTRE'),3);
  assert.equal(c.semestreTitulo('NIVEL 5'),5);assert.equal(c.semestreTitulo('1'),1);assert.equal(c.semestreTitulo('Clave Materia'),null);
  assert.equal(c.semestreTitulo('NIVEL: 5'),5);assert.equal(c.semestreTitulo('1º SEMESTRE'),1);
}
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
// Ejecuta el Lector completo: los únicos GET son dobles de las cinco páginas de SAES.
for(const unidad of ['esimez','upiita','escom','upibi']){
  const nodos=new Map(), solicitudes=[];let copiado;
  const nodo=id=>{if(!nodos.has(id))nodos.set(id,{style:{},setAttribute(){},innerHTML:'',textContent:''});return nodos.get(id)};
  const document={getElementById:id=>id==='upiita-lector'?null:nodo(id),createElement:()=>nodo('lector'),body:{appendChild(){}}};
  const documento=(html='')=>{
    const tablas=kardex(html).querySelectorAll();
    const titulos=[...html.matchAll(/<span id="([^"]+)">(.*?)<\/span>/g)].map(m=>({id:m[1],tagName:'SPAN',textContent:m[2],closest:()=>null,querySelector:()=>null}));
    return {body:{textContent:limpio(html)},querySelector(s){
      if(s.includes('mainCopy_Lbl_Nombre'))return {textContent:'PERFIL FICTICIO'};
      if(s.includes('Lbl_Kardex'))return tablas.length?{}:null;
      return tablas.find(t=>s.includes(t.id)&&t.id)||null;
    },querySelectorAll(s){
      if(s==='table'||s.includes('Lbl_Kardex'))return tablas;
      if(s.includes('mainCopy_'))return [...titulos,...tablas];
      return [];
    }};
  };
  const estado=documento(leer('tests/fixtures/estado_generico.html'));
  // Orden de documento: cada título precede a su tabla, como en el SAES.
  const titulos=estado.querySelectorAll('[id*="mainCopy_"]').filter(e=>e.tagName==='SPAN'), tablas=estado.querySelectorAll('table');
  estado.querySelectorAll=()=>titulos.flatMap((t,i)=>[t,tablas[i]]);
  const docs={
    '/Alumnos/Reinscripciones/fichas_reinscripcion.aspx':documento(),
    '/Alumnos/boleta/kardex.aspx':documento(leer('tests/fixtures/kardex_generico_titulos.html')),
    '/Alumnos/boleta/Estado_Alumno.aspx':estado,
    '/Alumnos/Informacion_semestral/Horario_Alumno.aspx':documento(leer('tests/fixtures/horario_generico.html')),
    '/Academica/agenda_escolar.aspx':documento()
  };
  const c=vm.createContext({document,location:{hostname:'saes.'+unidad+'.ipn.mx'},navigator:{clipboard:{async writeText(t){copiado=t}}},
    DOMParser:class {parseFromString(t){return docs[t]}},alert(t){throw new Error(t)},
    fetch:async(path,op)=>{assert.equal(op.credentials,'same-origin');assert.equal(op.method,undefined);solicitudes.push(path);return {text:async()=>path}}});
  const fuente=lector.replace('__TOOL_URL__','https://ejemplo.invalid/upiita/horarios.html').replace('__LECTOR_VERSION__','version-ficticia')
    .replace('__LECTOR_UNIDADES__',JSON.stringify(Object.keys(config.unidades))).replace('__LECTOR_NOMBRES__',JSON.stringify(config.nombresUnidades));
  await vm.runInContext(fuente,c);
  assert.equal(typeof nodo('ul-copy').onclick,'function',nodo('lector').innerHTML);
  await nodo('ul-copy').onclick();const d=JSON.parse(copiado);
  assert.deepEqual(d.materias.Z101,['Álgebra ficticia',1]);
  assert.deepEqual(d.materias.Z301,['Control ficticio',3]);
  assert.deepEqual(d.materias.Z501,['Materia pendiente ficticia',5]);
  assert.deepEqual(d.materias.Z601,['Materia desfasada ficticia',6]);
  assert.deepEqual(d.materias.Z202,['Circuitos ficticios',null]);
  assert.deepEqual(d.en_curso,['Z202']);assert.equal(d.unidad,unidad);assert.equal(d.lector,'version-ficticia');
  assert.deepEqual(d.acreditadas,[['Z101',8,'25/1','ORD'],['Z401',9,'26/2','ETS']]);
  assert.deepEqual(d.kardex_reprobadas,[['Z301',5,'26/1','ORD']]);
  assert.deepEqual(d.desfasadas_saes,[['Z601','25/1',2,6]]);
  assert.equal(solicitudes.length,5);
}
const perfil={upiita_saes:1,unidad:'esimez',leido:'2026-10-07T12:00:00Z',carrera_nombre:'Ingeniería ficticia',
  acreditadas:[['Z101',8,'25/1','ORD']],kardex_reprobadas:[['Z201',5,'25/2','ORD']],
  reprobadas_periodo:[['Z201','25/2',1,2]],desfasadas_saes:[['Z301','25/1',1,3]],no_cursadas:[['Z401',null,0,4]],
  en_curso:['Z202'],horario_inscrito:[['DEMO','Z202','Circuitos ficticios','Docente ficticio',[]]],
  materias:{Z101:['Álgebra ficticia',1],Z201:['Física ficticia',2],Z202:['Circuitos ficticios',2],Z301:['Control ficticio',3],Z401:['Laboratorio ficticio',4]},
  promedio:8,carga:{total:300,min:20,media:40,max:60,duracion:8,duracion_max:12},avance:{obtenidos:30,faltan:270,cursados:2}};
const vaciar=async()=>{for(let i=0;i<16;i++)await new Promise(r=>setImmediate(r))};
const generico=leer('web/sate/generico.js');
const fabrica=vm.createContext({unidad:'encb'});
vm.runInContext(generico.slice(generico.indexOf('  function demo('),generico.indexOf('  window.SateGenerico')),fabrica);
const encb=JSON.parse(JSON.stringify(fabrica.demo())), encbHorario=JSON.parse(JSON.stringify(fabrica.demo(true)));
assert.equal(Object.keys(encb.materias).length,45);assert.equal(encb.acreditadas.length,37);assert.equal(encb.no_cursadas.length,8);
assert.ok(encb.no_cursadas.every(r=>r[3]>=7));assert.equal(encb.en_curso.length,0);
assert.deepEqual([...new Set(encb.acreditadas.map(r=>r[3]))].sort(),['ETS','EXT','ORD','REC']);
assert.equal(encbHorario.en_curso.length,5);assert.equal(encbHorario.horario_inscrito.length,5);
for(const modo of ['actual','viejo','periodos','vacio','encb','encb-horario','encb-viejo','encb-curso-sin-horario','demo','demo-horario']){
  const unidad=modo.startsWith('encb')||modo.startsWith('demo')?'encb':'esimez';
  const p=structuredClone(unidad==='encb'?(modo.endsWith('horario')?encbHorario:encb):perfil);
  if(modo==='encb-curso-sin-horario'){Object.assign(p,structuredClone(encbHorario));p.horario_inscrito=[];}
  if(modo==='viejo'||modo==='periodos'||modo==='encb-viejo')delete p.materias;
  if(modo==='periodos'){p.no_cursadas=[['Z401',null,0,null]];p.reprobadas_periodo=p.reprobadas_periodo.map(r=>r.slice(0,3));p.desfasadas_saes=[];}
  const almacen=new Map(modo==='vacio'||modo.startsWith('demo')?[]:[['saes.alumno',JSON.stringify(p)]]),nodos=new Map(),archivos=[],eventos={};let c;
  function nodo(id=''){return {id,hidden:false,textContent:'',innerHTML:'',style:{setProperty(k,v){this[k]=v}},dataset:{},children:[],
    clientWidth:375,classList:{toggle(){}},setAttribute(){},removeAttribute(){},addEventListener(){},replaceChildren(){},remove(){},prepend(n){this.children.unshift(n)},appendChild(n){this.children.push(n)},
    querySelector:s=>nodo(s),querySelectorAll:()=>[],closest:()=>null};}
  const document={readyState:'loading',documentElement:{getAttribute(){return null},setAttribute(){},style:{setProperty(){},removeProperty(){}}},addEventListener(){},getElementById(id){if(!nodos.has(id))nodos.set(id,nodo(id));return nodos.get(id)},
    querySelector:s=>document.getElementById(s),querySelectorAll:()=>[],createElement:()=>nodo(),body:nodo(),head:{appendChild(s){
      if(!s.src)return;archivos.push(s.src);setImmediate(()=>{vm.runInContext(leer('web/dist/sate/'+s.src),c,{filename:s.src});s.onload()});
    }}};
  const location={hash:modo.startsWith('demo')?'#'+modo:'',search:'?sateUnidad='+unidad,pathname:'/sate/index.html'};
  c=vm.createContext({console,URL,URLSearchParams,document,location,SATE_CONFIG:structuredClone(config),setTimeout,clearTimeout,
    localStorage:{getItem:k=>almacen.get(k)??null,setItem:(k,v)=>almacen.set(k,v)},navigator:{userAgent:'Node',connection:{saveData:true}},
    addEventListener:(k,f)=>eventos[k]=f,history:{replaceState(a,b,url){location.hash=url.slice(url.indexOf('#'))}},
    fetch(){throw new Error('SATE genérico no descarga datos de planes')},
    SateUI:{usarTextos(){},usarAlmacen(){},cerrarModal(){},pestanas(o){const n=nodo();n.seleccionar=()=>{};return n},barraInferior(){return {marcar(){}}}}});
  vm.runInContext('window=globalThis',c);
  const doblesUI=c.SateUI;
  vm.runInContext(leer('web/dist/sate/componentes.js'),c);
  Object.assign(c.SateUI,doblesUI);
  for(const f of ['rutas.js','inicio.js'])vm.runInContext(leer('web/sate/'+f),c,{filename:f});
  await vaciar();
  assert.equal(c.SATE_UNIDAD,unidad);
  const hayHorario=modo!=='vacio'&&p.horario_inscrito.length>0;
  assert.deepEqual([...c.SATE_CONFIG.unidades[unidad].pestanas],['trayectoria','mapa',...(hayHorario?['horarios']:[])]);
  assert.deepEqual(archivos,['generico.js']);
  assert.equal(c.SATE.actual.pestana,modo==='vacio'?'mapa':'trayectoria');
  const tray=document.getElementById('sate-trayectoria');
  if(modo!=='vacio'){
    assert.match(tray.innerHTML,/Promedio del SAES: 8/);assert.match(tray.innerHTML,/Duración máxima: 12/);
    assert.match(tray.innerHTML,/Calificación: 8/);assert.doesNotMatch(tray.innerHTML,/NaN|undefined|Sugerida|Sin área/);
    if(modo==='viejo')assert.match(tray.innerHTML,/Actualiza tus datos con el Lector/);
    if(modo==='actual')assert.match(tray.innerHTML,/Álgebra ficticia/);
  }
  location.hash='#/'+unidad+'/mapa';eventos.hashchange();await vaciar();
  const mapa=document.getElementById('v-tray').innerHTML;
  assert.match(mapa,/Mapa curricular/);
  if(modo==='actual'){assert.match(mapa,/Semestre 1/);assert.match(mapa,/Semestre 4/);assert.match(mapa,/Desfasada según el SAES/);assert.match(mapa,/En curso/);}
  if(modo==='actual')for(const st of ['done','curso','fail','late','']){
    assert.equal((mapa.match(new RegExp('class="box '+st+'"','g'))||[]).length,1,'Una caja por estado SAES: '+st);
  }
  if(modo==='periodos'){assert.match(mapa,/Periodo 25\/1/);assert.match(mapa,/Por cursar/);}
  if(modo==='vacio')assert.match(mapa,/Cargar datos del SAES/);
  assert.equal(c.SateGenerico.datos({...perfil,desfasadas_saes:[],reprobadas_periodo:[['Z201','10/1',10,2]]}).materias.find(m=>m.clave==='Z201').estado,'Reprobada','La antigüedad no inventa desfase');
  assert.equal(c.SateGenerico.datos({...perfil,reprobadas_periodo:null,reprobadas:[['FÍSICA FICTICIA',20]]}).materias.find(m=>m.clave==='Z201').estado,'Reprobada','Reprobadas de la cita si no se leyó Estado General');
  const rutaHor=c.SateRutas.ruta('#/'+unidad+'/horarios',unidad,c.SATE_CONFIG.unidades);
  assert.equal(!!rutaHor,hayHorario);
  if(modo!=='vacio'){
    assert.match(mapa,/class="mapwrap"/);assert.match(mapa,/data-estado="done"/);assert.match(mapa,/<circle/);
    assert.doesNotMatch(mapa,/data-box|role="button"|data-gap|data-lwant|sug-tgl|Agregar sugeridas|sin grupos|seriación|oferta/);
    assert.match(tray.innerHTML,/data-abrir-mapa/);
  }
  if(unidad==='encb'){
    assert.equal((mapa.match(/class="box /g)||[]).length,45);
    assert.equal((mapa.match(/class="box done"/g)||[]).length,37);
    assert.equal((mapa.match(/class="box curso"/g)||[]).length,p.en_curso.length);
    assert.equal((mapa.match(/<circle data-estado="done"/g)||[]).length,37);
    if(modo!=='encb-viejo')for(let s=1;s<=8;s++)assert.match(mapa,new RegExp('Semestre '+s));
    if(modo.startsWith('demo'))assert.equal(almacen.has('saes.alumno'),false,'Demo no persiste el perfil');
  }
  if(hayHorario){
    location.hash=rutaHor.hash;eventos.hashchange();await vaciar();
    const hor=document.getElementById('v-hor').innerHTML;
    assert.match(hor,/Tu horario inscrito/);assert.match(hor,/Solo lectura/);assert.match(hor,/Docente ficticio/);
    const cal=document.querySelector('#cal').innerHTML;
    assert.doesNotMatch(hor+cal,/data-gap|data-k=|<button|oferta|Agregar|Generar|undefined/);
    if(unidad==='encb'){assert.equal((cal.match(/class="blk/g)||[]).length,5);assert.match(cal,/7FV1/);assert.match(cal,/07:00/);}
    assert.equal(document.getElementById('sate-oferta-periodo').hidden,true);
    assert.equal(document.getElementById('notice').hidden,true);
  }
  // Callback real del adaptador: cargar con horario, sustituir sin horario y borrar datos.
  vm.runInContext('SAES.wire=fn=>{globalThis.recargar=fn}',c);
  const cargarScript=c.SATE.script;c.SATE.script=async()=>{};
  await vm.runInContext('SAES.open()',c);c.SATE.script=cargarScript;
  c.recargar({...structuredClone(encbHorario),unidad});await vaciar();
  assert.ok(c.SATE_CONFIG.unidades[unidad].pestanas.includes('horarios'));
  location.hash='#/'+unidad+'/horarios';eventos.hashchange();await vaciar();
  c.recargar({...structuredClone(encb),unidad});await vaciar();
  assert.equal(c.SATE.actual.pestana,'trayectoria');
  assert.equal(document.getElementById('v-hor').hidden,true);
  assert.ok(!c.SATE_CONFIG.unidades[unidad].pestanas.includes('horarios'));
  c.recargar(null);await vaciar();
  assert.match(tray.innerHTML,/Cargar datos del SAES/);
  assert.doesNotMatch(tray.innerHTML,/Calificación|<circle|<progress/);
  assert.ok(!archivos.includes('nucleo.js'));
}
const css=leer('web/sate/componentes.css'), shell=leer('web/sate/cascaron.html');
assert.match(css,/\[data-sate-generico\] #v-tray[^}]*min-width:0;max-width:100%/);
assert.match(css,/\[data-sate-generico\] \.mapwrap[^}]*max-width:100%;min-width:0/);
assert.match(shell,/\.mapwrap\{[^}]*overflow:auto/);
assert.match(shell,/\.calwrap\{overflow-x:auto/);
// Destino del Lector: contrato de los tres enlaces existentes y la unidad genérica.
const destino=lector.slice(lector.indexOf('  if (TOOL) TOOL ='),lector.indexOf('  // claves:'));
for(const u of ['upiita','escom','upibi','esimez']){
  const c=vm.createContext({TOOL:'https://ejemplo.invalid/upiita/horarios.html',UNIDAD:u,__LECTOR_UNIDADES__:Object.keys(config.unidades)});
  vm.runInContext(destino,c);
  assert.equal(c.TOOL,'https://ejemplo.invalid/upiita/'+(u==='esimez'?'sate/index.html?sateUnidad=esimez':'horarios-'+u+'.html'));
}
console.log('SATE genérico: Lector, ENCB 45/37/8, cinco inscritas, demo, perfiles viejos/vacíos, cajas y minimapas compartidos, horario de solo lectura, navegación variable y contención CSS a 375 px.');
