/* Render y controles propios de Desempeño; el motor académico permanece compartido. */
const FORMA_COLOR={Ordinario:'--ipn-ok',Extraordinario:'--ipn-aviso',ETS:'--ch-alert',Recurse:'--rel-pre',Equivalencia:'--ipn-tenue',Revalidación:'--n4',Dictamen:'--n6','No identificada':'--ipn-linea'};
const LIB_PLOT=[['../assets/vendor/d3-7.9.0.min.js','sha384-CjloA8y00+1SDAUkjs099PVfnY2KmDC2BZnws9kh8D/lX1s46w6EPhpXdqMfjK6i'],
  ['../assets/vendor/plot-0.6.17.min.js','sha384-JUpn2GgRr0gxU0xOBd8D8P634jhRCwobtG8G2MMEkX1RnGJ7/FJNnuukpfT+H2w1']];
let PLOT_P=null;
const cargarPlot=()=>window.Plot?Promise.resolve():PLOT_P||(PLOT_P=LIB_PLOT.reduce((p,[src,sri])=>p.then(()=>new Promise((ok,no)=>{
  const s=document.createElement('script');s.src=src;s.integrity=sri;s.crossOrigin='anonymous';s.onload=ok;s.onerror=()=>{
    PLOT_P=null;
    console.error('SATE: biblioteca de gráficas no disponible',{unidad:UNIDAD,ruta:location.hash,archivo:src,integridad:sri});
    s.remove();no(new Error(SATE.texto('sate.desempeno.error_graficas')));
  };document.head.appendChild(s)})),Promise.resolve()));

