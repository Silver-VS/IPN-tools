async function renderStatsVista(){
  const revision=++ST_RENDER;
  const box=$('#kstats'),btn=$('#stats-btn');if(!box||!btn)return;
  const on=isPersonal()&&SATE.actual?.pestana==='desempeno';btn.hidden=!isPersonal();btn.setAttribute('aria-expanded',String(on));
  {let gancho='';if(!on&&isPersonal()){try{const d=statsDatos();if(d.fin!=null)gancho=`A tu ritmo terminarías en <b>${perName(d.fin)}</b>`;else if(d.falta===0)gancho='Ya cubriste los créditos de tu plan'}catch(e){}}
    btn.innerHTML=on?`<span class="sb-link">Ocultar análisis</span><svg class="chev" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      :`<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M3 17V9M8 17V4M13 17v-6M18 17V7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>${gancho?`<span class="sb-hook">${gancho}</span><span class="sb-sep" aria-hidden="true">·</span>`:''}<span class="sb-link">${gancho?'Ver mi análisis':'Ver mi análisis: avance, kárdex y metas'}</span><svg class="chev" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
  box.hidden=!on;
  if(!on)return;
  const D=statsDatos(), A=ALUMNO;
  const Dde=blk=>usaSim(blk)===SIM.on?D:conSim(usaSim(blk),statsDatos), Dc=Dde('camino'), Dk=Dde('kardex'), Da=Dde('areas');
  
  const f2=v=>v==null||!isFinite(v)?'—':(+v).toFixed(2), sg=v=>v==null?'':(v>=0?'+':'')+v.toFixed(2);
  const plazo=plazoReferencia(A), dur=plazo.dur, cursados=A.avance?.cursados, limite0=plazo.max&&cursados!=null&&D.actual!=null?1:null, totalPer=D.nper!=null&&cursados!=null?D.fin!=null&&D.actual!=null?cursados+D.fin-D.actual:cursados:null;
  const kpi=(lbl,val,viz,sub='',ayuda='',cls='')=>`<div class="kpi"><span>${lbl}${ayuda?' '+info(ayuda):''}</span><div class="kpi-v"><b class="${cls}">${val}</b>${viz||''}</div>${sub?`<small>${sub}</small>`:''}</div>`;
  // promedio: regla 6–10 con tu marca
  const regla=v=>v==null?'':`<span class="k-regla" aria-hidden="true"><i style="left:${Math.max(0,Math.min(100,(v-6)/4*100))}%"></i><em>6</em><em>10</em></span>`;
  // calificaciones: mini histograma 6–10
  const cuenta=[6,7,8,9,10].map(g=>D.rows.filter(r=>Math.round(r.cal)===g).length), cmax=Math.max(1,...cuenta), moda=[6,7,8,9,10].filter((g,j)=>cuenta[j]===Math.max(...cuenta)).sort((x,y)=>Math.abs(x-(D.mediana??8))-Math.abs(y-(D.mediana??8)))[0];   // en empate, la más cercana a la mediana
  const hist=`<span class="k-hist" aria-hidden="true">${cuenta.map((n,j)=>`<i class="g${j+6}" style="height:${Math.max(2,n/cmax*100)}%" title="${n} con ${j+6}"></i>`).join('')}</span>`;
  // ordinario: anillo de porcentaje
  const pct=D.ord!=null?Math.round(D.ord*100):null, Rr=15, Cc=2*Math.PI*Rr;
  const anillo=pct==null?'':`<svg class="k-anillo" viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><circle cx="20" cy="20" r="${Rr}" fill="none" stroke="var(--line)" stroke-width="6"/><circle cx="20" cy="20" r="${Rr}" fill="none" stroke="var(--ok)" stroke-width="6" stroke-dasharray="${(pct/100*Cc).toFixed(1)} ${Cc.toFixed(1)}" transform="rotate(-90 20 20)"/></svg>`;
  const otras=[['EXT','extraordinario','extraordinarios'],['ETS','ETS','ETS'],['REC','recursada','recursadas']].map(([c,u,v])=>{const n=D.rows.filter(r=>r.codigo===c).length;return [n,n===1?u:v]}).filter(([n])=>n);
  // créditos por periodo: mini barras de los últimos periodos
  const ult=D.porPer.filter(d=>d.cr!=null&&!d.sim).slice(-6), crmax=Math.max(1,...ult.map(d=>d.cr));
  const barras=ult.length?`<span class="k-bars" aria-hidden="true">${ult.map(d=>`<i style="height:${Math.max(4,d.cr/crmax*100)}%" title="${esc(d.lbl)}: ${fmtCr(d.cr)} créditos"></i>`).join('')}</span>`:'';
  const dTxt=D.delta!=null&&Math.abs(D.delta)>=.01?`<em class="${D.delta>0?'up':'down'}">${D.delta>0?'▲':'▼'} ${Math.abs(D.delta).toFixed(2)}</em> frente al periodo anterior`:`${D.rows.length} materias`;
  box.innerHTML=`${D.avisos.length?`<p class="st-note">${D.avisos.map(esc).join(' ')}</p>`:''}<div class="kpis">
      ${kpi(D.rows.some(r=>r.sim)?'Promedio sin reprobadas · simulado':'Promedio sin reprobadas',f2(D.media),regla(D.media),dTxt,`Promedio de tus ${D.rows.length} materias acreditadas (incluye equivalencias y revalidaciones). A diferencia del promedio oficial, no cuenta reprobadas ni no acreditadas: las que debes se acreditarán con calificación aprobatoria.`)}
      ${kpi('Tus calificaciones',moda!=null&&D.rows.length?String(moda):'—',hist,moda!=null&&D.rows.length?`la más frecuente · mediana ${f2(D.mediana)}`:'',`Cuántas materias aprobaste con cada calificación, de 6 a 10. Desviación estándar: ${f2(D.sd)} (entre más baja, más parejas).`)}
      ${kpi('En ordinario',pct!=null?pct+' %':'—',anillo,otras.length?otras.map(([n,l])=>`<span class="k-chip">${n} ${l}</span>`).join(' '):'sin extraordinarios',`Materias aprobadas en ordinario entre ${D.formasN} aprobadas en ordinario, extraordinario, ETS o recurse${D.formasExcluidas?`; no cuenta ${D.formasExcluidas} por equivalencia u otra vía`:''}.`)}
      ${kpi('Créditos por periodo',D.ritmo?fmtCr(D.ritmo):'—',barras,D.ritmo?`promedio de ${D.ritmoN} periodos`:'',`Créditos aprobados en promedio en tus últimos ${D.ritmoN} periodos${D.ritmoNota?'; '+D.ritmoNota:''}.`)}
    </div>
    ${conSim(usaSim('pm'),()=>promMetaPanel(statsDatos()))}
    <div class="charts">
      <figure class="ch-wide"><figcaption><b>Tu camino en la carrera ${simTag('camino')}</b>${ley([['cuadro','var(--accent)','Acreditado'],['rayado','var(--accent)',Dc.simulado?'Simulado':'En curso'],['cuadro','var(--line)','Te falta'],['marca','var(--accent)','Estimado a tu ritmo'],...(totalPer!=null&&plazo.max&&totalPer>plazo.max?[['anillo','var(--ch-alert)','Rebasa el plazo']]:[])])}</figcaption><div id="ch-camino"></div></figure>
    </div>
    ${conSim(usaSim('meta'),()=>metaPanel(statsDatos()))}
    <div class="charts">
      <figure class="ch-wide"><figcaption><b>Tu kárdex por periodo ${simTag('kardex')}</b>${ley([['grado','','Calificación'],...[['E','Extraordinario'],['T','ETS'],['R','Recurse']].filter(([l])=>Dk.rows.some(r=>({EXT:'E',ETS:'T',REC:'R'})[r.codigo]===l)).map(([l,t])=>['letra',l,t]),...(Dk.rows.some(r=>r.sim)?[['simulada','var(--fg)','Simulada']]:[])])}</figcaption><div id="ch-kx"></div></figure>
      <figure class="ch-wide"><figcaption><b>Tus áreas frente a tu promedio ${simTag('areas')}</b>${ley([['vertical','var(--fg)',`Tu promedio sin reprobadas: ${Da.media!=null?Da.media.toFixed(2):'—'}`],['cuadro','var(--ok)','Por arriba'],['cuadro','var(--muted)','Similar (±0.25)'],['cuadro','var(--ch-alert)','Por debajo']])}</figcaption><div id="ch-cat"></div></figure>
    </div>
    <div class="kanal" id="kanal"></div>
    ${D.rows.some(r=>r.eqv)?`<p class="st-note">${D.rows.filter(r=>r.eqv).length} ${D.rows.filter(r=>r.eqv).length===1?'materia reconocida':'materias reconocidas'} por equivalencia, revalidación o dictamen (${D.crEqv==null?'créditos incompletos':fmtCr(D.crEqv)+' créditos'}) ${info('Equivalencia: materia de otra carrera o plan del IPN (por ejemplo, cambio de carrera). Revalidación: materia cursada en otra institución, incluida la movilidad académica nacional o internacional. Dictamen: reconocimiento por resolución académica. Todas cuentan en tus promedios, áreas y créditos; como el SAES las registra al reconocerlas y no en el periodo en que se cursaron, no entran en el promedio por periodo ni en tu ritmo de créditos.')}</p>`:''}`;
  if(!D.rows.length){const cs=box.querySelectorAll('.charts');cs[0].innerHTML='<p class="muted">Aún no hay calificaciones aprobadas para graficar.</p>';cs.forEach((x,j)=>{if(j)x.remove()});conSim(usaSim('obs'),()=>renderAnalisis(statsDatos()));return}
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));   // ancho final de los contenedores
  if(revision!==ST_RENDER)return;
  try{await cargarPlot()}catch(e){if(revision!==ST_RENDER)return;{const cs=box.querySelectorAll('.charts');cs[0].innerHTML=`<p class="muted">${esc(e.message)}</p>`;cs.forEach((x,j)=>{if(j)x.remove()})}conSim(usaSim('obs'),()=>renderAnalisis(statsDatos()));return}
  if(revision!==ST_RENDER)return;
  conSim(usaSim('obs'),()=>renderAnalisis(statsDatos()));
  const P=window.Plot, cs=getComputedStyle(document.documentElement), tok=n=>cs.getPropertyValue(n).trim();
  const ACC=tok('--accent'), OK=tok('--ok'), MUT=tok('--muted'), LINE=tok('--line');
  const base=el=>({width:Math.max(260,$(el).clientWidth),style:{background:'transparent',color:tok('--fg'),fontSize:'11px',fontFamily:'inherit',overflow:'visible'},marginLeft:40,marginBottom:32});
  const put=(id,fig)=>montarGrafica($(id),fig);
  const tickPer=d=>perName(d);
  // 1) camino en la carrera: regla del plan completo con lo acreditado, lo que está en curso y la estimación por periodo
  {const host=$('#ch-camino'), tot=Dc.total;
    if(!(tot>0)||Dc.obt==null){host.innerHTML='<p class="muted">Faltan los créditos del plan para dibujar tu camino.</p>'}else{
      const ec=Dc.simulado?0:[...new Set(tr().enCurso)].reduce((t,k)=>t+(cur()[k]?.[1]||0),0);
      const hecho=Math.min(tot,Dc.obt-(Dc.simCr||0)), sim=Math.min(tot-hecho,Dc.simCr||0), curso=Math.min(tot-hecho-sim,ec);
      const pc=v=>(v/tot*100).toFixed(2)+'%';
      const proy=proyeccionCreditos(Dc).slice(1), cursados=A.avance?.cursados;
      const inicio=Dc.actual!=null&&cursados!=null?Dc.actual-cursados+1:null, limite=plazo.max&&inicio!=null?inicio+plazo.max-1:null;
      const W=host.clientWidth||600;let ult=-1e9;
      const marcas=(lst,cls)=>lst.map(d=>{const x=d.acum/tot*W, ver=x-ult>=46;if(ver)ult=x;
        const pp=d.acum/tot*100;
        return `<span class="cm-m ${cls}${limite!=null&&d.per>limite?' fuera':''}${pp>94?' der':pp<6?' izq':''}" style="left:${pc(d.acum)}" title="${esc(perName(d.per))}: ${fmtCr(d.acum)} créditos${cls==='fut'?' (estimado)':''}">${ver?esc(perName(d.per)):''}</span>`}).join('');
      ult=-1e9;const pasado=marcas(Dc.curva.filter(d=>!d.sim),'pas');ult=-1e9;const futuro=marcas(proy,'fut');
      const fin=Dc.falta===0?'Créditos completos':Dc.fin!=null?`Terminarías en <b>${esc(perName(Dc.fin))}</b>${totalPer?` (unos ${totalPer} periodos en total)`:''}`:'';
      host.innerHTML=`<p class="cm-h"><span class="cm-n"><b>${fmtCr(Dc.obt)}</b> de ${fmtCr(tot)} créditos · ${Math.round(Dc.obt/tot*100)} %${Dc.falta?` · te faltan ${fmtCr(Dc.falta)}`:''}</span><span>${fin}</span></p>`+
        `<div class="cm-past">${pasado}</div><div class="cm-track"><i class="hecho" style="width:${pc(hecho)}"></i><i class="rayado" style="width:${pc(sim+curso)}"></i></div><div class="cm-fut">${futuro}</div>`+
        (limite!=null&&totalPer>plazo.max?`<p class="cm-alerta">A tu ritmo rebasarías el plazo de referencia de ${plazo.max} periodos (${esc(perName(limite))}).</p>`:'')+
        (plazo.max?`<p class="cm-ref">Plazo de referencia: ${plazo.max} periodos ${info(plazo.calculado?`${fmtCr(A.carga.total)} créditos del plan ÷ ${fmtCr(A.carga.min)} de carga mínima. El SAES indica una duración de ${A.carga.duracion??'—'} y un máximo de ${A.carga.duracion_max??'—'} periodos; confirma tu plazo con Gestión Escolar.`:'Plazo máximo indicado por el SAES.')}</p>`:'')}}
  // 2) kárdex por periodo: cada materia es un cuadro con su calificación; encabezado con promedio y créditos
  {const host=$('#ch-kx');
    const col=(t,sub,rs)=>`<div class="kx-col"><div class="kx-h"><b>${esc(t)}</b><small>${sub}</small></div><div class="kx-cs">${rs.slice().sort((a,b)=>b.cal-a.cal).map(r=>{
      const l={EXT:'E',ETS:'T',REC:'R'}[r.codigo]||'';
      return `<span class="kx-c g${Math.round(r.cal)}${r.sim?' sim':''}" title="${esc(r.nombre)} · ${r.cal} · ${esc(r.forma)}${r.sim?' · simulada':''}">${r.cal}${l?`<i>${l}</i>`:''}</span>`}).join('')}</div></div>`;
    const eq=Dk.rows.filter(r=>r.eqv), sinP=Dk.rows.filter(r=>!r.eqv&&r.per==null);
    let prev=null;
    host.innerHTML=`<div class="kx">`+(eq.length?col('Equivalencias',`${eq.length} materias`,eq):'')+
      Dk.porPer.filter(d=>d.n).map(d=>{const rs=Dk.rows.filter(r=>!r.eqv&&r.per===d.per), dif=prev!=null?d.prom-prev:null;prev=d.prom;
        return col(d.lbl,`${f2(d.prom)}${dif!=null&&Math.abs(dif)>=.01?` <em class="${dif>0?'up':'down'}">${dif>0?'▲':'▼'}</em>`:''} · ${d.cr!=null?fmtCr(d.cr)+' cr':''}`,rs)}).join('')+
      (sinP.length?col('Sin periodo',`${sinP.length} materias`,sinP):'')+`</div>`}
  // 3) áreas frente a tu promedio: barras divergentes alrededor de tu promedio de aprobadas
  const porArea=d3.groups(Da.rows,r=>r.cat).map(([cat,v])=>({cat,media:d3.mean(v,r=>r.cal),n:v.length})).map(d=>({...d,dif:d.media-Da.media})).sort((a,b)=>b.dif-a.dif);
  // escala fija de al menos ±2.5 puntos: diferencias pequeñas se ven pequeñas; ±0.25 se considera similar (gris)
  const lim=Math.max(2.5,...porArea.map(d=>Math.abs(d.dif)*1.2)), ALT=tok('--ch-alert')||'#d9480f', SIM_=Math.abs, col=d=>SIM_(d.dif)<.25?MUT:d.dif>0?OK:ALT;
  put('#ch-cat',P.plot({...base('#ch-cat'),height:Math.max(150,porArea.length*28+50),marginLeft:$('#ch-cat').clientWidth<480?118:160,marginRight:20,
    x:{axis:null,domain:[-lim,lim]},y:{label:null,domain:porArea.map(d=>d.cat),padding:.3},
    marks:[P.rectX([0],{x1:-.25,x2:.25,fill:MUT,fillOpacity:.06}),
      P.barX(porArea,{x:'dif',y:'cat',fill:col,fillOpacity:.6,rx:3,tip:true,title:d=>`${d.cat}\npromedio ${f2(d.media)} (${d.n} ${d.n>1?'materias':'materia'})\n${d.dif>=0?'+':''}${d.dif.toFixed(2)} frente a tu promedio`}),
      P.text(porArea.filter(d=>d.dif>=0),{x:'dif',y:'cat',text:d=>`${d.media.toFixed(1)} (${d.n})`,dx:6,textAnchor:'start',fill:tok('--fg'),fontWeight:600}),
      P.text(porArea.filter(d=>d.dif<0),{x:'dif',y:'cat',text:d=>`${d.media.toFixed(1)} (${d.n})`,dx:-6,textAnchor:'end',fill:tok('--fg'),fontWeight:600}),
      P.ruleX([0],{stroke:tok('--fg'),strokeWidth:1.5})]}));
}

