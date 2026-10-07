/* Los módulos clásicos comparten los globales históricos. Cambiar de unidad recarga
   el mismo punto de entrada para no mezclar estado ni registrar eventos dos veces. */
(function () {
  const config = SATE_CONFIG.unidades, cargas = new Map(), modulos = {}, montados = new Set();
  let api, actual, tabs, barra, version = 0;
  const leer = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const inicial = SateRutas.ruta(location.hash, leer('ipnt.unidad') || 'upiita', config);
  const recordada = leer('ipnt.unidad');
  const unidad = inicial?.unidad || new URLSearchParams(location.search).getAll('sateUnidad').at(-1) || recordada || 'upiita';
  window.SATE_UNIDAD = config[unidad] ? unidad : Object.keys(config)[0];
  const u = window.SATE_UNIDAD, cfg = config[u];
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
    if (id === 'desempeno') await script('desempeno.js');
    if (id === 'situacion') await script('situacion.js');
    if (id === 'mapa' || id === 'horarios') await script(id + '.js');
    if (id === 'tramites' && !cargas.has('tramites.json')) {
      cargas.set('tramites.json',json('tramites').then(d=>Object.assign(window.SATE_DATA,d)).catch(e=>{cargas.delete('tramites.json');throw e}));
    }
    if (id === 'tramites') await cargas.get('tramites.json');
    if (!modulos[id]) throw new Error('Módulo sin registrar: ' + id);
    return modulos[id];
  }
  function ir(id) { location.hash = '#/' + u + '/' + id; }
  function elegirUnidad() {
    const caja = document.createElement('div');
    for (const [id, c] of Object.entries(config)) {
      const b = document.createElement('button'); b.className = 'btn'; b.textContent = c.siglas;
      b.onclick = () => { if (api) IPNT.set('ipnt.unidad', id); location.hash = '#/' + id + '/mapa'; if (id !== u) location.reload(); else SateUI.cerrarModal(); };
      caja.appendChild(b);
    }
    SateUI.modal('Unidad académica', caja);
  }
  async function activar(r) {
    if (!r || !api) return;
    if (r.unidad !== u) { IPNT.set('ipnt.unidad', r.unidad); location.reload(); return; }
    const v = ++version;
    // El mapa y sus sugeridas necesitan los grupos; no pintar una copia parcial de la oferta.
    if (r.pestana === 'mapa' || r.pestana === 'horarios') await cargarOferta();
    const m = await modulo(r.pestana);
    if (v !== version) return;
    if (actual) modulos[actual.pestana]?.ocultar?.();
    actual = r;
    api.estado.tab = r.pestana === 'horarios' ? 'hor' : 'tray';
    if (!montados.has(r.pestana)) { m.montar?.(); montados.add(r.pestana); }
    tabs.seleccionar(r.pestana); barra.marcar(r.pestana);
    document.getElementById('v-tray').hidden = r.pestana !== 'mapa';
    document.getElementById('sate-desempeno').hidden = r.pestana !== 'desempeno';
    document.getElementById('sate-situacion').hidden = r.pestana !== 'situacion';
    document.getElementById('v-hor').hidden = r.pestana !== 'horarios';
    document.getElementById('sate-tramites').hidden = r.pestana !== 'tramites';
    const panel = document.getElementById(r.pestana === 'horarios' ? 'v-hor' : r.pestana === 'tramites' ? 'sate-tramites' : r.pestana === 'situacion' ? 'sate-situacion' : r.pestana === 'desempeno' ? 'sate-desempeno' : 'v-tray');
    panel.setAttribute('role','tabpanel');
    panel.setAttribute('aria-labelledby',tabs.querySelector('[data-id="'+r.pestana+'"]').id);
    api.store.set('ruta', r.hash);
    document.getElementById('sate-carga').hidden = true;
    repintar();
  }
  function repintar() {
    if (!actual) return;
    if (window.SATE_DATA.mapas[api.estado.car]?.generico && actual.pestana !== 'horarios') { ir('horarios'); return; }
    api.renderTop(); api.renderAviso(); modulos[actual.pestana].mostrar(actual);
    document.body.setAttribute('data-sate-pestana',actual.pestana);
    document.getElementById('sate-oferta-periodo').hidden=actual.pestana!=='horarios';
    document.getElementById('notice').hidden=actual.pestana!=='horarios';
    document.getElementById('mobnote').hidden=true;
  }
  window.SATE = {texto, modulos, error, script, identidadSaes, get actual(){return actual}, pestana(id, m) { modulos[id] = m; }, ir, elegirUnidad, repintar, cargarOferta,
    async nucleoListo(a) {
      api = a; SateUI.usarAlmacen({leer,guardar:(k,v)=>IPNT.set(k,v)});
      const r = SateRutas.ruta(location.hash, u, config) ||
        SateRutas.ruta(api.store.get('ruta',''), u, config) ||
        SateRutas.ruta('#/' + u + '/' + (api.personal() && cfg.pestanas.includes('situacion') ? 'situacion' : 'mapa'), u, config);
      modulos.tramites = {mostrar(r) {
        const box = document.getElementById('sate-tramites'); box.replaceChildren();
        const p = document.createElement('p'); p.textContent = texto('sate.leyenda.prueba',{unidad:cfg.siglas}); box.appendChild(p);
        for (const id of cfg.tramites) {
          const a = document.createElement('a'); a.className = 'btn'; a.textContent = texto('sate.tramite.'+id+'.titulo');
          a.href = '#/' + u + '/tramites/' + id; box.appendChild(a);
        }
        const id = r.tramite || cfg.tramites[0];
        const h = document.createElement('h2'); h.textContent = texto('sate.tramite.'+id+'.titulo'); box.appendChild(h);
        if (id === 'dictamen' || id === 'electivas') {
          const a = document.createElement('a'); a.className = 'btn'; a.textContent = texto('sate.migracion.abrir',{tramite:h.textContent});
          a.href = '../' + id + '.html'; box.appendChild(a);
        } else if (id === 'reinscripcion') {
          const c = document.createElement('div'); c.className = 'cal'; box.appendChild(c); const d=situacionDatos();renderCalendario(d?.rd,d?.nDes||0);
        } else {
          const p = document.createElement('p'); p.textContent = texto('sate.migracion.tramites'); box.appendChild(p);
        }
      }};
      const items = cfg.pestanas.map(id => ({id,texto:texto('sate.pestana.'+id+'.titulo')}));
      tabs = SateUI.pestanas({items,activa:r.pestana,alCambiar:id=>{if(actual && actual.pestana!==id)ir(id)}});
      document.getElementById('sate-tabs').appendChild(tabs);
      for (const id of cfg.pestanas) tabs.querySelector('[data-id="'+id+'"]').setAttribute('aria-controls',id==='horarios'?'v-hor':id==='tramites'?'sate-tramites':id==='situacion'?'sate-situacion':id==='desempeno'?'sate-desempeno':'v-tray');
      barra = SateUI.barraInferior({items:cfg.pestanas.map(id=>({id,texto:texto('sate.pestana.'+id+'.corto')})),activa:r.pestana,alElegir:ir});
      document.body.appendChild(barra);
      addEventListener('hashchange',()=>{const r=SateRutas.ruta(location.hash,u,config);if(r)activar(r).catch(error)});
      // Un hash ajeno pertenece a cuenta/tema/demo: nunca se reemplaza por una ruta SATE.
      if (!location.hash) history.replaceState(null,'',location.pathname+location.search+r.hash);
      await activar(r);
      if (!inicial && !recordada && !new URLSearchParams(location.search).has('sateUnidad')) elegirUnidad();
    }
  };
  document.getElementById('sate-titulo').textContent = texto('sate.siglas') + ' ' + cfg.siglas;
  document.getElementById('sate-leyenda').textContent = cfg.leyenda ? texto('sate.leyenda.'+cfg.leyenda,{unidad:cfg.siglas}) : '';
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
  json('nucleo').then(d=>{window.SATE_DATA=Object.assign({periodos:{actual:[],proximo:[]},asig:[],prof:[]},d);return script('nucleo.js')}).catch(error);
})();