let ST_RENDER=0;
const trayectoriaAbierta=(id,inicial=false)=>store.get('trayectoria.seccion.'+id,id==='kardex'||!MQ_PHONE.matches&&inicial);
const KX_FILTRO={};
const kardexFiltro=()=>({periodo:'*',estado:'*',...store.get('trayectoria.kardex.'+S.car,{}),...KX_FILTRO[S.car]});
const kardexPeriodoActual=periodos=>{
  const idx=perIdx(ALUMNO.periodo_actual||DATA.calendario?.periodo);
  return periodos.find(p=>idx!=null&&perIdx(p)===idx)||periodos.at(-1)||'*';
};
const filasKardex=()=>{
  const c=cur(), A=ALUMNO;
  return [...(A.acreditadas||[]).filter(r=>r&&notaValida(r[1])!=null).map(r=>({...r,acreditada:true})),
    ...(A.kardex_reprobadas||[]).filter(r=>r&&Number.isFinite(+r[1])&&+r[1]>=0&&+r[1]<6).map(r=>({...r,acreditada:false}))]
    .map(r=>({clave:r[0],cal:+r[1],periodo:r[2]||'',codigo:r[3]||'',nombre:pretty(c[r[0]]?.[0]||ALUMNO.materias?.[r[0]]?.[0]||r[0]),cr:ALUMNO.creditos_materias?.[r[0]]??c[r[0]]?.[1]??null,acreditada:r.acreditada,adeudo:!r.acreditada&&!(A.acreditadas||[]).some(a=>a[0]===r[0])}))
    .sort((a,b)=>(perIdx(b.periodo)??-1)-(perIdx(a.periodo)??-1)||a.clave.localeCompare(b.clave,'es'));
};
function renderKardexLista(){
  const rows=filasKardex(), periodos=[...new Set(rows.map(r=>r.periodo).filter(Boolean))].sort((a,b)=>(perIdx(a)??-1)-(perIdx(b)??-1));let filtro=kardexFiltro();
  const guardado=store.get('trayectoria.kardex.'+S.car,{});
  if(filtro.periodo!=='*'&&!periodos.includes(filtro.periodo)||guardado.periodo==null&&!KX_FILTRO[S.car])filtro={...filtro,periodo:kardexPeriodoActual(periodos)};
  KX_FILTRO[S.car]=filtro;
  const aprobadas=(ALUMNO.acreditadas||[]).map(r=>notaValida(r?.[1])).filter(v=>v!=null), media=aprobadas.length?aprobadas.reduce((a,b)=>a+b,0)/aprobadas.length:null;
  const tx=(k,v)=>esc(SATE.texto('sate.trayectoria.kardex_'+k,v)), veces=k=>Math.max(rows.filter(r=>r.clave===k).length,...(ALUMNO.reprobadas_periodo||[]).filter(r=>r[0]===k).map(r=>+r[2]||1));
  const visibles=rows.filter(r=>(filtro.periodo==='*'||r.periodo===filtro.periodo)&&(filtro.estado==='*'||filtro.estado==='acreditadas'&&r.acreditada||filtro.estado==='reprobadas'&&!r.acreditada||filtro.estado==='multi'&&(veces(r.clave)>=2||/^(EXT|ETS|REC)$/.test(r.codigo))||filtro.estado==='eqv'&&/^(EQV|REV|DIC)$/.test(r.codigo))).sort((a,b)=>Number(b.adeudo)-Number(a.adeudo));
  const chip=r=>`<span class="kx-nota kx-g${r.cal>=9?'9':r.cal>=8?'8':r.cal>=6?'6':'5'}" title="${esc(r.clave+' · '+r.nombre+' · '+(FORMAS[r.codigo]||r.codigo))}">${r.cal}${({EXT:'E',ETS:'T',REC:'R',EQV:'Q',REV:'Q',DIC:'Q'})[r.codigo]?`<sub>${({EXT:'E',ETS:'T',REC:'R',EQV:'Q',REV:'Q',DIC:'Q'})[r.codigo]}</sub>`:''}</span>`;
  const medias=periodos.map(p=>{const rs=rows.filter(r=>r.periodo===p);return rs.reduce((s,r)=>s+r.cal,0)/rs.length});
  const strip=$('#kx-periodos');strip.innerHTML=periodos.map((p,i)=>{const rs=rows.filter(r=>r.periodo===p), delta=i?medias[i]-medias[i-1]:0, cr=rs.every(r=>r.cr!=null)?fmtCr(rs.reduce((s,r)=>s+(r.acreditada?+r.cr:0),0)):'—';return `<button type="button" class="chip kx-periodo" data-kx-periodo="${esc(p)}" aria-pressed="${filtro.periodo===p}"><span class="kx-periodo-cab"><b>${esc(p)}</b><strong>${medias[i].toFixed(2)} <small class="${delta<0?'kx-baja':'kx-sube'}">${i?delta>0?'▲':delta<0?'▼':'=':''}</small></strong></span><span class="kx-fichas">${rs.map(chip).join('')}</span><span class="kx-periodo-pie">${tx('unidades',{n:rs.length})}<span>${cr} ${tx('cr')}</span></span></button>`}).join('');
  const seleccionado=strip.querySelector('[aria-pressed="true"]');if(seleccionado&&typeof strip.scrollTo==='function')strip.scrollTo({left:Math.max(0,seleccionado.offsetLeft-(strip.clientWidth-seleccionado.offsetWidth)/2),behavior:'instant'});
  $('#kx-filtros').innerHTML=[['*','todos'],['reprobadas','riesgo'],['multi','multi'],['eqv','eqv']].map(([v,k])=>`<button type="button" class="chip" data-kx-estado="${v}" aria-pressed="${filtro.estado===v}">${tx(k)}</button>`).join('');
  $('#kx-todos').setAttribute('aria-pressed',String(filtro.periodo==='*'));
  $('#kx-cuenta').textContent=SATE.texto('sate.trayectoria.kardex_cuenta',{n:visibles.length,m:rows.length});
  $('#kx-prom-oficial').textContent=ALUMNO.promedio==null?'—':(+ALUMNO.promedio).toFixed(2);
  $('#kx-prom-acreditadas').textContent=media==null?'—':media.toFixed(2);
  const proy=promOficialSim(), proyEl=$('#kx-prom-proyeccion');proyEl.textContent=proy?`${proy.exacto?'':'≈ '}${proy.despues.toFixed(2)}`:'';proyEl.parentElement.parentElement.hidden=!proy;
  let grupo=null;
  $('#kx-lista').innerHTML=visibles.length?visibles.map(r=>{const g=r.adeudo?tx('adeudos'):esc(r.periodo)||'—', cab=g!==grupo?`<tr class="kx-grupo"><th colspan="6">${g}</th></tr>`:'';grupo=g;return `${cab}<tr${r.adeudo?' class="kx-adeudo"':''}><td data-label="${tx('ua')}"><b>${esc(r.clave)}</b> · ${esc(r.nombre)}${r.adeudo?` <strong class="kx-marca">${tx('adeudo')}</strong>`:''}</td><td data-label="${tx('periodo')}">${esc(r.periodo)||'—'}</td><td data-label="${tx('nota')}">${chip(r)}</td><td data-label="${tx('forma')}">${esc(FORMAS[r.codigo]||r.codigo)||'—'}</td><td data-label="${tx('veces')}">${veces(r.clave)}</td><td data-label="${tx('creditos')}">${r.cr==null?'—':fmtCr(r.cr)}</td></tr>`}).join(''):`<tr><td colspan="6">${tx('vacio')}</td></tr>`;
}
function kardexCurso(){
  const tx=k=>esc(SATE.texto('sate.trayectoria.kardex_'+k)), A=ALUMNO;
  const claves=[...new Set(A.en_curso??(A.horario_inscrito||[]).map(h=>h[1]))];
  const filas=claves.map(k=>{const h=(A.horario_inscrito||[]).find(h=>h[1]===k), cr=A.creditos_materias?.[k]??cur()[k]?.[1], dato=c=>h?.[c]??(c==='grupo'?h?.[0]:null);return {ua:`<span class="kx-curso-materia"><b>${esc(k)}</b> ${esc(pretty(cur()[k]?.[0]||h?.[2]||k))}</span>`,grupo:dato('grupo'),creditos:cr==null?'':fmtCr(cr),p1:dato('p1'),p2:dato('p2'),p3:dato('p3'),final:dato('final')}});
  const cols=['ua','grupo','creditos','p1','p2','p3','final'].filter(c=>c==='ua'||filas.some(f=>f[c]!=null&&String(f[c]).trim()!==''));
  const celda=(c,f)=>`<td${c==='ua'?' class="kx-curso-ua"':''} data-label="${tx(c)}">${c==='ua'?f[c]:esc(f[c]??'')}</td>`;
  if(cols.every(c=>c==='ua'||c==='creditos'))return `<ul class="kx-curso-lista">${filas.map(f=>`<li>${f.ua}${f.creditos?`<span>${esc(f.creditos)} cr</span>`:''}</li>`).join('')||`<li>${tx('sin_curso')}</li>`}</ul>`;
  return `<table class="kx-tabla kx-curso"><thead><tr>${cols.map(k=>`<th scope="col">${tx(k)}</th>`).join('')}</tr></thead><tbody>${filas.map(f=>`<tr>${cols.map(c=>celda(c,f)).join('')}</tr>`).join('')||`<tr><td colspan="${cols.length}">${tx('sin_curso')}</td></tr>`}</tbody></table>`;
}
function prepararSeccion(el,id,dibujar){
  el.open=trayectoriaAbierta(id,id==='kardex'||id==='escenario'||id==='simulacion');
  let dibujada=false,turno=0;
  const abrir=()=>{if(!el.open||dibujada)return;dibujada=true;const actual=++turno;return Promise.resolve(dibujar?.(()=>el.open&&actual===turno)).catch(e=>{
    if(actual===turno)dibujada=false;console.error('SATE: fallo al abrir sección',{unidad:UNIDAD,carrera:S.car,seccion:id,error:e.message});
  })};
  // El primer toggle también se emite al montar: solo guardar cambios del usuario.
  let anterior=el.open;
  el.addEventListener('toggle',()=>{if(anterior!==el.open){anterior=el.open;store.set('trayectoria.seccion.'+id,el.open)}if(!el.open){dibujada=false;turno++}return abrir()});
  return abrir();
}
function metaResumen(D,H,incluyeActual){
  const M=metaCreditos(D,H,incluyeActual);
  if(!M.valida)return '<p class="muted">Escribe un número entero de periodos (1 o más).</p>';
  if(M.pendientes==null)return '<p class="muted">No se puede calcular: los créditos que te faltan no son consistentes. Actualiza tus datos del SAES.</p>';
  if(M.pendientes===0)return '<p><b>Ya completaste los créditos del plan.</b> Consulta con Gestión Escolar los demás requisitos para concluir tus estudios.</p>';
  // regla: lo que has aprobado por periodo, lo que necesitas y tu máximo autorizado
  const tope=Math.max(M.necesarios,D.ritmo||0,M.autorizada||0)*1.15||1, x=v=>(v/tope*100).toFixed(1)+'%';
  // «necesitas» arriba; «tu ritmo» y «máximo» abajo. En un mismo lado, si dos marcas quedan cerca (o junto al borde
  // derecho), la etiqueta de la izquierda se escribe hacia la izquierda de su línea para no encimarse.
  const pos=v=>v/tope*100, ab=[[D.ritmo||null,'ritmo','tu ritmo'],[M.autorizada,'max','máximo']].filter(m=>m[0]!=null).sort((p,q)=>p[0]-q[0]);
  // abajo: si las dos marcas están cerca, sus etiquetas van a lados opuestos; si el borde derecho no lo permite,
  // la de la izquierda baja a un segundo renglón
  const lugar=ab.map(([v])=>({izq:pos(v)>82,fila2:false}));
  if(ab.length===2&&pos(ab[1][0])-pos(ab[0][0])<16){lugar[0].izq=true;if(pos(ab[1][0])>82){lugar[1].izq=true;lugar[0].fila2=true}}
  const marca=(v,cls,t,lado,aIzq)=>v==null?'':`<span class="mt-m ${cls} ${lado}${aIzq?' izq':''}" style="left:${x(v)}"><span><b>${fmtCr(v)}</b> ${t}</span></span>`;
  const estado=M.autorizada==null?'No se conoce tu carga máxima autorizada para compararla.':M.supera?`Rebasa tu carga máxima autorizada (${fmtCr(M.autorizada)} cr).`:'Cabe en tu carga máxima autorizada; revisa también la seriación y que haya grupos.';
  // equivalencia aproximada en materias: promedio de créditos de las materias del plan que te faltan
  let porMat=null;try{const c=cur(),hechas=new Set(tr().done),cr=Object.keys(c).filter(k=>!hechas.has(k)&&!isElec(k)&&c[k][1]>0).map(k=>c[k][1]);if(cr.length)porMat=cr.reduce((a,b)=>a+b,0)/cr.length}catch(e){}
  const nMat=porMat?Math.max(1,Math.round(M.necesarios/porMat)):null;
  return `<p class="mt-h"><b>${fmtCr(M.necesarios)} créditos por periodo</b> ${ayudaCreditos()}${nMat?` <span class="mt-mat">≈ ${nMat} ${nMat===1?'materia':'materias'} por periodo ${info(`Aproximado con el promedio de créditos de las materias que te faltan (${porMat.toFixed(1)} créditos por materia).`)}</span>`:''}${M.fin!=null?` · de ${perName(M.inicio)} a ${perName(M.fin)}`:''}</p>
    <div class="mt-regla${M.supera?' supera':''}" aria-hidden="true"><i class="mt-zona" style="width:${M.autorizada!=null?x(M.autorizada):'100%'}"></i>
      ${marca(M.necesarios,'nec','necesitas','arriba',pos(M.necesarios)>82)}${ab.map(([v,c,t],j)=>marca(v,c,t,lugar[j].fila2?'abajo fila2':'abajo',lugar[j].izq)).join('')}</div>
    <p class="mt-e${M.supera?' warn':''}">${estado}${M.bajoMin?' Es menos que la carga mínima; requiere autorización.':''} ${info('Promedio de créditos que necesitas aprobar por periodo, no una lista exacta de materias. Tu carga autorizada puede cambiar cada periodo; los periodos se estiman con tu cita de reinscripción y tu kárdex.')}</p>`;
}

