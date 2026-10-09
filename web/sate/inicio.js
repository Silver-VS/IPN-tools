/* Los módulos clásicos comparten los globales históricos. Cambiar de unidad recarga
   el mismo punto de entrada para no mezclar estado ni registrar eventos dos veces. */
(function () {
  const config = SATE_CONFIG.unidades, cargas = new Map(), modulos = {}, montados = new Set();
  const cascaron = document.querySelector('html[data-pestanas]');
  const variante = new URLSearchParams(location.search).get('pestanas');
  if (cascaron && ['v1','v3'].includes(variante)) cascaron.setAttribute('data-pestanas', variante);
  let api, actual, tabs, barra, version = 0;
  const leer = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const solicitada = location.hash.match(/^#\/([a-z0-9-]+)\//)?.[1] || new URLSearchParams(location.search).getAll('sateUnidad').at(-1) || leer('ipnt.unidad');
  if (solicitada && /^[a-z0-9-]+$/.test(solicitada) && !config[solicitada]) {
    const identidad = SATE_CONFIG.identidadUnidades?.[solicitada] || Object.values(SATE_CONFIG.identidadUnidades || {}).find(c=>c.alias?.includes(solicitada));
    const siglas = identidad?.siglas || solicitada.toUpperCase();
    config[solicitada] = {generica:true,siglas,nombre:identidad?.nombre || siglas,realce:identidad?.realce,logoUnidad:identidad?.logo,saes:'https://saes.'+solicitada+'.ipn.mx/',
      pestanas:['trayectoria','mapa'],grupos:[['trayectoria'],['mapa']],tramites:[]};
  }
  const inicial = SateRutas.ruta(location.hash, leer('ipnt.unidad') || 'upiita', config);
  const recordada = leer('ipnt.unidad');
  const unidad = inicial?.unidad || new URLSearchParams(location.search).getAll('sateUnidad').at(-1) || recordada || 'upiita';
  window.SATE_UNIDAD = config[unidad] ? unidad : Object.keys(config)[0];
  const u = window.SATE_UNIDAD, cfg = config[u];
  let unidadRealce = inicial || recordada || new URLSearchParams(location.search).has('sateUnidad') ? u : null;
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
      s.onload = ok; s.onerror = () => { cargas.delete(src); no(new Error('Archivo: ' + src)); };
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
    if (cfg.generica) return modulos[id];
    if (id === 'trayectoria') await script('desempeno.js');
    if (id === 'calendario') await script('calendario.js');
    if (id === 'mapa' || id === 'horarios') await script(id + '.js');
    if (id === 'tramites' && !cargas.has('tramites.json')) {
      cargas.set('tramites.json',json('tramites').then(d=>Object.assign(window.SATE_DATA,d)).catch(e=>{cargas.delete('tramites.json');throw e}));
    }
    if (id === 'tramites') {
      await cargas.get('tramites.json'); await script('tramites.js');
      if (u === 'upiita') {
        await script('dictamen.js');
        await script('../tramites/electivas-reglas.js'); await script('electivas.js');
      }
    }
    if (!modulos[id]) throw new Error('Módulo sin registrar: ' + id);
    return modulos[id];
  }
  function ir(id) { location.hash = '#/' + u + '/' + id; }
  function adaptarPestanas() {
    const contenedor = document.getElementById('sate-tabs'), navegacion = contenedor?.closest?.('.sate-navegacion');
    const controles = navegacion?.querySelector('.sate-controles');
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
      if (escalon === 'flotante' && tabs.contains(foco)) barra.querySelector('[data-id="'+foco.dataset.id+'"]').focus();
      else if (escalon !== 'flotante' && !(typeof matchMedia === 'function' && matchMedia('(max-width:720px)').matches) && barra.contains(foco)) tabs.querySelector('[data-id="'+foco.dataset.id+'"]').focus();
    }
    function programar() { if (!pendiente) { pendiente = true; requestAnimationFrame(calcular); } }
    new ResizeObserver(programar).observe(navegacion);
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
    for (const [id, c] of Object.entries(config)) {
      const b = document.createElement('button'); b.className = 'btn'; b.textContent = c.siglas;
      b.title = c.nombre;
      b.className += ' sate-selector-unidad'; b.prepend(logoUnidad(id, c.nombre));
      b.onclick = () => { aplicarRealce(id); if (api) IPNT.set('ipnt.unidad', id); location.hash = '#/' + id + '/mapa'; if (id !== u) location.reload(); else SateUI.cerrarModal(); };
      caja.appendChild(b);
    }
    const ayuda = document.createElement('p'); ayuda.textContent = '¿Tu unidad no aparece? Usa el Lector desde tu SAES. Guarda el marcador, ejecútalo en tu sesión y abre SATE desde el resumen; después pega tus datos.';
    const boton = document.createElement('button'); boton.className='btn'; boton.textContent='Cómo usar el Lector';
    boton.onclick=()=>{SateUI.cerrarModal();SAES.open()};
    caja.appendChild(ayuda); caja.appendChild(boton);
    SateUI.modal('Unidad académica', caja);
  }
  async function activar(r) {
    if (!r || !api) return;
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
    tabs.seleccionar(r.pestana); barra.marcar(r.pestana);
    document.getElementById('v-tray').hidden = r.pestana !== 'mapa';
    document.getElementById('sate-trayectoria').hidden = r.pestana !== 'trayectoria';
    document.getElementById('sate-calendario').hidden = r.pestana !== 'calendario';
    document.getElementById('v-hor').hidden = r.pestana !== 'horarios';
    document.getElementById('sate-tramites').hidden = r.pestana !== 'tramites';
    const panel = document.getElementById(r.pestana === 'horarios' ? 'v-hor' : r.pestana === 'tramites' ? 'sate-tramites' : r.pestana === 'trayectoria' ? 'sate-trayectoria' : r.pestana === 'calendario' ? 'sate-calendario' : 'v-tray');
    panel.setAttribute('role','tabpanel');
    panel.setAttribute('aria-labelledby',tabs.querySelector('[data-id="'+r.pestana+'"]').id);
    api.store.set('ruta', r.hash);
    document.getElementById('sate-carga').hidden = true;
    repintar();
  }
  function repintar() {
    if (!actual) return;
    if (!cfg.generica && window.SATE_DATA.mapas[api.estado.car]?.generico && actual.pestana !== 'horarios') { ir('horarios'); return; }
    api.renderTop(); api.renderAviso(); SATE.presente.avisos(); modulos[actual.pestana].mostrar(actual);
    SATE.calendario?.pintarRecorte(actual.pestana);
    document.body.setAttribute('data-sate-pestana',actual.pestana);
    document.getElementById('sate-oferta-periodo').hidden=actual.pestana!=='horarios';
    document.getElementById('notice').hidden=actual.pestana!=='horarios';
    document.getElementById('mobnote').hidden=true;
  }
  window.SATE = {texto, modulos, error, script, identidadSaes, get actual(){return actual}, pestana(id, m) { modulos[id] = m; }, ir, elegirUnidad, repintar, cargarOferta,
    async nucleoListo(a) {
      api = a; if (!cfg.generica) await script('situacion.js'); SateUI.usarAlmacen({leer,guardar:(k,v)=>IPNT.set(k,v)});
      const r = SateRutas.ruta(location.hash, u, config) ||
        SateRutas.ruta('#/' + u + '/' + (api.personal() && cfg.pestanas.includes('trayectoria') ? 'trayectoria' : 'mapa'), u, config);
      const items = cfg.pestanas.map(id => ({id,grupo:cfg.grupos.findIndex(g=>g.includes(id)),texto:texto('sate.pestana.'+id+'.titulo'),corto:texto('sate.pestana.'+id+'.corto')}));
      tabs = SateUI.pestanas({items,activa:r.pestana,alCambiar:id=>{if(actual && actual.pestana!==id)ir(id)}});
      document.getElementById('sate-tabs').appendChild(tabs);
      for (const id of cfg.pestanas) tabs.querySelector('[data-id="'+id+'"]').setAttribute('aria-controls',id==='horarios'?'v-hor':id==='tramites'?'sate-tramites':id==='trayectoria'?'sate-trayectoria':id==='calendario'?'sate-calendario':'v-tray');
      barra = SateUI.barraInferior({items:items.map(it=>({id:it.id,grupo:it.grupo,texto:it.corto,titulo:it.texto})),activa:r.pestana,alElegir:ir});
      document.body.appendChild(barra);
      adaptarPestanas();
      addEventListener('hashchange',()=>{const r=SateRutas.ruta(location.hash,u,config);if(r)activar(r).catch(error)});
      // Un hash ajeno pertenece a cuenta/tema/demo: nunca se reemplaza por una ruta SATE.
      if (!location.hash) history.replaceState(null,'',location.pathname+location.search+r.hash);
      await activar(r);
      if (!inicial && !recordada && !new URLSearchParams(location.search).has('sateUnidad')) elegirUnidad();
    }
  };
  const siglasUnidad = document.createElement('span'); siglasUnidad.className = 'sate-unidad'; siglasUnidad.textContent = cfg.siglas;
  document.getElementById('sate-titulo').replaceChildren(logoUnidad(u, cfg.nombre), texto('sate.siglas') + ' ', siglasUnidad);
  if (cfg.leyenda) {
    const ayuda = SateUI.ayuda('sate.leyenda.'+cfg.leyenda,{unidad:cfg.siglas});
    const boton = ayuda.querySelector('button');
    boton.textContent = texto('sate.encabezado.prueba');
    boton.setAttribute('aria-label', texto('sate.encabezado.prueba'));
    document.getElementById('sate-leyenda').appendChild(ayuda);
  }
  const nombreUnidad = document.querySelector('.inst-name');
  if (nombreUnidad) nombreUnidad.textContent = cfg.nombre;
  if (cfg.logo) {
    const enlace = document.createElement('a'); enlace.className = 'unit'; enlace.href = cfg.logo.enlace;
    for (const [tema, clase] of [['claro','logo-lt'],['oscuro','logo-dk']]) {
      const img = document.createElement('img'); img.className = clase; img.src = '../' + cfg.logo[tema];
      img.alt = cfg.logo.alt; img.width = 91; img.height = 72; enlace.appendChild(img);
    }
    document.querySelector('.inst-in')?.appendChild(enlace);
  }
  function identidadSaes() {
    for (const a of document.querySelectorAll('#saes-dlg a')) {
      if (a.href?.includes('saes.upiita.ipn.mx') && a.protocol !== 'javascript:') {
        a.href = cfg.saes; a.textContent = cfg.saes.replace(/^https?:\/\//,'').replace(/\/$/,'');
      }
    }
  }
  if (cfg.generica) script('generico.js').catch(error);
  else json('nucleo').then(d=>{window.SATE_DATA=Object.assign({periodos:{actual:[],proximo:[]},asig:[],prof:[]},d);return script('nucleo.js')}).catch(error);
})();
