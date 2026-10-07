$('#f-hide').addEventListener('change',e=>{S.hide=e.target.checked;store.set('hide',S.hide);renderOffer()});
$('#f-fit').addEventListener('change',e=>{S.fit=e.target.checked;renderOffer()});
$('#f-want').addEventListener('change',e=>{S.onlyWant=e.target.checked;store.set('onlyWant',S.onlyWant);renderOffer()});
$('#f-weekend').addEventListener('change',e=>{S.weekend=e.target.checked;store.set('weekend',S.weekend);renderCal()});
$('#f-q').addEventListener('input',e=>{S.q=e.target.value;S.acIdx=-1;renderAC();renderOffer()});
$('#f-q').addEventListener('keydown',e=>{
  const n=S.acItems.length;
  if(e.key==='ArrowDown'&&n){e.preventDefault();S.acIdx=(S.acIdx+1)%n;renderAC()}
  else if(e.key==='ArrowUp'&&n){e.preventDefault();S.acIdx=(S.acIdx-1+n)%n;renderAC()}
  else if(e.key==='Enter'&&n){e.preventDefault();pick(S.acIdx<0?0:S.acIdx)}
  else if(e.key==='Escape'){S.acIdx=-1;$('#ac').hidden=true;$('#f-q').setAttribute('aria-expanded','false')}
  else if(e.key==='Backspace'&&!e.target.value&&S.chips.length){S.chips.pop();renderActive();renderOffer()}
});
$('#f-q').addEventListener('blur',()=>setTimeout(()=>{$('#ac').hidden=true;$('#f-q').setAttribute('aria-expanded','false')},150));
$('#f-q').addEventListener('focus',()=>{if(S.q)renderAC()});
for(const [id,list] of [['#g-pref','gpref'],['#g-avoid','gavoid']]){
  const add=el=>{const v=el.value.trim();if(v&&!S[list].includes(v)){S[list].push(v);
    if(list==='gavoid'){store.set('excl',S.gavoid);renderActive();renderOffer()}else renderGPrefs()}el.value=''};
  $(id).addEventListener('change',e=>add(e.target));
  // al elegir una opción del autocompletado se agrega de inmediato (sin Enter): el texto coincide con un profesor de la lista
  $(id).addEventListener('input',e=>{const v=e.target.value.trim();if(v&&[...$('#proflist').options].some(o=>o.value===v))add(e.target)});
}
// horario en la escuela y descansos (se vuelven a generar las opciones si ya había resultados)
const gtChanged=()=>{gtSave();renderOffer();if(S.gen){S.gen=generate();renderGen()}};
$('#g-from').addEventListener('change',e=>{GT.a=e.target.value;gtChanged()});
$('#g-to').addEventListener('change',e=>{GT.b=e.target.value;gtChanged()});
$('#b-reset').addEventListener('click',()=>{
  Object.assign(S,{tur:'*',niv:'*',q:'',chips:[],hide:false,fit:false,gap:null,onlyWant:true,gavoid:[],gt:'*',gpref:[],gen:null});S.expand=new Set();
  ws().marks={};save();   // también quita las marcas «Sí / Quizá / No» (y sus notas) del periodo consultado
  ['tur','niv'].forEach(k=>store.set(k,'*'));store.set('hide',false);store.set('onlyWant',true);store.set('excl',[]);
  Object.assign(GT,{a:'',b:'',breaks:[],days:'',n:'',src:''});gtSave();$('#f-q').value='';$('#g-avoid').value='';$('#g-pref').value='';
  if($('#gen'))$('#gen').open=false;renderGTime();render()});
$('#g-src').addEventListener('click',e=>{const b=e.target.closest('[data-gsrc]');if(!b)return;GT.src=b.dataset.gsrc;renderGTime();gtChanged()});
$('#g-n').addEventListener('click',e=>{const b=e.target.closest('[data-gn]');if(!b)return;GT.n=b.dataset.gn;renderGTime();gtChanged()});
$('#g-days').addEventListener('click',e=>{const b=e.target.closest('[data-gdays]');if(!b)return;GT.days=b.dataset.gdays;renderGTime();gtChanged()});
$('#gbreaks').addEventListener('click',e=>{
  if(e.target.id==='b-addbrk'){GT.breaks.push({d:30,a:'13:00',b:'15:00'});renderGTime();gtChanged()}
  else if(e.target.dataset.unbrk){GT.breaks.splice(+e.target.dataset.unbrk,1);renderGTime();gtChanged()}
  else if(e.target.dataset.bday){const b=GT.breaks[+e.target.closest('[data-brk]').dataset.brk],v=e.target.dataset.bday;
    if(v==='all')b.days=[];else{const d=+v,ds=new Set(b.days||[]);ds.has(d)?ds.delete(d):ds.add(d);b.days=[...ds].sort()}
    renderGTime();gtChanged()}});