const pmEst=x=>x==null?'':x<=6?'cualquier calificación aprobatoria te alcanza':x>10?'no alcanzable':`<b>${x.toFixed(2)}</b>`;
const pmEscala=x=>x==null||x>10||x<6?'':`<span class="k-regla pm-regla" aria-hidden="true"><i style="left:${(x-6)/4*100}%"></i><em>6</em><em>10</em></span>`;

function pmEstado(M){const comb=pmCombinacion(M), v=Object.values(comb);if(!v.length)return '';
  const prom=v.reduce((a,b)=>a+b,0)/v.length, fin=(M.n*M.actual+prom*v.length)/(M.n+v.length), ok=M.periodo!=null&&prom>=M.periodo-1e-9;
  return `<span class="pm-estado ${ok?'ok':'no'}">${ok?'✓':'✗'} Tu combinación promedia <b>${prom.toFixed(2)}</b>${ok?' y alcanza tu meta':M.periodo<=10?` · te faltan ${(M.periodo-prom).toFixed(2)} puntos de promedio`:''}</span><span class="muted">Promedio sin reprobadas al terminar el periodo: ${fin.toFixed(2)}</span>`}
function promMetaHtml(M){
  const est=pmEst, escala=pmEscala;
  if(!M.n)return '<p class="muted">Aún no hay materias acreditadas para calcular.</p>';
  let per='<p class="muted">No tienes materias inscritas registradas.</p>';
  if(M.k){const c=cur(), comb=pmCombinacion(M);
    per=`<div class="pm-fila"><div><span class="pm-t">Este periodo</span><span>${M.periodo>10?`No alcanzable este periodo: aun con 10 en tus ${M.k} materias inscritas llegarías a ${M.max.toFixed(2)}.`:`Necesitas promediar ${est(M.periodo)} en tus ${M.k} ${M.k===1?'materia inscrita':'materias inscritas'} para alcanzar ${(+store.get('promMeta.'+S.car,0)||0)?'tu meta':'esta meta'}.`}</span></div>${escala(M.periodo)}</div>`+
      (M.periodo<=10?`<p class="pm-sub">Prueba otras combinaciones: puedes subir unas y bajar otras mientras el promedio alcance lo necesario.</p>
      <div class="pm-mats">${tr().enCurso.map(k=>`<label class="pm-mat"><span>${esc(pretty(c[k][0]))}</span><select data-pmcal="${esc(k)}" aria-label="Calificación de ${esc(pretty(c[k][0]))}">${[10,9,8,7,6].map(n=>`<option${comb[k]===n?' selected':''}>${n}</option>`).join('')}</select></label>`).join('')}</div>
      <div class="pm-res" id="pm-estado" aria-live="polite">${pmEstado(M)}</div>
      <div class="pm-acc"><button class="btn" type="button" id="prom-sim">Usar en la simulación</button><button class="link" type="button" id="pm-reset">Repartir de nuevo</button></div>`:'')}
  const car=M.R?`<div class="pm-fila"><div><span class="pm-t">Al terminar la carrera</span><span>Necesitas promediar ${est(M.carrera)} en las ${M.R} materias obligatorias que te faltan.</span></div>${escala(M.carrera)}</div>`:'';
  return per+car;
}

