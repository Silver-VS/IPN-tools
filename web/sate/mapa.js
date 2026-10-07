function renderMap(){return conSim(usaSim('mapa'),()=>conPlan(renderMap0,0))}
function renderMap0(){
  $('#mapcut').hidden=true;   // se vuelve a mostrar si aplica (mapa con trayectoria y datos del SAES)
  const mv=mview();document.querySelectorAll('[data-mview]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mview===mv)));
  $('#mapwrap').hidden=mv==='lista';$('#zoomseg').hidden=mv==='lista';$('#tlist').hidden=mv!=='lista';
  const L=MAP().layout, wrap=$('#mapwrap'), el=$('#map');
  MARK=conPlan(()=>isPersonal()?{avail:new Set(Object.keys(cur()).filter(k=>cur()[k][3]==='O'&&available(k)&&!statusOf(k).includes('fail'))),sug:new Set(SHOWSUG?suggestions().list:[])}:{avail:new Set(),sug:new Set()},S.planPaso);
  $('#sug-tgl').hidden=!isPersonal();$('#sug-on').checked=SHOWSUG;
  const want=planElegidas(), off=offeredClaves(), pre=prereqs();
  const done=new Set(tr().done), req=new Set([...ancestors(want)].filter(k=>!want.has(k)&&!done.has(k)));
  // cadena de requisitos y dependientes de la materia bajo el cursor
  let hot=null;
  if(S.mapHover){
    hot=new Set([S.mapHover]);
    const post={};Object.entries(pre).forEach(([b,as])=>as.forEach(a=>(post[a]=post[a]||[]).push(b)));
    const walk=(k,g)=>{(g[k]||[]).forEach(x=>{if(!hot.has(x)){hot.add(x);walk(x,g)}})};
    walk(S.mapHover,pre);hot.pre=new Set([...hot].filter(x=>x!==S.mapHover));   // requisitos (antes)
    const antes=new Set(hot);walk(S.mapHover,post);hot.post=new Set([...hot].filter(x=>!antes.has(x)));   // lo que desbloquea (después)
  }
  renderInsp();
  if(!L){ // carrera sin trayectoria propuesta: cuadrícula por nivel del SAES
    const by={};Object.entries(cur()).forEach(([k,v])=>(by[v[2]]=by[v[2]]||[]).push(k));
    const cols=Math.max(...Object.values(by).map(a=>a.length)), bw=118, bh=48, gx=10, gy=18, lw=40;
    const w=lw+cols*(bw+gx)+10, h=Object.keys(by).length*(bh+gy)+gy;
    const sc=ZOOM??Math.min(1.2,Math.max(.6,(wrap.clientWidth-4)/w));MAPSC=sc;
    let html=`<svg width="${w*sc}" height="${h*sc}" aria-hidden="true">`;
    Object.keys(by).sort((a,b)=>a-b).forEach((n,i)=>{const y=gy/2+i*(bh+gy);html+=`<rect class="band" x="0" y="${y*sc}" width="${w*sc}" height="${(bh+gy/2)*sc}"/><text class="rowlbl" x="${12*sc}" y="${(y+bh/2+5)*sc}" font-size="${16*sc}">${n}</text>`});
    html+='</svg>';
    Object.keys(by).sort((a,b)=>a-b).forEach((n,i)=>by[n].forEach((k,j)=>{
      const x=lw+j*(bw+gx), y=gy/2+i*(bh+gy)+gy/4;
      html+=boxHtml(k,x,y,bw,bh,sc,want,off,hot,+n,req);
    }));
    el.style.width=w*sc+'px';el.style.height=h*sc+'px';el.innerHTML=html;$('#areas').hidden=true;
    $('#mapnote').innerHTML='<li>Esta carrera aún no tiene una trayectoria recomendada: se muestran sus materias por nivel según el SAES, sin seriación.</li>';
    return;
  }
  let sc=ZOOM??Math.min(1.1,Math.max(.2,(wrap.clientWidth-2)/L.w));MAPSC=sc;
  const FILL=slotFill(L,want);
  /* Con datos del SAES, lo que sigue va a la vista: los semestres ya completos al inicio del mapa se dibujan
     compactos (menos alto, mismas materias y flechas) y el primero con algo pendiente queda a tamaño normal.
     Nada se oculta; la vista «Mapa completo» lo desactiva (preferencia mapVista). */
  const bands=rowBands(L);let nPend=0;
  if(isPersonal()){
    const pend=bands.findIndex(([n,y,a,b])=>L.boxes.some(([bx,by,bw,bh,k,slot],i)=>{const cy=by+bh/2;if(cy<a||cy>=b)return false;
      if(k)return !done.has(k)&&!isElec(k);const f=FILL.get(i);return /^optativa/i.test(slot)&&!(f?.k&&done.has(f.k))}));
    if(pend>0)nPend=pend;
  }
  /* Enfoque: el bloque de lo que sigue (cajas pendientes, en curso o espacios de optativa por cubrir desde la primera
     fila pendiente). Sin zoom del alumno, el mapa se acerca para que ese bloque llene el ancho y se desplaza hasta él. */
  let FOCO=null;const vista=mapVista();
  // «Recomendaciones»: lo que puedes cursar el siguiente periodo (sugeridas, disponibles y por recursar);
  // «Pendientes»: todo lo que falta. Si no hay recomendaciones, se usa «Pendientes».
  const recom=new Set([...MARK.sug,...MARK.avail,...(isPersonal()?tr().fail:[])]);
  if(isPersonal()&&nPend&&vista!=='todo'){
    const y0=bands[nPend][2];let fx0=Infinity,fx1=-Infinity;
    const enFoco=(k,slot,f)=>vista==='sigue'&&recom.size?recom.has(k):k?!done.has(k)&&!isElec(k):/^optativa/i.test(slot)&&!(f?.k&&done.has(f.k));
    L.boxes.forEach(([bx,by,bw,bh,k,slot],i)=>{if(by+bh/2<y0)return;const f=FILL.get(i);
      if(enFoco(k||f?.k,slot,f)){fx0=Math.min(fx0,bx);fx1=Math.max(fx1,bx+bw)}});
    if(fx1>fx0){FOCO={x0:Math.max(0,fx0-24),x1:Math.min(L.w,fx1+24),y0};
      if(ZOOM==null){sc=Math.min(1.1,Math.max(.2,(wrap.clientWidth-2)/(FOCO.x1-FOCO.x0)));MAPSC=sc}}
  }
  const full=vista==='todo', KC=nPend&&!full?0:1;   // filas completadas: plegadas (se ven en el minimapa)
  const mc=$('#mapcut');mc.hidden=!nPend;
  if(nPend){
    const fila=porNiveles()?['Nivel','Niveles']:['Semestre','Semestres'];
    $('#mapcut-sim').innerHTML=simTag('mapa');
    $('#mapcut-txt').textContent=(nPend>1?`${fila[1]} ${bands[0][0]} a ${bands[nPend-1][0]} acreditados`:`${fila[0]} ${bands[0][0]} acreditado`)+'. '+
      (full?'Se muestra el mapa completo.':vista==='sigue'&&recom.size?'Se muestran primero las materias que puedes cursar el siguiente periodo.':'Se muestran primero las materias que te faltan.');
  }
  if(isPersonal()){
    const col=st=>st==='done'?'var(--ok)':st.startsWith('curso')?'var(--accent)':/fail|late/.test(st)?'var(--bad)':st.includes('lock')||st.includes('far')?'var(--line)':'var(--warn)';
    const cnt={done:0,curso:0,fail:0,late:0,pend:0};
    let mm=`<svg viewBox="0 0 ${L.w} ${L.h}" role="img" aria-hidden="true">`;
    bands.forEach(([n,y,a,b],i)=>{if(i%2===0)mm+=`<rect x="0" y="${a}" width="${L.w}" height="${b-a}" fill="var(--sunken)"/>`;if(i===nPend&&nPend){const fx=FOCO?FOCO.x0:1,fw=FOCO?FOCO.x1-FOCO.x0:L.w-2;mm+=`<rect x="${fx}" y="${a}" width="${fw}" height="${L.h-a-1}" fill="none" stroke="var(--accent)" stroke-width="4" stroke-dasharray="14 8" rx="8"/>`}});
    L.edges.forEach(([s0,d0,pp])=>{const pts=[];for(let i=0;i<pp.length;i+=2)pts.push(pp[i]+','+pp[i+1]);mm+=`<polyline points="${pts.join(' ')}" fill="none" stroke="var(--muted)" stroke-opacity=".35" stroke-width="3"/>`});
    L.boxes.forEach(([x,y,w,h,k,slot],i)=>{const kk=k||FILL.get(i)?.k, cx=x+w/2, cy=y+h/2, r=Math.min(w,h)*.3;
      if(!kk){if(/^optativa/i.test(slot)){mm+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--warn)" stroke-width="4" stroke-dasharray="6 5"/>`;cnt.pend++}return}
      if(isElec(kk))return;const st=statusOf(kk);
      cnt[st==='done'?'done':st.startsWith('curso')?'curso':st.includes('fail')?'fail':st.startsWith('late')?'late':'pend']++;
      mm+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${col(st)}"/>`});
    mm+='</svg>';
    $('#minimap').innerHTML=mm;$('#mapcut').hidden=false;
    $('#mm-leg').innerHTML=`<span><i style="background:var(--ok)"></i>${cnt.done} acreditadas</span>`+(cnt.curso?`<span><i style="background:var(--accent)"></i>${cnt.curso} en curso</span>`:'')+
      (cnt.fail?`<span><i style="background:var(--bad)"></i>${cnt.fail} por recursar</span>`:'')+(cnt.late?`<span><i style="background:var(--bad)"></i>${cnt.late} atrasadas</span>`:'')+`<span><i style="background:var(--warn)"></i>${cnt.pend} por cursar</span>`;
    if(!nPend){$('#mapcut-txt').textContent='Aún no hay '+(porNiveles()?'niveles':'semestres')+' completos; se muestra el mapa completo.';$('#mapvista').hidden=true}else $('#mapvista').hidden=false;
    document.querySelectorAll('#mapvista [data-vista]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vista===vista)));
  }
  // y del PDF -> y dibujada: lineal por tramos (las bandas completadas se encogen)
  const kOf=i=>i<nPend?KC:1, tops=[];let acc=bands.length?bands[0][2]:0;
  bands.forEach(([n,y,a,b],i)=>{tops.push(acc);acc+=(b-a)*kOf(i)});
  const bandOf=y=>{for(let i=0;i<bands.length;i++)if(y<bands[i][3])return i;return bands.length-1};
  const Y=y=>{if(!bands.length||y<=bands[0][2])return y;const i=bandOf(y);const [,,a,b]=bands[i];return y>=b&&i===bands.length-1?tops[i]+(b-a)*kOf(i)+(y-b):tops[i]+(y-a)*kOf(i)};
  const H=Y(L.h);
  let svg=`<svg width="${L.w*sc}" height="${H*sc}" viewBox="0 0 ${L.w} ${H}" aria-hidden="true"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--edge)"/></marker><marker id="ahh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker><marker id="ahpre" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--rel-pre)"/></marker><marker id="ahpost" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--rel-post)"/></marker></defs>`;
  bands.forEach(([n,y,a,b],i)=>{const k=kOf(i);if(!k)return;if(i%2===0)svg+=`<rect class="band" x="0" y="${Y(a)}" width="${L.w}" height="${(b-a)*k}"/>`;svg+=`<text class="rowlbl" x="12" y="${Y(y)+6*k}" font-size="${18*Math.max(k,.7)}">${n}</text>`});
  /* Flechas lejanas (saltan filas o cruzan varias columnas) no se dibujan: su requisito se cursa muchas materias antes.
     Aparecen completas al resaltar una de sus materias, junto con toda la cadena. */
  L.edges.forEach(([s,d,p,larga,ls,ld])=>{
    const bs=L.boxes[s];if(!kOf(bandOf(bs[1]+bs[3]/2)))return;   // sale de un semestre plegado: no se dibuja
    const a=L.boxes[s][4], b=L.boxes[d][4], on=hot&&hot.has(a)&&hot.has(b);
    const pts=[];for(let i=0;i<p.length;i+=2)pts.push([p[i],Y(p[i+1])]);
    const lado=on?(b===S.mapHover||hot.pre.has(b)?'pre':'post'):'';
    const cls=`edge${L.propuesto?' prop':''}${on?' hot '+lado:hot?' dim':''}${!hot&&isPersonal()&&done.has(b)?' past':''}`, mk=`marker-end="url(#${on?'ah'+lado:'ah'})"`;
    if(L.rutas&&larga&&!on)return;   // lejana: el requisito ya se cursó muchas materias antes; se ve al resaltar
    svg+=L.rutas?`<path class="${cls}" d="${rutaRedonda(pts)}" ${mk}/>`:`<polyline class="${cls}" points="${pts.map(q=>q.join(',')).join(' ')}" ${mk}/>`;
  });
  svg+='</svg>';
  let html=svg;
  // caja en fila compacta: misma posición relativa, menos alto y letra más chica
  const compacta=(h0,y0,h)=>{const k=kOf(bandOf(y0+h/2));if(k===1)return h0;if(!k)return '';return h0.replace(/font-size:([\d.]+)px/,(m,v)=>`font-size:${(+v*Math.max(k,.62)).toFixed(2)}px`).replace('class="box ','class="box compact ')};
  L.boxes.forEach(([x,y0,w,h0,k,slot,sem],i)=>{
    const f=FILL.get(i), y=Y(y0), h=h0*kOf(bandOf(y0+h0/2));
    if(!k&&f?.k){html+=compacta(boxHtml(f.k,x,y,w,h,sc,want,off,hot,sem,req).replace('class="box ','class="box optfill '),y0,h0);return}
    if(!kOf(bandOf(y0+h0/2)))return;   // fila plegada
    if(!k&&f?.sigue){html+=`<div class="box slot${hot?' dim':''}" style="left:${x*sc}px;top:${y*sc}px;width:${w*sc}px;height:${h*sc}px;font-size:${9*sc}px" title="${esc(slot)}: continúa tu línea con ${esc(cur()[f.sigue][0])}">${esc(slot)}<small class="slot-sig">sigue: ${esc(pretty(cur()[f.sigue][0]).replace(/\s*\(.*\)$/,''))}</small></div>`;return}
    if(k) html+=compacta(boxHtml(k,x,y,w,h,sc,want,off,hot,sem,req),y0,h0);
    else html+=compacta(`<div class="box slot${hot?' dim':''}" style="left:${x*sc}px;top:${y*sc}px;width:${w*sc}px;height:${h*sc}px;font-size:${9.5*sc}px" title="${esc(slot)}: ${/^electiva/i.test(slot)?'se acredita con actividades validadas por horas (Electivas UPIITA), no con un grupo del horario':'cualquiera de las ofertadas'}">${esc(slot)}</div>`,y0,h0);
  });
  el.style.width=L.w*sc+'px';el.style.height=H*sc+'px';el.innerHTML=html;
  if(FOCO&&ZOOM==null){const c=((FOCO.x0+FOCO.x1)/2)*sc-wrap.clientWidth/2;requestAnimationFrame(()=>{wrap.scrollLeft=Math.max(0,c)})}
  const ar=$('#areas');ar.hidden=!L.cols;ar.style.width=L.w*sc+'px';
  // columnas que agrupan áreas pequeñas («A · B»): un renglón por área y letra un poco menor
  ar.innerHTML=(L.cols||[]).map(([n,a,b])=>{const k=n.includes(' · ')?.82:1;return `<div style="left:${a*sc}px;width:${(b-a)*sc}px;font-size:${Math.max(8,Math.min(14,13*sc*1.4)*k)}px;white-space:pre-line" title="${esc(n)}">${esc(n.replaceAll(' · ','\n'))}</div>`}).join('');
  // notas del mapa: una idea por renglón (no un párrafo de oraciones encadenadas)
  const notas=[];
  if(L.nota)notas.push(...L.nota.split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ¿])/));
  else if(L.propuesto)notas.push('Esta carrera aún no tiene una trayectoria recomendada: las áreas y la seriación (líneas punteadas) son una propuesta hecha a partir del plan de estudios oficial, sujeta a validación por la academia.');
  else notas.push('Trayectoria recomendada: las flechas indican la seriación recomendada.',
    'Se sombrean las materias que conviene aprobar antes de las que elegiste; en cursiva, las que no tienen grupos en el periodo consultado.');
  notas.push(`${tactil()?'Al tocar':'Al colocar el cursor sobre'} una materia se resaltan en azul sus requisitos (antes) y en naranja las materias que desbloquea (después).`);
  if(porNiveles())notas.push('En este plan las materias se organizan por niveles (1, 2, 3…), no por semestres: el nivel indica el orden recomendado y en un mismo periodo puedes inscribir materias de distintos niveles si cumples sus requisitos y las reglas de inscripción de tu unidad académica.');
  if(L.rutas&&L.edges.some(e=>e[3]))notas.push('Para no saturar el mapa, las flechas entre materias muy alejadas no se dibujan; aparecen al resaltar una materia.');
  if(L.ocultas)notas.push(`Se omiten ${L.ocultas} flechas redundantes (requisitos que ya llegan a través de otra materia de la cadena).`);
  $('#mapnote').innerHTML=notas.map(t=>`<li>${esc(t)}</li>`).join('');
}
/* Espacios de optativas del mapa: se llenan con las optativas acreditadas, en curso o elegidas (primero las del
   mismo semestre; si no coincide, en el siguiente espacio libre). Un espacio unido por flecha a otro ya ocupado
   toma la continuación de esa línea (ESCOM ISC: optativa de 6.º -> 7.º) o la sugiere. */
function slotFill(L,want){
  const out=new Map(), c=cur(), t=isPersonal()?tr():{done:[],curso:[]};
  const rank=k=>t.done.includes(k)?0:t.curso.includes(k)?1:want.has(k)?2:9;
  const cands=Object.keys(c).filter(k=>c[k][3]==='P'&&!isElec(k)&&rank(k)<9).sort((a,b)=>rank(a)-rank(b)||c[a][2]-c[b][2]);
  const slots=L.boxes.map((b,i)=>[i,b]).filter(([,b])=>!b[4]&&/^optativa/i.test(b[5])).sort((a,b)=>a[1][6]-b[1][6]||a[1][0]-b[1][0]);
  const used=new Set(), dep=dependents(), next=i=>L.edges.filter(e=>e[0]===i).map(e=>e[1]);
  const put=(i,k)=>{out.set(i,{k});used.add(k)};
  // el espacio con nivel conocido (b[7], UPIITA) solo lo cubre una optativa de ese nivel; N espacios del nivel, N optativas
  for(const [i,b] of slots){if(out.has(i))continue;const k=cands.find(k=>!used.has(k)&&c[k][2]===(b[7]||b[6]));if(k)put(i,k)}
  for(const [i,b] of slots){if(out.has(i)||b[7])continue;const k=cands.find(k=>!used.has(k));if(k)put(i,k)}
  // continuación de la línea en el espacio siguiente (flecha entre espacios)
  for(const [i] of slots){const f=out.get(i);if(!f?.k)continue;
    for(const j of next(i)){const sig=(dep[f.k]||[]).find(x=>c[x]?.[3]==='P');if(!sig)continue;
      if(L.boxes[j][7]&&c[sig][2]!==L.boxes[j][7])continue;
      const cur_=out.get(j);if(cur_?.k===sig)continue;
      if(!cur_||cur_.sigue){if(rank(sig)<9){if(cur_?.k)used.delete(cur_.k);put(j,sig)}else if(!cur_)out.set(j,{sigue:sig})}}}
  return out;
}
function renderList(){
  if(mview()!=='lista')return;
  const c=cur(), off=offeredClaves(), sp=semOf(), me=isPersonal(), oblig=new Set(tr().oblig);
  const useSem=!porNiveles()&&Object.keys(c).some(k=>sp[k]), by={};
  Object.keys(c).forEach(k=>{const g=(useSem?sp[k]:null)||c[k][2];(by[g]=by[g]||[]).push(k)});
  const tag=k=>{const st=statusOf(k);
    if(st==='done')return['Acreditada','ok'];
    if(isElec(k))return['Por actividades',''];
    if(st==='curso')return['En curso',''];
    if(st==='late fail')return['Desfasada','bad'];
    if(st==='fail')return['Por recursar','warn'];
    if(st.includes('lock'))return['Requisitos pendientes',''];
    if(me&&MARK.sug.has(k))return['Sugerida','ok'];
    if(me&&MARK.avail.has(k))return['Puedes cursarla','ok'];
    return null};
  $('#tlist').innerHTML=Object.keys(by).sort((a,b)=>a-b).map(g=>`<section class="tl-sem"><h4>${useSem?'Semestre propuesto '+g:'Nivel '+g}</h4><div class="tl-rows">`+
    by[g].sort((a,b)=>c[a][2]-c[b][2]||a.localeCompare(b)).map(k=>{const t=tag(k), paso=planAsignado(k), w=paso===S.planPaso, done=statusOf(k)==='done', ob=oblig.has(k), open=S.lfocus===k;
      return `<div class="tl-row${done?' done':''}${paso!=null?' want plan-'+(paso+1):''}" style="--nv:var(--n${c[k][2]})"><span class="tl-bar"></span>`+
        `<button type="button" class="tl-name" data-lfocus="${k}" aria-expanded="${open}"><b>${esc(pretty(c[k][0]))}</b><small>${k} · ${fmtCr(c[k][1])} cr${off.has(k)||isElec(k)?'':' · sin grupos'}${t?` <span class="tl-tag ${t[1]}">${t[0]}</span>`:''}${ob?' <span class="tl-tag bad">Obligatoria</span>':''}</small></button>`+
        `<button type="button" class="tl-want" data-lwant="${k}" aria-pressed="${w}"${done||ob||isElec(k)?' disabled':''} aria-label="${w?'Quitar':'Agregar'} ${esc(pretty(c[k][0]))}">${paso!=null?paso+1:'+'}</button>`+
        (open?`<div class="tl-more">${inspParts(k).l2}</div>`:'')+'</div>'}).join('')+'</div></section>').join('');
}

SATE.pestana('mapa',{montar(){},mostrar(){renderTray()},ocultar(){tipOculta()}});
