// Regresión del texto y de TODAS las coordenadas estampadas frente al código anterior a V1.
// pdf-lib se instrumenta en memoria; no se envían plantillas ni datos a ningún servicio.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const leer=p=>readFileSync(p,'utf8');
const Fijo=class extends Date{constructor(...args){super(...(args.length?args:['2026-10-07T12:00:00Z']))}};
function biblioteca(){
  let numero=0;
  const fuente=name=>({name,encodeText(){},widthOfTextAtSize:(s,size)=>String(s).length*size*.5});
  const crear=()=>{
    const trazas=[],paginas=[];
    const pagina=i=>({getRotation:()=>({angle:i===1?90:0}),drawText:(s,o)=>trazas.push(['texto',paginas.length,s,o]),drawPage:(e,o)=>trazas.push(['fondo',e,o]),drawRectangle:o=>trazas.push(['mascara',o])});
    const doc={numero:numero++,embedFont:async n=>fuente(n),getPages:()=>paginas,getPage:i=>paginas[i]||pagina(i),getPageIndices:()=>paginas.map((_,i)=>i),
      addPage(arg){if(arg&&!Array.isArray(arg)){paginas.push(arg);trazas.push(['copia',arg.indice]);return arg}const p=pagina(paginas.length);paginas.push(p);trazas.push(['pagina',arg]);return p},
      embedPage:async()=>({width:792,height:612}),copyPages:async(src,indices)=>indices.map(i=>({indice:i})),save:async()=>new TextEncoder().encode(JSON.stringify(trazas))};
    return doc;
  };
  return {PDFDocument:{create:async()=>crear(),load:async bytes=>{const d=crear();d.addPage([612,792]);if(bytes==='dos')d.addPage([612,792]);return d}},StandardFonts:{Helvetica:'Helvetica',HelveticaBold:'HelveticaBold'},rgb:(r,g,b)=>({r,g,b}),degrees:angle=>({angle})};
}
const texto=(k,v={})=>k+Object.values(v).join(' '),base={console,Date:Fijo,Uint8Array,TextEncoder,atob:s=>s,PDFLib:biblioteca()};
const nuevo=vm.createContext({...base});
for(const f of ['pdf-comun','pdf-dictamen','pdf-electivas'])vm.runInContext(leer('web/tramites/'+f+'.js'),nuevo);
const antiguoD=vm.createContext({...base,txt:(k,v)=>texto(k,v),DATA:{pdfs:{interno:'uno',externo:'uno'}}});
vm.runInContext(leer('tests/fixtures/ventanilla/dictamen-estampado.js'),antiguoD);
const valores={paterno:'ALUMNO',materno:'FICTICIO',nombres:'ANA MARÍA',boleta:'2099000000',carrera:'Ingeniería Biónica',plan:'2009',unidad:'UPIITA-IPN',correo:'ficticio@example.test',telefono:'0000000000',celular:'0000000001',fecha:'2026-10-07',anteriores:'Sí',oficios:'FICTICIO-1',ingreso:'2022',peticion:'Solicitud ficticia.\nSegunda línea.',motivos:'Motivos ficticios.\n'+('Texto ficticio de prueba. '.repeat(160)),filas:Array.from({length:8},(_,i)=>({clave:'F'+i,nombre:'Materia ficticia '+i,nivel:'1',cursada:'25/1',recursada:'26/1'})),dependientes:['si'],hijos:['no'],embarazo:['no_contestar'],organo:['ctce'],situacion:['s1','s6'],causas:['salud','otras'],anexos:['boleta_global','bajas'],otras_causas:'Ejemplo ficticio',otras_situacion:'Otra situación',nacimiento:'2000-01-01',civil:'Soltero',domicilio:'Domicilio ficticio',ingreso_ext:'2022',ultimo:'4',dictamen_fecha:'2025'};
for(const tipo of ['interno','externo','carta']){
  const a=await antiguoD.generar(tipo,valores),b=await nuevo.PdfDictamen.generar({tipo,valores,pdfs:{interno:'uno',externo:'uno'},texto});
  assert.deepEqual(b,a,tipo+': mismo texto, coordenadas, tamaño, fuente, máscaras y saltos de página');
}
const catalogo={D:{k:'D',m:'D',t:'Docencia ficticia',f:{}},C:{k:'C',m:'C',t:'Campo ficticio',f:{}},I:{k:'I',m:'I',t:'Independiente ficticia',f:{cap:40}},CC:{k:'CC',m:'D',t:'Cambio ficticio',f:{cc:1}}};
const estado={car:'B',d:{no:'ANA MARÍA',ap:'ALUMNO FICTICIO',bo:'2099000000',co:'ficticio@example.test'},f:{q1:'si',sob:'2',q2:'si',q2p:'26/1',q3:'si',q3n:'2',q3a:'1',q3r:'1',q3p:'26/2',q4:'no',q5:'si',obs:'Observación ficticia '.repeat(10)},o:{car:'B',cls:'B|F01|Materia ficticia',per:'27/1',pmail:'docente@example.test',dep:'TA'}};
const actividades=Array.from({length:10},(_,i)=>({k:i<7?'D':['C','I','CC'][i-7],h:80,ht:2,hp:2,desc:'Actividad ficticia',inst:'Institución ficticia',folio:'F'+i,fecha:'2026-10-07',firma:'Firma ficticia',ev:['constancia','boleta','oficio','otro'][i%4]}));
const oferta=[['B','M','F01','Materia ficticia','Docente ficticio',4.5,'F','P'],['M','M','F02','Otra materia ficticia','Docente ficticio',6,'F','P']];
const pdfs={die03:'dos',form:'uno',die01:'uno',die02:'uno'};
const antiguoE=vm.createContext({...base,S:estado,DATA:{pdfs,oferta},CATK:catalogo,MOD:{D:{h:16},C:{h:50},I:{h:20}},totals:()=>({ok:actividades})});
vm.runInContext(`const CARN={B:'Ingeniería Biónica',M:'Ingeniería Mecatrónica',T:'Ingeniería Telemática',E:'Ingeniería en Energía',S:'Ing. en Sistemas Automotrices'};
const floor2=x=>Math.floor(x*100+1e-6)/100;const fmt=x=>(+x).toFixed(2).replace(/\\.?0+$/,'');
function hoursOf(a){const c=CATK[a.k];let h=+a.h||0;if(c?.f.cap)h=Math.min(h,c.f.cap);return h}
function credOf(a){const c=CATK[a.k];if(!c)return 0;if(c.f.cc)return floor2(((+a.ht||0)+(+a.hp||0))*18/16);return floor2(hoursOf(a)/MOD[c.m].h)}
function hourOpt(h){const o=[{w:3,s:54,c:'3.37'},{w:4.5,s:81,c:'5.06'},{w:6,s:108,c:'6.75'}];return o.reduce((b,x)=>Math.abs(x.w-Math.min(h,6))<Math.abs(b.w-Math.min(h,6))?x:b)}
`+leer('tests/fixtures/ventanilla/electivas-estampado.js'),antiguoE);
for(const tipo of ['die03','optativa-misma','optativa-otra']){
  if(tipo==='optativa-otra')Object.assign(estado.o,{car:'M',cls:'M|F02|Otra materia ficticia'});
  const a=await antiguoE.makePdf(tipo),b=await nuevo.PdfElectivas.generar({tipo,estado,pdfs,oferta,catalogo,actividades,fecha:'2026-10-07T12:00:00Z'});
  assert.deepEqual(b,a,tipo+': mismo estampado y orientación');
}
const font={widthOfTextAtSize:(s,z)=>s.length*z/2};
assert.deepEqual(JSON.parse(JSON.stringify(nuevo.PdfTramites.cabe('uno dos tres',{font,ancho:40,size:10,max:2}))),{renglones:['uno dos','tres'],max:2,ok:true});
assert.equal(nuevo.PdfTramites.cabe('palabra-demasiado-larga',{font,ancho:10,max:5}).ok,false);
assert.equal(nuevo.PdfDictamen.cabe('a\nb\nc\nd\ne\nf',{font,ancho:514,max:5}).ok,false);
const resultado=await nuevo.PdfTramites.unir(['dos','uno']);
const trazas=JSON.parse(new TextDecoder().decode(resultado));
assert.equal(trazas.filter(x=>x[0]==='copia').length,3);
assert.equal(trazas.filter(x=>x[0]==='pagina').length,0,'Sin hojas adicionales');
assert.deepEqual(trazas.map(x=>x.slice(0,2)),[['copia',0],['copia',1],['copia',0]],'Orden original de las páginas');
assert.equal(trazas.filter(x=>x[0]==='texto').length,0,'Sin textos añadidos');
assert.equal(trazas[0][0],'copia');
console.log('PDF: interno, COSIE-01, carta multipágina, DIE-03 D/C/I, formulario y DIE-01/02 conservan el estampado; medición y unión correctas.');
