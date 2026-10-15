// Regresión DESF2: núcleo, persistencia, generador y selección reales, sin navegador ni red.
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
  SATE:{texto:k=>k},localStorage:storage,sessionStorage:{getItem:()=>null},
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
run(nucleo.slice(0,nucleo.indexOf('/* "dd/mm/aaaa')));
run(nucleo.slice(nucleo.indexOf('const perIdx='),nucleo.indexOf('/* Desfase OFICIAL')));
run(nucleo.slice(nucleo.indexOf('const saveT='),nucleo.indexOf('function pattern(')));
run(nucleo.slice(nucleo.indexOf('function refresh('),nucleo.indexOf('/* ---------- eventos ---------- */')));
run(horarios.slice(horarios.indexOf('let generacion=null;'),horarios.indexOf('\nfunction renderOffer()')));
// El perfil original debe conservar sus dos obligaciones actuales.
assert.deepEqual(Array.from(run('tr().oblig')).sort(),['B203','B204']);
// Variante solo en memoria: B204 se reprobó hace dos periodos y vencería en N+1.
run("ALUMNO.reprobadas_periodo.find(r=>r[0]==='B204')[1]=perName(planInicio()-2);for(const k in T)delete T[k];PLAN_CACHE=null");
assert.equal(run("planAsignado('B204')"),1);
assert.equal(run("tr().oblig.includes('B204')"),false);
assert.equal(run("conPlan(()=>tr().oblig.includes('B204'),1)"),true);
run("S.planPaso=0;toggleBox('B204')");
assert.equal(run("planAsignado('B204')"),0,'DESF2: elegir en N debe adelantar la obligatoria de N+1');
assert.equal(run("conPlan(()=>tr().want.includes('B204'),1)"),false);
assert.equal(run("conPlan(()=>tr().done.includes('B204'),1)"),true);
assert.ok(logs.some(args=>args[0]==='SATE: selección en mapa'));
// La selección persiste al invalidar las cachés y alimenta Horarios, que usa N.
run('for(const k in T)delete T[k];PLAN_CACHE=null;S.per="actual"');
assert.equal(run("tr().want.includes('B204')"),true);
run(`const extra=Object.keys(cur()).find(k=>!tr().done.includes(k)&&!tr().curso.includes(k)&&!tr().fail.includes(k));tr().want.push(extra);saveT();
  DATA.periodos.actual=['B203','B204',extra].map((k,i)=>['B','M',2,'F'+i,i,[],[[i,480,540]],7.5,k,'O']);actualizarOferta()`);
for(const n of ['',2,'auto']){
  c.GT.n=n;
  assert.ok(run("generate().top.some(r=>r.cs.some(c=>c[8]==='B204'))"),'El generador debe ofrecer el recurse adelantado: '+n);
}
run("toggle(keyOf(classes()[1]))");
assert.equal(run("selected().some(c=>c[8]==='B204')"),true,'El horario permite seleccionar su grupo');
// Quitar de N la devuelve a su fecha límite, nunca desaparece del plan completo.
run("toggleBox('B204')");
assert.equal(run("planAsignado('B204')"),1);
run("conPlan(()=>toggleBox0('B204'),1)");
assert.equal(run("planAsignado('B204')"),1,'No se puede quitar la obligatoria de N+1');
// La acción explícita también permite adelantar; una obligación actual no se pospone ni se quita.
run("conPlan(()=>toggleBox0('B204',true),0);conPlan(()=>toggleBox0('B203',true),1);conPlan(()=>toggleBox0('B203'),0)");
assert.equal(run("planAsignado('B204')"),0);
assert.equal(run("planAsignado('B203')"),0);
// Una elección voluntaria del segundo periodo conserva la interacción de abrir sus acciones.
run("const libre=Object.keys(cur()).find(k=>!tr().done.includes(k)&&!tr().curso.includes(k)&&!tr().fail.includes(k)&&!tr().want.includes(k));conPlan(()=>toggleBox0(libre),1);conPlan(()=>toggleBox0(libre),0)");
assert.equal(run('planAsignado(libre)'),1);
console.log('OK DESF2: perfil ficticio, adelanto, persistencia, tres modos del generador, horario y límites de desfase.');
