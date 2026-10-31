// Ejecutar con el servidor local desde la raíz y Playwright ya instalado, sin descargas.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync, writeFileSync, readFileSync, readdirSync} from 'node:fs';
const require=createRequire('D:/Documents/Development/UPIITA_DEV/ipn-folio-wt/r25-folio-aulac/package.json');
const {chromium}=require('playwright');
let scripts=0;
for(const file of readdirSync('web/dist').filter(f=>f.endsWith('.html'))){
  for(const [,attrs,src] of readFileSync('web/dist/'+file,'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    if(/\bsrc=|\btype=["'](?:application\/ld\+json|application\/json|module)/i.test(attrs))continue;
    new Function(src);scripts++;
  }
}
console.log('Scripts compilados:',scripts,'bloques válidos');
const out='web/dist/qa-r27-hor';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[];
try{
  if(!process.argv.includes('--solo-telefono')){
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('http://127.0.0.1:8080/web/dist/sate/index.html#/upiita/horarios');
  await page.waitForFunction(()=>typeof S!=='undefined'&&typeof renderOffer==='function');
  // Solo se cierran ventanas de bienvenida en este contexto vacío y efímero.
  await page.evaluate(()=>{void IPNT.privacidad()});
  await page.locator('#ipnt-privacidad button').click();
  await page.evaluate(()=>{SATE.ir('mapa')});
  await page.waitForFunction(()=>document.querySelector('#map [data-box]'),null,{timeout:15000});
  await page.evaluate(()=>{window.r27box=document.querySelector('#map [data-box]');window.r27edge=document.querySelector('#map .edge')});
  const box=page.locator('#map [data-box]').first();
  await box.click();
  assert.equal(await page.evaluate(()=>S.mapFocus),true);
  assert.ok(await box.evaluate(n=>n.classList.contains('hot')));
  assert.ok(await page.locator('#map .hpre,#map .hpost').count()>0,'Resalta relaciones');
  assert.equal(await page.locator('[data-fclose]').count(),0);
  const next=page.locator('#map [data-box]').nth(1);await next.hover();
  await page.waitForFunction(()=>S.mapHover===document.querySelectorAll('#map [data-box]')[1].dataset.box);
  assert.equal(await page.evaluate(()=>r27box===document.querySelector('#map [data-box]')&&r27edge===document.querySelector('#map .edge')),true,'Conserva cajas y aristas');
  await next.click();await page.keyboard.press('Escape');
  assert.equal(await page.locator('#map .hot,#map .dim,#map .hpre,#map .hpost').count(),0);
  await box.click();await page.locator('#map').click({position:{x:1,y:1}});
  assert.equal(await page.evaluate(()=>S.mapFocus||!!S.mapHover),false,'El fondo libera el foco');
  // Clic fuera del mapa sobre un título sin acción propia.
  await box.click();await page.locator('#sate-tabs').click({position:{x:2,y:2}});
  assert.equal(await page.evaluate(()=>S.mapFocus||!!S.mapHover),false);
  assert.equal(await page.evaluate(()=>r27box===document.querySelector('#map [data-box]')),true);
  console.log('A: clic, relaciones, cursor, Esc y clic fuera; nodos conservados.');
  await page.evaluate(()=>SATE.ir('horarios'));
  await page.waitForFunction(()=>SATE.actual.pestana==='horarios');
  const chosen=await page.evaluate(()=>{
    limpiarFiltrosD();const c=classes().find(c=>c[0]===S.car&&c[6].length);
    plan().sel=[keyOf(c)];tr().want=[];S.onlyWant=true;S.fit=true;S.expand.clear();
    renderHFilters();renderOffer();renderCal();
    return {key:keyOf(c),name:pretty(name(c))};
  });
  await page.locator('#cal .blk[data-k]:not(.ghost)').first().click();
  const selectedButton=page.locator('[data-toggle]').filter({hasText:'Quitar'}).first();
  await selectedButton.waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>S.fit),true);
  await selectedButton.click();
  assert.equal(await page.evaluate(()=>plan().sel.length),0);
  console.log('B: horario sin Mi plan, filtro activo, clic en bloque y quitar opción.',chosen);
  const second=await page.evaluate(key=>{
    const c=classes().filter(c=>c[0]===S.car&&c[6].length).sort((a,b)=>name(b).length-name(a).length)[0];
    plan().sel=[key];ws().plans.B={sel:[keyOf(c)],own:[{n:'Actividad ficticia',d:[5],a:1080,b:1170}]};
    return pretty(name(c));
  },chosen.key);
  await page.locator('#b-export').click();
  await page.waitForFunction(()=>typeof exportPdfAll==='function');
  assert.deepEqual(await page.evaluate(()=>{
    const ctx=document.createElement('canvas').getContext('2d');
    return ['#ffffff','#231f20','hsl(0 100% 50%)'].map(c=>pdfColor(ctx,c));
  }),[[1,1,1],[35/255,31/255,32/255],[1,0,0]],'Colores PDF completos');
  for(const style of ['color','min'])for(const dark of [false,true])for(const mode of ['single','one','two']){
    const downloadPromise=page.waitForEvent('download');
    const task=page.evaluate(async({style,dark,mode})=>{
      store.set('expStyle',style);store.set('expDark',dark);store.set('expPer',mode==='two'?2:1);
      return mode==='single'?await exportPdf():await exportPdfAll();
    },{style,dark,mode});
    task.catch(()=>{}); // El error se vuelve a lanzar al esperar la tarea, sin rechazo suelto.
    const download=await downloadPromise;await download.saveAs(`${out}/${style}-${dark}-${mode}.pdf`);
    const result=await task;assert.match(result,/^Listo/);console.log('C:',style,dark,mode,result);
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('#exp-x').click();
  await page.evaluate(()=>{renderHFilters();renderOffer();renderCal()});
  const mobileRemove=page.locator('[data-toggle]').filter({hasText:'Quitar'}).first();
  await mobileRemove.scrollIntoViewIfNeeded();
  await page.screenshot({path:out+'/telefono.png'});
  await mobileRemove.click();
  assert.equal(await page.evaluate(()=>plan().sel.length),0,'Se puede quitar en teléfono');
  assert.deepEqual(errors,[],'Sin errores de consola');
  writeFileSync(out+'/expected.json',JSON.stringify({...chosen,second}));
  await context.close();
  }
  for(const unidad of ['upiita','escom'])for(const demo of [false,true]){
    const ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
    if(demo)await ctx.addInitScript(u=>sessionStorage.setItem('ipnt.demo',u),unidad);
    const p=await ctx.newPage();p.setDefaultTimeout(15000);
    p.on('pageerror',e=>errors.push(e.message));
    p.on('console',m=>{
      if(m.type()!=='error')return;
      if(m.location().url.endsWith('/assets/logos/unidades/escom-saes.webp')){
        console.log('Pendiente previo: logo local ESCOM ausente (404).');return;
      }
      errors.push(m.text());
    });
    await p.goto(`http://127.0.0.1:8080/web/dist/sate/index.html#/${unidad}/horarios`);
    await p.waitForFunction(()=>typeof renderOffer==='function');
    // Estas sesiones efímeras no conservan datos; no se prueba aquí la bienvenida de Cuenta.
    await p.evaluate(()=>{IPNT.persistencia(false);document.querySelectorAll('dialog[open]').forEach(d=>d.close())});
    assert.equal(await p.evaluate(()=>isPersonal()),demo);
    await p.evaluate(()=>{
      limpiarFiltrosD();const c=classes().find(c=>c[0]===S.car&&c[6].length);
      plan().sel=[keyOf(c)];tr().want=[];S.onlyWant=true;S.fit=true;
      renderHFilters();renderOffer();renderCal();
    });
    await p.locator('#offer [data-toggle][aria-pressed="true"]').click();
    assert.equal(await p.evaluate(()=>plan().sel.length),0);
    await p.evaluate(()=>SATE.ir('mapa'));
    await p.waitForFunction(()=>!!SATE.modulos.mapa);
    await p.evaluate(()=>{S.mview='mapa';renderTray()});
    await p.locator('#map [data-box]').first().focus();
    await p.keyboard.press('Enter');
    assert.equal(await p.evaluate(()=>S.mapFocus),true);
    await p.keyboard.press('Escape');
    assert.equal(await p.evaluate(()=>S.mapFocus||!!S.mapHover),false);
    assert.deepEqual(errors,[]);
    console.log('Teléfono:',unidad,demo?'perfil DEMO':'sin SAES','foco por teclado, Esc y quitar opción sin errores');
    await ctx.close();
  }
}finally{await browser.close()}
