// Contratos e integración con funciones reales, perfiles ficticios y sin navegador ni red.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const leer=p=>readFileSync(p,'utf8'),fuente=leer('web/sate/horarios.js');
const shell=leer('web/sate/cascaron.html');
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
assert.ok(shell.indexOf('id="mi-semana"')<shell.indexOf('id="gen"'));
assert.match(shell,/id="semana-presupuesto" aria-live="polite"/);
assert.match(shell,/<details id="semana-opciones">[\s\S]*?semana_mas_opciones[\s\S]*?id="semana-secundarios"/);
assert.ok(!shell.includes('data-htexto="semana_borrado_ayuda"'));
assert.equal(config.textos['sate.horarios.semana_privacidad'],'Todo es opcional y se guarda solo en tu navegador o tu nube.');
assert.match(leer('web/sate/nucleo.js'),/IPNT.set\(HU\+k,JSON.stringify\(v\)\)/);
assert.match(leer('tools/cuenta.py'),/SYNC=/);
const bloque=(d,a,b)=>['B','M',1,'DEMO-'+d+'-'+a,0,[],[[d,a,b]],4,'A'];
for(const unidad of ['upiita','escom','upibi'])for(const activa of [true,false]){
  const nodos=new Map(),guardado=new Map(),propios=[],planes={A:{sel:[],own:propios}},S={car:'B',chips:[],gpref:[],gavoid:[],gt:'*',onlyWant:true,ownDays:[],weekend:false};
  const nodo=id=>{if(!nodos.has(id))nodos.set(id,{value:'',hidden:true,checked:false,dataset:{},children:[],eventos:{},
    addEventListener(k,f){this.eventos[k]=f},appendChild(n){this.children.push(n)},insertAdjacentHTML(p,s){this.html=s},
    setCustomValidity(s){this.error=s},reportValidity(){},checkValidity(){return true}});return nodos.get(id)};
  const cfg=structuredClone(config);cfg.unidades[unidad].miSemana=activa;
  let oferta=[bloque(0,540,600)],sel=oferta;
  const c=vm.createContext({window:{SATE_CONFIG:cfg},UNIDAD:unidad,S,$:nodo,document:{querySelectorAll:()=>[]},
    SateUI:{ayuda:clave=>({ayuda:clave})},
    store:{get:(k,d)=>guardado.get(k)??d,set:(k,v)=>guardado.set(k,structuredClone(v))},
    txH:(k,v={})=>(config.textos['sate.horarios.'+k]||k).replace(/\{(\w+)\}/g,(_,k)=>v[k]??''),
    esc:String,DAYS:['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],hm:String,fmtCr:n=>Number(n.toFixed(2)).toString(),
    plan:()=>planes.A,ws:()=>({plans:planes,marks:{}}),selected:()=>sel,classes:()=>oferta,filtered:()=>oferta,
    tr:()=>({want:['A'],oblig:[],done:[],curso:[],fail:[]}),norm:s=>s.toLowerCase(),DATA:{prof:[]},
    keyOf:c=>c[3],cur:()=>({A:['Demo',4,1]}),ownAsClasses:()=>propios.map(o=>({own:true,h:o.d.map(d=>[d,o.a,o.b])})),
    overlaps:(a,b)=>(a.h||a[6]).some(([d,x,y])=>(b.h||b[6]).some(([e,u,v])=>d===e&&x<v&&u<y)),
    optCupo:()=>null,optExceso:()=>({}),nivOpt:()=>null,cargaInfo:()=>null,statusOf:()=>'',MARK:{sug:[]},
    renderCal(){},renderGen(){},refresh(){guardado.set('refresh',true)},renderOwnForm(){},toMin:t=>Number(t.slice(0,2))*60+Number(t.slice(3)),
  });
  vm.runInContext(fuente.slice(fuente.indexOf('const GT='),fuente.indexOf('function renderGTime()')),c);
  vm.runInContext(fuente.slice(fuente.indexOf('function generate()'),fuente.indexOf('function renderGen()')),c);
  vm.runInContext(fuente.slice(fuente.indexOf('function breaksOk('),fuente.indexOf('function renderGPrefs(')),c);
  const ms=vm.runInContext('MS',c),gt=vm.runInContext('GT',c);
  const check=(nombre,fn)=>{try{fn()}catch(e){e.message=`${unidad}, activa=${activa}, ${nombre}: ${e.message}`;throw e}};
  c.montarSemana();
  for(const k of ['trabajo','ida','vuelta','sueno','estudio','antes','dias','comidaA','comidaB','categoria_sueno','categoria_clases','categoria_traslados','categoria_trabajo','categoria_otras','categoria_estudio','categoria_libre'])assert.ok(config.textos['sate.horarios.semana_'+k],k);
  check('formulario',()=>{
    assert.equal(nodo('#mi-semana').hidden,!activa);
    if(activa){assert.equal(nodo('#semana-form').children[0],nodo('#ownform'));
      assert.equal(nodo('#own-a').value,'');assert.equal(nodo('#own-b').value,'');
      for(const k of ['ida','vuelta','antes','dias'])assert.ok(nodo('#semana-principales').innerHTML.includes('data-semana="'+k+'"'));
      for(const k of ['trabajo','sueno','estudio','comidaA','comidaB']){
        assert.ok(nodo('#semana-secundarios').innerHTML.includes('data-semana="'+k+'"'));
        assert.ok(!nodo('#semana-principales').innerHTML.includes('data-semana="'+k+'"'));
      }
      assert.equal(nodo('#ownform summary').children[0].ayuda,'sate.horarios.semana_trabajo_ayuda');
      assert.equal(nodo('#semana-borrar-ayuda').children[0].ayuda,'sate.horarios.semana_borrado_ayuda');
      nodo('#semana-campos').eventos.change({target:{dataset:{semana:'ida'},value:'60',checkValidity:()=>true}});
      assert.equal(guardado.get('miSemana').ida,'60');delete ms.ida;
    }
  });
  if(activa)check('presupuesto condicional y resumen cerrado',()=>{
    sel=[];c.renderSemana();assert.equal(nodo('#semana-presupuesto').hidden,true);
    assert.equal(nodo('#semana-presupuesto').innerHTML,'');
    assert.equal(nodo('#semana-resumen').textContent,'Mi semana');
    ms.dias='2';ms.ida='30';ms.vuelta='30';ms.antes='08:00';
    c.renderSemana();assert.equal(nodo('#semana-presupuesto').hidden,false);
    assert.equal(nodo('#semana-resumen').textContent,'Mi semana · 2 días máx. · traslado 1 h · no antes de 8:00');
    assert.ok(nodo('#semana-presupuesto').innerHTML.includes('Libre: 168 h'));
    assert.ok(!nodo('#semana-presupuesto').innerHTML.includes('Clases: 0 h'));
    assert.ok(!nodo('#semana-presupuesto').innerHTML.includes(config.textos['sate.horarios.semana_supuestos']));
    assert.equal(nodo('#semana-presupuesto-titulo').children.at(-1).ayuda,'sate.horarios.semana_supuestos');
    nodo('#mi-semana').open=true;nodo('#mi-semana').eventos.toggle();
    assert.equal(nodo('#semana-resumen').textContent,'Mi semana');
    nodo('#mi-semana').open=false;nodo('#mi-semana').eventos.toggle();
    assert.ok(nodo('#semana-resumen').textContent.includes('2 días máx.'));
    for(const k of Object.keys(ms))delete ms[k];
    ms.trabajo='0';c.renderSemana();assert.equal(nodo('#semana-presupuesto').hidden,false,'Cero explícito cuenta como dato');
    delete ms.trabajo;ms.sueno='8';c.renderSemana();assert.ok(nodo('#semana-resumen').textContent.includes('sueño 8 h/noche'));
    delete ms.sueno;propios.push({n:'Trabajo ficticio',tipo:'trabajo',d:[0],a:600,b:660});
    c.renderSemana();assert.equal(nodo('#semana-presupuesto').hidden,false);
    assert.ok(nodo('#semana-resumen').textContent.includes('1 bloque'));propios.length=0;
    sel=oferta;c.renderSemana();assert.equal(nodo('#semana-presupuesto').hidden,false,'Grupos elegidos sin preferencias');
    assert.ok(nodo('#semana-presupuesto').innerHTML.includes('Libre: 167 h · Clases: 1 h'));
  });
  check('traslado y trabajo',()=>{
    propios.push({n:'Trabajo ficticio',tipo:'trabajo',d:[0],a:480,b:530});ms.ida='30';
    assert.equal(c.semanaOk(sel),!activa);
    // Trabajo acaba exactamente al comenzar el traslado: límite permitido.
    propios[0].b=510;assert.equal(c.semanaOk(sel),true);propios.length=0;delete ms.ida;
    propios.push({n:'Responsabilidad ficticia',tipo:'otras',d:[0],a:610,b:650});ms.vuelta='30';
    assert.equal(c.semanaOk(sel),!activa);propios.length=0;delete ms.vuelta;
    ms.ida='600';assert.equal(c.semanaOk(sel),!activa);delete ms.ida;
  });
  check('no antes, máximo de días y comida',()=>{
    ms.antes='10:00';assert.equal(c.semanaOk(sel),!activa);delete ms.antes;
    ms.dias='1';assert.equal(c.semanaOk([...sel,bloque(1,540,600)]),!activa);delete ms.dias;
    ms.comidaA='09:30';ms.comidaB='10:30';assert.equal(c.semanaOk(sel),!activa);delete ms.comidaA;delete ms.comidaB;
    ms.comidaA='12:00';ms.comidaB='13:00';propios.push({n:'Trabajo otro día',tipo:'trabajo',d:[6],a:720,b:780});
    assert.equal(c.semanaOk(sel),true,'Comida se reserva en días con clases');propios.length=0;delete ms.comidaA;delete ms.comidaB;
  });
  check('formulario reutiliza ownDays y own',()=>{
    vm.runInContext(fuente.slice(fuente.indexOf("$('#own-f').addEventListener"),fuente.indexOf("$('#b-saeshor').addEventListener")),c);
    S.ownDays=[0,2];nodo('#own-n').value='Trabajo ficticio';nodo('#own-a').value='09:00';nodo('#own-b').value='12:00';nodo('#semana-tipo').value='trabajo';
    nodo('#own-f').eventos.submit({preventDefault(){}});
    assert.equal(propios.length,1);assert.equal(propios[0].a,540);assert.equal(propios[0].b,720);
    assert.equal(propios[0].d.join(','),'0,2');assert.equal(propios[0].tipo,activa?'trabajo':undefined);propios.length=0;
  });
  check('presupuesto excluyente y bloques anteriores',()=>{
    propios.push({n:'Anterior',d:[0],a:540,b:660},{n:'Trabajo',tipo:'trabajo',d:[0],a:600,b:630});
    ms.sueno='8';ms.estudio='10';ms.trabajo='100';
    const p=c.presupuestoSemana(sel);assert.ok(Math.abs(p.horas.clases-1)<1e-9);
    assert.ok(Math.abs(p.horas.trabajo-.5)<1e-9);assert.ok(Math.abs(p.horas.otras-.5)<1e-9);
    assert.ok(Math.abs(Object.values(p.horas).reduce((a,b)=>a+b,0)-168)<1e-8);
    propios.length=0;ms.trabajo='120';
    const exceso=c.presupuestoSemana(sel);assert.equal(exceso.exceso>0,activa);
    if(activa){assert.equal(exceso.horas.libre,0);assert.ok(Math.abs(exceso.total-187)<1e-9)}
    if(activa){c.renderSemana();assert.ok(nodo('#semana-presupuesto').innerHTML.includes('Tu semana rebasa 168 h'));
      assert.ok(nodo('#semana-presupuesto').innerHTML.includes('role="img"'));assert.ok(nodo('#semana-presupuesto').innerHTML.includes('aria-label='))}
    for(const k of Object.keys(ms))delete ms[k];
    ms.ida='30';ms.vuelta='60';propios.push({n:'SAES ficticio',saes:true,d:[2],a:540,b:600});
    const viaje=c.presupuestoSemana(sel);assert.ok(Math.abs(viaje.horas.clases-2)<1e-9);
    assert.ok(Math.abs(viaje.horas.traslados-(activa?3:0))<1e-9);
    propios.length=0;for(const k of Object.keys(ms))delete ms[k];
  });
  check('los tres modos del generador',()=>{
    // Banco: dos materias; los grupos del lunes incumplen trabajo y los del martes sí caben.
    const a=bloque(0,540,600),b=bloque(1,600,660),otra=bloque(1,660,720),tercera=bloque(1,720,780);otra[8]='B';otra[4]=1;tercera[8]='C';tercera[4]=2;
    oferta=[a,b,otra,tercera];for(const o of oferta)o[7]=12;
    c.tr=()=>({want:['A','B','C'],oblig:[],done:[],curso:[],fail:[]});c.cur=()=>({A:['Demo',12,1],B:['Otra',12,1],C:['Tercera',12,1]});
    propios.push({n:'Trabajo',tipo:'trabajo',d:[0],a:480,b:530});ms.ida='30';ms.antes='09:30';ms.dias='1';
    for(const modo of ['','1','auto']){gt.n=modo;const g=c.generate();assert.ok(g.top.length,`Sin resultados en ${modo}`);
      for(const o of g.top){assert.equal(c.semanaOk(o.cs),true);if(activa)assert.ok(o.cs.every(x=>x[6].every(b=>b[0]===1)))}
    }
    ms.ida='60';assert.equal(c.semanaPena([b]),activa?12:0);
    propios.length=0;for(const k of Object.keys(ms))delete ms[k];
  });
  if(activa)check('borrado conserva anteriores y SAES',()=>{
    propios.push({n:'Anterior',d:[0],a:400,b:450},{n:'SAES ficticio',saes:true,d:[1],a:500,b:560},{n:'Nuevo',tipo:'otras',d:[2],a:600,b:660});
    ms.sueno='8';nodo('#semana-borrar').eventos.click();assert.equal(planes.A.own.length,2);assert.equal(Object.keys(ms).length,0);
    assert.deepEqual(guardado.get('miSemana'),{});
  });
  console.log(`${unidad}, miSemana=${activa}: formulario, guardado/borrado, traslado, trabajo, entrada, días, comida, tres modos y presupuesto. OK.`);
}
