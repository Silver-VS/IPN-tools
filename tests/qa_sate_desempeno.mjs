// HTML/JS generado y motor real en Node; las solicitudes de bibliotecas son dobles, sin red.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
  const leer=f=>readFileSync(f,'utf8'), html=leer('web/dist/sate/index.html');
const config=JSON.parse(html.match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const cssKx=leer('web/sate/componentes.css');
assert.match(cssKx,/\.kx-periodos\{[^}]*overflow-x:auto;[^}]*max-width:100%/,'R8: desplazamiento contenido en la tira');
assert.match(cssKx,/@media\(max-width:639px\)\{[\s\S]*?\.kx-tabla[^}]*display:block/,'R8: a 375 y 320 la tabla usa tarjetas');
assert.match(cssKx,/\.kx-bloque[^}]*min-width:0;max-width:100%/,'R8: el bloque puede encogerse sin expandir la página');
assert.equal(config.textos['sate.trayectoria.y_si'],'Escenarios de avance');
assert.equal(config.textos['sate.trayectoria.y_si_resumen'],'Proyecta tu trayectoria con distintas cargas y resultados');
assert.match(html,/\.charts \.trayectoria-afinidades figcaption\{[^}]*min-height:0;[^}]*flex-wrap:wrap/,'Leyenda compacta y adaptable a teléfono');
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
  const nodos=new Map(),solicitudes=[],cuadros=[],graficas=[];let c,api,fallar=false,movil=true,oscuro=false,trazados=0;
  const texto=(k,v={})=>(config.textos[k]||k).replace(/\{(\w+),\s*plural,\s*((?:[^{}]*\{[^{}]*\})+)\s*\}/g,(m,k,c)=>{
    const n=Number(v[k]),op={};c.replace(/(=?\w+)\s*\{([^{}]*)\}/g,(_,k,t)=>{op[k]=t});
    return (op['='+n]??op[new Intl.PluralRules('es-MX').select(n)]??op.other??'').replace(/#/g,String(n));
  }).replace(/\{(\w+)\}/g,(_,k)=>v[k]??'{'+k+'}');
  function nodo(id='') {return {id,hidden:true,innerHTML:'',textContent:'',value:'',options:[],dataset:{},parentElement:{hidden:false,parentElement:{hidden:false}},clientWidth:375,offsetWidth:375,offsetHeight:800,
    style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains(){return false}},eventos:{},
    addEventListener(k,fn){(this.eventos[k]??=[]).push(fn)},setAttribute(){},removeAttribute(){},getAttribute(){return null},appendChild(){},insertAdjacentHTML(){},
    querySelector:s=>s==='svg'?null:nodo(),querySelectorAll:s=>s==='.charts'?[nodo(),nodo()]:[],closest:()=>null,contains:()=>false,
    getBoundingClientRect:()=>({top:0,left:0,bottom:800,width:375,height:800}),replaceChildren(){},remove(){},matches:()=>false,showModal(){this.open=true},close(){this.open=false},focus(){document.activeElement=this}};}
  const document={readyState:'loading',addEventListener(){},querySelector(s){if(!nodos.has(s))nodos.set(s,nodo(s));return nodos.get(s)},
    getElementById(id){return this.querySelector('#'+id)},querySelectorAll:()=>[],createElement:()=>nodo(),body:nodo(),documentElement:nodo(),
    head:{appendChild(s){solicitudes.push(s);queueMicrotask(()=>{
      if(fallar){s.onerror();return}
      if(s.src.includes('d3-7.9.0'))c.d3={groups(rows,fn){const m=new Map();for(const r of rows){const k=fn(r);if(!m.has(k))m.set(k,[]);m.get(k).push(r)}return [...m]},mean:(rs,fn)=>rs.reduce((s,r)=>s+fn(r),0)/rs.length};
      if(s.src.includes('plot-0.6.17'))c.Plot={plot:op=>{trazados++;graficas.push(op);return nodo()},ruleY:(datos,op)=>({tipo:'recta',datos,op}),dot:(datos,op)=>({tipo:'puntos',datos,op}),ruleX:(datos,op)=>({tipo:'media',datos,op})};
      s.onload();
    })}}};
  const SATE={texto,actual:{pestana:'mapa'},modulos:{},pestana(id,m){this.modulos[id]=m},error:e=>{throw e},nucleoListo:async a=>{api=a},
    repintar(){api.renderTop();return this.modulos[this.actual.pestana]?.mostrar()},ir(){},identidadSaes(){}};
  c=vm.createContext({console,document,SATE,SateUI:{cerrarModal(){}},SATE_DATA:{...JSON.parse(leer(`web/dist/sate/datos/${unidad}/nucleo.json`)),periodos:{actual:[],proximo:[]},asig:[],prof:[]},SATE_UNIDAD:unidad,
    URL,URLSearchParams,Blob,performance,localStorage:almacen(),sessionStorage:almacen(),location:{hash:'#/'+unidad+'/mapa',search:'',pathname:'/sate/index.html'},history:{replaceState(){}},
    navigator:{userAgent:'Node',maxTouchPoints:0},matchMedia:q=>({get matches(){return q.includes('639px')&&movil},addEventListener(){}}),addEventListener(){},setTimeout,clearTimeout,
    requestAnimationFrame:fn=>cuadros.push(fn),getComputedStyle:()=>({getPropertyValue:n=>((oscuro?
      {'--ipn-acento':'#eaa2bd','--ipn-tenue':'#b1b4be','--ipn-linea':'#393c45','--ipn-texto':'#e6e7ec'}:
      {'--ipn-acento':'#721e45','--ipn-tenue':'#667085','--ipn-linea':'#dddddd','--ipn-texto':'#222222'})[n]||'')}),MutationObserver:class{observe(){}},CSS:{escape:s=>s},innerWidth:375,innerHeight:800,
    fetch(){throw new Error('Red prohibida')}});
  vm.runInContext('window=globalThis',c);
  vm.runInContext(leer('web/dist/sate/componentes.js'),c);
  c.SateUI.cerrarModal=()=>{};
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
  assert.equal(document.querySelector('#trayectoria-kardex').open,true,'R8: tira de periodos visible también en teléfono');
  for(const id of ['escenario','areas','observaciones'])assert.equal(document.querySelector('#trayectoria-'+id).open,false,'F: teléfono cerrado '+id);
  const areas=document.querySelector('#trayectoria-areas');
  areas.open=true;pendiente=areas.eventos.toggle.at(-1)();
  areas.open=false;areas.eventos.toggle.at(-1)();vaciarCuadros();await pendiente;
  assert.equal(solicitudes.length,0,'F: cerrar antes de medir cancela descarga');
  areas.open=true;pendiente=areas.eventos.toggle.at(-1)();vaciarCuadros();await pendiente;
  assert.equal(solicitudes.length,2);assert.equal(solicitudes[0].src,'../assets/vendor/d3-7.9.0.min.js');assert.equal(solicitudes[1].src,'../assets/vendor/plot-0.6.17.min.js');
  for(const s of solicitudes){assert.match(s.integrity,/^sha384-/);assert.equal(s.crossOrigin,'anonymous')}
  assert.equal(trazados,1,'F: gráfica solo al abrir áreas');
  assert.deepEqual(Array.from(graficas[0].x.domain),[6,10],'K: escala absoluta fija');
  assert.equal(graficas[0].height,Math.max(190,graficas[0].y.domain.length*32+70),'R4: alto suficiente para etiquetas y filas de áreas');
  assert.equal(graficas[0].marginTop,30,'R4: margen superior para la primera etiqueta');
  assert.equal(graficas[0].marginBottom,32,'R4: margen inferior para el eje');
  assert.equal(graficas[0].y.padding,0);
  assert.match(document.querySelector('#trayectoria-areas-datos').innerHTML,/<ol.*Promedio.*cr.*materias/,'K: ranking accesible con los mismos datos');
  areas.open=false;areas.eventos.toggle.at(-1)();
  pendiente=mod.mostrar();vaciarCuadros();await pendiente;
  assert.match(vm.runInContext('kardexCurso()',c),/^<ul class="kx-curso-lista">/,'R9: si grupo y parciales faltan, el curso se muestra como lista compacta');
  assert.match(vm.runInContext('kardexCurso()',c),/<li><span class="kx-curso-materia"><b>[^<]+<\/b> [^<]+<\/span><span>/,'R10: clave y nombre agrupados antes de los créditos');
  assert.match(document.querySelector('#kstats').innerHTML,/<div class="kpi"><span>[^<]+<\/span><div class="kpi-v"><b id="kx-prom-oficial">/,'R10: promedio con el componente común de indicadores');
  assert.match(document.querySelector('#kstats').innerHTML,/<div class="kx-chips"><button[^>]+id="kx-todos"[^>]+class="chip"/,'R10: todos los periodos comparte fila y componente con los filtros');
  vm.runInContext("ALUMNO.en_curso=[Object.keys(cur())[0]];ALUMNO.horario_inscrito=[['7FV1',ALUMNO.en_curso[0],cur()[ALUMNO.en_curso[0]][0],[],[]]];ALUMNO.horario_inscrito[0].p1=8",c);
  const cursoConDatos=vm.runInContext('kardexCurso()',c);
  assert.match(cursoConDatos,/<th scope="col">Grupo<\/th>/,'R9: aparece una columna con datos');
  assert.match(cursoConDatos,/<th scope="col">P1<\/th>/,'R9: aparecen parciales cuando existen');
  assert.doesNotMatch(cursoConDatos,/<th scope="col">P2<\/th>/,'R9: se ocultan columnas vacías');
  assert.match(cssKx,/\.kx-promedios\{[^}]*auto-fit/,'R9: las tarjetas visibles reparten el ancho');
  assert.match(cssKx,/\.kx-promedios\{[^}]*scroll-margin-top/,'R9: el ancla respeta el encabezado fijo');
  assert.equal(areas.open,false,'F: cierre recordado');assert.equal(trazados,1,'F: no redibujar sección cerrada');
  movil=false;pendiente=mod.mostrar();vaciarCuadros();await pendiente;
  assert.equal(document.querySelector('#trayectoria-kardex').open,true,'F: escritorio kárdex abierto por omisión');
  assert.equal(document.querySelector('#trayectoria-escenario').open,true,'F: escritorio escenario abierto por omisión');
  const kardex=document.querySelector('#trayectoria-kardex');kardex.open=false;kardex.eventos.toggle.at(-1)();
  pendiente=mod.mostrar();vaciarCuadros();await pendiente;
  assert.equal(kardex.open,false,'F: preferencia explícita prevalece');
  assert.match(document.querySelector('#kstats').innerHTML,/Tu camino|kpis/);
  const orden=document.querySelector('#kstats').innerHTML;
  const bloques=['class="kpis"','id="kx-curso-titulo"','id="trayectoria-kardex"','id="kx-lista"','id="ch-camino"','id="trayectoria-sim-slot"','id="trayectoria-escenario-titulo"','id="prom-meta"','id="meta-periodos"','id="ch-cat"'];
  assert.ok(bloques.every((x,i)=>orden.includes(x)&&(!i||orden.indexOf(bloques[i-1])<orden.indexOf(x))),'B1: orden del desempeño y metas agrupadas');
  assert.ok(orden.indexOf('id="trayectoria-kardex"')<orden.indexOf('id="ch-camino"')&&orden.indexOf('id="ch-camino"')<orden.indexOf('id="trayectoria-sim-slot"'),'B1: kárdex antes de trayectoria y escenarios');
  assert.match(orden,/<details class="trayectoria-areas-detalle"><summary>Ver detalle<\/summary>/,'REV1: datos de áreas plegados por omisión');
  assert.match(orden,/Escala 6–10 · línea: tu promedio sin reprobadas \([^)]*\) · acento: tus 2 mejores áreas/);
  assert.match(document.querySelector('#est-sim').innerHTML,/Simular fin de semestre/);
  vm.runInContext("ALUMNO.kardex_reprobadas=[[Object.keys(cur())[0],5,'23/2','ORD']];ALUMNO.acreditadas=ALUMNO.acreditadas.filter(a=>a[0]!==Object.keys(cur())[0]);ALUMNO.en_curso=[Object.keys(cur())[1]]",c);
  pendiente=mod.mostrar();vaciarCuadros();await pendiente;
  assert.match(document.querySelector('#kx-lista').innerHTML,/Adeudo/,'Perfil ficticio adeuda resalta junto a la materia');
  const filtrar=dataset=>document.querySelector('#kstats').eventos.click.forEach(fn=>fn({target:{closest:()=>({dataset})}}));
  filtrar({kxEstado:'reprobadas'});
  assert.equal(vm.runInContext('KX_FILTRO[S.car]?.estado',c),'reprobadas','El control actualiza el filtro');
  assert.match(document.querySelector('#kx-lista').innerHTML,/Adeudo/,'El filtro de reprobadas muestra adeudos');
  assert.equal((document.querySelector('#kx-lista').innerHTML.match(/data-label="Calificación"/g)||[]).length,1,'El filtro excluye acreditadas');
  assert.equal(vm.runInContext('kardexFiltro().estado',c),'reprobadas','El filtro queda recordado por carrera');
  filtrar({kxEstado:'acreditadas'});
  assert.doesNotMatch(document.querySelector('#kx-lista').innerHTML,/Adeudo/,'El filtro de acreditadas oculta adeudos');
  if(unidad==='upiita'){
    const anterior=vm.runInContext('ALUMNO',c);
    for(const nombre of ['desfase-dictamen-bionica','regular-mecatronica']){
      c.perfilKx=JSON.parse(leer('data/perfiles-prueba/'+nombre+'.json'));
      vm.runInContext('ALUMNO=perfilKx;S.car=ALUMNO.carrera;KX_FILTRO[S.car]={periodo:"*",estado:"*"};renderKardexLista()',c);
      const n=vm.runInContext('filasKardex().length',c);
      assert.equal(document.querySelector('#kx-cuenta').textContent,`Mostrando ${n} de ${n}`);
      assert.match(document.querySelector('#kx-periodos').innerHTML,/kx-fichas/);
      const periodo=vm.runInContext('filasKardex()[0].periodo',c);
      filtrar({kxPeriodo:periodo});
      assert.equal(vm.runInContext('kardexFiltro().periodo',c),periodo);
      const np=vm.runInContext('filasKardex().filter(r=>r.periodo===kardexFiltro().periodo).length',c);
      assert.equal(document.querySelector('#kx-cuenta').textContent,`Mostrando ${np} de ${n}`);
      filtrar({kxPeriodo:'*'});
      for(const estado of ['reprobadas','multi','eqv','*']){
        filtrar({kxEstado:estado});
        assert.match(document.querySelector('#kx-filtros').innerHTML,new RegExp(`data-kx-estado="${estado.replace('*','\\*')}" aria-pressed="true"`));
        assert.doesNotMatch(document.querySelector('#kx-lista').innerHTML,/undefined|NaN/);
        const esperado=vm.runInContext(`filasKardex().filter(r=>${estado==='reprobadas'?'!r.acreditada':estado==='eqv'?'/^(EQV|REV|DIC)$/.test(r.codigo)':estado==='multi'?'Math.max(filasKardex().filter(a=>a.clave===r.clave).length,...(ALUMNO.reprobadas_periodo||[]).filter(a=>a[0]===r.clave).map(a=>+a[2]||1))>=2||/^(EXT|ETS|REC)$/.test(r.codigo)':'true'}).length`,c);
        assert.equal(document.querySelector('#kx-cuenta').textContent,`Mostrando ${esperado} de ${n}`,'R8: el contador refleja cada chip');
      }
      if(nombre.startsWith('desfase'))assert.match(document.querySelector('#kx-lista').innerHTML,/^<tr class="kx-grupo"><th colspan="6">Adeudos activos/);
      assert.doesNotMatch(vm.runInContext('kardexCurso()',c),/undefined|NaN/);
      assert.equal(document.querySelector('#kx-prom-oficial').textContent,(+c.perfilKx.promedio).toFixed(2),'R8: promedio SAES conservado, incluidas reprobadas');
    }
    c.perfilKx=anterior;vm.runInContext('ALUMNO=perfilKx;S.car=ALUMNO.carrera;KX_FILTRO[S.car]={periodo:"*",estado:"*"}',c);
  }
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
  // K: un 10 aislado no desplaza a áreas de varias materias; créditos incompletos no son cero.
  const motor=vm.runInContext('statsDatos',c);
  const datos=motor();
  SATE.actual.pestana='trayectoria';
  c.datosAreas={...datos,media:9.5,rows:[
    {cat:'Aislada',cal:10,cr:6},{cat:'Control',cal:9.6,cr:6},{cat:'Control',cal:9.6,cr:7.5},
    {cat:'Electrónica',cal:9.4,cr:6},{cat:'Electrónica',cal:9.4,cr:null},
    {cat:'Ciencias básicas con nombre largo',cal:8,cr:6},{cat:'Ciencias básicas con nombre largo',cal:8,cr:6}]};
  vm.runInContext('statsDatos=()=>datosAreas;store.set("trayectoria.seccion.areas",false)',c);
  pendiente=mod.mostrar();vaciarCuadros();await pendiente;
  const antes=trazados;
  assert.equal(areas.open,false);
  assert.equal(document.querySelector('#trayectoria-areas-lectura').textContent,'Tus mejores áreas: Control (9.6) y Electrónica (9.4).');
  areas.open=true;pendiente=areas.eventos.toggle.at(-1)();vaciarCuadros();await pendiente;
  assert.equal(trazados,antes+1,'K: ranking y puntos se dibujan al abrir');
  const figura=graficas.at(-1),puntos=figura.marks.find(m=>m.tipo==='puntos');
  assert.deepEqual(Array.from(figura.x.domain),[6,10]);
  assert.equal(figura.marks.find(m=>m.tipo==='media').datos[0],9.5);
  assert.equal(figura.width,375);assert.equal(figura.marginLeft,118);
  assert.ok(figura.y.tickFormat('Ciencias básicas con nombre largo').length<=18);
  assert.equal(puntos.op.x,'media');assert.equal(puntos.datos[0].cat,'Aislada');
  for(const d of puntos.datos){
    assert.equal(puntos.op.fill(d),['Control','Electrónica'].includes(d.cat)?'#721e45':'#667085');
    assert.equal(puntos.op.fillOpacity(d),d.n===1?.6:1);
  }
  const ranking=document.querySelector('#trayectoria-areas-datos').innerHTML;
  assert.match(ranking,/Aislada \(1 materia\)/);assert.match(ranking,/Promedio 9\.60 · 13\.5 cr · 2 materias/);
  assert.match(ranking,/créditos por confirmar/);assert.match(ranking,/Ciencias básicas con nombre largo/);
  assert.doesNotMatch(ranking,/Por debajo|Por arriba|naranja/);
  oscuro=true;document.querySelector('#ch-cat').clientWidth=260;
  pendiente=mod.mostrar();vaciarCuadros();await pendiente;
  const noche=graficas.at(-1),puntosNoche=noche.marks.find(m=>m.tipo==='puntos');
  assert.equal(noche.width,260,'K: el dibujo respeta el ancho interior en teléfono');
  assert.equal(noche.style.color,'#e6e7ec');
  for(const d of puntosNoche.datos)assert.equal(puntosNoche.op.fill(d),['Control','Electrónica'].includes(d.cat)?'#eaa2bd':'#b1b4be');
  c.datosAreas={...datos,media:10,rows:[{cat:'Única',cal:10,cr:6}]};
  pendiente=mod.mostrar();vaciarCuadros();await pendiente;
  assert.match(document.querySelector('#trayectoria-areas-lectura').textContent,/Con más materias/);
  assert.equal(document.querySelector('#trayectoria-areas-resumen').textContent,'');
  c.datosAreas={...datos,media:null,rows:[]};
  pendiente=mod.mostrar();vaciarCuadros();await pendiente;
  assert.match(document.querySelector('#trayectoria-areas-lectura').textContent,/materias acreditadas/);
  assert.equal(document.querySelector('#trayectoria-areas-datos').innerHTML,'');
  c.datosAreas={...datos,media:9,rows:[{cat:'Control',cal:9,cr:6},{cat:'Control',cal:9,cr:6}]};
  pendiente=mod.mostrar();vaciarCuadros();await pendiente;
  assert.equal(document.querySelector('#trayectoria-areas-lectura').textContent,'Tu mejor área: Control (9.0).');
  c.statsDatos=motor;
  console.log(unidad+': módulo independiente, Plot/D3 diferidos, cancelación, error/reintento, DEMO, plurales, chip global y áreas 6–10, ranking, muestra mínima, créditos, teléfono y temas correctos.');
}

assert.match(leer("web/sate/desempeno.js"), /class="kpis kx-promedios"/);
assert.doesNotMatch(cssKx, /\.kx-promedios>div:first-child/);
assert.match(cssKx, /\.kx-curso-materia\{[^}]*text-align:left/);
assert.match(leer("web/sate/desempeno.js"), /class="chip kx-periodo"/);
