// Integración sin navegador: render inicial real y módulos diferidos con dobles de DOM.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const leer = f => readFileSync(f,'utf8');
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const html=leer('web/dist/sate/index.html');
const mapaHTML=html.split('id="v-tray"')[1].split('<section id="v-hor"')[0];
assert.ok(!mapaHTML.includes('plan-layout'),'A: sin cuadrícula lateral junto al mapa');
assert.match(mapaHTML, /class="map-plan"[\s\S]*id="mapwrap"[\s\S]*id="plan-panel"/, 'mapa y pie comparten tarjeta');
assert.ok(!mapaHTML.includes('id="plan-titulo"'), 'sin título intermedio');
assert.match(mapaHTML, /id="mapnote" hidden/, 'notas fuera del flujo');
const panelHTML=mapaHTML.split('<section class="plan-panel"')[1].split('<div class="below">')[0];
assert.ok(mapaHTML.indexOf('id="mapcut"')<mapaHTML.indexOf('id="mapwrap"'),'minimapa arriba');
assert.ok(mapaHTML.indexOf('id="mapwrap"')<mapaHTML.indexOf('id="plan-panel"'),'selector debajo del mapa');
assert.ok(mapaHTML.indexOf('id="plan-periodos"')<mapaHTML.indexOf('id="mapwrap"'),'pincel junto a controles');
assert.ok(!panelHTML.includes('<summary>'),'selector siempre abierto');
for(const id of ['h-sugg','sugg','b-sugg','chosen','chosen-help','chosen-req']) {
  assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,'ID único '+id);
  assert.ok(panelHTML.includes('id="'+id+'"'),'bloque debajo del mapa '+id);
}
assert.match(mapaHTML,/class="plan-head plan-bandeja"[\s\S]*id="plan-resumen"[\s\S]*id="plan-deshacer"/);
assert.match(html,/\.plan-bandeja\{position:sticky;bottom:0/);
assert.ok(!Object.values(config.textos).some(t=>/pincel/i.test(t)));
assert.ok(Object.values(config.unidades).every(c=>c.planDosPeriodos===false));
assert.ok(!panelHTML.includes('data-personal'),'planeación disponible sin SAES');
assert.ok(!/\.plan-panel[^{}]*\{[^}]*max-height/.test(html),'sin altura máxima');
assert.match(html,/@media\(max-width:720px\)\{\.plan-grupos\{grid-template-columns:1fr/,'grupos apilados en teléfono');
assert.match(html,/\.plan-grupos\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,'dos columnas');
assert.match(html,/id="plan-activo" role="status" aria-live="polite"/,'anuncio accesible');
assert.match(html,/\.box.want.plan-2[^{}]*\{background:var\(--plan-segundo\)/,'color del segundo periodo');
assert.match(html,/\.box.want\{background:var\(--accent\)/,'acento del primer periodo');
// Contraste del texto con el fondo de selección en los tres bloques del tema.
const luminancia=hex=>{
  const rgb=hex.match(/\w\w/g).map(h=>parseInt(h,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
  return rgb.reduce((s,c,i)=>s+c*[.2126,.7152,.0722][i],0);
};
const fondos=[...html.matchAll(/--plan-segundo:(#[\da-f]+); --plan-segundo-fg:(#[\da-f]+);/g)];
assert.equal(fondos.length,3,'tema claro, oscuro automático y oscuro explícito');
for(const [,fondo,frente] of fondos){const a=luminancia(fondo.slice(1)),b=luminancia(frente.slice(1));assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,'contraste AA de N+1');}
const texto=(k,v={})=>(config.textos[k]||k).replace(/\{(\w+),\s*plural,\s*((?:[^{}]*\{[^{}]*\})+)\s*\}/g,(m,k,c)=>{
  const opciones=Object.fromEntries([...c.matchAll(/(=?\w+)\s*\{([^{}]*)\}/g)].map(x=>[x[1],x[2]]));
  return (opciones['='+v[k]]||opciones[v[k]===1?'one':'other']||opciones.other).replaceAll('#',String(v[k]));
}).replace(/\{(\w+)\}/g,(m,k)=>v[k]??m);
const desempenoHTML=html.split('id="sate-trayectoria"')[1].split('id="v-tray"')[0];
assert.ok(desempenoHTML.indexOf('id="sate-presente"')<desempenoHTML.indexOf('id="kstats"'),'B1: presente antes de estadísticas');
assert.equal([...html.matchAll(/id="est-sim"/g)].length,1,'B: un solo simulador');
const almacen = () => { const m=new Map(); return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i],get length(){return m.size}}; };
for (const dosPeriodos of [false,true]) for (const unidad of ['upiita','escom','upibi']) {
  const configModo=structuredClone(config);configModo.unidades[unidad].planDosPeriodos=dosPeriodos;
  const datos=Object.assign({},...['nucleo','oferta'].map(n=>JSON.parse(leer(`web/dist/sate/datos/${unidad}/${n}.json`))));
  const nodos=new Map(), cargados=[], pendientes=new Map(); let api, contexto, ultimaEspera;
  const movil={matches:false,eventos:{},addEventListener(k,fn){this.eventos[k]=fn}};
  const horariosIDs=new Set([...leer('web/sate/cascaron.html').split('<section id="v-hor"')[1].split('<!-- módulo')[0].matchAll(/id="([^"]+)"/g)].map(m=>'#'+m[1]));
  function nodo(id='') { return {id,hidden:true,value:'',dataset:{},innerHTML:'',textContent:'',options:[],children:[],style:{setProperty(){},getPropertyValue(){return ''}},
    classList:{add(){},remove(){},toggle(){},contains(){return false}},eventos:{},addEventListener(n,fn){this.eventos[n]=fn},setAttribute(){},removeAttribute(){},getAttribute(){return null},
    appendChild(){},insertAdjacentHTML(){},querySelector:()=>nodo(),querySelectorAll:()=>[],closest:()=>null,contains:()=>false,focus(){document.activeElement=this},
    offsetWidth:1280,offsetHeight:800,clientWidth:1280,scrollLeft:0,getBoundingClientRect:()=>({top:0,left:0,bottom:800,width:1280,height:800}),showModal(){this.hidden=false},close(){this.hidden=true}}; }
  const segmentos=[nodo('plan-0'),nodo('plan-1')];segmentos.forEach((b,i)=>{b.dataset.planPaso=String(i);b.atributos={};b.setAttribute=(k,v)=>b.atributos[k]=v});
  const eventosDocumento={};
  const document={readyState:'loading',addEventListener(n,fn){(eventosDocumento[n]??=[]).push(fn)},querySelector(s){
    assert.ok(!horariosIDs.has(s)||cargados.includes('horarios.js'),'Dependencia de Horarios en el primer pintado: '+s);
    if(!nodos.has(s))nodos.set(s,nodo(s));return nodos.get(s);
  },getElementById(id){return this.querySelector('#'+id)},querySelectorAll:s=>s==='[data-plan-paso]'?segmentos:[],createElement:()=>nodo(),body:nodo(),head:nodo(),documentElement:nodo()};
  const SATE={texto,modulos:{},actual:{pestana:'mapa'},pestana(id,m){this.modulos[id]=m},error:e=>{throw e},nucleoListo:async a=>{api=a},repintar(){},ir(){},identidadSaes(){},
    script(n){if(!pendientes.has(n)){cargados.push(n);vm.runInContext(leer('web/dist/sate/'+n),contexto,{filename:n});pendientes.set(n,Promise.resolve())}return pendientes.get(n)}};
  SATE.ir=id=>SATE.destino=id;
  const ayudas=[];
  contexto=vm.createContext({SateUI:{modal:(titulo,contenido)=>ayudas.push({titulo,contenido})},console:{...console,debug(){}},document,SATE,SATE_CONFIG:configModo,structuredClone,SATE_DATA:datos,SATE_UNIDAD:unidad,URL,URLSearchParams,Blob,performance,
    localStorage:almacen(),sessionStorage:almacen(),location:{hash:'#/'+unidad+'/mapa',search:'',pathname:'/sate/index.html'},history:{replaceState(){}},
    navigator:{userAgent:'Node',maxTouchPoints:0},matchMedia:s=>s==='(max-width:720px)'?movil:{matches:false,addEventListener(){}},addEventListener(){},setTimeout(fn,ms,...args){if(ms===6000)ultimaEspera={fn,ms};return setTimeout(fn,ms,...args)},clearTimeout,
    requestAnimationFrame:fn=>fn(),getComputedStyle:()=>({getPropertyValue:()=>''}),MutationObserver:class{observe(){}},CSS:{escape:s=>s},innerWidth:1280,innerHeight:800,
    fetch(){throw new Error('Red prohibida en QA de cargas')}});
  vm.runInContext('window=globalThis',contexto);
  vm.runInContext(leer('web/dist/sate/nucleo.js'),contexto,{filename:'nucleo.js'});
  await SATE.script('mapa.js');
  SATE.modulos.mapa.montar();
  movil.matches=true;
  api.renderTop(); api.renderTray(); await vm.runInContext('renderStats()',contexto);
  assert.ok(nodos.get('#map-ayuda').textContent.includes('Cómo leer el mapa'),'ayuda del mapa disponible');
  assert.equal(nodos.get('#insp').hidden,true,'sin bloque Explora entre mapa y pie');
  assert.equal(nodos.get('#plan-supuesto').hidden,true,'supuesto oculto en N');
  assert.equal(nodos.get('#mapcut').hidden,true,'A: sin SAES la fila contiene solo planeación');
  assert.match(nodos.get('#plan-resumen').innerHTML,/Elige en el mapa las materias que quieres cursar en/,'bandeja vacía orienta al alumno');
  vm.runInContext(`const elegible=Object.keys(cur()).find(k=>!isElec(k));toggleBox(elegible)`,contexto);
  assert.match(nodos.get('#plan-resumen').innerHTML,/1 materia · [\d.,]+(?: de [\d.,]+)? créditos para/,'selección actualiza resumen');
  assert.ok(nodos.get('#chosen').innerHTML.includes('wchip'),'A: selección actualiza elegidas');
  nodos.get('#b-none').eventos.click();
  assert.match(nodos.get('#plan-resumen').innerHTML,/Elige en el mapa las materias que quieres cursar en/,'bandeja vacía orienta al alumno');
  assert.equal(nodos.get('#plan-opciones').hidden,!dosPeriodos);
  assert.equal(nodos.get('#plan-activo').hidden,!dosPeriodos);
  assert.equal(nodos.get('#plan-leyenda').hidden,!dosPeriodos);
  assert.equal(nodos.get('#b-go').disabled,true);
  assert.equal(ultimaEspera.ms,6000,'Deshacer dura seis segundos');
  ultimaEspera.fn();assert.equal(nodos.get('#plan-deshacer').hidden,true,'Deshacer desaparece al vencer');
  if(!dosPeriodos){
    vm.runInContext(`
      DATA.calendario={...(DATA.calendario||{}),periodo:'27/1'};
      const primero=Object.keys(cur()).find(k=>!isElec(k));
      const segundo=Object.keys(cur()).find(k=>k!==primero&&!isElec(k));
      const futuro=planClave(1);
      store.set('t.'+S.car,{want:[],extra:'conservar',wantPorPeriodo:{[futuro]:[primero,segundo],siguiente:[segundo]}});
      for(const k in T)delete T[k];
      if(planAsignado(primero)!==null||planElegidas().size)throw new Error('Segundo periodo aparece en el mapa');
      S.planPaso=1;renderTray();if(S.planPaso!==0)throw new Error('Periodo activo no es fijo');
      toggleBox(primero);
      if(tr().want.length!==1)throw new Error('No agrega al primer periodo');
      if($('#b-go').disabled||$('#b-none').disabled)throw new Error('Acciones deshabilitadas con selección');
      const caja=boxHtml(primero,0,0,100,50,1,planElegidas(),new Set(),null,1,new Set());
      if(caja.includes('plan-marca'))throw new Error('Insignia en modo simple');
      if($('#chosen').innerHTML.includes('plan-grupo-1'))throw new Error('Columna de segundo periodo');
      if($('#plan-resumen').innerHTML.includes('plan-2'))throw new Error('Resumen del segundo periodo');
      if(!$('#plan-anuncio').textContent.includes('agregada a '+planEtiqueta(0)))throw new Error('Sin anuncio de alta');
      if($('#plan-deshacer').hidden)throw new Error('No ofrece deshacer');
      $('#plan-deshacer').eventos.click();
      if(tr().want.length)throw new Error('Deshacer no restaura selección');
      toggleBox(primero);toggleBox(primero);
      if(!$('#plan-anuncio').textContent.includes('quitada de '+planEtiqueta(0)))throw new Error('Sin anuncio de baja');
      const guardado=store.get('t.'+S.car,{});
      if(JSON.stringify(guardado.wantPorPeriodo[futuro])!==JSON.stringify([primero,segundo])||guardado.extra!=='conservar'||guardado.wantPorPeriodo.siguiente[0]!==segundo)throw new Error('Se alteró el segundo periodo guardado');
      ALUMNO={...perfilDemo(),acreditadas:[],en_curso:[],reprobadas:[],reprobadas_periodo:[[primero,perName(planInicio()-1),1]],avance:{},cita:{},agenda:[]};
      ALUMNO.carga={min:0,media:45,max:80};
      for(const k in T)delete T[k];renderTray();
      if(cargaInfo(0).ret!==cur()[primero][1])throw new Error('Adeudo no retiene créditos');
      if(!$('#plan-resumen').innerHTML.includes('Elige en el mapa'))throw new Error('Créditos sin materias en bandeja');
      ALUMNO.reprobadas_periodo=[[primero,perName(planInicio()-4),1]];
      for(const k in T)delete T[k];renderTray();
      if(!tr().want.includes(primero)||!$('#chosen').innerHTML.includes('wchip'))throw new Error('Obligatoria no se muestra como materia');
      ALUMNO=null;store.set('t.'+S.car,{want:[]});for(const k in T)delete T[k];
      clearTimeout(PLAN_UNDO_TIMER);PLAN_UNDO=null;
    `,contexto,{filename:'un-periodo-'+unidad});
    vm.runInContext("PT='touch'",contexto);
    const claveToque=vm.runInContext('primero',contexto);
    const cajaToque={dataset:{box:claveToque},closest:s=>s==='[data-box]'?cajaToque:null};
    eventosDocumento.click.forEach(fn=>fn({target:cajaToque}));
    assert.equal(vm.runInContext('tr().want.length',contexto),1,'Un toque agrega directamente');
    eventosDocumento.click.forEach(fn=>fn({target:cajaToque}));
    assert.equal(vm.runInContext('tr().want.length',contexto),0,'Otro toque quita directamente');
    vm.runInContext("PT='mouse';planOlvidar()",contexto);
    await SATE.script('horarios.js');
    vm.runInContext('S.onlyWant=true;renderHFilters();renderOffer()',contexto);
    assert.equal(nodos.get('#f-want').checked,true);
    assert.equal(nodos.get('#f-want').disabled,false);
    assert.match(nodos.get('#offer').innerHTML,/Aún no eliges materias en el mapa\./);
    const pulsar=selector=>nodos.get('#offer').eventos.click({target:{closest:s=>s===selector?{}:null}});
    pulsar('[data-oferta-mapa]');assert.equal(SATE.destino,'mapa');
    pulsar('[data-oferta-toda]');assert.equal(vm.runInContext('S.onlyWant',contexto),false);
    assert.equal(nodos.get('#f-want').checked,false);
    assert.ok(!nodos.get('#offer').innerHTML.includes('data-oferta-toda'));
    console.log(unidad+': OK: un periodo, perfil heredado intacto, créditos elegidos, obligatorias, anuncio, deshacer y oferta vacía.');
    continue;
  }
  movil.matches=false;
  segmentos[1].focus();segmentos[1].eventos.click();
  assert.equal(nodos.get('#plan-supuesto').hidden,false,'supuesto visible en N+1');
  nodos.get('#plan-supuesto').eventos.click();
  assert.match(ayudas.at(-1).contenido,/supone acreditadas/,'supuesto usa modal existente');
  nodos.get('#map-ayuda').eventos.click();
  assert.equal(ayudas.at(-1).titulo,'Cómo leer el mapa','ayuda usa modal existente');
  assert.equal(segmentos[1].atributos['aria-pressed'],'true','C: segundo segmento seleccionado');
  assert.equal(document.activeElement,segmentos[1],'C: cambiar periodo conserva foco');
  assert.equal(nodos.get('#b-go').hidden,false,'C: acceso a horarios de N también desde N+1');
  segmentos[0].eventos.click();
  assert.equal(nodos.get('#b-go').hidden,false,'C: N conserva armado de horarios');
  vm.runInContext(`
    const clavePincel=Object.keys(cur()).find(k=>!isElec(k));
    const otraPincel=Object.keys(cur()).find(k=>k!==clavePincel&&!isElec(k));
    S.planPaso=0;toggleBox(clavePincel);
    if(planAsignado(clavePincel)!==0)throw new Error('Pincel: asignar N');
    const primera=boxHtml(clavePincel,0,0,100,50,1,planElegidas(),new Set(),null,1,new Set());
    if(!primera.includes('plan-1')||!primera.includes('>1</span>'))throw new Error('Pincel: marca 1');
    const guardadoPincel=JSON.stringify(store.get('t.'+S.car,{}));
    S.planPaso=1;renderTray();
    if(JSON.stringify(store.get('t.'+S.car,{}))!==guardadoPincel)throw new Error('Pincel: cambiar borra datos');
    if(!$('#chosen').innerHTML.includes('plan-grupo-0')||!$('#chosen').innerHTML.includes('plan-grupo-1'))throw new Error('Pincel: grupos simultáneos');
    if(!$('#map').innerHTML.includes('plan-1'))throw new Error('Pincel: cambiar oculta N');
    toggleBox(otraPincel);
    if(!$('#map').innerHTML.includes('plan-1')||!$('#map').innerHTML.includes('plan-2'))throw new Error('Pincel: ambos periodos visibles');
    toggleBox(clavePincel);
    if(planAsignado(clavePincel)!==1||tr().want.includes(clavePincel))throw new Error('Pincel: mover de N a N+1');
    const segunda=boxHtml(clavePincel,0,0,100,50,1,planElegidas(),new Set(),null,1,new Set());
    if(!segunda.includes('plan-2')||!segunda.includes('>2</span>'))throw new Error('Pincel: marca 2');
    S.planPaso=0;toggleBox(clavePincel);
    if(planAsignado(clavePincel)!==0||conPlan(()=>tr().want.includes(clavePincel),1))throw new Error('Pincel: mover de N+1 a N');
    toggleBox(clavePincel);
    if(planAsignado(clavePincel)!==null)throw new Error('Pincel: quitar en periodo activo');
    S.planPaso=1;toggleBox(otraPincel);S.planPaso=0;
    renderTray();
  `,contexto,{filename:'pincel-'+unidad});
  assert.match(nodos.get('#plan-activo').textContent,/Periodo activo:/);
  assert.match(nodos.get('#plan-leyenda').innerHTML,/plan-1[\s\S]*plan-2/);
  const claveTeclado=vm.runInContext('clavePincel',contexto);
  const cajaTeclado={dataset:{box:claveTeclado},closest:s=>s==='[data-box]'?cajaTeclado:null};
  let prevenido=0;
  for(const key of ['Enter',' ']){
    eventosDocumento.keydown.forEach(fn=>fn({key,target:cajaTeclado,preventDefault(){prevenido++}}));
    assert.equal(document.activeElement,nodos.get(`[data-box="${claveTeclado}"]`),'foco conservado tras repintar por teclado');
  }
  assert.equal(prevenido,2,'Enter y espacio activan sin desplazar');
  assert.equal(vm.runInContext('planAsignado(clavePincel)',contexto),null,'teclado asigna y quita');
  nodos.get('#plan-simular').eventos.click();
  assert.equal(SATE.destino,'trayectoria','B: enlace directo a Desempeño');
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
    renderTray();
    const resumenCarga=$('#plan-resumen').innerHTML;
    if(!resumenCarga.includes(' de '+fmtCr(cargaInfo(0).tope)+' créditos'))throw new Error('A: resumen no incluye tope vigente: '+resumenCarga);
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
  assert.equal(nodos.get('#mapcut').hidden,false,'A: perfil DEMO muestra minimapa');
  const miniPresente=vm.runInContext('conPlan(()=>conSim(false,()=>minimapaCurricular()),0)',contexto);
  assert.match(miniPresente.svg,/<circle data-estado=/,'§3: minimapa compartido con SAES en '+unidad);
  assert.ok(Object.values(miniPresente.cnt).reduce((a,b)=>a+b,0)>0,'§3: puntos contados en '+unidad);
  assert.match(miniPresente.leyenda,/desfasadas?/,'§3: leyenda de cinco estados en '+unidad);
  assert.match(nodos.get('#plan-resumen').innerHTML,/plan-1[\s\S]*plan-2/,'modo anual conserva ambos resúmenes');
  assert.deepEqual(cargados,['mapa.js'],'Mapa con/sin perfil no descarga Horarios ni Desempeño');
  await vm.runInContext('SAES.open()',contexto);
  await vm.runInContext('SAES.open()',contexto);
  assert.equal(cargados.filter(n=>n==='saes-dialogo.js').length,1);
  await SATE.script('horarios.js'); SATE.modulos.horarios.montar(); SATE.modulos.horarios.mostrar();
  assert.ok(!cargados.includes('exportacion.js'));
  await document.querySelector('#b-export').eventos.click();
  await document.querySelector('#b-export').eventos.click();
  assert.equal(cargados.filter(n=>n==='exportacion.js').length,1);
  vm.runInContext('clearTimeout(PLAN_UNDO_TIMER)',contexto);
  console.log(unidad+': OK: disposición, asignar, mover en ambos sentidos, quitar, marcas 1/2, selecciones simultáneas, cambio sin escritura, seriación, persistencia, horizonte, foco y cargas diferidas.');
}
