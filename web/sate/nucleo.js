const DATA=window.SATE_DATA;
const UNIDAD=DATA.unidad||'upiita';window.IPNT_UNIDAD=UNIDAD;   // la UPIITA conserva el prefijo hu.; otras unidades, hu.<unidad>.
const DAYS=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'], DAYN=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
/* Dispositivo: en pantallas táctiles no existe el «hover»; tocar una materia la enfoca y un segundo toque la selecciona.
   En teléfono vertical la trayectoria se muestra en lista y el horario como agenda por día (el usuario puede cambiarlo). */
const MQ_PHONE=matchMedia('(max-width: 720px)'), MQ_NOHOVER=matchMedia('(hover: none)');
let PT=MQ_NOHOVER.matches?'touch':'mouse';
document.addEventListener('pointerdown',e=>{PT=e.pointerType||'mouse'},true);
const tactil=()=>PT!=='mouse';
const TURNOS={M:'Matutino',V:'Vespertino'};
const TIPO={O:'Obligatoria',P:'Optativa',T:'Taller'};
// Carga en créditos confirmada en SAES (Cita de reinscripción). Las demás carreras se agregan cuando se capturen.
const CARGA=UNIDAD==='upiita'?{B:{min:27,media:40,max:80}}:{};
const LETRAS='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const START=7*60, END=22*60, SLOT=30, SLOTPX=22, BLOCK=90;  // una clase dura 1:30
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
const hm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const toMin=t=>{const[h,m]=t.split(':').map(Number);return h*60+m};
const fmtCr=n=>Number.isInteger(+n)?String(+n):(+n).toFixed(2).replace(/0$/,'');
/*__CUENTA_JS__*/
// modo demostración: perfil ficticio solo en esta pestaña; no toca los datos reales ni la cuenta (enlace «…#demo»)
if(location.hash==='#demo'){try{sessionStorage.setItem('ipnt.demo',UNIDAD)}catch(e){}history.replaceState(null,'',location.pathname+location.search)}
const DEMO=(()=>{try{return sessionStorage.getItem('ipnt.demo')===UNIDAD}catch(e){return false}})();
const HU=DEMO?'hu.demo.'+UNIDAD+'.':UNIDAD==='upiita'?'hu.':'hu.'+UNIDAD+'.';
const ALM=DEMO?sessionStorage:localStorage;
const store={get(k,d){try{const v=ALM.getItem(HU+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){if(DEMO){try{ALM.setItem(HU+k,JSON.stringify(v))}catch(e){}}else IPNT.set(HU+k,JSON.stringify(v))}};   // IPNT: perfil sincronizable (tools/cuenta.py)

const S={tab:store.get('tab','tray'),per:store.get('per','proximo'),car:store.get('car','B'),tur:store.get('tur','*'),niv:store.get('niv','*'),q:'',view:store.get('view','materia'),
  hide:store.get('hide',false),fit:false,gap:null,onlyWant:store.get('onlyWant',true),weekend:store.get('weekend',false),chips:[],hover:null,acIdx:-1,acItems:[],ownDays:[],
  mode:'want',zoom:null,mapHover:null,gt:'*',gpref:[],gavoid:store.get('excl',[]),gen:null};
if(!DATA.carreras[S.car]) S.car=Object.keys(DATA.carreras)[0];
S.expand=new Set();S.mview=store.get('mview',null);S.cview=store.get('cview',null);S.mapFocus=false;S.lfocus=null;
// vista por defecto según el dispositivo; la elección explícita del usuario se recuerda
const mview=()=>S.mview||(MQ_PHONE.matches?'lista':'mapa'), cview=()=>S.cview||(MQ_PHONE.matches?'dia':'semana');

/* ---------- estado guardado ---------- */
const W={};
for(const p of ['proximo','actual']){
  W[p]=store.get('w.'+p,{plan:'A',plans:{A:{sel:store.get('sel.'+p,[])||[],own:[]}},marks:{}});
}
// horarios dinámicos: se empieza con A y el alumno agrega los que quiera; los vacíos heredados (B, C) se descartan
for(const p in W){const w=W[p];Object.keys(w.plans).forEach(k=>{const x=w.plans[k];if(k!=='A'&&k!==w.plan&&!x.sel.length&&!(x.own||[]).length)delete w.plans[k]});
  if(!w.plans[w.plan])w.plan=Object.keys(w.plans)[0]||'A';if(!w.plans.A&&!Object.keys(w.plans).length)w.plans.A={sel:[],own:[]}}
const ws=()=>W[S.per], plan=()=>ws().plans[ws().plan];
const planIds=()=>Object.keys(ws().plans).sort((a,b)=>a.length-b.length||a.localeCompare(b));
// siguiente letra después de la última existente (A, B, C… Z, AA, AB…); nunca reutiliza ni sobrescribe un horario
const planNum=id=>[...id].reduce((n,ch)=>n*26+LETRAS.indexOf(ch)+1,0);
const nextPlan=()=>{let n=Math.max(0,...planIds().map(planNum))+1, id='';while(n>0){n--;id=LETRAS[n%26]+id;n=Math.floor(n/26)}return id};
const save=()=>store.set('w.'+S.per,ws());
/*__SAES_JS__*/
// v1: solo se eligen materias para explorar. v2: el alumno pega sus datos del SAES (Lector IPN-tools) y se activa la vista personal.
let ALUMNO=DEMO?null:SAES.load();   // en modo demostración se genera después de conocer las funciones del mapa
// El perfil conserva los ids del SAES; la vista distingue los planes que reutilizan claves.
const carreraPerfil=d=>d?(Object.entries(DATA.opciones_plan||{}).find(([,v])=>v.carrera===d.carrera&&v.plan===d.plan)?.[0]||
  (Object.values(DATA.opciones_plan||{}).some(v=>v.carrera===d.carrera)?null:d.carrera)):null;
IPNT.set('ipnt.unidad',UNIDAD)   // horarios.html e inicio: abrir directo esta unidad
const isPersonal=()=>!!ALUMNO&&carreraPerfil(ALUMNO)===S.car;
const T={}; // por carrera: elegidas y, con datos del SAES, acreditadas y reprobadas
/* Simulación de fin de semestre (solo exploración, nunca toca los datos del SAES):
   las materias en curso se dan por aprobadas, salvo las que el alumno marque como reprobadas. */
const SIM=Object.assign({on:false,fail:[],res:{},rec:{}},store.get('sim',{}));   // res: {clave:{ok,cal}}; rec: {clave:{forma,cal}}
(SIM.fail||[]).forEach(k=>{SIM.res[k]=SIM.res[k]||{ok:false}});SIM.fail=[];   // versión anterior: solo lista de reprobadas
// cada bloque puede mostrar la simulación o los datos reales por separado; sin elección propia, sigue el interruptor general
const SIMBLK=store.get('simBlk',{});
const usaSim=blk=>SIMBLK[blk]??SIM.on;
// calcula fn con la simulación encendida o apagada solo durante ese cálculo (la caché de la trayectoria se rehace)
const conSim=(on,fn)=>{if(on===SIM.on)return fn();const prev=SIM.on;SIM.on=on;for(const k in T)delete T[k];
  try{return fn()}finally{SIM.on=prev;for(const k in T)delete T[k]}};
// materias de este plan equivalentes a una clave de otra carrera o plan, según la tabla de Equivalencias del SAES
const eqvPlan=k=>{const c=cur(),out=new Set();(DATA.equiv?.rel||[]).forEach(([o,ko,,d,kd])=>{if(ko===k&&d===S.car&&c[kd])out.add(kd);if(kd===k&&o===S.car&&c[ko])out.add(ko)});return [...out]};
const tr=()=>{
  if(!T[S.car]){
    const t=store.get('t.'+S.car,{want:[]}), me=isPersonal();
    const done0=me?[...new Set((ALUMNO.acreditadas||[]).filter(a=>a&&a[1]!=null&&String(a[1]).trim()!==''&&Number.isFinite(+a[1])&&+a[1]>=6&&+a[1]<=10).map(a=>a[0]))]:[];
    const enc=me?((ALUMNO.en_curso||[]).length?ALUMNO.en_curso:(ALUMNO.horario_inscrito||[]).map(h=>h[1])):[];
    // inscrita de otra carrera o plan con equivalencia registrada (tabla del SAES): cuenta como su materia de este plan
    const encEqv=enc.filter(k=>!cur()[k]).flatMap(eqvPlan);
    const enCurso=[...new Set([...enc,...encEqv])].filter(k=>cur()[k]&&!done0.includes(k));
    const pendRep=me?[...new Set([...(ALUMNO.reprobadas_periodo||[]).map(r=>r[0]),...Object.keys(cur()).filter(k=>(ALUMNO.reprobadas||[]).some(r=>norm(r[0])===norm(cur()[k][0])))])]
      .filter(k=>cur()[k]&&!done0.includes(k)&&!enCurso.includes(k)):[];
    const sim=me&&SIM.on&&(enCurso.length>0||pendRep.length>0);
    const simOk=sim?enCurso.filter(k=>SIM.res[k]?.ok!==false):[], simFail=sim?enCurso.filter(k=>SIM.res[k]?.ok===false):[];
    const simRec=sim?pendRep.filter(k=>SIM.rec[k]?.forma):[];   // reprobadas que se simulan acreditadas (ETS, recurse, extraordinario)
    const done=[...done0,...simOk,...simRec], doneS=new Set(done);
    // reprobadas: con periodo (Estado general del SAES) o, en datos viejos, solo por nombre (Cita)
    const failP={}, veces={};
    if(me)(ALUMNO.reprobadas_periodo||[]).forEach(([k,p,v])=>{if(!cur()[k]||doneS.has(k))return;const i=perIdx(p);if(!(k in failP)||(i!=null&&i<failP[k]))failP[k]=i;veces[k]=v});
    const names=me?new Set((ALUMNO.reprobadas||[]).map(r=>norm(r[0]))):new Set();
    Object.keys(cur()).forEach(k=>{if(names.has(norm(cur()[k][0]))&&!doneS.has(k)&&!(k in failP))failP[k]=null});
    // reprobada en la simulación: cuenta desde el periodo que se cursa ahora
    const pm=perMeta();simFail.forEach(k=>{if(failP[k]==null)failP[k]=pm!=null?pm-1:null;veces[k]=(veces[k]||0)+1});
    const curso=sim?[]:enCurso;
    const desfS=me?(ALUMNO.desfasadas_saes||[]).map(r=>r[0]).filter(k=>cur()[k]&&!doneS.has(k)):[];
    // desfasada oficial (más de 2 periodos reprobada): sin ella el SAES no permite reinscribirse -> obligatoria
    const pmeta=perMeta(), oblig=[...new Set([...Object.keys(failP).filter(k=>failP[k]!=null&&pmeta!=null&&pmeta>failP[k]+2),...desfS])].filter(k=>!curso.includes(k));
    T[S.car]={want:[...new Set([...(t.want||[]),...oblig])].filter(k=>!isElec(k)),oblig,desfS,done,fail:Object.keys(failP),failP,veces,curso,enCurso,encEqv,pendRep,sim,simOk,simRec,cursados:me?ALUMNO.avance?.cursados??null:null};
  }
  return T[S.car];
};
/* "dd/mm/aaaa hh:mm:ss p. m." del SAES → ¿la cita (fin) ya pasó? */
/* recordatorio para volver a usar el Lector: los datos son una copia del SAES y no se actualizan solos */
function avisoActualizar(A){
  const leido=new Date(A?.leido);if(isNaN(leido))return '';
  const m=String(A?.cita?.inicio||'').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/), cita=m?new Date(+m[3],+m[2]-1,+m[1]):null;
  if(cita&&citaPasada(A)&&leido<cita)return 'Ya pasó tu cita de reinscripción y estos datos son de antes. Si ya te inscribiste, vuelve a usar el Lector para traer tu horario definitivo.';
  // citas del nuevo periodo publicadas (calendario de Gestión Escolar) después de la última lectura
  const pub=DATA.calendario?.citas?new Date(DATA.calendario.citas+'T00:00:00'):null;
  if(pub&&Date.now()>=pub&&leido<pub)return `Las citas de reinscripción ${esc(DATA.calendario.periodo||'')} se publicaron en el SAES el ${pub.toLocaleDateString('es-MX',{day:'numeric',month:'long'})}. Vuelve a usar el Lector para traer tu nueva cita.`;
  const dias=Math.floor((Date.now()-leido)/864e5);
  if(dias>=21)return `Estos datos tienen ${dias} días y no se actualizan solos. Vuelve a usar el Lector después de inscribirte o cuando cierre el semestre y se publiquen tus calificaciones (tus materias pasan del horario a tu kárdex).`;
  return '';
}
const citaPasada=A=>{const m=String(A?.cita?.fin||A?.cita?.inicio||'').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);return !!m&&new Date(+m[3],+m[2]-1,+m[1]+1)<new Date()};
/* ---------- periodos escolares ("25/2" o "20252") como índice consecutivo ---------- */
const perIdx=p=>{const m=String(p??'').trim().match(/^(?:20)?(\d{2})\/?([12])$/);return m?(+m[1])*2+(+m[2]-1):null};
const perName=i=>i==null?'—':`${Math.floor(i/2)}/${i%2+1}`;
// periodo al que corresponde una cita: en ene–may se inscribe el /2; en jun–oct, el /1 del año siguiente
const perDeFecha=s=>{const m=String(s||'').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(!m)return null;const mo=+m[2],y=+m[3]%100;return mo<=5?y*2+1:mo<=10?(y+1)*2:(y+1)*2+1};
/* Agenda escolar del SAES ([evento, inicio, fin], «INICIO DE SEMESTRE 27-1»): el periodo que sigue es el próximo inicio
   de semestre después de la lectura; durante las tres semanas de altas y bajas aún cuenta el que acaba de iniciar. */
function perAgenda(A){
  const ev=(A?.agenda||[]).map(r=>{const m=String(r?.[0]||'').match(/INICIO DE SEMESTRE\s+(\d{2})\s*[-\/]\s*([12])/i),d=new Date(String(r?.[1]||'')+'T00:00:00');
    return m&&!isNaN(d)?{p:+m[1]*2+(+m[2]-1),d}:null}).filter(Boolean).sort((a,b)=>a.d-b.d);
  if(!ev.length)return null;
  const l=new Date(A.leido), ref=(isNaN(l)?Date.now():+l)-21*864e5, prox=ev.find(x=>x.d>ref);
  return prox?prox.p:ev[ev.length-1].p+1;
}
/* periodo para el que se planea: el de la cita vigente, o el siguiente al que se cursa ahora */
function perMeta(){
  const A=ALUMNO;if(!A)return null;
  const c=perDeFecha(A.cita?.inicio);
  const seen=[...(A.acreditadas||[]).map(a=>perIdx(a[2])),...(A.reprobadas_periodo||[]).map(r=>perIdx(r[1]))].filter(x=>x!=null);
  let t=c==null?null:(citaPasada(A)?c+1:c);
  if(seen.length){const min=Math.max(...seen)+((A.en_curso||[]).length?2:1);if(t==null||t<min)t=min}
  // sin materias del último periodo en el kárdex (actas cerradas sin aprobadas) el kárdex se queda un periodo atrás:
  // manda el próximo inicio de semestre de la Agenda escolar del SAES; con datos sin agenda, el calendario de Gestión Escolar
  const pa=perAgenda(A)??perIdx(DATA.calendario?.periodo);if(pa!=null&&(t==null||t<pa))t=pa;
  return t;
}
/* Desfase OFICIAL (regla del SAES): una reprobada se desfasa cuando pasan más de 2 periodos sin acreditarla.
   El "atraso" respecto al semestre propuesto solo aplica a planes por semestre (Energía); en los planes 2009
   (por niveles) el orden de la trayectoria es una recomendación y llevar otro orden no es desfase. */
const SEMESTRAL=()=>MAP()?.modelo==='semestral'||(UNIDAD==='upiita'&&S.car==='E');
const DESFASE_SEM={has:()=>SEMESTRAL()};   // compatibilidad con los usos anteriores
/* Modelo por semestres: no se pueden inscribir materias de más de un año (dos semestres) adelante del semestre de
   referencia, que es el más bajo con materias obligatorias pendientes (sin acreditar ni en curso). */
