// Contratos de datos y presentación reales en Node, sin navegador ni red.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const leer=f=>readFileSync(f,'utf8');
const config=JSON.parse(leer('web/dist/sate/index.html').match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const explicacion=config.textos['sate.creditos.ayuda'];
const palabras=explicacion.replace(/<[^>]+>/g,'').trim().split(/\s+/).length;
assert.ok(palabras>=80&&palabras<=120,`${palabras} palabras en la ayuda`);
assert.doesNotMatch(explicacion,/PENDIENTE/);
assert.match(explicacion,/Fuente:.*https:\/\/doi.org\/10.22201\/iisue.20072872e.2011.4.40/);
const oficiales=JSON.parse(leer('data/creditos_oficiales.json')).unidades;
let convertidas=0,secundarios=0;
for(const unidad of ['upiita','escom','upibi']){
  const datos=JSON.parse(leer(`web/dist/sate/datos/${unidad}/nucleo.json`));
  const fuente=JSON.parse(leer(unidad==='upiita'?'data/mapa_curricular_saes.json':`data/unidades/${unidad}/mapa_curricular_saes.json`));
  for(const [car,mapa] of Object.entries(datos.mapas)){
    for(const [k,v] of Object.entries(mapa.cur)){
      assert.equal(v[4].cr,v[1],`${unidad}/${car}/${k}: escala principal`);
      const op=datos.opciones_plan?.[car];
      const fila=fuente.rows.find(r=>r[0]===(op?.carrera||car)&&r[3].toUpperCase()===k&&(!op||r[1]===op.plan));
      if(!fila)continue;
      const [c,p,,,,,cr,ht,hp]=fila;
      const sem=(+ht>10||+hp>10)&&+cr>0&&Math.abs(+cr-(2*ht+ +hp))>.001;
      if(sem){
        assert.equal(v[4].cr_calculado,true,`${unidad}/${car}/${k}: conversión`);
        assert.equal(v[1],(2*ht+ +hp)/18);
        assert.equal(v[4].satca,+cr);convertidas++;
      }else assert.equal(v[1],+cr,`${unidad}/${car}/${k}: SAES conservado`);
      const oficial=oficiales[unidad]?.[`${c}/${p}`]?.materias[k];
      if(!sem&&oficial?.satca!=null){assert.equal(v[4].satca,oficial.satca);secundarios++;}
    }
  }
  const oferta=JSON.parse(leer(`web/dist/sate/datos/${unidad}/oferta.json`));
  for(const filas of Object.values(oferta.periodos))for(const f of filas){
    const v=datos.mapas[f[0]]?.cur[f[8]];
    if(v)assert.equal(f[7],v[1],`${unidad}/${f[0]}/${f[8]}: oferta y mapa en la misma escala`);
  }
}
const upiita=JSON.parse(leer('web/dist/sate/datos/upiita/nucleo.json'));
assert.equal(upiita.mapas.B.cur.B101[1],7.5);
assert.equal(upiita.mapas.B.cur.B101[4].satca,4.76);
const escom=JSON.parse(leer('web/dist/sate/datos/escom/nucleo.json'));
const texto=(k,v={})=>config.textos[k].replace(/\{(\w+)\}/g,(_,p)=>v[p]??'{'+p+'}');
const llamadas=[],nodos=[{dataset:{ayudaCreditos:'calculado'},appendChild(n){llamadas.push(n)}}];
const c=vm.createContext({SATE:{texto},cur:()=>({...upiita.mapas.B.cur,...escom.mapas.C_09.cur}),
  document:{querySelectorAll:()=>nodos},SateUI:{ayuda:(clave,vars)=>({clave,vars})}});
const nucleo=leer('web/dist/sate/nucleo.js');
vm.runInContext(nucleo.slice(nucleo.indexOf('const fmtCr='),nucleo.indexOf('/* ---------- perfil IPN-tools')),c);
assert.equal(vm.runInContext("textoCreditos('B101',7.5,true)",c),'7.5 créditos (SATCA: 4.76)');
assert.match(vm.runInContext("textoCreditos('C101',6,true)",c),/^≈ 6 créditos \(SATCA: 4.39\)$/);
assert.match(vm.runInContext("ayudaCreditos('C101')",c),/data-ayuda-creditos="calculado"/);
vm.runInContext('montarAyudasCreditos();montarAyudasCreditos()',c);
assert.equal(llamadas.length,1,'Montaje idempotente de la ayuda existente');
assert.equal(llamadas[0].clave,'sate.creditos.contexto');
assert.match(llamadas[0].vars.escala,/Créditos TEPIC, la escala que usa el SAES/);
assert.match(llamadas[0].vars.escala,/cálculo a partir de las horas del SAES/);
for(const archivo of ['nucleo.js','mapa.js','horarios.js','desempeno.js'])
  assert.match(leer('web/dist/sate/'+archivo),/ayudaCreditos|montarAyudasCreditos/,archivo);
console.log(`${convertidas} materias convertidas; ${secundarios} SATCA oficiales; datos, oferta, rótulos y ayudas verificados.`);
