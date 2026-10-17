// Regresión DESF2 y DESF3: núcleo, persistencia, generador y selección reales, sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const leer=f=>readFileSync(f,'utf8');
const nucleo=leer('web/sate/nucleo.js'), horarios=leer('web/sate/horarios.js');
const perfil=JSON.parse(leer('data/perfiles-prueba/desfase-dictamen-bionica.json'));
const datos=JSON.parse(leer('web/dist/sate/datos/upiita/nucleo.json'));
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const almacen=new Map(), nodos=new Map(), logs=[];
const storage={getItem:k=>almacen.get(k)??null,setItem:(k,v)=>almacen.set(k,v)};
const document={addEventListener(){},querySelector(k){if(!nodos.has(k))nodos.set(k,{hidden:false,innerHTML:'',textContent:'',addEventListener(){},checked:false});return nodos.get(k)}};
const c=vm.createContext({console:{debug:(...args)=>logs.push(args)},document,performance,structuredClone,
  SATE_DATA:{...datos,periodos:{actual:[],proximo:[]}},SATE_CONFIG:config,
  SAES:{load:()=>structuredClone(perfil)},IPNT:{set:(k,v)=>storage.setItem(k,v)},
  SATE:{texto:(k,v={})=>(config.textos[k]||k).replace(/\{(\w+)\}/g,(_,k)=>v[k]??k)},localStorage:storage,sessionStorage:{getItem:()=>null},
  location:{hash:'',search:'',pathname:''},matchMedia:()=>({matches:false}),addEventListener(){},
  setTimeout:()=>0,clearTimeout(){},citaPasada:()=>false,
  cur:()=>datos.mapas.B.cur,isElec:()=>false,resaltarMapa(){},renderList(){},renderTray(){},
  avisoOptativa(){},renderOffer(){},renderPlans(){},renderCal(){},renderActive(){},
  GT:{src:'todo',n:'',days:''},MARK:{sug:[]},txH:k=>k,
  optCupo:()=>({}),optExceso:()=>({}),nivOpt:()=>null,cargaInfo:()=>null,
  statusOf:k=>k==='B204'?'fail':'',tmin:()=>null,breaksOk:()=>true,semanaOk:()=>true,semanaPena:()=>0,
  daysOf:cs=>[...new Set(cs.flatMap(c=>c[6].map(b=>b[0])))]});