$('#gbreaks').addEventListener('change',e=>{const r=e.target.closest('[data-brk]'),f=e.target.dataset.f;if(!r||!f)return;GT.breaks[+r.dataset.brk][f]=e.target.value;gtChanged()});
$('#b-gen').addEventListener('click',()=>{S.gen=generate();renderGen();window.ENCUESTA?.marcar('gen')});
$('#offer').addEventListener('pointerover',e=>{if(e.pointerType!=='mouse'||e.target.closest('.note'))return;const o=e.target.closest('.opt');const k=o?o.dataset.k:null;if(k!==S.hover){S.hover=k;renderCal()}});
$('#offer').addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&S.hover){S.hover=null;renderCal()}});
$('#cal').addEventListener('click',e=>{
  // clic en un hueco vacío: filtra la oferta a lo que cabe en ese bloque (otro clic en el mismo hueco lo quita)
  const g=e.target.closest('.gapcell');
  if(g){const [d,a]=g.dataset.gap.split('|').map(Number);S.gap=S.gap&&S.gap.d===d&&S.gap.a===a?null:{d,a,b:a+BLOCK};
    renderActive();renderOffer();renderCal();if(S.gap)$('#h-offer').scrollIntoView({block:'start',behavior:'smooth'});return}
  const b=e.target.closest('.blk[data-k]:not(.ghost)');if(!b)return;const o=document.querySelector(`.opt[data-k="${CSS.escape(b.dataset.k)}"]`);if(o)o.scrollIntoView({block:'center',behavior:'smooth'})});
$('#own-f').addEventListener('submit',e=>{
  e.preventDefault();const n=$('#own-n').value.trim(),a=toMin($('#own-a').value),b=toMin($('#own-b').value);
  const msg=!S.ownDays.length?'Selecciona al menos un día':b<=a?'La hora final debe ser posterior a la inicial':'';
  if(!n||msg){$('#own-n').setCustomValidity(msg);$('#own-n').reportValidity();$('#own-n').setCustomValidity('');return}
  plan().own.push({n,d:[...S.ownDays].sort(),a,b});
  if(S.ownDays.some(d=>d>=5)){S.weekend=true;store.set('weekend',true);$('#f-weekend').checked=true}
  $('#own-n').value='';S.ownDays=[];renderOwnForm();refresh();
});
$('#b-saeshor').addEventListener('click',()=>loadInscrito());
$('#b-clear').addEventListener('click',()=>{plan().sel=[];plan().own=[];$('#copybox').hidden=true;refresh()});


