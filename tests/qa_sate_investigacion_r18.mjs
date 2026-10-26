// Modelo y contratos de integración sin navegador, red ni datos de alumnos.
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {webcrypto,createHash} from 'node:crypto';
const contexto=vm.createContext({crypto:webcrypto,TextEncoder,Uint8Array});
const fuente=readFileSync('web/sate/guia.js','utf8');
vm.runInContext(fuente,contexto);
const G=contexto.SateGuia,copia=x=>JSON.parse(JSON.stringify(x));
const cargar=async doc=>JSON.parse(readFileSync('data/reglamentos/'+doc+'.json','utf8'));
const antiguo={formato:'sate-investigacion',version:1,nombre:'Caso ficticio',proposito:'estudio',autor:'',etiquetas:['Prueba'],marcadores:[{doc:'rge',n:'52',fr:'II',anotaciones:[{inicio:0,fin:5,literal:'Texto',nota:'Pregunta ficticia',etiqueta:'plazo'}]}]};
const migrado=await G.revisarInvestigacion(antiguo,cargar,true);
assert.equal(migrado.version,2);
assert.deepEqual(copia(migrado.marcadores[0].anotaciones),antiguo.marcadores[0].anotaciones);
assert.equal(migrado.marcadores[0].cambio,false);
const m=migrado.marcadores[0];
assert.equal(m.huella,createHash('sha256').update(G.textoCita(await cargar(m.doc),m)).digest('hex'));
G.editarNota(m,'Nota ficticia con <símbolos>','hecho');
assert.equal(m.nota,'Nota ficticia con <símbolos>');assert.equal(m.tipo,'hecho');
assert.throws(()=>G.editarNota(m,'x','inexistente'));
G.alternarMarcador(migrado,'rge','48');assert.equal(migrado.marcadores.length,2);
G.moverCita(migrado,1,0);assert.equal(migrado.marcadores[0].n,'48');
G.moverCita(migrado,0,-1);assert.equal(migrado.marcadores[0].n,'48');
G.alternarMarcador(migrado,'rge','48');assert.equal(migrado.marcadores.length,1);
G.alternarMarcador(migrado,'rge','52','II','a');assert.equal(migrado.marcadores.length,2);
G.alternarMarcador(migrado,'rge','52','II','a');assert.equal(migrado.marcadores.length,1);
migrado.peticion='Petición ficticia';
const exportado=G.validarInvestigacion(migrado);
const importado=await G.revisarInvestigacion(copia(exportado),cargar);
assert.deepEqual(copia(G.validarInvestigacion(importado)),copia(exportado));
const cambiado=copia(exportado);cambiado.marcadores[0].huella='0'.repeat(64);
const huellaAnterior=cambiado.marcadores[0].huella;
const revisado=await G.revisarInvestigacion(cambiado,cargar);
assert.equal(revisado.marcadores[0].cambio,true);assert.equal(revisado.marcadores[0].huella,huellaAnterior);
const sinHuella=copia(exportado);sinHuella.marcadores[0].huella='';
assert.equal((await G.revisarInvestigacion(sinHuella,cargar)).marcadores[0].cambio,true);
const md=await G.exportarMarkdownInv(exportado,cargar,(k,v)=>k+(v?' '+Object.values(v).join(' '):''),()=> '#/ficticia/guia/reglamentos/rge/art-52.II');
assert.ok(md.includes(G.textoCita(await cargar('rge'),m)));
assert.ok(md.includes('oficial · sin_cambios'));
assert.ok(md.includes('propia · hecho'));
assert.ok(md.includes(m.huella)&&md.includes('peticion · propia\n\nPetición ficticia'));
assert.ok((await G.exportarMarkdownInv(cambiado,cargar,k=>k,()=>'' )).includes('oficial · cambio'));
const crudo={articulos:[{n:'1',texto:'Inicio: I. Primera; a) Inciso uno; b) Inciso dos; II. Segunda.'}]};
assert.equal(G.textoCita(crudo,{n:'1',fr:'I',inciso:'a'}),'Inciso uno; ');
assert.equal(G.textoCita(crudo,{n:'1',fr:'II'}),'Segunda.');
assert.equal(G.textoCita(crudo,{n:'1',fr:'IX'}),null);
const proyectos=[G.migrarInvestigacion(antiguo),G.migrarInvestigacion({...antiguo,nombre:'Segundo caso'})];
G.editarNota(proyectos[1].marcadores[0],'Separada','pregunta');
assert.equal(proyectos[0].marcadores[0].nota,'');
assert.throws(()=>G.validarInvestigacion({...exportado,peticion:1}));
assert.throws(()=>G.validarInvestigacion({...exportado,marcadores:[{...exportado.marcadores[0],huella:'inventada'}]}));
let citas=0,incisos=0;
for(const archivo of readdirSync('data/reglamentos').filter(f=>f.endsWith('.json')&&f!=='indice.json')){
 const reg=JSON.parse(readFileSync('data/reglamentos/'+archivo,'utf8'));
 for(const a of reg.articulos||[]){
  assert.equal(G.textoCita(reg,{n:String(a.n),fr:''}),a.texto);
  for(const [pos,f] of (a.fracciones||[]).entries()){
   assert.equal(G.textoCita(reg,{n:String(a.n),fr:f.fr,frpos:pos+1}),f.texto);citas++;
   for(const i of f.incisos||[]){assert.equal(G.textoCita(reg,{n:String(a.n),fr:f.fr,frpos:pos+1,inciso:i.inciso}),i.texto);incisos++;}
  }
 }
}
assert.ok(citas>0&&incisos>0);
const honor=await cargar('honor');
const repetida={n:'21',fr:'I',frpos:14};
assert.equal(G.textoCita(honor,repetida),honor.articulos.find(a=>a.n==='21').fracciones[13].texto);
assert.notEqual(G.textoCita(honor,repetida),G.textoCita(honor,{n:'21',fr:'I'}));
assert.match(fuente,/apartado === 'investigacion'/);
assert.match(fuente,/nodo\.getAttribute\('data-ancla'\)/);
assert.match(fuente,/addEventListener\('input'/);
assert.match(fuente,/m\.pendienteHuella&&actual/,'Solo los marcadores migrados reciben una huella inicial');
const css=readFileSync('web/sate/componentes.css','utf8').split('/* Investigación:')[1].split('/*')[0];
assert.match(css,/minmax\(0,1fr\)/);assert.match(css,/@media\(max-width:768\.98px\)/);
const tokens=readFileSync('vendor/ipn-comun/dist/tokens.css','utf8')+readFileSync('web/sate/componentes.css','utf8')+readFileSync('web/sate/encabezado.css','utf8');
for(const [,token]of css.matchAll(/var\((--ipn-[\w-]+)\)/g))assert.ok(tokens.includes(token+':'),token);
console.log(`R18: migración, notas, proyectos independientes, orden, JSON y huellas; ${citas} fracciones y ${incisos} incisos idénticos al dato oficial.`);