const run=s=>vm.runInContext(s,c);
run('window=globalThis');
run(leer('web/sate/componentes.js'));
run(nucleo.slice(0,nucleo.indexOf('/* "dd/mm/aaaa')));
run(nucleo.slice(nucleo.indexOf('const perIdx='),nucleo.indexOf('/* Desfase OFICIAL')));
run(nucleo.slice(nucleo.indexOf('const saveT='),nucleo.indexOf('function pattern(')));
run(nucleo.slice(nucleo.indexOf('function refresh('),nucleo.indexOf('/* ---------- eventos ---------- */')));
run(horarios.slice(horarios.indexOf('let generacion=null;'),horarios.indexOf('\nfunction renderOffer()')));
// Sin elección no se fija ningún periodo, tampoco para los adeudos ya desfasados.
assert.deepEqual(Array.from(run('tr().oblig')),[]);
for(const k of ['B203','B204'])assert.equal(run(`planAsignado('${k}')`),null);
assert.match(run("desfaseAcciones('B204')"),/data-materia="B204"/);
assert.doesNotMatch(run("desfaseAcciones('B203')"),/data-opcion="siguiente"|disabled/,'Una opción inválida desaparece');
assert.equal(run("elegirDesfase('B203','siguiente')"),false,'Un adeudo ya desfasado no se pospone');
// Variante solo en memoria: B204 se reprobó hace dos periodos y vencería en N+1.
run("ALUMNO.reprobadas_periodo.find(r=>r[0]==='B204')[1]=perName(planInicio()-2);for(const k in T)delete T[k];PLAN_CACHE=null");
assert.equal(run("planAsignado('B204')"),null);
assert.equal(run("tr().oblig.includes('B204')"),false);
assert.equal(run("conPlan(()=>tr().oblig.includes('B204'),1)"),false);
assert.match(run("desfaseAcciones('B204')"),/siguiente periodo ya sería desfase/);
// R2-PER: cada motivo vive en su materia; no hay párrafos sueltos al inicio.
const avisos = run('desfaseAvisos()');
assert.equal((avisos.match(/siguiente periodo ya sería desfase/g)||[]).length,1);
assert.ok(avisos.startsWith('<section class="sate-materia-decision">'));
for(const seccion of avisos.match(/<section\b[^>]*>[\s\S]*?<\/section>/g)||[]){
  assert.equal((seccion.match(/class="sate-aviso-materia__motivo"/g)||[]).length,1);
  assert.match(seccion,/aria-label="[^"]+"/,'El aviso nombra la materia');
  assert.doesNotMatch(seccion,/disabled/);
}
assert.doesNotMatch(run("desfaseAcciones('B203')"),/data-opcion="siguiente"/);
assert.match(run("desfaseAcciones('B204')"),/data-opcion="siguiente"/,'La opción válida se conserva');
assert.equal(run("elegirDesfase('B204','siguiente')"),true);
assert.equal(run("planAsignado('B204')"),1,'Solo elegir siguiente la incluye en N+1');
assert.equal(run("conPlan(()=>tr().oblig.includes('B204'),1)"),true);
run("S.planPaso=0;toggleBox('B204')");
assert.equal(run("planAsignado('B204')"),0,'DESF2: elegir en N debe adelantar la obligatoria de N+1');
assert.equal(run("conPlan(()=>tr().want.includes('B204'),1)"),false);
assert.equal(run("conPlan(()=>tr().done.includes('B204'),1)"),true);
assert.ok(logs.some(args=>args[0]==='SATE: selección en mapa'));
// La selección persiste al invalidar las cachés y alimenta Horarios, que usa N.
run('for(const k in T)delete T[k];PLAN_CACHE=null;S.per="actual"');
assert.equal(run("tr().want.includes('B204')"),true);
run(`elegirDesfase('B203','actual');const extra=Object.keys(cur()).find(k=>!tr().done.includes(k)&&!tr().curso.includes(k)&&!tr().fail.includes(k));tr().want.push(extra);saveT();
  DATA.periodos.actual=['B203','B204',extra].map((k,i)=>['B','M',2,'F'+i,i,[],[[i,480,540]],7.5,k,'O']);actualizarOferta()`);