function semRef(){
  if(!SEMESTRAL()||!isPersonal())return null;
  const t=tr(),hecho=new Set([...t.done,...t.curso]),sp=semOf();let m=null;
  Object.entries(cur()).forEach(([k,v])=>{if(v[3]!=='O'||isElec(k)||hecho.has(k))return;const x=sp[k];if(x!=null&&(m==null||x<m))m=x});
  return m;
}
/* Calendario de reinscripción de Gestión Escolar (data/calendario.json): tarjetas por fecha en Estado general y en
   Horarios. Con datos del SAES marca lo que aplica a la situación del alumno; al elegir una tarjeta se muestra su detalle. */
let CALAP=null, CALSEL=null;
function renderCalendario(rd,nDes){
  const tipos=Object.values(rd?.por||{}), des=nDes>0;
  CALAP={todos:true,adeudo:isPersonal()&&tr().fail.length>0,cita:!des,sincita:des,desfasada:des,dictamen:false,transitorio:!!rd?.ok};
  drawCals();
}
function calItems(){
  const C=DATA.calendario;if(!C?.actividades?.length)return null;
  if(isPersonal()&&perMeta()!=null&&perIdx(C.periodo)!==perMeta())return null;
  const hoy=new Date();hoy.setHours(0,0,0,0);const d=x=>new Date(x+'T00:00:00'), ap=isPersonal()?CALAP:null;
  const items=C.actividades.map((a,i)=>({...a,i,ini:d(a.desde),fin:d(a.hasta||a.desde),si:ap?!!ap[a.para]:false}));
  if(items.every(a=>a.fin<hoy-7*864e5))return null;   // una semana después de la última actividad deja de mostrarse
  items.forEach(a=>{a.pasada=a.fin<hoy;a.hoy=a.ini<=hoy&&hoy<=a.fin;a.hoyD=hoy});
  return {C,items};
}
function alertaCal(R){
  const el=$('#cal-alerta');if(!el)return;
  const hoy=new Date();hoy.setHours(0,0,0,0);
  const a=R&&R.items.filter(x=>(isPersonal()&&CALAP?x.si:x.para==='todos')&&!x.pasada&&x.ini-hoy<=2*864e5).sort((x,y)=>x.fin-y.fin)[0];
  el.hidden=!a;if(!a){el.innerHTML='';return}
  const f=x=>x.toLocaleDateString('es-MX',{day:'numeric',month:'long'}), man=a.ini-hoy===864e5;
  const cuando=a.hoy?(+a.fin===+hoy?'Hoy es el último día':`Hasta el ${f(a.fin)}`):man?'Mañana':`El ${f(a.ini)}`;
  const mats=a.para==='adeudo'&&isPersonal()?tr().fail.filter(k=>cur()[k]).map(k=>pretty(cur()[k][0])):[];
  el.innerHTML=`<b>${cuando}:</b> ${esc(a.titulo)}${mats.length?` <span class="muted">· ${esc(mats.join(', '))}</span>`:''} <button class="link" type="button" data-calver-ver="${a.i}">Ver qué hacer</button>`;
}
function drawCals(){
  const R=calItems(), f=(x,o)=>x.toLocaleDateString('es-MX',o).replace('.','');alertaCal(R);
  document.querySelectorAll('.cal').forEach(el=>{
    el.hidden=!R;if(!R){el.innerHTML='';return}
    const {C,items}=R, pers=isPersonal()&&!!CALAP, mio=pers&&store.get('calVer','mio')==='mio';
    let vis=mio?items.filter(a=>a.si):items;if(!vis.length)vis=items;
    const prox=vis.find(a=>!a.pasada), sel=vis.find(a=>a.i===CALSEL)||prox||vis[vis.length-1];
    const rango=a=>a.hasta?`${a.ini.getDate()} al ${f(a.fin,{day:'numeric',month:'long'})}`:f(a.ini,{day:'numeric',month:'long'});
    el.innerHTML=`<div class="cal-head"><h3>Reinscripción ${esc(C.periodo)} <small>Calendario de Gestión Escolar</small></h3>`+
      (pers?`<div class="seg sm" role="group" aria-label="Actividades del calendario"><button type="button" data-calver="mio" aria-pressed="${mio}">Lo que me aplica</button><button type="button" data-calver="todo" aria-pressed="${!mio}">Todas</button></div>`:'')+`</div>`+
      `<div class="cal-strip">${vis.map(a=>`<button type="button" class="cal-c${a.pasada?' pasada':''}${a.si&&a.para!=='todos'?' aplica':''}${a===prox?' prox':''}" data-calc="${a.i}" aria-pressed="${a===sel}">`+
        `<span class="cal-d"><b>${a.ini.getDate()}</b><span>${f(a.ini,{month:'short'})}${a.hasta?` – ${a.fin.getDate()}${a.fin.getMonth()!==a.ini.getMonth()?' '+f(a.fin,{month:'short'}):''}`:''}</span></span>`+
        `<span class="cal-w">${a.hoy?(!a.hasta?'hoy':+a.fin===+a.hoyD?'último día: hoy':'en curso, hasta el '+f(a.fin,{weekday:'long'})):f(a.ini,{weekday:'long'})+(a.hasta?' a '+f(a.fin,{weekday:'long'}):'')}</span>`+
        `<span class="cal-t">${esc(a.titulo||a.texto)}</span><span class="cal-l ${a.donde==='saes'?'saes':''}">${a.donde==='saes'?'En el SAES':'En ventanillas'}</span>`+
        `${a===prox?'<i class="cal-b">Siguiente</i>':a.si&&a.para!=='todos'&&!a.pasada?'<i class="cal-b si">Te aplica</i>':''}</button>`).join('')}</div>`+
      (sel?`<p class="cal-det"><b>${rango(sel)} · ${esc(sel.titulo||'')}.</b> ${esc(sel.texto)}</p>`:'')+
      `<p class="est-note">${esc([...(C.notas||[]),C.fuente?'Fuente: '+C.fuente+'.':''].filter(Boolean).join(' '))}</p>`;
    if(CALSEL==null){const st=el.querySelector('.cal-strip'),pc=el.querySelector('.cal-c.prox');if(st&&pc)st.scrollLeft=Math.max(0,pc.offsetLeft-8)}
  });
}
document.addEventListener('click',e=>{const v=e.target.closest('[data-calver-ver]');if(!v)return;
  CALSEL=+v.dataset.calverVer;drawCals();if(!document.querySelector(`.cal [data-calc="${CALSEL}"]`)){store.set('calVer','todo');drawCals()}   // la actividad no está en «Lo que me aplica»
  const c=[...document.querySelectorAll('.cal')].find(x=>x.offsetParent);const card=c?.querySelector(`[data-calc="${CALSEL}"]`);
  if(c){c.scrollIntoView({behavior:'smooth',block:'start'});if(card)c.querySelector('.cal-strip').scrollLeft=Math.max(0,card.offsetLeft-8)}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-calc],[data-calver]');if(!b)return;
  if(b.dataset.calver){store.set('calVer',b.dataset.calver);CALSEL=null}else CALSEL=+b.dataset.calc;
  const sc=[...document.querySelectorAll('.cal-strip')].map(x=>x.scrollLeft);drawCals();document.querySelectorAll('.cal-strip').forEach((x,i)=>x.scrollLeft=sc[i]||0)});
function failInfo(k){
  const t=tr(); if(!(k in t.failP)) return null;
  const idx=t.failP[k], meta=perMeta(), limite=idx==null?null:idx+2;
  const estado=idx==null||meta==null?'sinperiodo':meta>limite?'desfasada':meta===limite?'riesgo':'reciente';
  return {k,idx,limite,estado,veces:t.veces[k]??null,curso:t.curso.includes(k)};
}
/* Desfase en el periodo que se planea, según el calendario de Gestión Escolar (data/calendario.json → transitorio):
   - 'oficio': primer periodo de desfase (cursada por primera vez en los R.periodosAtras periodos anteriores); Gestión
     Escolar lo autoriza sin dictamen. Con R.maxDesfasadas o menos, todas así, se recursan e inscriben otras sin rebasar
     la carga media más los créditos de la materia con más créditos del plan.
   - 'dictamen': desfase más antiguo; se solicita dictamen a la Comisión de Situación Escolar.
   - 'agotada': ya se cursó dos veces; no puede recursarse sin dictamen. */
function reglaDesfase(){
  const C=DATA.calendario, R=C?.transitorio, meta=perMeta();
  if(!R||!isPersonal()||meta==null||perIdx(C.periodo)!==meta)return null;
  const des=tr().fail.map(failInfo).filter(f=>f&&f.estado==='desfasada'&&!f.curso), por={};
  des.forEach(f=>por[f.k]=(f.veces??0)>=2?'agotada':f.idx!=null&&f.idx>=meta-R.periodosAtras?'oficio':'dictamen');
  const ok=des.length>0&&des.length<=R.maxDesfasadas&&des.every(f=>por[f.k]==='oficio');
  const L=cargaDe(), mx=Math.max(0,...Object.entries(cur()).filter(([k])=>!isElec(k)).map(([,v])=>+v[1]||0));
  return {R,des,por,ok,n:des.length,mx,tope:ok&&L?.media!=null?L.media+mx:null};
}
const cargaDe=()=>isPersonal()&&ALUMNO.carga?.media?{min:ALUMNO.carga.min,media:ALUMNO.carga.media,max:ALUMNO.carga.max}:CARGA[S.car];
/* Carga en créditos (Reglamento General de Estudios, art. 52):
   - Las reprobadas pendientes retienen sus créditos de forma permanente hasta acreditarse; inscribirlas no suma de nuevo.
   - Carga total = créditos retenidos + créditos de las materias nuevas (no reprobadas).
   - Regular: entre la carga mínima y la máxima (fracción I). Con adeudos: al menos la mínima y sin rebasar la media
     (fracción II), salvo que el SAES indique otra carga autorizada: esta ya incluye los créditos retenidos, por lo
     que los créditos nuevos permitidos son la autorizada menos los retenidos. */
const retenidos=()=>isPersonal()?tr().fail.filter(k=>cur()[k]).reduce((s,k)=>s+cur()[k][1],0):0;
function cargaInfo(nuevos){
  const L=cargaDe();if(!L)return null;
  const ret=retenidos(), aut=isPersonal()?SAES.autorizada(ALUMNO):null, adeudo=ret>0, rd=isPersonal()?reglaDesfase():null, regla=rd?.tope!=null?rd:null;
  const tope=regla?regla.tope:aut!=null?aut:(adeudo?L.media:L.max), libre=Math.max(0,tope-ret);   // tope total y créditos nuevos permitidos
  const total=ret+(nuevos||0);
  return {L,ret,aut,regla,adeudo,libre,tope,total,nuevos:nuevos||0,faltaMin:Math.max(0,L.min-total)};
}
const saveT=()=>store.set('t.'+S.car,{want:tr().want});

/* ---------- oferta ---------- */
// clase: [carrera,turno,nivel,grupo,asig,[prof],[[dia,ini,fin]],creditos,clave,tipo]
const keyOf=c=>c[0]+'|'+c[3]+'|'+c[4];
const name=c=>DATA.asig[c[4]];
const profs=c=>c[5].map(i=>DATA.prof[i]).join(' / ');
const hue=c=>(c[4]*137.508)%360;
const classes=()=>DATA.periodos[S.per];
let KEYMAP={};
function actualizarOferta(){for(const p in DATA.periodos){const m=new Map();DATA.periodos[p].forEach(c=>m.set(keyOf(c),c));KEYMAP[p]=m}}
actualizarOferta();
const byKey=k=>KEYMAP[S.per].get(k);
const selected=()=>plan().sel.map(byKey).filter(Boolean);
const ownAsClasses=()=>plan().own.map((o,i)=>({own:true,i,n:o.n,h:o.d.map(d=>[d,o.a,o.b])}));
const slots=x=>x.own?x.h:x[6];
const offeredClaves=()=>new Set(classes().filter(c=>c[0]===S.car).map(c=>c[8]));

function overlaps(a,b){for(const x of slots(a))for(const y of slots(b))if(x[0]===y[0]&&x[1]<y[2]&&y[1]<x[2])return true;return false}
function pattern(c){
  if(!c[6].length) return ['Sin horario en SAES'];
  const g={};c[6].forEach(([d,a,b])=>{const k=hm(a)+'–'+hm(b);(g[k]=g[k]||[]).push(DAYS[d])});
  return Object.entries(g).map(([t,ds])=>ds.join(' ')+'  '+t);
}

/* =========================================================
   TRAYECTORIA
   ========================================================= */
const MAP=()=>DATA.mapas[S.car];
const cur=()=>MAP().cur;                       // clave -> [nombre, créditos, nivel, tipo]
function prereqs(){                             // clave -> [claves requisito directas]: tutorías + flechas de la trayectoria
  if(MAP().req) return MAP().req;
  const L=MAP().layout, out={};
  if(!L) return out;
  L.edges.forEach(([s,d])=>{const a=L.boxes[s][4], b=L.boxes[d][4];if(a&&b)(out[b]=out[b]||[]).push(a)});
  return out;
}
function dependents(){const out={};Object.entries(prereqs()).forEach(([b,as])=>as.forEach(a=>(out[a]=out[a]||[]).push(b)));return out}
function semOf(){                               // clave -> semestre propuesto
  const L=MAP().layout, out={};
  if(L) L.boxes.forEach(b=>{if(b[4]&&!(b[4] in out))out[b[4]]=b[6]});
  else Object.entries(cur()).forEach(([k,v])=>out[k]=v[2]);
  return out;
}
function levelStats(){
  const done=new Set(tr().done), by={};
  Object.entries(cur()).forEach(([k,[n,cr,niv,t]])=>{if(t!=='O'||/^ELECTIVA/.test(n))return;const s=by[niv]||(by[niv]={tot:0,ok:0});s.tot++;if(done.has(k))s.ok++});
  return by;
}
function levelOpen(niv){                        // ¿cumple la seriación recomendada para cursar ese nivel?
  const r=MAP().reglas[niv];if(!r) return {ok:true,miss:[]};
  const st=levelStats(), miss=[];
  Object.entries(r).forEach(([k,f])=>{const s=st[k];if(s&&s.ok/s.tot<f-1e-9)miss.push(`N${k} ${Math.round(f*100)} %`)});
  return {ok:!miss.length,miss};
}
// periodo escolar que se planea = "Periodos escolares que cursaste" (Cita del SAES) + 1. En los planes por niveles
// es el conteo de periodos inscritos, no el semestre de las materias.
function semNow(){const c=tr().cursados;return c==null?null:c+1}
function ancestors(keys){const pre=prereqs(),out=new Set(),walk=k=>(pre[k]||[]).forEach(x=>{if(!out.has(x)){out.add(x);walk(x)}});keys.forEach(walk);return out}
function statusOf(k){
  if(!isPersonal()) return 'rest';
  const done=new Set(tr().done);
  if(done.has(k)) return 'done';
  // en curso primero: si recursa una reprobada este semestre, se planea suponiendo que la acredita (no se vuelve a proponer)
  if(tr().curso.includes(k)) return 'curso';
  const fi=failInfo(k);
  if(fi) return fi.estado==='desfasada'?'late fail':'fail';
  if((tr().desfS||[]).includes(k)) return 'late';   // desfasada según el SAES (plan por semestres)
  // las materias en curso cuentan como requisito cumplido (se planea suponiendo que se acreditan)
  const req=(prereqs()[k]||[]).filter(x=>!done.has(x)&&!tr().curso.includes(x));
  // solo la seriación directa bloquea: el plan es flexible y la oferta varía, así que si ya acreditaste los requisitos
  // puedes cursar la materia aunque sea de otro semestre. La seriación por nivel queda como recomendación (inspector).
  const lock=req.length>0;
  const sn=semNow(), sp=semOf()[k];
  let st='rest';
  if(sn&&sp){if(sp<sn)st=DESFASE_SEM.has(S.car)?'late':'prev';else if(sp===sn)st='now'}
  const r=semRef(), far=r!=null&&sp!=null&&sp>r+2;   // fuera de la ventana de un año
  return st+(lock?' lock':'')+(far?' far':'');
}
// Las electivas se acreditan por horas de actividades (DIE-03, Electivas UPIITA), nunca con un grupo del horario:
// no se eligen para cursar, no suman créditos a la selección ni se sugieren.
function isElec(k){return /^ELECTIVA/i.test(cur()[k]?.[0]||'')}
/* Perfil ficticio para conocer la herramienta sin datos del SAES: a partir del mapa de la carrera elegida, ~45 % de las
   obligatorias acreditadas (con algunos extraordinarios y ETS), una reprobada pendiente y cinco materias en curso. */
