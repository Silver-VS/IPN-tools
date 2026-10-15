// Datos compilados y funciones reales de selección, sin navegador ni datos personales.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const leer=p=>readFileSync(p,'utf8');
const core=leer('web/sate/nucleo.js'), mapa=leer('web/sate/mapa.js');
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
let carreras=0, casos=0;
for(const unidad of ['upiita','escom','upibi']){
  const data=JSON.parse(leer(`web/dist/sate/datos/${unidad}/nucleo.json`));
  const oferta=JSON.parse(leer(`web/dist/sate/datos/${unidad}/oferta.json`));
  for(const [car,m] of Object.entries(data.mapas)){
    carreras++;
    const nodos=new Map(), $=id=>{if(!nodos.has(id))nodos.set(id,{hidden:true,innerHTML:'',textContent:''});return nodos.get(id)};
    const estado={done:[],curso:[],oblig:[],want:[]}, S={car,per:'actual',planPaso:0};
    const c=vm.createContext({S,PLAN_DOS_PERIODOS:false,PLAN_PASO:0,PLAN_CACHE:null,
      MAP:()=>m,cur:()=>m.cur,$,esc:s=>String(s),pretty:s=>s,
      SATE:{texto:(k,v={})=>config.textos[k]?.replace(/\{(\w+)\}/g,(_,p)=>v[p]??'')||k},
      offeredClaves:()=>new Set(oferta.periodos[S.per].filter(f=>f[0]===car).map(f=>f[8])),
      classes:()=>oferta.periodos[S.per],profs:g=>g[5].map(i=>oferta.prof[i]).join(' / '),pattern:()=>['Horario de prueba'],
      textoCreditos:(k,cr)=>cr+' créditos',planAsignado:k=>estado.want.includes(k)?0:null,
      statusOf:k=>estado.done.includes(k)?'done':estado.curso.includes(k)?'curso':'pend',tr:()=>estado,
      isPersonal:()=>true,isElec:k=>/^ELECTIVA/i.test(m.cur[k]?.[0]||''),dependents:()=>({}),
      conPlan:f=>f(),conSim:(s,f)=>f(),usaSim:()=>false,planRecordar(){},avisoOptativa(){},saveT(){},
      renderTray(){c.renderSinUbicar()},inspParts:k=>({l2:`Requisitos de ${k}`}),montarAyudasCreditos(){}});
    vm.runInContext(mapa.slice(mapa.indexOf('function renderSinUbicar'),mapa.indexOf('/* Cadena')),c);
    vm.runInContext(core.slice(core.indexOf('function slotFill('),core.indexOf('/* Una sola representación')),c);
    vm.runInContext(core.slice(core.indexOf('function toggleBox('),core.indexOf('/* ---------- eventos')),c);
    for(const per of ['actual','proximo']){
      S.per=per;c.renderSinUbicar();
      const off=c.offeredClaves(), visibles=m.sinUbicar.filter(k=>off.has(k));casos+=visibles.length;
      assert.equal($('#sin-ubicar').hidden,visibles.length===0,`${unidad}/${car}/${per}: visibilidad`);
      const html=$('#sin-ubicar-materias').innerHTML;
      for(const k of visibles){
        assert.match(html,new RegExp(`data-fwant="${k}"`),`${unidad}/${car}/${per}/${k}: selección`);
        assert.ok(html.includes(m.cur[k][0]));
        assert.ok(html.includes(`Requisitos de ${k}`));
        c.toggleBox(k);assert.ok(estado.want.includes(k),`${k}: elegida por toggleBox real`);
        assert.ok($('#sin-ubicar-materias').innerHTML.includes('Quitar de mi plan'));
        c.toggleBox(k);assert.ok(!estado.want.includes(k),`${k}: quitar`);
      }
      for(const b of m.layout?.boxes||[])if(b[4])assert.ok(!m.sinUbicar.includes(b[4]),`${b[4]} ya tiene caja`);
      for(const l of m.lineas)for(const k of l.claves)assert.ok(!m.sinUbicar.includes(k),`${k} ya tiene línea`);
      if(unidad==='upiita'&&car==='B'){
        assert.ok(visibles.includes('B307'),'b307 normalizada y accesible en ambos periodos');
        const fill=c.slotFill(m.layout,new Set(['B307']));
        assert.ok([...fill.values()].some(v=>v.k==='B307'),'slotFill sí admite B307 después de elegirla');
        estado.done=['B307'];c.renderSinUbicar();assert.match($('#sin-ubicar-materias').innerHTML,/data-fwant="B307"[^>]*disabled/);
        c.toggleBox('B307');assert.ok(!estado.want.includes('B307'),'no vuelve a elegir acreditadas');estado.done=[];
      }
    }
    S.per='actual';estado.curso=[...m.sinUbicar];c.renderSinUbicar();
    for(const k of m.sinUbicar)c.toggleBox(k);
    assert.equal(estado.want.length,0,'no selecciona las materias en curso');
  }
}
assert.match(leer('web/sate/cascaron.html'),/<details[^>]*id="sin-ubicar"[^>]*hidden>/,'plegado y oculto al iniciar');
console.log(`OK sin ubicar: ${carreras} carreras/planes, ${casos} casos por periodo; selección, grupos, requisitos y espacios reales.`);