function metaPanel(D){
  const cfg=store.get('meta.'+S.car,{periodos:4,actual:true}), incluye=D.simulado?false:cfg.actual!==false;
  return `<section class="meta-panel" aria-labelledby="meta-h"><h3 id="meta-h">¿En cuántos periodos quieres terminar? ${simTag('meta')}</h3>
    <div class="meta-controls"><label for="meta-periodos">Periodos <input id="meta-periodos" type="number" min="1" step="1" value="${esc(String(cfg.periodos??4))}" aria-describedby="meta-result"></label>
    <label><input id="meta-actual" type="checkbox"${incluye?' checked':''}${D.simulado?' disabled':''}> Contar el periodo actual</label>${D.simulado?info('Los créditos incluyen tu simulación de fin de semestre; la meta empieza después de ese periodo.'):''}</div>
    <div id="meta-result" aria-live="polite">${metaResumen(D,cfg.periodos??4,incluye)}</div></section>`;
}
function montarGrafica(host,fig){
  host.replaceChildren(fig);
  const svg=fig.matches('svg')?fig:fig.querySelector('svg');if(!svg)return;
  const nativa=svg.getScreenCTM.bind(svg);let avisado=false;
  // Firefox puede omitir el zoom CSS de los ancestros en getScreenCTM. D3 usa su inversa para el cursor.
  // Estos SVG de Plot conservan xMidYMid meet; sus límites visibles incluyen zoom, resize y scroll.
  svg.getScreenCTM=()=>{
    const r=svg.getBoundingClientRect(),v=svg.viewBox.baseVal,m=nativa();
    if(!r.width||!r.height||!v.width||!v.height)return m;
    const k=Math.min(r.width/v.width,r.height/v.height);
    const x=r.left+(r.width-v.width*k)/2-v.x*k,y=r.top+(r.height-v.height*k)/2-v.y*k;
    if(m&&Math.abs(m.a-k)<.01&&Math.abs(m.d-k)<.01&&Math.abs(m.e-x)<.1&&Math.abs(m.f-y)<.1)return m;
    if(!avisado){console.debug('Gráfica: corregida matriz del cursor por escala CSS',{grafica:host.id,escala:k,ancho:r.width,alto:r.height});avisado=true}
    return new DOMMatrix([k,0,0,k,x,y]);
  };
}
function promMetaPanel(D){
  const T=store.get('promMeta.'+S.car,null), v=T??(D.media!=null?Math.min(10,Math.ceil((D.media+.3)*10)/10):8.5), M=promMeta(D,v);
  return `<section class="meta-panel pm" aria-labelledby="pm-h"><h3 id="pm-h">¿Qué promedio quieres alcanzar? ${simTag('pm')}${info('Se calcula con tu promedio sin reprobadas (tus materias acreditadas). El promedio oficial del SAES también cuenta calificaciones reprobadas, así que para subirlo puede hacer falta un poco más.')}</h3>
    <div class="meta-controls"><label for="prom-meta">Promedio meta <input id="prom-meta" type="number" min="6" max="10" step="0.1" value="${v}"></label>
    <span class="muted">Hoy: ${M.actual!=null?M.actual.toFixed(2):'—'} (${M.n} materias)</span></div>
    <div id="pm-res">${promMetaHtml(M)}</div></section>`;
}
// leyenda visual de una gráfica: [tipo, color, texto]; tipos: linea, punteada, guion, area, barra, punto, anillo, vertical, vertical-p
function ley(items){return SateUI.leyendaGrafica(items,esc)}
function renderAnalisis(D){
  const el=$('#kanal');if(!el)return;
  const X=analisis(), f2=v=>v==null?'—':(+v).toFixed(2);
  const cuid=X.cuidar.length?`<ul class="an-list">${X.cuidar.map(r=>`<li><b>${esc(X.nm(r.k))}</b><small>${esc(r.motivos.join('. '))}.</small></li>`).join('')}</ul>`:
    '<p class="muted">Sin requisitos pendientes.</p>';
  const lin=X.lineas.length?`<section><h4>Promedio por línea de especialización</h4><p class="an-sub">Tus materias aprobadas de cada línea.</p><ul class="an-bars">${X.lineas.map(l=>`<li><span>${esc(l.nombre)}${l.sim?' · simulado':''}</span><b>${f2(l.prom)}</b><small>${l.n} de ${l.total} materias · ${esc(l.claves.map(X.nm).join(', '))}</small></li>`).join('')}</ul></section>`:'';
  const ruta=X.ciclo?'<p class="muted">No se puede mostrar la cadena: el mapa tiene requisitos circulares.</p>':X.cadena.length?
    `<p class="an-sub">${X.cadena.length} materias seguidas: cada una abre la siguiente, así que se cursan en periodos distintos.</p><ol class="an-chain">${X.cadena.map(k=>`<li>${esc(X.nm(k))}</li>`).join('')}</ol>`:
    '<p class="muted">No tienes cadenas de materias seriadas pendientes.</p>';
  el.innerHTML=`<h3 class="an-h">Observaciones para planear ${simTag('obs')}</h3><div class="an-grid">
    <section><h4>Tus materias elegidas y reprobadas</h4><p class="an-sub">Lo que les falta y lo que desbloquean.</p>${cuid}</section>
    ${lin}<section><h4>Cadena de seriación más larga</h4>${ruta}</section>
    </div>`;
}

