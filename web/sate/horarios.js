function renderOffer(){
  const list=filtered(), sel=selected();
  let html='';
  if(S.view==='materia'){
    const g=new Map();list.forEach(c=>{(g.get(c[4])||g.set(c[4],[]).get(c[4])).push(c)});
    const items=[...g.values()].sort((a,b)=>prio(a[0][8])-prio(b[0][8])||a[0][2]-b[0][2]||name(a[0]).localeCompare(name(b[0])));
    html=items.map(cs=>{cs.sort((a,b)=>a[3].localeCompare(b[3],'es',{numeric:true}));const c=cs[0];
      const st=cur()[c[8]]?statusOf(c[8]).split(' ')[0]:'';
      const fl=cur()[c[8]]&&statusOf(c[8]).includes('fail');
      const badge=st==='late'?`<span class="tag bad">${fl?(['agotada','dictamen'].includes(reglaDesfase()?.por[c[8]])?'desfasada: requiere dictamen':'desfasada: recursar'):'desfasada'}</span> `:st==='fail'?'<span class="tag bad">por recursar</span> ':st==='now'?'<span class="tag good">de tu semestre</span> ':st==='curso'?'<span class="tag soft">en curso</span> ':st==='done'?'<span class="tag soft">ya acreditada</span> ':(isPersonal()&&cur()[c[8]]&&available(c[8]))?'<span class="tag good">puedes cursarla</span> ':'';
      return `<article class="subj"><header><h3>${badge}${esc(name(c))}</h3><span class="meta">${c[8]} · ${fmtCr(c[7])} cr · Nivel ${c[2]}${c[9]&&c[9]!=='O'?' · '+TIPO[c[9]]:''}</span>${lineasDe(c[8]).length?`<span class="lineas">${lineasDe(c[8]).map(l=>`<span class="tag lin" title="Línea de especialización">${esc(l)}</span>`).join('')}</span>`:''}</header>${(()=>{
        // con una opción marcada «Sí», la materia se colapsa a esa(s) opción(es) (y la que esté en el horario)
        const mk=ws().marks, keep=cs.filter(x=>mk[keyOf(x)]?.s==='si'||plan().sel.includes(keyOf(x)));
        const col=keep.length&&keep.some(x=>mk[keyOf(x)]?.s==='si')&&keep.length<cs.length, open=S.expand.has(c[4]);
        const rows=(col&&!open?keep:cs).map(x=>optRow(x,sel,false)).join('');
        return rows+(col?`<button type="button" class="link more" data-expand="${c[4]}">${open?'Mostrar solo la opción elegida':`Ver ${cs.length-keep.length} ${cs.length-keep.length>1?'opciones más':'opción más'}`}</button>`:'')})()}</article>`}).join('');
    $('#offer-count').textContent=`${g.size} materias · ${list.length} opciones`;
  }else{
    const g=new Map();list.forEach(c=>{(g.get(c[3])||g.set(c[3],[]).get(c[3])).push(c)});
    const gp=cs=>Math.min(...cs.map(c=>prio(c[8])));
    const items=[...g.entries()].sort((a,b)=>gp(a[1])-gp(b[1])||a[0].localeCompare(b[0],'es',{numeric:true}));
    html=items.map(([grp,cs])=>`<article class="subj"><header><h3 class="grp">${grp}</h3><span class="meta">${fmtCr(cs.reduce((s,c)=>s+c[7],0))} cr <button class="link" data-group="${grp}">Agregar grupo completo</button></span></header>${cs.map(c=>optRow(c,sel,true)).join('')}</article>`).join('');
    $('#offer-count').textContent=`${g.size} grupos · ${list.length} materias`;
  }
  $('#offer').innerHTML=html||'<p class="empty">No hay grupos que cumplan los filtros. Cambia el turno o el nivel, retira algún filtro de búsqueda o desactiva «Solo las elegidas en el mapa».</p>';
}
function lanes(items){
  const out=[];
  for(let d=0;d<7;d++){
    const bs=items.filter(b=>b.d===d).sort((a,b)=>a.a-b.a||b.b-a.b);
    let group=[],end=-1;
    const flush=()=>{const le=[];group.forEach(b=>{let i=le.findIndex(e=>e<=b.a);if(i<0){i=le.length;le.push(0)}le[i]=b.b;b.lane=i});group.forEach(b=>{b.n=le.length;b.clash=le.length>1&&!b.ghost});out.push(...group);group=[]};
    bs.forEach(b=>{if(b.a>=end&&group.length)flush();group.push(b);end=Math.max(end,b.b)});
    if(group.length)flush();
  }
  return out;
}
/* horario inscrito (leído del SAES con el Lector): se carga en la versión seleccionada para exportarlo o compararlo */
function loadInscrito(){
  const H=(isPersonal()&&ALUMNO.horario_inscrito)||[];if(!H.length)return;
  const find=(per,g,k)=>(DATA.periodos[per]||[]).find(c=>c[0]===S.car&&c[3]===g&&c[8]===k);
  // periodo de la oferta con más coincidencias (grupo + clave)
  const per=['proximo','actual'].filter(hasOffer).sort((a,b)=>H.filter(h=>find(b,h[0],h[1])).length-H.filter(h=>find(a,h[0],h[1])).length)[0]||S.per;
  if(per!==S.per){S.per=per;store.set('per',per)}
  const pl=plan();pl.sel=[];pl.own=pl.own.filter(o=>!o.saes);let sinOferta=0;
  H.forEach(([g,k,n,pf,ses])=>{const c=find(per,g,k);if(c){pl.sel.push(keyOf(c));return}
    // sin coincidencia en la oferta capturada: se agrega con las horas del SAES
    sinOferta++;const by={};ses.forEach(([d,a,b])=>{(by[a+'-'+b]=by[a+'-'+b]||{a,b,d:[]}).d.push(d)});
    Object.values(by).forEach(x=>pl.own.push({n:`${pretty(n)} (${g})`,d:x.d.sort(),a:x.a,b:x.b,saes:true}))});
  render();
  $('#exp-msg').textContent=`Horario inscrito cargado en la versión ${ws().plan} (${per==='proximo'?'próximo periodo':'periodo actual'}).`+
    (sinOferta?` ${sinOferta} ${sinOferta>1?'materias no aparecen':'materia no aparece'} en la oferta capturada y se muestra${sinOferta>1?'n':''} con las horas del SAES.`:'');
}
function renderPlans(){
  $('#b-saeshor').hidden=!(isPersonal()&&ALUMNO.horario_inscrito?.length);
  const ids=planIds();
  $('#plans').innerHTML='<span class="lbl" style="margin-right:4px">Versión</span>'+ids.map(p=>{const pl=ws().plans[p];const cr=pl.sel.map(byKey).filter(Boolean).reduce((s,c)=>s+c[7],0);
    return `<span class="plan-tab"><button class="chip" data-plan="${p}" aria-pressed="${ws().plan===p}">Horario ${p}<small>${pl.sel.length?fmtCr(cr)+' cr':'vacío'}</small></button>${ids.length>1&&ws().plan===p?`<button class="x" data-delplan="${p}" aria-label="Eliminar el horario ${p}" title="Eliminar el horario ${p}">×</button>`:''}</span>`}).join('')+
    `<button class="chip plan-new" data-newplan="1" title="Agregar un horario vacío">+ Nuevo</button><button class="link" data-dup style="margin-left:8px">Duplicar ${ws().plan}</button>`;
}
function renderCal(){
  const sel=selected(), own=ownAsClasses();
  const ghost=S.hover&&!plan().sel.includes(S.hover)?byKey(S.hover):null;
  const all=[...sel,...own,...(ghost?[ghost]:[])];
  const maxDay=Math.max(4,...all.flatMap(c=>slots(c).map(b=>b[0])));
  const days=S.weekend?7:maxDay+1;
  // bloques de 1:30 alineados a las 7:00 (si algo empieza antes, se agregan bloques completos hacia arriba)
  const first=Math.min(START,...all.flatMap(c=>slots(c).map(b=>b[1])));
  const lo=START-Math.ceil((START-first)/BLOCK)*BLOCK;
  const hi=Math.max(14*60+30,...all.flatMap(c=>slots(c).map(b=>b[2])));
  const end=lo+Math.ceil((hi-lo)/BLOCK)*BLOCK, h=(end-lo)/SLOT*SLOTPX;
  const cal=$('#cal');cal.style.setProperty('--days',days);cal.style.setProperty('--slot',SLOTPX+'px');
  let html='<div class="dh"></div>'+DAYS.slice(0,days).map(d=>`<div class="dh">${d}</div>`).join('');
  html+=`<div class="hours" style="height:${h}px">`;
  for(let m=lo;m<end;m+=BLOCK) html+=`<div style="top:${(m-lo)/SLOT*SLOTPX}px">${hm(m)}</div>`;
  html+='</div>';
  const items=lanes(all.flatMap(c=>slots(c).map(([d,a,b])=>({c,d,a,b,ghost:c===ghost}))));
  for(let d=0;d<days;d++){
    html+=`<div class="day" style="height:${h}px">`;
    for(let m=lo;m<end;m+=BLOCK){const on=S.gap&&S.gap.d===d&&S.gap.a===m;
      html+=`<button type="button" class="gapcell${on?' on':''}" data-gap="${d}|${m}" style="top:${(m-lo)/SLOT*SLOTPX}px;height:${BLOCK/SLOT*SLOTPX}px" title="Buscar materias para ${DAYS[d]} ${hm(m)}–${hm(m+BLOCK)}" aria-label="Buscar materias para ${DAYS[d]} ${hm(m)}"></button>`}
    items.filter(b=>b.d===d).forEach(b=>{
      const top=(b.a-lo)/SLOT*SLOTPX, ht=(b.b-b.a)/SLOT*SLOTPX-2, w=100/b.n, pos=`top:${top}px;height:${ht}px;left:calc(${b.lane*w}% + 2px);width:calc(${w}% - 4px)`;
      if(b.c.own) html+=`<div class="blk own${b.clash?' clash':''}" style="${pos}" title="${esc(b.c.n)} · ${hm(b.a)}–${hm(b.b)}"><b>${esc(b.c.n)}</b><span class="t">${hm(b.a)}</span></div>`;
      else html+=`<div class="blk${b.clash?' clash':''}${b.ghost?' ghost':''}" style="--h:${hue(b.c)};${pos}" data-k="${keyOf(b.c)}" title="${b.c[3]} · ${esc(name(b.c))} · ${esc(profs(b.c))} · ${hm(b.a)}–${hm(b.b)}${roomAt(b.c,b.d,b.a)?' · '+esc(roomAt(b.c,b.d,b.a)):''}"><b>${esc(name(b.c))}</b><span class="t">${b.c[3]} · ${hm(b.a)}${roomAt(b.c,b.d,b.a)?' · '+esc(roomAt(b.c,b.d,b.a)):''}</span></div>`;
    });
    html+='</div>';
  }
  cal.innerHTML=html;
  const cv=cview();document.querySelectorAll('[data-cview]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cview===cv)));
  $('.calwrap').hidden=cv==='dia';$('#agenda').hidden=cv!=='dia';
  if(cv==='dia'){const by={};items.forEach(b=>(by[b.d]=by[b.d]||[]).push(b));
    $('#agenda').innerHTML=Object.keys(by).length?Object.keys(by).sort((a,b)=>a-b).map(d=>`<section class="ag-day"><h4>${DAYN[d]}</h4>`+by[d].sort((x,y)=>x.a-y.a).map(b=>b.c.own?
      `<div class="ag-it own${b.clash?' clash':''}"><span class="t">${hm(b.a)}–${hm(b.b)}</span><span><b>${esc(b.c.n)}</b><small>Actividad extracurricular${b.clash?' · traslape':''}</small></span></div>`:
      `<div class="ag-it${b.clash?' clash':''}${b.ghost?' ghost':''}" style="--h:${hue(b.c)}"><span class="t">${hm(b.a)}–${hm(b.b)}</span><span><b>${esc(name(b.c))}</b><small>${b.c[3]}${roomAt(b.c,b.d,b.a)?' · '+esc(roomAt(b.c,b.d,b.a)):''} · ${esc(profs(b.c))}${b.ghost?' · vista previa':''}${b.clash?' · traslape':''}</small></span></div>`).join('')+'</section>').join(''):
      '<p class="ag-empty">Aún no hay materias en este horario.</p>'}
  const cr=sel.reduce((s,c)=>s+c[7],0);
  const mins=sel.reduce((s,c)=>s+c[6].reduce((t,b)=>t+b[2]-b[1],0),0);
  const both=[...sel,...own];let clashes=0;
  for(let i=0;i<both.length;i++)for(let j=i+1;j<both.length;j++)if(overlaps(both[i],both[j]))clashes++;
  const noSched=sel.filter(c=>!c[6].length).length;
  $('#stats').innerHTML=sel.length||own.length?`<span><b>${fmtCr(cr)}</b> créditos en el horario</span><span><b>${sel.length}</b> materias</span><span><b>${(mins/60).toFixed(1)}</b> h de clase a la semana</span>`+
    (clashes?`<span class="bad">${clashes} ${clashes>1?'traslapes':'traslape'}</span>`:'<span>Sin traslapes</span>')+(noSched?`<span>${noSched} sin horario publicado</span>`:'')+
    (()=>{const have=new Set(sel.map(c=>c[8])),miss=tr().oblig.filter(k=>!have.has(k));return miss.length?`<span class="bad">Falta ${miss.map(k=>esc(pretty(cur()[k][0]))).join(', ')}: obligatoria por desfase</span>`:''})():
    '<span>Agrega grupos desde la oferta o genera horarios automáticamente. '+(tactil()?'Toca un grupo de la oferta para ver su vista previa.':'Al colocar el cursor sobre un grupo se muestra su vista previa.')+'</span>';
  const failS=new Set(tr().fail), ci=cargaInfo(sel.filter(c=>!failS.has(c[8])).reduce((s,c)=>s+c[7],0));
  if(ci&&(sel.length||ci.ret)){
    const L=ci.L, t=ci.total, top=Math.max(L.max,t,ci.tope)*1.05, pct=v=>Math.min(100,v/top*100);
    const tag=t<L.min?'Menor a la mínima':t>ci.tope+0.01?(ci.aut!=null||ci.regla?'Excede la carga autorizada':ci.adeudo?'Excede la carga media (con adeudos)':'Mayor a la máxima'):t<=L.media?'Entre mínima y media':'Entre media y máxima';
    const bad=t<L.min||t>ci.tope+0.01;
    $('#load').innerHTML=`<span class="lbl${bad?' bad':''}">Carga total: ${fmtCr(t)} cr · ${tag}</span><div class="bar">${ci.ret?`<div class="fill ret" style="width:${pct(ci.ret)}%"></div>`:''}<div class="fill" style="left:${pct(ci.ret)}%;width:${Math.max(0,pct(t)-pct(ci.ret))}%"></div>${['min','media','max'].map(k=>`<div class="tick" style="left:${pct(L[k])}%"></div>`).join('')}${ci.tope!==L.max&&ci.tope!==L.media?`<div class="tick tope" style="left:${pct(ci.tope)}%"></div>`:''}</div>
      ${(()=>{   // etiquetas de la barra de carga: si dos quedan cerca, la segunda baja a otro renglón
        const et=[['min','mínima'],['media','media'],['max','máxima']].map(([k,l])=>({p:pct(L[k]),t:`${l} ${L[k]}`,c:''}));
        if(ci.tope!==L.max&&ci.tope!==L.media)et.push({p:pct(ci.tope),t:`autorizada ${fmtCr(ci.tope)}`,c:'bad'});
        et.sort((x,y)=>x.p-y.p);let fila=0;et.forEach((e,i)=>{e.f=i&&e.p-et[i-1].p<14&&et[i-1].f===0?1:0});fila=Math.max(0,...et.map(e=>e.f));
        return `<div class="ticks${fila?' dos':''}">${et.map(e=>`<span class="${e.c}${e.f?' f2':''}" style="left:${e.p}%">${e.t}</span>`).join('')}</div>`})()}`+
      (ci.ret?`<p class="load-note"><i class="sw-ret"></i>${fmtCr(ci.ret)} cr retenidos por reprobadas (cuentan aunque no las inscribas; recursarlas no suma de nuevo) · ${fmtCr(ci.nuevos)} cr de materias nuevas, de ${fmtCr(ci.libre)} permitidos (${ci.regla?`carga media más ${fmtCr(ci.regla.mx)} cr de la materia con más créditos, regla de Gestión Escolar para ${esc(DATA.calendario.periodo)},`:ci.aut!=null?`carga autorizada de ${fmtCr(ci.aut)} cr`:'carga media'} menos los retenidos)${ci.faltaMin?` · faltan ${fmtCr(ci.faltaMin)} cr para la mínima`:''}.</p>`:'');
  }else $('#load').innerHTML='';
  $('#sel').hidden=!both.length;
  $('#sel').innerHTML=sel.map(c=>`<div><span class="sw" style="--h:${hue(c)}"></span><span class="grp">${c[3]}</span><span>${esc(pretty(name(c)))}<br><small>${esc(profs(c))}</small></span><span class="cr">${fmtCr(c[7])} cr</span><button class="x" data-toggle="${keyOf(c)}" aria-label="Quitar ${esc(name(c))}">×</button></div>`).join('')+
    own.map(o=>{const r=plan().own[o.i];return `<div><span class="sw own"></span><span class="grp">extra</span><span>${esc(o.n)}<br><small>${r.d.map(d=>DAYS[d]).join(' ')} ${hm(r.a)}–${hm(r.b)}</small></span><span></span><button class="x" data-unown="${o.i}" aria-label="Quitar ${esc(o.n)}">×</button></div>`}).join('');
}
function renderOwnForm(){$('#own-d').innerHTML=DAYS.map((d,i)=>`<button type="button" class="chip" data-oday="${i}" aria-pressed="${S.ownDays.includes(i)}">${d}</button>`).join('')}

/* ---------- exportar horario: imagen PNG en alta resolución o PDF (pdf-lib, carga bajo demanda) ---------- */
const DL=window.claude?.use?window.claude.use('downloads'):Promise.resolve(null);
async function saveFile(name,blob){
  const dl=window.claude?.use?await DL:null;
  if(dl){try{await dl.save({filename:name,data:blob});return 'Listo: '+name}catch(e){return e?.code==='declined'?'Descarga cancelada.':'No se pudo guardar el archivo en esta vista.'}}
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);return 'Listo: '+name;
}
function scheduleData(){
  const sel=selected(),own=plan().own;
  return {sel,own,cr:sel.reduce((s,c)=>s+c[7],0),hrs:sel.reduce((s,c)=>s+c[6].reduce((t,b)=>t+b[2]-b[1],0),0)/60};
}
// nombres del SAES (mayúsculas) en formato oración, conservando numerales romanos: "INGLES II" -> "Ingles II"
const pretty=t=>{const l=String(t).toLowerCase().replace(/\b(i{1,3}|iv|vi{0,3}|ix|x)\b/g,m=>m.toUpperCase());return l.charAt(0).toUpperCase()+l.slice(1)};
function wrapText(ctx,text,max){const w=String(text).split(/\s+/),out=[];let ln='';w.forEach(x=>{const t=ln?ln+' '+x:x;if(ctx.measureText(t).width>max&&ln){out.push(ln);ln=x}else ln=t});if(ln)out.push(ln);return out}
// a qué periodo corresponde el horario: con datos del SAES, el periodo y el número de periodo escolar
const perLabel=()=>{if(isPersonal()){const t=perMeta(),n=semNow(),out=[];if(t!=null)out.push('Periodo '+perName(t));if(n)out.push(n+'.º periodo escolar');if(out.length)return out.join(' · ')}
  return S.per==='proximo'?'Próximo periodo':'Periodo actual'};