function perfilDemo(){
  const car=S.car, m=DATA.mapas?.[car];if(!m)return null;
  const op=DATA.opciones_plan?.[car]||{carrera:car,plan:null}, c=m.cur;
  const ob=Object.keys(c).filter(k=>c[k][3]==='O'&&!isElec(k)&&c[k][1]>0).sort((a,b)=>c[a][2]-c[b][2]||a.localeCompare(b));
  const acr=ob.slice(0,Math.round(ob.length*.45)), resto=ob.slice(acr.length), nper=Math.max(1,Math.ceil(acr.length/6));   // ~6 materias por periodo
  const base=perIdx('26/1')-nper+1, cal=[9,8,10,8,9,7,9,8,10,6,9,8];
  const acreditadas=acr.map((k,i)=>[k,cal[i%cal.length],perName(base+Math.floor(i/6)),i%11===5?'EXT':i%13===7?'ETS':'ORD']);
  const rep=resto[0], enCurso=resto.slice(1,6), obt=acr.reduce((t,k)=>t+c[k][1],0), total=ob.reduce((t,k)=>t+c[k][1],0);
  const prom=acreditadas.reduce((t,a)=>t+a[1],0)/Math.max(1,acreditadas.length);
  return {upiita_saes:1,demo:true,unidad:UNIDAD,leido:new Date().toISOString(),boleta:'0000000000',nombre:'ALUMNO DE DEMOSTRACIÓN',
    carrera:op.carrera,carrera_nombre:DATA.carreras[car],plan:op.plan,promedio:+(prom-.2).toFixed(2),acreditadas,en_curso:enCurso,
    horario_inscrito:[],reprobadas:[],reprobadas_periodo:rep?[[rep,perName(base+nper-1),1]]:[],
    avance:{obtenidos:obt,faltan:total-obt,cursados:nper+1,autorizada:`MÁXIMA (${fmtCr(Math.round(total/8))} CREDITOS)`},
    carga:{total,min:Math.round(total/12),max:Math.round(total/8)},cita:{}};
}
if(DEMO){
  ALUMNO=perfilDemo();
  document.body.insertAdjacentHTML('afterbegin',`<div class="demo-bar" role="status"><b>Modo demostración</b><span>Ves los datos de un alumno ficticio; nada se guarda en tu cuenta ni en tus datos del SAES.</span><button class="btn" type="button" id="demo-salir">Salir del modo demostración</button></div>`);
  $('#demo-salir').addEventListener('click',()=>{try{sessionStorage.removeItem('ipnt.demo')}catch(e){}location.reload()});
}
document.addEventListener('click',e=>{if(!e.target.closest?.('[data-demo-open]'))return;e.preventDefault();try{sessionStorage.setItem('ipnt.demo',UNIDAD)}catch(e){}location.reload()});
function available(k){const s=statusOf(k);return !isElec(k)&&!s.startsWith('done')&&!s.startsWith('curso')&&!s.includes('lock')&&!s.includes('far')}

/* data/sugerencias.json: una materia con «antesDe» se sugiere hasta tener acreditadas o en curso las demás que pide
   esa otra materia (p. ej., Investigación y desarrollo de proyectos, el periodo previo a Metodología de la investigación) */
function aunNo(k){
  const r=DATA.sugerencias?.[S.car]?.[k];if(!r?.antesDe||!isPersonal())return false;
  const hecho=new Set([...tr().done,...tr().curso]);
  return (prereqs()[r.antesDe]||[]).some(x=>x!==k&&cur()[x]&&!hecho.has(x));
}
function suggestions(){
  // prioridad: desfasadas, reprobadas, atrasadas; después todo lo que ya puedes cursar (de cualquier semestre),
  // primero las que desbloquean más materias y luego por semestre propuesto
  const sp=semOf(), off=offeredClaves(), rank={late:0,fail:1,prev:2,now:3,rest:3};
  const dep=dependents(), memo={}, unlocks=k=>memo[k]??(memo[k]=(()=>{const seen=new Set(),walk=x=>(dep[x]||[]).forEach(y=>{if(!seen.has(y)){seen.add(y);walk(y)}});walk(k);return seen.size})());
  const ci=cargaInfo(0), failS=new Set(tr().fail), cost=k=>failS.has(k)?0:cur()[k][1];
  // meta de créditos nuevos: con adeudos, lo autorizado además de los retenidos; regular, la carga media
  const target=ci?(ci.adeudo?ci.libre:Math.min(ci.libre,ci.L.media)):40;
  const pre=prereqs(), hecho=new Set([...tr().done,...tr().curso]);
  const sigue=k=>cur()[k][3]==='P'&&(pre[k]||[]).some(x=>hecho.has(x)&&cur()[x]?.[3]==='P');   // optativa: continuación de su línea
  const cands=Object.keys(cur()).filter(k=>available(k)&&off.has(k)&&(cur()[k][3]==='O'||sigue(k))&&!aunNo(k))
    .sort((a,b)=>{const ra=rank[statusOf(a).split(' ')[0]], rb=rank[statusOf(b).split(' ')[0]];
      return ra-rb||(ra===3?unlocks(b)-unlocks(a):0)||(sp[a]||99)-(sp[b]||99)||cur()[a][2]-cur()[b][2]});
  const out=[], oq=optCupo(), tomadas={};let cr=0;
  for(const k of cands){if(cr+cost(k)>target+0.01)continue;
    const nv=nivOpt(k,oq);if(nv){if((tomadas[nv]||0)>=oq[nv].libre)continue;tomadas[nv]=(tomadas[nv]||0)+1}   // el espacio del nivel ya está cubierto
    out.push(k);cr+=cost(k)}
  return {list:out,cr,target,cands,ret:ci?.ret||0};
}

let ZOOM=null, MAPSC=1;   // MAPSC: escala con la que se dibujó el mapa por última vez
/* Bandas de semestre: el centro de cada fila es la mediana de sus bloques (las etiquetas del PDF pueden estar
   corridas) y cada banda llega a la mitad del espacio con la vecina, así ningún bloque se ve en la fila de al lado. */
function rowBands(L){
  if(L._bands) return L._bands;
  const cs=L.rows.map(()=>[]);
  L.boxes.forEach(b=>{const cy=b[1]+b[3]/2;let j=0;L.rows.forEach((r,i)=>{if(Math.abs(r[1]-cy)<Math.abs(L.rows[j][1]-cy))j=i});cs[j].push(cy)});
  // Los mapas por áreas tienen filas exactas; solo se ajustan los centros de los PDF.
  const ys=L.rows.map(([n,y],i)=>{const v=cs[i].sort((a,b)=>a-b);return v.length&&!L.propuesto&&!L.filas_exactas?v[Math.floor(v.length/2)]:y});
  return L._bands=L.rows.map(([n],i)=>{const y=ys[i];
    const a=i?(ys[i-1]+y)/2:Math.max(0,y-(ys[1]!=null?(ys[1]-y)/2:L.pitch/2));
    const b=i<ys.length-1?(y+ys[i+1])/2:Math.min(L.h,y+(i?(y-ys[i-1])/2:L.pitch/2));
    return [n,y,a,b]});
}
// modo personal: materias que puedes cursar el siguiente periodo (verde) y las sugeridas para tu carga (contorno)
let MARK={avail:new Set(),sug:new Set()};
let SHOWSUG=store.get('verSug',false);   // apagadas por defecto: el alumno las activa a propósito
// planes por niveles (UPIBI 2006): las filas del mapa son niveles, no semestres
const porNiveles=()=>MAP().modelo==='niveles';
// vista del mapa con datos del SAES: 'todo' (mapa completo), 'pend' (pendientes, por defecto) o 'sigue' (recomendaciones)
const mapVista=()=>store.get('mapVista',store.get('mapFull',false)?'todo':'pend');
// trazo ortogonal con esquinas redondeadas (mapas por áreas: cada flecha lleva su propia pista)
function rutaRedonda(P,r=7){
  let d=`M${P[0][0]} ${P[0][1]}`;
  for(let i=1;i<P.length-1;i++){const [a,b,c]=[P[i-1],P[i],P[i+1]];
    const l1=Math.hypot(b[0]-a[0],b[1]-a[1]),l2=Math.hypot(c[0]-b[0],c[1]-b[1]),k=Math.min(r,l1/2,l2/2);
    if(k<.5){d+=` L${b[0]} ${b[1]}`;continue}
    const p=[b[0]+(a[0]-b[0])*k/l1,b[1]+(a[1]-b[1])*k/l1],q=[b[0]+(c[0]-b[0])*k/l2,b[1]+(c[1]-b[1])*k/l2];
    d+=` L${+p[0].toFixed(1)} ${+p[1].toFixed(1)} Q${b[0]} ${b[1]} ${+q[0].toFixed(1)} ${+q[1].toFixed(1)}`}
  const z=P.at(-1);return d+` L${z[0]} ${z[1]}`;
}
/* Cupo de optativas por nivel (planes cuyo mapa indica el nivel de cada espacio, como la UPIITA): {nivel:{total,hechas,libre}}.
   «hechas» son las acreditadas o en curso; «libre» = espacios del nivel aún sin cubrir. null si el plan no lo indica. */
function optCupo(){
  const L=MAP().layout;if(!L)return null;
  const q={}, c=cur(), t=isPersonal()?tr():{done:[],curso:[]};
  L.boxes.forEach(b=>{if(!b[4]&&/^optativa/i.test(b[5])&&b[7]>0)(q[b[7]]=q[b[7]]||{total:0,hechas:0}).total++});
  if(!Object.keys(q).length)return null;
  new Set([...t.done,...t.curso]).forEach(k=>{if(c[k]?.[3]==='P'&&!isElec(k)&&q[c[k][2]])q[c[k][2]].hechas++});
  Object.values(q).forEach(v=>v.libre=Math.max(0,v.total-v.hechas));
  return q;
}
// nivel de una optativa con espacios por nivel (o 0 si no aplica)
const nivOpt=(k,q)=>{const v=cur()[k];return q&&v&&v[3]==='P'&&!isElec(k)&&q[v[2]]?v[2]:0};
// ¿las materias `ks` caben en los espacios libres de optativa de su nivel? Devuelve los niveles que se pasan: {nivel:{n,libre}}
function optExceso(ks,q){
  if(!q)return {};
  const n={};ks.forEach(k=>{const v=nivOpt(k,q);if(v)n[v]=(n[v]||0)+1});
  const out={};Object.keys(n).forEach(v=>{if(n[v]>q[v].libre)out[v]={n:n[v],libre:q[v].libre,total:q[v].total}});
  return out;
}
let AVISO_T=0;
function avisoOpt(msg){
  let el=document.getElementById('opt-aviso');
  if(!el){el=document.createElement('p');el.id='opt-aviso';el.className='opt-aviso';el.setAttribute('role','status');document.body.appendChild(el)}
  el.textContent=msg;el.hidden=false;clearTimeout(AVISO_T);AVISO_T=setTimeout(()=>{el.hidden=true},7000);
}
// texto breve cuando una optativa elegida no cubre un espacio (el alumno puede cursarla igual, como materia extra)
function avisoOptativa(k,otras){
  const q=optCupo(),v=nivOpt(k,q);if(!v)return;
  const t=q[v], dup=otras.filter(x=>x!==k&&nivOpt(x,q)===v).length;
  if(dup+1<=t.libre)return;
  avisoOpt(t.libre<=0?`El plan pide ${t.total===1?'una optativa':t.total+' optativas'} de nivel ${v} y ya ${t.total===1?'cubriste ese espacio':'cubriste esos espacios'}: ${pretty(cur()[k][0])} no cubre otro espacio, solo suma como materia adicional.`:
    `El plan solo deja ${t.libre===1?'un espacio libre':t.libre+' espacios libres'} de optativa de nivel ${v}: con ${pretty(cur()[k][0])} ya elegiste más de las que cubren ese nivel; las demás no cubren espacio.`);
}
function boxHtml(k,x,y,w,h,sc,want,off,hot,sem,req){
  const [n,cr,niv]=cur()[k]||[k,0,1];
  const st=statusOf(k);
  const el=isElec(k);
  const cls=`box ${st}${el?' elec':''}${MARK.avail.has(k)?' avail':''}${MARK.sug.has(k)?' sug':''}${want.has(k)?' want':req&&req.has(k)?' req':''}${hot?(hot.has(k)?(k===S.mapHover?' hot':hot.pre?.has(k)?' hpre':hot.post?.has(k)?' hpost':''):' dim'):''}${off.has(k)||el?'':' offered-no'}`;
  const tip=`${k} · ${n} · ${fmtCr(cr)} créditos · nivel ${niv}${sem&&!porNiveles()?` · semestre propuesto ${sem}`:''}${el?' · consulta su acreditación con Gestión Escolar':off.has(k)?'':' · sin grupos este periodo'}${st.startsWith('late fail')?' · desfasada (SAES): inscripción obligatoria':st.startsWith('fail')?' · reprobada: por recursar':st==='curso'?' · en curso':st.startsWith('late')?' · atrasada según el semestre propuesto':st.includes('far')?' · más de un año adelante de tu semestre de referencia: aún no puedes inscribirla':st.includes('lock')?' · le faltan requisitos':MARK.avail.has(k)?' · puedes cursarla el siguiente periodo':''}${MARK.sug.has(k)?' · sugerida para tu carga':''}${req&&req.has(k)?' · conviene cursarla antes que una materia elegida':''}`;
  return `<div class="${cls}" data-box="${k}" role="button" tabindex="0" aria-pressed="${want.has(k)}" style="--nv:var(--n${niv});left:${x*sc}px;top:${y*sc}px;width:${w*sc}px;height:${h*sc}px;font-size:${Math.max(5.5,(n.length>34?9:10.5)*sc)}px" title="${esc(tip)}">${esc(n)}</div>`;
}

function inspParts(k){
  const c=cur(), [n,cr,niv]=c[k], pre=(prereqs()[k]||[]).filter(x=>c[x]), post=(dependents()[k]||[]).filter(x=>c[x]);
  const all=ancestors([k]), sem=semOf()[k], off=offeredClaves().has(k);
  const nm=x=>esc(pretty(c[x][0]));
  const meta=`${fmtCr(cr)} créditos · nivel ${niv}${sem&&!porNiveles()?' · semestre propuesto '+sem:''}`;
  const l1=`<b>${esc(n)}</b> <span class="mono">${k}</span><span class="insp-meta">${meta}</span>`;
  // con datos del SAES: su estado y qué le falta (en lugar de marcarlo en el mapa)
  let st='';
  if(isPersonal()){const s0=statusOf(k),dn=new Set([...tr().done,...tr().curso]);
    const miss=pre.filter(x=>!dn.has(x)), lv=levelOpen(niv);
    st=s0==='done'?'Ya la acreditaste.':s0==='curso'?'La estás cursando.':s0.includes('fail')?'<b>Por recursar.</b>':
      s0.includes('lock')?`<b>Aún no puedes cursarla:</b> te falta ${miss.map(nm).join(', ')}.`:
      `<b>Puedes cursarla.</b>${lv.ok?'':` Seriación recomendada por nivel: ${lv.miss.join(', ')}.`}`}
  if(isElec(k))return {l1,l2:(st?`<p class="insp-st">${st}</p>`:'')+`<p>${UNIDAD==='upiita'?'Se acredita con actividades validadas por horas (cursos, idiomas, congresos, prácticas, entre otras), no con un grupo del horario. Prepara tu solicitud en <a href="electivas.html">Electivas UPIITA</a>.':'Consulta con Gestión Escolar de tu unidad los requisitos y actividades para acreditar esta electiva.'}</p>`};
  const l2=(st?`<p class="insp-st">${st}</p>`:'')+
    `<p><span class="tag-rel pre">Antes</span><b>Requisitos:</b> ${pre.length?pre.map(nm).join(', '):'ninguno registrado'}${all.size>pre.length?` <span class="muted">(${all.size} materias en toda su cadena)</span>`:''}</p>`+
    `<p><span class="tag-rel post">Después</span><b>Es requisito de:</b> ${post.length?post.map(nm).join(', '):'ninguna materia'}</p>`+
    (off?'':'<p class="muted"><i>Sin grupos en el periodo consultado.</i></p>');
  return {l1,l2};
}
/* Materias del horario inscrito que no son de este plan (movilidad/flexibilidad académica, cambio de carrera u otra carrera de la
   unidad): se muestran como equivalencia y, si la tabla del SAES la registra, con la materia de tu plan que les
   corresponde. No se cuentan en el avance ni en la simulación hasta que el SAES las reconozca en tu plan. */
