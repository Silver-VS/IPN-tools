/* Guía politécnica de SATE: portada con apartados y respuestas a las dudas del alumnado.
   Apartados con datos (data/guia/<unidad>.json): «Situación escolar y dictamen», «Trámites y formatos», «Reglamentos» y
   «¿A quién acudo?». «Programas de estudio» es la vista de temarios.js (#/<unidad>/guia/programas).
   A. Funciones puras (búsqueda, fuentes, apartados disponibles): se prueban en Node.
   B. Integración con SATE: portada, preguntas desplegables buscables, reglamentos y a quién acudir. */
(function (raiz) {
  'use strict';

  /* ===================== A. Funciones puras ===================== */
  const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const terminos = q => norm(q).split(/[^a-z0-9ñ]+/).filter(Boolean);
  const textoDe = p => norm([p.pregunta, p.respuesta, ...(p.pasos || []), ...(p.palabras || [])].join(' '));
  // Preguntas que contienen todas las palabras de la consulta; primero las que coinciden en el título.
  function buscarPreguntas(preguntas, q, apartado) {
    const ts = terminos(q);
    if (!ts.length) return [];
    return (preguntas || [])
      .filter(p => (!apartado || p.apartado === apartado) && ts.every(w => textoDe(p).includes(w)))
      .map(p => ({ p, peso: ts.filter(w => norm(p.pregunta).includes(w)).length }))
      .sort((a, b) => b.peso - a.peso)
      .map(x => x.p);
  }
  // Apartados que una unidad puede mostrar: con datos de la Guía o con su vista propia (programas); `pronto` aún no tiene contenido.
  function apartadosDisponibles(guia, unidad) {
    const vistas = (unidad && unidad.vistas || []).map(v => v.id);
    return (guia || []).filter(a => !a.pronto && (a.vista ? vistas.includes(a.vista) : !!(unidad && unidad.guiaDatos)));
  }
  // Fuente de una respuesta: {texto, url}. `documentos` se declara una vez y las preguntas lo citan por id.
  function fuente(datos, f, t) {
    const d = datos && datos.documentos && f && datos.documentos[f.doc];
    if (!d) return null;
    return { texto: f.articulo ? t('sate.guia.fuente_articulo', { documento: d.titulo, articulo: f.articulo }) : f.pagina ? t('sate.guia.fuente_pagina', { documento: d.titulo, pagina: f.pagina }) : d.titulo, url: d.url, doc: f.doc, arts: f.arts || [] };
  }
  const enlace = (unidad, apartado, id) => '#/' + unidad + '/guia' + (apartado ? '/' + apartado + (id ? '/' + id : '') : '');
  function marcas(texto) {
    const partes = [], re = /\[\[(a|g):([\w-]+)(?::([\w -]+))?\|([^\]]+)\]\]/g;
    let m, pos = 0;
    while ((m = re.exec(String(texto || '')))) {
      if ((m[1] === 'a') !== !!m[3]) continue;
      partes.push({ texto: texto.slice(pos, m.index) }, { tipo: m[1], clave: m[2], n: m[3], texto: m[4] });
      pos = re.lastIndex;
    }
    partes.push({ texto: String(texto || '').slice(pos) });
    return partes;
  }
  /* ---- Lector de reglamentos: estructura, anclas y relaciones, a partir de data/reglamentos/<id>.json ---- */
  // Ancla citable: art-7 (artículo), art-7.III (fracción), art-7.III.b (inciso). El número puede llevar espacios (1 Bis).
  const anclaArticulo = (n, fr, inciso) => 'art-' + n + (fr ? '.' + fr + (inciso ? '.' + inciso : '') : '');
  function leerAncla(ancla) {
    const m = /^art-([\w -]+?)(?:\.(\w+)(?:\.(\w+))?)?$/.exec(String(ancla || ''));
    return m ? { n: m[1], fr: m[2] || null, inciso: m[3] || null } : null;
  }
  // Árbol de títulos y capítulos según la ubicación de cada artículo; cada nodo guarda los números de artículo que contiene.
  function arbolReglamento(reg) {
    const raizArbol = { titulo: null, hijos: [], articulos: [] }, vistos = new Map();
    for (const a of (reg && reg.articulos) || []) {
      let nodo = raizArbol, clave = '';
      for (const u of a.ubicacion || []) {
        clave += '\u0001' + u;
        let hijo = vistos.get(clave);
        if (!hijo) { hijo = { titulo: u, hijos: [], articulos: [] }; nodo.hijos.push(hijo); vistos.set(clave, hijo); }
        nodo = hijo;
      }
      nodo.articulos.push(a.n);
    }
    return raizArbol;
  }
  const totalArticulos = nodo => nodo.articulos.length + nodo.hijos.reduce((s, h) => s + totalArticulos(h), 0);
  // Artículos de definiciones («se entenderá por: Término: definición. Otro: …»): un párrafo por término.
  // Regla conservadora: solo tras «por:», con términos que empiezan en mayúscula y no pasan de 80 caracteres sin signos.
  function dividirDefiniciones(texto) {
    const m = /^([\s\S]{0,240}?\bpor:)\s+([\s\S]+)$/.exec(String(texto || ''));
    if (!m) return null;
    const partes = m[2].replace(/([.;])\s+(?=[A-ZÁÉÍÓÚÑ][^.:;•]{0,80}?:\s)/g, '$1\u0001').split('\u0001');
    const definiciones = partes.map(p => /^([A-ZÁÉÍÓÚÑ][^.:;•]{0,79}?):\s+(\S[\s\S]*)$/.exec(p.trim())).map(x => x && { termino: x[1], texto: x[2] });
    return partes.length >= 3 && definiciones.every(Boolean) ? { intro: m[1], definiciones } : null;
  }
  // Un artículo en bloques: texto previo, fracciones (con sus incisos) o definiciones; nada se reescribe, solo se parte.
  function partesArticulo(a) {
    const frs = (a && a.fracciones) || [], texto = String((a && a.texto) || '');
    const inicio = frs.length ? Math.max(...['. ', '.- '].map(sep => texto.indexOf(frs[0].fr + sep + frs[0].texto))) : -1;
    if (inicio >= 0) {
      return { intro: texto.slice(0, inicio).trim(), definiciones: null, fracciones: frs.map(f => {
        const corte = f.incisos && f.incisos.length ? f.texto.indexOf(' ' + f.incisos[0].inciso + ') ') : -1;
        return corte >= 0 ? { fr: f.fr, texto: f.texto.slice(0, corte).trim(), incisos: f.incisos } : { fr: f.fr, texto: f.texto, incisos: [] };
      }) };
    }
    const d = frs.length ? null : dividirDefiniciones(texto);
    return d ? { intro: d.intro, definiciones: d.definiciones, fracciones: [] } : { intro: texto, definiciones: null, fracciones: [] };
  }
  // Artículos que contienen todas las palabras (o cuyo número empieza como lo escrito); primero el número exacto.
  function buscarArticulos(reg, q, maximo) {
    const ts = terminos(q), num = norm(q).trim();
    if (!ts.length) return [];
    const r = [];
    for (const a of (reg && reg.articulos) || []) {
      const n = norm(a.n), exacto = n === num;
      if (exacto || (/^\d/.test(num) && n.startsWith(num)) || (!/^\d+$/.test(num) && ts.every(w => norm(a.texto + ' ' + (a.ubicacion || []).join(' ')).includes(w)))) r.push({ a, peso: exacto ? 0 : 1 });
    }
    return r.sort((x, y) => x.peso - y.peso).slice(0, maximo || 40).map(x => x.a);
  }
  // Preguntas de la Guía que citan cada artículo (fuente con artículos o marca [[a:doc:n|…]]) y los trámites de SATE a los que remiten.
  const indicesCitas = new WeakMap();
  function citasPorArticulo(d) {
    if (indicesCitas.has(d)) return indicesCitas.get(d);
    const indice = new Map(), marca = /\[\[a:([\w-]+):([\w -]+)\|/g;
    const agregar = (doc, n, p) => { const k = doc + ':' + n, l = indice.get(k) || []; if (!l.includes(p)) l.push(p); indice.set(k, l); };
    for (const p of (d && d.preguntas) || []) {
      for (const f of p.fuentes || []) for (const n of f.arts || []) agregar(f.doc, n, p);
      for (const texto of [p.respuesta, ...(p.pasos || [])]) { marca.lastIndex = 0; let m; while ((m = marca.exec(texto || ''))) agregar(m[1], m[2], p); }
    }
    indicesCitas.set(d, indice);
    return indice;
  }
  function relacionesArticulo(d, doc, n, tramitesUnidad) {
    const preguntas = (d && citasPorArticulo(d).get(doc + ':' + n)) || [], disponibles = tramitesUnidad || [];
    return { preguntas, tramites: [...new Set(preguntas.map(p => p.ventanilla).filter(v => v && disponibles.includes(v)))] };
  }
  raiz.SateGuia = { norm, terminos, buscarPreguntas, apartadosDisponibles, fuente, enlace, marcas, anclaArticulo, leerAncla, arbolReglamento, partesArticulo, dividirDefiniciones, buscarArticulos, relacionesArticulo };

  if (typeof raiz.SATE === 'undefined' || typeof raiz.SATE_CONFIG === 'undefined' || typeof document === 'undefined') return;

  /* ===================== B. Integración con SATE ===================== */
  const t = (c, v) => SATE.texto(c, v);
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
  const unidad = () => raiz.SATE_UNIDAD;
  const cfg = () => SATE_CONFIG.unidades[unidad()] || {};
  const E = { datos: new Map(), reglamentos: new Map() };
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
    for (const archivo of ['guia.css', 'temarios.css', '../policore/lector.css']) {
      const href = BASE + archivo;
      if ([...document.querySelectorAll('link[data-tmr-css]')].some(l => l.getAttribute('href') === href)) continue;
      document.head.appendChild(h('link', { rel: 'stylesheet', href, 'data-tmr-css': '' }));
    }
  }
  cargarCss();

  function datos() {
    const u = unidad();
    if (E.datos.has(u)) return E.datos.get(u);
    const promesa = (SATE.json ? SATE.json('datos/' + u + '/guia.json') : fetch('datos/' + u + '/guia.json').then(r => {
      if (!r.ok) throw new Error('datos/' + unidad() + '/guia.json: HTTP ' + r.status);
      return r.json();
    })).catch(e => { E.datos.delete(u); throw e; });
    E.datos.set(u, promesa);
    return promesa;
  }
  function cargarReglamento(doc) {
    if (!/^[\w-]+$/.test(doc)) return Promise.reject(new Error('Documento inválido: ' + doc));
    if (!E.reglamentos.has(doc)) E.reglamentos.set(doc, fetch('datos/reglamentos/' + doc + '.json').then(r => {
      if (!r.ok) throw new Error('Reglamento ' + doc + ': HTTP ' + r.status);
      return r.json();
    }).catch(e => { E.reglamentos.delete(doc); throw e; }));
    return E.reglamentos.get(doc);
  }
  function botonArticulo(doc, n, texto) {
    const b = h('button', { type: 'button', 'class': 'guia-enlace', texto });
    b.addEventListener('click', () => SATE.articulo(doc, n));
    return b;
  }
  function enLinea(texto, d) {
    return marcas(String(texto || '').replace(/\{unidad\}/g, () => cfg().siglas || unidad())).map(p => {
      if (p.tipo === 'a') return botonArticulo(p.clave, p.n, p.texto);
      if (p.tipo === 'g' && d.glosario?.[p.clave]) {
        const g = d.glosario[p.clave];
        return SateUI.definicion(p.texto, g.termino, g.definicion);
      }
      return document.createTextNode(p.texto);
    });
  }
  SATE.articulo = async function (doc, n) {
    // La lectura literal también funciona desde otra vista si no se pudo cargar la Guía.
    const d = await datos().catch(e => {
      console.warn('SATE: metadatos del artículo no disponibles', { doc, n, mensaje: e.message });
      return {};
    }), meta = d.documentos?.[doc] || {};
    let reg, error;
    try { reg = await cargarReglamento(doc); } catch (e) {
      error = e;
      console.warn('SATE: artículo no disponible', { doc, n, mensaje: e.message });
    }
    const a = !reg?.sin_texto && reg?.articulos?.find(x => String(x.n) === String(n));
    const inicioFracciones = a?.fracciones?.length ? a.texto.indexOf(a.fracciones[0].fr + '. ' + a.fracciones[0].texto) : -1;
    const cuerpo = h('div', { 'class': 'guia-articulo' }, a ? [
      h('p', { texto: (a.ubicacion || []).join(' · ') }),
      h('div', { 'class': 'pc-lector pc-oficial' }, [h('p', { texto: inicioFracciones >= 0 ? a.texto.slice(0, inicioFracciones) : a.texto }),
        a.fracciones?.length ? h('ol', { 'class': 'rgl-fracciones' }, a.fracciones.map(f => h('li', { 'class': 'rgl-fr' }, [h('span', { 'class': 'rgl-marca', texto: f.fr + '.' }), ' ', h('div', { texto: f.texto })]))) : null])
    ] : [h('p', { role: 'status', texto: t(error ? 'sate.guia.error_articulo' : 'sate.guia.sin_articulo') })]);
    if (a && reg.ocr) cuerpo.appendChild(h('p', { 'class': 'guia-aviso-ocr', texto: t('sate.guia.aviso_ocr') }));
    const leer = h('a', { href: rutaReglamento(doc, 'art-' + n), texto: t('sate.guia.leer_reglamento') });
    leer.addEventListener('click', () => SateUI.cerrarModal());
    cuerpo.appendChild(leer);
    const url = reg?.url || meta.url;
    if (url) cuerpo.appendChild(enlaceExterno('', url, t('sate.guia.pdf_oficial')));
    return SateUI.modal(t('sate.guia.articulo_titulo', { n, reglamento: reg?.titulo || meta.titulo || doc }), cuerpo);
  };
  const apartados = () => apartadosDisponibles(SATE_CONFIG.guia, cfg());
  const infoApartado = id => (SATE_CONFIG.guia || []).find(a => a.id === id);
  const tituloApartado = id => t(infoApartado(id).titulo);
  const rutaGuia = (...p) => enlace(unidad(), ...p);
  const rutaReglamento = (doc, ancla) => rutaGuia('reglamentos', doc) + (ancla ? '/' + encodeURIComponent(ancla) : '');
  const fechaRevision = d => { try { return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { dateStyle: 'long' }); } catch (e) { return d; } };

  function cabecera(migas, titulo, intro) {
    const hh = h('h2', { texto: titulo, tabindex: '-1' });
    return { nodo: h('header', { 'class': 'guia-cab' }, [SateUI.migas(migas), hh, intro ? h('p', { 'class': 'tmr-intro', texto: intro }) : null]), titulo: hh };
  }
  const migasBase = () => [{ texto: t('sate.pestana.guia.titulo'), href: rutaGuia() }];
  function enlaceExterno(clase, href, texto) {
    return h('a', { 'class': clase, href, target: '_blank', rel: 'noopener noreferrer', texto: texto + ' ↗' });
  }
  const conteo = (apartado, d) => {
    const a = infoApartado(apartado);
    if (a.datos === 'documentos') return t('sate.guia.detalle_documentos', { n: Object.values(d.documentos).filter(x => x.reglamento).length });
    if (a.datos === 'acudir') return t('sate.guia.detalle_instancias', { n: d.acudir.length });
    return t('sate.guia.detalle_preguntas', { n: d.preguntas.filter(p => p.apartado === apartado).length });
  };

  /* ---------- portada ---------- */
  function buscadorGlobal(d) {
    const lista = h('ul', { 'class': 'guia-resultados', id: 'guia-res', hidden: true });
    const aviso = h('p', { 'class': 'sate-sr', role: 'status', 'aria-live': 'polite' });
    let primero = null;
    const buscar = SateUI.buscador({ etiqueta: t('sate.guia.buscar_guia_etiqueta'), marcador: t('sate.guia.buscar_guia_marcador'), id: 'guia-q', alCambiar: pintar,
      alEnviar: () => { if (primero) raiz.location.hash = primero.getAttribute('href'); } });
    function pintar() {
      const q = buscar.entrada.value;
      primero = null;
      if (!terminos(q).length) { lista.hidden = true; lista.replaceChildren(); aviso.textContent = ''; return; }
      const r = buscarPreguntas(d.preguntas, q);
      lista.hidden = false;
      lista.replaceChildren(...(r.length ? r.slice(0, 8).map(p => {
        const a = h('a', { 'class': 'guia-resultado', href: rutaGuia(p.apartado, p.id) }, [h('span', { texto: p.pregunta }), h('small', { texto: tituloApartado(p.apartado) })]);
        primero ||= a;
        return h('li', {}, [a]);
      }) : [h('li', { 'class': 'guia-vacio', texto: t('sate.guia.sin_resultados_preguntas') })]));
      aviso.textContent = t('sate.guia.resultados_preguntas', { n: r.length });
    }
    return h('section', { 'class': 'guia-buscar', 'aria-label': t('sate.guia.buscar_guia_etiqueta') }, [
      h('label', { 'for': 'guia-q', texto: t('sate.guia.buscar_guia_etiqueta') }), buscar.raiz, aviso, lista]);
  }
  function tarjetasApartados(d) {
    return h('ul', { 'class': 'sate-tarjetas-nav', 'aria-label': t('sate.guia.apartados_etiqueta') }, apartados().map(a => {
      const detalle = a.vista ? t(a.descripcion) : t('sate.guia.tarjeta_detalle', { descripcion: t(a.descripcion), conteo: conteo(a.id, d) });
      return h('li', {}, [SateUI.tarjetaNav({ href: rutaGuia(a.id), titulo: t(a.titulo), detalle, icono: a.icono })]);
    }));
  }
  function seccionProximamente() {
    const resto = (SATE_CONFIG.guia || []).filter(a => a.pronto && a.descripcion && t(a.descripcion).trim());
    if (!resto.length) return null;
    return h('section', { 'class': 'guia-pronto', 'aria-label': t('sate.guia.proximamente') }, [
      h('h3', { texto: t('sate.guia.proximamente') }),
      h('ul', {}, resto.map(a => h('li', {}, [h('span', { 'aria-hidden': 'true', texto: a.icono }), h('span', {}, [h('strong', { texto: t(a.titulo) }), h('small', { texto: t(a.descripcion) })])])))]);
  }
  async function portada(raizGuia) {
    const cab = h('header', { 'class': 'guia-cab' }, [h('h2', { texto: t('sate.pestana.guia.titulo'), tabindex: '-1' }), h('p', { 'class': 'tmr-intro', texto: t('sate.guia.intro') })]);
    raizGuia.appendChild(cab);
    const pronto = seccionProximamente();
    if (!cfg().guiaDatos) {
      // Sin datos de la Guía (otra unidad): solo lo que tenga, como los programas de estudio.
      const lista = apartados();
      raizGuia.appendChild(lista.length
        ? h('ul', { 'class': 'sate-tarjetas-nav', 'aria-label': t('sate.guia.apartados_etiqueta') }, lista.map(a => h('li', {}, [SateUI.tarjetaNav({ href: rutaGuia(a.id), titulo: t(a.titulo), detalle: t(a.descripcion), icono: a.icono })])))
        : h('p', { 'class': 'tmr-vacio', texto: t('sate.guia.sin_datos') }));
      if (pronto) raizGuia.appendChild(pronto);
      return cab.querySelector('h2');
    }
    const d = await datos();
    raizGuia.appendChild(buscadorGlobal(d));
    raizGuia.appendChild(tarjetasApartados(d));
    raizGuia.appendChild(h('p', { 'class': 'tmr-nota', texto: t('sate.guia.nota_fuentes') }));
    if (pronto) raizGuia.appendChild(pronto);
    return cab.querySelector('h2');
  }

  /* ---------- una respuesta ---------- */
  function respuesta(d, p) {
    const acudir = (p.acudir || []).map(id => d.acudir.find(a => a.id === id)).filter(Boolean);
    const formato = p.formato ? (p.formato.url ? p.formato : p.formato.doc ? { texto: p.formato.texto, url: d.documentos[p.formato.doc]?.url } : null) : null;
    const tramite = p.ventanilla && cfg().tramites && cfg().tramites.includes(p.ventanilla) ? p.ventanilla : null;
    const fuentes = (p.fuentes || []).map(f => fuente(d, f, t)).filter(Boolean);
    const partes = [
      h('p', { 'class': 'guia-respuesta' }, enLinea(p.respuesta, d)),
      (p.pasos || []).length ? h('section', { 'class': 'guia-bloque' }, [h('h4', { texto: t('sate.guia.que_hacer') }), h('ol', { 'class': 'guia-pasos' }, p.pasos.map(x => h('li', {}, [h('span', {}, enLinea(x, d))])))]) : null,
      acudir.length ? h('section', { 'class': 'guia-bloque' }, [h('h4', { texto: t('sate.guia.a_quien') }), h('ul', { 'class': 'guia-acudir' }, acudir.map(a => h('li', {}, [h('a', { href: rutaGuia('acudir', a.id), texto: a.nombre })])))]) : null,
      formato && formato.url || tramite ? h('section', { 'class': 'guia-bloque guia-acciones' }, [
        tramite ? SateUI.tarjetaNav({ href: '#/' + unidad() + '/tramites/' + tramite, titulo: t('sate.guia.en_ventanilla'), detalle: t('sate.tramite.' + tramite + '.titulo'), compacta: true }) : null,
        formato && formato.url ? SateUI.tarjetaNav({ href: formato.url, titulo: t('sate.guia.formato_titulo'), detalle: formato.texto, externo: true, compacta: true }) : null]) : null,
      h('footer', { 'class': 'guia-pie' }, [
        h('strong', { texto: t('sate.guia.fuentes_titulo', { n: fuentes.length }) }),
        h('ul', { 'class': 'guia-fuentes' }, fuentes.map(f => h('li', {}, [enlaceExterno('', f.url, f.texto), ...f.arts.map(n => botonArticulo(f.doc, n, t('sate.guia.articulo_rotulo', { n })))]))),
        h('span', { texto: t('sate.guia.revisado', { fecha: fechaRevision(d.revisado) }) })])
    ];
    const frag = document.createDocumentFragment();
    for (const x of partes) if (x) frag.appendChild(x);
    return frag;
  }

  /* ---------- apartado de preguntas ---------- */
  function apartadoPreguntas(raizGuia, d, apartado, abrirId) {
    const todas = d.preguntas.filter(p => p.apartado === apartado);
    const cab = cabecera([...migasBase(), { texto: tituloApartado(apartado) }], tituloApartado(apartado), t('sate.guia.' + apartado + '_intro'));
    const lista = h('ul', { 'class': 'sate-preguntas' });
    const resumen = h('p', { 'class': 'guia-resumen', role: 'status', 'aria-live': 'polite' });
    const items = new Map();
    const buscar = SateUI.buscador({ etiqueta: t('sate.guia.buscar_apartado_etiqueta'), marcador: t('sate.guia.buscar_apartado_marcador'), id: 'guia-qa', alCambiar: filtrar });
    function ruta(id) { try { history.replaceState(null, '', raiz.location.pathname + raiz.location.search + rutaGuia(apartado, id)); } catch (e) {} }
    for (const p of todas) {
      const det = SateUI.pregunta({ id: 'p-' + p.id, titulo: p.pregunta, cuerpo: () => respuesta(d, p),
        alAbrir: () => ruta(p.id) });
      det.addEventListener('toggle', () => { if (!det.open && raiz.location.hash === rutaGuia(apartado, p.id)) ruta(); });
      const li = h('li', {}, [det]);
      items.set(p.id, { li, det, p });
      lista.appendChild(li);
    }
    function filtrar() {
      const q = buscar.entrada.value, coinciden = terminos(q).length ? new Set(buscarPreguntas(todas, q).map(p => p.id)) : null;
      for (const { li, p } of items.values()) li.hidden = !!coinciden && !coinciden.has(p.id);
      const n = coinciden ? coinciden.size : todas.length;
      resumen.textContent = n ? t('sate.guia.resultados_preguntas', { n }) : t('sate.guia.sin_resultados_preguntas');
    }
    filtrar();
    raizGuia.append(cab.nodo, h('div', { 'class': 'guia-apartado' }, [
      h('div', { 'class': 'guia-buscar' }, [h('label', { 'for': 'guia-qa', texto: t('sate.guia.buscar_apartado_etiqueta') }), buscar.raiz]), resumen, lista]));
    if (abrirId) {
      const x = items.get(abrirId);
      if (x) { x.det.open = true; return { titulo: cab.titulo, destino: x.det }; }
      raizGuia.querySelector('.guia-apartado').prepend(h('p', { 'class': 'tmr-nota', role: 'status', texto: t('sate.guia.no_encontrada') }));
    }
    return { titulo: cab.titulo };
  }

  /* ---------- reglamentos ---------- */
  let limpiarLector = null;
  const apagarLector = () => { if (limpiarLector) { limpiarLector(); limpiarLector = null; } };
  const pantallaChica = () => !!(raiz.matchMedia && raiz.matchMedia('(max-width:768.98px)').matches);
  function copiarEnlace(href) {
    const url = new URL(href, raiz.location.href).href;
    if (raiz.navigator?.clipboard?.writeText) return raiz.navigator.clipboard.writeText(url);
    return Promise.reject(new Error('Sin portapapeles'));
  }
  // Lector de tres paneles: índice del reglamento | texto de un artículo | trámites y preguntas que lo citan.
  function montarReglamento(raizGuia, d, reg, doc, ancla) {
    const cab = cabecera([...migasBase(), { texto: tituloApartado('reglamentos'), href: rutaGuia('reglamentos') }, { texto: reg.titulo }], reg.titulo, reg.gaceta);
    const articulos = reg.sin_texto ? [] : reg.articulos || [], transitorios = reg.sin_texto ? [] : reg.transitorios || [];
    const fuenteDoc = reg.url ? h('p', { 'class': 'rgl-fuente' }, [enlaceExterno('', reg.url, t('sate.guia.pdf_oficial'))]) : null;
    const avisoOcr = reg.ocr && !reg.sin_texto ? h('p', { 'class': 'guia-aviso-ocr', texto: t('sate.guia.aviso_ocr') }) : null;
    if (!articulos.length && !transitorios.length) {
      // Sin articulado (código, lineamientos escaneados): el texto corrido, sin índice.
      const lineas = !reg.sin_texto && reg.texto ? String(reg.texto).split(/\n+/).filter(Boolean) : [];
      raizGuia.append(cab.nodo, h('div', { 'class': 'guia-apartado' }, [avisoOcr, lineas.length
        ? h('div', { 'class': 'rgl-cuerpo pc-lector pc-oficial', 'data-ancla': 'texto' }, lineas.map(x => h('p', { texto: x })))
        : h('p', { role: 'status', texto: t('sate.guia.sin_articulo') }), fuenteDoc]));
      return { titulo: cab.titulo };
    }
    const posicion = new Map(articulos.map((a, i) => [a.n, i]));
    const arbol = arbolReglamento(reg), tramites = cfg().tramites || [];
    const grupos = new Map(), enlaces = new Map();     // artículo -> grupos que lo contienen / enlace del índice
    const enlaceAncla = (clase, anclaDe, contenido, extra) => h('a', { 'class': clase, href: rutaReglamento(doc, anclaDe), 'data-ancla': anclaDe, ...extra }, contenido);
    const chip = (n, ancestros) => {
      const a = enlaceAncla('rgl-art', anclaArticulo(n), t('sate.guia.rgl_art_corto', { n }));
      enlaces.set(n, a);
      grupos.set(n, ancestros);
      return h('li', {}, [a]);
    };
    function nodoArbol(nodo, ancestros) {
      const det = h('details', { 'class': 'rgl-grupo' }), cuerpo = h('div', { 'class': 'rgl-grupo__cuerpo' });
      const propios = [...ancestros, det];
      for (const hijo of nodo.hijos) cuerpo.appendChild(nodoArbol(hijo, propios));
      if (nodo.articulos.length) cuerpo.appendChild(h('ul', { 'class': 'rgl-arts' }, nodo.articulos.map(n => chip(n, propios))));
      det.append(h('summary', {}, [h('span', { texto: nodo.titulo }), h('small', { texto: String(totalArticulos(nodo)) })]), cuerpo);
      return det;
    }
    const arbolNav = h('div', { 'class': 'rgl-arbol' }, arbol.hijos.map(x => nodoArbol(x, [])));
    if (arbol.articulos.length) arbolNav.appendChild(h('ul', { 'class': 'rgl-arts' }, arbol.articulos.map(n => chip(n, []))));
    const enlaceTransitorios = transitorios.length ? enlaceAncla('rgl-art rgl-art--ancho', 'transitorios', t('sate.guia.transitorios')) : null;
    if (enlaceTransitorios) arbolNav.appendChild(h('ul', { 'class': 'rgl-arts' }, [h('li', {}, [enlaceTransitorios])]));

    const resultados = h('ul', { 'class': 'rgl-resultados', hidden: true });
    const aviso = h('p', { 'class': 'sate-sr', role: 'status', 'aria-live': 'polite' });
    let primero = null;
    const buscar = SateUI.buscador({ etiqueta: t('sate.guia.rgl_buscar_etiqueta'), marcador: t('sate.guia.rgl_buscar_marcador'), id: 'rgl-q',
      alCambiar: q => {
        const hay = terminos(q).length > 0, r = hay ? buscarArticulos(reg, q, 40) : [];
        primero = r[0] ? anclaArticulo(r[0].n) : null;
        arbolNav.hidden = hay;
        resultados.hidden = !hay;
        resultados.replaceChildren(...r.map(a => h('li', {}, [enlaceAncla('rgl-resultado', anclaArticulo(a.n), [h('strong', { texto: t('sate.guia.rgl_art_corto', { n: a.n }) }), h('span', { texto: a.texto.slice(0, 90) })])])));
        aviso.textContent = hay ? t('sate.guia.rgl_resultados', { n: r.length }) : '';
      },
      alEnviar: () => { if (primero) ir(primero, true); } });
    const resumen = h('span', { 'class': 'rgl-resumen__actual' });
    const cuerpoIndice = h('div', { 'class': 'rgl-indice__cuerpo' }, [h('div', { 'class': 'rgl-buscar' }, [buscar.raiz]), aviso, resultados, arbolNav]);
    const indice = h('details', { 'class': 'rgl-indice', open: true }, [h('summary', { 'class': 'rgl-resumen' }, [h('span', { texto: t('sate.guia.rgl_indice') }), resumen]), cuerpoIndice]);
    const texto = h('article', { 'class': 'rgl-texto', 'aria-label': reg.titulo });
    const riel = h('aside', { 'class': 'rgl-riel', 'aria-label': t('sate.guia.rgl_contexto') });
    const rejilla = h('div', { 'class': 'rgl' }, [indice, texto, riel]);
    if (fuenteDoc || avisoOcr) cab.nodo.appendChild(h('div', { 'class': 'rgl-datos' }, [fuenteDoc, avisoOcr]));
    raizGuia.append(cab.nodo, rejilla);

    let actual = null, mensaje = null, temporizador = 0, enlaceActual = '';
    function fila(clase, marca, anclaDe, etiqueta, contenido) {
      return h('li', { 'class': clase, 'data-ancla': anclaDe }, [enlaceAncla('rgl-marca', anclaDe, marca, { 'aria-label': etiqueta }), h('div', {}, contenido)]);
    }
    function cuerpoArticulo(a) {
      const p = partesArticulo(a), nodos = [];
      if (p.intro) nodos.push(h('p', { texto: p.intro }));
      if (p.definiciones) nodos.push(h('dl', { 'class': 'rgl-definiciones' }, p.definiciones.map(x => h('div', {}, [h('dt', { texto: x.termino }), h('dd', { texto: x.texto })]))));
      if (p.fracciones.length) nodos.push(h('ol', { 'class': 'rgl-fracciones' }, p.fracciones.map(f => fila('rgl-fr', f.fr + '.', anclaArticulo(a.n, f.fr), t('sate.guia.rgl_enlace_fraccion', { fr: f.fr }), [
        h('p', { texto: f.texto }),
        f.incisos.length ? h('ol', { 'class': 'rgl-incisos' }, f.incisos.map(x => fila('rgl-inc', x.inciso + ')', anclaArticulo(a.n, f.fr, x.inciso), t('sate.guia.rgl_enlace_inciso', { inciso: x.inciso }), [h('p', { texto: x.texto })]))) : null]))));
      return h('div', { 'class': 'rgl-cuerpo pc-lector pc-oficial' }, nodos);
    }
    const rotuloArticulo = a => ({ ancla: anclaArticulo(a.n), rotulo: t('sate.guia.articulo_rotulo', { n: a.n }) });
    function paginas(antes, despues) {
      const enlace = (x, clase, ref) => x ? enlaceAncla('rgl-pagina ' + clase, x.ancla, [h('small', { texto: ref }), h('span', { texto: x.rotulo })]) : h('span');
      return h('nav', { 'class': 'rgl-paginas', 'aria-label': t('sate.guia.rgl_indice') }, [enlace(antes, 'rgl-pagina--antes', t('sate.guia.rgl_anterior')), enlace(despues, 'rgl-pagina--despues', t('sate.guia.rgl_siguiente'))]);
    }
    function copiar() {
      const avisar = clave => { if (mensaje) { mensaje.textContent = t(clave); raiz.clearTimeout(temporizador); temporizador = raiz.setTimeout(() => { mensaje.textContent = ''; }, 2500); } };
      Promise.resolve().then(() => copiarEnlace(enlaceActual)).then(() => avisar('sate.guia.rgl_copiado'), () => avisar('sate.guia.rgl_copiar_error'));
    }
    function cabeceraTexto(rotulo, ubicacion) {
      const boton = h('button', { type: 'button', 'class': 'btn rgl-copiar', texto: t('sate.guia.rgl_copiar') });
      boton.addEventListener('click', copiar);
      mensaje = h('span', { 'class': 'rgl-copiado', role: 'status', 'aria-live': 'polite' });
      return h('header', { 'class': 'rgl-cab' }, [h('div', {}, [ubicacion ? h('p', { 'class': 'rgl-ubicacion', texto: ubicacion }) : null, h('h3', { tabindex: '-1', texto: rotulo })]), h('div', { 'class': 'rgl-acciones' }, [boton, mensaje])]);
    }
    function pintarRiel(a) {
      const rel = a ? relacionesArticulo(d, doc, a.n, tramites) : { preguntas: [], tramites: [] };
      const bloques = [];
      if (rel.tramites.length) bloques.push(h('section', {}, [h('h4', { texto: t('sate.guia.rgl_tramites') }), h('ul', {}, rel.tramites.map(id => h('li', {}, [h('a', { href: '#/' + unidad() + '/tramites/' + id, texto: t('sate.tramite.' + id + '.titulo') })])))]));
      if (rel.preguntas.length) bloques.push(h('section', {}, [h('h4', { texto: t('sate.guia.rgl_preguntas') }), h('ul', {}, rel.preguntas.map(p => h('li', {}, [h('a', { href: rutaGuia(p.apartado, p.id), texto: p.pregunta })])))]));
      riel.replaceChildren(...bloques);
      riel.hidden = !bloques.length;
      rejilla.classList.toggle('rgl--sin-riel', !bloques.length);
    }
    function marcarIndice(clave) {
      for (const [n, a] of enlaces) { if (n === clave) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }
      if (enlaceTransitorios) { if (clave === 'transitorios') enlaceTransitorios.setAttribute('aria-current', 'true'); else enlaceTransitorios.removeAttribute('aria-current'); }
      for (const g of grupos.get(clave) || []) g.open = true;
      // Con el índice abierto, el artículo actual queda a la vista dentro de su propio desplazamiento.
      const activo = clave === 'transitorios' ? enlaceTransitorios : enlaces.get(clave), r = cuerpoIndice.getBoundingClientRect();
      if (activo && indice.open && r.height) { const a = activo.getBoundingClientRect(); if (a.top < r.top || a.bottom > r.bottom) cuerpoIndice.scrollTop += a.top - r.top - r.height / 3; }
    }
    // Pinta un artículo (o los transitorios).
    function pintar(clave) {
      if (clave === 'transitorios') {
        const rotulo = t('sate.guia.transitorios');
        texto.replaceChildren(cabeceraTexto(rotulo, ''),
          h('div', { 'class': 'rgl-cuerpo pc-lector pc-oficial' }, [h('ol', { 'class': 'rgl-fracciones' }, transitorios.map(x => h('li', { 'class': 'rgl-fr' }, [h('span', { 'class': 'rgl-marca', texto: x.n + '.' }), h('div', {}, [h('p', { texto: x.texto })])])))]),
          paginas(articulos.length ? rotuloArticulo(articulos[articulos.length - 1]) : null, null));
        pintarRiel(null);
        resumen.textContent = rotulo;
      } else {
        const i = posicion.get(clave), a = articulos[i];
        texto.replaceChildren(cabeceraTexto(t('sate.guia.articulo_rotulo', { n: a.n }), (a.ubicacion || []).join(' · ')), cuerpoArticulo(a),
          paginas(i > 0 ? rotuloArticulo(articulos[i - 1]) : null, i < articulos.length - 1 ? rotuloArticulo(articulos[i + 1]) : transitorios.length ? { ancla: 'transitorios', rotulo: t('sate.guia.transitorios') } : null));
        pintarRiel(a);
        resumen.textContent = t('sate.guia.rgl_art_corto', { n: a.n });
      }
      marcarIndice(clave);
      actual = clave;
    }
    // Muestra el artículo o la fracción de un ancla; sin ancla válida, el primer artículo. Devuelve el nodo de la fracción, si hay.
    function ir(anclaDestino, empujar) {
      const p = leerAncla(anclaDestino);
      const clave = anclaDestino === 'transitorios' && transitorios.length ? 'transitorios' : p && posicion.has(p.n) ? p.n : articulos.length ? articulos[0].n : 'transitorios';
      const cambio = clave !== actual;
      if (cambio) pintar(clave);
      const final = p && clave === p.n && p.fr ? anclaArticulo(p.n, p.fr, p.inciso) : clave === 'transitorios' ? 'transitorios' : anclaArticulo(clave);
      const fr = final.includes('.') ? Array.from(texto.querySelectorAll('li[data-ancla]')).find(x => x.getAttribute('data-ancla') === final) : null;
      for (const x of texto.querySelectorAll('.rgl-activa')) x.classList.remove('rgl-activa');
      if (fr) fr.classList.add('rgl-activa');
      enlaceActual = rutaReglamento(doc, fr ? final : clave === 'transitorios' ? clave : anclaArticulo(clave));
      if (empujar) {
        try { history[cambio ? 'pushState' : 'replaceState'](null, '', enlaceActual); } catch (e) { /* sin historial */ }
        if (indice.open && pantallaChica()) indice.open = false;
        if (fr) SateUI.revelar(fr);
        else if (cambio) { const r = texto.getBoundingClientRect(); if (r.top < 0 && texto.scrollIntoView) texto.scrollIntoView({ block: 'start' }); }
      }
      return fr;
    }
    rejilla.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[data-ancla]');
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button) return;
      e.preventDefault();
      ir(a.getAttribute('data-ancla'), true);
    });
    const consulta = raiz.matchMedia ? raiz.matchMedia('(max-width:768.98px)') : null;
    const ajustar = () => { indice.open = !(consulta && consulta.matches); };
    if (consulta?.addEventListener) consulta.addEventListener('change', ajustar);
    ajustar();
    limpiarLector = () => { if (consulta?.removeEventListener) consulta.removeEventListener('change', ajustar); raiz.clearTimeout(temporizador); };
    const fr = ir(ancla && ancla !== 'texto' ? ancla : '', false);
    if (fr) SateUI.revelar(fr);
    return { titulo: cab.titulo, enDocumento: !!fr };
  }
  async function apartadoReglamentos(raizGuia, d, doc, ancla, vigente) {
    if (doc) {
      const reg = await cargarReglamento(doc);
      if (!vigente()) return {};
      return montarReglamento(raizGuia, d, reg, doc, ancla);
    }
    const cab = cabecera([...migasBase(), { texto: tituloApartado('reglamentos') }], tituloApartado('reglamentos'), t('sate.guia.reglamentos_intro'));
    const indice = await cargarReglamento('indice');
    const docs = Object.entries(d.documentos).filter(([, x]) => x.reglamento).map(([id, x]) => ({ id, ...x }));
    const lista = h('ul', { 'class': 'sate-tarjetas-nav' }, docs.map(x => h('li', {}, [
      SateUI.tarjetaNav({ href: rutaGuia('reglamentos', x.id), titulo: x.titulo, detalle: [t('sate.guia.numero_articulos', { n: indice.find(i => i.id === x.id)?.articulos ?? 0 }), x.gaceta, x.resumen].filter(Boolean).join('. ') })])));
    const portal = d.documentos.normatividad;
    raizGuia.append(cab.nodo, h('div', { 'class': 'guia-apartado' }, [h('a', { href: rutaGuia('glosario'), texto: t('sate.guia.glosario') }), lista, portal ? enlaceExterno('guia-portal sate-enlace', portal.url, t('sate.guia.normatividad_portal')) : null]));
    return { titulo: cab.titulo };
  }
  function apartadoGlosario(raizGuia, d) {
    const cab = cabecera([...migasBase(), { texto: t('sate.guia.glosario') }], t('sate.guia.glosario'));
    const lista = h('dl', { 'class': 'guia-glosario' });
    const entradas = Object.values(d.glosario || {}).sort((a, b) => a.termino.localeCompare(b.termino, 'es'));
    function pintar(q) {
      lista.replaceChildren(...entradas.filter(g => norm(g.termino + ' ' + g.definicion).includes(norm(q))).map(g => {
        const f = fuente(d, g.fuente, t);
        return h('div', {}, [h('dt', { texto: g.termino }), h('dd', {}, [h('p', { texto: g.definicion }), f ? enlaceExterno('', f.url, f.texto) : null, ...(f?.arts || []).map(n => botonArticulo(f.doc, n, t('sate.guia.articulo_rotulo', { n })))])]);
      }));
    }
    const buscar = SateUI.buscador({ etiqueta: t('sate.guia.buscar_glosario'), marcador: t('sate.guia.buscar_glosario'), alCambiar: pintar });
    pintar('');
    raizGuia.append(cab.nodo, buscar.raiz, lista);
    return { titulo: cab.titulo };
  }
  function apartadoAcudir(raizGuia, d, abrirId) {
    const cab = cabecera([...migasBase(), { texto: tituloApartado('acudir') }], tituloApartado('acudir'), t('sate.guia.acudir_intro'));
    const items = new Map();
    const lista = h('ul', { 'class': 'guia-lista-acudir' }, d.acudir.map(a => {
      const f = fuente(d, a.fuente, t);
      // Las marcas pueden contener abreviaturas (art.); la oración se corta solo fuera de ellas.
      const oracion = a.para.match(/^(?:\[\[[\s\S]*?\]\]|[^.!?])*[.!?](?=\s|$)/);
      const inicio = oracion ? oracion[0] : a.para, resto = a.para.slice(inicio.length);
      const li = h('li', { id: 'acudir-' + a.id }, [h('h3', { texto: a.nombre }), h('p', {}, enLinea(inicio, d)),
        h('details', {}, [h('summary', { texto: t('sate.guia.funciones_manual') }), resto ? h('p', {}, enLinea(resto, d)) : null,
          f ? h('small', {}, [enlaceExterno('', f.url, f.texto)]) : null])]);
      items.set(a.id, li);
      return li;
    }));
    const grupos = ['unidad', 'ipn'].map(ambito => {
      const elementos = d.acudir.filter(a => (a.ambito || 'unidad') === ambito).map(a => items.get(a.id));
      return elementos.length ? h('section', {}, [h('h3', { texto: t('sate.guia.acudir_' + ambito) }), h('ul', { 'class': 'guia-lista-acudir' }, elementos)]) : null;
    });
    raizGuia.append(cab.nodo, h('div', { 'class': 'guia-apartado' }, grupos));
    return { titulo: cab.titulo, destino: abrirId ? items.get(abrirId) : null };
  }

  /* ---------- pestaña ---------- */
  let token = 0;
  async function mostrar(r) {
    const caja = document.getElementById('sate-guia'), mi = ++token;
    const [apartado, id, ancla] = (r && r.partes) || [];
    apagarLector();
    const raizGuia = h('div', { 'class': 'tmr guia' });
    caja.replaceChildren(raizGuia);
    try {
      let foco;
      if (!apartado || !(apartado === 'glosario' && cfg().guiaDatos) && !apartados().some(a => a.id === apartado && !a.vista)) foco = await portada(raizGuia);
      else {
        const d = await datos();
        const a = infoApartado(apartado);
        if (mi !== token) return;
        const x = apartado === 'glosario' ? apartadoGlosario(raizGuia, d) : a.datos === 'faq' ? apartadoPreguntas(raizGuia, d, apartado, id) : a.datos === 'documentos' ? await apartadoReglamentos(raizGuia, d, id, ancla, () => mi === token) : apartadoAcudir(raizGuia, d, id);
        foco = x.titulo;
        if (mi === token && x.enDocumento) return;
        if (mi === token && x.destino) { SateUI.revelar(x.destino); return; }
      }
      if (mi !== token) return;
      if (foco) foco.focus({ preventScroll: true });
      if (raiz.scrollTo) raiz.scrollTo(0, 0);
    } catch (e) {
      if (mi !== token) return;
      console.warn('SATE: Guía no disponible', { unidad: unidad(), ruta: raiz.location.hash, mensaje: e.message });
      const otra = h('button', { type: 'button', 'class': 'btn', texto: t('sate.guia.reintentar') });
      otra.addEventListener('click', () => mostrar(r));
      raizGuia.replaceChildren(h('p', { 'class': 'tmr-vacio', role: 'alert', texto: t('sate.guia.error_datos') }), otra);
    }
  }
  SATE.guia = { datos, enlace: (...p) => rutaGuia(...p) };
  SATE.pestana('guia', { montar() {}, mostrar(r) { return mostrar(r).catch(e => SATE.error(e)); }, ocultar() { token++; apagarLector(); } });
})(typeof window !== 'undefined' ? window : globalThis);
