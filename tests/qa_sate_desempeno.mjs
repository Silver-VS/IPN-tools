// HTML/JS generado y motor real en Node; las solicitudes de bibliotecas son dobles, sin red.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const leer=f=>readFileSync(f,'utf8'), html=leer('web/dist/sate/index.html');
const config=JSON.parse(html.match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const patron=/@observablehq|d3@|LIB_PLOT|cargarPlot/;
for(const f of ['index.html','nucleo.js','inicio.js','mapa.js','situacion.js','horarios.js','componentes.js','rutas.js'])
  assert.doesNotMatch(leer('web/dist/sate/'+f),patron,f+' no precarga dependencias de gráficas');
const mapa=html.split('<section hidden id="v-tray"')[1].split('<section hidden id="v-hor"')[0];
assert.doesNotMatch(mapa,/id="(?:kstats|est-sim|stats-btn)"/);
assert.match(html,/<details[^>]+id="desempeno-simulacion"[^>]*>/);
assert.doesNotMatch(html,/<details[^>]+id="desempeno-simulacion"[^>]*\bopen\b/,'Simulación plegada');
const almacen=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}};
for(const unidad of ['upiita','escom','upibi']){
  assert.ok(config.unidades[unidad].pestanas.includes('trayectoria'));
  const nodos=new Map(),solicitudes=[],cuadros=[];let c,api,fallar=false,movil=true,trazados=0;
  const texto=(k,v={})=>(config.textos[k]||k).replace(/\{(\w+),\s*plural,\s*((?:[^{}]*\{[^{}]*\})+)\s*\}/g,(m,k,c)=>{
    const n=Number(v[k]),op={};c.replace(/(=?\w+)\s*\{([^{}]*)\}/g,(_,k,t)=>{op[k]=t});
    return (op['='+n]??op[new Intl.PluralRules('es-MX').select(n)]??op.other??'').replace(/#/g,String(n));
  }).replace(/\{(\w+)\}/g,(_,k)=>v[k]??'{'+k+'}');
  function nodo(id='') {return {id,hidden:true,innerHTML:'',textContent:'',value:'',options:[],dataset:{},clientWidth:375,offsetWidth:375,offsetHeight:800,
    style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains(){return false}},eventos:{},
    addEventListener(k,fn){(this.eventos[k]??=[]).push(fn)},setAttribute(){},removeAttribute(){},getAttribute(){return null},appendChild(){},insertAdjacentHTML(){},
    querySelector:s=>s==='svg'?null:nodo(),querySelectorAll:s=>s==='.charts'?[nodo(),nodo()]:[],closest:()=>null,contains:()=>false,
    getBoundingClientRect:()=>({top:0,left:0,bottom:800,width:375,height:800}),replaceChildren(){},remove(){},matches:()=>false,focus(){document.activeElement=this}};}
  const document={readyState:'loading',addEventListener(){},querySelector(s){if(!nodos.has(s))nodos.set(s,nodo(s));return nodos.get(s)},
    getElementById(id){return this.querySelector('#'+id)},querySelectorAll:()=>[],createElement:()=>nodo(),body:nodo(),documentElement:nodo(),
    head:{appendChild(s){solicitudes.push(s);queueMicrotask(()=>{
      if(fallar){s.onerror();return}
      if(s.src.includes('d3@'))c.d3={groups(rows,fn){const m=new Map();for(const r of rows){const k=fn(r);if(!m.has(k))m.set(k,[]);m.get(k).push(r)}return [...m]},mean:(rs,fn)=>rs.reduce((s,r)=>s+fn(r),0)/rs.length};
      if(s.src.includes('@observablehq'))c.Plot={plot:()=>{trazados++;return nodo()},rectX(){},barX(){},text(){},ruleX(){}};
      s.onload();
    })}}};
  const SATE={texto,actual:{pestana:'mapa'},modulos:{},pestana(id,m){this.modulos[id]=m},error:e=>{throw e},nucleoListo:async a=>{api=a},
    repintar(){api.renderTop();return this.modulos[this.actual.pestana]?.mostrar()},ir(){},identidadSaes(){}};
  c=vm.createContext({console,document,SATE,SateUI:{cerrarModal(){}},SATE_DATA:{...JSON.parse(leer(`web/dist/sate/datos/${unidad}/nucleo.json`)),periodos:{actual:[],proximo:[]},asig:[],prof:[]},SATE_UNIDAD:unidad,
    URL,URLSearchParams,Blob,performance,localStorage:almacen(),sessionStorage:almacen(),location:{hash:'#/'+unidad+'/mapa',search:'',pathname:'/sate/index.html'},history:{replaceState(){}},
    navigator:{userAgent:'Node',maxTouchPoints:0},matchMedia:q=>({get matches(){return q.includes('720px')&&movil},addEventListener(){}}),addEventListener(){},setTimeout,clearTimeout,
    requestAnimationFrame:fn=>cuadros.push(fn),getComputedStyle:()=>({getPropertyValue:()=>''}),MutationObserver:class{observe(){}},CSS:{escape:s=>s},innerWidth:375,innerHeight:800,
    fetch(){throw new Error('Red prohibida')}});
  vm.runInContext('window=globalThis',c);
  vm.runInContext(leer('web/dist/sate/nucleo.js'),c);
  for(const perfil of ['ALUMNO=null','ALUMNO=perfilDemo()']){
    vm.runInContext(perfil+';for(const k in T)delete T[k]',c);
    for(const pesta of config.unidades[unidad].pestanas.filter(p=>p!=='trayectoria')){
      SATE.actual.pestana=pesta;api.renderTop();await vm.runInContext('renderStats()',c);
      assert.equal(solicitudes.length,0,pesta+' sin descargas de gráficas');
    }
  }
  vm.runInContext(leer('web/dist/sate/desempeno.js'),c);
  const mod=SATE.modulos.trayectoria;mod.montar();
  SATE.actual.pestana='trayectoria';vm.runInContext('ALUMNO=null;for(const k in T)delete T[k]',c);
  await mod.mostrar();assert.equal(solicitudes.length,0,'Sin perfil no requiere Plot');
  SATE.simAbrir=true;await mod.mostrar();
  assert.equal(document.activeElement,document.querySelector('#desempeno-lector'),'B: sin SAES el acceso directo enfoca al Lector');
  assert.equal(document.querySelector('#desempeno-vacio').hidden,false);
  assert.match(document.querySelector('#desempeno-vacio-texto').textContent,/SAES/);
  vm.runInContext('ALUMNO=perfilDemo();for(const k in T)delete T[k]',c);
  assert.equal(texto('sate.desempeno.materias',{n:1}),'1 materia');
  assert.equal(texto('sate.desempeno.materias',{n:2}),'2 materias');
  assert.equal(texto('sate.planeacion.cuenta',{n:1,creditos:6}),'1 materia · 6 créditos');
  assert.equal(texto('sate.planeacion.cuenta',{n:2,creditos:12}),'2 materias · 12 créditos');
  const vaciarCuadros=()=>{while(cuadros.length)cuadros.shift()()};
  // Salir antes del cuadro diferido impide incluso comenzar la descarga.
  SATE.simAbrir=true;
  let pendiente=mod.mostrar();
  assert.equal(document.querySelector('#desempeno-simulacion').open,true,'B: acceso directo abre simulación');
  assert.equal(document.querySelector('#desempeno-simulacion').hidden,false,'B: simulación visible antes de mover foco');
  assert.equal(document.activeElement,document.querySelector('#desempeno-sim-titulo'),'B: foco en simulación');
  mod.ocultar();SATE.actual.pestana='mapa';vaciarCuadros();await pendiente;
  assert.equal(solicitudes.length,0);
  SATE.actual.pestana='trayectoria';pendiente=mod.mostrar();vaciarCuadros();await pendiente;
  assert.equal(solicitudes.length,0,'F: secciones cerradas no cargan Plot');
  for(const id of ['kardex','escenario','areas','observaciones'])assert.equal(document.querySelector('#trayectoria-'+id).open,false,'F: teléfono cerrado '+id);
  const areas=document.querySelector('#trayectoria-areas');
  areas.open=true;pendiente=areas.eventos.toggle.at(-1)();
  areas.open=false;areas.eventos.toggle.at(-1)();vaciarCuadros();await pendiente;
  assert.equal(solicitudes.length,0,'F: cerrar antes de medir cancela descarga');
  areas.open=true;pendiente=areas.eventos.toggle.at(-1)();vaciarCuadros();await pendiente;
  assert.equal(solicitudes.length,2);assert.match(solicitudes[0].src,/d3@/);assert.match(solicitudes[1].src,/@observablehq/);
  for(const s of solicitudes){assert.match(s.integrity,/^sha384-/);assert.equal(s.crossOrigin,'anonymous')}
  assert.equal(trazados,1,'F: gráfica solo al abrir áreas');
  areas.open=false;areas.eventos.toggle.at(-1)();
  pendiente=mod.mostrar();vaciarCuadros();await pendiente;
  assert.equal(areas.open,false,'F: cierre recordado');assert.equal(trazados,1,'F: no redibujar sección cerrada');
  movil=false;pendiente=mod.mostrar();vaciarCuadros();await pendiente;
  assert.equal(document.querySelector('#trayectoria-kardex').open,true,'F: escritorio kárdex abierto por omisión');
  assert.equal(document.querySelector('#trayectoria-escenario').open,true,'F: escritorio escenario abierto por omisión');
  const kardex=document.querySelector('#trayectoria-kardex');kardex.open=false;kardex.eventos.toggle.at(-1)();
  pendiente=mod.mostrar();vaciarCuadros();await pendiente;
  assert.equal(kardex.open,false,'F: preferencia explícita prevalece');
  assert.match(document.querySelector('#kstats').innerHTML,/Tu camino|kpis/);
  const orden=document.querySelector('#kstats').innerHTML;
  const bloques=['class="kpis"','id="ch-camino"','id="ch-kx"','id="trayectoria-escenario-titulo"','id="meta-periodos"','id="prom-meta"','id="trayectoria-sim-slot"','id="ch-cat"'];
  assert.ok(bloques.every((x,i)=>orden.includes(x)&&(!i||orden.indexOf(bloques[i-1])<orden.indexOf(x))),'B1: orden del desempeño y metas agrupadas');
  assert.match(document.querySelector('#est-sim').innerHTML,/Simular fin de semestre/);
  pendiente=mod.mostrar();vaciarCuadros();await pendiente;assert.equal(solicitudes.length,2,'Carga única');
  // El chip es global y Quitar desactiva todas las comparaciones sin alterar el SAES.
  const real=vm.runInContext('JSON.stringify(ALUMNO)',c);
  vm.runInContext("SIM.on=true;SIMBLK.mapa=true;SIM.res[tr().enCurso[0]]={ok:false}",c);
  vm.runInContext('renderSimulacion()',c);assert.doesNotMatch(document.querySelector('#est-sim').innerHTML,/\$\{/);
  for(const pesta of config.unidades[unidad].pestanas){SATE.actual.pestana=pesta;api.renderTop();assert.equal(document.querySelector('#sate-simulacion').hidden,false)}
  SATE.actual.pestana='mapa';document.querySelector('#sate-simulacion-quitar').eventos.click[0]();
  assert.equal(document.querySelector('#sate-simulacion').hidden,true);assert.equal(vm.runInContext('SIM.on',c),false);
  assert.equal(vm.runInContext('Object.keys(SIMBLK).length',c),0);assert.equal(vm.runInContext('JSON.stringify(ALUMNO)',c),real);
  // Error de red simulado: mensaje legible y posibilidad de reintentar.
  vm.runInContext('window.Plot=null;PLOT_P=null',c);fallar=true;
  await assert.rejects(vm.runInContext('cargarPlot()',c),/No se pudo cargar/);
  fallar=false;await vm.runInContext('cargarPlot()',c);
  assert.equal(solicitudes.length,5);
  console.log(unidad+': módulo independiente, Plot/D3 diferidos y únicos, cancelación, error/reintento, DEMO, plurales y chip global correctos.');
}