function renderEqvHorario(A){
  const c=cur(), box=$('#est-eqv');
  const H=(A.horario_inscrito||[]).filter(h=>h&&h[1]&&!c[h[1]]);
  const ext=[...new Map(H.map(h=>[h[1],h])).values()];
  box.hidden=!ext.length;if(!ext.length){box.innerHTML='';return}
  const eq=eqvPlan;
  box.innerHTML=`<h3>Equivalencias en tu horario ${info('Materias inscritas de otra carrera o plan (por ejemplo, por movilidad/flexibilidad académica o cambio de carrera). En el mapa y en la simulación cuentan como su materia equivalente de tu plan; en tus créditos oficiales, cuando el SAES las reconozca. Correspondencia según la tabla de Equivalencias del SAES.')}</h3><div class="eqv-fichas">`+
    ext.map(h=>{const m=eq(h[1]);return `<span class="eqv-f${m.length?'':' sin'}" title="${esc(pretty(h[2]||h[1]))} ${esc(h[1])}${h[0]?' · grupo '+esc(h[0]):''}"><b>${esc(pretty(h[2]||h[1]))}</b> <span class="mono">${esc(h[1])}</span><i aria-hidden="true">→</i>${m.length?m.map(k=>`<b>${esc(pretty(c[k][0]))}</b> <span class="mono">${esc(k)}</span>`).join(' o '):'<em>sin equivalencia registrada</em>'}</span>`}).join('')+'</div>';
}
function renderInsp(){
  const k=S.mapHover, c=cur(), el=$('#insp');
  el.classList.toggle('act',!!(S.mapFocus&&k&&c[k]));
  if(!k||!c[k]){el.innerHTML='<div class="insp-t"><b>Explora el mapa</b></div><p class="muted">'+(tactil()?
    'Toca una materia para ver sus requisitos (antes) y las materias que desbloquea (después). Tócala de nuevo o usa «Quiero cursarla» para agregarla a tu plan.':
    'Coloca el cursor sobre una materia para ver sus requisitos (antes) y las materias que desbloquea (después). Selecciónala para agregarla a tu plan.')+'</p>';return}
  const {l1,l2}=inspParts(k), w=tr().want.includes(k), ob=tr().oblig.includes(k), done=statusOf(k)==='done';
  el.innerHTML=`<div class="insp-t">${l1}</div><div class="insp-b">${l2}</div>`+(S.mapFocus?`<div class="insp-act">${ob||done||isElec(k)?'':`<button class="btn primary" type="button" data-fwant="${k}">${w?'Quitar de mi plan':'Quiero cursarla'}</button>`}<button class="btn" type="button" data-fclose="1">Cerrar</button></div>`:'');
}
function renderLegend(){
  // franja de color a la izquierda de cada materia = nivel
  const nivs=[...new Set(Object.values(cur()).map(v=>v[2]))].sort((a,b)=>a-b);
  $('#legend').innerHTML=`<span class="lg-niv" title="Franja de color a la izquierda de cada materia">Nivel ${nivs.map(n=>`<i class="l-niv" style="background:var(--n${n})"></i>${n}`).join(' ')}</span>`+
    '<span><i class="l-want"></i>Quiero cursarla</span><span><i class="l-req"></i>Conviene cursarla antes</span><span><i class="l-slot"></i>Optativa o electiva (libre)</span>'+
    (isPersonal()?(()=>{ // solo los estados que de verdad aparecen en el mapa del alumno
      const has=new Set(Object.keys(cur()).map(k=>statusOf(k)));const any=f=>[...has].some(f);
      return '<span><i class="l-done"></i>Ya acreditada</span>'+
        (any(s=>s==='curso')?'<span><i class="l-curso"></i>En curso</span>':'')+
        (any(s=>s==='fail')?'<span><i class="l-fail"></i>Por recursar</span>':'')+
        (any(s=>s.startsWith('late'))?`<span><i class="l-late"></i>${DESFASE_SEM.has(S.car)?'Desfasada':'Desfasada (SAES)'}</span>`:'')+
        (MARK.avail.size?'<span><i class="l-avail"></i>Puedes cursarla</span>':'');
    })():'');
}
function renderSide(){return conSim(usaSim('sugg'),renderSide0)}
function renderSide0(){
  const c=cur(), want=tr().want.filter(k=>c[k]), credWant=want.reduce((s,k)=>s+c[k][1],0), off=offeredClaves();
  const req=[...ancestors(want)].filter(k=>!want.includes(k)&&!tr().done.includes(k));
  $('#chosen-help').textContent=want.length?`${want.length} ${want.length>1?'materias':'materia'} · ${fmtCr(credWant)} créditos`:'Selecciona en el mapa las materias que deseas cursar; después consulta sus grupos para organizar tu horario.';
  $('#chosen').innerHTML=want.sort((a,b)=>(semOf()[a]||99)-(semOf()[b]||99)).map(k=>`<span class="wchip"><span class="dot" style="background:var(--n${c[k][2]})"></span><span class="grp">${k}</span>${esc(pretty(c[k][0]))}${off.has(k)?'':' <small>(sin grupos)</small>'}${tr().oblig.includes(k)?'<span class="tag bad" title="Obligatoria: al estar desfasada, el SAES no permite la reinscripción sin ella">obligatoria</span>':`<button class="x" data-unwant="${k}" aria-label="Quitar ${esc(c[k][0])}">×</button>`}</span>`).join('');
  $('#chosen-req').textContent=req.length&&!isPersonal()?`Según la seriación, conviene haber cursado antes: ${req.map(k=>c[k][0].toLowerCase()).join(', ')}.`:'';
  document.querySelectorAll('[data-personal]').forEach(e=>e.hidden=!isPersonal());
  if(isPersonal()){
    const done=tr().done.filter(k=>c[k]), credDone=done.reduce((s,k)=>s+c[k][1],0);
    const total=Object.values(c).filter(v=>v[3]==='O'&&!/^ELECTIVA/.test(v[0])).reduce((s,v)=>s+v[1],0);
    const A=ALUMNO, meta=perMeta(), fis=tr().fail.map(failInfo).sort((a,b)=>(a.idx??99)-(b.idx??99));
    const dS=(tr().desfS||[]).filter(k=>!fis.some(f=>f.k===k));   // desfasadas que reporta el SAES (planes por semestre)
    const nDes=fis.filter(f=>f.estado==='desfasada').length+dS.length, curso=tr().curso;
    const atraso=DESFASE_SEM.has(S.car)?Object.keys(c).filter(k=>statusOf(k)==='late'||statusOf(k)==='late lock').length:0;
    const tile=(lbl,val,sub='',cls='',tip='')=>`<div class="tile"${tip?` title="${esc(tip)}"`:''}><span>${lbl}</span><b class="${cls}">${val}</b>${sub?`<small>${sub}</small>`:''}</div>`;
    const D=statsDatos(), obt=D.obt, tot=D.total, rd=reglaDesfase(), aut=rd?.tope??SAES.autorizada(A), autTipo=rd?.tope!=null?'Regla para desfasadas '+DATA.calendario.periodo:String(A.avance?.autorizada||'').split(/[(=]/)[0].trim();
    const cm=String(A.cita?.inicio||'').match(/(\d+\/\d+\/\d{4})\s+(\d+):(\d+)(?::\d+)?\s*(.*)/);
    $('#status').innerHTML=
      (()=>{const v=(A.acreditadas||[]).map(x=>+x?.[1]).filter(x=>Number.isFinite(x)&&x>=6&&x<=10);return v.length?tile('Promedio sin reprobadas',(v.reduce((t,x)=>t+x,0)/v.length).toFixed(2),`${v.length} materias acreditadas`,'','Promedio de tus materias acreditadas, sin contar reprobadas ni no acreditadas (incluye equivalencias y revalidaciones).'):''})()+
      (()=>{const po=promOficialSim();
        if(po)return tile(po.exacto?'Promedio oficial (simulación)':'Promedio oficial (estimado)',po.despues.toFixed(2),`hoy ${po.antes.toFixed(2)} · ${po.despues>=po.antes?'+':''}${(po.despues-po.antes).toFixed(2)} con tu simulación`,'',
          po.exacto?`Promedio de todo tu kárdex (aprobadas y reprobadas), como lo calcula el SAES, más las materias de tu simulación. Las reprobadas simuladas cuentan con la calificación que elegiste (0 a 5).`
          :`Estimación: con tus datos actuales no se conocen las reprobadas de tu kárdex, así que se deducen de tu promedio oficial suponiendo ${REPROB_CAL} en cada una. Vuelve a usar el Lector para calcularlo exacto. Las reprobadas simuladas cuentan con la calificación que elegiste (0 a 5).`);
        return tile('Promedio oficial',A.promedio??'—',A.promedio==null?'El SAES no lo mostró: suele aparecer con tu cita de reinscripción; actualiza tus datos cuando se publique':tr().sim?'La simulación no permite estimar tu promedio oficial con estos datos':'')})()+
      tile(tr().sim?'Créditos (simulación)':'Créditos',`${obt==null?'—':fmtCr(obt)}${tot?`<small> / ${fmtCr(tot)}</small>`:''}`,tot&&obt!=null?`<span class="minibar"><i style="width:${Math.min(100,obt/tot*100)}%"></i></span>`:'')+
      tile('Periodo que planeas',meta!=null?perName(meta):'—',semNow()?`${semNow()}.º${plazoReferencia(A).dur?' de '+plazoReferencia(A).dur:''} periodos`:'','',
        [A.avance?.cursados!=null?`Llevas ${A.avance.cursados} periodos escolares cursados`:'',plazoReferencia(A).max?`${plazoReferencia(A).calculado?'referencia a carga mínima':'máximo'} ${plazoReferencia(A).max}`:''].filter(Boolean).join('; ')+' (Cita de reinscripción del SAES)')+
      tile('Carga autorizada',aut!=null?fmtCr(aut)+' cr':'—',autTipo?autTipo.charAt(0)+autTipo.slice(1).toLowerCase():'','',rd?.tope!=null?`Carga media (${fmtCr(cargaDe().media)} cr) más ${fmtCr(rd.mx)} cr de la materia con más créditos de tu plan; incluye las materias que recursas.`:'')+
      tile(tr().sim?'Desfase (simulación)':'Desfase reportado',nDes?nDes+(nDes>1?' materias':' materia'):A.reprobadas_periodo==null?'Sin confirmar':'Ninguno',meta!=null?'en '+perName(meta):'',nDes?'bad':A.reprobadas_periodo==null?'':'ok',A.desfase_saes?'Tu última cita: '+A.desfase_saes:'')+
      (DESFASE_SEM.has(S.car)?tile('Atrasadas',atraso,'según el semestre propuesto',atraso?'warn':''):'')+
      tile('Cita de reinscripción',cm?cm[1]:esc(A.cita?.inicio||'—'),citaPasada(A)?'vencida; aún no se publica la siguiente':cm?`${+cm[2]}:${cm[3]} ${cm[4]}`:'');
    $('#status').style.setProperty('--tiles',$('#status').children.length);
    const fechaCal=x=>new Date(x+'T00:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'long'});
    // cada materia: estado corto y opciones; lo que procede se explica una sola vez arriba
    const fila=f=>{const t=rd?.por[f.k], P=perName, rc=f.curso?'La estás recursando':'';
      if(f.estado==='desfasada'){
        if(f.curso)return ['bad','Desfasada · la recursas','Acreditarla este semestre regulariza tu situación; si no, necesitarás dictamen'];
        if(t==='agotada')return ['bad',`Cursada ${f.veces} veces`,'ETS u otra modalidad (RGE, art. 48)'];
        if(t==='dictamen')return ['bad',`Desfasada desde ${P(f.limite+1)}`,'Recursar con dictamen · ETS'];
        if(t==='oficio')return ['warn','Primer periodo de desfase',rd.ok?'Recursar sin dictamen · ETS':'Recursar · ETS'];
        return ['bad',`Desfasada en ${P(meta)}`,'Debes inscribirla para reinscribirte'];
      }
      if(f.estado==='riesgo')return ['warn',`Acredítala en ${P(meta)}`,rc||`o se desfasa en ${P(meta+1)}`];
      if(f.estado==='reciente')return ['',`Plazo: ${P(f.limite)}`,rc||'Recursar o ETS'];
      return ['','Sin periodo','Actualiza tus datos del SAES'];
    };
    // ETS próximo del calendario (inscripción o aplicación): aviso propio, aparte del veredicto de desfase
    const etsB=(()=>{if(!tr().fail.length)return '';const hoy=new Date();hoy.setHours(0,0,0,0);
      const L=DATA.calendario?.actividades||[], i=L.findIndex(x=>x.para==='adeudo'&&new Date((x.hasta||x.desde)+'T00:00:00')>=hoy);if(i<0)return '';const a=L[i];
      return `<div class="aviso ok"><b>Puedes presentar ETS ${info('Examen a título de suficiencia: acreditas la materia con un examen de todo su temario, sin volver a cursarla.')}</b><span>${esc(a.titulo)}: ${a.hasta?'hasta el '+fechaCal(a.hasta):'el '+fechaCal(a.desde)}.</span>`+
        `<small><button class="link" type="button" data-calver-ver="${i}">Ver cómo</button></small></div>`})();
    const veredicto=(()=>{if(!rd?.n)return '';
      const tipos=Object.values(rd.por), dict=tipos.some(t=>t!=='oficio'), sc=(DATA.calendario.actividades||[]).find(a=>a.para==='sincita');
      if(rd.ok)return `<div class="aviso ok"><b>Puedes recursar sin dictamen</b><span>Inscríbete en ventanillas el ${fechaCal(rd.R.fecha)}.</span><small>Tope: ${fmtCr(rd.tope)} cr</small></div>`;
      return `<div class="aviso bad" title="${dict?'':'La autorización sin dictamen cubre hasta '+rd.R.maxDesfasadas+' materias en su primer periodo de desfase.'}"><b>${dict?`Sin dictamen vigente no puedes reinscribirte en ${esc(DATA.calendario.periodo)}`:`Tienes más de ${rd.R.maxDesfasadas} desfasadas`}</b>`+
        `<span>${dict?'Tramítalo para el siguiente periodo.':'La autorización sin dictamen cubre hasta '+rd.R.maxDesfasadas+'.'}</span><small>Revisa tu situación en ventanillas${sc?' el '+fechaCal(sc.desde):''}</small></div>`;
    })();
    const items=[...dS.map(k=>({k,cls:'desfasada',p:['bad','Desfasada según el SAES','Debes inscribirla para reinscribirte'],tip:k})),
      ...fis.map(f=>({k:f.k,cls:f.estado,p:fila(f),tip:`${f.k}${f.idx!=null?' · reprobada por primera vez en '+perName(f.idx):''}${f.veces?` · cursada ${f.veces} ${f.veces==1?'vez':'veces'}`:''}`}))];
    $('#desf').innerHTML=items.length?(veredicto||etsB?`<div class="avisos">${veredicto}${etsB}</div>`:'')+`<ul class="desf">${items.map(x=>`<li class="${x.cls}" title="${esc(x.tip)}"><b>${esc(pretty(c[x.k][0]))}</b><span class="dpill ${x.p[0]}">${x.p[1]}</span><small>${x.p[2]}</small></li>`).join('')}</ul>`:'';
    $('#desf-note').textContent=fis.length?(DATA.calendario?.notaDesfase||'Una materia reprobada se considera desfasada cuando transcurren más de dos periodos sin acreditarla.'):'';
    renderCalendario(rd,nDes);
    {const f=new Date(A.leido);$('#est-src').textContent=isNaN(f)?'Leído del SAES':'Leído del SAES el '+f.toLocaleDateString('es-MX',{dateStyle:'medium'})}
    {const m=avisoActualizar(A),el=$('#est-act');el.hidden=!m;el.innerHTML=m?m+' <button class="link" type="button" data-saes-open>Actualizar mis datos</button>':''}
    renderEqvHorario(A);
    const ec=tr().enCurso, pr=tr().pendRep;$('#est-sim').hidden=!ec.length&&!pr.length;$('#sim-tag').hidden=!tr().sim;
    const calSel=(k,attr,v,esc_=[10,9,8,7,6])=>`<select data-${attr}="${k}" aria-label="Calificación"${SIM.on?'':' disabled'}>${esc_.map(n=>`<option${+v===n?' selected':''}>${n}</option>`).join('')}</select>`;
    $('#est-sim').innerHTML=ec.length||pr.length?`<label class="tgl" title="Simulación: no modifica tus datos del SAES"><input type="checkbox" id="sim-on"${SIM.on?' checked':''}><span class="tgl-ui" aria-hidden="true"></span><span>Simular fin de semestre</span></label>`+(SIM.on&&(Object.keys(SIM.res).length||Object.keys(SIM.rec).length||Object.keys(SIMBLK).length)?`<button type="button" class="link sim-reset" id="sim-reset" title="Regresa todas las materias a su valor inicial (en curso aprobadas con 8 y reprobadas pendientes) y todos los bloques a mostrar la simulación">Reiniciar simulación</button>`:'')+
      `<span class="sim-hint">${SIM.on?'El mapa, las sugeridas y las estadísticas se recalculan con tu simulación; tus datos del SAES no cambian.':'Prueba qué pasaría con tus materias en curso y tus reprobadas: aprobar con cierta calificación, reprobar o acreditar por ETS, recurse o extraordinario.'}</span>`+
      `<div class="simrows${SIM.on?'':' off'}">`+
      ec.map(k=>{const r=SIM.res[k]||{},ok=r.ok!==false;return `<div class="simrow"><span class="sim-n">${esc(pretty(c[k][0]))}<small>${tr().encEqv?.includes(k)?'En curso por equivalencia':'En curso'}</small></span>`+
        `<div class="seg sm" role="group"><button type="button" data-simok="${k}" aria-pressed="${ok}"${SIM.on?'':' disabled'}>Aprobada</button><button type="button" data-simko="${k}" aria-pressed="${!ok}"${SIM.on?'':' disabled'}>Reprobada</button></div>`+
        (ok?calSel(k,'simcal',r.cal??8):calSel(k,'simcalr',r.calR??5,[5,4,3,2,1,0])+'<span class="sim-x">pasa a recursar</span>')+`</div>`}).join('')+
      pr.map(k=>{const r=SIM.rec[k]||{};return `<div class="simrow"><span class="sim-n">${esc(pretty(c[k][0]))}<small class="bad">Reprobada</small></span>`+
        `<select data-simrec="${k}" aria-label="Cómo se acredita"${SIM.on?'':' disabled'}><option value="">Sigue pendiente</option>${['ETS','REC','EXT'].map(f=>`<option value="${f}"${r.forma===f?' selected':''}>Acreditada por ${FORMAS[f].toLowerCase()}</option>`).join('')}</select>`+
        (r.forma?calSel(k,'simreccal',r.cal??7):'')+`</div>`}).join('')+`</div>`:'';
    $('#h-sugg').innerHTML=esc(meta!=null?'Sugeridas para '+perName(meta):'Sugeridas')+' '+simTag('sugg');
    const st=levelStats(), R=MAP().reglas;
    // por nivel: avance (barra de ancho fijo) y, debajo, el porcentaje recomendado de niveles previos frente al tuyo
    const pct=k=>st[k]?Math.round(st[k].ok/st[k].tot*100):0;
    $('#lvls').innerHTML=`<p class="lvl-intro">Avance por nivel y porcentaje recomendado de los niveles previos para cursar cada uno.</p>`+
      Object.keys(st).sort((a,b)=>a-b).map(n=>{const s=st[n], rq=Object.entries(R[n]||{});
      const req=rq.length?`<div class="lvl-req">Para cursarlo se recomienda: ${rq.map(([k,f])=>{const ok=pct(k)>=Math.round(f*100);
          return `<span class="${ok?'ok':'warn'}">${ok?'✓':'·'} Nivel ${k} al ${Math.round(f*100)} %${ok?'':` (llevas ${pct(k)} %)`}</span>`}).join(' ')}</div>`:'';
      return `<div class="lvl"><div class="lvl-top"><b>Nivel ${n}</b><span class="minibar"><i style="width:${s.ok/s.tot*100}%;background:var(--n${n})"></i></span><span class="lvl-num">${s.ok} de ${s.tot}</span></div>${req}</div>`}).join('');
    const sg=suggestions(), color={late:'var(--st-late)',fail:'var(--warn)',prev:'var(--line)',now:'var(--st-now)',rest:'var(--line)'};
    $('#sugg').innerHTML=sg.list.map(k=>`<label><span class="dot" style="background:${color[statusOf(k).split(' ')[0]]}"></span><span class="grp">${k}</span><span>${esc(pretty(c[k][0]))}</span><span class="cr">${fmtCr(c[k][1])}</span></label>`).join('')+
      `<small>${fmtCr(sg.cr)} de ${fmtCr(sg.target)} créditos nuevos${sg.ret?` (además de ${fmtCr(sg.ret)} retenidos por reprobadas, que no se vuelven a contar al recursarlas)`:''}; orden: desfasadas y reprobadas; después las que ya puedes cursar de cualquier semestre, primero las que desbloquean más materias.${curso.length?' No incluye las materias en curso.':''}</small>`;
  }
  renderLegend();renderLineas();
}
function renderLineas(){
  const ls=MAP().lineas, c=cur(), done=new Set(tr().done), want=new Set(tr().want), off=offeredClaves();
  if(!ls.length){$('#lineas').innerHTML='<p class="muted">Sin líneas de especialización registradas para esta carrera.</p>';return}
  const L=MAP().layout, slots=L?L.boxes.filter(b=>/^optativa/i.test(b[5])).length:0;
  const AREA=['#8a98c7','#a76987','#577d63','#4d6f8d','#c9a36a','#721e45'], areas=[...new Set(ls.map(l=>l.area))];
  // una optativa puede tener varias claves (una por semestre): se agrupan por nombre
  const group=l=>{const by=new Map();l.claves.forEach(k=>{if(!c[k])return;const n=c[k][0].toUpperCase();const g=by.get(n)||{n,keys:[],niv:c[k][2],cr:c[k][1],done:false,off:false,want:false};g.keys.push(k);g.done||=done.has(k);g.off||=off.has(k);g.want||=want.has(k);g.niv=Math.min(g.niv,c[k][2]);by.set(n,g)});return [...by.values()]};
  const gs=ls.map(group), score=gs.map(g=>g.filter(x=>x.done||x.want).length), best=Math.max(...score);
  const head=`<div class="ol-head"><p>${slots?`El plan de estudios contempla <b>${slots} optativas</b>, señaladas en el mapa con espacios punteados.`:'Las optativas son de libre elección.'} Las líneas de especialización son orientativas y pueden combinarse según la oferta.</p>
    <div class="legend"><span><i class="l-want"></i>Elegida</span><span><i class="ol-l-on"></i>Con grupos este periodo</span><span><i class="ol-l-off"></i>Sin grupos este periodo</span></div></div>`;
  $('#lineas').innerHTML=head+'<div class="ol-grid">'+ls.map((l,i)=>{
    const g=gs[i], color=AREA[areas.indexOf(l.area)%AREA.length], nOff=g.filter(x=>x.off&&!x.done).length, nWant=g.filter(x=>x.want).length;
    const byNiv={};g.forEach(x=>(byNiv[x.niv]=byNiv[x.niv]||[]).push(x));
    const rows=Object.keys(byNiv).sort((a,b)=>a-b).map(n=>`<div class="ol-row"><span class="ol-niv">Nivel ${n}</span><div class="ol-boxes">${byNiv[n].map(x=>{
      const k=x.keys.find(k=>off.has(k))||x.keys[0];
      return `<button class="obox${x.want?' want':''}${x.done?' done':''}${x.off?'':' offno'}" data-obox="${k}" aria-pressed="${x.want}" title="${esc(x.n)} · ${fmtCr(x.cr)} créditos${x.off?'':' · sin grupos este periodo'}">${esc(x.n.replace(/\s*\(([^()]*)\)$/,(m,g)=>norm(g)===norm(l.linea)?'':m).toLowerCase())}</button>`}).join('')}</div></div>`).join('');
    return `<article class="ol-card" style="--area:${color}">
      <header><span class="ol-area">${esc(l.area)}</span><h4>${esc(l.linea!==l.area?l.linea:l.area)}</h4>
        <span class="ol-stat">${nOff} de ${g.length} con grupos${nWant?` · <b>${nWant} elegida${nWant>1?'s':''}</b>`:''}${best>0&&score[i]===best?' · <span class="tag good">línea con mayor avance</span>':''}</span></header>
      ${rows}</article>`}).join('')+'</div>';
}
/* =========================================================
   HORARIO
   ========================================================= */
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

/* ---------- render general ---------- */
const hasOffer=p=>(DATA.periodos[p]||[]).length>0;
function renderTop(){
  if(!hasOffer(S.per)&&hasOffer('actual'))S.per='actual';
  document.querySelectorAll('[data-per]').forEach(b=>{const ok=hasOffer(b.dataset.per);b.disabled=!ok;b.title=ok?'':'El SAES aún no publica la oferta de este periodo'});
  document.querySelectorAll('[data-per]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.per===S.per));
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===S.tab));

  
  const cars=Object.entries(DATA.carreras).filter(([k])=>DATA.mapas[k]);
  if(!cars.some(([k])=>k===S.car)) S.car=cars[0][0];
  $('#f-carrera').innerHTML=cars.map(([k,v])=>`<option value="${k}"${k===S.car?' selected':''}>${v}</option>`).join('');
  const f=new Date(DATA.capturado).toLocaleString('es-MX',{dateStyle:'long',timeStyle:'short'});
  const n=new Set(classes().filter(c=>c[0]===S.car).map(c=>c[3])).size;
  $('#notice').innerHTML=`<span>Captura del SAES: <b>${f}</b></span><span><b>${n}</b> grupos de esta carrera</span>`+
    (!hasOffer('proximo')?'<span>El SAES aún no publica la oferta del próximo periodo; se muestra el periodo actual.</span>':S.per==='proximo'?'<span>La oferta del próximo periodo está en captura y puede estar incompleta.</span>':'')+
    (n===0?'<span class="bad">Esta carrera no tiene grupos publicados en este periodo.</span>':'')+(DATA.salones?.fuente==='saes'?'<span>Salones según el SAES.</span>':S.per==='actual'&&DATA.salones?`<span>Salones según el horario por aula de la unidad (ciclo ${esc(DATA.salones.periodo)}).</span>`:'<span>Salones aún sin asignar para este periodo.</span>');
}
/* Vista en lista (teléfono): materias por semestre propuesto con su estado y un botón para agregarlas */
/* ---------- estadísticas del kárdex (solo con datos del SAES; se calculan en el navegador) ----------
   Gráficas con Observable Plot (D3), que se carga solo al abrir esta sección. */
const notaValida=v=>v==null||String(v).trim()===''||!Number.isFinite(+v)||+v<6||+v>10?null:+v;
const FORMAS={ORD:'Ordinario',REC:'Recurse',ETS:'ETS',EXT:'Extraordinario',EQV:'Equivalencia',REV:'Revalidación',DIC:'Dictamen'};
const FORMA_COLOR={Ordinario:'--ok',Extraordinario:'--warn',ETS:'--ch-alert',Recurse:'--rel-pre',Equivalencia:'--muted',Revalidación:'--n4',Dictamen:'--n6','No identificada':'--line'};
const LIB_PLOT=[['https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js','sha384-CjloA8y00+1SDAUkjs099PVfnY2KmDC2BZnws9kh8D/lX1s46w6EPhpXdqMfjK6i'],
  ['https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6.17/dist/plot.umd.min.js','sha384-JUpn2GgRr0gxU0xOBd8D8P634jhRCwobtG8G2MMEkX1RnGJ7/FJNnuukpfT+H2w1']];
let PLOT_P=null;
const cargarPlot=()=>window.Plot?Promise.resolve():PLOT_P||(PLOT_P=LIB_PLOT.reduce((p,[src,sri])=>p.then(()=>new Promise((ok,no)=>{
  const s=document.createElement('script');s.src=src;s.integrity=sri;s.crossOrigin='anonymous';s.onload=ok;s.onerror=()=>{PLOT_P=null;no(new Error('No se pudo cargar la biblioteca de gráficas.'))};document.head.appendChild(s)})),Promise.resolve()));
function catDe(){                                // clave -> categoría (columna del mapa)
  const L=MAP().layout,out={};if(!L?.cols?.length)return out;
  if(L.cat)return {...L.cat};   // mapas por áreas: la columna puede agrupar áreas pequeñas; se usa el área de cada materia
  L.boxes.forEach(([x,y,w,h,k])=>{if(!k)return;const cx=x+w/2,c=L.cols.find(([n,a,b])=>cx>=a&&cx<b);if(c)out[k]=c[0]});
  return out;
}
/* kárdex con la simulación: materias en curso aprobadas y reprobadas acreditadas, con su calificación simulada,
   en el periodo que se cursa (el anterior al que se planea). Quinto campo = simulada. */
function simKardex(){
  const A=ALUMNO, base=[...new Map((A.acreditadas||[]).filter(a=>a&&notaValida(a[1])!=null).map(a=>[a[0],a])).values()];
  if(!isPersonal()||!tr().sim)return base;
  const pm=perMeta(), p=pm!=null?perName(pm-1):null, rep=new Set((A.reprobadas_periodo||[]).map(r=>r[0])), done=new Set(base.map(a=>a[0]));
  const add=[...tr().simOk.map(k=>[k,SIM.res[k]?.cal??8,p,rep.has(k)?'REC':'ORD',1]),...tr().simRec.map(k=>[k,SIM.rec[k]?.cal??7,p,SIM.rec[k]?.forma,1])];
  return [...base,...add.filter(a=>{if(done.has(a[0])||notaValida(a[1])==null)return false;done.add(a[0]);return true})];
}
// Sin el denominador oficial no es posible reconstruir el promedio del SAES desde sus acreditaciones.
function promEstimado(){return ALUMNO?.promedio??null}
/* Promedio oficial (el del SAES): promedio de todo lo que aparece en el kárdex, aprobadas y reprobadas.
   Exacto: si el Lector trajo los renglones reprobados del kárdex (kardex_reprobadas) y su promedio junto con las aprobadas
   coincide con el promedio oficial, se suman las materias simuladas (aprobadas con su calificación, reprobadas con
   REPROB_CAL). Estimado: con datos de un Lector anterior se deduce cuántas reprobadas pesan suponiendo REPROB_CAL.
   Devuelve null si no se puede calcular. */
const REPROB_CAL=5;
function promOficialSim(){
  const A=ALUMNO, P=+A?.promedio;if(!tr().sim||A?.promedio==null||!Number.isFinite(P))return null;
  const base=simKardex().filter(a=>!a[4]&&notaValida(a[1])!=null);
  const nuevas=simKardex().filter(a=>a[4]).map(a=>notaValida(a[1])).filter(v=>v!=null);
  const reprobCal=tr().enCurso.filter(k=>SIM.res[k]?.ok===false).map(k=>{const v=+SIM.res[k].calR;return Number.isFinite(v)&&v>=0&&v<6?v:REPROB_CAL});
  const k=nuevas.length+reprobCal.length;if(!k)return null;
  const extra=nuevas.reduce((t,x)=>t+x,0)+reprobCal.reduce((t,x)=>t+x,0);
  const rep=(A.kardex_reprobadas||[]).map(r=>+r?.[1]).filter(v=>Number.isFinite(v)&&v>=0&&v<6);
  if(Array.isArray(A.kardex_reprobadas)){
    const todas=[...base.map(a=>notaValida(a[1])),...rep], n=todas.length, S=todas.reduce((t,x)=>t+x,0);
    if(n&&Math.abs(S/n-P)<=0.011)return {antes:P,despues:(S+extra)/(n+k),exacto:true};
  }
  if(!base.length)return null;
  const n=base.length, S=base.reduce((t,a)=>t+notaValida(a[1]),0);
  if(P>S/n+1e-6||P<=REPROB_CAL)return null;   // un promedio oficial mayor al de aprobadas no admite esta estimación
  const nf=(S-P*n)/(P-REPROB_CAL), W=n+nf;
  return {antes:P,despues:(P*W+extra)/(W+k),exacto:false,reprobadasEstimadas:nf};
}
const creditoValido=v=>v==null||String(v).trim()===''||!Number.isFinite(+v)||+v<0?null:+v;
// En UPIBI la duración capturada no concuerda con las cargas: usar una referencia explícita, no un plazo reglamentario.
function plazoReferencia(A){
  const c=A.carga||{}, calculado=UNIDAD==='upibi'&&c.total>0&&c.min>0;
  return {dur:calculado?null:c.duracion,max:calculado?Math.ceil(c.total/c.min):c.duracion_max,calculado};
}
function proyeccionCreditos(D){
  const ultimo=D.curva.at(-1), inicio=D.meta??(ultimo?.per+1);
  if(!Number.isFinite(inicio)||D.fin==null||!(D.total>0)||D.obt==null||!(D.ritmo>0)||D.fin<inicio||D.obt>=D.total)return [];
  const puntos=[{per:inicio-1,acum:D.obt}];
  for(let per=inicio;per<=D.fin;per++){
    puntos.push({per,acum:Math.min(D.total,D.obt+D.ritmo*(per-inicio+1))});
    if(puntos.at(-1).acum>=D.total)break;
  }
  return puntos;
}
const ST_DIAG=new Set();
function statsDatos(){
  const c=cur(), A=ALUMNO, cat=catDe();
  const rows=simKardex().map(a=>{const f=String(a[3]||'').trim().toUpperCase();
    return {clave:a[0],nombre:pretty(c[a[0]]?.[0]||a[0]),cal:notaValida(a[1]),per:perIdx(a[2]),codigo:f,
      forma:FORMAS[f]||'No identificada',eqv:['EQV','REV','DIC'].includes(f),sim:!!a[4],cat:cat[a[0]]||'Sin categoría',cr:creditoValido(c[a[0]]?.[1])}});
  const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
  const sumCr=rs=>rs.every(r=>r.cr!=null)?rs.reduce((s,r)=>s+r.cr,0):null;
  const reales=rows.filter(r=>!r.sim), reg=rows.filter(r=>!r.eqv&&r.per!=null);
  const pers=[...new Set(reg.map(r=>r.per))].sort((a,b)=>a-b);
  const porPer=pers.map(p=>{const rs=reg.filter(r=>r.per===p),v=rs.map(r=>r.cal);return {per:p,lbl:perName(p),prom:mean(v),min:Math.min(...v),max:Math.max(...v),n:v.length,cr:sumCr(rs),sim:rs.some(r=>r.sim)}});
  // Solo una confirmación explícita puede distinguir cero acreditaciones de un periodo sin información.
  (A.periodos_confirmados||[]).filter(p=>p.completo===true&&creditoValido(p.creditos)===0&&perIdx(p.periodo)!=null).forEach(p=>{
    const per=perIdx(p.periodo);if(!porPer.some(d=>d.per===per))porPer.push({per,lbl:perName(per),prom:null,min:null,max:null,n:0,cr:0,sim:false});
  });porPer.sort((a,b)=>a.per-b.per);
  const eqv=rows.filter(r=>r.eqv), crEqv=sumCr(eqv), crHist=sumCr(reales);
  const total=creditoValido(A.carga?.total), oficial=creditoValido(A.avance?.obtenidos), faltan=creditoValido(A.avance?.faltan);
  const baseObt=oficial??(reales.length?crHist:null), simCr=sumCr(rows.filter(r=>r.sim));
  // materias inscritas de otro plan: se explican como equivalencias en Estado general y no suman créditos aquí
  const cursoDesconocido=[...new Set(A.en_curso??(A.horario_inscrito||[]).map(h=>h[1]))].filter(k=>!c[k]).length;
  const saldoInconsistente=total!=null&&oficial!=null&&faltan!=null&&Math.abs(total-oficial-faltan)>.01;
  const excesoSim=simCr!=null&&faltan!=null&&simCr>faltan+.01;
  const obt=baseObt!=null&&simCr!=null&&!excesoSim?baseObt+simCr:null;
  const baseFalta=faltan??(total!=null&&baseObt!=null?Math.max(0,total-baseObt):null);
  const falta=baseFalta!=null&&simCr!=null&&!saldoInconsistente&&!excesoSim?Math.max(0,baseFalta-simCr):null;
  const diferencia=oficial!=null&&crHist!=null?oficial-crHist:null;
  const sinPeriodo=reales.filter(r=>!r.eqv&&r.per==null).length, desconocidas=rows.filter(r=>r.cr==null).length;
  const curvaCompleta=crEqv!=null&&sinPeriodo===0&&!desconocidas&&(diferencia==null||Math.abs(diferencia)<.01)&&!saldoInconsistente&&!excesoSim;
  let acum=crEqv;const curva=curvaCompleta?porPer.map(d=>({...d,acum:(acum+=d.cr)})):[];
  const cal=rows.map(r=>r.cal).sort((a,b)=>a-b), media=mean(cal), mediana=cal.length?(cal[(cal.length-1)>>1]+cal[cal.length>>1])/2:null;
  const sd=cal.length>1?Math.sqrt(cal.reduce((s,x)=>s+(x-media)**2,0)/(cal.length-1)):null;
  const pm=perMeta(), actual=pm!=null?pm-1:null;
  const historicos=porPer.filter(d=>!d.sim&&(actual==null||d.per<actual));
  const ultimos=historicos.slice(-3), ritmo=ultimos.length&&ultimos.every(d=>d.cr!=null)?mean(ultimos.map(d=>d.cr)):null;
  const huecos=historicos.length?historicos.at(-1).per-historicos[0].per+1-historicos.length:0;
  const ultimo=porPer.at(-1)?.per, meta=tr().sim?pm:actual!=null?Math.max(actual,(ultimo??actual-1)+1):ultimo!=null?ultimo+1:null;
  const nper=falta===0?0:ritmo>0&&falta!=null?Math.ceil(falta/ritmo):null, fin=nper>0&&meta!=null?meta+nper-1:null;
  const formas=rows.filter(r=>!r.eqv&&['ORD','EXT','ETS','REC'].includes(r.codigo));
  const avisos=[];
  if(desconocidas)avisos.push(`${desconocidas} materias aprobadas no tienen créditos registrados en este plan (pueden ser de otro plan o de una equivalencia); por eso no se dibuja tu avance por periodo.`);
  if(diferencia!=null&&Math.abs(diferencia)>.01)avisos.push(`Los créditos de tu kárdex difieren en ${fmtCr(Math.abs(diferencia))} de los que reporta el SAES; esa diferencia no se asigna a ningún periodo.`);
  if(sinPeriodo)avisos.push(`${sinPeriodo} materias aprobadas no indican en qué periodo se acreditaron, así que tu avance por periodo está incompleto.`);
  if(saldoInconsistente)avisos.push('Los créditos obtenidos y faltantes que reporta el SAES no suman el total del plan. Actualiza tus datos del SAES antes de calcular fechas.');
  if(excesoSim)avisos.push('La simulación suma más créditos de los que te faltan; revisa que tus materias correspondan a este plan.');
  if(huecos)avisos.push(`${huecos} periodos no tienen información en tu kárdex; no se toman como periodos sin materias aprobadas.`);
  if(A.reprobadas_periodo==null)avisos.push('No se pudo leer tu «Estado general» del SAES, así que no se puede confirmar si tienes materias reprobadas pendientes.');
  if(A.en_curso==null)avisos.push('No se pudo leer tu horario inscrito del SAES.');
  const duplicadas=(A.acreditadas||[]).filter(a=>a&&notaValida(a[1])!=null).length-reales.length;
  if(duplicadas)avisos.push(`${duplicadas} materias aparecen repetidas en tu kárdex; se cuentan una sola vez.`);
  if(avisos.length){const diag={unidad:UNIDAD,carrera:S.car,desconocidas,cursoDesconocido,sinPeriodo,huecos,duplicadas,saldoInconsistente,excesoSim};
    const key=JSON.stringify(diag);if(!ST_DIAG.has(key)){ST_DIAG.add(key);console.warn('Analítica: cobertura incompleta',diag)}}
  return {rows,reg,porPer,curva,crEqv,media,mediana,sd,ritmo,total,obt,falta,nper,meta,fin,mean,oficial,simCr,avisos,actual,simulado:tr().sim,
    ritmoN:ultimos.length,ritmoParcial:!historicos.length||huecos>0||!A.periodos_confirmados?.length,
    // aclaración visible del ritmo: solo cuando hay periodos sin materias aprobadas en el kárdex (no se cuentan como cero)
    ritmoNota:huecos>0?`no incluye ${huecos} ${huecos>1?'periodos':'periodo'} en ${huecos>1?'los':'el'} que tu kárdex no registra materias aprobadas`:'',
    ord:formas.length?formas.filter(r=>r.codigo==='ORD').length/formas.length:null,formasN:formas.length,
    formasExcluidas:rows.length-formas.length,
    delta:porPer.length>1&&porPer.at(-1).prom!=null&&porPer.at(-2).prom!=null?porPer.at(-1).prom-porPer.at(-2).prom:null};
}
function metaCreditos(D,H,incluyeActual){
  const periodos=+H, valida=String(H??'').trim()!==''&&Number.isSafeInteger(periodos)&&periodos>0;
  const autorizada=creditoValido(SAES.autorizada(ALUMNO)), min=creditoValido(ALUMNO.carga?.min);
  const inicio=D.meta==null?null:D.meta+(!incluyeActual&&!D.simulado&&D.meta===D.actual?1:0);
  if(!valida)return {valida:false};
  if(D.falta==null)return {valida:true,pendientes:null};
  const necesarios=D.falta/periodos;
  return {valida:true,pendientes:D.falta,necesarios,periodos,inicio,
    fin:D.falta===0||inicio==null?null:inicio+periodos-1,autorizada,min,
    diferencia:D.ritmo>0?necesarios/D.ritmo-1:null,
    supera:autorizada!=null&&necesarios>autorizada+.01,
    bajoMin:min!=null&&D.falta>0&&necesarios<min-.01};
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
  return `<p class="mt-h"><b>${fmtCr(M.necesarios)} créditos por periodo</b>${nMat?` <span class="mt-mat">≈ ${nMat} ${nMat===1?'materia':'materias'} por periodo ${info(`Aproximado con el promedio de créditos de las materias que te faltan (${porMat.toFixed(1)} créditos por materia).`)}</span>`:''}${M.fin!=null?` · de ${perName(M.inicio)} a ${perName(M.fin)}`:''}</p>
    <div class="mt-regla${M.supera?' supera':''}" aria-hidden="true"><i class="mt-zona" style="width:${M.autorizada!=null?x(M.autorizada):'100%'}"></i>
      ${marca(M.necesarios,'nec','necesitas','arriba',pos(M.necesarios)>82)}${ab.map(([v,c,t],j)=>marca(v,c,t,lugar[j].fila2?'abajo fila2':'abajo',lugar[j].izq)).join('')}</div>
    <p class="mt-e${M.supera?' warn':''}">${estado}${M.bajoMin?' Es menos que la carga mínima; requiere autorización.':''} ${info('Promedio de créditos que necesitas aprobar por periodo, no una lista exacta de materias. Tu carga autorizada puede cambiar cada periodo; los periodos se estiman con tu cita de reinscripción y tu kárdex.')}</p>`;
}
const info=t=>`<span class="info" tabindex="0" role="img" aria-label="${esc(t)}" data-tip="${esc(t)}">ⓘ</span>`;
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
/* Promedio meta: con qué promedio deberías salir de tus materias en curso (y del resto de la carrera) para llegar al
   promedio que quieres. Se calcula sobre el promedio sin reprobadas (exacto con tu kárdex); el oficial también cuenta
   reprobadas que el SAES no detalla, así que para subirlo puede hacer falta más. */
function promMeta(D,T){
  const reales=D.rows.filter(r=>!r.sim), n=reales.length, suma=reales.reduce((t,r)=>t+r.cal,0);
  const k=tr().enCurso.length, c=cur(), hechas=new Set([...tr().done,...tr().enCurso]);
  const R=Object.keys(c).filter(x=>!hechas.has(x)&&!isElec(x)&&c[x][3]==='O'&&c[x][1]>0).length+k;   // obligatorias que te faltan (sin las opciones de optativas), más las en curso
  const nec=m=>m>0?(T*(n+m)-suma)/m:null;
  return {n,actual:n?suma/n:null,k,R,periodo:nec(k),carrera:nec(R),max:k?(suma+10*k)/(n+k):null};
}
function promMetaPanel(D){
  const T=store.get('promMeta.'+S.car,null), v=T??(D.media!=null?Math.min(10,Math.ceil((D.media+.3)*10)/10):8.5), M=promMeta(D,v);
  return `<section class="meta-panel pm" aria-labelledby="pm-h"><h3 id="pm-h">¿Qué promedio quieres alcanzar? ${simTag('pm')}${info('Se calcula con tu promedio sin reprobadas (tus materias acreditadas). El promedio oficial del SAES también cuenta calificaciones reprobadas, así que para subirlo puede hacer falta un poco más.')}</h3>
    <div class="meta-controls"><label for="prom-meta">Promedio meta <input id="prom-meta" type="number" min="6" max="10" step="0.1" value="${v}"></label>
    <span class="muted">Hoy: ${M.actual!=null?M.actual.toFixed(2):'—'} (${M.n} materias)</span></div>
    <div id="pm-res">${promMetaHtml(M)}</div></section>`;
}
const pmEst=x=>x==null?'':x<=6?'cualquier calificación aprobatoria te alcanza':x>10?'no alcanzable':`<b>${x.toFixed(2)}</b>`;
const pmEscala=x=>x==null||x>10||x<6?'':`<span class="k-regla pm-regla" aria-hidden="true"><i style="left:${(x-6)/4*100}%"></i><em>6</em><em>10</em></span>`;
// calificaciones enteras (6–10) que, repartidas en `ks`, promedian al menos x
function pmReparto(ks,x){let falta=Math.max(6*ks.length,Math.min(10*ks.length,Math.ceil(x*ks.length-1e-9)));const out={};
  ks.forEach((k,i)=>{const cal=Math.max(6,Math.min(10,Math.ceil(falta/(ks.length-i))));out[k]=cal;falta-=cal});return out}
// combinación que el alumno arma para sus materias inscritas (se guarda por carrera)
function pmCombinacion(M){const ec=tr().enCurso, g=store.get('pmCal.'+S.car,{}), base=pmReparto(ec,M.periodo!=null&&M.periodo<=10?Math.max(6,M.periodo):10);
  return Object.fromEntries(ec.map(k=>[k,g[k]>=6&&g[k]<=10?g[k]:base[k]]))}
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
      <div class="pm-mats">${tr().enCurso.map(k=>`<label class="pm-mat"><span>${esc(pretty(c[k][0]))}</span><select data-pmcal="${k}" aria-label="Calificación de ${esc(pretty(c[k][0]))}">${[10,9,8,7,6].map(n=>`<option${comb[k]===n?' selected':''}>${n}</option>`).join('')}</select></label>`).join('')}</div>
      <div class="pm-res" id="pm-estado" aria-live="polite">${pmEstado(M)}</div>
      <div class="pm-acc"><button class="btn" type="button" id="prom-sim">Usar en la simulación</button><button class="link" type="button" id="pm-reset">Repartir de nuevo</button></div>`:'')}
  const car=M.R?`<div class="pm-fila"><div><span class="pm-t">Al terminar la carrera</span><span>Necesitas promediar ${est(M.carrera)} en las ${M.R} materias obligatorias que te faltan.</span></div>${escala(M.carrera)}</div>`:'';
  return per+car;
}
// leyenda visual de una gráfica: [tipo, color, texto]; tipos: linea, punteada, guion, area, barra, punto, anillo, vertical, vertical-p
function ley(items){
  const m=(t,c)=>({linea:`<path d="M1 7H21" stroke="${c}" stroke-width="2.4"/><circle cx="11" cy="7" r="2.6" fill="${c}"/>`,
    punteada:`<path d="M1 7H21" stroke="${c}" stroke-width="2" stroke-dasharray="4 3"/><circle cx="11" cy="7" r="2.8" fill="var(--bg)" stroke="${c}" stroke-width="1.5"/>`,
    guion:`<path d="M1 7H21" stroke="${c}" stroke-width="1.6" stroke-dasharray="2 3"/>`,
    area:`<rect x="1" y="2" width="20" height="10" rx="2" fill="${c}" fill-opacity=".2"/>`,
    numero:`<text x="11" y="11" text-anchor="middle" font-size="10" font-weight="700" fill="${c}">8.5</text>`,
    rayado:`<rect x="1" y="2" width="20" height="10" rx="2" fill="${c}" fill-opacity=".35"/><path d="M4 12L10 2M10 12L16 2M16 12L21 4" stroke="${c}" stroke-width="1.5"/>`,
    marca:`<path d="M11 1V13" stroke="${c}" stroke-width="2"/>`,
    grado:`<rect x="0" y="2" width="4" height="10" fill="var(--g6)"/><rect x="4.5" y="2" width="4" height="10" fill="var(--g7)"/><rect x="9" y="2" width="4" height="10" fill="var(--g8)"/><rect x="13.5" y="2" width="4" height="10" fill="var(--g9)"/><rect x="18" y="2" width="4" height="10" fill="var(--g10)"/>`,
    letra:`<text x="11" y="11" text-anchor="middle" font-size="11" font-weight="700" fill="var(--fg)">${c}</text>`,
    simulada:`<rect x="4" y="1.5" width="14" height="11" rx="2" fill="none" stroke="${c}" stroke-dasharray="2 2"/>`,
    cuadro:`<rect x="5" y="2" width="12" height="10" rx="2" fill="${c}"/>`,
    rango:`<path d="M11 2V12" stroke="${c}" stroke-opacity=".35" stroke-width="7" stroke-linecap="round"/>`,
    barra:`<rect x="4" y="3" width="6" height="10" fill="${c}" fill-opacity=".75"/><rect x="12" y="6" width="6" height="7" fill="${c}" fill-opacity=".75"/>`,
    punto:`<circle cx="11" cy="7" r="4" fill="${c}" fill-opacity=".8"/>`,
    anillo:`<circle cx="11" cy="7" r="4" fill="var(--bg)" stroke="${c}" stroke-width="1.8"/>`,
    vertical:`<path d="M11 1V13" stroke="${c}" stroke-width="2"/>`,
    'vertical-p':`<path d="M11 1V13" stroke="${c}" stroke-width="1.6" stroke-dasharray="3 2"/>`}[t]);
  return `<span class="ley">${items.map(([t,c,x])=>`<span><svg viewBox="0 0 22 14" width="22" height="14" aria-hidden="true" fill="none">${m(t,c)}</svg>${esc(x)}</span>`).join('')}</span>`;
}
let ST_RENDER=0;
async function renderStats(){
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

/* ---------- análisis descriptivo: hechos y antecedentes, sin pronosticar notas ---------- */
function analisis(){
  const c=cur(), pre=prereqs(), t=tr(), cat=catDe(), done=new Set(t.done), nm=k=>pretty(c[k]?.[0]||k);
  const K=simKardex().filter(a=>notaValida(a[1])!=null), cal=new Map(K.map(a=>[a[0],notaValida(a[1])]));
  const pend=Object.keys(c).filter(k=>!done.has(k)&&!isElec(k)&&(c[k][3]==='O'||c[k][3]==='P'));
  const depend=dependents(), want=new Set(t.want), fail=new Set(t.fail);
  const cuidar=pend.filter(k=>fail.has(k)||want.has(k)).map(k=>{
    const motivos=[];
    if(fail.has(k))motivos.push('Está reprobada: debes acreditarla');
    const req=(pre[k]||[]).filter(x=>!done.has(x));
    if(req.length)motivos.push('Antes conviene aprobar: '+req.map(nm).join(', '));
    const desbloquea=(depend[k]||[]).filter(x=>!done.has(x)&&c[x]);
    if(desbloquea.length)motivos.push('Es requisito de: '+desbloquea.map(nm).join(', '));
    return {k,motivos};
  }).filter(r=>r.motivos.length);
  // El promedio de una línea procede únicamente de sus materias propias acreditadas.
  const lineas=(MAP().lineas||[]).map(l=>{
    const claves=[...new Set(l.claves||[])].filter(k=>cal.has(k));
    return {nombre:l.linea!==l.area?l.linea:l.area,claves,n:claves.length,
      prom:claves.length?claves.reduce((s,k)=>s+cal.get(k),0)/claves.length:null,
      total:new Set(l.claves||[]).size,sim:K.some(a=>claves.includes(a[0])&&a[4])};
  }).filter(l=>l.n>0);
  const memo={}, visitando=new Set();let ciclo=false;
  const largo=k=>{
    if(visitando.has(k)){ciclo=true;return []}
    if(memo[k])return memo[k];visitando.add(k);
    let cola=[];
    for(const x of (depend[k]||[]).filter(x=>!done.has(x)&&c[x]?.[3]==='O')){
      const v=largo(x);if(v.length>cola.length)cola=v;
    }
    visitando.delete(k);return memo[k]=[k,...cola];
  };
  let cadena=[];
  pend.filter(k=>c[k][3]==='O').forEach(k=>{const v=largo(k);if(v.length>cadena.length)cadena=v});
  if(ciclo)cadena=[];
  const pp={};K.forEach(a=>{
    const f=String(a[3]||'').trim().toUpperCase(),i=perIdx(a[2]);
    if(['EQV','REV','DIC'].includes(f)||i==null)return;
    const o=pp[i]||(pp[i]={cr:0,v:[],completo:true});
    const cr=c[a[0]]?.[1];if(cr==null||!Number.isFinite(+cr))o.completo=false;else o.cr+=+cr;
    o.v.push(notaValida(a[1]));
  });
  const carga=Object.entries(pp).filter(([,o])=>o.completo).map(([i,o])=>({per:+i,lbl:perName(+i),cr:o.cr,prom:o.v.reduce((s,v)=>s+v,0)/o.v.length,n:o.v.length})).sort((a,b)=>a.per-b.per);
  return {cuidar,lineas,cadena,ciclo,carga,nm};
}
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

function renderTray(){if(SATE.modulos.mapa){renderMap();renderList()}renderSide();renderStats()}
function renderHor(){renderHFilters();renderOffer();renderPlans();renderCal();renderOwnForm();renderGen();renderEquiv()}
/* Equivalencias con otras carreras de la misma unidad (tabla «Equivalencia de Materias» del SAES): solo consulta.
   Cada unidad decide cómo aplicarlas; no cambian el avance, la seriación ni el generador de horarios. */
function renderEquiv(){
  const E=DATA.equiv, box=$('#equiv');box.hidden=!E;if(!E||!box.open)return;
  const c=cur(), nombre=(car,k)=>pretty(DATA.mapas?.[car]?.cur?.[k]?.[0]||(classes().find(x=>x[0]===car&&x[8]===k)?DATA.asig[classes().find(x=>x[0]===car&&x[8]===k)[4]]:k));
  const base=[...new Set([...tr().want,...tr().fail,...plan().sel.map(x=>byKey(x)?.[8]).filter(Boolean)])].filter(k=>c[k]);
  const fecha=new Date(E.consultado+'T12:00').toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});
  let html=`<p class="eq-intro">Según la tabla de Equivalencias del SAES (consultada el ${fecha}), algunas materias de tu plan tienen equivalencia con materias de otras carreras de tu unidad académica. Cada unidad decide cómo aplicarlas: normalmente se inscriben <b>al final del proceso de reinscripción</b>, con los lugares que quedan libres después de que se inscriben los alumnos de esa carrera. <b>Confírmalo con Gestión Escolar antes de inscribirlas.</b></p>`;
  if(!base.length){$('#equiv-body').innerHTML=html+'<p class="muted">Elige materias en «Mi trayectoria» o agrega grupos a tu horario para ver sus equivalencias.</p>';return}
  const flecha={ida:'→',vuelta:'←',ambas:'↔'};
  const filas=base.map(k=>{
    const m=new Map();
    E.rel.forEach(([o,ko,eo,d,kd,ed])=>{
      let otro=null,dir=null,esp=null;
      if(o===S.car&&ko===k){otro=[d,kd];dir='ida';esp=ed}else if(d===S.car&&kd===k){otro=[o,ko];dir='vuelta';esp=eo}
      if(!otro)return;const id=otro.join('|'), prev=m.get(id);
      m.set(id,{car:otro[0],k:otro[1],esp,dir:prev&&prev.dir!==dir?'ambas':dir});
    });
    if(!m.size)return '';
    const items=[...m.values()].sort((a,b)=>a.car.localeCompare(b.car)).map(x=>{
      const gs=classes().filter(g=>g[0]===x.car&&g[8]===x.k);
      const mult=E.multiples.find(([o,ko,d])=>o===S.car&&ko===k&&d===x.car);
      return `<li><span class="eq-dir" title="Dirección como aparece en la tabla del SAES">${flecha[x.dir]}</span><div><b>${esc(nombre(x.car,x.k))}</b> <span class="mono">${esc(x.k)}</span>`+
        `<small>${esc(DATA.carreras[x.car]||x.car)}${x.esp&&x.esp!=='0'?` · especialidad ${esc(x.esp)}`:''}</small>`+
        (mult?`<small class="warn">El SAES muestra varias materias equivalentes en esta carrera (${mult[3].map(esc).join(', ')}); puede requerir acreditarlas juntas.</small>`:'')+
        `<small>${gs.length?gs.map(g=>`<span class="eq-g">${esc(g[3])}: ${g[6].map(([d,a,b])=>`${DAYS[d]} ${hm(a)}–${hm(b)}`).join(', ')}</span>`).join(''):'Sin grupos en el periodo consultado'}</small></div></li>`}).join('');
    return `<section class="eq-m"><h4>${esc(pretty(c[k][0]))} <span class="mono">${esc(k)}</span></h4><ul class="eq-list">${items}</ul></section>`;
  }).join('');
  html+=filas||'<p class="muted">Las materias que elegiste no tienen equivalencias registradas con otras carreras en esta tabla.</p>';
  html+=`<p class="muted eq-leyenda">↔ en ambos sentidos · → de tu materia a la otra · ← de la otra materia a la tuya, como aparece en la tabla del SAES.</p>`;
  $('#equiv-body').innerHTML=html;
}
function render(){return SATE.repintar()}
// perfil del SAES de otra carrera: se avisa y se ofrece volver; nada del perfil se aplica aquí
function renderAviso(){SAES.mismatch(S.car,k=>DATA.carreras[k],c=>{if(!DATA.carreras[c])return;S.car=c;store.set('car',c);S.chips=[];S.gen=null;ZOOM=null;render()},carreraPerfil)}
function refresh(){save();renderOffer();renderPlans();renderCal()}
function addClass(c){const pl=plan();pl.sel=pl.sel.filter(x=>byKey(x)?.[4]!==c[4]);pl.sel.push(keyOf(c))}
function toggle(k){const pl=plan(),i=pl.sel.indexOf(k);if(i>=0)pl.sel.splice(i,1);else{const c=byKey(k);addClass(c);
    avisoOptativa(c[8],pl.sel.map(x=>byKey(x)?.[8]).filter(Boolean));
    // desde "llenar hueco": la materia pasa a las elegidas (para poder cambiar de grupo) y se suelta el hueco
    if(S.gap||S.fit){if(cur()[c[8]]&&!tr().want.includes(c[8])){tr().want.push(c[8]);saveT()}S.gap=null;renderActive()}}
  refresh()}
function toggleBox(k){
  if(isElec(k)){S.mapHover=k;S.mapFocus=true;renderMap();if(mview()==='lista'){S.lfocus=k;renderList()}return}   // se explica en el inspector
  const w=tr().want,i=w.indexOf(k);
  if(i>=0&&tr().oblig.includes(k)){$('#insp').innerHTML=`<span><b>${esc(cur()[k][0])} es obligatoria</b></span><span class="muted">Al estar desfasada, el SAES no permite la reinscripción sin ella.</span>`;return}
  if(i>=0)w.splice(i,1);else{w.push(k);avisoOptativa(k,w)}saveT();renderTray()}

/* ---------- eventos ---------- */
$('#equiv').addEventListener('toggle',renderEquiv);
document.addEventListener('click',e=>{
  const li=e.target.closest('#ac li');if(li){pick(+li.dataset.i);return}
  // táctil: un toque fuera del mapa y del inspector retira el enfoque
  if(S.mapFocus&&!e.target.closest('#map,#insp,#lineas')){S.mapFocus=false;S.mapHover=null;renderMap()}
  // táctil: el primer toque enfoca la materia (cadena de requisitos + inspector); el segundo la selecciona
  const focus=k=>{if(tactil()&&S.mapHover!==k){S.mapHover=k;S.mapFocus=true;renderMap();return true}return false};
  const bx=e.target.closest('[data-box]');if(bx){if(!focus(bx.dataset.box))toggleBox(bx.dataset.box);return}
  const ob=e.target.closest('[data-obox]');if(ob){if(!focus(ob.dataset.obox))toggleBox(ob.dataset.obox);return}
  // táctil: tocar un grupo de la oferta muestra (o retira) su vista previa en el horario
  const op=e.target.closest('#offer .opt');if(op&&tactil()&&!e.target.closest('button,input,a,label,select,textarea,summary')){S.hover=S.hover===op.dataset.k?null:op.dataset.k;renderCal();return}
  const t=e.target.closest('button');if(!t)return;
  const d=t.dataset;
  if(d.expand!==undefined){const k=+d.expand;S.expand.has(k)?S.expand.delete(k):S.expand.add(k);renderOffer();return}
  if(d.lfocus){S.lfocus=S.lfocus===d.lfocus?null:d.lfocus;renderList();return}
  if(d.lwant){toggleBox(d.lwant);return}
  if(d.fwant){toggleBox(d.fwant);return}
  if(d.fclose){S.mapFocus=false;S.mapHover=null;renderMap();return}
  if(d.mview){S.mview=d.mview;store.set('mview',S.mview);renderTray();return}
  if(d.cview){S.cview=d.cview;store.set('cview',S.cview);renderCal();return}
  if(t.id==='b-filt'){const f=t.closest('.filters');f.classList.toggle('open');t.setAttribute('aria-expanded',String(f.classList.contains('open')));return}
  if(t.id==='b-mobnote'){store.set('mobnote',1);$('#mobnote').hidden=true;return}
  if(d.tab){SATE.ir(d.tab==='hor'?'horarios':'mapa')}
  else if(d.per){S.per=d.per;store.set('per',S.per);S.hover=null;S.chips=[];S.gen=null;render()}
  else if(d.unwant){toggleBox(d.unwant)}
  else if(d.zoom!==undefined){const L=MAP().layout, base=$('#map').offsetWidth/(L?.w||$('#map').offsetWidth);ZOOM=d.zoom==='0'?null:Math.min(2,Math.max(.4,(ZOOM??base)*(d.zoom==='1'?1.2:1/1.2)));renderMap()}
  else if(d.view){S.view=d.view;store.set('view',S.view);renderHFilters();renderOffer()}
  else if(d.tur){S.tur=d.tur;store.set('tur',S.tur);renderHFilters();renderOffer()}
  else if(d.niv){S.niv=d.niv==='*'?'*':+d.niv;store.set('niv',S.niv);renderHFilters();renderOffer()}
  else if(d.ungap){S.gap=null;renderActive();renderOffer();renderCal()}
  else if(d.unchip){if(d.unchip==='all')S.chips=[];else S.chips.splice(+d.unchip,1);renderActive();renderOffer()}
  else if(d.toggle){S.hover=null;toggle(d.toggle)}
  else if(d.mark){const m=ws().marks;const c=m[d.k]||{};if(c.s===d.mark){delete c.s;if(!c.n)delete m[d.k];else m[d.k]=c}else m[d.k]={...c,s:d.mark};save();renderOffer();const n=document.querySelector(`[data-note="${CSS.escape(d.k)}"]`);if(n&&m[d.k]?.s)n.focus()}
  else if(d.group){filtered().filter(c=>c[3]===d.group).forEach(addClass);refresh()}
  else if(d.plan){ws().plan=d.plan;S.hover=null;refresh()}
  else if(d.newplan){const id=nextPlan();ws().plans[id]={sel:[],own:[]};ws().plan=id;S.hover=null;refresh()}
  else if(d.delplan){const id=d.delplan;if(t.dataset.confirm!=='1'){t.dataset.confirm='1';t.textContent='¿Eliminar?';t.classList.add('warn');setTimeout(()=>{if(t.isConnected){t.dataset.confirm='';t.textContent='×';t.classList.remove('warn')}},3000);return}
    delete ws().plans[id];ws().plan=planIds()[0];S.hover=null;refresh()}
  else if('dup' in d){const id=nextPlan();ws().plans[id]=JSON.parse(JSON.stringify(plan()));ws().plan=id;refresh()}
  else if(d.unown){plan().own.splice(+d.unown,1);refresh()}
  else if(d.oday){const i=+d.oday;S.ownDays=S.ownDays.includes(i)?S.ownDays.filter(x=>x!==i):[...S.ownDays,i];renderOwnForm()}
  else if(d.gt){S.gt=d.gt;renderHFilters()}
  else if(d.ungp){S.gpref.splice(+d.ungp,1);renderGPrefs()}
  else if(d.unga){S.gavoid.splice(+d.unga,1);store.set('excl',S.gavoid);renderActive();renderOffer()}
  else if(d.useg!==undefined){const r=S.gen.top[+d.useg], to=d.to==='+'?nextPlan():d.to;ws().plans[to]=ws().plans[to]||{sel:[],own:[]};ws().plans[to].sel=r.cs.map(keyOf);ws().plan=to;refresh();renderGen()}
  else if(d.peekg!==undefined){const r=S.gen.top[+d.peekg];S.hover=null;const keep=plan().sel;plan().sel=r.cs.map(keyOf);renderCal();plan().sel=keep;$('#stats').insertAdjacentHTML('afterbegin','<span class="warn">Vista previa, no guardada.</span>')}
});
document.addEventListener('keydown',e=>{const bx=e.target.closest?.('[data-box]');if(bx&&(e.key==='Enter'||e.key===' ')){e.preventDefault();toggleBox(bx.dataset.box)}});
document.addEventListener('change',e=>{if(e.target.dataset.note){const k=e.target.dataset.note,m=ws().marks;m[k]={...(m[k]||{}),n:e.target.value.trim()};save()}});
$('#map').addEventListener('pointerover',e=>{if(e.pointerType!=='mouse')return;const b=e.target.closest('[data-box]');const k=b?b.dataset.box:null;if(k!==S.mapHover){S.mapHover=k;renderMap()}});
$('#lineas').addEventListener('pointerover',e=>{if(e.pointerType!=='mouse')return;const b=e.target.closest('[data-obox]');const k=b?b.dataset.obox:null;if(k!==S.mapHover){S.mapHover=k;renderMap()}});
$('#lineas').addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&S.mapHover&&!S.mapFocus){S.mapHover=null;renderMap()}});
$('#map').addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&S.mapHover&&!S.mapFocus){S.mapHover=null;renderMap()}});
const cambiarMeta=e=>{
  if(!['meta-periodos','meta-actual'].includes(e.target.id))return;
  const cfg={periodos:$('#meta-periodos').value,actual:$('#meta-actual').checked};
  store.set('meta.'+S.car,cfg);
  const D=statsDatos();$('#meta-result').innerHTML=metaResumen(D,cfg.periodos,D.simulado?false:cfg.actual);
  $('#meta-periodos').setAttribute('aria-invalid',String(!metaCreditos(D,cfg.periodos,cfg.actual).valida));
};
$('#kstats').addEventListener('input',cambiarMeta);
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
  SIM.on=true;simSave();renderStats()});
/* globo de ayuda inmediato (el «title» nativo tarda ~1 s): un solo elemento fijo, colocado junto al ⓘ sin salirse de la
   pantalla ni quedar recortado por recuadros con overflow; cursor, teclado y toque */
const TIP=(()=>{const d=document.createElement('div');d.className='tip-flot';d.setAttribute('role','tooltip');d.hidden=true;document.documentElement.appendChild(d);return d})();   // fuera del <body>: no hereda su «zoom» (--ui-zoom)
let tipDe=null;
let tipT=0;
function tipMuestra(el){tipDe=el;tipT=performance.now();TIP.textContent=el.dataset.tip;TIP.hidden=false;
  const r=el.getBoundingClientRect(),w=TIP.offsetWidth,h=TIP.offsetHeight,m=8;
  let x=Math.min(Math.max(m,r.left+r.width/2-w/2),innerWidth-w-m), y=r.bottom+6;
  if(y+h>innerHeight-m)y=r.top-h-6;
  TIP.style.left=x+'px';TIP.style.top=Math.max(m,y)+'px'}
function tipOculta(){tipDe=null;TIP.hidden=true}
document.addEventListener('pointerover',e=>{const el=e.target.closest?.('[data-tip]');if(el&&e.pointerType==='mouse')tipMuestra(el)});
document.addEventListener('pointerout',e=>{const el=e.target.closest?.('[data-tip]');if(el&&e.pointerType==='mouse'&&!el.contains(e.relatedTarget))tipOculta()});
document.addEventListener('focusin',e=>{const el=e.target.closest?.('[data-tip]');if(el)tipMuestra(el)});
document.addEventListener('focusout',e=>{if(e.target.closest?.('[data-tip]'))tipOculta()});
document.addEventListener('click',e=>{const el=e.target.closest?.('[data-tip]');if(el){e.preventDefault();if(MQ_PHONE.matches){tipOculta();SateUI.modal('Ayuda',el.dataset.tip,{pequeno:true});return}if(tipDe===el&&performance.now()-tipT>400)tipOculta();else tipMuestra(el)}else if(tipDe)tipOculta()},true);
addEventListener('scroll',()=>{if(tipDe)tipOculta()},{passive:true,capture:true});
$('#stats-btn').addEventListener('click',()=>SATE.ir(SATE.actual?.pestana==='desempeno'?'mapa':'desempeno'));
// las gráficas toman los colores del tema al dibujarse: se redibujan si cambia el tema (sistema o botón)
{const redibuja=()=>{if(!$('#kstats')?.hidden)renderStats()};
  try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',redibuja)}catch(e){}
  new MutationObserver(redibuja).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']})}
$('#mapvista').addEventListener('click',e=>{const b=e.target.closest('[data-vista]');if(!b)return;store.set('mapVista',b.dataset.vista);
  if(b.dataset.vista==='sigue'&&!SHOWSUG){SHOWSUG=true;store.set('verSug',true)}renderMap()});
$('#minimap').addEventListener('click',()=>{store.set('mapVista',mapVista()==='todo'?'sigue':'todo');renderMap();$('#mapwrap').scrollIntoView({block:'nearest'})});
$('#f-carrera').addEventListener('change',e=>{S.car=e.target.value;store.set('car',S.car);S.chips=[];S.gen=null;ZOOM=null;if(DEMO){ALUMNO=perfilDemo();for(const k in T)delete T[k]}render()});
$('#b-all').addEventListener('click',()=>{const off=offeredClaves();tr().want=[...new Set([...tr().want,...Object.keys(cur()).filter(k=>available(k)&&off.has(k))])];saveT();renderTray()});
$('#b-sugg').addEventListener('click',()=>{tr().want=[...new Set([...tr().want,...suggestions().list])];saveT();renderTray()});
$('#sug-on').addEventListener('change',e=>{SHOWSUG=e.target.checked;store.set('verSug',SHOWSUG);
  if(SHOWSUG)store.set('mapVista','sigue');else if(mapVista()==='sigue')store.set('mapVista','pend');renderMap()});
// simulación de fin de semestre: recalcula mapa, sugerencias, créditos y desfase
/* etiqueta en los bloques que cambian con la simulación de fin de semestre: alterna entre la simulación y los datos
   reales sin perder de vista el bloque (comparación rápida) */
const simTag=blk=>{if(!isPersonal())return '';const hay=SIM.on||Object.keys(SIM.res).length||Object.keys(SIM.rec).length;
  if(!hay||!conSim(false,()=>tr().enCurso.length||tr().pendRep.length))return '';
  return usaSim(blk)?`<button type="button" class="tag sim sim-tgl" data-simtgl="${blk}" title="Este bloque muestra tu simulación de fin de semestre. Pulsa para ver tus datos reales solo aquí.">Simulación ⇄</button>`
    :`<button type="button" class="tag sim-off sim-tgl" data-simtgl="${blk}" title="Este bloque muestra tus datos reales. Pulsa para ver tu simulación solo aquí.">Datos reales ⇄</button>`};
const simSave=()=>{store.set('sim',SIM);for(const k in T)delete T[k];renderTray()};
const simTodos=()=>{for(const k in SIMBLK)delete SIMBLK[k];store.set('simBlk',SIMBLK)};
$('#est-sim').addEventListener('change',e=>{if(e.target.id==='sim-on'){SIM.on=e.target.checked;simTodos();simSave()}});
// interruptor desde cualquier bloque: conserva la posición del bloque en pantalla
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-simtgl]');if(!b)return;
  const blk=b.dataset.simtgl, y0=b.getBoundingClientRect().top;SIMBLK[blk]=!usaSim(blk);store.set('simBlk',SIMBLK);
  if(blk==='mapa')renderMap();else if(blk==='sugg')renderSide();else renderStats();
  const fija=()=>{const n=document.querySelector(`[data-simtgl="${blk}"]`);if(n)window.scrollBy(0,n.getBoundingClientRect().top-y0)};
  requestAnimationFrame(fija);setTimeout(fija,450);setTimeout(fija,1200)});
$('#est-sim').addEventListener('click',e=>{if(e.target.closest('#sim-reset')){SIM.res={};SIM.rec={};SIM.on=true;simTodos();simSave();return}
  const b=e.target.closest('[data-simok],[data-simko]');if(!b||b.disabled)return;
  const k=b.dataset.simok||b.dataset.simko;SIM.res[k]={...(SIM.res[k]||{}),ok:!!b.dataset.simok};simSave()});
$('#est-sim').addEventListener('change',e=>{const t=e.target,d=t.dataset;
  if(d.simcal){SIM.res[d.simcal]={...(SIM.res[d.simcal]||{ok:true}),cal:+t.value};simSave()}
  else if(d.simcalr){SIM.res[d.simcalr]={...(SIM.res[d.simcalr]||{ok:false}),calR:+t.value};simSave()}
  else if(d.simrec!==undefined){if(t.value)SIM.rec[d.simrec]={...(SIM.rec[d.simrec]||{}),forma:t.value};else delete SIM.rec[d.simrec];simSave()}
  else if(d.simreccal){SIM.rec[d.simreccal]={...(SIM.rec[d.simreccal]||{}),cal:+t.value};simSave()}});
$('#b-none').addEventListener('click',()=>{tr().want=[...tr().oblig];saveT();renderTray()});
$('#b-go').addEventListener('click',()=>{S.onlyWant=true;store.set('onlyWant',true);SATE.ir('horarios');window.scrollTo({top:0})});
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

(()=>{
  const wrap=$('#mapwrap'), map=$('#map'), areas=$('#areas'), HEAD=30, GAIN=1.8, ZMAX=2.5;
  const fit=()=>{const L=MAP().layout;return L?(wrap.clientWidth-2)/L.w:.6};   // escala de «mapa completo»
  const clampZ=z=>Math.min(ZMAX,Math.max(Math.min(.4,fit()),z)), dist=(a,b)=>Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
  const rel=(x,y)=>{const r=wrap.getBoundingClientRect();return[x-r.left,y-r.top]};
  // redibuja a la escala z manteniendo fijo el punto (cx,cy) del contenedor
  const commit=(z,cx,cy)=>{const old=MAPSC;if(Math.abs(z-old)<.004)return;
    const x=(wrap.scrollLeft+cx)/old, y=(wrap.scrollTop+cy-HEAD)/old;
    ZOOM=z;renderMap();wrap.scrollLeft=x*MAPSC-cx;wrap.scrollTop=y*MAPSC-cy+HEAD};
  let pinch=null;
  const reset=()=>{map.style.transform=areas.style.transform='';map.style.transformOrigin=areas.style.transformOrigin=''};
  const end=()=>{if(!pinch)return;const p=pinch;pinch=null;reset();commit(p.z,p.cx,p.cy)};
  wrap.addEventListener('touchstart',e=>{
    if(e.touches.length!==2){if(e.touches.length>2)end();return}
    const [a,b]=e.touches, [cx,cy]=rel((a.clientX+b.clientX)/2,(a.clientY+b.clientY)/2);
    pinch={d:dist(a,b)||1,z0:MAPSC,z:MAPSC,cx,cy};
    const ox=wrap.scrollLeft+cx, oy=wrap.scrollTop+cy-HEAD;
    map.style.transformOrigin=`${ox}px ${oy}px`;areas.style.transformOrigin=`${ox}px 0`;
  },{passive:true});
  wrap.addEventListener('touchmove',e=>{
    if(!pinch||e.touches.length!==2)return;
    if(e.cancelable)e.preventDefault();
    const [a,b]=e.touches;
    pinch.z=clampZ(pinch.z0*Math.pow(dist(a,b)/pinch.d,GAIN));
    const k=pinch.z/pinch.z0;map.style.transform=`scale(${k})`;areas.style.transform=`scaleX(${k})`;
  },{passive:false});
  wrap.addEventListener('touchend',e=>{if(e.touches.length<2)end()});
  wrap.addEventListener('touchcancel',end);               // si el navegador interrumpe el gesto, se conserva el zoom alcanzado
  ['gesturestart','gesturechange'].forEach(t=>wrap.addEventListener(t,e=>e.preventDefault()));   // Safari (iOS)
  let raf=0,pend=null;
  wrap.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();const [cx,cy]=rel(e.clientX,e.clientY);
    pend={z:clampZ((pend?.z??MAPSC)*Math.exp(-e.deltaY/200)),cx,cy};
    if(!raf)raf=requestAnimationFrame(()=>{raf=0;const p=pend;pend=null;commit(p.z,p.cx,p.cy)})},{passive:false});
})();
let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{if(SATE.modulos.mapa&&S.tab==='tray'&&ZOOM==null)renderMap()},150)});
$('#foot-info').textContent='Herramienta de consulta para que el alumno planee su reinscripción. Los datos del SAES se consultan en modo de solo lectura y se almacenan únicamente en este navegador, al igual que las materias seleccionadas, marcas, notas y horarios. La reinscripción oficial se realiza en el SAES, donde deben verificarse la cita, la carga autorizada y el cupo. ';
{const b=document.createElement('button');b.type='button';b.className='enc-link';b.dataset.encuesta='';b.textContent='Dar mi opinión sobre IPN-tools';$('#foot').appendChild(b)}
// contexto anónimo para la encuesta (tools/encuesta.py): sin nombre, boleta ni calificaciones
window.ENCUESTA_CTX=()=>({carrera:S.car,demo:DEMO,conDatos:isPersonal(),elegidas:tr().want.length,enHorario:selected().length,
  lector:DEMO||!ALUMNO?'':ALUMNO.lector||'anterior',datosDias:ALUMNO?.leido&&!DEMO?Math.floor((Date.now()-new Date(ALUMNO.leido))/864e5):null});
if(ALUMNO&&DATA.mapas[carreraPerfil(ALUMNO)])S.car=carreraPerfil(ALUMNO);
const mobNote=()=>{$('#mobnote').hidden=true};
mobNote();MQ_PHONE.addEventListener('change',()=>{mobNote();render()});
$('#b-unidad').addEventListener('click',()=>SATE.elegirUnidad());   // primera visita: unidad, carrera o inicio de sesión
SAES.status(ALUMNO);
SAES.wire(d=>{ALUMNO=d;for(const k in T)delete T[k];if(d&&DATA.mapas[carreraPerfil(d)]){S.car=carreraPerfil(d);store.set('car',S.car)}S.tab='tray';render();SAES.status(d)});

SATE.nucleoListo({store,personal:()=>!!ALUMNO,renderTop,renderAviso,renderTray,renderHor,estado:S,ofertaLista:actualizarOferta}).catch(SATE.error);
