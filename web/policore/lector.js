/* PoliCORE · lector de documentos (GuindaLabs). Sin dependencias.
   Muestra un documento estructurado genérico (temarios, reglamentos, convocatorias…): encabezado con datos clave,
   índice de secciones, texto oficial en serif, búsqueda con resaltado, enlace a la fuente y enlaces a cada sección.
   API:  PoliCORE.lector.montar(contenedor, documento, opciones) -> instancia
         PoliCORE.lector.desmontar([contenedor])
   Formato y opciones: docs/POLICORE-LECTOR.md. Ningún texto visible vive aquí: todo llega por clave de texto. */
(function (raiz) {
  'use strict';
  var PoliCORE = raiz.PoliCORE = raiz.PoliCORE || {};
  var BASE = (typeof document !== 'undefined' && document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
  var instancias = new Map(), contador = 0;

  /* ---------- utilidades puras (también se prueban en Node) ---------- */
  // Texto sin acentos y en minúsculas, con el mapa de cada letra normalizada a su posición original.
  function normalizar(s) {
    var t = '', ini = [], fin = [];
    for (var i = 0; i < s.length;) {
      var cp = s.codePointAt(i), ch = String.fromCodePoint(cp);
      var n = ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      for (var j = 0; j < n.length; j++) { t += n[j]; ini.push(i); fin.push(i + ch.length); }
      i += ch.length;
    }
    return { t: t, ini: ini, fin: fin };
  }
  // Rangos [inicio, fin) del texto original donde aparece la consulta (sin acentos ni mayúsculas).
  function coincidencias(texto, consulta) {
    var q = normalizar(consulta).t.trim(), r = [];
    if (!q) return r;
    var n = normalizar(texto), desde = 0, p;
    while ((p = n.t.indexOf(q, desde)) >= 0) {
      r.push([n.ini[p], n.fin[p + q.length - 1]]);
      desde = p + q.length;
    }
    return r;
  }
  function urlSegura(u) { return typeof u === 'string' && /^https?:\/\//i.test(u) ? u : null; }
  function reglaTexto(opciones) {
    var f = opciones && opciones.texto || PoliCORE.texto || (raiz.SATE && raiz.SATE.texto);
    return typeof f === 'function' ? f : function (clave) { return clave; };
  }

  function cargarCss(href) {
    if (typeof document === 'undefined' || !document.head) return;
    href = href || (BASE ? BASE + 'lector.css' : '');
    if (!href) return;
    var ya = document.querySelectorAll ? document.querySelectorAll('link[data-pc-css]') : [];
    for (var i = 0; i < ya.length; i++) if (ya[i].getAttribute('href') === href) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href; l.setAttribute('data-pc-css', '');
    document.head.appendChild(l);
  }

  function el(etiqueta, atributos, hijos) {
    var n = document.createElement(etiqueta);
    for (var k in atributos || {}) {
      var v = atributos[k];
      if (v == null || v === false) continue;
      if (k === 'texto') n.textContent = v; else n.setAttribute(k, v === true ? '' : v);
    }
    (hijos || []).forEach(function (h) { if (h) n.appendChild(typeof h === 'string' ? document.createTextNode(h) : h); });
    return n;
  }
  function parrafos(texto, clase) {
    return String(texto == null ? '' : texto).split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean)
      .map(function (l) { return el('p', { 'class': clase || 'pc-oficial', texto: l }); });
  }

  /* ---------- contenido de cada tipo de sección ---------- */
  function cuerpoSeccion(s) {
    var c = s.contenido, caja = el('div', { 'class': 'pc-cuerpo-seccion pc-tipo-' + s.tipo });
    if (s.tipo === 'lista') {
      var ul = el('ul', { 'class': 'pc-lista' });
      (c || []).forEach(function (x) { ul.appendChild(el('li', { 'class': 'pc-oficial', texto: typeof x === 'string' ? x : x && x.texto || '' })); });
      caja.appendChild(ul);
    } else if (s.tipo === 'unidades') {
      var ol = el('ol', { 'class': 'pc-unidades' });
      (c || []).forEach(function (u) {
        var cab = el('div', { 'class': 'pc-unidad-cab' });
        var rotulo = [s.rotulo, u.numero].filter(Boolean).join(' ');
        if (rotulo) cab.appendChild(el('span', { 'class': 'pc-unidad-num', texto: rotulo }));
        cab.appendChild(el('span', { 'class': 'pc-unidad-tit pc-oficial', texto: u.titulo || '' }));
        var li = el('li', { 'class': 'pc-unidad' }, [cab]);
        if (u.subtemas && u.subtemas.length) {
          var sub = el('ul', { 'class': 'pc-subtemas' });
          u.subtemas.forEach(function (x) { sub.appendChild(el('li', { 'class': 'pc-oficial', texto: typeof x === 'string' ? x : x && x.texto || '' })); });
          li.appendChild(sub);
        }
        ol.appendChild(li);
      });
      caja.appendChild(ol);
    } else if (s.tipo === 'bibliografia') {
      var grupos = [], porTipo = {};
      (c || []).forEach(function (b) {
        var k = b.tipo || '';
        if (!porTipo[k]) { porTipo[k] = { tipo: k, items: [] }; grupos.push(porTipo[k]); }
        porTipo[k].items.push(b.texto || '');
      });
      grupos.forEach(function (g) {
        if (g.tipo) caja.appendChild(el('h4', { 'class': 'pc-grupo', texto: g.tipo }));
        var ul2 = el('ul', { 'class': 'pc-biblio' });
        g.items.forEach(function (x) { ul2.appendChild(el('li', { 'class': 'pc-oficial', texto: x })); });
        caja.appendChild(ul2);
      });
    } else {
      parrafos(c).forEach(function (p) { caja.appendChild(p); });
    }
    // La sección mezcla rótulos propios con transcripciones: marcar solo estas últimas.
    if (s.oficial) for (const n of caja.querySelectorAll('.pc-oficial')) n.setAttribute('data-oficial', s.oficial);
    return caja;
  }
  function seccionesDe(doc) {
    return (doc.secciones || []).filter(function (s) {
      var c = s && s.contenido;
      return s && s.id && s.titulo && (Array.isArray(c) ? c.length : String(c == null ? '' : c).trim());
    });
  }

  /* ---------- montaje ---------- */
  function montar(contenedor, documento, opciones) {
    if (!contenedor) throw new Error('PoliCORE.lector: falta el contenedor');
    desmontar(contenedor);
    opciones = opciones || {};
    if (opciones.css !== false) cargarCss(typeof opciones.css === 'string' ? opciones.css : null);
    var t = reglaTexto(opciones), uid = 'pc' + (++contador), doc = documento || {};
    var lista = seccionesDe(doc), nivel = Math.min(5, Math.max(1, opciones.nivelTitulo || 2));
    var idDe = function (s) { return uid + '-' + s.id; };
    var limpiezas = [], marcas = [], actual = -1, consulta = '', modoIndice = '';
    var raizEl = el('article', { 'class': 'pc-lector', 'data-pc-modo': opciones.modo === 'panel' ? 'panel' : 'pagina', lang: opciones.idioma || 'es' });

    /* encabezado */
    var enc = el('header', { 'class': 'pc-enc' });
    var titulo = el('h' + nivel, { 'class': 'pc-titulo', id: uid + '-titulo', tabindex: '-1', texto: doc.titulo || '' });
    if (doc.oficial) titulo.setAttribute('data-oficial', doc.oficial);
    enc.appendChild(titulo);
    if (doc.subtitulo) enc.appendChild(el('p', { 'class': 'pc-sub', texto: doc.subtitulo }));
    var meta = (doc.metadatos || []).filter(function (m) { return m && m.valor != null && String(m.valor) !== ''; });
    if (meta.length) {
      var chips = el('ul', { 'class': 'pc-chips' });
      meta.forEach(function (m) {
        chips.appendChild(el('li', { 'class': 'pc-chip' }, [el('span', { 'class': 'pc-chip-et', texto: m.etiqueta }), el('span', { 'class': 'pc-chip-val', texto: String(m.valor) })]));
      });
      enc.appendChild(chips);
    }
    (doc.avisos || []).forEach(function (a) {
      var o = typeof a === 'string' ? { texto: a } : a || {};
      if (o.texto) enc.appendChild(el('p', { 'class': 'pc-aviso', role: 'note', 'data-tipo': o.tipo || null, texto: o.texto }));
    });
    raizEl.appendChild(enc);

    /* índice (desplegable o lateral) y texto */
    var cuerpo = el('div', { 'class': 'pc-cuerpo' });
    var indice = null, detalle = null, enlacesIndice = {};
    if (lista.length) {
      detalle = el('details', { 'class': 'pc-indice-det' });
      detalle.appendChild(el('summary', { 'class': 'pc-indice-res', texto: t('policore.lector.indice.titulo') }));
      var ul = el('ul', { 'class': 'pc-indice-lista' });
      lista.forEach(function (s) {
        var a = el('a', { 'class': 'pc-indice-a', href: opciones.enlace ? opciones.enlace(s.id) : '#' + idDe(s), 'data-id': s.id }, [el('span', { texto: s.titulo })]);
        a.addEventListener('click', function (e) {
          e.preventDefault();
          irA(s.id);
          if (modoIndice === 'desplegable') detalle.open = false;
        });
        enlacesIndice[s.id] = a;
        ul.appendChild(el('li', {}, [a]));
      });
      detalle.appendChild(ul);
      indice = el('nav', { 'class': 'pc-indice', 'aria-label': t('policore.lector.indice.etiqueta') }, [detalle]);
    }
    var texto = el('div', { 'class': 'pc-texto' });
    var campo = null, estado = null, ant = null, sig = null, limpiar = null;
    if (opciones.buscar !== false && lista.length) {
      var barra = el('div', { 'class': 'pc-barra', role: 'search', 'data-pc-ignorar': '' });
      campo = el('input', { type: 'search', 'class': 'pc-buscar', id: uid + '-buscar', autocomplete: 'off', spellcheck: 'false',
        placeholder: t('policore.lector.buscar.marcador'), 'aria-label': t('policore.lector.buscar.etiqueta') });
      ant = el('button', { type: 'button', 'class': 'pc-btn', 'aria-label': t('policore.lector.buscar.anterior'), texto: '↑', disabled: true });
      sig = el('button', { type: 'button', 'class': 'pc-btn', 'aria-label': t('policore.lector.buscar.siguiente'), texto: '↓', disabled: true });
      limpiar = el('button', { type: 'button', 'class': 'pc-btn', 'aria-label': t('policore.lector.buscar.limpiar'), texto: '×', hidden: true });
      estado = el('span', { 'class': 'pc-estado', role: 'status', 'aria-live': 'polite' });
      barra.appendChild(campo); barra.appendChild(ant); barra.appendChild(sig); barra.appendChild(limpiar); barra.appendChild(estado);
      texto.appendChild(barra);
    }
    var nodos = {};
    lista.forEach(function (s) {
      var h = el('h' + (nivel + 1), { 'class': 'pc-sec-tit', id: idDe(s), tabindex: '-1', texto: s.titulo });
      var copiar = el('button', { type: 'button', 'class': 'pc-copiar', 'data-pc-ignorar': '', 'data-id': s.id,
        'aria-label': t('policore.lector.seccion.copiar_aria', { seccion: s.titulo }), texto: t('policore.lector.seccion.copiar') });
      copiar.addEventListener('click', function () { copiarEnlace(s, copiar); });
      var sec = el('section', { 'class': 'pc-seccion', 'data-pc-seccion': s.id, 'aria-labelledby': idDe(s) },
        [el('div', { 'class': 'pc-sec-enc' }, [h, copiar]), cuerpoSeccion(s)]);
      nodos[s.id] = sec; texto.appendChild(sec);
    });
    if (!lista.length) texto.appendChild(el('p', { 'class': 'pc-vacio', texto: t('policore.lector.vacio') }));
    if (indice) cuerpo.appendChild(indice);
    cuerpo.appendChild(texto);
    raizEl.appendChild(cuerpo);

    /* fuente */
    var f = doc.fuente;
    if (f && (f.texto || f.url)) {
      var pie = el('footer', { 'class': 'pc-pie' }, [el('b', { texto: t('policore.lector.fuente.titulo') }), f.texto ? document.createTextNode(' ' + f.texto + ' ') : null]);
      var u = urlSegura(f.url);
      if (u) pie.appendChild(el('a', { 'class': 'pc-fuente', href: u, target: '_blank', rel: 'noopener noreferrer', texto: t('policore.lector.fuente.abrir') }));
      raizEl.appendChild(pie);
    }
    contenedor.textContent = '';
    contenedor.appendChild(raizEl);

    /* ---------- comportamiento ---------- */
    var suave = !(raiz.matchMedia && raiz.matchMedia('(prefers-reduced-motion: reduce)').matches);
    function irA(id, op) {
      op = op || {};
      var sec = nodos[id];
      if (!sec) return false;
      var h = sec.querySelector('.pc-sec-tit');
      if (sec.scrollIntoView) sec.scrollIntoView({ block: 'start', behavior: suave && !op.inmediato ? 'smooth' : 'auto' });
      if (h && h.focus && !op.sinFoco) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
      marcarIndice(id);
      if (op.notificar !== false && opciones.alNavegar) opciones.alNavegar(id);
      return true;
    }
    function marcarIndice(id) {
      for (var k in enlacesIndice) {
        if (k === id) enlacesIndice[k].setAttribute('aria-current', 'location'); else enlacesIndice[k].removeAttribute('aria-current');
      }
    }
    function copiarEnlace(s, boton) {
      var url = opciones.enlace ? opciones.enlace(s.id) : String(raiz.location && raiz.location.href || '').split('#')[0] + '#' + idDe(s);
      if (/^#/.test(url) && raiz.location) url = raiz.location.href.split('#')[0] + url;
      var avisar = function (ok) {
        var original = boton.getAttribute('data-original') || boton.textContent;
        boton.setAttribute('data-original', original);
        boton.textContent = t(ok ? 'policore.lector.seccion.copiado' : 'policore.lector.seccion.copiar_error');
        boton.setAttribute('data-estado', ok ? 'ok' : 'error');
        var temp = raiz.setTimeout(function () { boton.textContent = original; boton.removeAttribute('data-estado'); }, 2200);
        limpiezas.push(function () { raiz.clearTimeout(temp); });
        if (opciones.alCopiar) opciones.alCopiar(url, ok);
      };
      var nav = raiz.navigator || {};
      function alternativa() {
        if (nav.share) { nav.share({ title: doc.titulo || '', url: url }).then(function () { avisar(true); }, function () { avisar(false); }); return; }
        var ta = el('textarea', { 'class': 'pc-oculto', readonly: true }); ta.value = url;
        document.body.appendChild(ta); ta.select();
        var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
        ta.remove(); avisar(ok);
      }
      if (nav.clipboard && nav.clipboard.writeText) nav.clipboard.writeText(url).then(function () { avisar(true); }, alternativa);
      else alternativa();
    }

    // Búsqueda con resaltado: no cruza los límites de un nodo de texto ni toca las herramientas.
    function quitarResalte() {
      marcas.forEach(function (m) {
        var p = m.parentNode; if (!p) return;
        p.replaceChild(document.createTextNode(m.textContent), m); p.normalize();
      });
      marcas = []; actual = -1;
    }
    function nodosDeTexto() {
      var r = [], rec = function (n) {
        for (var h = n.firstChild; h; h = h.nextSibling) {
          if (h.nodeType === 3) { if (h.nodeValue.trim()) r.push(h); }
          else if (h.nodeType === 1 && !h.hasAttribute('data-pc-ignorar')) rec(h);
        }
      };
      Object.keys(nodos).forEach(function (id) { rec(nodos[id]); });
      return r;
    }
    function buscar(q, op) {
      op = op || {};
      quitarResalte();
      consulta = String(q == null ? '' : q);
      var conteo = {};
      if (consulta.trim()) {
        nodosDeTexto().forEach(function (nodo) {
          var rangos = coincidencias(nodo.nodeValue, consulta);
          if (!rangos.length) return;
          var s = nodo.nodeValue, frag = document.createDocumentFragment(), pos = 0;
          var sec = nodo.parentNode.closest ? nodo.parentNode.closest('[data-pc-seccion]') : null;
          rangos.forEach(function (rg) {
            if (rg[0] > pos) frag.appendChild(document.createTextNode(s.slice(pos, rg[0])));
            var m = el('mark', { 'class': 'pc-resalte', texto: s.slice(rg[0], rg[1]) });
            var origen = nodo.parentNode.closest && nodo.parentNode.closest('[data-oficial]');
            if (origen) m.setAttribute('data-oficial', origen.getAttribute('data-oficial'));
            frag.appendChild(m); marcas.push(m); pos = rg[1];
            if (sec) { var k = sec.getAttribute('data-pc-seccion'); conteo[k] = (conteo[k] || 0) + 1; }
          });
          if (pos < s.length) frag.appendChild(document.createTextNode(s.slice(pos)));
          nodo.parentNode.replaceChild(frag, nodo);
        });
      }
      for (var k2 in enlacesIndice) {
        var a = enlacesIndice[k2], viejo = a.querySelector('.pc-n');
        if (viejo) viejo.remove();
        if (conteo[k2]) a.appendChild(el('span', { 'class': 'pc-n', 'aria-label': t('policore.lector.buscar.en_seccion', { n: conteo[k2] }), texto: String(conteo[k2]) }));
      }
      if (campo && campo.value !== consulta) campo.value = consulta;
      if (estado) estado.textContent = consulta.trim() ? t('policore.lector.buscar.resultados', { n: marcas.length }) : '';
      if (ant) { ant.disabled = sig.disabled = !marcas.length; }
      if (limpiar) limpiar.hidden = !consulta;
      if (consulta.trim()) raizEl.setAttribute('data-pc-buscando', ''); else raizEl.removeAttribute('data-pc-buscando');
      if (marcas.length && op.ir !== false) irMarca(0);
      return marcas.length;
    }
    function irMarca(i) {
      if (!marcas.length) return;
      if (marcas[actual]) marcas[actual].classList.remove('pc-actual');
      actual = (i + marcas.length) % marcas.length;
      var m = marcas[actual]; m.classList.add('pc-actual');
      if (m.scrollIntoView) m.scrollIntoView({ block: 'center', behavior: suave ? 'smooth' : 'auto' });
      if (estado) estado.textContent = t('policore.lector.buscar.posicion', { i: actual + 1, n: marcas.length });
    }
    if (campo) {
      var temporizador = 0;
      campo.addEventListener('input', function () {
        raiz.clearTimeout(temporizador);
        temporizador = raiz.setTimeout(function () { buscar(campo.value); }, 150);
      });
      campo.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); if (consulta !== campo.value) buscar(campo.value); else irMarca(actual + (e.shiftKey ? -1 : 1)); }
        else if (e.key === 'Escape' && campo.value) { e.stopPropagation(); buscar(''); }
      });
      ant.addEventListener('click', function () { irMarca(actual - 1); });
      sig.addEventListener('click', function () { irMarca(actual + 1); });
      limpiar.addEventListener('click', function () { buscar(''); campo.focus(); });
      limpiezas.push(function () { raiz.clearTimeout(temporizador); });
    }

    // Índice lateral cuando hay ancho; si no, desplegable arriba.
    function ajustarIndice(ancho) {
      if (!detalle) return;
      var m = opciones.indice === 'lateral' || opciones.indice === 'desplegable' ? opciones.indice : (ancho >= (opciones.anchoLateral || 760) ? 'lateral' : 'desplegable');
      if (m === modoIndice) return;
      modoIndice = m;
      raizEl.setAttribute('data-pc-indice', m);
      detalle.open = m === 'lateral';
    }
    ajustarIndice(contenedor.clientWidth || raizEl.clientWidth || 0);
    if (raiz.ResizeObserver) {
      var ro = new raiz.ResizeObserver(function (en) { ajustarIndice(en[0].contentRect.width); });
      ro.observe(raizEl); limpiezas.push(function () { ro.disconnect(); });
    }
    // La sección visible se marca en el índice.
    if (raiz.IntersectionObserver && lista.length) {
      var io = new raiz.IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) marcarIndice(x.target.getAttribute('data-pc-seccion')); });
      }, { rootMargin: '-15% 0px -75% 0px' });
      Object.keys(nodos).forEach(function (id) { io.observe(nodos[id]); });
      limpiezas.push(function () { io.disconnect(); });
    }

    var instancia = {
      elemento: raizEl, documento: doc, secciones: lista.map(function (s) { return s.id; }),
      irA: irA, buscar: buscar,
      get consulta() { return consulta; }, get coincidencias() { return marcas.length; },
      desmontar: function () { desmontar(contenedor); }
    };
    instancia._limpiar = function () { limpiezas.forEach(function (f2) { f2(); }); limpiezas = []; };
    instancias.set(contenedor, instancia);
    if (opciones.consulta) buscar(opciones.consulta, { ir: !opciones.seccion });
    if (opciones.seccion) irA(opciones.seccion, { inmediato: true, sinFoco: true, notificar: false });
    return instancia;
  }

  function desmontar(contenedor) {
    var cuales = contenedor ? [contenedor] : Array.from(instancias.keys());
    cuales.forEach(function (c) {
      var i = instancias.get(c);
      if (!i) return;
      i._limpiar(); instancias.delete(c);
      if (c.replaceChildren) c.replaceChildren(); else c.textContent = '';
    });
  }

  PoliCORE.lector = { montar: montar, desmontar: desmontar, cargarCss: cargarCss, normalizar: normalizar, coincidencias: coincidencias,
    activos: function () { return instancias.size; } };
})(typeof window !== 'undefined' ? window : globalThis);
