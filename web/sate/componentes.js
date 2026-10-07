/* Componentes comunes de SATE (sin dependencias). Uso: SateUI.usarTextos(t); SateUI.chips([...]), etc.
   Los textos van por clave (contenido/textos/es.toml). Candidatos a subir a ipn-comun/componentes. */
(function (raiz) {
  'use strict';
  var traducir = function (k, v) { return typeof raiz.t === 'function' ? raiz.t(k, v) : k; };
  var guardar = null, leer = null;
  var MOVIL = '(max-width:720px)';
  var contador = 0;

  function usarTextos(fn) { traducir = fn; }
  /* Almacén del desplegable: por omisión IPNT.set si existe, o localStorage. */
  function usarAlmacen(o) { guardar = o.guardar; leer = o.leer; }
  function almGuardar(k, v) {
    if (guardar) return guardar(k, v);
    try { if (raiz.IPNT && raiz.IPNT.set) raiz.IPNT.set(k, v); else localStorage.setItem(k, v); } catch (e) {}
  }
  function almLeer(k) {
    if (leer) return leer(k);
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }

  function el(tag, attrs, hijos) {
    var n = document.createElement(tag);
    for (var k in (attrs || {})) {
      var v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'texto') n.textContent = v;
      else if (k === 'html') n.innerHTML = v;
      else n.setAttribute(k, v === true ? '' : v);
    }
    (hijos || []).forEach(function (h) { if (h != null) n.appendChild(typeof h === 'string' ? document.createTextNode(h) : h); });
    return n;
  }
  function esMovil() { return !!(raiz.matchMedia && (raiz.matchMedia(MOVIL).matches || raiz.matchMedia('(hover:none)').matches)); }
  function id(p) { return 'sate-' + p + '-' + (++contador); }
  var ESTADOS = { ok: '✓', aviso: '!', error: '✕', info: 'i' };
  function estado(e) { return ESTADOS[e] ? e : 'info'; }

  /* ---------- Modal ---------- */
  var dlg = null, origen = null, alCerrar = null;
  function crearDialogo() {
    var d = el('dialog', { class: 'sate-modal', 'aria-labelledby': 'sate-modal-titulo' }, [
      el('div', { class: 'sate-modal__cab' }, [
        el('h2', { id: 'sate-modal-titulo', class: 'sate-modal__titulo' }),
        el('button', { type: 'button', class: 'sate-modal__x', 'aria-label': traducir('componentes.cerrar'), texto: '✕' })
      ]),
      el('div', { class: 'sate-modal__cuerpo' }),
      el('div', { class: 'sate-modal__pie' })
    ]);
    d.querySelector('.sate-modal__x').addEventListener('click', function () { cerrar(); });
    d.addEventListener('click', function (e) { if (e.target === d) cerrar(); });   // clic en el fondo
    d.addEventListener('cancel', function (e) { e.preventDefault(); cerrar(); });  // Esc
    d.addEventListener('keydown', function (e) {   // respaldo del foco atrapado si showModal no existe
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(d.querySelectorAll('button,a[href],input,select,textarea,summary,[tabindex]:not([tabindex="-1"])'), function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    });
    document.body.appendChild(d);
    return d;
  }
  /* modal(titulo, contenido, {acciones:[{texto, primaria, cierra, onclick}], pequeno, alCerrar})
     contenido: texto (cadena), Node o función que devuelve Node. Devuelve {cerrar, elemento}. */
  function modal(titulo, contenido, op) {
    op = op || {};
    if (!dlg) dlg = crearDialogo();
    var abierto = dlg.open;
    if (!abierto) origen = document.activeElement;
    alCerrar = op.alCerrar || null;
    dlg.querySelector('.sate-modal__titulo').textContent = titulo;
    dlg.querySelector('.sate-modal__x').setAttribute('aria-label', traducir('componentes.cerrar'));
    dlg.classList.toggle('sate-modal--pequeno', !!op.pequeno);
    var cuerpo = dlg.querySelector('.sate-modal__cuerpo');
    cuerpo.textContent = '';
    var c = typeof contenido === 'function' ? contenido() : contenido;
    if (c != null) cuerpo.appendChild(typeof c === 'string' ? el('p', { texto: c }) : c);
    var pie = dlg.querySelector('.sate-modal__pie');
    pie.textContent = '';
    pie.hidden = !(op.acciones && op.acciones.length);
    (op.acciones || []).forEach(function (a) {
      var b = el('button', { type: 'button', class: 'sate-btn' + (a.primaria ? ' sate-btn--primario' : ''), texto: a.texto });
      b.addEventListener('click', function () { if (a.onclick) a.onclick(); if (a.cierra !== false) cerrar(); });
      pie.appendChild(b);
    });
    if (!abierto) {
      if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      document.documentElement.classList.add('sate-sin-scroll');
    }
    cuerpo.scrollTop = 0;
    var foco = dlg.querySelector('.sate-modal__pie .sate-btn--primario') || dlg.querySelector('.sate-modal__x');
    foco.focus();
    return { cerrar: cerrar, elemento: dlg };
  }
  function cerrar() {
    if (!dlg || !dlg.open) return;
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
    document.documentElement.classList.remove('sate-sin-scroll');
    var o = origen, f = alCerrar;
    origen = null; alCerrar = null;
    if (o && o.focus && document.contains(o)) o.focus();
    if (f) f();
  }

  /* ---------- Chips de estado ---------- */
  /* chips([{id, estado, texto, abre}], contenedor?) ; abre: función o {titulo, contenido, acciones}. Máx. 5. */
  function chips(lista, donde) {
    if (lista.length > 5 && raiz.console) console.warn('chips: máximo 5 (se muestran los primeros 5)');
    var fila = donde || el('div');
    fila.textContent = '';
    fila.className = 'sate-chips';
    fila.setAttribute('role', 'list');
    lista.slice(0, 5).forEach(function (c) {
      var e = estado(c.estado);
      var hijos = [
        el('span', { class: 'sate-chip__marca', 'aria-hidden': 'true', texto: ESTADOS[e] }),
        el('span', { class: 'sate-sr', texto: traducir('componentes.estado.' + e) + ': ' }),
        el('span', { class: 'sate-chip__texto', texto: c.texto })
      ];
      var attrs = { class: 'sate-chip', 'data-estado': e, 'data-id': c.id };
      var n;
      if (c.abre) {
        attrs.type = 'button'; attrs['aria-haspopup'] = 'dialog';
        n = el('button', attrs, hijos);
        n.addEventListener('click', function () {
          if (typeof c.abre === 'function') c.abre(n);
          else modal(c.abre.titulo || c.texto, c.abre.contenido, { acciones: c.abre.acciones });
        });
      } else n = el('span', attrs, hijos);
      fila.appendChild(el('span', { role: 'listitem', class: 'sate-chips__item' }, [n]));
    });
    return fila;
  }

  /* ---------- Tarjeta de aviso ---------- */
  /* aviso({estado, titulo, cuerpo, accion:{texto, onclick|href}, descartable}) */
  function aviso(o) {
    var e = estado(o.estado);
    var n = el('div', { class: 'sate-aviso', 'data-estado': e }, [
      el('span', { class: 'sate-sr', texto: traducir('componentes.estado.' + e) + ': ' }),
      el('p', { class: 'sate-aviso__titulo', texto: o.titulo })
    ]);
    if (o.cuerpo) n.appendChild(el('p', { class: 'sate-aviso__cuerpo', texto: o.cuerpo }));
    if (o.accion) {
      var a = o.accion.href ? el('a', { class: 'sate-enlace', href: o.accion.href, texto: o.accion.texto })
        : el('button', { type: 'button', class: 'sate-enlace', texto: o.accion.texto });
      if (o.accion.onclick) a.addEventListener('click', o.accion.onclick);
      n.appendChild(a);
    }
    if (o.descartable) {
      var x = el('button', { type: 'button', class: 'sate-aviso__x', 'aria-label': traducir('componentes.descartar'), texto: '✕' });
      x.addEventListener('click', function () { n.remove(); if (o.alDescartar) o.alDescartar(); });
      n.appendChild(x);
    }
    return n;
  }
  /* avisos([...]) : rejilla lado a lado (1 columna en teléfono) */
  function avisos(lista) {
    return el('div', { class: 'sate-avisos' }, lista.map(aviso));
  }

  /* ---------- Ayuda ⓘ ---------- */
  var globoAbierto = null;
  function cerrarGlobo() { if (globoAbierto) { globoAbierto(); globoAbierto = null; } }
  /* ayuda(clave, vars?) → elemento. Escritorio: globo (hover, foco, clic). Teléfono/táctil: modal pequeño. */
  function ayuda(clave, vars) {
    var env = el('span', { class: 'sate-ayuda' });
    var b = el('button', { type: 'button', class: 'sate-ayuda__btn', 'aria-label': traducir('componentes.ayuda.boton'), texto: 'ⓘ' });
    var gid = id('globo');
    var g = el('span', { class: 'sate-globo', role: 'tooltip', id: gid, hidden: true });
    env.appendChild(b); env.appendChild(g);
    var fijo = false, t = null;
    function colocar() {
      var r = b.getBoundingClientRect(), w = Math.min(320, raiz.innerWidth - 16);
      g.style.width = w + 'px';
      var x = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, raiz.innerWidth - w - 8));
      g.style.left = x + 'px';
      g.style.top = (r.bottom + 6) + 'px';
      var alto = g.offsetHeight;
      if (r.bottom + 6 + alto > raiz.innerHeight && r.top - 6 - alto > 0) g.style.top = (r.top - 6 - alto) + 'px';
    }
    function mostrar() {
      if (!g.hidden) return;
      cerrarGlobo();
      g.innerHTML = traducir(clave, vars);
      g.hidden = false; b.setAttribute('aria-describedby', gid);
      colocar();
      globoAbierto = ocultar;
    }
    function ocultar() { g.hidden = true; fijo = false; b.removeAttribute('aria-describedby'); if (globoAbierto === ocultar) globoAbierto = null; }
    function programar() { clearTimeout(t); t = setTimeout(function () { if (!fijo && !env.contains(document.activeElement)) ocultar(); }, 160); }
    env.addEventListener('mouseenter', function () { if (!esMovil()) { clearTimeout(t); mostrar(); } });
    env.addEventListener('mouseleave', function () { if (!esMovil()) programar(); });
    env.addEventListener('focusin', function () { if (!esMovil()) { clearTimeout(t); mostrar(); } });
    env.addEventListener('focusout', function () { programar(); });
    env.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !g.hidden) { e.stopPropagation(); ocultar(); b.focus(); } });
    b.addEventListener('click', function () {
      if (esMovil()) { modal(traducir('componentes.ayuda.titulo'), function () { return el('p', { html: traducir(clave, vars) }); }, { pequeno: true }); return; }
      if (g.hidden) { mostrar(); fijo = true; } else if (fijo) ocultar(); else fijo = true;
    });
    return env;
  }
  document.addEventListener('click', function (e) { if (globoAbierto && !(e.target.closest && e.target.closest('.sate-ayuda'))) cerrarGlobo(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && globoAbierto) cerrarGlobo(); });
  raiz.addEventListener('scroll', function () { cerrarGlobo(); }, true);

  /* ---------- Desplegable recordado ---------- */
  /* desplegable({clave, titulo, contenido, ayuda:'clave', abierto}) ; el estado se guarda en ipnt.ui.desp.<clave> */
  function desplegable(o) {
    var k = 'ipnt.ui.desp.' + o.clave;
    var g = almLeer(k);
    var d = el('details', { class: 'sate-desp' });
    var s = el('summary', {}, [el('span', { texto: o.titulo })]);
    d.appendChild(s);
    if (o.ayuda) s.appendChild(ayuda(o.ayuda));
    var c = typeof o.contenido === 'function' ? o.contenido() : o.contenido;
    d.appendChild(el('div', { class: 'sate-desp__cuerpo' }, [typeof c === 'string' ? el('p', { texto: c }) : c]));
    d.open = g === '1' ? true : g === '0' ? false : !!o.abierto;
    d.addEventListener('toggle', function () { almGuardar(k, d.open ? '1' : '0'); });
    return d;
  }

  /* ---------- Pestañas ---------- */
  /* pestanas({items:[{id, texto, panel:Element|id}], activa, etiqueta, segmentado, alCambiar}) → tablist con .seleccionar(id) */
  function pestanas(o) {
    var lista = el('div', { class: 'sate-pestanas' + (o.segmentado ? ' sate-pestanas--seg' : ''), role: 'tablist', 'aria-label': o.etiqueta || null });
    var base = id('tab'), botones = [];
    function panelDe(it) { return typeof it.panel === 'string' ? document.getElementById(it.panel) : it.panel; }
    function seleccionar(ident, foco) {
      o.items.forEach(function (it, i) {
        var sel = it.id === ident, p = panelDe(it);
        botones[i].setAttribute('aria-selected', String(sel));
        botones[i].tabIndex = sel ? 0 : -1;
        if (p) p.hidden = !sel;
        if (sel && foco) botones[i].focus();
      });
      if (o.alCambiar) o.alCambiar(ident);
    }
    o.items.forEach(function (it, i) {
      var b = el('button', { type: 'button', role: 'tab', class: 'sate-pestana', id: base + '-' + it.id, 'data-id': it.id, texto: it.texto });
      if (i && it.grupo != null && it.grupo !== o.items[i-1].grupo) b.className += ' sate-grupo-inicio';
      var p = panelDe(it);
      if (p) {
        if (!p.id) p.id = base + '-p-' + it.id;
        b.setAttribute('aria-controls', p.id);
        p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id);
      }
      b.addEventListener('click', function () { seleccionar(it.id, false); });
      b.addEventListener('keydown', function (e) {
        var n = o.items.length, j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % n;
        else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = n - 1;
        if (j === null) return;
        e.preventDefault(); seleccionar(o.items[j].id, true);
      });
      botones.push(b); lista.appendChild(b);
    });
    lista.seleccionar = function (ident) { seleccionar(ident, false); };
    seleccionar(o.activa || o.items[0].id, false);
    return lista;
  }

  /* ---------- Barra inferior (teléfono ≤ 720 px) ---------- */
  /* barraInferior({items:[{id, texto}], activa, alElegir}) → <nav>; solo se ve en teléfono. */
  function barraInferior(o) {
    var nav = el('nav', { class: 'sate-barra', 'aria-label': traducir('componentes.barra.etiqueta') });
    var bs = o.items.map(function (it, i) {
      var b = el('button', { type: 'button', class: 'sate-barra__btn', 'data-id': it.id, texto: it.texto });
      b.addEventListener('click', function () { marcar(it.id); if (o.alElegir) o.alElegir(it.id); });
      if (i && it.grupo != null && it.grupo !== o.items[i-1].grupo) b.className += ' sate-grupo-inicio';
      nav.appendChild(b); return b;
    });
    function marcar(ident) { bs.forEach(function (b) { if (b.dataset.id === ident) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }); }
    nav.marcar = marcar;
    marcar(o.activa || o.items[0].id);
    return nav;
  }

  raiz.SateUI = { usarTextos: usarTextos, usarAlmacen: usarAlmacen, chips: chips, aviso: aviso, avisos: avisos, modal: modal, cerrarModal: cerrar,
    ayuda: ayuda, desplegable: desplegable, pestanas: pestanas, barraInferior: barraInferior };
})(typeof window !== 'undefined' ? window : globalThis);