for(const n of ['',2,'auto']){
  c.GT.n=n;
  assert.ok(run("generate().top.some(r=>r.cs.some(c=>c[8]==='B204'))"),'El generador debe ofrecer el recurse adelantado: '+n);
}
run("toggle(keyOf(classes()[1]))");
assert.equal(run("selected().some(c=>c[8]==='B204')"),true,'El horario permite seleccionar su grupo');
// Quitar de N vuelve a pedir decisión, sin enviarla automáticamente a N+1.
run("toggleBox('B204')");
assert.equal(run("planAsignado('B204')"),null);
assert.match(run("desfaseAvisos()"),/data-materia="B204"/,'El aviso sigue visible al quitarla');
assert.equal(run("selected().some(c=>c[8]==='B204')"),false,'Sin elección tampoco conserva un grupo en el horario');
assert.equal(run("generate(['B204',extra]).subj.some(s=>s.k==='B204')"),false,'Sin elección el generador no fija la materia');
// Elegir este periodo y ETS persiste; ETS conserva el adeudo y excluye grupos en los tres modos.
run("elegirDesfase('B204','actual');elegirDesfase('B203','actual');elegirDesfase('B203','siguiente')");
assert.equal(run("planAsignado('B204')"),0);
assert.equal(run("planAsignado('B203')"),0);
assert.equal(run("elegirDesfase('B204','ets')"),true);
run('for(const k in T)delete T[k];PLAN_CACHE=null');
assert.equal(run("desfaseEleccion('B204')"),'ets');
assert.equal(run("planAsignado('B204')"),null);
assert.equal(run("conPlan(()=>tr().done.includes('B204'),1)"),false,'Elegir ETS no acredita la materia');
assert.equal(run("selected().some(c=>c[8]==='B204')"),false,'ETS retira el grupo elegido anteriormente');
assert.match(run("desfaseAcciones('B204')"),/Tu elección: Acreditarla por ETS/);
assert.ok([...almacen.values()].some(v=>v.includes('desfasePorPeriodo')&&v.includes('ets')));
for(const n of ['',2,'auto']){
  c.GT.n=n;
  assert.equal(run("generate(['B204',extra]).subj.some(s=>s.k==='B204')"),false,'ETS fuera del generador: '+n);
}
run("elegirDesfase('B204','siguiente');for(const k in T)delete T[k];PLAN_CACHE=null");
assert.equal(run("planAsignado('B204')"),1,'Siguiente persiste tras recargar');
assert.equal(run("generate(['B204',extra]).subj.some(s=>s.k==='B204')"),false,'N+1 no entra en el horario de N');
run("elegirDesfase('B204','actual');for(const k in T)delete T[k];PLAN_CACHE=null");
assert.equal(run("planAsignado('B204')"),0,'Este periodo persiste tras recargar');
// Al avanzar el horizonte, una elección explícita de N+1 pasa a ser la elección de N.
run("elegirDesfase('B204','siguiente');const inicioAnterior=planInicio();const metaAnterior=perMetaBase;perMetaBase=()=>inicioAnterior+1;for(const k in T)delete T[k];PLAN_CACHE=null");
assert.equal(run("planAsignado('B204')"),0,'El periodo elegido se conserva al avanzar el horizonte');
run("conPlan(()=>toggleBox0('B204'),0);for(const k in T)delete T[k];PLAN_CACHE=null");
assert.equal(run("planAsignado('B204')"),null,'Quitar la elección heredada no la vuelve a asignar');
run('perMetaBase=metaAnterior;for(const k in T)delete T[k];PLAN_CACHE=null');
// Una elección voluntaria del segundo periodo conserva la interacción de abrir sus acciones.
run("const libre=Object.keys(cur()).find(k=>!tr().done.includes(k)&&!tr().curso.includes(k)&&!tr().fail.includes(k)&&!tr().want.includes(k));conPlan(()=>toggleBox0(libre),1);conPlan(()=>toggleBox0(libre),0)");
assert.equal(run('planAsignado(libre)'),1);
console.log('OK DESF2/DESF3: sin asignación automática, tres elecciones, persistencia, adelanto, ETS, generador y plazo.');

// Perfiles ficticios 3 y 4: la presentación y la validación usan el mismo plazo.
for(const archivo of ['adeuda-telematica.json','desfase-dictamen-bionica.json']){
  c.perfilPrueba=JSON.parse(leer('data/perfiles-prueba/'+archivo));
  c.cur=()=>datos.mapas[c.perfilPrueba.carrera].cur;
  run('ALUMNO=structuredClone(perfilPrueba);S.car=perfilPrueba.carrera;for(const k in T)delete T[k];PLAN_CACHE=null');
  const claves=Array.from(run('tr().adeudos'));
  assert.ok(claves.length>0,archivo);
  for(const k of claves){
    const html=run(`desfaseAcciones('${k}')`),valida=run(`desfaseSiguiente('${k}')`);
    assert.equal(html.includes('data-opcion="siguiente"'),valida,archivo+': '+k);
    assert.doesNotMatch(html,/disabled/);
    const motivo=html.match(/class="sate-aviso-materia__motivo">([^<]+)</)[1];
    assert.ok(motivo.split(/\s+/).length<=20,archivo+': motivo breve para '+k);
    if(!valida)assert.equal(run(`elegirDesfase('${k}','siguiente')`),false);
  }
  assert.equal((run('desfaseAvisos()').match(/class="sate-aviso-materia"/g)||[]).length,claves.length);
  assert.equal(run('desfaseAvisos(new Set(tr().adeudos))'),'','Horarios omite las materias con aviso en la oferta');
}
const seguro=c.SateUI.avisoMateria({clave:'<x>',nombre:'<img src=x onerror=1>',estado:'"estado"',motivo:'<script>',acciones:[{opcion:'"x',texto:'<b>'}]});
assert.doesNotMatch(seguro,/<img|<script>|<b>/);
assert.match(seguro,/&lt;img/);
console.log('OK R2-PER: perfiles 3/4, motivo por materia, acciones válidas, límite de 20 palabras y escape HTML.');
