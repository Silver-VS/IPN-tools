// Integración real con Chrome/CDP y perfiles ficticios. Uso: node tests/qa_dictamen.mjs
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import vm from 'node:vm';

mkdirSync('qa-formatos',{recursive:true});
const html=readFileSync('web/dist/dictamen.html','utf8');
let bloques=0;
for(const archivo of ['web/dist/dictamen.html','web/dist/horarios-upiita.html']){
  for(const m of readFileSync(archivo,'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    if(/\bsrc=|application\/ld\+json/.test(m[1]))continue;
    new Function(m[2]);bloques++;
  }
}
console.log(`Sintaxis: ${bloques} bloques válidos`);
const revision=readFileSync('web/revision.html','utf8');
const demo=vm.runInNewContext('('+revision.match(/const DEMO=(\{[\s\S]*?\});/)[1]+')');
const chrome=[process.env.CHROME,'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','/usr/bin/google-chrome'].find(p=>p&&existsSync(p));
assert.ok(chrome,'Chrome instalado');
const puerto=9500+Math.floor(Math.random()*400);
// El entorno restringido de Codex puede impedir que Chrome cree sus subprocesos con aislamiento propio.
const flags=process.env.QA_CHROME_SIN_SANDBOX==='1'?['--no-sandbox']:[];
const proceso=spawn(chrome,['--headless=new',`--remote-debugging-port=${puerto}`,`--user-data-dir=${mkdtempSync(join(tmpdir(),'dictamen-'))}`,'--no-first-run','--disable-gpu',...flags,'about:blank'],{stdio:'ignore'});
const esperar=ms=>new Promise(r=>setTimeout(r,ms));
let ws;
try{
  let destino;
  for(let i=0;i<80;i++){try{const tabs=await(await fetch(`http://127.0.0.1:${puerto}/json`)).json();destino=tabs.find(t=>t.type==='page')?.webSocketDebuggerUrl;if(destino)break}catch{}await esperar(100)}
  assert.ok(destino,'Chrome responde');ws=new WebSocket(destino);await new Promise(r=>ws.addEventListener('open',r));
  let n=0;const pendientes=new Map(),errores=[];
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pendientes.get(m.id)?.(m);pendientes.delete(m.id)}if(m.method==='Runtime.exceptionThrown')errores.push(m.params.exceptionDetails)});
  const cdp=(method,params={})=>new Promise((r,j)=>{const id=++n;const timer=setTimeout(()=>{if(pendientes.delete(id))j(new Error('CDP timeout: '+method))},30000);pendientes.set(id,m=>{clearTimeout(timer);r(m)});ws.send(JSON.stringify({id,method,params}))});
  const ev=async expression=>{const m=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(m.error||m.result.exceptionDetails)throw new Error(JSON.stringify(m.error||m.result.exceptionDetails));return m.result.result.value};
  await cdp('Runtime.enable');await cdp('Page.enable');
  await cdp('Page.navigate',{url:pathToFileURL(resolve('web/dist/dictamen.html')).href});
  for(let i=0;i<150;i++){if(await ev(`typeof generar==='function' && typeof PDFLib!=='undefined'`))break;await esperar(200)}
  assert.equal(await ev(`typeof generar`),'function','Página cargada');assert.equal(await ev(`typeof PDFLib`),'object','pdf-lib cargado');
  assert.equal(await ev(`$('#boleta').value`),'','Sin datos: formulario vacío');
  assert.equal(await ev(`precargar({...${JSON.stringify(demo)},unidad:'escom'})`),null,'Rechaza otra unidad');
  assert.equal(await ev(`precargar(null)`),null,'Sin perfil');
  await ev(`localStorage.setItem('saes.alumno',${JSON.stringify(JSON.stringify(demo))})`);
  await cdp('Page.reload');await esperar(1000);
  assert.equal(await ev(`$('#boleta').value`),demo.boleta,'DEMO: boleta');
  assert.equal(await ev(`document.querySelectorAll('.ua').length`),2,'DEMO: dos UA');
  assert.deepEqual(await ev(`precargar(${JSON.stringify(demo)}).filas.map(r=>r.recursada)`),['',''],'No inventa recursamientos');
  assert.equal(await ev(`precargar({...${JSON.stringify(demo)},acreditadas:[['B204',6]],kardex_reprobadas:[['B207',4,'25/1','ORD'],['B207',5,'25/2','ORD']]}).filas[0].recursada`),'25/2','Historial de recursamiento');
  const antes=await ev(`JSON.stringify({...localStorage})`);
  await ev(`$('#paterno').value='DE DEMOSTRACIÓN';$('#materno').value='PRUEBA';$('#nombres').value='ALUMNO UNO';$('#correo').value='demo@example.invalid';$('#celular').value='5500000000';$('#fecha').value='2026-10-06';$('#ingreso').value='25/1';$('#anteriores').value='No';$('#peticion').value='Solicito autorización para recursar las unidades pendientes.';$('#motivos').value='Expongo mis motivos de prueba. Solicito revisar mi situación escolar y autorizar el recursamiento. Perfil ficticio para revisión del formato.';document.querySelector('[name=dependientes][value=si]').checked=true;document.querySelector('[name=hijos][value=no]').checked=true;document.querySelector('[name=embarazo][value=no_contestar]').checked=true;document.querySelector('[name=situacion][value=s1]').checked=true;document.querySelector('[name=causas][value=salud]').checked=true;document.querySelector('[name=anexos][value=carta_anexo]').checked=true;$('#nacimiento').value='2000-01-01';$('#civil').value='Soltero';$('#domicilio').value='Calle ficticia 123, Ciudad de México';$('#ingreso_ext').value='25/1';$('#ultimo').value='4';`);
  assert.equal(await ev(`JSON.stringify({...localStorage})`),antes,'Datos sensibles no se guardan');
  for(const tipo of ['interno','externo','carta']){
    const bytes=await ev(`(async()=>{const v=valores();v.tipo='externo';return Array.from(await generar('${tipo}',v))})()`);
    writeFileSync(`qa-formatos/demo-${tipo}.pdf`,Buffer.from(bytes));console.log(`PDF ${tipo}: ${bytes.length} bytes`);
  }
  assert.equal(await ev(`(async()=>{try{await generar('interno',{...valores(),plan:'18'});return false}catch(e){return e.message===txt('plan_no_admitido')}})()`),true,'Plan incompatible: error explícito');
  assert.equal(await ev(`(async()=>{try{await generar('externo',{...valores(),peticion:'motivos '.repeat(300)});return false}catch(e){return e.message===txt('exceso')}})()`),true,'Rechaza desbordamiento');
  assert.equal(await ev(`(async()=>{try{await generar('interno',{...valores(),filas:Array(9).fill({})});return false}catch(e){return e.message===txt('filas_exceso')}})()`),true,'Tabla: límite de ocho filas');
  for(const width of [1280,375])for(const tema of ['claro','oscuro']){
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===375});
    await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:tema==='oscuro'?'dark':'light'}]});
    await ev(`document.documentElement.dataset.tema='${tema}'`);
    for(const tipo of ['interno','externo']){
      await ev(`$('#tipo').value='${tipo}';$('#tipo').onchange()`);
      assert.equal(await ev(`document.documentElement.scrollWidth<=innerWidth`),true,`${width}/${tema}/${tipo}: sin overflow`);
    }
    await ev(`$('#requisitos').click()`);assert.equal(await ev(`document.querySelector('dialog').open`),true,'Modal de requisitos');
    await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    assert.equal(await ev(`document.querySelector('dialog').open`),false,'Escape cierra modal');
    const captura=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(`qa-formatos/pagina-${width}-${tema}.png`,Buffer.from(captura.result.data,'base64'));
  }
  assert.deepEqual(errores,[],'Sin errores JS');console.log('Dictamen: integración, privacidad, validación, modal y tamaños correctos');
}finally{ws?.close();proceso.kill()}
