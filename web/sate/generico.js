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
  window.SateGenerico = {datos};
  let alumno = SAES.load(), conectado = false;
  const abrir = SAES.open.bind(SAES);
  SAES.open = async () => {
    try {
      await SATE.script('saes-dialogo.js'); SATE.identidadSaes();
      if (!conectado) { SAES.wire(d => {alumno=d;SATE.repintar();estado()}); conectado=true; }
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
  const aviso = d => '<p class="muted">Armado con tus datos del SAES; sin seriación ni oferta.</p>'+(d.viejo&&alumno?'<p role="status">Actualiza tus datos con el Lector para ver los nombres de las materias.</p>':'');
  function tira(d, mini=false) {
    return '<div class="generico-tira'+(mini?' generico-mini':'')+'">'+d.grupos.map(([g,ms])=>'<section><h3>'+esc(g)+'</h3>'+ms.map(m=>'<div class="generico-materia" style="border-left-color:'+m.color+'"><b>'+esc(m.nombre)+'</b><small>'+esc(m.clave)+' · '+esc(m.estado)+'</small></div>').join('')+'</section>').join('')+'</div>';
  }
  function vacio() {return '<p>Usa el Lector desde el SAES de tu unidad y pega tus datos para ver tu trayectoria.</p><button class="btn primary" type="button" data-saes-open>Cargar datos del SAES</button>'}
  function mapa() {
    const d=datos(alumno);
    $('v-tray').innerHTML='<h2>Mapa curricular</h2>'+aviso(d)+(alumno?(d.materias.length?tira(d):'<p>El SAES no informó materias. Actualiza tus datos con el Lector.</p>'):vacio());
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
    const kardex=[...periodos].sort((a,b)=>a[0].localeCompare(b[0],'es',{numeric:true})).map(([p,rs])=>'<details class="sate-desp" open><summary>Periodo '+esc(p)+'</summary><div class="generico-calificaciones">'+rs.map(r=>'<p><b>'+esc(nombres.get(r[0])||r[0])+'</b> <small>'+esc(r[0])+'</small><br>Calificación: '+esc(r[1])+' · '+esc(r[3]||'Forma de evaluación sin informar')+'</p>').join('')+'</div></details>').join('');
    const desfase=(a.desfasadas_saes||[]).length?'<p>Desfasadas según el SAES: '+(a.desfasadas_saes||[]).map(r=>esc(nombres.get(r[0])||r[0])).join(', ')+'.</p>':a.desfasadas_saes!=null?'<p>El SAES no lista materias desfasadas.</p>':'<p>Desfase sin confirmar: actualiza el Estado General con el Lector.</p>';
    $('sate-trayectoria').innerHTML='<h2>Mi trayectoria</h2><p>'+esc(a.carrera_nombre||'')+(a.plan?' · Plan '+esc(a.plan):'')+'</p>'+aviso(d)+
      '<section><h3>Avance y promedio</h3>'+avance+'<p>Créditos obtenidos: '+dato(a.avance?.obtenidos)+' · Por obtener: '+dato(a.avance?.faltan)+' · Total: '+dato(a.carga?.total)+'</p><p>Promedio del SAES: '+dato(a.promedio)+'</p></section>'+desfase+(a.desfase_saes?'<p>'+esc(a.desfase_saes)+'</p>':'')+
      (d.materias.length?'<details class="sate-desp" open><summary>Minimapa de avance</summary>'+tira(d,true)+'</details>':'')+
      '<section><h3>Plazos y carga del SAES</h3><p>Periodos cursados: '+dato(a.avance?.cursados)+' · Duración: '+dato(a.carga?.duracion)+' · Duración máxima: '+dato(a.carga?.duracion_max)+'</p><p>Carga mínima: '+dato(a.carga?.min)+' · Media: '+dato(a.carga?.media)+' · Máxima: '+dato(a.carga?.max)+'</p>'+(a.avance?.autorizada?'<p>Carga autorizada: '+esc(a.avance.autorizada)+'</p>':'')+'</section>'+
      '<h3>Kárdex y calificaciones por periodo</h3>'+(kardex||'<p>El SAES no informó calificaciones por periodo.</p>');
  }
  document.querySelector('.sate-controles').hidden=true;
  document.querySelector('.bar-top').hidden=true;
  const css=document.createElement('style');css.textContent='.generico-tira{display:flex;gap:12px;overflow-x:auto;padding:12px 0;max-width:100%}.generico-tira>section{flex:0 0 230px;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:12px}.generico-tira h3{font-size:1rem;margin:0 0 12px}.generico-materia{border-left:5px solid;margin:8px 0;padding:6px 8px;overflow-wrap:anywhere}.generico-materia small{display:block}.generico-mini>section{flex-basis:180px}.generico-mini{font-size:.85rem}.generico-calificaciones{padding:12px}';document.head.appendChild(css);
  SATE.presente={avisos(){}};
  SATE.pestana('mapa',{mostrar:mapa});SATE.pestana('trayectoria',{mostrar:trayectoria});
  SATE.alumno=()=>alumno;
  IPNT.set('ipnt.unidad',unidad);
  SATE.nucleoListo({personal:()=>!!alumno,estado:{},renderTop:estado,renderAviso(){},
    store:{set:(k,v)=>IPNT.set('hu.'+unidad+'.'+k,JSON.stringify(v))}}).catch(SATE.error);
})();