$('#equiv').addEventListener('toggle',renderEquiv);
function base(){return classes().filter(c=>c[0]===S.car&&(S.tur==='*'||c[1]===S.tur)&&(S.niv==='*'||c[2]===S.niv))}
function filtered(){
  const q=norm(S.q.trim()), marks=ws().marks, want=new Set(tr().want);
  const m=S.chips.filter(x=>x.t==='m').map(x=>x.v), p=S.chips.filter(x=>x.t==='p').map(x=>x.v), g=S.chips.filter(x=>x.t==='g').map(x=>x.v);
  // llenar huecos: en toda la carrera, sin lo ya elegido/acreditado, sin choques y (si hay hueco) con clase en ese bloque
  const hunt=S.fit||!!S.gap, sel=selected(), own=ownAsClasses(), have=new Set(sel.map(c=>c[4])), done=new Set(isPersonal()?tr().done:[]);
  const fits=c=>c[6].length&&!have.has(c[4])&&!done.has(c[8])&&![...sel,...own].some(x=>overlaps(x,c))&&
    (!S.gap||c[6].some(([d,a,b])=>d===S.gap.d&&a<S.gap.b&&S.gap.a<b));
  const mine=new Set(plan().sel);
  return base().filter(c=>(mine.has(keyOf(c))||!outWin(c))&&(!S.hide||mine.has(keyOf(c))||!isExcl(c))&&(hunt?fits(c):(!S.onlyWant||!want.size||want.has(c[8])))&&(!m.length||m.includes(c[4]))&&(!p.length||c[5].some(i=>p.includes(i)))&&(!g.length||g.includes(c[3]))&&
    (!S.hide||marks[keyOf(c)]?.s!=='no'||plan().sel.includes(keyOf(c)))&&
    (!q||norm(name(c)+' '+c[8]+' '+profs(c)+' '+c[3]).includes(q)));
}
function suggest(q){
  q=norm(q.trim());if(!q)return[];
  const cs=classes().filter(c=>c[0]===S.car), out=[], seen=new Set();
  const hit=s=>norm(s).includes(q);
  const push=(t,v,label,right)=>{const k=t+v;if(seen.has(k)||S.chips.some(x=>x.t===t&&x.v===v))return;seen.add(k);out.push({t,v,label,right})};
  cs.forEach(c=>{if(hit(name(c))||hit(c[8]))push('m',c[4],name(c),`${c[8]} · ${fmtCr(c[7])} cr`)});
  cs.forEach(c=>c[5].forEach(i=>{if(hit(DATA.prof[i]))push('p',i,DATA.prof[i],'')}));
  cs.forEach(c=>{if(hit(c[3]))push('g',c[3],c[3],TURNOS[c[1]]||'')});
  const rank=x=>(norm(x.label).startsWith(q)?0:1);
  return out.sort((a,b)=>rank(a)-rank(b)||'mpg'.indexOf(a.t)-'mpg'.indexOf(b.t)).slice(0,10);
}
function hl(s,q){const i=norm(s).indexOf(norm(q.trim()));return i<0?esc(s):esc(s.slice(0,i))+'<mark>'+esc(s.slice(i,i+q.trim().length))+'</mark>'+esc(s.slice(i+q.trim().length))}
function renderAC(){
  const ac=$('#ac'), inp=$('#f-q');
  S.acItems=suggest(S.q);
  if(!S.acItems.length){ac.hidden=true;inp.setAttribute('aria-expanded','false');inp.removeAttribute('aria-activedescendant');return}
  const K={m:'Materia',p:'Profesor',g:'Grupo'};
  ac.innerHTML=S.acItems.map((x,i)=>`<li id="ac-${i}" role="option" data-i="${i}" aria-selected="${i===S.acIdx}"><span class="k">${K[x.t]}</span><span>${hl(x.label,S.q)}</span><span class="r">${esc(x.right)}</span></li>`).join('');
  ac.hidden=false;inp.setAttribute('aria-expanded','true');
  if(S.acIdx>=0)inp.setAttribute('aria-activedescendant','ac-'+S.acIdx);else inp.removeAttribute('aria-activedescendant');
}
function pick(i){const x=S.acItems[i];if(!x)return;S.chips.push({t:x.t,v:x.v});S.q='';$('#f-q').value='';S.acIdx=-1;renderAC();renderActive();renderOffer()}
function renderActive(){
  const K={m:'materia',p:'profesor',g:'grupo'};
  const lab=x=>x.t==='m'?DATA.asig[x.v]:x.t==='p'?DATA.prof[x.v]:x.v;
  $('#active').innerHTML=S.chips.map((x,i)=>`<span class="pill"><i>${K[x.t]}</i>${esc(lab(x))}<button data-unchip="${i}" aria-label="Quitar filtro ${esc(lab(x))}">×</button></span>`).join('')+
    (S.chips.length>1?'<button class="link" data-unchip="all">Quitar todos</button>':'')+
    S.gavoid.map((p,i)=>`<span class="pill"><i>excluir</i>${esc(p)}<button data-unga="${i}" aria-label="Quitar ${esc(p)}">×</button></span>`).join('')+
    (S.gap?`<span class="pill gap"><i>hueco</i>${DAYS[S.gap.d]} ${hm(S.gap.a)}–${hm(S.gap.b)}<button data-ungap="1" aria-label="Quitar filtro de hueco">×</button></span>`:'');
}
function renderHFilters(){
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===S.view));
  document.querySelectorAll('[data-gt]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.gt===S.gt));
  $('#f-hide').checked=S.hide;$('#f-weekend').checked=S.weekend;
  const n=tr().want.length;$('#f-want').checked=S.onlyWant&&n>0;$('#f-want').disabled=!n;
  $('#f-want-l').textContent=n?(n>1?`Solo las ${n} elegidas en el mapa`:'Solo la elegida en el mapa'):'Solo las elegidas en el mapa (selecciónalas en «Mi trayectoria»)';
  const mine=classes().filter(c=>c[0]===S.car);
  const turs=[...new Set(mine.map(c=>c[1]))].sort();
  if(S.tur!=='*'&&!turs.includes(S.tur)) S.tur='*';
  $('#f-turno').innerHTML=[['*','Todos'],...turs.map(t=>[t,TURNOS[t]||t])].map(([v,l])=>`<button class="chip" data-tur="${v}" aria-pressed="${v===S.tur}">${l}</button>`).join('');
  const nivs=[...new Set(mine.map(c=>c[2]))].sort((a,b)=>a-b);
  if(S.niv!=='*'&&!nivs.includes(S.niv)) S.niv='*';
  $('#f-nivel').innerHTML=[['*','Todos'],...nivs.map(n=>[n,n])].map(([v,l])=>`<button class="chip" data-niv="${v}" aria-pressed="${v===S.niv}">${l}</button>`).join('');
  $('#proflist').innerHTML=[...new Set(mine.flatMap(c=>c[5]))].map(i=>`<option value="${esc(DATA.prof[i])}">`).join('');
  renderActive();renderGPrefs();
}
/* Salones (índice 10, paralelo a los bloques; solo periodo actual, del PDF de horarios por aula de la unidad) */
const shortRoom=r=>String(r||'').replace(/^Aula\s+/,'');
const roomAt=(c,d,a)=>{const i=(c[6]||[]).findIndex(x=>x[0]===d&&x[1]===a);return i>=0&&c[10]?c[10][i]||'':''};
function roomsTxt(c){if(!c[10]||!c[10].some(Boolean))return '';const by=new Map();
  c[6].forEach((b,i)=>{const r=c[10][i];if(!r)return;const ds=by.get(r)||[];if(!ds.includes(b[0]))ds.push(b[0]);by.set(r,ds)});
  return [...by].map(([r,ds])=>`${esc(shortRoom(r))}${by.size>1?` (${ds.sort((x,y)=>x-y).map(d=>DAYS[d]).join(', ')})`:''}`).join(' · ')}
/* Líneas de especialización de una optativa (por clave o por nombre, ya que una optativa puede tener varias claves) */
function lineasDe(k){const c=cur(), n=c[k]?.[0]?.toUpperCase();if(!n)return[];
  return (MAP().lineas||[]).filter(l=>l.claves.some(x=>x===k||c[x]?.[0]?.toUpperCase()===n)).map(l=>l.linea!==l.area?l.linea:l.area)}
