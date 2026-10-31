// Playwright R27: servidor desde la raíz; dependencias existentes, sin instalación.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
const require=createRequire('D:/Documents/Development/UPIITA_DEV/ipn-folio-wt/r25-folio-aulac/package.json');
const {chromium}=require('playwright');
const out='web/dist/qa-r27-act';mkdirSync(out,{recursive:true});
let scripts=0;
for(const dir of ['web/dist','web/dist/sate'])for(const file of readdirSync(dir).filter(f=>f.endsWith('.html'))){
  for(const [,attrs,src] of readFileSync(dir+'/'+file,'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    if(/\bsrc=|\btype=["'](?:application\/ld\+json|application\/json|module)/i.test(attrs))continue;
    new Function(src);scripts++;
  }
}
const catalogo=JSON.parse(readFileSync('data/actividades.json','utf8'));
const perfil=JSON.parse(readFileSync('data/perfiles-prueba/primer-ingreso-bionica.json','utf8'));
const browser=await chromium.launch({headless:true});
const resultados=[];
try {
  for(const unidad of ['upiita','escom','upibi'])for(const width of [1440,768,375])for(const conPerfil of [false,true]){
    const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:1000},
      colorScheme:conPerfil?'dark':'light',
      ...(conPerfil?{storageState:{cookies:[],origins:[{origin:'http://127.0.0.1:8080',localStorage:[
        {name:'saes.alumno',value:JSON.stringify({...perfil,unidad})}]}]}}:{})});
    const page=await context.newPage(),errores=[];page.setDefaultTimeout(15000);
    page.on('pageerror',e=>errores.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errores.push(m.text()+' '+m.location().url)});
    await page.goto(`http://127.0.0.1:8080/web/dist/sate/index.html#/${unidad}/guia/actividades`);
    await page.locator('.act-rueda svg').waitFor();
    await page.evaluate(()=>{globalThis.IPNT?.persistencia(false);document.querySelectorAll('dialog[open]').forEach(d=>d.close())});
    await page.evaluate(()=>document.fonts.ready);
    const esperadas=catalogo.secciones.filter(s=>s.items.some(a=>['IPN','DAES',unidad.toUpperCase()].includes(a.unidad)))
      .map(s=>s.items.filter(a=>['IPN','DAES',unidad.toUpperCase()].includes(a.unidad)));
    const sectores=page.locator('.act-sector');
    assert.equal(await sectores.count(),6);
    const medir=()=>page.locator('.act-rueda').evaluate(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y+scrollY,width:r.width,height:r.height}});
    const original=await medir();let total=0,alturas=[];
    // La selección real del SVG cubre hover, clic y teclado sin desplazar la página.
    for(let i=0;i<6;i++){
      await page.evaluate(i=>document.querySelectorAll('.act-sector')[i].focus({preventScroll:true}),i);
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('.act-ficha').count(),esperadas[i].length,`${unidad}/${width}/${i}`);
      assert.deepEqual(await page.locator('.act-ficha h3').allTextContents(),esperadas[i].map(a=>a.nombre));
      for(const [j,a] of esperadas[i].entries()){
        const card=page.locator('.act-ficha').nth(j);
        assert.equal(await card.locator('a').getAttribute('href'),a.url);
        const oficial=await card.locator('[data-oficial]').allTextContents();
        assert.ok(oficial.includes(a.nombre));
        for(const k of ['descripcion','requisitos','horario','lugar','contacto']){
          if(a[k]==='no_verificado')assert.ok((await card.textContent()).includes('Por confirmar con el área'));
          else assert.ok(oficial.includes(a[k]),k);
        }
        if(a.estado==='no_verificado')assert.ok((await card.textContent()).includes('Por confirmar con el área'));
      }
      assert.deepEqual(await medir(),original,'La rueda no cambia de posición ni tamaño al crecer el panel');
      alturas.push((await page.locator('.act-panel').boundingBox()).height);total+=esperadas[i].length;
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Sin desbordamiento horizontal');
    }
    assert.ok(Math.max(...alturas)>Math.min(...alturas)+100,'El panel sí cambia de altura');
    assert.equal(total,unidad==='escom'?28:27);
    // Filtro persistente, incluidos los estados vacíos.
    await page.locator('#actividades-unidad').selectOption(unidad.toUpperCase());
    assert.equal(await page.locator('.act-ficha').count(),esperadas[5].length);
    await page.evaluate(()=>document.querySelector('.act-sector').focus({preventScroll:true}));
    assert.equal(await page.locator('.act-ficha').count(),0);
    assert.deepEqual(await medir(),original);
    await page.locator('#actividades-unidad').selectOption('');
    await page.keyboard.press('Home');
    await sectores.nth(0).focus();await page.keyboard.press('ArrowRight');
    assert.equal(await sectores.nth(1).getAttribute('aria-pressed'),'true');
    await sectores.nth(0).hover();
    assert.equal(await sectores.nth(0).getAttribute('aria-pressed'),'true');
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:`${out}/${unidad}-${width}-${conPerfil?'perfil-oscuro':'vacio-claro'}.png`,fullPage:true});
    if(!conPerfil)await page.screenshot({path:`${out}/${unidad}-${width}-ventana.png`});
    assert.deepEqual(errores,[],'Sin errores de consola');
    resultados.push({unidad,width,conPerfil,total,alturas,rueda:original,errores});
    console.log('OK',unidad,width,conPerfil?'perfil/oscuro':'vacío/claro',total,'elementos; rueda estable; filtro y teclado; consola limpia');
    await context.close();
  }
} finally {
  await browser.close();
  writeFileSync(`${out}/resultados.json`,JSON.stringify({scripts,resultados},null,2));
}
