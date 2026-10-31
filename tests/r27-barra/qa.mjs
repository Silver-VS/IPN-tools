import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire('D:/Documents/Development/UPIITA_DEV/ipn-folio-wt/r25-folio-aulac/package.json');
const {chromium}=require('playwright');
const fase=process.argv.includes('--antes')?'antes':'despues',dir='tests/r27-barra';
mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true}),resultados=[];
try{
  for(const width of [1440,1024,768,375]){
    const page=await browser.newPage({viewport:{width,height:1000}}),errores=[];
    page.on('pageerror',e=>errores.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errores.push(m.text())});
    await page.goto('http://127.0.0.1:8080/web/dist/sate/index.html#/upiita/horarios');
    await page.waitForFunction(()=>typeof renderOffer==='function');
    await page.evaluate(()=>{IPNT.persistencia(false);document.querySelectorAll('dialog[open]').forEach(d=>d.close())});
    await page.evaluate(()=>scrollTo(0,700));
    const barra=page.locator('.sate-barra-flotante');
    await barra.waitFor({state:'visible'});
    const metricas=await page.evaluate(()=>{
      const box=s=>{const e=document.querySelector(s),r=e?.getBoundingClientRect();return r?{x:r.x,right:r.right,width:r.width,display:getComputedStyle(e).display}:null};
      const b=box('.sate-barra-flotante'),tabs=box('.sate-barra-flotante .sate-pestanas'),menu=box('.sate-barra-flotante .sate-menu'),marca=box('.sate-barra-marca');
      return {barra:b,tabs,menu,marca,paddingRight:parseFloat(getComputedStyle(document.querySelector('.sate-barra-flotante')).paddingRight),scrollWidth:document.documentElement.scrollWidth,innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1};
    });
    await page.screenshot({path:`${dir}/${fase}-${width}.png`});
    if(fase==='despues'){
      console.log(width,JSON.stringify(metricas));
      assert.deepEqual(errores,[],`${width}px: errores de consola`);
      assert.equal(metricas.overflow,false,`${width}px: desbordamiento horizontal`);
      if(width>=768){
        assert.ok(metricas.tabs.x>=metricas.barra.x-1&&metricas.tabs.x<metricas.menu.x,`${width}px: pestañas en el lado izquierdo`);
        assert.ok(Math.abs(metricas.menu.right-(metricas.barra.right-metricas.paddingRight))<2,`${width}px: controles alineados a la derecha`);
      }else assert.ok(Math.abs(metricas.menu.right-(metricas.barra.right-metricas.paddingRight))<2,'375px: menú de controles alineado a la derecha');
    }
    resultados.push({width,...metricas,errores});await page.close();
  }
}finally{writeFileSync(`${dir}/${fase}.json`,JSON.stringify(resultados,null,2));await browser.close()}