function renderSimulacion(){
  const c=cur();
    const ec=tr().enCurso, pr=tr().pendRep;$('#est-sim').hidden=!ec.length&&!pr.length;
    const calSel=(k,attr,v,esc_=[10,9,8,7,6])=>`<select data-${attr}="${esc(k)}" aria-label="${esc(SATE.texto('sate.desempeno.calificacion'))}"${SIM.on?'':' disabled'}>${esc_.map(n=>`<option${+v===n?' selected':''}>${n}</option>`).join('')}</select>`;
    $('#est-sim').innerHTML=ec.length||pr.length?`<label class="tgl" title="${esc(SATE.texto('sate.desempeno.sim_aviso'))}"><input type="checkbox" id="sim-on"${SIM.on?' checked':''}><span class="tgl-ui" aria-hidden="true"></span><span>${esc(SATE.texto('sate.desempeno.simular'))}</span></label>`+(SIM.on&&(Object.keys(SIM.res).length||Object.keys(SIM.rec).length||Object.keys(SIMBLK).length)?`<button type="button" class="link sim-reset" id="sim-reset" title="${esc(SATE.texto('sate.desempeno.reiniciar_ayuda'))}">${esc(SATE.texto('sate.desempeno.reiniciar'))}</button>`:'')+
      `<span class="sim-hint">${SIM.on?SATE.texto('sate.desempeno.sim_efecto'):SATE.texto('sate.desempeno.sim_ayuda')}</span>`+
      `<div class="simrows${SIM.on?'':' off'}">`+
      ec.map(k=>{const r=SIM.res[k]||{},ok=r.ok!==false;return `<div class="simrow"><span class="sim-n">${esc(pretty(c[k][0]))}<small>${tr().encEqv?.includes(k)?SATE.texto('sate.desempeno.en_curso_eqv'):SATE.texto('sate.desempeno.en_curso')}</small></span>`+
        `<div class="seg sm" role="group"><button type="button" data-simok="${esc(k)}" aria-pressed="${ok}"${SIM.on?'':' disabled'}>${esc(SATE.texto('sate.desempeno.aprobada'))}</button><button type="button" data-simko="${esc(k)}" aria-pressed="${!ok}"${SIM.on?'':' disabled'}>${esc(SATE.texto('sate.desempeno.reprobada'))}</button></div>`+
        (ok?calSel(k,'simcal',r.cal??8):calSel(k,'simcalr',r.calR??5,[5,4,3,2,1,0])+`<span class="sim-x">${esc(SATE.texto('sate.desempeno.recursar'))}</span>`)+`</div>`}).join('')+
      pr.map(k=>{const r=SIM.rec[k]||{};return `<div class="simrow"><span class="sim-n">${esc(pretty(c[k][0]))}<small class="bad">${esc(SATE.texto('sate.desempeno.reprobada'))}</small></span>`+
        `<select data-simrec="${esc(k)}" aria-label="${esc(SATE.texto('sate.desempeno.como_acredita'))}"${SIM.on?'':' disabled'}><option value="">${esc(SATE.texto('sate.desempeno.pendiente'))}</option>${['ETS','REC','EXT'].map(f=>`<option value="${f}"${r.forma===f?' selected':''}>${esc(SATE.texto('sate.desempeno.acreditada_por',{forma:FORMAS[f].toLowerCase()}))}</option>`).join('')}</select>`+
        (r.forma?calSel(k,'simreccal',r.cal??7):'')+`</div>`}).join('')+`</div>`:'';

}
async function renderStatsVista(){
  const revision=++ST_RENDER;
  const box=$('#kstats');
  if(!isPersonal()||SATE.actual?.pestana!=='trayectoria')return;
  const D=statsDatos(), A=ALUMNO;
  const Dde=blk=>usaSim(blk)===SIM.on?D:conSim(usaSim(blk),statsDatos), Dc=Dde('camino'), Dk=Dde('kardex'), Da=Dde('areas');
  
  const f2=v=>v==null||!isFinite(v)?'—':(+v).toFixed(2), sg=v=>v==null?'':(v>=0?'+':'')+v.toFixed(2);
  const plazo=plazoReferencia(A), dur=plazo.dur, cursados=A.avance?.cursados, limite0=plazo.max&&cursados!=null&&D.actual!=null?1:null, totalPer=D.nper!=null&&cursados!=null?D.fin!=null&&D.actual!=null?cursados+D.fin-D.actual:cursados:null;
  // Conserva el nodo y sus eventos al reconstruir las gráficas.
  const focoSim=$('#desempeno-simulacion').contains(document.activeElement)?document.activeElement:null;
  $('#sate-trayectoria').appendChild($('#desempeno-simulacion'));
  box.innerHTML=`${D.avisos.length?`<p class="st-note">${D.avisos.map(esc).join(' ')}</p>`:''}${SateUI.indicadoresTrayectoria(D,{esc,fmtCr,info,SATE})}
    <header class="kx-cabecera"><h3>${esc(SATE.texto('sate.trayectoria.kardex_calificaciones'))}</h3><div class="kpis kx-promedios">${[['oficial','prom_oficial'],['acreditadas','prom_acreditadas'],['proyeccion','prom_proyeccion']].map(([id,key])=>`<div class="kpi"><span>${esc(SATE.texto('sate.trayectoria.kardex_'+key))}</span><div class="kpi-v"><b id="kx-prom-${id}"></b></div></div>`).join('')}</div></header>
    <section class="trayectoria-kardex-curso" aria-labelledby="kx-curso-titulo"><h3 id="kx-curso-titulo">${esc(SATE.texto('sate.trayectoria.kardex_curso'))}</h3>${kardexCurso()}</section>
    <details class="trayectoria-plegable" id="trayectoria-kardex"><summary>${esc(SATE.texto('sate.trayectoria.kardex'))}</summary><div class="kx-bloque">
      <div class="kx-periodos-marco"><div class="kx-periodos-nav"><button type="button" class="chip" data-kx-mover="-1" aria-label="${esc(SATE.texto('sate.trayectoria.kardex_periodo_anterior'))}">‹</button><button type="button" class="chip" data-kx-mover="1" aria-label="${esc(SATE.texto('sate.trayectoria.kardex_periodo_siguiente'))}">›</button></div><div id="kx-periodos" class="kx-periodos" role="group" aria-label="${esc(SATE.texto('sate.trayectoria.kardex_periodo'))}" tabindex="0"></div></div>
      <p class="kx-leyenda">${esc(SATE.texto('sate.trayectoria.kardex_leyenda'))}</p>
      <div class="kx-controles"><div class="kx-chips"><button type="button" id="kx-todos" class="chip" data-kx-periodo="*">${esc(SATE.texto('sate.trayectoria.kardex_periodos_todos'))}</button><div id="kx-filtros" role="group" aria-label="${esc(SATE.texto('sate.trayectoria.kardex_estado'))}"></div></div><span id="kx-cuenta" role="status" aria-live="polite"></span></div>
      <table class="kx-tabla"><thead><tr>${['ua','periodo','nota','forma','veces','creditos'].map(k=>`<th scope="col">${esc(SATE.texto('sate.trayectoria.kardex_'+k))}</th>`).join('')}</tr></thead><tbody id="kx-lista"></tbody></table>
    </div></details>
    <div class="charts"><figure class="ch-wide"><figcaption><h3>Tu camino en la carrera ${simTag('camino')}</h3>${ley([['cuadro','var(--ipn-acento)','Acreditado'],['rayado','var(--ipn-acento)',Dc.simulado?'Simulado':'En curso'],['cuadro','var(--ipn-linea)','Te falta'],['marca','var(--ipn-acento)','Estimado a tu ritmo'],...(totalPer!=null&&plazo.max&&totalPer>plazo.max?[['anillo','var(--ch-alert)','Rebasa el plazo']]:[])])}</figcaption><div id="ch-camino"></div></figure></div>
    <div id="trayectoria-sim-slot"></div>
    <details class="trayectoria-plegable" id="trayectoria-escenario"><summary id="trayectoria-escenario-titulo">${esc(SATE.texto('sate.trayectoria.y_si'))}<small>${esc(SATE.texto('sate.trayectoria.y_si_resumen'))}</small></summary><div>
      ${conSim(usaSim('pm'),()=>promMetaPanel(statsDatos()))}
      ${conSim(usaSim('meta'),()=>metaPanel(statsDatos()))}
    </div></details>
    <details class="trayectoria-plegable" id="trayectoria-areas"><summary>${esc(SATE.texto('sate.trayectoria.areas'))}<small id="trayectoria-areas-resumen"></small></summary><div class="charts">
      <figure class="ch-wide trayectoria-afinidades"><figcaption>${simTag('areas')}<span>${esc(SATE.texto('sate.trayectoria.areas_media',{promedio:f2(Da.media)}))}</span></figcaption><div id="ch-cat" aria-hidden="true"></div><details class="trayectoria-areas-detalle"><summary>${esc(SATE.texto('sate.trayectoria.areas_detalle'))}</summary><p id="trayectoria-areas-lectura"></p><div id="trayectoria-areas-datos"></div></details></figure>
    </div></details>
    <details class="trayectoria-plegable" id="trayectoria-observaciones"><summary>${esc(SATE.texto('sate.trayectoria.observaciones'))}</summary><div class="kanal" id="kanal"></div></details>
    ${D.rows.some(r=>r.eqv)?`<p class="st-note">${D.rows.filter(r=>r.eqv).length} ${D.rows.filter(r=>r.eqv).length===1?'materia reconocida':'materias reconocidas'} por equivalencia, revalidación o dictamen (${D.crEqv==null?'créditos incompletos':fmtCr(D.crEqv)+' créditos'}) ${info('Equivalencia: materia de otra carrera o plan del IPN (por ejemplo, cambio de carrera). Revalidación: materia cursada en otra institución, incluida la movilidad académica nacional o internacional. Dictamen: reconocimiento por resolución académica. Todas cuentan en tus promedios, áreas y créditos; como el SAES las registra al reconocerlas y no en el periodo en que se cursaron, no entran en el promedio por periodo ni en tu ritmo de créditos.')}</p>`:''}`;
  $('#trayectoria-sim-slot').appendChild($('#desempeno-simulacion'));
  montarAyudasCreditos();
  if(focoSim)focoSim.focus();
  prepararSeccion($('#trayectoria-escenario'),'escenario');
  prepararSeccion($('#trayectoria-observaciones'),'observaciones',()=>conSim(usaSim('obs'),()=>renderAnalisis(statsDatos())));
  const cs=getComputedStyle(document.documentElement), tok=n=>cs.getPropertyValue(n).trim();
  const base=el=>({width:$(el).clientWidth,style:{background:'transparent',color:tok('--ipn-texto'),fontSize:'var(--ipn-tamano-xs)',fontFamily:'inherit'},marginLeft:40,marginBottom:32});
  const put=(id,fig)=>montarGrafica($(id),fig);
  const tickPer=d=>perName(d);
  // 1) camino en la carrera: regla del plan completo con lo acreditado, lo que está en curso y la estimación por periodo
  $('#ch-camino').innerHTML=SateUI.caminoTrayectoria(Dc,A,plazo,totalPer,{esc,fmtCr,perName,proyeccionCreditos,
    ec:Dc.simulado?0:[...new Set(tr().enCurso)].reduce((t,k)=>t+(cur()[k]?.[1]||0),0),info},$('#ch-camino').clientWidth);
  montarAyudasCreditos();
  // 2) kárdex por periodo: cada materia es un cuadro con su calificación; encabezado con promedio y créditos
  renderKardexLista();prepararSeccion($('#trayectoria-kardex'),'kardex');
  // Dos materias evitan presentar una sola calificación como una afinidad consolidada.
  const grupos=new Map();for(const r of Da.rows){if(!grupos.has(r.cat))grupos.set(r.cat,[]);grupos.get(r.cat).push(r)}
  const porArea=[...grupos].map(([cat,v])=>({cat,media:v.reduce((a,r)=>a+r.cal,0)/v.length,n:v.length,
    cr:v.every(r=>r.cr!=null)?v.reduce((a,r)=>a+r.cr,0):null})).sort((a,b)=>b.media-a.media||a.cat.localeCompare(b.cat,'es'));
  const mejores=porArea.filter(d=>d.n>=2).slice(0,2), tx=(k,v)=>SATE.texto('sate.trayectoria.areas_'+k,v);
  const lectura=mejores.length?tx(mejores.length===2?'mejores':'mejor',{primera:`${mejores[0].cat} (${mejores[0].media.toFixed(1)})`,segunda:mejores[1]?`${mejores[1].cat} (${mejores[1].media.toFixed(1)})`:''}):tx(porArea.length?'muestra':'vacio');
  $('#trayectoria-areas-resumen').textContent=mejores.length?tx('resumen',{area:mejores[0].cat,promedio:mejores[0].media.toFixed(1)}):'';
  $('#trayectoria-areas-lectura').textContent=lectura;
  return prepararSeccion($('#trayectoria-areas'),'areas',async(abierta)=>{
  const vigente=()=>revision===ST_RENDER&&SATE.actual?.pestana==='trayectoria'&&abierta();
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))); // Medir después de abrir el details.
  if(!vigente())return;
  // La lista conserva todos los nombres y datos, incluso si la biblioteca no carga.
  $('#trayectoria-areas-datos').innerHTML=porArea.length?`<ol class="trayectoria-areas-ranking">${porArea.map(d=>`<li${d.n===1?' class="area-muestra"':''}><b>${esc(d.cat)}${d.n===1?' '+esc(tx('una')):''}</b><span>${esc(tx('datos',{promedio:f2(d.media),creditos:d.cr==null?tx('creditos_desconocidos'):fmtCr(d.cr)+' cr',materias:SATE.texto('sate.desempeno.materias',{n:d.n})}))}</span></li>`).join('')}</ol>`:'';
  if(!porArea.length)return;
  try{await cargarPlot()}catch(e){if(vigente())$('#ch-cat').innerHTML=`<p class="muted">${esc(e.message)}</p>`;throw e}
  if(!vigente())return;
  const P=window.Plot;
  const col=d=>tok(mejores.includes(d)?'--ipn-acento':'--ipn-tenue');
  put('#ch-cat',P.plot({...base('#ch-cat'),height:Math.max(190,porArea.length*32+70),marginTop:30,marginBottom:32,marginLeft:$('#ch-cat').clientWidth<480?118:160,marginRight:20,
    x:{label:null,domain:[6,10],ticks:[6,7,8,9,10]},y:{label:null,domain:porArea.map(d=>d.cat),padding:0,tickSize:0,tickFormat:d=>d.length>18?d.slice(0,17)+'…':d},
    marks:[P.ruleY(porArea,{y:'cat',x1:6,x2:10,stroke:tok('--ipn-linea')}),
      P.ruleX(Da.media==null?[]:[Da.media],{stroke:tok('--ipn-tenue'),strokeOpacity:.4,strokeWidth:1}),
      P.dot(porArea,{x:'media',y:'cat',fill:col,fillOpacity:d=>d.n===1?.6:1,r:4.5})]}));
  });
}


