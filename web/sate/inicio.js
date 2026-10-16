/* Los módulos clásicos comparten los globales históricos. Cambiar de unidad recarga
   el mismo punto de entrada para no mezclar estado ni registrar eventos dos veces. */
(function () {
  const config = SATE_CONFIG.unidades, cargas = new Map(), modulos = {}, montados = new Set();
  // Pestañas en rediseño: se ocultan en todas las unidades desde data/sate.json (pestanasOcultas).
  const oculta = t => (SATE_CONFIG.pestanasOcultas || []).includes(t);
  for (const c of Object.values(config)) { c.pestanas = c.pestanas.filter(t => !oculta(t)); c.grupos = (c.grupos || []).map(g => g.filter(t => !oculta(t))).filter(g => g.length); }
  const cascaron = document.querySelector('html[data-pestanas]');
  const variante = new URLSearchParams(location.search).get('pestanas');
  if (cascaron && ['v1','v3'].includes(variante)) cascaron.setAttribute('data-pestanas', variante);
  let api, actual, tabs, barra, version = 0, recalcularPestanas=()=>{}, seleccionProgramada=false, temariosListos=null;
  const leer = k => { try { return window.IPNT?.almacen?IPNT.almacen.getItem(k):((typeof sessionStorage!=='undefined'?sessionStorage.getItem(k):null)??localStorage.getItem(k)); } catch { return null; } };
  const parametros = new URLSearchParams(location.search), entrada = parametros.get('sateEntrada') === '1';
  const cuposReducida = parametros.get('vista') === 'cupos' || /\/cupos(?:\?|$)/.test(location.hash);
  if(cuposReducida) document.documentElement.dataset.vista='cupos';
  let alumnoUnidad;
  try { alumnoUnidad = JSON.parse(leer('saes.alumno'))?.unidad; } catch {}
  const recordada = leer('ipnt.unidad');
  const solicitada = entrada ? null : location.hash.match(/^#\/([a-z0-9-]+)\//)?.[1] || parametros.getAll('sateUnidad').at(-1) || (cuposReducida?parametros.get('unidad'):null) || alumnoUnidad || recordada;
  if (solicitada && /^[a-z0-9-]+$/.test(solicitada) && !config[solicitada]) {
    const identidad = SATE_CONFIG.identidadUnidades?.[solicitada] || Object.values(SATE_CONFIG.identidadUnidades || {}).find(c=>c.alias?.includes(solicitada));
    const siglas = identidad?.siglas || solicitada.toUpperCase();
    config[solicitada] = {generica:true,siglas,nombre:identidad?.nombre || siglas,realce:identidad?.realce,logoUnidad:identidad?.logo,saes:'https://saes.'+solicitada+'.ipn.mx/',
      pestanas:['trayectoria','mapa','calendario','guia'].filter(t=>!oculta(t)),grupos:[['trayectoria'],['mapa','calendario','guia'].filter(t=>!oculta(t))],tramites:[]};
  }
  const inicial = entrada ? null : SateRutas.ruta(location.hash, solicitada, config);
  const unidad = inicial?.unidad || solicitada;
  window.SATE_UNIDAD = config[unidad] ? unidad : null;
  const u = window.SATE_UNIDAD, cfg = config[u];
  let unidadRealce = u;
  const raiz = document.documentElement, temaSistema = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : { matches: false, addEventListener() {} };
  function colorHalo(id) {
    const tema = raiz.getAttribute('data-theme') || raiz.getAttribute('data-tema');
    const oscuro = tema ? tema === 'dark' || tema === 'oscuro' : temaSistema.matches;
    const realce = config[id]?.realce || SATE_CONFIG.identidadUnidades?.[id]?.realce;
    return realce?.[oscuro ? 'oscuro' : 'claro'] || 'var(--sate-acento-base)';
  }
  function aplicarRealce(id = unidadRealce) {
    unidadRealce = id;
    const tema = raiz.getAttribute('data-theme') || raiz.getAttribute('data-tema');
    const oscuro = tema ? tema === 'dark' || tema === 'oscuro' : temaSistema.matches;
    const realce = (config[id]?.realce || SATE_CONFIG.identidadUnidades?.[id]?.realce)?.[oscuro ? 'oscuro' : 'claro'];
    // Elegir el mayor contraste evita texto blanco ilegible sobre los realces claros del tema oscuro.
    const luminancia = hex => hex.slice(1).match(/../g).map(h => parseInt(h,16)/255)
      .map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4)
      .reduce((s,c,i) => s+c*[.2126,.7152,.0722][i],0);
    const l = realce ? luminancia(realce) : null, negro = luminancia('#18181b');
    raiz.style.setProperty('--sate-realce', realce || 'var(--sate-acento-base)');
    raiz.style.setProperty('--sate-sobre-realce', realce ? (1.05/(l+.05) >= (l+.05)/(negro+.05) ? '#ffffff' : '#18181b') : 'var(--sate-sobre-base)');
    for (const halo of document.querySelectorAll('.sate-logo-halo')) halo.style.setProperty('--halo', colorHalo(halo.dataset.unidad));
  }
  aplicarRealce();
  if (typeof MutationObserver === 'function') new MutationObserver(() => aplicarRealce()).observe(raiz, {attributes:true,attributeFilter:['data-theme','data-tema']});
  temaSistema.addEventListener('change', () => aplicarRealce());
  // plurales ICU mínimos del TOML: {n, plural, one {# materia} other {# materias}} (un nivel, «#» = el número)
  const reglaPlural = new Intl.PluralRules('es-MX'), numero = new Intl.NumberFormat('es-MX');
  const plurales = (s, vars) => s.replace(/\{(\w+),\s*plural,\s*((?:[^{}]*\{[^{}]*\})+)\s*\}/g, (m, k, cuerpo) => {
    const n = Number(vars[k]); if (Number.isNaN(n)) return m;
    const op = {}; cuerpo.replace(/(=?\w+)\s*\{([^{}]*)\}/g, (_, c, t) => { op[c] = t; });
    return (op['=' + n] ?? op[reglaPlural.select(n)] ?? op.other ?? '').replace(/#/g, numero.format(n));
  });
  const texto = (clave, vars = {}) => plurales(SATE_CONFIG.textos[clave] || clave, vars).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '{' + k + '}');
  SateUI.usarTextos(texto);
  function error(e) {
    console.error('SATE: carga fallida', {unidad:u, ruta:location.hash, mensaje:e.message, pila:e.stack});
    const p = document.getElementById('sate-carga'); p.hidden = false; p.textContent = 'No se pudo cargar la vista. Recarga la página. ' + e.message;
  }
  function script(src) {
    if (!cargas.has(src)) cargas.set(src, new Promise((ok, no) => {
      const s = document.createElement('script'); s.src = src;
      if(/^https?:/.test(src)){
        const integridad={};
        if(!integridad[src]){cargas.delete(src);no(new Error('Biblioteca externa sin integridad: '+src));return}
        s.integrity=integridad[src];s.crossOrigin='anonymous';
      }
      s.onload = () => { window.SateMedicion?.instrumentar(); ok(); }; s.onerror = () => { cargas.delete(src); no(new Error('Archivo: ' + src)); };
      document.head.appendChild(s);
    }));
    return cargas.get(src);
  }
  async function json(nombre) {
    const url = 'datos/' + u + '/' + nombre + '.json', r = await fetch(url);
    if (!r.ok) throw new Error(url + ': HTTP ' + r.status);
    return r.json();
  }
  let oferta;
  function cargarOferta() {
    return oferta ||= json('oferta').then(d => {
      Object.assign(window.SATE_DATA, d);
      if (api) api.ofertaLista();
    }).catch(e => { oferta = null; throw e; });
  }
  async function modulo(id) {
    if (cfg.generica && !['calendario','guia','temarios'].includes(id)) return modulos[id];
    if (id === 'trayectoria') await script('desempeno.js');
    if (id === 'calendario') await script('calendario.js');
    if (id === 'horarios' && cfg.cupos) { await script('cupos.js'); await script('cupos-vista.js'); }
    if (id === 'mapa' || id === 'horarios') await script(id + '.js');
    if (id === 'guia') await Promise.all([script('bibliotecas.js'), script('guia.js')]);
    if (id === 'temarios') await Promise.all([script('bibliotecas.js'), script('temarios.js')]);
    if (id === 'tramites' && !cargas.has('tramites.json')) {
      cargas.set('tramites.json',json('tramites').then(d=>Object.assign(window.SATE_DATA,d)).catch(e=>{cargas.delete('tramites.json');throw e}));
    }
    if (id === 'tramites') {
      await cargas.get('tramites.json'); await script('tramites.js');
      for (const tramite of cfg.tramites) {
        if (tramite === 'electivas') await script('../tramites/electivas-reglas.js');
        await script(cfg.scriptsTramite?.[tramite] || tramite + '.js');
      }
    }
    if (!modulos[id]) throw new Error('Módulo sin registrar: ' + id);
    return modulos[id];
  }
  // Los temarios son una vista con ruta propia (data/sate.json: vistas); sin datos en la unidad, esta carga no existe.
  function cargarTemarios() {
    if (!cfg.vistas?.some(v => v.id === 'temarios')) return null;
    return temariosListos ||= Promise.all([script('bibliotecas.js'), script('temarios.js')])
      .then(() => SATE.temarios.preparar()).catch(e => { temariosListos = null; console.debug('SATE: temarios no disponibles', e.message); });
  }
  function ir(id) { location.hash = '#/' + u + '/' + id; }
  function adaptarPestanas() {
    const contenedor = document.getElementById('sate-tabs'), navegacion = contenedor?.closest?.('.sate-navegacion');
    const controles = navegacion?.querySelector('.sate-controles') || document.querySelector?.('header.top>.sate-controles');
    // La navegación sigue funcionando en un contenedor sin medición responsiva.
    if (!navegacion || !controles) return;
    const medicion = document.createElement('div');
    medicion.className = 'sate-medicion'; medicion.setAttribute('aria-hidden','true'); medicion.inert = true;
    navegacion.appendChild(medicion);
    let pendiente = false;
    function calcular() {
      pendiente = false;
      // La copia conserva la tipografía y los grupos, sin depender del escalón visible.
      // Todas las etiquetas se miden en negrita para que cambiar de pestaña no cambie el escalón.
      const copia = tabs.cloneNode(true), carrera = controles.cloneNode(true);
      for (const nodo of [copia, carrera, ...copia.querySelectorAll('[id]'), ...carrera.querySelectorAll('[id]')]) nodo.removeAttribute('id');
      medicion.replaceChildren(copia, carrera);
      copia.dataset.escalon = 'completo';
      const completo = Math.max(copia.scrollWidth + copia.offsetWidth - copia.clientWidth, Math.ceil(copia.getBoundingClientRect().width));
      copia.dataset.escalon = 'corto';
      const corto = Math.max(copia.scrollWidth + copia.offsetWidth - copia.clientWidth, Math.ceil(copia.getBoundingClientRect().width));
      const estilo = getComputedStyle(navegacion);
      const disponible = navegacion.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
      const enFila = completo + carrera.getBoundingClientRect().width + (parseFloat(estilo.columnGap) || 0) <= disponible;
      const escalon = completo <= disponible ? 'completo' : corto <= disponible ? 'corto' : 'flotante';
      const separado = !enFila;
      const foco = document.activeElement;
      if (navegacion.dataset.controlesSeparados !== String(separado)) navegacion.dataset.controlesSeparados = String(separado);
      if (tabs.dataset.escalon !== escalon) tabs.dataset.escalon = escalon;
      document.body.classList.toggle('sate-flotante', escalon === 'flotante');
      // Si el cambio oculta el botón enfocado, conservar el foco en la navegación equivalente.
      if (escalon === 'flotante' && tabs.contains(foco)) (barra.querySelector('[data-id="'+foco.dataset.id+'"]') || barra.querySelector('[data-id="mas"]')).focus();
      else if (escalon !== 'flotante' && !(typeof matchMedia === 'function' && matchMedia('(max-width:639px)').matches) && barra.contains(foco)) tabs.querySelector('[data-id="'+(foco.dataset.id==='mas' ? (actual?.padre || actual?.pestana) : foco.dataset.id)+'"]').focus();
    }
    function programar() { if (!pendiente) { pendiente = true; requestAnimationFrame(calcular); } }
    recalcularPestanas=programar;
    new ResizeObserver(programar).observe(navegacion);
    // La bandeja puede envolver o cambiar con la selección: reservar su alto real.
    const bandeja=document.querySelector?.('.plan-bandeja');
    if(bandeja)new ResizeObserver(()=>{
      document.documentElement.style.setProperty('--sate-plan-alto',Math.ceil(bandeja.getBoundingClientRect().height)+'px');
    }).observe(bandeja);
    new MutationObserver(programar).observe(tabs, {childList:true,subtree:true,characterData:true});
    new MutationObserver(programar).observe(document.documentElement, {attributes:true,attributeFilter:['lang','class','style','data-pestanas']});
    if (document.fonts) { document.fonts.ready.then(programar); document.fonts.addEventListener('loadingdone',programar); }
    addEventListener('resize',programar);
    programar();
  }
  function logoUnidad(id, nombre) {
    const halo = document.createElement('span'); halo.className = 'sate-logo-halo'; halo.dataset.unidad = id;
    halo.style.setProperty('--halo', colorHalo(id));
    const img = document.createElement('img'); img.className = 'sate-logo-unidad';
    img.src = '../assets/logos/unidades/' + (SATE_CONFIG.identidadUnidades?.[id]?.logo || config[id]?.logoUnidad || 'ipn') + '.webp';
    img.alt = nombre; img.onerror = () => { halo.hidden = true; img.hidden = true; };
    halo.appendChild(img);
    return halo;
  }
  function elegirUnidad() {
    const caja = document.createElement('div');
    const boton = document.createElement('button'); boton.type='button'; boton.className='btn'; boton.textContent=texto('sate.entrada.cambiar');
    // La entrada explícita conserva el perfil y la preferencia hasta elegir otra unidad.
    boton.onclick=()=>{location.href='index.html?sateEntrada=1'};
    caja.appendChild(boton);
    SateUI.modal(texto('sate.encabezado.unidad'), caja);
  }
  async function mostrarEntrada() {
    // La cuenta y el Lector deben estar listos antes de habilitar la selección y el pegado.
    await script('generico.js');
    document.body.setAttribute('data-sate-entrada','true');
    document.getElementById('b-unidad').hidden=true;
    for (const selector of ['.sate-navegacion','.sate-fila-avisos','.bar-top']) document.querySelector(selector).hidden=true;
    document.getElementById('sate-carga').hidden=true;
    const panel=document.getElementById('sate-entrada'); panel.hidden=false;
    const titulo=document.createElement('h2'); titulo.id='sate-entrada-titulo'; titulo.textContent=texto('sate.entrada.titulo');
    const alternativa=document.createElement('button'); alternativa.type='button'; alternativa.className='btn primary';
    alternativa.textContent=texto('sate.entrada.saes'); alternativa.setAttribute('data-saes-open','');
    const etiqueta=document.createElement('label'); etiqueta.htmlFor='sate-unidad-buscar'; etiqueta.textContent=texto('sate.entrada.buscar');
    const buscar=document.createElement('input'); buscar.type='search'; buscar.id=etiqueta.htmlFor; buscar.autocomplete='off';
    const lista=document.createElement('ul'); lista.className='sate-unidades'; lista.id='sate-unidades'; buscar.setAttribute('aria-controls',lista.id);
    const estado=document.createElement('p'); estado.className='muted'; estado.setAttribute('role','status');
    const normal=s=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
    const unidades=Object.entries(SATE_CONFIG.identidadUnidades).sort(([a,ca],[b,cb])=>Number(!!config[b])-Number(!!config[a])||ca.siglas.localeCompare(cb.siglas,'es'));
    const filas=unidades.map(([id,c])=>{
      const fila=document.createElement('li'), boton=document.createElement('button'); boton.type='button'; boton.className='btn sate-selector-unidad';
      boton.dataset.unidad=id;
      const nombres=document.createElement('span'), siglas=document.createElement('strong'), nombre=document.createElement('span');
      siglas.textContent=c.siglas; nombre.textContent=c.nombre; nombres.appendChild(siglas); nombres.appendChild(nombre);
      const logo=logoUnidad(id,c.nombre); logo.querySelector('img').alt='';
      boton.style.setProperty('--halo',colorHalo(id));
      boton.appendChild(logo); boton.appendChild(nombres);
      boton.onclick=()=>{IPNT.set('ipnt.unidad',id);location.href='index.html?sateUnidad='+id};
      fila.appendChild(boton); lista.appendChild(fila); return {fila,terminos:normal(c.siglas+' '+c.nombre)};
    });
    buscar.addEventListener('input',()=>{
      let n=0; for(const {fila,terminos} of filas){fila.hidden=!terminos.includes(normal(buscar.value.trim()));if(!fila.hidden)n++}
      estado.textContent=texto(n?'sate.entrada.resultados':'sate.entrada.sin_resultados',{n});
    });
    panel.replaceChildren(titulo,alternativa,etiqueta,buscar,estado,lista);
  }
  async function activar(r) {
    if (!r || !api) return;
    const medida = window.SateMedicion?.iniciar('ruta', r.pestana);
    try {
    if (unidadRealce || r.unidad !== u) aplicarRealce(r.unidad);
    if (r.unidad !== u) { IPNT.set('ipnt.unidad', r.unidad); location.reload(); return; }
    const v = ++version;
    // El mapa y sus sugeridas necesitan los grupos; no pintar una copia parcial de la oferta.
    if (!cfg.generica && (r.pestana === 'mapa' || r.pestana === 'horarios')) await cargarOferta();
    const m = await modulo(r.pestana);
    if (r.pestana === 'tramites' && r.tramite === 'electivas') await SateElectivas.preparar();
    if (v !== version) return;
    if (actual) modulos[actual.pestana]?.ocultar?.();
    actual = r;
    if (location.hash.startsWith('#/') && location.hash !== r.hash) history.replaceState(null,'',location.pathname+location.search+r.hash);
    api.estado.tab = r.pestana === 'horarios' ? 'hor' : 'tray';
    if (!montados.has(r.pestana)) { m.montar?.(); montados.add(r.pestana); }
    const marca = r.vista ? r.padre : r.pestana;   // una vista marca la pestaña de la que cuelga
    seleccionProgramada = true; tabs.seleccionar(marca); seleccionProgramada = false; barra.marcar(marca);
    document.getElementById('v-tray').hidden = r.pestana !== 'mapa';
    document.getElementById('sate-trayectoria').hidden = r.pestana !== 'trayectoria';
    document.getElementById('sate-calendario').hidden = r.pestana !== 'calendario';
    document.getElementById('v-hor').hidden = r.pestana !== 'horarios';
    document.getElementById('sate-tramites').hidden = r.pestana !== 'tramites';
    document.getElementById('sate-temarios').hidden = r.pestana !== 'temarios';
    document.getElementById('sate-guia').hidden = r.pestana !== 'guia';
    const panel = document.getElementById(r.pestana === 'guia' ? 'sate-guia' : r.pestana === 'horarios' ? 'v-hor' : r.pestana === 'tramites' ? 'sate-tramites' : r.pestana === 'temarios' ? 'sate-temarios' : r.pestana === 'trayectoria' ? 'sate-trayectoria' : r.pestana === 'calendario' ? 'sate-calendario' : 'v-tray');
    panel.setAttribute('role','tabpanel');
    panel.setAttribute('aria-labelledby',tabs.querySelector('[data-id="'+marca+'"]').id);
    api.store.set('ruta', r.hash);
    document.getElementById('sate-carga').hidden = true;
    repintar();
    } finally { window.SateMedicion?.terminar(medida); }
  }
  function repintar() {
    if (!actual) return;
    if (!cfg.generica && window.SATE_DATA.mapas[api.estado.car]?.generico && !['horarios','calendario','temarios','guia'].includes(actual.pestana)) { ir('horarios'); return; }
    api.renderTop(); api.renderAviso(); SATE.presente.avisos();
    const m = window.SateMedicion;
    if (m) m.render(actual.pestana, () => modulos[actual.pestana].mostrar(actual));
    else modulos[actual.pestana].mostrar(actual);
    SATE.calendario?.pintarRecorte(actual.pestana);
    document.body.setAttribute('data-sate-pestana',actual.pestana);
    document.getElementById('sate-oferta-periodo').hidden=cfg.generica||actual.pestana!=='horarios';
    document.getElementById('notice').hidden=cfg.generica||actual.pestana!=='horarios';
    document.getElementById('mobnote').hidden=true;
  }
  async function iniciarRecorrido() {
    try { await script('recorrido.js'); await SateRecorrido.iniciar(); }
    catch(e) { console.error('SATE: recorrido fallido',{mensaje:e.message,pila:e.stack}); SateUI.modal(texto('sate.recorrido.boton'),texto('sate.recorrido.error'),{pequeno:true}); }
  }
  function invitarRecorrido() {
    const a=SATE.alumno?.();
    if(cuposReducida || !a || a.demo || !SateUI.recorridoOfrecer(leer))return;
    const caja=document.querySelector('header.top');
    if(document.getElementById('sate-recorrido-invitacion'))return;
    const aviso=document.createElement('div');aviso.className='sate-recorrido-invitacion';
    aviso.id='sate-recorrido-invitacion';
    for(const [clave,acepta] of [['si',true],['ahora_no',false]]){
      const b=document.createElement('button');b.type='button';b.className='sate-btn';b.textContent=acepta?texto('sate.recorrido.invitacion_breve'):'×';
      if(!acepta)b.setAttribute('aria-label',texto('sate.recorrido.'+clave));
      b.onclick=()=>{SateUI.recorridoDecidir((k,v)=>IPNT.set(k,v),acepta);aviso.remove();if(acepta)iniciarRecorrido()};aviso.appendChild(b);
    }
    // Fuera del encabezado: los repintados de avisos conservan la decisión pendiente.
    caja.after(aviso);
  }
  window.SATE = {texto, modulos, error, script, identidadSaes, cargarTemarios, get actual(){return actual}, get almacen(){return api?.store}, pestana(id, m) { modulos[id] = m; }, ir, elegirUnidad, repintar, cargarOferta,
    async visitar(id) { const r=SateRutas.ruta('#/'+u+'/'+id,u,config);if(!r)return;history.replaceState(null,'',location.pathname+location.search+r.hash);await activar(r); },
    articulo: async (doc, n) => { await script('guia.js'); return SATE.articulo(doc, n); },
    async nucleoListo(a) {
      api = a; if (!cfg.generica) await script('situacion.js'); SateUI.usarAlmacen({leer,guardar:(k,v)=>IPNT.set(k,v)});
      const r = SateRutas.ruta((cuposReducida||location.hash==='#cupos')&&cfg.cupos?'#/'+u+'/horarios':location.hash, u, config) ||
        SateRutas.ruta('#/' + u + '/' + (api.personal() && cfg.pestanas.includes('trayectoria') ? 'trayectoria' : 'mapa'), u, config);
      actualizarPestanas(r.vista ? r.padre : r.pestana);
      adaptarPestanas();
      addEventListener('hashchange',()=>{const r=SateRutas.ruta(location.hash,u,config);if(r)activar(r).catch(error)});
      // Un hash ajeno pertenece a cuenta/tema/demo: nunca se reemplaza por una ruta SATE.
      if (!location.hash) history.replaceState(null,'',location.pathname+location.search+r.hash);
      await activar(r);
      const recorrido=document.createElement('button');recorrido.type='button';recorrido.className='sate-btn';recorrido.textContent=texto('sate.recorrido.boton');recorrido.onclick=()=>{SateUI.recorridoDecidir((k,v)=>IPNT.set(k,v),true);document.getElementById('sate-recorrido-invitacion')?.remove();iniciarRecorrido()};
      document.getElementById('foot').appendChild(recorrido);
      invitarRecorrido();addEventListener('sate-saes-actualizado',invitarRecorrido);
      if(cuposReducida&&cfg.cupos){await script('cupos-vista.js');await SateCuposVista.montar();await script('cupos-receptor.js')}
    }, actualizarPestanas
  };
  function actualizarPestanas(activa=actual?.padre || actual?.pestana){
      if(!cfg.pestanas.includes(activa))activa=api.personal()?'trayectoria':'mapa';
      const items = cfg.pestanas.map(id => ({id,grupo:cfg.grupos.findIndex(g=>g.includes(id)),texto:texto('sate.pestana.'+id+'.titulo'),corto:texto('sate.pestana.'+id+'.corto')}));
      tabs = SateUI.pestanas({items,activa,alCambiar:id=>{if(!seleccionProgramada && actual && actual.pestana!==id)ir(id)}});
      document.getElementById('sate-tabs').replaceChildren();
      document.getElementById('sate-tabs').appendChild(tabs);
      for (const id of cfg.pestanas) tabs.querySelector('[data-id="'+id+'"]').setAttribute('aria-controls',id==='guia'?'sate-guia':id==='horarios'?'v-hor':id==='tramites'?'sate-tramites':id==='trayectoria'?'sate-trayectoria':id==='calendario'?'sate-calendario':'v-tray');
      barra?.remove?.();
      barra = SateUI.barraInferior({items:items.map(it=>({id:it.id,grupo:it.grupo,texto:it.corto,titulo:it.texto})),activa,alElegir:ir});
      document.body.appendChild(barra);
      recalcularPestanas();
      if(actual&&(actual.padre || actual.pestana)!==activa)activar(SateRutas.ruta('#/'+u+'/'+activa,u,config)).catch(error);
  }
  // Sin el parámetro no se descarga ni se ejecuta el módulo de diagnóstico.
  // Medición interna: solo con ?medir en un servidor local (el archivo no se publica).
  const medicionLista = parametros.has('medir') && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) ? script('medicion.js').catch(() => {}) : Promise.resolve();
  if (!u) { medicionLista.then(mostrarEntrada).catch(error); return; }
  // «SATE {unidad}»: la unidad es el botón subrayado (color de la unidad) que abre el cambio de unidad.
  const botonUnidad = document.getElementById('b-unidad');
  botonUnidad.textContent = cfg.siglas; botonUnidad.hidden = false;
  botonUnidad.setAttribute('aria-label', cfg.siglas + '. ' + texto('sate.encabezado.unidad')); botonUnidad.title = texto('sate.encabezado.unidad');
  document.getElementById('sate-titulo').replaceChildren(texto('sate.siglas') + ' ', botonUnidad);
  if (cfg.leyenda) {
    const ayuda = SateUI.ayuda('sate.leyenda.'+cfg.leyenda,{unidad:cfg.siglas});
    const boton = ayuda.querySelector('button');
    // El texto largo se oculta en móvil sin cambiar la escala tipográfica.
    const etiqueta = document.createElement('span');
    etiqueta.textContent = texto('sate.encabezado.prueba');
    boton.replaceChildren(etiqueta);
    boton.setAttribute('aria-label', texto('sate.encabezado.prueba')); boton.dataset.corto = texto('sate.encabezado.prueba_corto');
    document.getElementById('sate-leyenda').appendChild(ayuda);
  }
  // Logo de la unidad, hasta la derecha: el oficial de la unidad si lo hay; si no, el del catálogo SAES con su halo.
  const ranura = document.getElementById('sate-logo-unidad');
  // Nombre de la unidad a la izquierda de su logo, pequeño, hasta 2 líneas (dato de identidad, nunca un literal).
  const nombreUnidad = document.getElementById('sate-unidad-nombre');
  nombreUnidad.textContent = cfg.nombre; nombreUnidad.title = cfg.nombre;
  if (cfg.logo) {
    const enlace = document.createElement('a'); enlace.className = 'unit'; enlace.href = cfg.logo.enlace;
    for (const [tema, clase] of [['claro','logo-lt'],['oscuro','logo-dk']]) {
      const img = document.createElement('img'); img.className = clase; img.src = '../' + cfg.logo[tema];
      img.alt = cfg.logo.alt; img.width = 91; img.height = 72; enlace.appendChild(img);
    }
    ranura.appendChild(enlace);
  } else ranura.appendChild(logoUnidad(u, cfg.nombre));
  function identidadSaes() {
    for (const a of document.querySelectorAll('#saes-dlg a')) {
      if (/^https?:\/\/saes\.[^/]+/.test(a.href||'') && a.protocol !== 'javascript:') {
        a.href = cfg.saes; a.textContent = cfg.saes.replace(/^https?:\/\//,'').replace(/\/$/,'');
      }
    }
  }
  medicionLista.then(() => {
    if (cfg.generica) return script('generico.js');
    return json('nucleo').then(d=>{window.SATE_DATA=Object.assign({periodos:{actual:[],proximo:[]},asig:[],prof:[]},d);return script('nucleo.js')});
  }).catch(error);
})();