function optRow(c,sel,inGroup){
  const k=keyOf(c), on=plan().sel.includes(k), mk=ws().marks[k]||{};
  const clash=[...sel,...ownAsClasses()].filter(s=>(s.own||keyOf(s)!==k)&&overlaps(s,c));
  const same=sel.find(s=>s[4]===c[4]&&keyOf(s)!==k);
  let tags='';
  if(!on&&clash.length) tags+=`<span class="tag bad">Choca con ${clash.map(s=>s.own?esc(s.n):s[3]+' '+name(s).toLowerCase()).join(', ')}</span>`;
  if(!on&&same) tags+=`<span class="tag soft">Reemplaza ${same[3]}</span>`;
  const who=inGroup?`<b>${esc(name(c))}</b> <small>${c[8]} · ${fmtCr(c[7])} cr</small><br>${esc(profs(c))}`:esc(profs(c));
  if(isExcl(c)) tags+='<span class="tag soft">profesor excluido</span>';
  return `<div class="opt${mk.s==='no'||isExcl(c)?' no':''}" data-k="${k}"><span class="grp">${inGroup?'':c[3]}</span><span class="who">${who}</span>
    <div class="right"><button class="add" data-toggle="${k}" aria-pressed="${on}">${on?'Quitar':'Agregar'}</button>
      <span class="marks" role="group" aria-label="Marcar opción"${isExcl(c)?' title="Profesor excluido: se trata como «No». Quítalo de «Excluir profesores» para marcar este grupo."':''}>${[['si','Sí'],['quiza','Quizá'],['no','No']].map(([m,l])=>isExcl(c)?`<button disabled data-m="${m}" aria-pressed="${m==='no'}">${l}</button>`:`<button data-mark="${m}" data-m="${m}" data-k="${k}" aria-pressed="${mk.s===m}">${l}</button>`).join('')}</span></div>
    <span class="when">${pattern(c).map(p=>`<span>${p}</span>`).join('')}${roomsTxt(c)?`<span class="room">Salón: ${roomsTxt(c)}</span>`:''}</span>
    ${tags?`<span class="tags">${tags}</span>`:''}
    ${mk.s?`<input class="note" type="text" data-note="${k}" value="${esc(mk.n||'')}" placeholder="Nota sobre este grupo o profesor" aria-label="Nota">`:''}</div>`;
}
/* filtros globales: profesores excluidos (cuentan como "No") y horario en la escuela (de … a …) */
const isExcl=c=>{const ex=S.gavoid.map(norm);return ex.length>0&&c[5].some(i=>ex.some(p=>norm(DATA.prof[i]).includes(p)))};
const outWin=c=>{const ga=tmin(GT.a),gb=tmin(GT.b);return c[6].some(([d,a,b])=>(ga!=null&&a<ga)||(gb!=null&&b>gb))};
// orden de la oferta: primero la desfasada (obligatoria), luego las reprobadas por recursar, después el orden normal
const prio=k=>{if(!isPersonal()||!cur()[k])return 2;const st=statusOf(k);return st.startsWith('late fail')?0:st.startsWith('fail')?1:2};
/* ---------- generador de horarios ---------- */
/* horario en la escuela y descansos: preferencias del alumno para el generador (se guardan en este navegador) */
const GT=Object.assign({a:'',b:'',breaks:[],days:'',n:'',src:''},store.get('gtime',{}));
const daysOf=cs=>[...new Set(cs.flatMap(c=>c[6].map(x=>x[0])))].sort((a,b)=>a-b);
const tmin=t=>{const m=String(t||'').match(/^(\d{1,2}):(\d{2})/);return m?+m[1]*60+ +m[2]:null}; // '' -> null
const gtSave=()=>store.set('gtime',GT);
function renderGTime(){
  $('#g-from').value=GT.a;$('#g-to').value=GT.b;
  document.querySelectorAll('[data-gdays]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gdays===String(GT.days||''))));
  document.querySelectorAll('[data-gsrc]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gsrc===String(GT.src||''))));
  document.querySelectorAll('[data-gn]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gn===String(GT.n||''))));
  $('#gbreaks').innerHTML=GT.breaks.map((b,i)=>`<div class="gbrk" data-brk="${i}">al menos <select data-f="d" aria-label="Duración del descanso">${[30,60,90,120].map(m=>`<option value="${m}"${+b.d===m?' selected':''}>${({30:'30 min',60:'1 h',90:'1 h 30 min',120:'2 h'})[m]}</option>`).join('')}</select> libres entre <input type="time" step="1800" data-f="a" value="${b.a}" aria-label="Desde"> y <input type="time" step="1800" data-f="b" value="${b.b}" aria-label="Hasta"><span class="brkdays" role="group" aria-label="Días del descanso"><button type="button" class="chip" data-bday="all" aria-pressed="${!(b.days||[]).length}">Todos los días</button>${DAYS.slice(0,6).map((n,d)=>`<button type="button" class="chip" data-bday="${d}" aria-pressed="${(b.days||[]).includes(d)}">${n}</button>`).join('')}</span><button type="button" class="x" data-unbrk="${i}" aria-label="Quitar descanso">×</button></div>`).join('')+
    `<button type="button" class="link" id="b-addbrk">+ Agregar descanso</button>`;
}
// ¿cada día con clases deja un hueco de al menos d minutos dentro de [a,b]?
function breaksOk(cs){
  const brk=GT.breaks.map(b=>({d:+b.d,a:tmin(b.a),b:tmin(b.b),days:b.days||[]})).filter(b=>b.a!=null&&b.b!=null&&b.b-b.a>=b.d);
  if(!brk.length) return true;
  const days=new Set(cs.flatMap(c=>c[6].map(x=>x[0])));
  for(const d of days){
    const busy=cs.flatMap(c=>c[6].filter(x=>x[0]===d).map(x=>[x[1],x[2]])).sort((x,y)=>x[0]-y[0]);
    for(const b of brk){if(b.days.length&&!b.days.includes(d))continue;  // descanso solo en ciertos días
      let t=b.a,gap=0;
      for(const [x,y] of busy){if(y<=b.a||x>=b.b)continue;gap=Math.max(gap,Math.max(b.a,x)-t);t=Math.max(t,Math.min(y,b.b))}
      gap=Math.max(gap,b.b-t);if(gap<b.d)return false}
  }
  return true;
}
function renderGPrefs(){
  $('#gprefs').innerHTML=S.gpref.map((p,i)=>`<span class="pill"><i>priorizar</i>${esc(p)}<button data-ungp="${i}" aria-label="Quitar ${esc(p)}">×</button></span>`).join('');
}
function generate(){
  // materias y grupos: los mismos que muestra la oferta con sus filtros (turno, nivel, búsqueda, materia, profesor, grupo,
  // «solo las elegidas», horario en la escuela, excluidos). «Solo lo que cabe» y la búsqueda de huecos no aplican aquí.
  const todo=GT.src==='todo';   // «Todas las elegidas»: sin los filtros de la oferta
  const pool=todo?classes().filter(c=>c[0]===S.car):(()=>{const f=S.fit,g=S.gap;S.fit=false;S.gap=null;try{return filtered()}finally{S.fit=f;S.gap=g}})();
  let want=todo?(tr().want.length?tr().want.slice():[...new Set(S.chips.filter(x=>x.t==='m').map(x=>classes().find(c=>c[4]===x.v)?.[8]).filter(Boolean))]):[...new Set(pool.map(c=>c[8]))];
  if(!todo&&!S.onlyWant&&!S.chips.some(x=>x.t==='m')&&tr().want.length){const w=new Set(tr().want);want=want.filter(k=>w.has(k))}   // sin filtro de materias: las elegidas
  tr().oblig.forEach(k=>{if(!want.includes(k))want.unshift(k)});   // la desfasada siempre se considera
  {const ya=new Set([...tr().done,...tr().curso]);want=want.filter(k=>!ya.has(k))}   // ni acreditadas ni en curso
  const marks=ws().marks, own=ownAsClasses();
  const pref=S.gpref.map(norm), avoid=S.gavoid.map(norm);
  const pscore=c=>c[5].reduce((s,i)=>s+(pref.some(p=>norm(DATA.prof[i]).includes(p))?4:0),0);
  const bad=c=>marks[keyOf(c)]?.s==='no'||c[5].some(i=>avoid.some(p=>norm(DATA.prof[i]).includes(p)))||(S.gt!=='*'&&c[1]!==S.gt)||own.some(o=>overlaps(o,c))||outside(c);
  const ga=tmin(GT.a), gb=tmin(GT.b);
  function outside(c){return c[6].some(([d,a,b])=>(ga!=null&&a<ga)||(gb!=null&&b>gb))}
  const inPool=new Set(pool.map(keyOf));
  const subj=want.map(k=>{const all=classes().filter(c=>c[0]===S.car&&c[8]===k&&!bad(c)), f=all.filter(c=>inPool.has(keyOf(c)));
    return {k,must:tr().oblig.includes(k),opts:f.length||!tr().oblig.includes(k)?f:all}}).filter(s=>cur()[s.k]||s.opts.length);
  if(!subj.length) return {msg:'Selecciona materias en «Mi trayectoria» o mediante el buscador para generar horarios.'};
  // optativas por nivel: una opción no lleva más optativas de un nivel que espacios libres tenga el plan en ese nivel
  const oq=optCupo(), oex=optExceso(subj.map(s=>s.k),oq);
  const conAviso=r=>{if(Object.keys(oex).length)r.optExceso=oex;return r};
  if(GT.n==='auto') return conAviso(generateBank(subj,'auto',{marks,pscore,oq}));
  const N=+GT.n||0;
  if(N&&N<subj.length) return conAviso(generateBank(subj,N,{marks,pscore,oq}));
  subj.sort((a,b)=>a.opts.length-b.opts.length);
  const res=[];let nodes=0, minDays=Infinity;const maxD=+GT.days||0;
  const pick=[];
  const score=()=>{
    const cs=pick.filter(Boolean);let s=cs.length*100;
    cs.forEach(c=>{const m=marks[keyOf(c)]?.s;s+=m==='si'?6:m==='quiza'?2:0;s+=pscore(c)});
    if($('#g-compact').checked){for(let d=0;d<6;d++){const b=cs.flatMap(c=>c[6].filter(x=>x[0]===d)).sort((x,y)=>x[1]-y[1]);if(b.length)s-=2;for(let i=1;i<b.length;i++)s-=Math.max(0,b[i][1]-b[i-1][2])/30}}
    return s;
  };
  const rec=i=>{
    if(++nodes>250000) return;
    if(i===subj.length){const cs=pick.filter(Boolean);if(!cs.length||!breaksOk(cs))return;
      const nd=daysOf(cs).length;
      // mínimo de días posible llevando todas las materias que tienen grupos (antes de aplicar el límite)
      if(subj.every((x,j)=>pick[j]||!x.opts.length))minDays=Math.min(minDays,nd);
      if(maxD&&nd>maxD)return;
      res.push({cs:cs.slice(),s:score(),miss:subj.filter((x,j)=>!pick[j]).map(x=>x.k),days:daysOf(cs)});return}
    const nv=nivOpt(subj[i].k,oq), llena=nv&&pick.slice(0,i).filter((p,j)=>p&&nivOpt(subj[j].k,oq)===nv).length>=oq[nv].libre;   // espacio del nivel ya cubierto
    if(!llena)for(const c of subj[i].opts){if(pick.some(p=>p&&overlaps(p,c)))continue;pick[i]=c;rec(i+1)}
    if(!subj[i].must||!subj[i].opts.length){pick[i]=null;rec(i+1)}   // una obligatoria con grupos no se puede omitir
  };
  rec(0);
  const seen=new Set();
  const top=res.sort((a,b)=>b.s-a.s).filter(r=>{const k=r.cs.map(keyOf).sort().join();if(seen.has(k))return false;seen.add(k);return true}).slice(0,6);
  return conAviso({top,subj,trunc:nodes>250000,minDays:minDays===Infinity?null:minDays,maxD});
}
/* Banco de materias: horarios con exactamente N materias tomadas de las seleccionadas. Recorre subconjuntos en orden
   de prioridad (obligatoria por desfase siempre incluida; luego reprobadas, atrasadas, sugeridas y marcadas «Sí»),
   descarta los que exceden la carga permitida y, para cada subconjunto, busca la mejor combinación de grupos.
   Se muestran opciones con materias distintas (la mejor de cada subconjunto). */
/* Calidad de un horario (modo Automático). Criterios basados en recomendaciones sobre sueño, atención y descanso:
   permanencia diaria ≤ 8 h (ideal ≤ 6.5 h), a lo sumo 3 clases (4.5 h) seguidas, espacio de ≥ 1 h para comer entre
   12:00 y 16:30 si el día cruza el mediodía, pocas horas libres largas, evitar entrar a las 7:00 y salir después de las
   19:00 el mismo día, y repartir las clases entre los días. Devuelve {ok, pen, span, comida}. */
function qualityOf(cs){
  let pen=0, ok=true, span=0, comida=true;const per=[];
  for(let d=0;d<6;d++){
    const b=cs.flatMap(c=>c[6].filter(x=>x[0]===d)).sort((x,y)=>x[1]-y[1]);if(!b.length)continue;
    const a0=b[0][1], z=Math.max(...b.map(x=>x[2]));span=Math.max(span,z-a0);per.push(b.length);
    if(z-a0>480)ok=false; else if(z-a0>390)pen+=(z-a0-390)/30*2;
    let run=b[0][2]-b[0][1], meal=false;
    for(let i=1;i<b.length;i++){const g=b[i][1]-Math.max(...b.slice(0,i).map(x=>x[2]));
      if(g>=30){run=0;if(g>90)pen+=(g-90)/30*3;
        const ga=Math.max(...b.slice(0,i).map(x=>x[2])), gb=b[i][1];if(Math.min(gb,990)-Math.max(ga,720)>=60)meal=true}
      run+=b[i][2]-b[i][1];if(run>270)ok=false;else if(run>180)pen+=4}
    if(a0<780&&z>900&&!meal){ok=false;comida=false}
    if(a0<=420&&z>=1140)pen+=8;
  }
  if(per.length>1){const m=per.reduce((x,y)=>x+y,0)/per.length;pen+=per.reduce((x,y)=>x+(y-m)**2,0)/per.length*2}
  return {ok,pen,span,comida};
}
function generateBank(subj,N,{marks,pscore,oq}){
  const auto=N==='auto';
  const maxD=+GT.days||0, ci=cargaInfo(0), failS=new Set(tr().fail), sugS=new Set(MARK.sug);
  const cost=k=>failS.has(k)?0:(cur()[k]?.[1]||0);
  const prio=k=>{const st=statusOf(k);return (st==='late fail'?50:st==='fail'?35:st.startsWith('late')||st.startsWith('prev')?20:0)+(sugS.has(k)?10:0)};
  // en Automático las reprobadas también son fijas: no suman créditos nuevos (ya están retenidos) y conviene acreditarlas pronto
  const fixed=x=>x.must||(auto&&statusOf(x.k).includes('fail'));
  const must=subj.filter(x=>fixed(x)&&x.opts.length), free=subj.filter(x=>!fixed(x)&&x.opts.length)
    .sort((a,b)=>prio(b.k)-prio(a.k)||a.opts.length-b.opts.length);
  const nuevosDe=set=>set.reduce((s,x)=>s+cost(x.k),0);
  // meta de créditos nuevos en modo Automático: carga media (con adeudos, sin rebasar lo permitido además de los retenidos)
  const meta=ci?(ci.adeudo?Math.max(0,Math.min(ci.L.media,ci.tope)-ci.ret):ci.L.media):40;
  const sizes=auto?[3,4,5,6,7,8].filter(n=>n>=must.length&&n<=must.length+free.length):[N];
  if(!sizes.length||sizes[0]-must.length<0) return {top:[],subj,bank:{N,M:subj.length},msg:null,trunc:false,minDays:null,maxD};
  const res=[];let subsets=0,trunc=false;const CAP=auto?160:400;
  const score=cs=>{let s=0;cs.forEach(c=>{const m=marks[keyOf(c)]?.s;s+=m==='si'?6:m==='quiza'?2:0;s+=pscore(c)+prio(c[8])});
    if($('#g-compact').checked){for(let d=0;d<6;d++){const b=cs.flatMap(c=>c[6].filter(x=>x[0]===d)).sort((x,y)=>x[1]-y[1]);if(b.length)s-=2;for(let i=1;i<b.length;i++)s-=Math.max(0,b[i][1]-b[i-1][2])/30}}
    return s};
  // mejor combinación de grupos para un subconjunto fijo de materias
  const bestFor=set=>{const ord=set.slice().sort((a,b)=>a.opts.length-b.opts.length), pick=[];let best=null,nodes=0;
    const rec=i=>{if(++nodes>4000)return;
      if(i===ord.length){if(!breaksOk(pick))return;const days=daysOf(pick);if(maxD&&days.length>maxD)return;
        let s, q=null;
        if(auto){q=qualityOf(pick);if(!q.ok&&estricto)return;
          // la cantidad la decide la meta de créditos: la prioridad cuenta como promedio, no como suma
          const m=pick.reduce((t,c)=>{const mk=marks[keyOf(c)]?.s;return t+(mk==='si'?6:mk==='quiza'?2:0)+pscore(c)},0);
          s=m+pick.reduce((t,c)=>t+prio(c[8]),0)/pick.length*2-q.pen*4-(q.ok?0:200)}
        else s=score(pick);
        if(!best||s>best.s)best={cs:pick.slice(),s,days,miss:[],q};return}
      for(const c of ord[i].opts){if(pick.some(p=>overlaps(p,c)))continue;pick.push(c);rec(i+1);pick.pop()}};
    rec(0);return best};
  // subconjuntos de tamaño need en orden de prioridad (combinaciones lexicográficas sobre la lista ordenada)
  // si ninguna combinación cumple los criterios de un horario saludable (p. ej. por profesores excluidos), se muestran
  // las más cercanas en lugar de no mostrar nada
  let estricto=true;
  const chosen=[];let need=0;
  const walk=start=>{if(subsets>=CAP){trunc=true;return}
    if(chosen.length===need){const set=[...must,...chosen], nuevos=nuevosDe(set);
      if(Object.keys(optExceso(set.map(x=>x.k),oq)).length)return;   // más optativas de un nivel que espacios libres
      if(ci&&ci.ret+nuevos>ci.tope+0.01)return;
      if(auto&&(nuevos>meta+7.5||(ci&&ci.ret+nuevos<ci.L.min-0.01&&set.length<must.length+free.length)))return;   // cerca de la meta y al menos la mínima
      subsets++;const b=bestFor(set);if(b){if(auto)b.s-=(nuevos<meta?(meta-nuevos)*8:(nuevos-meta)*3);res.push(b)}return}
    for(let i=start;i<=free.length-(need-chosen.length);i++){chosen.push(free[i]);walk(i+1);chosen.pop();if(subsets>=CAP){trunc=true;return}}};
  for(const n of sizes){need=n-must.length;subsets=0;walk(0)}
  if(auto&&!res.length){estricto=false;for(const n of sizes){need=n-must.length;subsets=0;walk(0)}}
  const top=res.sort((a,b)=>b.s-a.s).slice(0,6);
  const best=top.length?Math.max(...top.map(r=>nuevosDe(r.cs.map(c=>({k:c[8]}))))):0;
  return {top,subj,bank:{N,M:subj.length,tope:ci?.tope??null,auto,meta,best,relajado:auto&&!estricto&&top.length>0},trunc,minDays:null,maxD};
}
function renderGen(){
  const g=S.gen;
  if(!g){$('#genres').innerHTML='';return}
  if(g.msg){$('#genres').innerHTML=`<p class="empty">${g.msg}</p>`;return}
  const dmsg=g.bank?.auto?`<p class="gdays-msg">Selección automática entre tus <b>${g.bank.M}</b> materias: busca cerca de <b>${fmtCr(g.bank.meta)} créditos nuevos</b> (carga media${g.bank.tope!=null?`, sin rebasar ${fmtCr(g.bank.tope)} cr en total`:''}) con un horario saludable: hasta 8 h en la escuela (idealmente 6.5 h o menos), no más de 3 clases seguidas, al menos 1 h para comer entre 12:00 y 16:30, pocas horas libres y clases repartidas entre los días.</p>${g.bank.relajado?'<p class="gdays-msg warn">Con tus exclusiones y filtros ninguna combinación cumple todos estos criterios; se muestran las más cercanas. Revisa la permanencia y los descansos de cada opción, o reduce las exclusiones.</p>':''}${g.top.length&&g.bank.best<g.bank.meta-4.5?`<p class="gdays-msg warn">Con la oferta actual, las combinaciones que cumplen estos criterios llegan a <b>${fmtCr(g.bank.best)} créditos nuevos</b>. Para una carga mayor elige un número de materias por horario; esas opciones pueden tener jornadas más largas.</p>`:''}`:g.bank?`<p class="gdays-msg">Horarios de <b>${g.bank.N} materias</b> elegidas entre tus <b>${g.bank.M}</b> seleccionadas${g.bank.tope!=null?`, sin rebasar tu carga permitida (${fmtCr(g.bank.tope)} cr en total)`:''}. Cada opción combina materias distintas.</p>`:g.minDays!=null?`<p class="gdays-msg${g.maxD&&g.minDays>g.maxD?' warn':''}">Con todas las materias seleccionadas, el mínimo es de <b>${g.minDays} ${g.minDays>1?'días':'día'}</b> a la semana.${g.maxD&&g.minDays>g.maxD?` En ${g.maxD} días no es posible incluirlas todas; las opciones omiten al menos una materia.`:g.maxD?` Es posible en ${g.maxD} días o menos.`:''}</p>`:'';
  const oex=g.optExceso?Object.entries(g.optExceso).map(([v,x])=>x.libre<=0?`el plan ya tiene ${x.total===1?'cubierto su espacio':'cubiertos sus '+x.total+' espacios'} de optativa de nivel ${v}`:`el plan solo tiene ${x.libre===1?'un espacio libre':x.libre+' espacios libres'} de optativa de nivel ${v} y elegiste ${x.n}`):[];
  const oexMsg=oex.length?`<p class="gdays-msg warn">Optativas de un mismo nivel: ${oex.join('; ')}. Ninguna opción lleva más optativas de ese nivel que espacios por cubrir; para cursar optativas adicionales agrégalas a mano.</p>`:'';
  const none=g.subj.filter(s=>!s.opts.length).map(s=>s.k), mustNone=g.subj.filter(s=>s.must&&!s.opts.length).map(s=>s.k);
  const must=g.subj.filter(s=>s.must&&s.opts.length).map(s=>s.k);
  const omsg=(mustNone.length?`<p class="gdays-msg warn"><b>${mustNone.map(k=>esc(pretty(cur()[k][0]))).join(', ')}</b> es obligatoria por desfase y ningún grupo cumple los filtros actuales. Ajusta el turno, el horario, los descansos o los días.</p>`:'')+
    (must.length?`<p class="gdays-msg">Todas las opciones incluyen <b>${must.map(k=>esc(pretty(cur()[k][0]))).join(', ')}</b>, obligatoria por desfase.</p>`:'');
  if(!g.top.length){$('#genres').innerHTML=dmsg+omsg+oexMsg+'<p class="empty">No hay combinaciones que cumplan los criterios. Reduce las preferencias o exclusiones, cambia el turno o amplía el horario y los descansos.</p>';return}
  $('#genres').innerHTML=dmsg+omsg+oexMsg+
    (none.length?`<small class="warn">Sin grupos que cumplan los filtros: ${none.map(k=>esc(cur()[k]?.[0]||k)).join(', ')}.</small>`:'')+
    g.top.map((r,i)=>{const cr=r.cs.reduce((s,c)=>s+c[7],0);
      return `<div class="gen"><div><b>Opción ${i+1}</b> · ${r.cs.length} ${r.cs.length>1?'materias':'materia'} · ${fmtCr(cr)} cr · ${r.days.length} ${r.days.length>1?'días':'día'}: ${r.days.map(d=>DAYS[d]).join(' ')}${r.q?` · hasta ${(r.q.span/60).toFixed(1).replace('.0','')} h en la escuela · con espacio para comer`:''}${r.miss.length?` · <span class="warn">sin ${r.miss.length}: ${r.miss.map(k=>esc(pretty(cur()[k]?.[0]||k))).join(', ')}</span>`:''}<div class="ls">${r.cs.map(c=>`<span class="grp">${c[3]}</span> ${esc(pretty(name(c)))}`).join(' · ')}</div></div>
        <div class="acts"><button class="btn" data-useg="${i}" data-to="${ws().plan}">Usar en ${ws().plan}</button><button class="btn" data-useg="${i}" data-to="+">Usar en un horario nuevo</button><button class="btn" data-peekg="${i}">Ver</button></div></div>`}).join('')+
    (g.trunc?(g.bank?'<small>Se analizaron las combinaciones de mayor prioridad (desfasadas, reprobadas, atrasadas y sugeridas primero).</small>':'<small>Búsqueda limitada por el número de combinaciones; reduce las materias seleccionadas para un análisis completo.</small>'):'');
}


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

/* Zoom del mapa con pellizco (dos dedos) y con el trackpad o Ctrl + rueda, centrado en el punto del gesto.
   Durante el pellizco solo se escala con CSS (instantáneo, sigue a los dedos); al soltar se redibuja una vez a la
   escala final. La respuesta es proporcional y amplificada (exponente GAIN): un pellizco amplio acerca mucho más que
   uno pequeño. Usa el mismo ZOOM que los botones +/−; desplazar con un dedo sigue siendo nativo. */

SATE.pestana('horarios',{montar(){drawCals();renderGTime()},mostrar(){renderHor()},ocultar(){S.hover=null}});

$('#b-export').addEventListener('click', async () => {
  try { await SATE.script('exportacion.js'); abrirExportacion(); }
  catch (e) { SATE.error(e); }
});