/* dibuja en coordenadas lógicas (W ancho) y escala k; part: 'week' | 'list' | 'all' */
async function drawSchedule(part,k=3){
  await document.fonts?.ready;
  // paleta clara u oscura (opción «Tema de la imagen y el PDF»)
  const DK=EXP.dark, D=scheduleData(),W=1400,PAD=48,F='"Noto Sans",system-ui,sans-serif',ACC=DK?'#b64a7c':'#750946',INK=DK?'#ece6e9':'#231f20',MUT=DK?'#a9a0a5':'#5c575a',LINE=DK?'#3a3237':'#e3dade',
    BG=DK?'#17141a':'#ffffff', BAND=DK?'#211c22':'#f6f4f5', blkBg=h=>DK?`hsl(${h} 28% 24%)`:`hsl(${h} 45% 90%)`, blkBar=h=>DK?`hsl(${h} 55% 62%)`:`hsl(${h} 45% 38%)`;
  const ownFill=(x,y,w,h)=>{g.fillStyle=EXP.own;if(DK)g.globalAlpha=.32;g.fillRect(x,y,w,h);g.globalAlpha=1};
  const allSlots=[...D.sel.flatMap(c=>c[6]),...D.own.flatMap(o=>o.d.map(d=>[d,o.a,o.b]))];
  const days=Math.max(5,...allSlots.map(b=>b[0]+1));
  // solo de la primera clase a la última de la semana
  const lo=allSlots.length?Math.min(...allSlots.map(b=>b[1])):START, hi=allSlots.length?Math.max(...allSlots.map(b=>b[2])):START+BLOCK;
  const HEAD=110, gridTop=HEAD+44, hourPx=46, gridH=(hi-lo)/60*hourPx, LEFT=PAD+56, colW=(W-LEFT-PAD)/days;
  const rowsList=[...D.sel,...D.own.map(o=>({own:o}))], ROWH=46, listTop=part==='list'?HEAD:gridTop+gridH+48;
  const H=part==='week'?gridTop+gridH+70:listTop+40+rowsList.length*ROWH+70;
  const cv=document.createElement('canvas');cv.width=W*k;cv.height=H*k;const g=cv.getContext('2d');g.scale(k,k);
  g.fillStyle=BG;g.fillRect(0,0,W,H);
  g.fillStyle=ACC;g.fillRect(0,0,W,8);
  const carN=DATA.carreras[S.car]||'', perN=perLabel();
  g.fillStyle=INK;g.font=`700 30px ${F}`;g.fillText(`Horario ${ws().plan} · ${carN.charAt(0)+carN.slice(1).toLowerCase()}`,PAD,PAD+18);
  g.fillStyle=MUT;g.font=`400 16px ${F}`;
  g.fillText(`${perN} · ${fmtCr(D.cr)} créditos · ${D.sel.length} materias · ${D.hrs.toFixed(1)} h de clase a la semana`,PAD,PAD+48);
  if(part!=='list'){
    for(let d=0;d<days;d++){const x=LEFT+d*colW;g.fillStyle=BAND;g.fillRect(x,HEAD,colW,36);g.fillStyle=INK;g.font=`600 16px ${F}`;g.textAlign='center';g.fillText(DAYS[d],x+colW/2,HEAD+24);g.textAlign='left'}
    g.strokeStyle=LINE;g.lineWidth=1;
    for(let m=lo,i=0;m<hi;m+=BLOCK,i++){const y=gridTop+(m-lo)/60*hourPx;
      if(i%2){g.fillStyle=BAND;g.fillRect(LEFT,y,W-PAD-LEFT,Math.min(BLOCK,hi-m)/60*hourPx)}
      g.strokeStyle=LINE;g.beginPath();g.moveTo(LEFT,y);g.lineTo(W-PAD,y);g.stroke();
      g.fillStyle=MUT;g.font=`400 13px ${F}`;g.textAlign='right';g.fillText(hm(m),LEFT-10,y+15);g.textAlign='left'}
    g.beginPath();g.moveTo(LEFT,gridTop+gridH);g.lineTo(W-PAD,gridTop+gridH);g.stroke();
    for(let d=0;d<=days;d++){const x=LEFT+d*colW;g.beginPath();g.moveTo(x,gridTop);g.lineTo(x,gridTop+gridH);g.stroke()}
    const blocks=[...D.sel.flatMap(c=>c[6].map(([d,a,b])=>({c,d,a,b}))),...D.own.flatMap(o=>o.d.map(d=>({o,d,a:o.a,b:o.b})))];
    blocks.forEach(B=>{
      const x=LEFT+B.d*colW+3,y=gridTop+(B.a-lo)/60*hourPx+2,w=colW-6,h=(B.b-B.a)/60*hourPx-4,hu=B.c?hue(B.c):0;
      g.save();g.beginPath();g.roundRect?g.roundRect(x,y,w,h,6):g.rect(x,y,w,h);g.clip();
      if(B.c){g.fillStyle=blkBg(hu);g.fillRect(x,y,w,h);g.fillStyle=blkBar(hu);g.fillRect(x,y,5,h)}
      else ownFill(x,y,w,h)
      g.fillStyle=INK;g.font=`600 13px ${F}`;
      const title=B.c?pretty(name(B.c)):B.o.n, lines=wrapText(g,title,w-16);let ty=y+18;
      lines.slice(0,Math.max(1,Math.floor((h-22)/16))).forEach(l=>{g.fillText(l,x+11,ty);ty+=16});
      g.fillStyle=MUT;g.font=`400 12px ${F}`;
      const meta=[B.c&&EXP.show.g?B.c[3]:'',`${hm(B.a)}–${hm(B.b)}`].filter(Boolean).join(' · ');
      if(ty<y+h-4){g.fillText(meta,x+11,ty);ty+=15}
      if(B.c&&EXP.show.p&&ty<y+h-4)g.fillText(wrapText(g,proper(profs(B.c)),w-16)[0],x+11,ty);
      g.restore();
    });
  }
  if(part!=='week'){
    g.fillStyle=INK;g.font=`700 18px ${F}`;g.fillText('Materias',PAD,listTop+8);
    const cols=[[PAD,'Grupo'],[PAD+80,'Materia'],[PAD+470,'Profesor'],[PAD+800,'Horario'],[W-PAD-60,'Créditos']];
    g.font=`600 13px ${F}`;g.fillStyle=MUT;cols.forEach(([x,t])=>g.fillText(t,x,listTop+36));
    rowsList.forEach((c,i)=>{const y=listTop+40+i*ROWH;g.strokeStyle=LINE;g.beginPath();g.moveTo(PAD,y);g.lineTo(W-PAD,y);g.stroke();
      g.fillStyle=INK;g.font=`400 14px ${F}`;
      if(c.own){g.fillText('—',PAD,y+28);g.fillText(c.own.n,PAD+80,y+28);g.fillStyle=MUT;g.fillText('Actividad extracurricular',PAD+470,y+28);g.fillText(`${c.own.d.map(d=>DAYS[d]).join(' ')} ${hm(c.own.a)}–${hm(c.own.b)}`,PAD+800,y+28);return}
      g.fillStyle=blkBar(hue(c));g.fillRect(PAD-12,y+12,5,22);g.fillStyle=INK;
      g.fillText(c[3],PAD,y+28);g.fillText(wrapText(g,`${c[8]} ${pretty(name(c))}`,380)[0],PAD+80,y+28);
      g.fillStyle=MUT;g.fillText(wrapText(g,profs(c),320)[0],PAD+470,y+28);g.fillText(wrapText(g,pattern(c).join('; '),400)[0],PAD+800,y+28);
      g.fillStyle=INK;g.textAlign='right';g.fillText(fmtCr(c[7]),W-PAD,y+28);g.textAlign='left'});
  }
  const cap=new Date(DATA.capturado).toLocaleDateString('es-MX',{dateStyle:'long'});
  g.fillStyle=MUT;g.font=`400 12px ${F}`;g.fillText(`Generado con Horarios UPIITA · Oferta del SAES capturada el ${cap}. Verifica cupo y horarios en el SAES antes de inscribirte.`,PAD,H-24);
  return cv;
}

