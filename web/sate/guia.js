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
    const d = datos && datos.documentos && datos.documentos[f.doc];
    if (!d) return null;
    return { texto: f.articulo ? t('sate.guia.fuente_articulo', { documento: d.titulo, articulo: f.articulo }) : d.titulo, url: d.url };
  }
  const enlace = (unidad, apartado, id) => '#/' + unidad + '/guia' + (apartado ? '/' + apartado + (id ? '/' + id : '') : '');
  raiz.SateGuia = { norm, terminos, buscarPreguntas, apartadosDisponibles, fuente, enlace };

  if (typeof raiz.SATE === 'undefined' || typeof raiz.SATE_CONFIG === 'undefined' || typeof document === 'undefined') return;

  /* ===================== B. Integración con SATE ===================== */
  const t = (c, v) => SATE.texto(c, v);
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
  const unidad = () => raiz.SATE_UNIDAD;
  const cfg = () => SATE_CONFIG.unidades[unidad()] || {};
  const E = { datos: null, promesa: null };
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
    for (const archivo of ['guia.css', 'temarios.css']) {
      const href = BASE + archivo;
      if ([...document.querySelectorAll('link[data-tmr-css]')].some(l => l.getAttribute('href') === href)) continue;
      document.head.appendChild(h('link', { rel: 'stylesheet', href, 'data-tmr-css': '' }));
    }
  }
  cargarCss();

  function datos() {
    return E.promesa ||= fetch('datos/' + unidad() + '/guia.json').then(r => {
      if (!r.ok) throw new Error('datos/' + unidad() + '/guia.json: HTTP ' + r.status);
      return r.json();
    }).then(d => (E.datos = d)).catch(e => { E.promesa = null; throw e; });
  }
  const apartados = () => apartadosDisponibles(SATE_CONFIG.guia, cfg());
  const infoApartado = id => (SATE_CONFIG.guia || []).find(a => a.id === id);
  const tituloApartado = id => t(infoApartado(id).titulo);
  const rutaGuia = (...p) => enlace(unidad(), ...p);
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
    const resto = (SATE_CONFIG.guia || []).filter(a => a.pronto);
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
      h('p', { 'class': 'guia-respuesta', texto: p.respuesta }),
      (p.pasos || []).length ? h('section', { 'class': 'guia-bloque' }, [h('h4', { texto: t('sate.guia.que_hacer') }), h('ol', { 'class': 'guia-pasos' }, p.pasos.map(x => h('li', { texto: x })))]) : null,
      acudir.length ? h('section', { 'class': 'guia-bloque' }, [h('h4', { texto: t('sate.guia.a_quien') }), h('ul', { 'class': 'guia-acudir' }, acudir.map(a => h('li', {}, [h('a', { href: rutaGuia('acudir', a.id), texto: a.nombre })])))]) : null,
      formato && formato.url || tramite ? h('section', { 'class': 'guia-bloque guia-acciones' }, [
        tramite ? SateUI.tarjetaNav({ href: '#/' + unidad() + '/tramites/' + tramite, titulo: t('sate.guia.en_ventanilla'), detalle: t('sate.tramite.' + tramite + '.titulo'), compacta: true }) : null,
        formato && formato.url ? SateUI.tarjetaNav({ href: formato.url, titulo: t('sate.guia.formato_titulo'), detalle: formato.texto, externo: true, compacta: true }) : null]) : null,
      h('footer', { 'class': 'guia-pie' }, [
        h('strong', { texto: t('sate.guia.fuentes_titulo', { n: fuentes.length }) }),
        h('ul', { 'class': 'guia-fuentes' }, fuentes.map(f => h('li', {}, [enlaceExterno('', f.url, f.texto)]))),
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

  /* ---------- reglamentos y a quién acudo ---------- */
  function apartadoReglamentos(raizGuia, d) {
    const cab = cabecera([...migasBase(), { texto: tituloApartado('reglamentos') }], tituloApartado('reglamentos'), t('sate.guia.reglamentos_intro'));
    const docs = Object.entries(d.documentos).filter(([, x]) => x.reglamento).map(([id, x]) => ({ id, ...x }));
    const lista = h('ul', { 'class': 'sate-tarjetas-nav' }, docs.map(x => h('li', {}, [
      SateUI.tarjetaNav({ href: x.url, externo: true, titulo: x.titulo, detalle: [x.gaceta, x.resumen].filter(Boolean).join('. ') })])));
    const portal = d.documentos.normatividad;
    raizGuia.append(cab.nodo, h('div', { 'class': 'guia-apartado' }, [lista, portal ? enlaceExterno('guia-portal sate-enlace', portal.url, t('sate.guia.normatividad_portal')) : null]));
    return { titulo: cab.titulo };
  }
  function apartadoAcudir(raizGuia, d, abrirId) {
    const cab = cabecera([...migasBase(), { texto: tituloApartado('acudir') }], tituloApartado('acudir'), t('sate.guia.acudir_intro'));
    const items = new Map();
    const lista = h('ul', { 'class': 'guia-lista-acudir' }, d.acudir.map(a => {
      const f = fuente(d, a.fuente, t);
      const li = h('li', { id: 'acudir-' + a.id }, [h('h3', { texto: a.nombre }), h('p', { texto: a.para }), f ? h('small', {}, [enlaceExterno('', f.url, f.texto)]) : null]);
      items.set(a.id, li);
      return li;
    }));
    raizGuia.append(cab.nodo, h('div', { 'class': 'guia-apartado' }, [lista]));
    return { titulo: cab.titulo, destino: abrirId ? items.get(abrirId) : null };
  }

  /* ---------- pestaña ---------- */
  let token = 0;
  async function mostrar(r) {
    const caja = document.getElementById('sate-guia'), mi = ++token;
    const [apartado, id] = (r && r.partes) || [];
    const raizGuia = h('div', { 'class': 'tmr guia' });
    caja.replaceChildren(raizGuia);
    try {
      let foco;
      if (!apartado || !apartados().some(a => a.id === apartado && !a.vista)) foco = await portada(raizGuia);
      else {
        const d = await datos();
        const a = infoApartado(apartado);
        const x = a.datos === 'faq' ? apartadoPreguntas(raizGuia, d, apartado, id) : a.datos === 'documentos' ? apartadoReglamentos(raizGuia, d) : apartadoAcudir(raizGuia, d, id);
        foco = x.titulo;
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
  SATE.pestana('guia', { montar() {}, mostrar(r) { return mostrar(r).catch(e => SATE.error(e)); }, ocultar() { token++; } });
})(typeof window !== 'undefined' ? window : globalThis);
