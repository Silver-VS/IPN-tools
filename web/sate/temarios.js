/* Temarios de unidades de aprendizaje en SATE.
   A. Funciones puras (adaptador de un registro de data/temarios/<unidad>/<carrera>.json al documento genérico del lector
      de PoliCORE, búsqueda y agrupación): se prueban en Node y las usa la página de revisión.
   B. Integración (solo con SATE): enlace desde la ficha de materia, panel o hoja con el lector y la vista
      #/<unidad>/temarios (explorador independiente). Todo se activa por datos: sin temarios en la unidad, nada de esto existe. */
(function (raiz) {
  'use strict';

  /* ===================== A. Funciones puras ===================== */
  const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const claveNorm = k => String(k == null ? '' : k).trim().toUpperCase();
  const num = n => (Number.isInteger(+n) ? String(+n) : (+n).toFixed(2).replace(/\.?0+$/, ''));
  const vacio = v => v == null || String(v).trim() === '';
  const anio = plan => (/^\d{2}$/.test(String(plan)) ? '20' + plan : String(plan || ''));
  const TIPOS_BIBLIO = { b: 'basica', basica: 'basica', 'básica': 'basica', c: 'complementaria', complementaria: 'complementaria' };

  // Temario -> documento genérico {titulo, subtitulo, metadatos, secciones, fuente, avisos}.
  // ctx: {t: función de textos, carrera: nombre de la carrera, plan: '09'}
  function documento(reg, ctx) {
    const t = ctx.t, mt = c => t('temarios.meta.' + c), st = c => t('temarios.seccion.' + c);
    const meta = [], horas = reg.horas || {}, cr = reg.creditos || {};
    const dato = (clave, valor) => { if (!vacio(valor)) meta.push({ etiqueta: mt(clave), valor: String(valor).trim() }); };
    if (reg.nivel != null) dato('nivel', reg.nivel);
    if (reg.tipo) dato('tipo', t('temarios.tipo.' + reg.tipo));
    if (cr.tepic != null) dato('tepic', num(cr.tepic));
    if (cr.satca != null) dato('satca', num(cr.satca));
    if (horas.teoria_semana != null || horas.practica_semana != null) {
      dato('horas_semana', t('temarios.meta.horas_semana_valor', { teoria: num(horas.teoria_semana || 0), practica: num(horas.practica_semana || 0) }));
    }
    if (horas.totales_semestre != null) dato('horas_semestre', num(horas.totales_semestre));
    dato('vigencia', reg.vigencia);
    dato('academia', String(reg.academia || '').replace(/^\s*del?\s+(la\s+)?/i, ''));
    const secciones = [];
    const texto = (id, valor) => { if (!vacio(valor)) secciones.push({ id, titulo: st(id), tipo: 'texto', contenido: String(valor).trim() }); };
    texto('objetivo', reg.objetivo);
    if ((reg.contenidos || []).length) {
      secciones.push({ id: 'contenidos', titulo: st('contenidos'), tipo: 'unidades', rotulo: t('temarios.documento.unidad'),
        contenido: reg.contenidos.map(u => ({ numero: u.numero || '', titulo: u.titulo || '', subtemas: u.subtemas || [] })) });
    }
    texto('orientacion', reg.orientacion);
    texto('evaluacion', reg.evaluacion);
    if ((reg.bibliografia || []).length) {
      secciones.push({ id: 'bibliografia', titulo: st('bibliografia'), tipo: 'bibliografia', contenido: reg.bibliografia.map(b => {
        const k = TIPOS_BIBLIO[norm(b.tipo).trim()];
        return { texto: b.texto || '', tipo: k ? t('temarios.biblio.' + k) : '' };
      }) });
    }
    const avisos = [{ tipo: 'ocr', texto: t('temarios.aviso.ocr') }];
    if (typeof reg.confianza === 'number' && reg.confianza < 0.98) avisos.push({ tipo: 'coincidencia', texto: t('temarios.aviso.coincidencia') });
    return {
      titulo: reg.nombre,
      subtitulo: t('temarios.documento.subtitulo', { clave: claveNorm(reg.clave), carrera: ctx.carrera || '' }),
      metadatos: meta, secciones, avisos,
      fuente: { texto: t('temarios.documento.fuente', { plan: anio(ctx.plan || reg.plan) }) }
    };
  }

  // Campos del registro donde aparece la consulta (todas las palabras, en cualquier campo); null si no coincide.
  function terminos(q) { return norm(q).split(/\s+/).filter(Boolean); }
  function textoContenidos(reg) {
    return (reg.contenidos || []).map(u => [u.numero, u.titulo, ...(u.subtemas || [])].join(' ')).join(' \n ');
  }
  function buscarEnRegistro(reg, terms) {
    if (!terms.length) return [];
    const campos = { nombre: norm(claveNorm(reg.clave) + ' ' + (reg.nombre || '')), objetivo: norm(reg.objetivo), contenidos: norm(textoContenidos(reg)) };
    const todo = Object.values(campos).join(' \n ');
    if (!terms.every(w => todo.includes(w))) return null;
    return Object.keys(campos).filter(k => terms.some(w => campos[k].includes(w)));
  }
  // Filtra el índice {clave: {c: carrera, n: nombre, v: nivel, t: tipo}}. `registros(c)` devuelve Map clave->registro o null
  // (carrera aún no descargada: solo se busca en el nombre y la clave).
  function filtrar(materias, f, registros) {
    const terms = terminos(f.q || ''), r = [];
    for (const [clave, m] of Object.entries(materias)) {
      if (f.carrera && f.carrera !== '*' && m.c !== f.carrera) continue;
      if (f.nivel && f.nivel !== '*' && String(m.v) !== String(f.nivel)) continue;
      if (f.tipo && f.tipo !== '*' && m.t !== f.tipo) continue;
      let donde = [];
      if (terms.length) {
        const reg = registros && registros(m.c)?.get(clave);
        if (reg) { donde = buscarEnRegistro(reg, terms); if (!donde) continue; }
        else { const nombre = norm(clave + ' ' + m.n); if (!terms.every(w => nombre.includes(w))) continue; donde = ['nombre']; }
      }
      r.push({ clave, ...m, donde });
    }
    return r;
  }
  function agrupar(lista) {
    const g = new Map();
    for (const x of lista.slice().sort((a, b) => (a.v ?? 99) - (b.v ?? 99) || a.n.localeCompare(b.n, 'es') || a.clave.localeCompare(b.clave))) {
      const k = x.v ?? 0;
      if (!g.has(k)) g.set(k, []);
      g.get(k).push(x);
    }
    return [...g.entries()].map(([nivel, items]) => ({ nivel, items }));
  }
  function enlace(unidad, carrera, clave, seccion) {
    return '#/' + unidad + '/temarios' + (carrera ? '/' + carrera + (clave ? '/' + clave + (seccion ? '/' + seccion : '') : '') : '');
  }
  raiz.SateTemarios = { norm, claveNorm, documento, terminos, buscarEnRegistro, filtrar, agrupar, enlace };

  if (typeof raiz.SATE === 'undefined' || typeof raiz.SATE_CONFIG === 'undefined' || typeof document === 'undefined') return;

  /* ===================== B. Integración con SATE ===================== */
  const t = (c, v) => SATE.texto(c, v);
  const E = { indice: null, pIndice: null, carreras: {}, pCarreras: {}, panel: null, token: 0, origen: null, origenClave: null };
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
  const mq = s => (raiz.matchMedia ? raiz.matchMedia(s) : { matches: false, addEventListener() {} });
  const lateral = () => mq('(min-width:1024px)').matches;
  const unidad = () => raiz.SATE_UNIDAD;
  const ir = (carrera, clave, seccion) => enlace(unidad(), carrera, clave, seccion);
  const absoluto = h => String(raiz.location.href).split('#')[0] + h;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function h(etiqueta, atributos, hijos) {
    const n = document.createElement(etiqueta);
    for (const k in atributos || {}) {
      const v = atributos[k];
      if (v == null || v === false) continue;
      if (k === 'texto') n.textContent = v; else n.setAttribute(k, v === true ? '' : v);
    }
    for (const x of hijos || []) if (x) n.appendChild(typeof x === 'string' ? document.createTextNode(x) : x);
    return n;
  }
  function cargarCss() {
    if (!BASE || !document.head) return;
    const href = BASE + 'temarios.css';
    for (const l of document.querySelectorAll('link[data-tmr-css]')) if (l.getAttribute('href') === href) return;
    document.head.appendChild(h('link', { rel: 'stylesheet', href, 'data-tmr-css': '' }));
  }
  cargarCss();

  /* ---------- datos ---------- */
  const traer = nombre => fetch('datos/' + unidad() + '/temarios/' + nombre + '.json').then(r => {
    if (!r.ok) throw new Error('datos/' + unidad() + '/temarios/' + nombre + ': HTTP ' + r.status);
    return r.json();
  });
  function preparar() {
    return E.pIndice ||= traer('indice').then(d => { E.indice = d; return d; }).catch(e => { E.pIndice = null; throw e; });
  }
  function carreraDatos(id) {
    return E.pCarreras[id] ||= traer(id).then(d => {
      const materias = new Map();
      for (const r of d.materias) materias.set(claveNorm(r.clave), r);
      return (E.carreras[id] = { plan: d.plan, materias });
    }).catch(e => { delete E.pCarreras[id]; throw e; });
  }
  const todasCargadas = () => Object.keys(E.indice?.carreras || {}).every(id => E.carreras[id]);
  const cargarTodas = () => Promise.all(Object.keys(E.indice.carreras).map(carreraDatos));
  const tiene = k => !!E.indice?.materias?.[claveNorm(k)];
  async function registro(clave) {
    const k = claveNorm(clave), e = E.indice?.materias?.[k];
    if (!e) return null;
    const c = await carreraDatos(e.c), reg = c.materias.get(k);
    return reg ? { registro: reg, carreraId: e.c, plan: c.plan } : null;
  }
  const documentoDe = r => documento(r.registro, { t, carrera: E.indice.carreras[r.carreraId]?.nombre, plan: r.plan });
  const lector = () => raiz.PoliCORE && raiz.PoliCORE.lector;

  function nombreDe(k) { const e = E.indice?.materias?.[claveNorm(k)]; return e ? e.n : k; }
  const enlaceHtml = k => (tiene(k) ? '<p class="insp-temario"><a href="' + esc(ir(E.indice.materias[claveNorm(k)].c, claveNorm(k))) + '">' + esc(t('temarios.mapa.ver')) + '</a></p>' : '');

  /* ---------- panel lateral (escritorio) u hoja inferior (teléfono) ---------- */
  function construirPanel() {
    if (E.panel) return E.panel;
    const x = h('button', { type: 'button', 'class': 'tmr-panel-x', 'aria-label': t('temarios.panel.cerrar'), texto: '×' });
    const abrirEn = h('a', { 'class': 'tmr-panel-abrir', href: '#', texto: t('temarios.panel.abrir_explorador') });
    const cuerpo = h('div', { 'class': 'tmr-panel-cuerpo' });
    const p = h('aside', { 'class': 'tmr-panel', role: 'dialog', 'aria-modal': 'false', tabindex: '-1', hidden: true },
      [h('div', { 'class': 'tmr-panel-enc' }, [abrirEn, x]), cuerpo]);
    const velo = h('div', { 'class': 'tmr-velo', hidden: true });
    x.addEventListener('click', () => cerrar({ foco: true }));
    velo.addEventListener('click', () => cerrar({ foco: true }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && E.panel && !E.panel.hidden) cerrar({ foco: true }); });
    mq('(min-width:1024px)').addEventListener('change', () => { if (E.panel && !E.panel.hidden) ajustarPanel(); });
    // Fuera del <body>: no hereda el zoom de interfaz (--ui-zoom), igual que el globo de ayuda.
    document.documentElement.appendChild(velo); document.documentElement.appendChild(p);
    E.panel = p; E.velo = velo; E.cuerpo = cuerpo; E.abrirEn = abrirEn;
    return p;
  }
  function ajustarPanel() {
    const lat = lateral();
    E.panel.setAttribute('aria-modal', String(!lat));
    E.velo.hidden = lat || E.panel.hidden;
    const empuja = lat && !E.panel.hidden;
    document.body.classList.toggle('tmr-lateral', empuja);
    document.documentElement.classList.toggle('sate-sin-scroll', !lat && !E.panel.hidden);
    // El mapa se vuelve a ajustar al ancho libre cuando el panel va al lado (solo si ese estado cambió).
    if (empuja !== !!E.empuja) { E.empuja = empuja; if (raiz.dispatchEvent && typeof raiz.Event === 'function') raiz.dispatchEvent(new raiz.Event('resize')); }
  }
  async function abrir(clave, origen) {
    const k = claveNorm(clave);
    if (!tiene(k)) return;
    E.origen = origen || E.origen; E.origenClave = k;
    const token = ++E.token, p = construirPanel();
    p.hidden = false; ajustarPanel();
    E.abrirEn.setAttribute('href', ir(E.indice.materias[k].c, k));
    p.setAttribute('aria-label', t('temarios.panel.etiqueta', { materia: nombreDe(k) }));
    E.cuerpo.replaceChildren(h('p', { 'class': 'tmr-estado', role: 'status', texto: t('temarios.panel.cargando') }));
    p.focus();
    try {
      await (lector() ? 0 : SATE.cargarTemarios());
      const r = await registro(k);
      if (token !== E.token) return;
      lector().montar(E.cuerpo, documentoDe(r), { texto: t, modo: 'panel', nivelTitulo: 2, indice: 'desplegable',
        enlace: s => absoluto(ir(r.carreraId, k, s)) });
      p.setAttribute('aria-label', t('temarios.panel.etiqueta', { materia: r.registro.nombre }));
    } catch (e) {
      if (token !== E.token) return;
      console.debug('SATE: temario no disponible', e.message);
      const otra = h('button', { type: 'button', 'class': 'btn', texto: t('temarios.panel.reintentar') });
      otra.addEventListener('click', () => abrir(k, E.origen));
      E.cuerpo.replaceChildren(h('p', { 'class': 'tmr-estado', role: 'alert', texto: t('temarios.panel.error') }), otra);
    }
  }
  function cerrar(op) {
    const p = E.panel;
    if (!p || p.hidden) return;
    E.token++;
    p.hidden = true; ajustarPanel();
    if (lector()) lector().desmontar(E.cuerpo);
    if (op && op.foco) {
      let o = E.origen;
      if (!o || !o.isConnected) o = document.querySelector('[data-box="' + (raiz.CSS && CSS.escape ? CSS.escape(E.origenClave) : E.origenClave) + '"]');
      if (o && o.focus) o.focus();
    }
  }

  /* ---------- explorador independiente: #/<unidad>/temarios[/<carrera>/<clave>[/<seccion>]] ---------- */
  const F = { q: '', carrera: '*', nivel: '*', tipo: '*', sel: null, montado: false, inst: null, instClave: null, buscaToken: 0 };
  const X = {};
  function guardarFiltros() { try { store.set('tmFiltros', { carrera: F.carrera, nivel: F.nivel, tipo: F.tipo }); } catch (e) {} }
  function opcionesSelect(sel, todas, valores, actual) {
    sel.replaceChildren(h('option', { value: '*', texto: todas }), ...valores.map(([v, tx]) => h('option', { value: String(v), texto: tx })));
    sel.value = valores.some(([v]) => String(v) === String(actual)) ? String(actual) : '*';
    return sel.value;
  }
  function construirExplorador() {
    const caja = document.getElementById('sate-temarios');
    const campo = (clave, control) => h('label', { 'class': 'tmr-campo' }, [h('span', { texto: t(clave) }), control]);
    X.q = h('input', { type: 'search', 'class': 'tmr-buscar', autocomplete: 'off', spellcheck: 'false', placeholder: t('temarios.buscar.marcador'), 'aria-describedby': 'tmr-ayuda' });
    X.carrera = h('select'); X.nivel = h('select'); X.tipo = h('select');
    X.estado = h('p', { 'class': 'tmr-resumen', role: 'status', 'aria-live': 'polite' });
    X.lista = h('div', { 'class': 'tmr-lista' });
    X.lector = h('div', { 'class': 'tmr-lector', id: 'tmr-lector' });
    X.volver = h('a', { 'class': 'tmr-volver', href: ir(), texto: '← ' + t('temarios.explorador.volver') });
    X.raiz = h('div', { 'class': 'tmr', 'data-vista': 'lista' }, [
      h('header', { 'class': 'tmr-enc' }, [h('h2', { texto: t('temarios.explorador.titulo') }), h('p', { 'class': 'tmr-intro', texto: t('temarios.explorador.intro') })]),
      h('div', { 'class': 'tmr-cols' }, [
        h('section', { 'class': 'tmr-col-lista', 'aria-label': t('temarios.lista.etiqueta') }, [
          h('div', { 'class': 'tmr-filtros' }, [
            campo('temarios.buscar.etiqueta', X.q), h('small', { id: 'tmr-ayuda', 'class': 'tmr-nota', texto: t('temarios.buscar.ayuda') }),
            h('div', { 'class': 'tmr-selects' }, [campo('temarios.filtro.carrera', X.carrera), campo('temarios.filtro.nivel', X.nivel), campo('temarios.filtro.tipo', X.tipo)]),
            X.estado]),
          X.lista]),
        h('section', { 'class': 'tmr-col-lector' }, [X.volver, X.lector])])]);
    caja.replaceChildren(X.raiz);
    let temporizador = 0;
    X.q.addEventListener('input', () => { raiz.clearTimeout(temporizador); temporizador = raiz.setTimeout(() => { F.q = X.q.value; pintarLista(); }, 120); });
    for (const k of ['carrera', 'nivel', 'tipo']) X[k].addEventListener('change', () => { F[k] = X[k].value; guardarFiltros(); pintarLista(); });
    F.montado = true;
  }
  function pintarFiltros() {
    const ind = E.indice, ms = Object.values(ind.materias);
    opcionesSelect(X.carrera, t('temarios.filtro.carrera_todas'), Object.entries(ind.carreras).map(([id, c]) => [id, c.nombre]), F.carrera);
    opcionesSelect(X.nivel, t('temarios.filtro.nivel_todos'), [...new Set(ms.map(m => m.v))].filter(v => v != null).sort((a, b) => a - b).map(v => [v, t('temarios.lista.nivel', { n: v })]), F.nivel);
    opcionesSelect(X.tipo, t('temarios.filtro.tipo_todos'), [...new Set(ms.map(m => m.t))].filter(Boolean).map(v => [v, t('temarios.tipo.' + v)]), F.tipo);
    F.carrera = X.carrera.value; F.nivel = X.nivel.value; F.tipo = X.tipo.value;
  }
  function resaltar(nodo, texto, consulta) {
    const L = lector();
    const rangos = L && consulta.trim() ? L.coincidencias(texto, consulta) : [];
    if (!rangos.length) { nodo.textContent = texto; return; }
    let pos = 0;
    for (const [a, b] of rangos) {
      if (a > pos) nodo.appendChild(document.createTextNode(texto.slice(pos, a)));
      nodo.appendChild(h('mark', { 'class': 'tmr-marca', texto: texto.slice(a, b) })); pos = b;
    }
    if (pos < texto.length) nodo.appendChild(document.createTextNode(texto.slice(pos)));
  }
  function pintarLista() {
    if (!F.montado || !E.indice) return;
    const ind = E.indice, terms = terminos(F.q), mi = ++F.buscaToken;
    const lista = filtrar(ind.materias, F, id => E.carreras[id]?.materias);
    const porCarrera = F.carrera === '*' && Object.keys(ind.carreras).length > 1;
    const grupos = agrupar(lista);
    const hijos = [];
    for (const g of grupos) {
      hijos.push(h('section', { 'class': 'tmr-grupo' }, [
        h('h3', { texto: g.nivel ? t('temarios.lista.nivel', { n: g.nivel }) : '—' }),
        h('ul', { 'class': 'tmr-items' }, g.items.map(m => {
          const nombre = h('span', { 'class': 'tmr-nombre' });
          resaltar(nombre, m.n, F.q);
          const meta = [m.clave, porCarrera ? ind.carreras[m.c]?.nombre : null, m.t ? t('temarios.tipo.' + m.t) : null].filter(Boolean).join(' · ');
          const donde = terms.length && !m.donde.includes('nombre') ? h('small', { 'class': 'tmr-donde', texto: t('temarios.lista.coincide', { donde: m.donde.map(d => t('temarios.donde.' + d)).join(', ') }) }) : null;
          const sel = F.sel && F.sel.clave === m.clave;
          return h('li', {}, [h('a', { 'class': 'tmr-item', href: ir(m.c, m.clave), 'aria-current': sel ? 'page' : null, 'data-clave': m.clave }, [nombre, h('small', { 'class': 'tmr-meta', texto: meta }), donde])]);
        }))]));
    }
    if (!lista.length) hijos.push(h('p', { 'class': 'tmr-vacio', texto: t('temarios.lista.sin_resultados') }));
    X.lista.replaceChildren(...hijos);
    let resumen = t('temarios.lista.resultados', { n: lista.length });
    const faltan = terms.length && !todasCargadas();
    if (faltan) resumen += ' · ' + t('temarios.buscar.buscando');
    X.estado.textContent = resumen;
    if (faltan) cargarTodas().then(() => { if (mi === F.buscaToken) pintarLista(); }).catch(e => console.debug('SATE: búsqueda en temarios incompleta', e.message));
  }
  async function pintarLector() {
    const sel = F.sel, L = lector();
    X.raiz.setAttribute('data-vista', sel ? 'lector' : 'lista');
    if (!sel) {
      L.desmontar(X.lector); F.inst = null; F.instClave = null;
      X.lector.replaceChildren(h('p', { 'class': 'tmr-vacio tmr-elegir', texto: t('temarios.explorador.elegir') }));
      return;
    }
    if (F.inst && F.instClave === sel.carr + '/' + sel.clave) { if (sel.seccion) F.inst.irA(sel.seccion, { notificar: false }); return; }
    const clave = sel.clave, id = sel.carr + '/' + clave;
    X.lector.replaceChildren(h('p', { 'class': 'tmr-estado', role: 'status', texto: t('temarios.panel.cargando') }));
    let r = null;
    try { r = await registro(clave); } catch (e) {
      console.debug('SATE: temario no disponible', e.message);
      if (F.sel && F.sel.clave === clave) X.lector.replaceChildren(h('p', { 'class': 'tmr-estado', role: 'alert', texto: t('temarios.panel.error') }));
      return;
    }
    if (!F.sel || F.sel.clave !== clave) return;
    if (!r || r.carreraId !== sel.carr) { L.desmontar(X.lector); F.inst = null; X.lector.replaceChildren(h('p', { 'class': 'tmr-vacio', role: 'alert', texto: t('temarios.explorador.no_encontrado') })); return; }
    F.inst = L.montar(X.lector, documentoDe(r), { texto: t, modo: 'pagina', nivelTitulo: 2, consulta: F.q, seccion: sel.seccion || null,
      enlace: s => absoluto(ir(r.carreraId, clave, s)),
      alNavegar: s => { try { history.replaceState(null, '', raiz.location.pathname + raiz.location.search + ir(r.carreraId, clave, s)); } catch (e) {} } });
    F.instClave = id;
    if (!sel.seccion && raiz.scrollTo && !lateral()) raiz.scrollTo(0, 0);
    for (const a of X.lista.querySelectorAll('.tmr-item')) { if (a.dataset.clave === clave) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
  }
  async function mostrarExplorador(r) {
    const caja = document.getElementById('sate-temarios');
    try { await preparar(); } catch (e) {
      caja.replaceChildren(h('p', { 'class': 'tmr-vacio', role: 'alert', texto: t('temarios.explorador.sin_datos') }));
      F.montado = false; return;
    }
    if (!F.montado) {
      construirExplorador();
      const g = typeof store !== 'undefined' ? store.get('tmFiltros', null) : null;
      if (g) Object.assign(F, { carrera: g.carrera || '*', nivel: g.nivel || '*', tipo: g.tipo || '*' });
      else { const propia = Object.entries(E.indice.carreras).find(([, c]) => c.letra === S.car); if (propia) F.carrera = propia[0]; }
    }
    const [carr, clave, seccion] = (r && r.partes) || [];
    F.sel = carr && clave ? { carr, clave: claveNorm(clave), seccion: seccion || null } : null;
    if (F.sel && F.carrera !== '*' && F.carrera !== carr) F.carrera = carr;   // la lista acompaña al documento abierto
    pintarFiltros(); pintarLista();
    await pintarLector();
  }

  SATE.temarios = { preparar, tiene, abrir, cerrar, enlaceHtml, documento: documentoDe, estado: E };
  SATE.pestana('temarios', { montar() {}, mostrar(r) { return mostrarExplorador(r).catch(e => SATE.error(e)); }, ocultar() {} });
})(typeof window !== 'undefined' ? window : globalThis);