const cambiarMeta=e=>{
  if(!['meta-periodos','meta-actual'].includes(e.target.id))return;
  const cfg={periodos:$('#meta-periodos').value,actual:$('#meta-actual').checked};
  store.set('meta.'+S.car,cfg);
  const D=statsDatos();$('#meta-result').innerHTML=metaResumen(D,cfg.periodos,D.simulado?false:cfg.actual);
  $('#meta-periodos').setAttribute('aria-invalid',String(!metaCreditos(D,cfg.periodos,cfg.actual).valida));
};
$('#kstats').addEventListener('input',cambiarMeta);
$('#kstats').addEventListener('click',e=>{
  const mover=e.target.closest('[data-kx-mover]');if(mover){const lista=$('#kx-periodos'),items=[...lista.querySelectorAll('.kx-periodo')],idx=items.findIndex(x=>x.getAttribute('aria-pressed')==='true'),next=items[Math.max(0,Math.min(items.length-1,idx+(+mover.dataset.kxMover)))];next?.click();return}
  const boton=e.target.closest('[data-kx-periodo],[data-kx-estado]');if(!boton)return;
  const campo=boton.dataset.kxPeriodo!=null?'periodo':'estado', valor=boton.dataset.kxPeriodo??boton.dataset.kxEstado;
  const cfg={...kardexFiltro(),[campo]:valor};KX_FILTRO[S.car]=cfg;store.set('trayectoria.kardex.'+S.car,cfg);renderKardexLista();
  // La tira se reconstruye al filtrar: conservar el foco en el botón elegido.
  document.querySelector(`[data-kx-${campo}="${CSS.escape(valor)}"]`)?.focus();
});
$('#kstats').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key)||!e.target.closest('#kx-periodos'))return;e.preventDefault();const items=[...$('#kx-periodos').querySelectorAll('.kx-periodo')],idx=items.indexOf(e.target.closest('.kx-periodo')),next=items[Math.max(0,Math.min(items.length-1,idx+(e.key==='ArrowRight'?1:-1)))];if(!next)return;next.click();$('#kx-periodos').querySelector(`[data-kx-periodo="${CSS.escape(next.dataset.kxPeriodo)}"]`)?.focus()});
$('#kstats').addEventListener('scroll',e=>{if(e.target.id==='kx-periodos')actualizarBordesKardex()},true);
$('#kstats').addEventListener('input',e=>{if(e.target.id!=='prom-meta')return;const v=+e.target.value;if(!(v>=6&&v<=10))return;
  store.set('promMeta.'+S.car,v);store.set('pmCal.'+S.car,{});const D=statsDatos(),M=promMeta(D,v);
  $('#pm-res').innerHTML=promMetaHtml(M)});
