// PDF reales, perfil ficticio y pdf-lib local; sin navegador ni red.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),PDFLib=require('../web/assets/vendor/pdf-lib.min.js');
const base=JSON.parse(readFileSync('web/dist/sate/datos/upiita/tramites.json','utf8')).bajas;
base.pdfs=JSON.parse(readFileSync('web/dist/sate/datos/upiita/bajas-pdf.json','utf8'));
const a=JSON.parse(readFileSync('data/perfiles-prueba/regular-mecatronica.json','utf8'));
const errores=[],c=vm.createContext({PDFLib,console:{error:(...args)=>errores.push(args)}});
vm.runInContext(readFileSync('web/tramites/pdf-bajas.js','utf8'),c);
const valores={fecha:'15/10/2026',paterno:'PRUEBA',materno:'FICTICIA',nombres:'ALUMNO DEMO',boleta:a.boleta,carrera:a.carrera_nombre,correo:'demo@example.test',celular:'5500000000',periodos:'27/1, 27/2',motivos:'Salud. Solicitud ficticia para verificar el formato.'};
mkdirSync('tmp-baj2',{recursive:true});
for(const tipo of ['temporal','definitiva']){
  const generar=v=>c.PdfBajas.generar({tipo,valores:v,pdfs:base.pdfs,texto:k=>k});
  const bytes=await generar(valores),doc=await PDFLib.PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(),1);assert.deepEqual(doc.getPage(0).getSize(),{width:612,height:792});
  writeFileSync(`tmp-baj2/baja-${tipo}-ejemplo.pdf`,bytes);
  await assert.rejects(()=>generar({...valores,nombres:'N'.repeat(1000)}),/exceso/);
  await assert.rejects(()=>generar({...valores,motivos:'Una línea\n'.repeat(6)}),/exceso/);
  await assert.rejects(()=>generar({...valores,motivos:'X'.repeat(1000)}),/exceso/);
  await assert.rejects(()=>generar({...valores,nombres:'Nombre\nOculto'}),/exceso/);
  await assert.rejects(()=>generar({...valores,nombres:'漢字'}),/caracteres/);
}
assert.ok(!JSON.stringify(errores).includes(valores.boleta),'Los logs no contienen datos personales');
assert.doesNotMatch(readFileSync('web/sate/dictamen.js','utf8'),/excel|xlsx/i,'Dictamen solo PDF');
console.log('OK: ambos PDF oficiales, desbordamientos, caracteres y Dictamen solo PDF.');
