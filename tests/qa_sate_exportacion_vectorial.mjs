// Genera las muestras PDF con el renderizador real y pdf-lib local, sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
const leer=p=>readFileSync(p,'utf8'), require=createRequire(import.meta.url), PDFLib=require('../web/assets/vendor/pdf-lib.min.js');
PDFLib._point=(x,y)=>({x,y});
const output='muestras-r5-pdf';mkdirSync(output,{recursive:true});
const planes={A:[['B','M',1,'G-A','Docente ficticio',[],[[0,540,630]],4,'B101',[ ],['Aula A-101']],['B','M',1,'G-B','Docente ficticio',[],[[2,600,690]],5,'B102',[],['Lab. Física 2']]],B:[['B','M',1,'G-C','Docente ficticio',[],[[1,570,660]],6,'B201',[],['Aula B-201']]],C:[['B','M',1,'G-D','Docente ficticio',[],[[4,630,720]],7,'B301',[],['Laboratorio 3']]]};
const store={expPer:1,expDark:false,expStyle:'color',expOwn:'#dbe7f5',expShow:{g:true,p:false},get(k,d){return this[k]??d},set(k,v){this[k]=v}};
const workspace={plan:'A',plans:Object.fromEntries(Object.entries(planes).map(([k,v])=>[k,{sel:v.map(x=>x[8]+'|'+x[3]),own:[]}]))};
const canvasContext=()=>{let style='rgb(0,0,0)';return {font:'',measureText:t=>({width:String(t).length*7}),scale(){},fillRect(){},strokeRect(){},fillText(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},save(){},restore(){},roundRect(){},rect(){},clip(){},set fillStyle(v){const s=String(v);if(s.startsWith('#')){const h=s.slice(1),x=h.length===3?[...h].map(y=>y+y).join(''):h;style=`rgb(${parseInt(x.slice(0,2),16)},${parseInt(x.slice(2,4),16)},${parseInt(x.slice(4,6),16)})`}else if(s.startsWith('hsl(')){const [h,S,L]=s.match(/[\d.]+/g).map(Number),a=S/100*Math.min(L/100,1-L/100),f=n=>{const k=(n+h/30)%12;return Math.round(255*((L/100)-a*Math.max(-1,Math.min(k-3,9-k,1))))};style=`rgb(${f(0)},${f(8)},${f(4)})`}else style=s},get fillStyle(){return style}}};
const document={fonts:{ready:Promise.resolve()},createElement:()=>({getContext:()=>canvasContext()})};
const c=vm.createContext({PDFLib,document,console,Date,Uint8Array,TextEncoder,Blob,URL,plainPoint:(x,y)=>({x,y}),DATA:{siglas:'UPIITA',capturado:'2026-10-22',carreras:{B:'Ingeniería Biónica'}},S:{car:'B',per:'actual'},SATE_CONFIG:{unidades:{}},UNIDAD:'upiita',DAYS:['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'],START:420,BLOCK:90,
  store,ws:()=>workspace,planIds:()=>Object.keys(planes),
  selected:()=>planes[workspace.plan],ownVis:()=>[],isPersonal:()=>false,perMeta:()=>null,semNow:()=>null,perName:()=>'',pretty:s=>s,profs:()=>'Docente ficticio',name:x=>x[8]==='B101'?'Álgebra y análisis':x[8]==='B102'?'Física experimental':x[8]==='B201'?'Química orgánica':'Análisis clínico',pattern:x=>['Lunes 09:00–10:30'],hm:x=>`${String(Math.floor(x/60)).padStart(2,'0')}:${String(x%60).padStart(2,'0')}`,hue:()=>210,shortRoom:s=>s,fmtCr:String,txH:(k,v={})=>k==='salon'?'Salón':`Horario generado para ${v.unidad||''}, captura ${v.captura||''}`,getComputedStyle:()=>({getPropertyValue:()=>'#542344'}),
  saveFile:async(name,blob)=>{const all=name.startsWith('horarios-'),tag=`${store.expStyle}-${all?'todos-'+(store.expPer===2?'dos':'uno')+'-por-hoja':'uno'}.pdf`;writeFileSync(`${output}/${tag}`,Buffer.from(await blob.arrayBuffer()));return 'Listo: '+tag}});
c.window=c;
const source=leer('web/sate/exportacion.js'), part=source.slice(source.indexOf('function scheduleData('),source.indexOf("$('#exp-x')"));
vm.runInContext(part+';globalThis.__pdf={drawPdfPage,exportPdf,exportPdfAll};',c);
for(const style of ['color','min']){
  store.expStyle=style;store.expPer=1;workspace.plan='A';await c.__pdf.exportPdf();
  store.expPer=1;await c.__pdf.exportPdfAll();
  store.expPer=2;await c.__pdf.exportPdfAll();
}
for(const variant of ['color','min'])for(const name of [`${variant}-uno.pdf`,`${variant}-todos-uno-por-hoja.pdf`,`${variant}-todos-dos-por-hoja.pdf`])assert.ok(readFileSync(`${output}/${name}`).length>500,`${name}: PDF generado`);
console.log('qa_sate_exportacion_vectorial: se generaron seis muestras PDF vectoriales ficticias.');