// combinación por materia: actualiza solo el indicador; «Usar en la simulación» la lleva al simulador
$('#kstats').addEventListener('change',e=>{const k=e.target.dataset?.pmcal;if(!k)return;
  const g=store.get('pmCal.'+S.car,{});g[k]=+e.target.value;store.set('pmCal.'+S.car,g);
  const v=store.get('promMeta.'+S.car,null)??+$('#prom-meta').value;$('#pm-estado').innerHTML=pmEstado(promMeta(statsDatos(),v))});
$('#kstats').addEventListener('click',e=>{
  if(e.target.id==='pm-reset'){store.set('pmCal.'+S.car,{});renderStats();return}
  if(e.target.id!=='prom-sim')return;
  const v=store.get('promMeta.'+S.car,null)??+$('#prom-meta').value, comb=pmCombinacion(promMeta(statsDatos(),v));
  Object.entries(comb).forEach(([k,cal])=>{SIM.res[k]={ok:true,cal}});
  SIM.on=true;simTodos();simSave()});
// las gráficas toman los colores del tema al dibujarse: se redibujan si cambia el tema (sistema o botón)
{const redibuja=()=>{if(!$('#kstats')?.hidden)renderStats()};
  try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',redibuja)}catch(e){}
  new MutationObserver(redibuja).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})}
