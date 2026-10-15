/* Solo acepta la ventana que abrió la receptora y el SAES configurado para su unidad. */
(()=>{
  const C=window.IPNCupos,cfg=window.CUPOS_CONFIG,u=(window.SATE_UNIDAD||new URL(location.href).searchParams.get('unidad')),conf=cfg.unidades[u];
  const tx=(k,v)=>C.texto(cfg.textos,k,v),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const resumen=document.getElementById('cupos-resumen'),estado=document.getElementById('cupos-nube');
  const enSaes=new URL(location.href).searchParams.get('modo')==='saes';
  document.getElementById('cupos-dejar').textContent=tx(enSaes?'detalle_unico':'dejar_abierta');
  document.title=tx('titulo');
  if(!window.SATE)SateUI.usarTextos((k,v)=>cfg.textos[k]||k);
  if(!conf){resumen.textContent=tx('error_seleccion');return}
  window.IPNT_UNIDAD=u;
  const origen=new URL(conf.saes).origin,clave=conf.prefijo+'cupos';
  const canal=typeof BroadcastChannel==='function'?new BroadcastChannel('ipnt-cupos'):null;
  let datos=null,conectado=false,cola=Promise.resolve();
  let hasta=0,notificacion=false,avisos=0,contexto={grupos:[],oferta:[]},audio=null,catalogo=null;
  const controles=document.getElementById('cupos-controles'),tabla=document.getElementById('cupos-tabla');
  controles.innerHTML=['carrera','plan'].map(k=>`<label>${esc(tx(k))} <select data-r="${k}"></select></label>`).join('')+
    `<button data-r="consultar">${esc(tx('consultar'))}</button><label>${esc(tx('filtro'))} <input type="search" data-r="filtro"></label><label>${esc(tx('orden'))} <select data-r="orden"><option value="desc">${esc(tx('orden_mas'))}</option><option value="asc">${esc(tx('orden_menos'))}</option></select></label>`;
  // Barra de configuración: avisos (sonido, notificación) y consulta automática con su intervalo (mínimo 1 min).
  const avisosControles=document.getElementById('cupos-avisos-controles'),INTERVALOS=[1,2,5,10],ventanaAuto=30*60000;
  const interruptor=(k,texto,extra='')=>`<label class="cupos-interruptor"><input type="checkbox" role="switch" data-r="${k}"${extra}><span class="cupos-interruptor-pista" aria-hidden="true"></span><span>${esc(texto)}</span></label>`;
  avisosControles.innerHTML=`<div class="cupos-config-grupo">${interruptor('sonido',tx('sonido'))}${interruptor('notificacion',tx('notificacion'),' checked')}</div><div class="cupos-config-grupo">${interruptor('auto',tx('auto_consulta'))}<select data-r="intervalo" aria-label="${esc(tx('intervalo_aria'))}" disabled>${INTERVALOS.map(n=>`<option value="${n}"${n===5?' selected':''}>${esc(tx('cada_n',{n}))}</option>`).join('')}</select></div>`;
  const elementos=Object.fromEntries([...['carrera','plan','consultar','filtro','orden'].map(k=>[k,controles.querySelector('[data-r="'+k+'"]')]),...['sonido','notificacion','auto','intervalo'].map(k=>[k,avisosControles.querySelector('[data-r="'+k+'"]')])]);
  const el=k=>elementos[k];
  for(const b of controles.querySelectorAll?.('button')||[])b.className='btn';
  for(const k of ['carrera','plan','consultar'])el(k).disabled=enSaes;
  el('filtro').oninput=pintar;el('orden').onchange=pintar;
  const consultarAhora=()=>window.opener?.postMessage({tipo:'ipnt.cupos.consultar',v:1,carrera:el('carrera').value,plan:el('plan').value},origen);
  el('consultar').onclick=consultarAhora;
  el('carrera').onchange=()=>{el('plan').innerHTML=''};
  el('notificacion').onchange=()=>{notificacion=el('notificacion').checked;permiso()};
  el('sonido').onchange=()=>{try{const Audio=window.AudioContext||window.webkitAudioContext;if(el('sonido').checked&&Audio){audio=audio||new Audio();audio.resume().catch(e=>console.warn('SATE Cupos: audio suspendido',e))}}catch(e){console.warn('SATE Cupos: audio no disponible',e)}};
  function sonar(){if(document.hidden||!el('sonido').checked||!audio||audio.state!=='running')return;try{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.frequency.value=660;g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.2)}catch(e){console.warn('SATE Cupos: sonido fallido',e)}}
  // Consulta automática: usa el mismo mensaje que la consulta manual; el marcador sigue limitando a 15 s entre consultas.
  // No cambia la lectura del SAES ni el marcador. Dura 30 min (como la del marcador) y se detiene sola.
  const claveAjustes=conf.prefijo+'cuposAjustes',ultimaEl=document.getElementById('cupos-ultima'),autoEl=document.getElementById('cupos-auto-estado');
  let proximaAuto=0,finAuto=0,textoAuto=null,minutoPintado=-1,terminoAuto=false;
  try{const g=JSON.parse((window.IPNT?.almacen||localStorage).getItem(claveAjustes));if(INTERVALOS.includes(g?.minutos))el('intervalo').value=String(g.minutos)}catch(e){}
  const minutos=()=>INTERVALOS.includes(+el('intervalo').value)?+el('intervalo').value:5;
  function guardarAjustes(){try{IPNT.set(claveAjustes,JSON.stringify({minutos:minutos()}))}catch(e){console.warn('SATE Cupos: ajustes no guardados',e)}}
  function pintarAuto(){
    const on=el('auto').checked;el('auto').disabled=enSaes;el('intervalo').disabled=enSaes||!on;
    const t=enSaes?tx('auto_en_saes'):on?(!conectado||!window.opener?tx('auto_sin_conexion'):document.hidden?tx('auto_pausa'):tx('auto_activa_cada',{n:minutos()})):terminoAuto?tx('auto_fin'):'';
    if(autoEl&&t!==textoAuto){textoAuto=t;autoEl.textContent=t}
  }
  function pintarEstado(){
    if(!ultimaEl)return;
    if(!datos){ultimaEl.textContent=tx('esperando');ultimaEl.className='';return}
    const vieja=C.antigua(datos),n=Math.max(0,Math.floor((Date.now()-Date.parse(datos.hora))/60000));
    ultimaEl.className=vieja?'cupos-antigua':'';
    ultimaEl.textContent=tx('ultima_hace',{hora:C.fecha(datos),n})+(vieja?' · '+tx('antigua')+'. '+tx('antigua_aviso'):'');
  }
  el('auto').onchange=()=>{terminoAuto=false;if(el('auto').checked){finAuto=Date.now()+ventanaAuto;proximaAuto=Date.now()+minutos()*60000}pintarAuto()};
  el('intervalo').onchange=()=>{proximaAuto=Date.now()+minutos()*60000;guardarAjustes();pintarAuto()};
  function pulsoAuto(){
    if(el('auto').checked&&Date.now()>=finAuto){el('auto').checked=false;terminoAuto=true}
    else if(el('auto').checked&&!document.hidden&&conectado&&window.opener&&!enSaes&&Date.now()>=proximaAuto&&el('carrera').value&&el('plan').value){proximaAuto=Date.now()+minutos()*60000;consultarAhora()}
    pintarAuto();
    const minuto=Math.floor(Date.now()/60000);if(minuto!==minutoPintado){minutoPintado=minuto;pintarEstado()}
  }
  setInterval(pulsoAuto,1000);
  const permitir=document.getElementById('cupos-permitir'),aviso=document.getElementById('cupos-aviso');
  permitir.textContent=tx('permitir');
  function permiso(){const p=typeof Notification==='function'?Notification.permission:'denied';
    permitir.hidden=!notificacion||Date.now()>=hasta||p!=='default';
    if(notificacion&&p!=='default'){aviso.textContent=tx(p==='granted'?'permiso_listo':'permiso_panel');window.opener?.postMessage({tipo:'ipnt.cupos.permiso',v:1,permiso:p},origen)}
  }
  permitir.onclick=async()=>{if(!notificacion||Date.now()>=hasta)return;try{if(typeof Notification==='function')await Notification.requestPermission();permiso()}
    catch(e){console.warn('SATE Cupos: permiso de notificación fallido',e);aviso.textContent=tx('permiso_panel')}};
  function alertar(antes,d){if(Date.now()>=hasta)return;let ctx;
    try{ctx=JSON.parse((window.IPNT?.almacen||localStorage).getItem(conf.prefijo+'cuposContexto'))}catch(e){}
    if(!ctx||ctx.carrera!==d.carrera||ctx.plan&&ctx.plan!==d.plan||!Array.isArray(ctx.grupos))return;
    const cambios=C.cambios(antes,d,ctx.grupos);if(!cambios.length)return;
    sonar();
    try{window.navigator?.vibrate?.([150,80,150])}catch(e){}
    avisos+=cambios.length;document.title=tx('titulo_avisos',{n:avisos});aviso.textContent=cambios.map(f=>tx('aviso',{...f,n:f.disponibles})).join(' · ');
    if(!notificacion||typeof Notification!=='function'||Notification.permission!=='granted')return;
    for(const f of cambios)C.notificar(tx('titulo'),{body:tx('aviso',{...f,n:f.disponibles}),tag:u+'|'+C.clave(f)});
  }
  function pintar(){
    resumen.textContent=datos?tx('ultima',{hora:C.fecha(datos)})+' · '+tx(conectado?'conectado_saes':'consulta_local'):tx('esperando');
    pintarEstado();pintarAuto();
    if(!datos)return;
    const coincide=contexto.carrera===datos.carrera&&(!contexto.plan||contexto.plan===datos.plan);
    const oferta=coincide&&contexto.oferta?.length?contexto.oferta:ofertaPublica(),grupos=coincide?contexto.grupos||[]:[];
    const info=f=>[...oferta,...grupos].find(o=>C.clave(o)===C.clave(f))||f,disponible=f=>tx('lugares',{n:f.disponibles});
    const boton=f=>`<button data-grupo="${esc(C.clave(f))}">${esc(info(f).nombre||f.materia)} · ${esc(f.grupo)}</button>`;
    window.SateCuposVista?.pintar();
    const q=(el('filtro').value||'').toLocaleLowerCase(),esPropio=f=>grupos.some(g=>C.clave(g)===C.clave(f));
    const filas=datos.filas.filter(f=>!q||(f.grupo+' '+f.materia+' '+(info(f).nombre||'')+' '+(info(f).profesor||'')).toLocaleLowerCase().includes(q)).sort((a,b)=>el('orden').value==='asc'?a.disponibles-b.disponibles:b.disponibles-a.disponibles);
    // Medidor por fila: barra de lugares ocupados, lugares libres y «n de m ocupados».
    const medidor=f=>{const cupo=+f.cupo,ocupados=+f.inscritos,pct=cupo>0?Math.min(100,Math.max(0,Math.round(ocupados/cupo*100))):0;
      return `<div class="cupos-medidor cupos-m-${f.disponibles===0?'lleno':C.pocos(f.disponibles)?'poco':'ok'}"><span class="cupos-medidor-t">${esc(disponible(f))}</span><span class="cupos-pista" aria-hidden="true"><i style="width:${pct}%"></i></span><span class="cupos-medidor-d">${esc(tx('ocupados',{inscritos:f.inscritos,cupo:f.cupo}))}</span></div>`};
    tabla.innerHTML=`<table><caption>${esc(tx('todos'))}</caption><thead><tr>${['grupo','materia','nivel','profesor','horario','disponibles'].map(k=>`<th scope="col">${esc(tx(k))}</th>`).join('')}</tr></thead><tbody>${filas.map(f=>`<tr class="${esPropio(f)?'elegido':''}"><th scope="row">${esc(f.grupo)}${esPropio(f)?' · '+esc(tx('tu_grupo')):''}</th><td>${boton(f)}</td><td>${esc(f.nivel||'')}</td><td>${esc(info(f).profesor||tx('sin_dato'))}</td><td>${esc(info(f).horario||tx('sin_horas'))}</td><td>${medidor(f)}</td></tr>`).join('')}</tbody></table>`;
  }
  function detalle(e){const b=e.target.closest?.('[data-grupo]');if(!b||!datos)return;const f=datos.filas.find(f=>C.clave(f)===b.dataset.grupo)||(contexto.grupos||[]).find(f=>C.clave(f)===b.dataset.grupo);if(!f)return;const coincide=contexto.carrera===datos.carrera&&(!contexto.plan||contexto.plan===datos.plan),o=[...(coincide?contexto.oferta||[]:[]),...(coincide?contexto.grupos||[]:[]),...ofertaPublica()].find(o=>C.clave(o)===C.clave(f))||f;SateUI.modal(tx('detalle'),[o.nombre||f.materia,f.grupo,tx('profesor')+': '+(o.profesor||tx('sin_dato')),tx('horario')+': '+(o.horario||tx('sin_horas')),Number.isInteger(f.disponibles)?tx('lugares',{n:f.disponibles}):tx('sin_dato')].join(' · '))}
  function ofertaPublica(){
    if(!catalogo||!datos)return [];
    const car=Object.entries(catalogo.opciones_plan||{}).find(([,c])=>c.carrera===datos.carrera&&(!c.plan||c.plan===datos.plan))?.[0]||datos.carrera;
    const hora=n=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0'),dias=tx('dias').split('|');
    return (catalogo.periodos[contexto.periodo||'actual']||[]).filter(c=>c[0]===car).map(c=>({grupo:c[3],materia:c[8],nombre:catalogo.asig[c[4]],profesor:c[5].map(i=>catalogo.prof[i]).join(' / '),horas:c[6],horario:c[6].map(([d,a,b])=>dias[d]+' '+hora(a)+'–'+hora(b)).join(' · ')}));
  }
  async function cargarOferta(){try{const partes=await Promise.all(['nucleo','oferta'].map(async nombre=>{const r=await fetch('datos/'+u+'/'+nombre+'.json');if(!r.ok)throw new Error(nombre+': HTTP '+r.status);return r.json()}));catalogo=Object.assign({},...partes);pintar()}catch(e){console.warn('SATE Cupos: oferta publicada no disponible',{unidad:u,error:e.message});estado.textContent=tx('error_oferta')}}
  tabla.onclick=detalle;
  function guardar(d){if(!C.validar(d)||d.unidad!==u)return false;const nueva=C.reciente(datos,d);if(nueva===datos)return false;
    datos=C.limpiar(nueva);if(window.SateCuposVista)CUPOS.recibir(datos);IPNT.set(clave,JSON.stringify(datos));canal?.postMessage({tipo:'consulta',unidad:u,datos});pintar();return true}
  function seleccion(){let ctx;try{ctx=JSON.parse((window.IPNT?.almacen||localStorage).getItem(conf.prefijo+'cuposContexto'))}catch(e){}
    if(!ctx){let perfil;try{if(!window.SateCuposVista?.revision)perfil=JSON.parse((window.IPNT?.almacen||localStorage).getItem('saes.alumno'))}catch(e){}ctx={grupos:[],oferta:[],...(perfil?.unidad===u?{carrera:perfil.carrera,plan:perfil.plan}:{})}}
    contexto=ctx;pintar();if(!conectado||!window.opener)return;window.opener.postMessage({tipo:'ipnt.cupos.seleccion',v:1,...ctx},origen)}
  async function sincronizar(){if(window.SateCuposVista?.revision||!IPNT.cuenta||IPNT.proveedor!=='ms')return;
    try{const d=await IPNT.cupos(u);guardar(d);if(datos&&C.reciente(d,datos)===datos)await IPNT.cupos(u,datos);estado.textContent=tx('nube_guardada')}
    catch(e){console.warn('SATE Cupos: sincronización OneDrive fallida',{unidad:u,error:e.message});estado.textContent=tx('error_nube')}}
  function nube(){cola=cola.then(sincronizar);return cola}
  window.addEventListener('message',e=>{
    if(!C.origenSaes(e.origin)||e.origin!==origen||e.source!==window.opener)return;
    const d=e.data;if(d?.unidad!==u)return;
    if(d.tipo==='ipnt.cupos.hola'){conectado=true;pintar();window.opener.postMessage({tipo:'ipnt.cupos.hola',v:1},origen);seleccion()}
    else if(d.tipo==='ipnt.cupos.avisos'&&d.v===1&&Number.isFinite(d.hasta)&&typeof d.notificacion==='boolean'){
      hasta=Math.min(d.hasta,Date.now()+30*60000);notificacion=d.notificacion&&el('notificacion').checked;permiso()}
    else if(d.tipo==='ipnt.cupos.opciones'&&d.v===1&&d.opciones){for(const k of ['carrera','plan']){const opciones=d.opciones[k];if(!Array.isArray(opciones)||opciones.length>200||!opciones.every(o=>typeof o.valor==='string'&&typeof o.texto==='string'))continue;el(k).innerHTML=opciones.map(o=>`<option value="${esc(o.valor)}">${esc(o.texto)}</option>`).join('');el(k).value=opciones.find(o=>o.elegido)?.valor||opciones[0]?.valor||''}}
    else if(d.tipo==='ipnt.cupos.ritmo'&&d.v===1&&Number.isInteger(d.n)&&d.n>=0&&d.n<=15){el('consultar').textContent=tx(d.n?'cuenta':'consultar',{n:d.n});el('consultar').disabled=enSaes||d.busy===true||d.n>0}
    else if(C.validar(d)){conectado=true;const antes=datos;if(guardar(d))alertar(antes,d);seleccion();nube()}
  });
  window.addEventListener('storage',e=>{if(e.key===conf.prefijo+'cuposContexto')seleccion();if(e.key===clave){try{guardar(JSON.parse(e.newValue))}catch(err){}}});
  window.addEventListener('ipnt-sincronizado',nube);
  window.addEventListener('sate-cupos-seleccion',seleccion);
  window.addEventListener('ipnt-cuenta',nube);
  if(canal)canal.onmessage=e=>{if(e.data?.unidad!==u)return;if(e.data.tipo==='contexto'){if(e.data.contexto)IPNT.set(conf.prefijo+'cuposContexto',JSON.stringify(e.data.contexto));seleccion()}else if(e.data.tipo==='consulta'&&e.data.datos)guardar(e.data.datos)};
  try{guardar(JSON.parse((window.IPNT?.almacen||localStorage).getItem(clave)))}catch(e){}
  seleccion();pintar();nube();if(!window.SATE)cargarOferta();
})();
