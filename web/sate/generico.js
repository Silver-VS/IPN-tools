/* Sin plan cargado: conservar el SAES como fuente, sin completar datos académicos por inferencia. */
window.IPNT_UNIDAD = window.SATE_UNIDAD;
/*__CUENTA_JS__*/
/*__SAES_JS__*/
(function () {
  const unidad = SATE_UNIDAD, $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const numero = v => v != null && String(v).trim() !== '' && Number.isFinite(+v) && +v >= 0 ? +v : null;
  const dato = v => numero(v) == null ? 'Sin dato del SAES' : esc(numero(v));
  function datos(a) {
    a ||= {};
    const materias = new Map(), altas = new Set((a.acreditadas || []).filter(r => numero(r[1]) >= 6 && numero(r[1]) <= 10).map(r => r[0]));
    const curso = new Set([...(a.en_curso || []), ...(a.horario_inscrito || []).map(r => r[1])]);
    const reprobadas = new Set((a.reprobadas_periodo || []).map(r => r[0]));
    const normal = s => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/\s+/g,' ').trim();
    const reproNombres = new Set((a.reprobadas || []).map(r => normal(r[0])));
    const desfasadas = new Set((a.desfasadas_saes || []).map(r => r[0]));
    const agregar = (k, nombre, semestre, periodo) => {
      if (!k) return;
      const m = materias.get(k) || {clave:k,nombre:k,semestre:null,periodo:null};
      if (nombre) m.nombre = nombre;
      if (numero(semestre) > 0) m.semestre = numero(semestre);
      if (periodo) m.periodo = periodo;
      materias.set(k,m);
    };
    Object.entries(a.materias || {}).forEach(([k,m]) => {if(Array.isArray(m))agregar(k,m[0],m[1])});
    for (const tipo of ['acreditadas','kardex_reprobadas']) for (const r of a[tipo] || []) agregar(r[0],null,null,r[2]);
    for (const tipo of ['no_cursadas','reprobadas_periodo','desfasadas_saes']) for (const r of a[tipo] || []) agregar(r[0],null,r[3],null);
    for (const k of curso) agregar(k,null,null,null);
    for (const r of a.horario_inscrito || []) agregar(r[1],r[2],null,null);
    const porSemestre = [...materias.values()].some(m => m.semestre != null), grupos = new Map();
    for (const m of materias.values()) {
      if (reproNombres.has(normal(m.nombre)) || reproNombres.has(normal(m.clave))) reprobadas.add(m.clave);
      m.estado = altas.has(m.clave) ? 'Acreditada' : desfasadas.has(m.clave) ? 'Desfasada según el SAES' : curso.has(m.clave) ? 'En curso' : reprobadas.has(m.clave) ? 'Reprobada' : 'Por cursar';
      m.color = altas.has(m.clave) ? 'var(--ok)' : desfasadas.has(m.clave) ? 'var(--ipn-desfasada)' : curso.has(m.clave) ? 'var(--accent)' : reprobadas.has(m.clave) ? 'var(--ipn-reprobada)' : 'var(--line)';
      const grupo = porSemestre ? m.semestre == null ? 'Sin semestre informado' : 'Semestre '+m.semestre : m.periodo ? 'Periodo '+m.periodo : curso.has(m.clave) ? 'En curso' : 'Por cursar';
      if (!grupos.has(grupo)) grupos.set(grupo,[]);
      grupos.get(grupo).push(m);
    }
    const ordenados = [...grupos].sort((a,b) => {
      if(porSemestre)return (a[1][0].semestre ?? Infinity)-(b[1][0].semestre ?? Infinity);
      return (a[0].startsWith('Periodo ') ? 0 : 1)-(b[0].startsWith('Periodo ') ? 0 : 1)||a[0].localeCompare(b[0],'es',{numeric:true});
    });
    return {grupos:ordenados,materias:[...materias.values()],viejo:!a.materias};
  }
  function demo(conHorario=false) {
    const a={upiita_saes:1,demo:true,unidad,plan:'19',carrera_nombre:'Carrera ficticia de demostración',leido:'2026-10-09T12:00:00Z',
      materias:{},acreditadas:[],kardex_reprobadas:[],no_cursadas:[],reprobadas_periodo:[],desfasadas_saes:[],en_curso:[],horario_inscrito:[],promedio:8,
      carga:{total:450,min:30,media:60,max:90,duracion:8,duracion_max:12},avance:{obtenidos:370,faltan:80,cursados:6}};
    for(let i=0;i<45;i++){
      const k='Z'+String(i+1).padStart(3,'0'), sem=i<36?1+Math.floor(i/6):i<40?7:8;
      a.materias[k]=['Materia ficticia '+(i+1),sem];
      if(i<37)a.acreditadas.push([k,8,'26/'+(1+Math.floor(i/19)),['ORD','EXT','ETS','REC'][i%4]]);
      else a.no_cursadas.push([k,null,0,sem]);
      if(conHorario&&i>=37&&i<42){a.en_curso.push(k);a.horario_inscrito.push(['7FV1',k,a.materias[k][0],['Docente ficticio A','Docente ficticio B'],[[i-37,420,510]]]);}
    }
    a.no_cursadas=a.no_cursadas.filter(r=>!a.en_curso.includes(r[0]));
    return a;
  }
  window.SateGenerico = {datos,demo};
  const esDemo=location.hash==='#demo'||location.hash==='#demo-horario';
  let alumno = esDemo?demo(location.hash==='#demo-horario'):SAES.load(), conectado = false;
  if(esDemo){
    const avisoDemo=document.createElement('div');avisoDemo.className='demo-bar';avisoDemo.textContent='Modo demostración · Perfil ficticio; no se guarda en tu cuenta ni en tus datos del SAES.';
    const salir=document.createElement('button');salir.type='button';salir.className='btn';salir.textContent='Salir del modo demostración';
    salir.onclick=()=>{location.hash='';location.reload()};avisoDemo.appendChild(salir);
    document.body.prepend(avisoDemo);
  }
  function pestañas(){
    const cfg=SATE_CONFIG.unidades[unidad], hay=!!alumno?.horario_inscrito?.length;
    cfg.pestanas=['trayectoria','mapa',...(hay?['horarios']:[])];cfg.grupos=[['trayectoria'],['mapa'],...(hay?[['horarios']]:[])];
  }
  pestañas();
  const abrir = SAES.open.bind(SAES);
  SAES.open = async () => {
    try {
      await SATE.script('saes-dialogo.js'); SATE.identidadSaes();
      if (!conectado) { SAES.wire(d => {alumno=d;pestañas();SATE.actualizarPestanas();SATE.repintar();estado()}); conectado=true; }
      estado(); abrir();
    } catch(e) { SATE.error(e); }
  };
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-saes-open]')&&!conectado){e.preventDefault();SAES.open()}});
  $('b-unidad').addEventListener('click',()=>SATE.elegirUnidad());
  function estado() {
    const hay = !!alumno, clave = 'sate.encabezado.'+(hay?'actualizar':'cargar');
    $('saes-open').querySelector('.sate-texto-largo').textContent=SATE.texto(clave);
    $('saes-open').querySelector('.sate-texto-corto').textContent=SATE.texto(clave+'_corto');
    const indicador=$('sate-saes-indicador');indicador.classList.toggle('on',hay);
    const fecha = hay ? new Date(alumno.leido).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'}) : '';
    const mensaje=SATE.texto(hay?'sate.encabezado.usando_datos':'sate.encabezado.sin_datos',{fecha});
    indicador.setAttribute('aria-label',mensaje);indicador.title=mensaje;
    if(conectado){$('saes-status').hidden=!hay;$('saes-steps').hidden=hay;$('saes-clear').hidden=!hay;
      $('saes-who').textContent=hay?(alumno.carrera_nombre||'')+' · leídos el '+fecha:'';}
  }
  const aviso = d => '<p class="muted">Tu trayectoria con los datos del SAES.</p>'+(d.viejo&&alumno?'<p role="status">Actualiza tus datos con el Lector para ver los nombres de las materias.</p>':'');
  function representacion(d){
    const cols=Math.max(1,...d.grupos.map(([,ms])=>ms.length)), boxes=[],rows=[];
    d.grupos.forEach(([g,ms],i)=>{rows.push([g,32+i*76]);ms.forEach((m,j)=>boxes.push([150+j*138,10+i*76,128,56,m.clave]));});
    const L={w:150+cols*138,h:Math.max(1,d.grupos.length)*76,boxes,rows,edges:[],pitch:76,filas_exactas:true};
    const porClave=new Map(d.materias.map(m=>[m.clave,m])), curriculum=Object.fromEntries(d.materias.map(m=>[m.clave,[m.nombre,null,m.semestre]]));
    const statusOf=k=>({'Acreditada':'done','En curso':'curso','Reprobada':'fail','Desfasada según el SAES':'late'}[porClave.get(k).estado]||'');
    const ctx={isPersonal:()=>!!alumno,cur:()=>curriculum,
      slotFill:()=>new Map(),isElec:()=>false,statusOf,esc,SATE,soloLectura:true,etiqueta:k=>porClave.get(k).estado,planAsignado:()=>null};
    return {L,ctx,mini:SateUI.minimapaCurricular(ctx,L,new Map())};
  }
  function minimapa(d,abrir=false){
    const mini=representacion(d).mini;
    return '<div class="trayectoria-minimapa">'+(abrir?'<button type="button" data-abrir-mapa aria-label="Abrir mapa curricular">'+mini.svg+'</button>':mini.svg)+'<div class="mm-leg">'+mini.leyenda+'</div></div>';
  }
  function cuadricula(d){
    const {L,ctx}=representacion(d), sc=1;
    return '<div class="mapwrap"><div class="areas" style="width:'+L.w+'px"><div style="left:150px;width:'+(L.w-150)+'px">Materias</div></div><div class="map" style="position:relative;width:'+L.w+'px;height:'+L.h+'px">'+
      '<svg width="'+L.w+'" height="'+L.h+'" aria-hidden="true">'+L.rows.map(([n,y],i)=>'<rect class="band" x="0" y="'+(i*76)+'" width="'+L.w+'" height="76"/><text class="rowlbl" x="12" y="'+y+'">'+esc(n)+'</text>').join('')+'</svg>'+
      L.boxes.map(([x,y,w,h,k])=>SateUI.cajaMateria(ctx,k,x,y,w,h,sc)).join('')+'</div></div>';
  }
  function vacio() {return '<p>Usa el Lector desde el SAES de tu unidad y pega tus datos para ver tu trayectoria.</p><button class="btn primary" type="button" data-saes-open>Cargar datos del SAES</button>'}
  function mapa() {
    const d=datos(alumno);
    $('v-tray').innerHTML='<h2>Mapa curricular</h2>'+aviso(d)+(alumno?(d.materias.length?minimapa(d)+cuadricula(d):'<p>El SAES no informó materias. Actualiza tus datos con el Lector.</p>'):vacio());
  }
  function trayectoria() {
    const d=datos(alumno), a=alumno;
    if(!a){$('sate-trayectoria').innerHTML='<h2>Mi trayectoria</h2>'+vacio();return}
    const total=numero(a.carga?.total), obtenidos=numero(a.avance?.obtenidos);
    const avance=total>0&&obtenidos!=null?'<progress max="'+total+'" value="'+Math.min(total,obtenidos)+'" aria-label="Avance en créditos"></progress> '+Math.round(obtenidos/total*100)+' %':'';
    const periodos=new Map();
    for(const r of [...a.acreditadas||[],...a.kardex_reprobadas||[]]){
      const p=r[2]||'Sin periodo informado';if(!periodos.has(p))periodos.set(p,[]);periodos.get(p).push(r);
    }
    const nombres=new Map(d.materias.map(m=>[m.clave,m.nombre]));
    const kardex=[...periodos].sort((a,b)=>a[0].localeCompare(b[0],'es',{numeric:true})).map(([p,rs])=>'<details class="trayectoria-plegable" open><summary>Periodo '+esc(p)+'<small>'+rs.length+' evaluaciones</small></summary><div class="tl-rows">'+rs.map(r=>'<div class="tl-row"><span class="tl-bar"></span><span class="tl-name"><b>'+esc(nombres.get(r[0])||r[0])+'</b> <small>'+esc(r[0])+' · '+esc(r[3]||'Forma de evaluación sin informar')+'</small></span><span>Calificación: '+esc(r[1])+'</span></div>').join('')+'</div></details>').join('');
    const cifras=[['Acreditadas',d.materias.filter(m=>m.estado==='Acreditada').length],['En curso',d.materias.filter(m=>m.estado==='En curso').length],['Créditos obtenidos',dato(a.avance?.obtenidos)],['Por obtener',dato(a.avance?.faltan)]];
    const indicadores='<div class="kpis">'+cifras.map(([n,v])=>'<div class="kpi"><span>'+n+'</span><div class="kpi-v"><b>'+v+'</b></div></div>').join('')+'</div>';
    const desfase=(a.desfasadas_saes||[]).length?'<p>Desfasadas según el SAES: '+(a.desfasadas_saes||[]).map(r=>esc(nombres.get(r[0])||r[0])).join(', ')+'.</p>':a.desfasadas_saes!=null?'<p>El SAES no lista materias desfasadas.</p>':'<p>Desfase sin confirmar: actualiza el Estado General con el Lector.</p>';
    $('sate-trayectoria').innerHTML='<h2>Mi trayectoria</h2><p>'+esc(a.carrera_nombre||'')+(a.plan?' · Plan '+esc(a.plan):'')+'</p>'+aviso(d)+
      '<section><h3>Avance y promedio</h3>'+indicadores+avance+'<p>Total de créditos: '+dato(a.carga?.total)+' · Promedio del SAES: '+dato(a.promedio)+'</p></section>'+desfase+(a.desfase_saes?'<p>'+esc(a.desfase_saes)+'</p>':'')+
      (d.materias.length?'<section><h3>Minimapa de avance</h3>'+minimapa(d,true)+'</section>':'')+
      '<section><h3>Plazos y carga del SAES</h3><p>Periodos cursados: '+dato(a.avance?.cursados)+' · Duración: '+dato(a.carga?.duracion)+' · Duración máxima: '+dato(a.carga?.duracion_max)+'</p><p>Carga mínima: '+dato(a.carga?.min)+' · Media: '+dato(a.carga?.media)+' · Máxima: '+dato(a.carga?.max)+'</p>'+(a.avance?.autorizada?'<p>Carga autorizada: '+esc(a.avance.autorizada)+'</p>':'')+'</section>'+
      '<h3>Kárdex y calificaciones por periodo</h3>'+(kardex||'<p>El SAES no informó calificaciones por periodo.</p>');
  }
  document.querySelector('.sate-controles').hidden=true;
  document.querySelector('.bar-top').hidden=true;
  document.body.setAttribute('data-sate-generico','true');
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-abrir-mapa]'))SATE.ir('mapa');
    if(e.target.closest?.('[data-demo-open]')){location.hash='#demo';location.reload()}
  });
  function horario(){
    const H=alumno?.horario_inscrito||[];
    $('v-hor').innerHTML='<h2>Tu horario inscrito</h2><p class="muted">Horario del SAES · Solo lectura</p><div class="calwrap"><div id="cal" class="cal"></div></div><div class="summary">'+H.map(([g,k,n,p])=>'<p><b>'+esc(n)+'</b><br>'+esc(k)+' · Grupo '+esc(g)+'<br>'+esc(Array.isArray(p)?p.join(', '):p||'Profesor sin informar')+'</p>').join('')+'</div>';
    const all=H.map(([g,k,n,p,ses],i)=>Object.assign([null,null,null,g],{g,k,n,p,ses:(ses||[]).filter(([d,a,b])=>Number.isInteger(d)&&d>=0&&d<7&&Number.isFinite(a)&&Number.isFinite(b)&&a>=0&&b>a&&b<=1440),i}));
    SateUI.cuadriculaHorario(all,{S:{weekend:false},slots:c=>c.ses,START:420,BLOCK:90,SLOT:30,SLOTPX:22,
      $:s=>document.querySelector(s),DAYS:['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],hm:m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'),
      esc,hue:c=>c.i*67,keyOf:c=>c.k,name:c=>c.n,profs:c=>Array.isArray(c.p)?c.p.join(', '):c.p||'',roomAt:()=>'',soloLectura:true});
  }
  SATE.presente={avisos(){}};
  SATE.pestana('mapa',{mostrar:mapa});SATE.pestana('trayectoria',{mostrar:trayectoria});
  SATE.pestana('horarios',{mostrar:horario});
  SATE.alumno=()=>alumno;
  if(!esDemo)IPNT.set('ipnt.unidad',unidad);
  SATE.nucleoListo({personal:()=>!!alumno,estado:{},renderTop:estado,renderAviso(){},
    store:{set:(k,v)=>IPNT.set('hu.'+unidad+'.'+k,JSON.stringify(v))}}).catch(SATE.error);
})();