$('#est-sim').addEventListener('change',e=>{if(e.target.id==='sim-on'){SIM.on=e.target.checked;simTodos();simSave()}});
$('#est-sim').addEventListener('click',e=>{if(e.target.closest('#sim-reset')){SIM.res={};SIM.rec={};SIM.on=true;simTodos();simSave();return}
  const b=e.target.closest('[data-simok],[data-simko]');if(!b||b.disabled)return;
  const k=b.dataset.simok||b.dataset.simko;SIM.res[k]={...(SIM.res[k]||{}),ok:!!b.dataset.simok};simSave()});
$('#est-sim').addEventListener('change',e=>{const t=e.target,d=t.dataset;
  if(d.simcal){SIM.res[d.simcal]={...(SIM.res[d.simcal]||{ok:true}),cal:+t.value};simSave()}
  else if(d.simcalr){SIM.res[d.simcalr]={...(SIM.res[d.simcalr]||{ok:false}),calR:+t.value};simSave()}
  else if(d.simrec!==undefined){if(t.value)SIM.rec[d.simrec]={...(SIM.rec[d.simrec]||{}),forma:t.value};else delete SIM.rec[d.simrec];simSave()}
  else if(d.simreccal){SIM.rec[d.simreccal]={...(SIM.rec[d.simreccal]||{}),cal:+t.value};simSave()}});

SATE.pestana('trayectoria',{
  montar(){
    prepararSeccion($('#desempeno-simulacion'),'simulacion');
    $('#desempeno-titulo').textContent=SATE.texto('sate.pestana.trayectoria.titulo');
    $('#desempeno-sim-titulo').textContent=SATE.texto('sate.desempeno.sim_titulo');
    $('#desempeno-lector').textContent=SATE.texto('sate.desempeno.lector');
    $('#desempeno-lector').addEventListener('click',()=>SAES.open());
    $('#desempeno-explorar').textContent=SATE.texto('sate.trayectoria.explorar');
    $('#desempeno-explorar').addEventListener('click',()=>SATE.ir('mapa'));
  },
  mostrar(){
    SATE.presente?.mostrar();
    const personal=isPersonal();
    $('#desempeno-lector').textContent=SATE.texto('sate.encabezado.'+(ALUMNO&&!ALUMNO.demo?'actualizar':'cargar'));
    $('#desempeno-vacio').hidden=personal;
    $('#desempeno-vacio-texto').textContent=SATE.texto('sate.trayectoria.sin_datos');
    $('#desempeno-simulacion').hidden=!personal;
    $('#kstats').hidden=!personal;
    const abrir=SATE.simAbrir;SATE.simAbrir=false;
    if(abrir)$('#desempeno-simulacion').open=true;
    if(abrir&&!personal)$('#desempeno-lector').focus();
    if(!personal){++ST_RENDER;return}
    renderSimulacion();
    const pendiente=renderStatsVista().catch(SATE.error);
    if(abrir)$('#desempeno-sim-titulo').focus();
    return pendiente;
  },
  ocultar(){++ST_RENDER;SateUI.cerrarModal()}
});
