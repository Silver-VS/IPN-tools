/* Estampado oficial conservado; la captura entrega una instantánea explícita. */
(function(raiz){
const CARN={B:'Ingeniería Biónica',M:'Ingeniería Mecatrónica',T:'Ingeniería Telemática',E:'Ingeniería en Energía',S:'Ing. en Sistemas Automotrices'};
const MOD={D:{h:16},C:{h:50},I:{h:20}};
const floor2=x=>Math.floor(x*100+1e-6)/100;
const fmt=x=>(+x).toFixed(2).replace(/\.?0+$/,'');
function hourOpt(h){const o=[{w:3,s:54,c:'3.37'},{w:4.5,s:81,c:'5.06'},{w:6,s:108,c:'6.75'}];return o.reduce((b,x)=>Math.abs(x.w-Math.min(h,6))<Math.abs(b.w-Math.min(h,6))?x:b)}

const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function generar(datos){
  const {tipo:kind,estado:S,pdfs,oferta,catalogo:CATK,actividades,fecha}=datos;
  const DATA={pdfs,oferta};
  const totals=()=>({ok:actividades});

  function hoursOf(a){const c=CATK[a.k];let h=+a.h||0;if(c?.f.cap)h=Math.min(h,c.f.cap);return h}
function credOf(a){const c=CATK[a.k];if(!c)return 0;if(c.f.cc)return floor2(((+a.ht||0)+(+a.hp||0))*18/16);return floor2(hoursOf(a)/MOD[c.m].h)}

  const {PDFDocument,StandardFonts,rgb,degrees}=PDFLib;
  const ink=rgb(.05,.08,.35);
  const SRC={};const load=async k=>SRC[k]||(SRC[k]=await PDFDocument.load(b64(DATA.pdfs[k])));
  const out=await PDFDocument.create();
  // Cada hoja oficial se dibuja como bloque aislado sobre una hoja vertical; las hojas con /Rotate 90 se giran aquí
  // para trabajar siempre en las coordenadas que ve el alumno (612×792, origen abajo a la izquierda).
  const page=async(k,i)=>{const src=await load(k),sp=src.getPage(i),emb=await out.embedPage(sp),rot=sp.getRotation().angle%360;const pg=out.addPage([612,792]);
    if(rot===90)pg.drawPage(emb,{x:0,y:emb.width,rotate:degrees(-90)});else pg.drawPage(emb,{x:0,y:0});return pg};
  const font=await out.embedFont(StandardFonts.Helvetica), bold=await out.embedFont(StandardFonts.HelveticaBold);
  const fit=(t,max,size)=>{t=String(t??'');while(size>5&&font.widthOfTextAtSize(t,size)>max)size-=.5;return size};
  const T=(pg,t,x,top,size=10,max=400,f=font)=>{t=String(t??'').trim();if(!t)return;const s=fit(t,max,size);pg.drawText(t,{x,y:792-top-s*.8,size:s,font:f,color:ink})};
  const X=(pg,x,top,size=14)=>pg.drawText('X',{x:x-size*.33,y:792-top-size*.75,size,font:bold,color:ink});
  const d=S.d, full=`${d.no} ${d.ap}`.trim(), hoy=new Date(fecha);
  const MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const carN=CARN[S.car];
  if(kind==='die03'){
    const t=totals();
    // El DIE-03 admite una sola modalidad de aprendizaje: se genera un reporte por modalidad
    const groups=['D','C','I'].map(m=>t.ok.filter(a=>CATK[a.k].m===m)).filter(g=>g.length);
    for(const acts of groups){
    const m=CATK[acts[0].k].m, crG=floor2(acts.reduce((s,a)=>s+credOf(a),0));
    // Hoja 1
    const p1=await page('die03',0);
    T(p1,full,130,172,10,250);T(p1,d.bo,410,172,10,120);T(p1,carN,200,188,9,110);
    T(p1,hoy.getDate(),350,188,10,20);T(p1,MES[hoy.getMonth()],392,188,10,80);T(p1,hoy.getFullYear(),488,188,10,40);
    T(p1,d.co,178,204,10,290);
    X(p1,{D:153,C:302,I:453}[m],288,20);
    const hrs=acts.filter(a=>!CATK[a.k].f.cc).reduce((s,a)=>s+hoursOf(a),0);
    T(p1,fmt(hrs),252,340,14,60);T(p1,fmt(crG),468,340,14,60);
    const ev=new Set(acts.map(a=>a.ev)), evx={constancia:92,boleta:169,oficio:222,otro:298};
    Object.entries(evx).forEach(([k,x])=>{if(ev.has(k))X(p1,x,416,11)});
    if(ev.has('otro'))T(p1,acts.filter(a=>a.ev==='otro').map(a=>a.inst||a.desc).join(', '),392,414,8,140);
    // Hoja 2 (tabla girada): 6 renglones por hoja
    const ROWS=[[655,743],[567,655],[478,567],[390,478],[302,390],[213,302]];
    const COLS=[[60,200],[200,338],[338,475],[475,612],[612,750],[750,888],[888,1025],[1025,1163]];
    const cell=(pg,r,c,txt,size=7.5)=>{
      txt=String(txt??'').trim();if(!txt)return;
      const [y0,y1]=COLS[c], len=(y1-y0)/1.5-8, [x0,x1]=ROWS[r];
      const words=txt.split(/\s+/), lines=[];let cur='';
      words.forEach(w=>{const tr=cur?cur+' '+w:w;if(font.widthOfTextAtSize(tr,size)<=len)cur=tr;else{if(cur)lines.push(cur);cur=w}});if(cur)lines.push(cur);
      const maxL=Math.floor(((x1-x0)/1.5-6)/(size+1.5));
      lines.slice(0,maxL).forEach((ln,i)=>pg.drawText(ln,{x:x1/1.5-4-size-i*(size+1.5),y:792-y0/1.5-4,size,font,color:ink,rotate:degrees(-90)}));
    };
    const pages=Math.max(1,Math.ceil(acts.length/6));
    for(let p=0;p<pages;p++){
      const p2=await page('die03',1);
      acts.slice(p*6,p*6+6).forEach((a,r)=>{const c=CATK[a.k];
        [c.k==='CC'?'Cambio de carrera':c.k,a.desc||c.t,a.inst,a.folio||'S/N',a.fecha,a.firma,c.f.cc?`${a.ht}+${a.hp} h/sem`:fmt(hoursOf(a)),fmt(credOf(a))].forEach((v,ci)=>cell(p2,r,ci,v,ci===0?8:7.5));
      });
      if(p===pages-1){
        const tot=(c,txt)=>{const [y0]=COLS[c];p2.drawText(txt,{x:213/1.5-4-10,y:792-y0/1.5-6,size:10,font:bold,color:ink,rotate:degrees(-90)})};
        tot(6,fmt(hrs));tot(7,fmt(crG));
      }
    }
    }
    // Formulario
    const pf=await page('form',0);const f=S.f;
    T(pf,d.ap,146,135,10,185);T(pf,d.no,398,135,10,130);T(pf,d.bo,162,157,10,95);T(pf,carN,392,157,9,140);
    const yn=(v,xs,xn,top)=>{if(v==='si')X(pf,xs,top,12);else if(v==='no')X(pf,xn,top,12)};
    yn(f.q1,112,262,284);if(f.q1==='si')T(pf,f.sob,432,281,10,60);
    yn(f.q2,104,183,379);if(f.q2==='si')T(pf,f.q2p,340,376,10,120);
    yn(f.q3,112,190,447);if(f.q3==='si'){T(pf,f.q3n,388,444,10,50);T(pf,f.q3a,150,474,10,50);T(pf,f.q3r,272,474,10,45);T(pf,f.q3p,470,474,10,60)}
    yn(f.q4,104,186,548);yn(f.q5,104,176,639);
    if(f.obs){const words=f.obs.split(/\s+/);let ln='',row=0;const put=()=>{T(pf,ln,82,704+row*10,8,450);row++;ln=''};words.forEach(w=>{const tr=ln?ln+' '+w:w;if(font.widthOfTextAtSize(tr,8)>450){put();ln=w}else ln=tr});if(ln)put()}
    return out.save();
  }
  // DIE-01 / DIE-02
  const o=S.o, r=DATA.oferta.find(x=>x[0]+'|'+x[2]+'|'+x[3]===o.cls);if(!r)throw new Error('Elige la materia y el grupo.');
  const same=o.car===S.car, pg=await page(same?'die02':'die01',0);
  const dy=same?0:1, Y=same?{n:183,c:200,ua:258,pr:314,g:348,h:398,dep:479}:{n:189,c:211,ua:268,pr:324,g:359,h:410,dep:492};
  T(pg,full,196,Y.n,10,210);T(pg,d.bo,472,Y.n,10,105);T(pg,carN,120,Y.c,10,200);T(pg,`${hoy.getDate()} de ${MES[hoy.getMonth()]} de ${hoy.getFullYear()}`,366,Y.c,10,210);
  T(pg,same?r[3]:`${r[3]} (${CARN[r[0]]})`,74,Y.ua,10,500);T(pg,[r[4],o.pmail].filter(Boolean).join(' · '),74,Y.pr,10,500);
  T(pg,r[2],116,Y.g,10,200);T(pg,o.per,414,Y.g,10,160);
  const hs=hourOpt(r[5]);X(pg,{3:115,4.5:257,6:400}[hs.w],Y.h,16);
  const dx={TA:132,ING:233,CB:322,FII:452}[o.dep];if(dx)X(pg,dx,Y.dep,14);
  return out.save();
}

raiz.PdfElectivas={generar,cabe:(texto,recuadro)=>PdfTramites.cabe(texto,recuadro)};
})(globalThis);
