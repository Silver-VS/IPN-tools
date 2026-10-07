/* Presentación de las reglas del núcleo. No detecta causales nuevas de dictamen. */
(function () {
  const tx=(k,v)=>SATE.texto('sate.situacion.'+k,v);
  const el=(tag,texto,clase)=>{const n=document.createElement(tag);if(texto!=null)n.textContent=texto;if(clase)n.className=clase;return n};
  const fecha=x=>new Date(x+'T00:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'long'});
  function detalle(tarjeta) {
    const cuerpo=el('div');
    cuerpo.appendChild(el('p',tarjeta.cuerpo));
    cuerpo.appendChild(el('p',tarjeta.detalle));
    SateUI.modal(tx('que_hacer'),cuerpo,{acciones:[{texto:tx(tarjeta.id==='actualizacion'?'usar_lector':'ventanilla'),primaria:true,onclick:()=>tarjeta.id==='actualizacion'?SAES.open():SATE.ir('tramites/'+tarjeta.tramite)}]});
  }
  function calendario() {
    if(!calItems()){SateUI.modal(tx('calendario'),tx('calendario_sin_aviso'),{acciones:[{texto:SATE.texto('sate.pestana.calendario.titulo'),onclick:()=>SATE.ir('calendario')}]});return}
    const cuerpo=el('div',null,'cal cal-completo');
    SateUI.modal(tx('calendario'),cuerpo,{acciones:[{texto:SATE.texto('sate.pestana.calendario.titulo'),onclick:()=>SATE.ir('calendario')},{texto:tx('reinscripcion'),onclick:()=>SATE.ir('tramites/reinscripcion')}]});
    // El mismo render y selección se usan en Ventanilla; no se copia el calendario.
    drawCals();
  }
  function desfase() {
    SateUI.modal(tx('como_desfase'),tx('explicacion_desfase'),{acciones:[{texto:tx('entendido')}]});
  }
  function tarjetas(d,R) {
    const A=ALUMNO, rd=d.rd, lista=[];
    const add=(id,estado,titulo,cuerpo,detalle,trámite)=>lista.push({id,estado,titulo,cuerpo,detalle,tramite:trámite});
    if(d.nDes) {
      const tipos=Object.values(rd?.por||{}), dict=tipos.some(x=>x!=='oficio');
      add('desfase',rd?.ok?'aviso':'error',tx(rd?.ok?'recursar':rd?.n?'desfase_dictamen':'revisar_desfase'),
        rd?.ok?tx('recursar_cuerpo',{fecha:fecha(rd.R.fecha),cr:fmtCr(rd.tope)}):tx('desfase_cuerpo',{n:d.nDes}),
        rd?.n&&!rd.ok?tx(dict?'dictamen_detalle':'limite_detalle',{n:rd.R.maxDesfasadas}):tx('desfase_detalle'),rd?.n&&!rd.ok?'dictamen':'reinscripcion');
    } else add('desfase',d.fis.some(f=>f.estado==='riesgo')?'aviso':'ok',tx(d.fis.some(f=>f.estado==='riesgo')?'plazo_titulo':'desfase'),
      tx(d.fis.some(f=>f.estado==='riesgo')?'plazo_proximo':A.reprobadas_periodo==null?'sin_confirmar':'sin_desfase'),tx('desfase_detalle'),'reinscripcion');
    if(d.adeudos.length) add('adeudos','aviso',tx('adeudos'),tx('adeudos_cuerpo',{n:d.adeudos.length,cr:fmtCr(d.ret)}),tx('adeudos_detalle'),'ets');
    const ets=R?.items.find(a=>a.para==='adeudo'&&!a.pasada);
    if(d.adeudos.length) add('ets',ets?'aviso':'info',tx('ets'),ets?tx('ets_fecha',{actividad:ets.titulo,fecha:fecha(ets.hasta||ets.desde)}):tx('ets_sin_aviso'),tx('ets_detalle'),'ets');
    add('cita',d.nDes?'aviso':'info',tx('reinscripcion'),
      A.cita?.inicio?tx(citaPasada(A)?'cita_vencida':'cita',{fecha:A.cita.inicio}):tx('sin_cita'),tx('cita_detalle'),'reinscripcion');
    add('carga','info',tx('carga'),d.aut==null?tx('carga_sin_dato'):tx('carga_cuerpo',{cr:fmtCr(d.aut),ret:fmtCr(d.ret)}),tx('carga_detalle'),'reinscripcion');
    const actualizar=avisoActualizar(A);
    if(actualizar)add('actualizacion','aviso',tx('actualizar'),actualizar,tx('actualizar_detalle'),'reinscripcion');
    // Prioridad explícita y estable: la primera tarjeta en el DOM es la más grave, también a 375 px.
    const prioridad={error:0,aviso:1,info:2,ok:3};
    return lista.sort((a,b)=>prioridad[a.estado]-prioridad[b.estado]);
  }
  function azulejos(d) {
    const rejilla=el('div',null,'situacion-cifras'), A=ALUMNO;
    function tile(clave,valor) {const n=el('div',null,'situacion-cifra');n.appendChild(el('span',tx(clave)));n.appendChild(el('b',valor));rejilla.appendChild(n);return n}
    const creditos=tile('creditos',tx('creditos_valor',{obt:d.D.obt==null?'—':fmtCr(d.D.obt),total:d.D.total?fmtCr(d.D.total):'—'}));
    if(d.D.obt!=null&&d.D.total>0){const b=el('progress');b.max=d.D.total;b.value=d.D.obt;b.setAttribute('aria-label',tx('creditos'));creditos.appendChild(b)}
    const promedio=tile('promedio',A.promedio??'—');
    const v=(A.acreditadas||[]).map(x=>+x?.[1]).filter(x=>Number.isFinite(x)&&x>=6&&x<=10);
    const ayuda=el('button',tx('ayuda_promedio'),'sate-enlace');
    ayuda.onclick=()=>SateUI.modal(tx('promedio'),tx('promedio_detalle',{promedio:v.length?(v.reduce((s,x)=>s+x,0)/v.length).toFixed(2):'—'}),{pequeno:true});promedio.appendChild(ayuda);
    const periodo=tile('periodo',perName(d.meta));periodo.appendChild(el('small',d.aut==null?tx('carga_sin_dato'):tx('autorizada',{cr:fmtCr(d.aut)})));
    const des=tile('desfase',d.nDes?tx('materias',{n:d.nDes}):tx(A.reprobadas_periodo==null?'sin_confirmar':'ninguno'));
    const b=el('button',tx('como_desfase'),'sate-enlace');b.onclick=desfase;des.appendChild(b);
    return rejilla;
  }
  function pendientes(d) {
    if(!d.adeudos.length)return null;
    const seccion=el('section'), h=el('h3',tx('pendientes')), ul=el('ul',null,'situacion-materias');seccion.appendChild(h);seccion.appendChild(ul);
    d.adeudos.forEach(k=>{
      const f=d.fis.find(f=>f.k===k), tipo=d.rd?.por[k];
      const li=el('li');li.appendChild(el('span',pretty(cur()[k][0])));
      li.appendChild(el('span',tx(!f||f.estado==='desfasada'?'materia_desfasada':'materia_reprobada'),'situacion-pill'));
      const b=el('button',tx('opciones'),'sate-enlace');
      b.setAttribute('aria-label',tx('opciones_materia',{materia:pretty(cur()[k][0])}));
      b.onclick=()=>SateUI.modal(pretty(cur()[k][0]),tx(f?.curso?'opcion_recurse':tipo==='agotada'?'opcion_agotada':tipo==='dictamen'?'opcion_dictamen':f?.estado==='desfasada'?'opcion_desfasada':f?.limite!=null?'opcion_plazo':'opcion_actualizar',{periodo:perName(f?.limite)}),{pequeno:true});
      li.appendChild(b);ul.appendChild(li);
    });return seccion;
  }
  function mostrar() {
    const box=document.getElementById('sate-situacion');box.replaceChildren();
    const planear=el('button',SATE.texto('sate.planeacion.titulo'),'sate-enlace');planear.type='button';planear.onclick=()=>SATE.ir('mapa');box.appendChild(planear);
    if(!isPersonal()) {
      box.appendChild(SateUI.aviso({estado:'info',titulo:tx('sin_datos'),cuerpo:tx('lector_invitacion'),accion:{texto:tx('usar_lector'),onclick:()=>SAES.open()}}));
      const demo=el('button',tx('probar_demo'),'sate-btn');demo.type='button';demo.setAttribute('data-demo-open','');box.appendChild(demo);return;
    }
    const d=situacionDatos();renderCalendario(d.rd,d.nDes);
    const R=calItems(), lista=tarjetas(d,R);
    const chips=lista.filter(x=>!['adeudos','carga','actualizacion'].includes(x.id)).map(x=>({id:x.id,estado:x.estado,texto:x.titulo,abre:()=>detalle(x)}));
    const prox=SATE.calendario.proximos(Infinity).find(a=>(a.categoria!=='gestion'||R)&&(!a.para||CALAP?.[a.para]));
    chips.push({id:'calendario',estado:'info',texto:tx('lo_que_sigue'),abre:calendario});
    box.appendChild(SateUI.chips(chips));
    box.appendChild(SateUI.avisos(lista.map(x=>({...x,accion:{texto:tx('que_hacer'),onclick:()=>detalle(x)}}))));
    box.appendChild(azulejos(d));
    const siguiente=SateUI.aviso({estado:'info',titulo:tx('lo_que_sigue'),cuerpo:prox?tx('siguiente',{actividad:prox.titulo,fecha:fecha(prox.desde)}):tx('calendario_sin_aviso'),accion:{texto:tx('calendario'),onclick:calendario}});
    // En escritorio, hover muestra el mismo calendario en un globo con cierre por Esc.
    const ayuda=SateUI.ayuda('sate.situacion.calendario_globo',{calendario:calendarioResumen(R)});siguiente.appendChild(ayuda);
    siguiente.addEventListener('mouseenter',()=>ayuda.dispatchEvent(new Event('mouseenter')));
    siguiente.addEventListener('mouseleave',()=>ayuda.dispatchEvent(new Event('mouseleave')));
    box.appendChild(siguiente);
    const mats=pendientes(d);if(mats)box.appendChild(mats);
    const f=new Date(ALUMNO.leido);box.appendChild(el('p',tx('fuente',{fecha:isNaN(f)?'—':f.toLocaleDateString('es-MX',{dateStyle:'medium'})}),'situacion-fuente'));
    const actualizar=el('button',tx('actualizar'),'sate-enlace');actualizar.onclick=()=>SAES.open();box.appendChild(actualizar);
  }
  function calendarioResumen(R) {
    if(!R)return esc(tx('calendario_sin_aviso'));
    return R.items.map(a=>`${esc(fecha(a.desde))}${a.hasta?' / '+esc(fecha(a.hasta)):''}: ${esc(a.titulo)}. ${esc(a.texto)}`).join('<br>')+'<br>'+esc(tx('calendario_fuente',{fuente:R.C.fuente||'—'}));
  }
  SATE.pestana('situacion',{montar(){},mostrar,ocultar(){SateUI.cerrarModal()}});
})();
