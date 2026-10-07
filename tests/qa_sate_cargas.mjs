// Integración sin navegador: render inicial real y módulos diferidos con dobles de DOM.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const leer = f => readFileSync(f,'utf8');
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const html=leer('web/dist/sate/index.html');
const mapaHTML=html.split('id="v-tray"')[1].split('<section id="v-hor"')[0];
assert.match(mapaHTML,/class="plan-layout"/,'A: mapa y panel comparten la cuadrícula');
const panelHTML=mapaHTML.split('<aside class="plan-panel card"')[1].split('</aside>')[0];
for(const id of ['h-sugg','sugg','b-sugg','chosen','chosen-help','chosen-req','plan-simular']) {
  assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,'A: ID único '+id);
  assert.ok(panelHTML.includes('id="'+id+'"'),'A: bloque dentro del panel visible '+id);
}
assert.ok(!panelHTML.includes('data-personal'),'A: planeación disponible sin SAES');
assert.match(html,/@media\(max-width:900px\)\{\.plan-layout\{grid-template-columns:minmax\(0,1fr\)\}\}/,'A: panel debajo en teléfono');
const desempenoHTML=html.split('id="sate-desempeno"')[1].split('id="v-tray"')[0];
assert.ok(desempenoHTML.indexOf('id="desempeno-simulacion"')<desempenoHTML.indexOf('id="kstats"'),'B: simulador antes de estadísticas');
assert.equal([...html.matchAll(/id="est-sim"/g)].length,1,'B: un solo simulador');
const almacen = () => { const m=new Map(); return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i],get length(){return m.size}}; };
for (const unidad of ['upiita','escom','upibi']) {
  const datos=Object.assign({},...['nucleo','oferta'].map(n=>JSON.parse(leer(`web/dist/sate/datos/${unidad}/${n}.json`))));
  const nodos=new Map(), cargados=[], pendientes=new Map(); let api, contexto;
  const horariosIDs=new Set([...leer('web/sate/cascaron.html').split('<section id="v-hor"')[1].split('<!-- módulo')[0].matchAll(/id="([^"]+)"/g)].map(m=>'#'+m[1]));
  function nodo(id='') { return {id,hidden:true,value:'',dataset:{},innerHTML:'',textContent:'',options:[],children:[],style:{setProperty(){},getPropertyValue(){return ''}},
    classList:{add(){},remove(){},toggle(){},contains(){return false}},eventos:{},addEventListener(n,fn){this.eventos[n]=fn},setAttribute(){},removeAttribute(){},getAttribute(){return null},
    appendChild(){},insertAdjacentHTML(){},querySelector:()=>nodo(),querySelectorAll:()=>[],closest:()=>null,contains:()=>false,focus(){document.activeElement=this},
    offsetWidth:1280,offsetHeight:800,clientWidth:1280,scrollLeft:0,getBoundingClientRect:()=>({top:0,left:0,bottom:800,width:1280,height:800}),showModal(){this.hidden=false},close(){this.hidden=true}}; }
  const segmentos=[nodo('plan-0'),nodo('plan-1')];segmentos.forEach((b,i)=>{b.dataset.planPaso=String(i);b.atributos={};b.setAttribute=(k,v)=>b.atributos[k]=v});
  const document={readyState:'loading',addEventListener(){},querySelector(s){
    assert.ok(!horariosIDs.has(s)||cargados.includes('horarios.js'),'Dependencia de Horarios en el primer pintado: '+s);
    if(!nodos.has(s))nodos.set(s,nodo(s));return nodos.get(s);
  },getElementById(id){return this.querySelector('#'+id)},querySelectorAll:s=>s==='[data-plan-paso]'?segmentos:[],createElement:()=>nodo(),body:nodo(),head:nodo(),documentElement:nodo()};
  const SATE={texto:k=>config.textos[k]||k,modulos:{},actual:{pestana:'mapa'},pestana(id,m){this.modulos[id]=m},error:e=>{throw e},nucleoListo:async a=>{api=a},repintar(){},ir(){},identidadSaes(){},
    script(n){if(!pendientes.has(n)){cargados.push(n);vm.runInContext(leer('web/dist/sate/'+n),contexto,{filename:n});pendientes.set(n,Promise.resolve())}return pendientes.get(n)}};
  SATE.ir=id=>SATE.destino=id;
  contexto=vm.createContext({console,document,SATE,SATE_DATA:datos,SATE_UNIDAD:unidad,URL,URLSearchParams,Blob,performance,
    localStorage:almacen(),sessionStorage:almacen(),location:{hash:'#/'+unidad+'/mapa',search:'',pathname:'/sate/index.html'},history:{replaceState(){}},
    navigator:{userAgent:'Node',maxTouchPoints:0},matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},setTimeout,clearTimeout,
    requestAnimationFrame:fn=>fn(),getComputedStyle:()=>({getPropertyValue:()=>''}),MutationObserver:class{observe(){}},CSS:{escape:s=>s},innerWidth:1280,innerHeight:800,
    fetch(){throw new Error('Red prohibida en QA de cargas')}});
  vm.runInContext('window=globalThis',contexto);
  vm.runInContext(leer('web/dist/sate/nucleo.js'),contexto,{filename:'nucleo.js'});
  await SATE.script('mapa.js');
  api.renderTop(); api.renderTray(); await vm.runInContext('renderStats()',contexto);
  assert.ok(nodos.get('#plan-titulo').textContent,'A: panel sin SAES renderizado');
  segmentos[1].focus();segmentos[1].eventos.click();
  assert.equal(segmentos[1].atributos['aria-pressed'],'true','C: segundo segmento seleccionado');
  assert.equal(document.activeElement,segmentos[1],'C: cambiar periodo conserva foco');
  assert.equal(nodos.get('#b-go').hidden,true,'C: N+1 no arma horarios');
  segmentos[0].eventos.click();
  assert.equal(nodos.get('#b-go').hidden,false,'C: N conserva armado de horarios');
  nodos.get('#plan-simular').eventos.click();
  assert.equal(SATE.destino,'desempeno','B: enlace directo a Desempeño');
  assert.equal(SATE.simAbrir,true,'B: enlace solicita abrir el simulador existente');
  vm.runInContext(`
    // Fixture ficticio con cadena real: acredita en N todos los requisitos de una sucesora.
    S.car=Object.keys(DATA.mapas).find(car=>Object.keys(DATA.mapas[car].req||{}).length)||S.car;
    const relacion=Object.entries(prereqs()).find(([k,r])=>cur()[k]&&r.length&&r.every(x=>cur()[x]&&!isElec(x)));
    if(!relacion)throw new Error('C: falta una cadena de seriación en '+UNIDAD);
    const [sucesora,requisitos]=relacion;
    DATA.calendario={...(DATA.calendario||{}),periodo:'27/1'};
    ALUMNO=null;SIM.on=false;for(const k in T)delete T[k];
    store.set('t.'+S.car,{want:requisitos,extra:'conservar'});
    if(!tr().want.includes(requisitos[0]))throw new Error('C: migración de want legado');
    saveT();
    const periodoN=planClave(0), periodoSig=planClave(1);
    conPlan(()=>{if(!tr().done.includes(requisitos[0]))throw new Error('C: N no se proyecta acreditado');
      if(statusOf(sucesora).includes('lock'))throw new Error('C: no desbloquea sucesora '+sucesora);
      if(!suggestions().cands.includes(sucesora))throw new Error('C: sugerencias futuras dependen de oferta de N');
      tr().want=[sucesora];saveT();},1);
    for(const k in T)delete T[k];
    if(!conPlan(()=>tr().want.includes(sucesora),1))throw new Error('C: N+1 no persiste tras recarga');
    if(tr().want.includes(sucesora))throw new Error('C: N+1 contaminó selección de N');
    const guardado=store.get('t.'+S.car,{});
    if(guardado.extra!=='conservar'||!guardado.wantPorPeriodo[periodoN]||!guardado.wantPorPeriodo[periodoSig])throw new Error('C: datos incompatibles');
    // Simulación y créditos retenidos: aprobar N libera los adeudos para N+1.
    ALUMNO={...perfilDemo(),acreditadas:[],en_curso:[],reprobadas:[],reprobadas_periodo:[],avance:{},cita:{},agenda:[]};
    ALUMNO.carga={min:0,media:40,max:80};ALUMNO.reprobadas_periodo=[[requisitos[0],'26/1',1]];
    for(const k in T)delete T[k];
    if(cargaInfo(0).ret!==cur()[requisitos[0]][1])throw new Error('C: retenidos de N incorrectos');
    conPlan(()=>{if(cargaInfo(0).ret!==0)throw new Error('C: N+1 retiene materia acreditada en N');},1);
    ALUMNO.reprobadas_periodo=[];
    for(const k in T)delete T[k];
    ALUMNO.acreditadas=[[sucesora,8,'26/2','ORD']];
    for(const k in T)delete T[k];
    conPlan(()=>{if(tr().want.includes(sucesora))throw new Error('C: propone acreditada en N+1');},1);
    ALUMNO.acreditadas=[];ALUMNO.en_curso=[sucesora];SIM.on=true;
    for(const k in T)delete T[k];
    conPlan(()=>{if(tr().want.includes(sucesora))throw new Error('C: propone acreditada simulada en N+1');},1);
    SIM.on=false;ALUMNO=null;for(const k in T)delete T[k];
    DATA.calendario.periodo='27/2';
    if(!tr().want.includes(sucesora))throw new Error('C: horizonte móvil pierde N+1 al pasar a N');
    store.set('t.'+S.car,{want:[]});for(const k in T)delete T[k];
  `,contexto,{filename:'planeacion-fixture-'+unidad});
  vm.runInContext('ALUMNO=perfilDemo();for(const k in T)delete T[k]',contexto);
  api.renderTray(); await vm.runInContext('renderStats()',contexto);
  assert.deepEqual(cargados,['mapa.js'],'Mapa con/sin perfil no descarga Horarios ni Desempeño');
  await vm.runInContext('SAES.open()',contexto);
  await vm.runInContext('SAES.open()',contexto);
  assert.equal(cargados.filter(n=>n==='saes-dialogo.js').length,1);
  await SATE.script('horarios.js'); SATE.modulos.horarios.montar(); SATE.modulos.horarios.mostrar();
  assert.ok(!cargados.includes('exportacion.js'));
  await document.querySelector('#b-export').eventos.click();
  await document.querySelector('#b-export').eventos.click();
  assert.equal(cargados.filter(n=>n==='exportacion.js').length,1);
  console.log(unidad+': A panel con/sin SAES; B enlace y simulador único al inicio; C seriación, persistencia, horizonte, exclusiones y foco; cargas diferidas correctas.');
}