/* ---------- estilo minimalista: tabla con celdas unidas (huecos y clases contiguas por día) + lista de profesores ---------- */
// nombres propios del SAES (mayúsculas) a formato nombre: "CANUL GOMEZ GIMCIAN" -> "Canul Gomez Gimcian"
const proper=t=>String(t).toLowerCase().replace(/(^|[\s,/(-])(\p{L})/gu,(m,a,b)=>a+b.toUpperCase());
// texto de una clase en la exportación según las casillas "Incluir: grupo, profesor"
const classLabel=c=>[pretty(name(c)),EXP.show.g?c[3]:'',EXP.show.p?proper(profs(c)):''].filter(Boolean).join('\n');
function weekGrid(){
  const D=scheduleData();
  const items=[...D.sel.flatMap(c=>c[6].map(([d,a,b])=>({d,a,b,t:classLabel(c),own:false}))),...D.own.flatMap(o=>o.d.map(d=>({d,a:o.a,b:o.b,t:o.n,own:true})))];
  const days=Math.max(5,...items.map(x=>x.d+1));
  const bounds=[...new Set(items.flatMap(x=>[x.a,x.b]))].sort((a,b)=>a-b);
  const rows=bounds.slice(0,-1).map((t,i)=>[t,bounds[i+1]]);
  const keyOfIt=it=>it?(it.own?'o:':'c:')+it.t+'|'+it.a+'|'+it.b:'';
  // celda (renglón, día): la actividad que la cubre
  const at=(r,d)=>items.find(x=>x.d===d&&x.a<=rows[r][0]&&x.b>=rows[r][1])||null;
  // segmentos verticales por día: la misma actividad (o el vacío) en renglones seguidos se une
  const segs=[];
  for(let d=0;d<days;d++){let r=0;while(r<rows.length){const it=at(r,d),key=keyOfIt(it);let e=r+1;
    while(e<rows.length&&keyOfIt(at(e,d))===key)e++;
    segs.push({d,r0:r,r1:e,it,span:1});r=e}}
  // unión horizontal solo para actividades propias iguales en días seguidos (p. ej. un idioma de lunes a viernes);
  // las materias se dejan una por día, como en el formato en tabla
  segs.sort((x,y)=>x.r0-y.r0||x.d-y.d);
  const out=[];
  segs.forEach(sg=>{const prev=out.filter(o=>o.r0===sg.r0&&o.r1===sg.r1&&o.d+o.span===sg.d).pop();
    if(prev&&sg.it?.own&&prev.it?.own&&prev.it.t===sg.it.t)prev.span++;else out.push(sg)});
  return {rows,days,cells:out,D};
}
async function drawTable(part,k=3){
  await document.fonts?.ready;
  // proporciones del formato en tabla: lienzo angosto (letra grande en carta), líneas delgadas dentro y gruesas en
  // el contorno, debajo del título, debajo de los días y a la derecha de la columna de horas
  const DK=EXP.dark, {rows,days,cells,D}=weekGrid(), W=1000, PAD=40, F='Arial,"Noto Sans",system-ui,sans-serif', INK=DK?'#efeaec':'#000', GRAY=DK?'#2b272b':'#e7e7e7', OWN=EXP.own,
    BG=DK?'#141214':'#fff', SUB=DK?'#cfc7cb':'#333', FOOT=DK?'#a59ca1':'#555';
  // HR: renglones de título y encabezado, delgados como en el formato del equipo
  const THIN=1.4, THICK=3.4, HOURW=118, colW=(W-2*PAD-HOURW)/days, ROWH=46+21*((EXP.show.g?1:0)+(EXP.show.p?1:0)), HR=24, TOP=PAD+58, LROW=D.sel.some(c=>(c[10]||[]).filter(Boolean).length>1)?57:40;
  const tableH=part==='list'?0:2*HR+rows.length*ROWH;
  const listTop=part==='list'?TOP:TOP+tableH+34;
  const H=part==='week'?TOP+tableH+46:listTop+2*HR+D.sel.length*LROW+70;
  const cv=document.createElement('canvas');cv.width=W*k;cv.height=H*k;const g=cv.getContext('2d');g.scale(k,k);
  g.fillStyle=BG;g.fillRect(0,0,W,H);
  const carN=DATA.carreras[S.car]||'';
  g.fillStyle=INK;g.font=`700 19px ${F}`;g.fillText(`Horario ${ws().plan} · ${pretty(carN)}`,PAD,PAD+8);
  g.font=`400 13px ${F}`;g.fillStyle=SUB;g.fillText(`${perLabel()} · ${fmtCr(D.cr)} créditos · ${D.sel.length} materias`,PAD,PAD+30);
  const cellText=(t,x,y,w,h,bold,italic)=>{g.fillStyle=INK;g.font=`${italic?'italic ':''}${bold?700:400} 14px ${F}`;g.textAlign='center';
    const ls=String(t).split('\n').flatMap(seg=>wrapText(g,seg,w-10)).slice(0,Math.max(1,Math.floor((h-4)/17)));const y0=y+h/2-(ls.length-1)*8.5+5;ls.forEach((l,i)=>g.fillText(l,x+w/2,y0+i*17));g.textAlign='left'};
  const fill=(x,y,w,h,c)=>{g.fillStyle=c;if(DK&&c===OWN)g.globalAlpha=.32;g.fillRect(x,y,w,h);g.globalAlpha=1};
  const line=(x1,y1,x2,y2,lw)=>{g.strokeStyle=INK;g.lineWidth=lw;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()};
  const rect=(x,y,w,h,lw)=>{g.strokeStyle=INK;g.lineWidth=lw;g.strokeRect(x,y,w,h)};
  if(part!=='list'){
    const X0=PAD, Y0=TOP, TW=HOURW+colW*days, TH=2*HR+rows.length*ROWH, BY=Y0+2*HR;
    const NAMES=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
    cellText('Horario',X0,Y0,TW,HR,true);
    cellText('Hora',X0,Y0+HR,HOURW,HR);
    for(let d=0;d<days;d++)cellText(NAMES[d],X0+HOURW+d*colW,Y0+HR,colW,HR);
    rows.forEach(([a,b],r)=>cellText(`${hm(a)}-${hm(b)}`,X0,BY+r*ROWH,HOURW,ROWH));
    // celdas (con su color) y líneas delgadas
    cells.forEach(c=>{const x=X0+HOURW+c.d*colW,y=BY+c.r0*ROWH,w=colW*c.span,h=(c.r1-c.r0)*ROWH;
      fill(x,y,w,h,c.it?(c.it.own?OWN:BG):GRAY);rect(x,y,w,h,THIN);if(c.it)cellText(c.it.t,x,y,w,h)});
    for(let d=1;d<days;d++)line(X0+HOURW+d*colW,Y0+HR,X0+HOURW+d*colW,BY,THIN);
    rows.forEach((_,r)=>line(X0,BY+(r+1)*ROWH,X0+HOURW,BY+(r+1)*ROWH,THIN));
    // líneas gruesas
    rect(X0,Y0,TW,TH,THICK);line(X0,Y0+HR,X0+TW,Y0+HR,THICK);line(X0,BY,X0+TW,BY,THICK);line(X0+HOURW,Y0+HR,X0+HOURW,Y0+TH,THICK);
  }
  if(part!=='week'){
    const C=[['Grupo',70],['Materia',262],['Profesor',314],['Créd',58],['Salón',216]], X0=PAD, TW=C.reduce((t,c)=>t+c[1],0), TH=2*HR+D.sel.length*LROW;
    cellText('Lista de profesores por materia',X0,listTop,TW,HR,true);
    let x=X0;C.forEach(([t,w])=>{cellText(t,x,listTop+HR,w,HR,false,true);x+=w});
    D.sel.forEach((c,i)=>{x=X0;const y=listTop+2*HR+i*LROW;[c[3],pretty(name(c)),proper(profs(c)),fmtCr(c[7]),c[10]?[...new Set(c[10].filter(Boolean).map(shortRoom))].join(', '):''].forEach((t,j)=>{cellText(t,x,y,C[j][1],LROW);x+=C[j][1]});
      line(X0,y,X0+TW,y,THIN)});
    x=X0;C.slice(0,-1).forEach(([,w])=>{x+=w;line(x,listTop+HR,x,listTop+TH,THIN)});
    rect(X0,listTop,TW,TH,THICK);line(X0,listTop+HR,X0+TW,listTop+HR,THICK);line(X0,listTop+2*HR,X0+TW,listTop+2*HR,THICK);
    line(X0+C[0][1],listTop+HR,X0+C[0][1],listTop+TH,THICK);
    g.font=`400 14px ${F}`;g.fillStyle=INK;g.textAlign='center';g.fillText(fmtCr(D.cr),X0+C[0][1]+C[1][1]+C[2][1]+C[3][1]/2,listTop+TH+22);g.textAlign='left';
  }
  const cap=new Date(DATA.capturado).toLocaleDateString('es-MX',{dateStyle:'long'});
  g.fillStyle=FOOT;g.font=`400 10.5px ${F}`;g.fillText(`Generado con Horarios UPIITA · Oferta del SAES capturada el ${cap}. Verifica cupo y horarios en el SAES antes de inscribirte.`,PAD,H-16);
  return cv;
}
const EXP={get perPage(){return store.get('expPer',2)},get dark(){return store.get('expDark',false)},get style(){return store.get('expStyle','color')},get own(){return store.get('expOwn','#dbe7f5')},get show(){return Object.assign({g:false,p:false},store.get('expShow',{}))}};
const drawFor=(part,k)=>EXP.style==='min'?drawTable(part,k):drawSchedule(part,k);

/* ---------- Excel (.xlsx, también se abre en Google Sheets): mismo formato que la tabla minimalista ---------- */
async function loadExcelJS(){if(window.ExcelJS)return window.ExcelJS;await new Promise((ok,ko)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';s.onload=ok;s.onerror=()=>ko(new Error('No se pudo cargar el generador de Excel.'));document.head.appendChild(s)});return window.ExcelJS}
async function exportXlsx(){
  if(!selected().length&&!plan().own.length)return 'Agrega materias a tu horario para exportarlo.';
  const ExcelJS=await loadExcelJS(), wb=new ExcelJS.Workbook(), {rows,days,cells,D}=weekGrid();
  wb.title=`Horario ${ws().plan} ${DATA.siglas||UNIDAD.toUpperCase()}`;
  const NAMES=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'], argb=h=>'FF'+String(h).replace('#','').toUpperCase();
  const FONT={name:'Arial',size:10}, CENTER={horizontal:'center',vertical:'middle',wrapText:true};
  const T='thin', K='medium';
  // aplica bordes: delgados en todo el rango y gruesos en los bordes indicados
  const frame=(sh,r1,c1,r2,c2)=>{for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++){const b={top:{style:r===r1?K:T},bottom:{style:r===r2?K:T},left:{style:c===c1?K:T},right:{style:c===c2?K:T}};sh.getCell(r,c).border=b}};
  // borde grueso en un lado; también en el lado opuesto de la celda vecina (Excel y Sheets muestran cualquiera de los dos)
  const OPP={bottom:['top',1,0],right:['left',0,1]};
  const thick=(sh,r1,c1,r2,c2,side)=>{for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++){const cell=sh.getCell(r,c);cell.border={...cell.border,[side]:{style:K}};
    const [o,dr,dc]=OPP[side],nb=sh.getCell(r+dr,c+dc);nb.border={...nb.border,[o]:{style:K}}}};
  const put=(sh,r,c,v,opt={})=>{const cell=sh.getCell(r,c);cell.value=v;cell.font={...FONT,...(opt.font||{})};cell.alignment=CENTER;if(opt.fill)cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:argb(opt.fill)}};return cell};
  const nl=1+(EXP.show.g?1:0)+(EXP.show.p?1:0);
  // hoja 1: horario
  const sh=wb.addWorksheet('Horario',{pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0}});
  sh.columns=[{width:13},...Array.from({length:days},()=>({width:22}))];
  const last=1+days, R0=3, Rn=R0+rows.length-1;
  sh.mergeCells(1,1,1,last);put(sh,1,1,'Horario',{font:{bold:true}});
  put(sh,2,1,'Hora');for(let d=0;d<days;d++)put(sh,2,2+d,NAMES[d]);
  sh.getRow(1).height=15;sh.getRow(2).height=15;
  rows.forEach(([a,b],i)=>{put(sh,R0+i,1,`${hm(a)}-${hm(b)}`);sh.getRow(R0+i).height=16+13*nl});
  frame(sh,1,1,Rn,last);
  cells.forEach(c=>{const r1=R0+c.r0,r2=R0+c.r1-1,c1=2+c.d,c2=c1+c.span-1;
    if(r2>r1||c2>c1)sh.mergeCells(r1,c1,r2,c2);
    put(sh,r1,c1,c.it?c.it.t:'',{fill:c.it?(c.it.own?EXP.own:null):'#E7E7E7'});
    for(let r=r1;r<=r2;r++)for(let k=c1;k<=c2;k++)if(!c.it||c.it.own){const cell=sh.getCell(r,k);cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:argb(c.it?EXP.own:'#E7E7E7')}}}});
  frame(sh,1,1,Rn,last);   // los bordes se vuelven a aplicar sobre las celdas unidas
  thick(sh,1,1,1,last,'bottom');thick(sh,2,1,2,last,'bottom');thick(sh,2,1,Rn,1,'right');
  // hoja 2: profesores
  const sp=wb.addWorksheet('Profesores',{pageSetup:{orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0}});
  sp.columns=[{width:9},{width:38},{width:42},{width:8},{width:12}];
  sp.mergeCells(1,1,1,5);put(sp,1,1,'Lista de profesores por materia',{font:{bold:true}});
  ['Grupo','Materia','Profesor','Créd','Salón'].forEach((t,i)=>put(sp,2,1+i,t,{font:{italic:true}}));
  sp.getRow(1).height=15;sp.getRow(2).height=15;
  D.sel.forEach((c,i)=>{const r=3+i;[c[3],pretty(name(c)),proper(profs(c)),+c[7],''].forEach((v,j)=>put(sp,r,1+j,v));sp.getRow(r).height=24});
  const L=2+D.sel.length;frame(sp,1,1,L,5);thick(sp,1,1,1,5,'bottom');thick(sp,2,1,2,5,'bottom');thick(sp,2,1,L,1,'right');
  put(sp,L+1,4,{formula:`SUM(D3:D${L})`,result:D.cr});
  put(sp,L+3,1,`Horario ${ws().plan} · ${pretty(DATA.carreras[S.car]||'')} · ${perLabel()}`,{}).alignment={horizontal:'left'};sp.mergeCells(L+3,1,L+3,5);
  const buf=await wb.xlsx.writeBuffer();
  return saveFile(`horario-${ws().plan}-upiita.xlsx`,new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
}
const toBlob=cv=>new Promise(r=>cv.toBlob(r,'image/png'));
async function exportPng(){
  if(!selected().length&&!plan().own.length)return 'Agrega materias a tu horario para exportarlo.';
  const cv=await drawFor('all',3);return saveFile(`horario-${ws().plan}-upiita.png`,await toBlob(cv));
}
async function loadPdfLib(){if(window.PDFLib)return window.PDFLib;await new Promise((ok,ko)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';s.onload=ok;s.onerror=()=>ko(new Error('No se pudo cargar el generador de PDF.'));document.head.appendChild(s)});return window.PDFLib}
// agrega una hoja carta al PDF con el horario dibujado (horizontal en colorido, vertical en minimalista)
async function pdfPage(doc,rgb){
  const cv=await drawFor('all',3), png=await doc.embedPng(new Uint8Array(await (await toBlob(cv)).arrayBuffer()));
  const [PW,PH]=EXP.style==='min'?[612,792]:[792,612];
  const pg=doc.addPage([PW,PH]), m=24, sc=Math.min((PW-2*m)/png.width,(PH-2*m)/png.height);
  if(EXP.dark)pg.drawRectangle({x:0,y:0,width:PW,height:PH,color:EXP.style==='min'?rgb(.078,.071,.078):rgb(.09,.078,.102)});   // hoja oscura completa
  pg.drawImage(png,{x:(PW-png.width*sc)/2,y:PH-m-png.height*sc,width:png.width*sc,height:png.height*sc});
}
async function exportPdf(){
  if(!selected().length&&!plan().own.length)return 'Agrega materias a tu horario para exportarlo.';
  const {PDFDocument,rgb}=await loadPdfLib(), doc=await PDFDocument.create();
  await pdfPage(doc,rgb);   // una sola hoja con el horario y la lista
  doc.setTitle(`Horario ${ws().plan} ${DATA.siglas||UNIDAD.toUpperCase()}`);
  return saveFile(`horario-${ws().plan}-upiita.pdf`,new Blob([await doc.save()],{type:'application/pdf'}));
}
// todos los horarios con contenido en un solo PDF (una hoja por horario, en orden A, B, C…)
const plansConContenido=()=>planIds().filter(id=>{const p=ws().plans[id];return p.sel.length||(p.own||[]).length});
async function exportPdfAll(){
  const ids=plansConContenido();
  if(!ids.length)return 'Agrega materias a algún horario para exportarlo.';
  const {PDFDocument,rgb}=await loadPdfLib(), doc=await PDFDocument.create(), prev=ws().plan;
  // dos por hoja: carta horizontal con dos columnas (como «2 páginas por hoja» al imprimir); uno por hoja: tamaño completo
  const two=EXP.perPage===2, [PW,PH]=two||EXP.style!=='min'?[792,612]:[612,792], m=24, GAP=20, colW=two?(PW-2*m-GAP)/2:PW-2*m;
  let pg=null, col=0;
  const nueva=()=>{pg=doc.addPage([PW,PH]);if(EXP.dark)pg.drawRectangle({x:0,y:0,width:PW,height:PH,color:EXP.style==='min'?rgb(.078,.071,.078):rgb(.09,.078,.102)});col=0};
  try{for(const id of ids){ws().plan=id;
    const cv=await drawFor('all',3), png=await doc.embedPng(new Uint8Array(await (await toBlob(cv)).arrayBuffer()));
    const sc=Math.min(colW/png.width,(PH-2*m)/png.height), w=png.width*sc, h=png.height*sc;
    if(!pg||col>=(two?2:1))nueva();
    const x0=m+col*(colW+GAP);
    pg.drawImage(png,{x:x0+(colW-w)/2,y:PH-m-h,width:w,height:h});col++}}finally{ws().plan=prev}
  doc.setTitle('Horarios UPIITA');
  const r=await saveFile('horarios-upiita.pdf',new Blob([await doc.save()],{type:'application/pdf'}));
  const n=doc.getPageCount();
  return r.startsWith('Listo')?`${r} (${ids.length} ${ids.length>1?'horarios':'horario'} en ${n} ${n>1?'hojas':'hoja'})`:r;
}
// módulo de exportación (ventana)
$('#b-export').addEventListener('click',()=>{const dl=$('#exp-dlg'),n=plansConContenido().length;$('#b-pdfall').hidden=n<2;$('#b-pdfall').textContent=`PDF con todos los horarios (${n})`;$('#exp-dmsg').textContent=selected().length||plan().own.length?'':'Agrega materias a tu horario para exportarlo.';dl.showModal?dl.showModal():dl.setAttribute('open','')});
$('#exp-x').addEventListener('click',()=>$('#exp-dlg').close());
$('#exp-dlg').addEventListener('click',e=>{if(e.target.id==='exp-dlg')e.target.close()});
const renderExpStyle=()=>{document.querySelectorAll('[data-exps]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.exps===EXP.style)));
  document.querySelectorAll('[data-ext]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.ext==='dark')===EXP.dark)));
  document.querySelectorAll('[data-exper]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.exper===EXP.perPage)))};
$('#exp-per').addEventListener('click',e=>{const b=e.target.closest('[data-exper]');if(!b)return;store.set('expPer',+b.dataset.exper);renderExpStyle()});
$('#exp-theme').addEventListener('click',e=>{const b=e.target.closest('[data-ext]');if(!b)return;store.set('expDark',b.dataset.ext==='dark');renderExpStyle()});
$('#exp-style').addEventListener('click',e=>{const b=e.target.closest('[data-exps]');if(!b)return;store.set('expStyle',b.dataset.exps);renderExpStyle()});
renderExpStyle();
$('#exp-own').value=EXP.own;
document.querySelectorAll('[data-exshow]').forEach(i=>{i.checked=!!EXP.show[i.dataset.exshow];i.addEventListener('change',()=>{const v=EXP.show;v[i.dataset.exshow]=i.checked;store.set('expShow',v)})});
$('#exp-own').addEventListener('input',e=>store.set('expOwn',e.target.value));
for(const [id,fn] of [['#b-png',exportPng],['#b-pdf',exportPdf],['#b-pdfall',exportPdfAll],['#b-xlsx',exportXlsx]]){
  $(id).addEventListener('click',async e=>{const b=e.currentTarget,t=b.textContent;b.disabled=true;b.textContent='Generando…';
    let m,ok=false;try{m=await fn();ok=true}catch(err){m='No se pudo exportar: '+err.message}$('#exp-msg').textContent=m;$('#exp-dmsg').textContent=m;if(ok)window.ENCUESTA?.marcar('exp');
    b.disabled=false;b.textContent=t});
}

$('#b-copy').addEventListener('click',async()=>{
  const sel=selected();if(!sel.length&&!plan().own.length)return;
  const cr=sel.reduce((s,c)=>s+c[7],0);
  const txt=`Horario ${ws().plan} ${DATA.siglas||UNIDAD.toUpperCase()} (${S.per==='proximo'?'próximo periodo':'periodo actual'}) · ${fmtCr(cr)} créditos\n`+
    sel.map(c=>`${c[3]}  ${c[8]} ${name(c)} (${fmtCr(c[7])} cr)\n   ${profs(c)}\n   ${pattern(c).join('; ')}`).join('\n')+
    plan().own.map(o=>`\n—  ${o.n}\n   ${o.d.map(d=>DAYS[d]).join(' ')}  ${hm(o.a)}–${hm(o.b)}`).join('');
  const box=$('#copybox');box.value=txt;
  try{await navigator.clipboard.writeText(txt);$('#b-copy').textContent='Copiado';setTimeout(()=>$('#b-copy').textContent='Copiar texto',1500)}
  catch(err){box.hidden=false;box.select()}
});
/* Zoom del mapa con pellizco (dos dedos) y con el trackpad o Ctrl + rueda, centrado en el punto del gesto.
   Durante el pellizco solo se escala con CSS (instantáneo, sigue a los dedos); al soltar se redibuja una vez a la
   escala final. La respuesta es proporcional y amplificada (exponente GAIN): un pellizco amplio acerca mucho más que
   uno pequeño. Usa el mismo ZOOM que los botones +/−; desplazar con un dedo sigue siendo nativo. */

SATE.pestana('horarios',{montar(){drawCals();renderGTime()},mostrar(){renderHor()},ocultar(){S.hover=null}});
