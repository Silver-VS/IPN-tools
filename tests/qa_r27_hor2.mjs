import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire('D:/Documents/Development/UPIITA_DEV/ipn-folio-wt/r25-folio-aulac/package.json');
const {chromium}=require('playwright');
const phase=process.argv.includes('--antes')?'antes':'despues',out='tests/r27-hor2';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true}),results=[];
writeFileSync(`${out}/playwright.pid`,String(process.pid));
try{
  for(const unit of ['upiita','escom','upibi'])for(const width of [1440,1024,768,375])for(const z of [1,.9,...(width===1440?[1.1]:[])]){
    const ctx=await browser.newContext({serviceWorkers:'block',deviceScaleFactor:z,viewport:{width:Math.round(width/z),height:Math.round(1000/z)}});
    const page=await ctx.newPage(),errors=[];page.setDefaultTimeout(15000);
    console.log('Escenario',unit,width,z);
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text()+' '+m.location().url)});
    await page.goto(`http://127.0.0.1:8080/web/dist/sate/index.html#/${unit}/horarios`);
    await page.waitForFunction(()=>typeof renderOffer==='function');
    await page.evaluate(()=>{IPNT.persistencia(false);document.querySelectorAll('dialog[open]').forEach(d=>d.close())});
    await page.evaluate(()=>document.fonts.ready);
    const metrics=await page.evaluate(()=>{
      const el=document.querySelector('#sate-titulo .sate-siglas'),r=document.createRange();r.selectNodeContents(el);
      return {text:r.getBoundingClientRect().width*devicePixelRatio,overflow:document.documentElement.scrollWidth>innerWidth+1,periods:[...document.querySelectorAll('[data-per]')].map(b=>b.textContent)};
    });
    results.push({unit,width,z,...metrics,errors});
    await page.screenshot({path:`${out}/${phase}-${unit}-${width}-${z}.png`});
    if(phase==='despues'){
      assert.deepEqual(errors,[],`${unit}/${width}/${z}: consola`);
      assert.equal(metrics.overflow,false,`${unit}/${width}/${z}: desbordamiento`);
      assert.equal(await page.locator('#filters #sate-oferta-periodo').count(),1);
      if(width===1440&&z===1){
        const estados=await page.evaluate(()=>{
          const per=Object.keys(CAPACIDADES.ofertaPeriodos).find(k=>CAPACIDADES.ofertaPeriodos[k]==='27/1');
          return ['2026-07-31','2026-10-31','2027-01-25'].map(d=>estadoPeriodoOferta(per,new Date(d+'T12:00:00')).estado);
        });
        assert.deepEqual(estados,['proximo','actual','anterior'],'Fechas antes, después de reinscripción y cambio de semestre');
        assert.ok(metrics.periods.includes('Actual 27/1'));
        assert.ok(!metrics.periods.includes('Actual 26/2'));
        await page.locator('#b-traer-inscrito').click();
        console.log('Abriendo Lector');
        await page.locator('#saes-dlg[open]').waitFor({state:'visible'});
        await page.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
        const inscrito=await page.evaluate(()=>{
          ALUMNO=perfilDemo();
          const c=classes().find(c=>c[0]===S.car&&c[6].length);
          ALUMNO.horario_inscrito=[[c[3],c[8],name(c),'',c[6]]];
          renderPlans();loadInscrito();
          return {n:plan().sel.length,inscrita:plan().inscrita};
        });
        console.log('Horario cargado',inscrito);
        assert.deepEqual(inscrito,{n:1,inscrita:true},'Carga real del horario ficticio');
      }
      await page.evaluate(()=>{S.onlyWant=false;S.tur='M';renderHFilters();renderOffer()});
      await page.locator('[data-d-limpiar]').first().click();
      assert.equal(await page.evaluate(()=>S.tur),'*');
      await page.evaluate(()=>scrollTo(0,500));await page.waitForTimeout(100);
      await page.screenshot({path:`${out}/${phase}-barra-${unit}-${width}-${z}.png`});
      assert.equal(await page.locator('#theme-btn').count(),1);
      await page.locator('.sate-barra-flotante').waitFor({state:'visible'});
      const summary=page.locator('.sate-barra-flotante .sate-menu>summary');
      if(await summary.isVisible())await summary.click();
      await page.screenshot({path:`${out}/${phase}-acciones-${unit}-${width}-${z}.png`});
      for(const selector of ['#theme-btn','#saes-open','#sate-ayuda-recorrido','.ipnt-btn','.sate-opinar']){
        const b=page.locator('.sate-barra-flotante '+selector);
        await b.waitFor({state:'visible'});
        const r=await b.boundingBox();assert.ok(r.x>=0&&r.x+r.width<=Math.round(width/z)+1,'Acción sin cortes: '+selector);
      }
      await page.locator('.sate-barra-flotante #theme-btn').click();
      if(await summary.isVisible())await page.keyboard.press('Escape');
      await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(100);
      assert.equal(await page.locator('.sate-encabezado #theme-btn').count(),1,'Regresa el mismo control al encabezado');
      assert.deepEqual(errors,[],`${unit}/${width}/${z}: interacciones sin errores`);
    }
    await ctx.close();
  }
  if(phase==='despues')for(const unit of ['upiita','escom','upibi']){
    const base=results.find(r=>r.unit===unit&&r.width===1440&&r.z===1).text;
    for(const z of [.9,1.1])assert.ok(Math.abs(results.find(r=>r.unit===unit&&r.width===1440&&r.z===z).text/base-z)<.02,`${unit}: escala ${z}`);
  }
}finally{writeFileSync(`${out}/${phase}.json`,JSON.stringify(results,null,2));await browser.close()}
console.log(phase,results.length,'escenarios');
