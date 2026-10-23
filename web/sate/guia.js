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
    return (guia || []).filter(a => !a.pronto && (!a.capacidad || !!unidad?.[a.capacidad]) && (a.vista ? vistas.includes(a.vista) : !!(unidad && unidad.guiaDatos)));
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
  function etiquetaTitulo(titulo) {
    const texto = titulo.replace(/^(?:t[íi]tulo|cap[íi]tulo|secci[óo]n)\s+(?:(?:d[ée]cim[oa]\s+)?(?:primer[oa]|segund[oa]|tercer[oa]|cuart[oa]|quint[oa]|sext[oa]|s[ée]ptim[oa]|octav[oa]|noven[oa]|d[ée]cim[oa]|[úu]nic[oa])|[IVXLCDM]+|\d+)[.:]?\s*/i, '').trim();
    const normal = texto.toLocaleLowerCase('es').replace(/\bipn\b/g, 'IPN');
    return normal ? normal[0].toLocaleUpperCase('es') + normal.slice(1) : titulo;
  }
  // Respaldo para extracciones antiguas sin clasificación; se compara sin acentos ni mayúsculas.
  function aplicacionTitulo(nodo) {
    if (nodo.aplicacion && nodo.aplicacion !== 'organizacion') return nodo.aplicacion;
    const titulo = norm(etiquetaTitulo(nodo.titulo));
    if (/alumnos|alumnado|estudiantes|aspirantes|becarias|prestadores|ingreso|trayectoria|movilidad|egreso|certificacion|equivalencia|revalidacion|reconsideracion|requisitos|acreditacion|incumplimiento|revocacion|procedimiento disciplinario|examen profesional|expedicion del titulo/.test(titulo)) return 'directo';
    if (/funcion educativa|organos consultivos|modalidades|programas academicos/.test(titulo)) return 'parcial';
    return nodo.aplicacion || 'organizacion';
  }
  // El mapa usa artículos existentes, no la resta de extremos (puede haber artículos Bis).
  function mapaReglamento(reg) {
    return (reg.estructura || []).map(nodo => ({
      titulo: nodo.titulo, etiqueta: etiquetaTitulo(nodo.titulo), aplicacion: aplicacionTitulo(nodo),
      articulos: (reg.articulos || []).filter(a => (a.ubicacion || [])[0] === nodo.titulo).map(a => a.n)
    })).filter(nodo => nodo.articulos.length);
  }
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
  raiz.SateGuia = { norm, terminos, buscarPreguntas, apartadosDisponibles, fuente, enlace, marcas, anclaArticulo, leerAncla, arbolReglamento, partesArticulo, dividirDefiniciones, buscarArticulos, relacionesArticulo, mapaReglamento };

  if (typeof raiz.SATE === 'undefined' || typeof raiz.SATE_CONFIG === 'undefined' || typeof document === 'undefined') return;

  /* ===================== B. Integración con SATE ===================== */
  const t = (c, v) => SATE.texto(c, v);
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
  const unidad = () => raiz.SATE_UNIDAD;
  const cfg = () => SATE_CONFIG.unidades[unidad()] || {};
  const E = { datos: new Map(), reglamentos: new Map(), partes: new WeakMap(), nombres: new Map() };
  function h(etiqueta, atributos, hijos) {
    const n = document.createElement(etiqueta);
    for (const k in atributos || {}) {
      const v = atributos[k];
      if (v == null || v === false) continue;
      if (k === 'texto') n.textContent = v; else n.setAttribute(k, v === true ? '' : v);
    }
    for (const x of hijos || []) if (x) n.appendChild(typeof x === 'string' ? document.createTextNode(x) : x);
    const origen = atributos?.['data-oficial'] || (typeof atributos?.texto === 'string' && E.nombres.get(atributos.texto));
    if (origen) SateUI.oficial(n, origen);
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
    })).then(d => {
      E.nombres.clear();
      for (const a of d.acudir || []) if (a.nombre && a.fuente?.doc && !a.pendiente) E.nombres.set(a.nombre, a.fuente.doc);
      for (const [id, doc] of Object.entries(d.documentos || {})) E.nombres.set(doc.titulo, id);
      return d;
    }).catch(e => { E.datos.delete(u); throw e; });
    E.datos.set(u, promesa);
    return promesa;
  }
  function cargarReglamento(doc) {
    if (!/^[\w-]+$/.test(doc)) return Promise.reject(new Error('Documento inválido: ' + doc));
    if (!E.reglamentos.has(doc)) E.reglamentos.set(doc, (SATE.json ? SATE.json('datos/reglamentos/' + doc + '.json') : fetch('datos/reglamentos/' + doc + '.json').then(r => {
      if (!r.ok) throw new Error('Reglamento ' + doc + ': HTTP ' + r.status);
      return r.json();
    })).then(reg => {
      if (reg.titulo) E.nombres.set(reg.titulo, doc);
      for (const a of reg.articulos || []) for (const titulo of a.ubicacion || []) E.nombres.set(titulo, doc);
      return reg;
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
    const cuerpo = h('div', { 'class': 'guia-articulo' }, a ? [
      h('p', { texto: (a.ubicacion || []).join(' · ') }),
      h('div', { 'class': 'pc-lector pc-oficial', 'data-oficial': doc }, [h('p', { 'class': 'guia-articulo-literal', texto: a.texto })])
    ] : [h('p', { role: 'status', texto: t(error ? 'sate.guia.error_articulo' : 'sate.guia.sin_articulo') })]);
    if (a && reg.ocr) cuerpo.appendChild(h('p', { 'class': 'guia-aviso-ocr', texto: t('sate.guia.aviso_ocr') }));
    const leer = h('a', { href: rutaReglamento(doc, 'art-' + n), texto: t('sate.guia.leer_reglamento') });
    leer.addEventListener('click', () => SateUI.cerrarModal());
    cuerpo.appendChild(leer);
    const url = reg?.url || meta.url;
    if (url) cuerpo.appendChild(enlaceExterno('', url, t('sate.guia.pdf_oficial')));
    return SateUI.modal(t('sate.guia.articulo_titulo', { n, reglamento: reg?.titulo || meta.titulo || doc }), cuerpo, {lectura:true});
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
    if (a.datos === 'actividades') return t('sate.guia.actividades_detalle');
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
    const etapas = (d.etapas || []).filter(e => todas.some(p => p.etapa === e.id));
    const cab = cabecera([...migasBase(), { texto: tituloApartado(apartado) }], tituloApartado(apartado), t('sate.guia.' + apartado + '_intro'));
    let etapa = todas.find(p => p.id === abrirId)?.etapa || etapas[0]?.id, elegido = abrirId;
    const pista = h('ol', { 'class': 'guia-etapas' });
    const panel = h('div', { 'class': 'guia-panel' });
    const resumen = h('p', { 'class': 'guia-resumen', role: 'status', 'aria-live': 'polite' });
    const buscar = SateUI.buscador({ etiqueta: t('sate.guia.buscar_apartado_etiqueta'), marcador: t('sate.guia.buscar_apartado_marcador'), id: 'guia-qa', alCambiar: () => { elegido = null; pintar(); } });
    function pintar() {
      const consulta = terminos(buscar.entrada.value).length;
      const visibles = consulta ? buscarPreguntas(todas, buscar.entrada.value) : todas.filter(p => !etapas.length || p.etapa === etapa);
      const ancho = raiz.matchMedia('(min-width:900px)').matches;
      if (!visibles.some(p => p.id === elegido)) elegido = ancho ? visibles[0]?.id : null;
      pista.replaceChildren(...etapas.map((e, i) => {
        const b = h('button', { type: 'button', 'aria-current': e.id === etapa && !consulta ? 'step' : null, 'aria-label': t(e.titulo), title: t(e.titulo) }, [h('span', { 'class': 'guia-etapa-num', texto: String((d.etapas || []).indexOf(e) + 1) }), h('span', { 'class': 'guia-etapa-nombre', texto: t(e.titulo) })]);
        b.addEventListener('click', () => { etapa = e.id; elegido = null; buscar.entrada.value = ''; pintar(); pista.querySelector('[aria-current]')?.focus({ preventScroll: true }); });
        return h('li', {}, [b]);
      }));
      const lista = h('ul', { 'class': 'guia-preguntas-etapa' });
      const detalle = h('div', { 'class': 'guia-detalle' });
      for (const p of visibles) {
        const activo = elegido === p.id;
        const b = h('button', { type: 'button', 'class': 'guia-elegir', 'data-pregunta': p.id, 'aria-expanded': String(activo), 'aria-controls': 'respuesta-' + p.id, texto: p.pregunta });
        b.addEventListener('click', () => {
          elegido = activo && !ancho ? null : p.id;
          history.replaceState(null, '', rutaGuia(apartado, elegido));
          pintar();
          panel.querySelector('[data-pregunta="' + p.id + '"]')?.focus({ preventScroll: true });
        });
        const li = h('li', {}, [b]);
        if (activo) {
          const contenido = h('article', { id: 'respuesta-' + p.id, 'class': 'guia-detalle' }, [h('h3', { texto: p.pregunta }), respuesta(d, p)]);
          (ancho ? detalle : li).appendChild(contenido);
        } else li.appendChild(h('div', { id: 'respuesta-' + p.id, hidden: true }));
        lista.appendChild(li);
      }
      panel.replaceChildren(h('section', {}, [h('h3', { texto: consulta ? t('sate.guia.buscar_apartado_etiqueta') : t(etapas.find(e => e.id === etapa)?.titulo || 'sate.guia.buscar_apartado_etiqueta') }), lista]), detalle);
      resumen.textContent = t(visibles.length ? 'sate.guia.resultados_preguntas' : 'sate.guia.sin_resultados_preguntas', { n: visibles.length });
    }
    const cambio = () => pintar();
    const mq = raiz.matchMedia('(min-width:900px)');
    mq.addEventListener?.('change', cambio);
    limpiarLector = () => mq.removeEventListener?.('change', cambio);
    raizGuia.append(cab.nodo, h('div', { 'class': 'guia-apartado' }, [buscar.raiz, resumen, pista, panel]));
    pintar();
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
  // Lector de tres paneles: índice | articulado continuo | trámites y preguntas del artículo actual.
  function montarReglamento(raizGuia, d, reg, doc, ancla) {
    const cab = cabecera([...migasBase(), { texto: tituloApartado('reglamentos'), href: rutaGuia('reglamentos') }, { texto: reg.titulo }], reg.titulo, reg.gaceta);
    const articulos = reg.sin_texto ? [] : reg.articulos || [], transitorios = reg.sin_texto ? [] : reg.transitorios || [];
    const fuenteDoc = reg.url ? h('p', { 'class': 'rgl-fuente' }, [enlaceExterno('', reg.url, t('sate.guia.pdf_oficial'))]) : null;
    const avisoOcr = reg.ocr && !reg.sin_texto ? h('p', { 'class': 'guia-aviso-ocr', texto: t('sate.guia.aviso_ocr') }) : null;
    if (!articulos.length && !transitorios.length) {
      // Sin articulado (código, lineamientos escaneados): el texto corrido, sin índice.
      const lineas = !d.documentos[doc]?.soloPdf && !reg.sin_texto && reg.texto ? String(reg.texto).split(/\n+/).filter(Boolean) : [];
      raizGuia.append(cab.nodo, h('div', { 'class': 'guia-apartado' }, [avisoOcr, lineas.length
        ? h('div', { 'class': 'rgl-cuerpo pc-lector pc-oficial', 'data-oficial': doc, 'data-ancla': 'texto' }, lineas.map(x => h('p', { texto: x })))
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
      const primeroDe = x => x.articulos[0] || primeroDe(x.hijos[0]);
      det.append(h('summary', {}, [enlaceAncla('rgl-indice-titulo', anclaArticulo(primeroDe(nodo)), nodo.titulo), h('small', { texto: String(totalArticulos(nodo)) })]), cuerpo);
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
    const rejilla = SateUI.lector(indice, texto, riel);
    const estrecho = () => pantallaChica() || (rejilla.clientWidth > 0 && rejilla.clientWidth <= 672);
    if (fuenteDoc || avisoOcr) cab.nodo.appendChild(h('div', { 'class': 'rgl-datos' }, [fuenteDoc, avisoOcr]));
    const mapa = mapaReglamento(reg);
    const cifras = h('dl', { 'class': 'rgl-cifras' }, [
      ['articulos', articulos.length], ['titulos', mapa.filter(x => /^TÍTULO/i.test(x.titulo)).length],
      ['directos', mapa.filter(x => x.aplicacion === 'directo').reduce((s, x) => s + x.articulos.length, 0)]
    ].map(([clave, n]) => h('div', {}, [h('dt', { texto: t('sate.guia.rgl_' + clave) }), h('dd', { texto: String(n) })])));
    const barra = h('div', { 'class': 'rgl-mapa__barra' }, mapa.map(x => {
      const a = enlaceAncla('rgl-mapa__tramo rgl-aplica--' + x.aplicacion, anclaArticulo(x.articulos[0]), [h('span', { 'class': 'rgl-mapa__color' }), h('span', { 'class': 'rgl-mapa__etiqueta', texto: x.etiqueta }), h('span', { 'class': 'rgl-mapa__completo', texto: x.titulo })],
        { title: x.titulo + ' · ' + t('sate.guia.numero_articulos', { n: x.articulos.length }), 'aria-label': x.titulo + ' · ' + t('sate.guia.rgl_' + x.aplicacion) });
      a.style.flex = x.articulos.length + ' 0 0';
      if (x.articulos.length / articulos.length < 0.04) a.classList.add('rgl-mapa__tramo--angosto');
      return a;
    }));
    const mapaVista = h('section', { 'class': 'rgl-mapa' }, [h('h3', { texto: t('sate.guia.rgl_mapa') }),
      h('ul', { 'class': 'rgl-leyenda' }, ['directo', 'parcial', 'organizacion'].map(x => h('li', { 'class': 'rgl-aplica--' + x, texto: t('sate.guia.rgl_' + x) }))), barra]);
    raizGuia.append(cab.nodo, cifras);
    if (mapa.length) raizGuia.appendChild(mapaVista);
    raizGuia.appendChild(rejilla);

    let actual = null, enlaceActual = '';
    function fila(clase, marca, anclaDe, etiqueta, contenido) {
      return h('li', { 'class': clase, 'data-ancla': anclaDe }, [enlaceAncla('rgl-marca', anclaDe, marca, { 'aria-label': etiqueta }), h('div', {}, contenido)]);
    }
    function cuerpoArticulo(a) {
      if (!E.partes.has(a)) E.partes.set(a, partesArticulo(a));
      const p = E.partes.get(a), nodos = [];
      if (p.intro) nodos.push(h('p', { texto: p.intro }));
      if (p.definiciones) nodos.push(h('dl', { 'class': 'rgl-definiciones' }, p.definiciones.map(x => h('div', {}, [h('dt', { texto: x.termino }), h('dd', { texto: x.texto })]))));
      if (p.fracciones.length) nodos.push(h('ol', { 'class': 'rgl-fracciones' }, p.fracciones.map(f => fila('rgl-fr', f.fr + '.', anclaArticulo(a.n, f.fr), t('sate.guia.rgl_enlace_fraccion', { fr: f.fr }), [
        h('p', { texto: f.texto }),
        f.incisos.length ? h('ol', { 'class': 'rgl-incisos' }, f.incisos.map(x => fila('rgl-inc', x.inciso + ')', anclaArticulo(a.n, f.fr, x.inciso), t('sate.guia.rgl_enlace_inciso', { inciso: x.inciso }), [h('p', { texto: x.texto })]))) : null]))));
      return h('div', { 'class': 'rgl-cuerpo pc-lector pc-oficial', 'data-oficial': doc }, nodos);
    }
    function pintarRiel(a) {
      const rel = a ? relacionesArticulo(d, doc, a.n, tramites) : { preguntas: [], tramites: [] };
      const bloques = [];
      if (rel.tramites.length) bloques.push(h('section', {}, [h('h4', { texto: t('sate.guia.rgl_tramites') }), h('ul', {}, rel.tramites.map(id => h('li', {}, [h('a', { href: '#/' + unidad() + '/tramites/' + id, texto: t('sate.tramite.' + id + '.titulo') })])))]));
      if (rel.preguntas.length) bloques.push(h('section', {}, [h('h4', { texto: t('sate.guia.rgl_preguntas') }), h('ul', {}, rel.preguntas.map(p => h('li', {}, [h('a', { href: rutaGuia(p.apartado, p.id), texto: p.pregunta })])))]));
      // El riel no se oculta: si cambiara la rejilla al desplazarse, el índice y el texto saltarían.
      riel.replaceChildren(h('h3', { texto: t('sate.guia.rgl_contexto') }), ...(bloques.length ? bloques : [h('p', { 'class': 'rgl-riel-vacio', texto: t('sate.guia.rgl_sin_citas') })]));
    }
    function marcarIndice(clave) {
      for (const [n, a] of enlaces) { if (n === clave) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }
      if (enlaceTransitorios) { if (clave === 'transitorios') enlaceTransitorios.setAttribute('aria-current', 'true'); else enlaceTransitorios.removeAttribute('aria-current'); }
      for (const g of grupos.get(clave) || []) g.open = true;
      for (const g of arbolNav.querySelectorAll('.rgl-grupo')) {
        const titulo = g.querySelector('.rgl-indice-titulo');
        if ((grupos.get(clave) || []).includes(g)) titulo.setAttribute('aria-current', 'true');
        else titulo.removeAttribute('aria-current');
      }
      // Con el índice abierto, el artículo actual queda a la vista dentro de su propio desplazamiento.
      const activo = clave === 'transitorios' ? enlaceTransitorios : enlaces.get(clave), r = cuerpoIndice.getBoundingClientRect();
      if (activo && indice.open && r.height) { const a = activo.getBoundingClientRect(); if (a.top < r.top || a.bottom > r.bottom) cuerpoIndice.scrollTop += a.top - r.top - r.height / 3; }
    }
    // El lienzo conserva todo el documento; al navegar solo cambian el índice y las relaciones.
    function pintar(clave) {
      if (clave === 'transitorios') {
        const rotulo = t('sate.guia.transitorios');
        pintarRiel(null);
        resumen.textContent = rotulo;
      } else {
        const i = posicion.get(clave), a = articulos[i];
        pintarRiel(a);
        resumen.textContent = t('sate.guia.rgl_art_corto', { n: a.n });
      }
      marcarIndice(clave);
      actual = clave;
      for (const tramo of barra.children) {
        const grupo = mapa.find(x => x.articulos.includes(clave));
        if (grupo && tramo.getAttribute('data-ancla') === anclaArticulo(grupo.articulos[0])) tramo.setAttribute('aria-current', 'true');
        else tramo.removeAttribute('aria-current');
      }
    }
    const secciones = new Map(), pendientes = new Map();
    const inicial = leerAncla(ancla || ''), centro = posicion.get(inicial?.n) ?? 0;
    function completar(clave) {
      const pendiente = pendientes.get(clave);
      if (!pendiente) return;
      pendientes.delete(clave);
      pendiente();
    }
    function vecindad(clave) {
      const i = posicion.get(clave);
      if (i == null) { completar(clave); return; }
      for (let j = Math.max(0, i - 2); j <= Math.min(articulos.length - 1, i + 3); j++) completar(articulos[j].n);
    }
    let ubicacionAnterior = [], contenedores = [texto];
    for (const a of articulos) {
      const ubicacion = a.ubicacion || [];
      let comun = 0;
      while (comun < ubicacion.length && ubicacion[comun] === ubicacionAnterior[comun]) comun++;
      contenedores = contenedores.slice(0, comun + 1);
      for (let nivel = comun; nivel < ubicacion.length; nivel++) {
        const grupo = h('section', { 'class': 'rgl-seccion rgl-nivel-' + nivel }, [h('h' + Math.min(6, nivel + 3), { 'class': 'rgl-encabezado', texto: ubicacion[nivel] })]);
        contenedores[contenedores.length - 1].appendChild(grupo);
        contenedores.push(grupo);
      }
      const anc = anclaArticulo(a.n);
      const copiarArticulo = h('button', { type: 'button', 'class': 'btn rgl-copiar', texto: t('sate.guia.rgl_copiar') });
      const estado = h('span', { role: 'status', 'class': 'rgl-copiado' });
      copiarArticulo.addEventListener('click', () => copiarEnlace(rutaReglamento(doc, anc)).then(
        () => { estado.textContent = t('sate.guia.rgl_copiado'); },
        () => { estado.textContent = t('sate.guia.rgl_copiar_error'); }));
      const seccion = h('section', { 'class': 'rgl-articulo', id: 'rgl-' + anc, 'data-articulo': a.n }, [
        h('header', { 'class': 'rgl-cab' }, [h('h4', {}, [enlaceAncla('rgl-cita', anc, t('sate.guia.articulo_rotulo', { n: a.n }))]), copiarArticulo, estado])]);
      // Reservar altura evita que los títulos posteriores colapsen mientras llega su texto.
      seccion.style.minHeight = Math.max(110, Math.ceil((a.texto || '').length / 80) * 24 + 64) + 'px';
      pendientes.set(a.n, () => { seccion.appendChild(cuerpoArticulo(a)); seccion.style.minHeight = ''; });
      if (Math.abs(posicion.get(a.n) - centro) <= 3) completar(a.n);
      contenedores[contenedores.length - 1].appendChild(seccion);
      secciones.set(a.n, seccion);
      ubicacionAnterior = ubicacion;
    }
    if (transitorios.length) {
      const seccion = h('section', { 'class': 'rgl-articulo', id: 'rgl-transitorios', 'data-articulo': 'transitorios' }, [
        h('h3', { texto: t('sate.guia.transitorios') }), h('div', { 'class': 'rgl-cuerpo pc-lector pc-oficial', 'data-oficial': doc },
          transitorios.map(x => h('p', { texto: x.n + '. ' + x.texto })))]);
      texto.appendChild(seccion);
      secciones.set('transitorios', seccion);
    }
    // Muestra el artículo o la fracción de un ancla; sin ancla válida, el primer artículo. Devuelve el nodo de la fracción, si hay.
    let anclaFijada = null;
    function ir(anclaDestino, empujar) {
      const p = leerAncla(anclaDestino);
      const clave = anclaDestino === 'transitorios' && transitorios.length ? 'transitorios' : p && posicion.has(p.n) ? p.n : articulos.length ? articulos[0].n : 'transitorios';
      const cambio = clave !== actual;
      vecindad(clave);
      if (cambio) pintar(clave);
      const final = p && clave === p.n && p.fr ? anclaArticulo(p.n, p.fr, p.inciso) : clave === 'transitorios' ? 'transitorios' : anclaArticulo(clave);
      const fr = final.includes('.') ? Array.from(texto.querySelectorAll('li[data-ancla]')).find(x => x.getAttribute('data-ancla') === final) : null;
      for (const x of texto.querySelectorAll('.rgl-activa')) x.classList.remove('rgl-activa');
      if (fr) fr.classList.add('rgl-activa');
      // La hidratación incremental conserva el destino de ruta aunque el lector visible cambie.
      anclaFijada = secciones.get(clave) || null;
      enlaceActual = rutaReglamento(doc, fr ? final : clave === 'transitorios' ? clave : anclaArticulo(clave));
      if (empujar) {
        try { history[cambio ? 'pushState' : 'replaceState'](null, '', enlaceActual); } catch (e) { /* sin historial */ }
        if (indice.open && estrecho()) indice.open = false;
        (fr || secciones.get(clave))?.scrollIntoView({ block: 'start' });
      }
      return fr;
    }
    raizGuia.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[data-ancla]');
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button) return;
      e.preventDefault();
      ir(a.getAttribute('data-ancla'), true);
    });
    const consulta = raiz.matchMedia ? raiz.matchMedia('(max-width:768.98px)') : null;
    let eraEstrecho = null;
    const ajustar = () => {
      const chico = estrecho();
      if (chico !== eraEstrecho) indice.open = !chico;
      eraEstrecho = chico;
      const rielEnIndice = (rejilla.clientWidth > 0 && rejilla.clientWidth <= 832) ||
        !!raiz.matchMedia?.('(max-width:1024.98px)').matches;
      if (rielEnIndice && riel.parentNode !== cuerpoIndice) cuerpoIndice.insertBefore(riel, arbolNav);
      else if (!rielEnIndice && riel.parentNode !== rejilla) rejilla.appendChild(riel);
      // Los nombres oficiales ocupan varias líneas: cada encabezado se fija debajo de sus ancestros reales.
      const base = chico ? indice.querySelector('summary').offsetHeight || 48 : 0;
      const alturas = new Map(Array.from(texto.querySelectorAll('.rgl-encabezado'), n => [n, n.offsetHeight || 48]));
      const cambios = [];
      for (const [cab, alto] of alturas) {
        let tope = base;
        for (let padre = cab.parentNode.parentNode; padre && padre !== texto; padre = padre.parentNode)
          if (padre.classList.contains('rgl-seccion')) tope += alturas.get(padre.firstChild) || 48;
        cambios.push([cab, 'top', tope + 'px']);
      }
      for (const seccion of secciones.values()) {
        let tope = base;
        for (let padre = seccion.parentNode; padre && padre !== texto; padre = padre.parentNode) {
          if (padre.classList.contains('rgl-seccion')) tope += alturas.get(padre.firstChild) || 48;
        }
        cambios.push([seccion, 'scrollMarginTop', (tope + 16) + 'px']);
      }
      // Leer toda la geometría antes de escribir estilos: un layout por ajuste.
      for (const [n, propiedad, valor] of cambios) if (n.style[propiedad] !== valor) n.style[propiedad] = valor;
    };
    if (consulta?.addEventListener) consulta.addEventListener('change', ajustar);
    ajustar();
    const observador = raiz.ResizeObserver ? new raiz.ResizeObserver(ajustar) : null;
    observador?.observe(rejilla);
    raiz.addEventListener('resize', ajustar);
    let cuadro = 0;
    const seguir = () => {
      if (cuadro) return;
      cuadro = raiz.requestAnimationFrame(() => {
        cuadro = 0;
        const visible = SateUI.lectorVisible(secciones);
        if (visible) { vecindad(visible); if (visible !== actual) pintar(visible); }
      });
    };
    raiz.addEventListener('scroll', seguir, { passive: true });
    const soltarAncla = () => { anclaFijada = null; };
    raiz.addEventListener('wheel', soltarAncla, { passive: true });
    raiz.addEventListener('touchstart', soltarAncla, { passive: true });
    raiz.addEventListener('pointerdown', soltarAncla, { passive: true });
    const soltarAnclaTeclado = e => { if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)) soltarAncla(); };
    raiz.addEventListener('keydown', soltarAnclaTeclado);
    let detenido = false, tarea;
    const enReposo = fn => raiz.requestIdleCallback ? raiz.requestIdleCallback(fn, {timeout:1000}) : raiz.setTimeout(fn, 50);
    function sinSalto(fn) {
      const anclaVista = anclaFijada || secciones.get(actual), antes = anclaVista?.getBoundingClientRect().top;
      fn();
      if (antes != null && raiz.scrollBy) {
        const diferencia = anclaVista.getBoundingClientRect().top - antes;
        if (diferencia) raiz.scrollBy(0, diferencia);
      }
    }
    const completarTodo = () => { for (const clave of pendientes.keys()) completar(clave); };
    const continuar = () => {
      if (detenido) return;
      // Lotes pequeños también en el respaldo, para ceder a navegación y scroll.
      sinSalto(() => { for (const clave of Array.from(pendientes.keys()).slice(0, 6)) completar(clave); });
      if (pendientes.size) tarea = enReposo(continuar);
    };
    const interseccion = raiz.IntersectionObserver ? new raiz.IntersectionObserver(entradas => {
      sinSalto(() => { for (const e of entradas) if (e.isIntersecting) vecindad(e.target.getAttribute('data-articulo')); });
    }, {rootMargin:'800px'}) : null;
    for (const n of secciones.values()) interseccion?.observe(n);
    raiz.addEventListener('beforeprint', completarTodo);
    tarea = enReposo(continuar);
    limpiarLector = () => { detenido = true; if (raiz.cancelIdleCallback) raiz.cancelIdleCallback(tarea); else raiz.clearTimeout(tarea); interseccion?.disconnect(); raiz.removeEventListener('beforeprint', completarTodo); if (consulta?.removeEventListener) consulta.removeEventListener('change', ajustar); observador?.disconnect(); raiz.removeEventListener('resize', ajustar); raiz.removeEventListener('scroll', seguir); raiz.removeEventListener('wheel', soltarAncla); raiz.removeEventListener('touchstart', soltarAncla); raiz.removeEventListener('pointerdown', soltarAncla); raiz.removeEventListener('keydown', soltarAnclaTeclado); raiz.cancelAnimationFrame(cuadro); };
    const fr = ir(ancla && ancla !== 'texto' ? ancla : '', false);
    const destino = ancla && ancla !== 'texto' ? fr || secciones.get(actual) : null;
    // Salto inmediato: un desplazamiento suave largo lo interrumpe el dibujo por partes y no llega al artículo.
    if (destino) { destino.scrollIntoView({ block: 'start' }); SateUI.revelar(destino); }
    return { titulo: cab.titulo, enDocumento: !!destino };
  }
  async function apartadoReglamentos(raizGuia, d, doc, ancla, vigente) {
    if (doc) {
      const reg = await cargarReglamento(doc);
      if (!vigente()) return {};
      return raiz.SateMedicion ? raiz.SateMedicion.render('reglamento ' + doc, () => montarReglamento(raizGuia, d, reg, doc, ancla)) : montarReglamento(raizGuia, d, reg, doc, ancla);
    }
    const cab = cabecera([...migasBase(), { texto: tituloApartado('reglamentos') }], tituloApartado('reglamentos'), t('sate.guia.reglamentos_intro'));
    const indice = await cargarReglamento('indice');
    const docs = Object.entries(d.documentos).filter(([id, x]) => x.reglamento && indice.some(i => i.id === id)).map(([id, x]) => ({ id, ...x }));
    const registros = await Promise.all(docs.map(x => cargarReglamento(x.id)));
    if (!vigente()) return {};
    const lista = h('ul', { 'class': 'rgl-biblioteca' }, docs.map(x => h('li', {}, [
      h('a', { href: x.soloPdf || indice.find(i => i.id === x.id)?.sin_texto ? x.url : rutaGuia('reglamentos', x.id), 'class': 'rgl-libro' }, [
        h('strong', { 'class': 'rgl-siglas', texto: x.siglas || x.titulo.split(/\s+/).filter(p => /^[A-ZÁÉÍÓÚÑ]/.test(p) && !/^(IPN|Instituto|Politécnico|Nacional)$/.test(p)).map(p => p[0]).join('') }),
        h('h4', { texto: x.titulo }), h('small', { texto: x.gaceta }),
        h('span', { texto: indice.find(i => i.id === x.id)?.articulos ? t('sate.guia.numero_articulos', { n: indice.find(i => i.id === x.id).articulos }) : t(x.soloPdf || indice.find(i => i.id === x.id)?.sin_texto ? 'sate.guia.rgl_solo_pdf' : 'sate.guia.rgl_texto_completo') })])])));
    const resultados = h('ul', { 'class': 'guia-resultados', hidden: true, 'aria-live': 'polite' });
    const pintarResultados = q => {
      const encontrados = registros.flatMap(reg => buscarArticulos(reg, q, 4).map(a => ({ reg, a }))).slice(0, 12);
      resultados.hidden = !terminos(q).length;
      resultados.replaceChildren(...encontrados.map(({ reg, a }) => h('li', {}, [h('a', {
        'class': 'guia-resultado', href: rutaReglamento(reg.id, anclaArticulo(a.n))
      }, [h('strong', { texto: reg.titulo + ' · ' + t('sate.guia.rgl_art_corto', { n: a.n }) }), h('small', { texto: a.texto.slice(0, 140) })])])));
      if (!encontrados.length) resultados.appendChild(h('li', { 'class': 'guia-vacio', texto: t('sate.guia.rgl_resultados', { n: 0 }) }));
    };
    const buscar = SateUI.buscador({ etiqueta: t('sate.guia.rgl_buscar_todos'), marcador: t('sate.guia.rgl_buscar_marcador'), alCambiar: pintarResultados });
    const sugerencias = h('div', { 'class': 'rgl-sugerencias' }, ['baja', 'recursar', 'plazo'].map(clave => {
      const boton = h('button', { type: 'button', 'class': 'btn', texto: t('sate.guia.rgl_sugerencia_' + clave) });
      boton.addEventListener('click', () => {
        const q = t('sate.guia.rgl_sugerencia_' + clave);
        buscar.raiz.querySelector('input').value = q;
        pintarResultados(q);
      });
      return boton;
    }));
    const temasLista = h('div', { 'class': 'rgl-temas__opciones' });
    const temaArticulos = h('div', { 'class': 'rgl-temas__articulos', 'aria-live': 'polite' });
    const temas = [ ['trayectoria', /regular|plazo|trayectoria/], ['oportunidades', /recurs|acredita|ets/], ['carga', /carga|creditos/],
      ['bajas', /baja/], ['dictamen', /dictamen/], ['inconformidad', /inconform|reconsidera|apelacion/] ];
    function elegirTema(clave, patron) {
      for (const boton of temasLista.children) boton.setAttribute('aria-pressed', String(boton.dataset.tema === clave));
      const preguntas = (d.preguntas || []).filter(p => patron.test(norm([p.pregunta, ...(p.palabras || [])].join(' '))));
      const citas = new Map();
      for (const p of preguntas) for (const f of p.fuentes || []) for (const n of f.arts || []) {
        const reg = registros.find(x => x.id === f.doc), a = reg?.articulos.find(x => x.n === n);
        if (a && !citas.has(f.doc + ':' + n)) citas.set(f.doc + ':' + n, { reg, a, pregunta: p.pregunta });
      }
      temaArticulos.replaceChildren(h('h4', { texto: t('sate.guia.rgl_tema_' + clave) }), h('ul', { 'class': 'rgl-temas__lista' }, [...citas.values()].map(({ reg, a, pregunta }) => h('li', {}, [
        h('a', { href: rutaReglamento(reg.id, anclaArticulo(a.n)), 'class': 'guia-resultado' }, [h('strong', { texto: pregunta }),
          h('small', { texto: reg.titulo + ' · ' + t('sate.guia.rgl_art_corto', { n: a.n }) }), h('span', { texto: a.texto.slice(0, 160) })])]))));
      if (!citas.size) temaArticulos.appendChild(h('p', { texto: t('sate.guia.rgl_resultados', { n: 0 }) }));
    }
    for (const [clave, patron] of temas) {
      const boton = h('button', { type: 'button', 'data-tema': clave, texto: t('sate.guia.rgl_tema_' + clave), 'aria-pressed': 'false' });
      boton.addEventListener('click', () => elegirTema(clave, patron));
      temasLista.appendChild(boton);
    }
    elegirTema(...temas[3]);
    const portal = d.documentos.normatividad;
    raizGuia.append(cab.nodo, h('div', { 'class': 'guia-apartado rgl-explorador' }, [buscar.raiz, sugerencias, resultados,
      h('section', {}, [h('h3', { texto: t('sate.guia.rgl_biblioteca') }), lista]),
      h('section', { 'class': 'rgl-temas' }, [h('div', {}, [h('h3', { texto: t('sate.guia.rgl_temas') }), temasLista]), temaArticulos]),
      h('a', { href: rutaGuia('glosario'), texto: t('sate.guia.glosario') }),
      portal ? enlaceExterno('guia-portal sate-enlace', portal.url, t('sate.guia.normatividad_portal')) : null]));
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
    const tx = k => t('sate.guia.r10.' + k);
    const cab = cabecera([...migasBase(), { texto: tituloApartado('acudir') }], tituloApartado('acudir'), t('sate.guia.acudir_intro'));
    const instancias = new Map(d.acudir.map(a => [a.id, a]));
    const nodos = [], org = d.organigrama;
    function agregar(nombre, padre, colegiado) {
      const existente = d.acudir.find(a => a.nombre === nombre);
      const id = existente?.id || org?.ids?.[nombre] || 'org-' + nodos.length;
      const a = existente || { id, nombre, ambito: 'unidad', para: '', fuente: { doc: org.documento } };
      instancias.set(id, a);
      nodos.push({ id, padre, colegiado });
      return id;
    }
    if (org) {
      const r = agregar(org.raiz.nombre, null);
      for (const nombre of org.raiz.colegiados || []) agregar(nombre, r, true);
      for (const nombre of org.raiz.apoyo || []) { const id = agregar(nombre, r); nodos.find(n => n.id === id).apoyo = true; }
      for (const area of org.raiz.areas || []) {
        const id = agregar(area.nombre, r);
        for (const nombre of area.dependencias || []) agregar(nombre, id);
        for (const nombre of area.colegiados || []) agregar(nombre, id, true);
      }
    }
    for (const a of d.estructuraCentral || []) {
      instancias.set(a.id, { ...a, nombre: a.nombreClave ? t(a.nombreClave) : a.nombre, para: a.paraClave ? t(a.paraClave) : a.para });
      nodos.push({ id: a.id, padre: a.depende || null });
    }
    // Las relaciones adicionales se declaran en datos; no se deducen de los nombres.
    for (const a of d.acudir) {
      const padre = a.depende || null;
      const nodo = nodos.find(n => n.id === a.id);
      if (!nodo) nodos.push({ id: a.id, padre });
      else if (padre) nodo.padre = padre;
    }
    let vista = 'directorio', ambito = '', elegido = abrirId || d.acudir[0]?.id;
    const abiertos = new Set();
    const cuerpo = h('div', { 'class': 'guia-directorio' });
    const barra = h('div', { 'class': 'guia-controles' });
    const filtros = h('div', { 'class': 'guia-controles' });
    const resumen = h('p', { role: 'status', 'aria-live': 'polite', 'class': 'guia-resumen' });
    const buscar = SateUI.buscador({ etiqueta: tx('necesidad'), marcador: tx('necesidad'), id: 'guia-necesidad', alCambiar: pintar });
    function seleccionar(a) {
      elegido = a.id;
      history.replaceState(null, '', rutaGuia('acudir', a.id));
      if (raiz.matchMedia('(max-width:899px)').matches) SateUI.modal(a.nombre, ficha(a));
      else pintar();
    }
    function ficha(a) {
      const f = fuente(d, a.fuente, t), padre = nodos.find(n => n.id === a.id)?.padre;
      const rel = d.preguntas.filter(p => (p.acudir || []).includes(a.id));
      const campo = (titulo, contenido) => h('div', {}, [h('dt', { texto: titulo }), h('dd', {}, contenido)]);
      const cita = ref => {
        const s = fuente(d, ref, t);
        return s ? enlaceExterno('', s.url + (ref.pagina ? '#page=' + ref.pagina : ''), s.texto) : null;
      };
      return h('article', { 'class': 'guia-ficha' }, [h('small', { texto: t('sate.guia.acudir_' + (a.ambito || 'unidad')) }), a.pendiente ? h('strong', { texto: tx('confirmar') }) : null, h('h3', { texto: a.nombre }),
        h('dl', {}, [campo(a.orientacion ? tx('orientacion_propia') : tx('atiende'), [h('p', {}, enLinea(a.orientacion?.texto || a.para || tx('sin_descripcion'), d)),
          ...(a.necesidades || []).map(n => h('p', { texto: t(n.texto) + (n.pendiente ? ' · ' + tx('confirmar') : '') }))]),
          a.objetivo ? campo(tx(a.objetivo.alcance === 'unidad' ? 'objetivo_unidad' : 'objetivo_oficial'), [h('blockquote', { 'class': 'pc-lector pc-oficial', 'data-oficial': a.objetivo.fuente.doc, texto: a.objetivo.texto }), cita(a.objetivo.fuente)]) : null,
          a.funciones?.length ? campo(t('sate.guia.funciones_manual'), [h('ul', { 'class': 'guia-funciones pc-lector pc-oficial', 'data-oficial': a.funciones[0].fuente.doc }, a.funciones.map(x => h('li', { 'data-oficial': x.fuente.doc }, [h('p', { texto: x.texto }), cita(x.fuente)])))]) : null,
          campo(tx('depende'), [instancias.get(padre)?.nombre || a.dependenciaTexto || tx('confirmar'), a.fuenteDependencia ? cita(a.fuenteDependencia) : null]),
          // Sin procedimientos asignados en el manual no se muestra el bloque (la nota queda en los datos).
          a.procedimientos?.length ? campo(tx('procedimientos'), [h('ul', { 'class': 'guia-procedimientos' }, a.procedimientos.map(x => h('li', {}, [h('strong', { 'data-oficial': x.fuente.doc, texto: x.nombre }), h('p', { texto: x.participacion }), cita(x.fuente)]))), h('p', { texto: a.procedimientosNota })]) : null,
          campo(tx('contacto'), enLinea(a.contacto || tx('confirmar'), d)),
          campo(t('sate.guia.fuentes_titulo', { n: f ? 1 : 0 }), [f ? enlaceExterno('', f.url, f.texto) : tx('confirmar'), a.ambito !== 'ipn' && org ? h('p', { texto: tx('fuente_estructura') }) : null]),
          rel.length ? campo(tx('relacionadas'), [h('ul', {}, rel.map(p => h('li', {}, [h('a', { href: rutaGuia(p.apartado, p.id), texto: p.pregunta })])))]) : null])]);
    }
    function pintar() {
      const ts = terminos(buscar.entrada.value);
      const preguntas = ts.length ? buscarPreguntas(d.preguntas, buscar.entrada.value) : [];
      const resultados = [...instancias.values()].filter(a => (vista === 'jerarquia' || a.para) && (!ambito || (a.ambito || 'unidad') === ambito) && (!ts.length || ts.every(w => norm([a.nombre, a.para, ...(a.funciones || []).map(x => x.texto), ...(a.procedimientos || []).map(x => x.nombre), ...(a.palabras || []), ...(a.necesidades || []).flatMap(n => [t(n.texto), ...(n.palabras || [])])].join(' ')).includes(w)) || preguntas.some(p => (p.acudir || []).includes(a.id))));
      const ids = new Set(resultados.map(a => a.id));
      resultados.sort((a, b) => Number(a.ambito === 'ipn') - Number(b.ambito === 'ipn'));
      if (!instancias.has(elegido) || vista === 'directorio' && !ids.has(elegido)) elegido = resultados[0]?.id;
      barra.replaceChildren(...['directorio', 'jerarquia'].map(v => {
        const b = h('button', { type: 'button', 'aria-pressed': String(vista === v), texto: tx(v) });
        b.addEventListener('click', () => { if (v === 'jerarquia' && vista !== v) elegido = nodos.find(n => !n.padre && instancias.get(n.id).ambito !== 'ipn')?.id; vista = v; pintar(); barra.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true }); }); return b;
      }));
      filtros.replaceChildren(...['', 'unidad', 'ipn'].map(v => {
        const b = h('button', { type: 'button', 'aria-pressed': String(ambito === v), texto: v ? t('sate.guia.acudir_' + v) : tx('todo') });
        b.addEventListener('click', () => { ambito = v; pintar(); filtros.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true }); }); return b;
      }));
      function boton(a) {
        const b = h('button', { type: 'button', 'class': 'guia-elegir', 'data-instancia': a.id, 'aria-current': elegido === a.id ? 'true' : null, texto: a.nombre });
        b.addEventListener('click', () => {
          seleccionar(a);
          if (raiz.matchMedia('(min-width:900px)').matches) cuerpo.querySelector('[data-instancia="' + a.id + '"]')?.focus({ preventScroll: true });
        }); return b;
      }
      function nodo(n) {
        const hijos = nodos.filter(x => x.padre === n.id);
        const a = instancias.get(n.id);
        if (ambito && (a.ambito || 'unidad') !== ambito) return null;
        const rama = hijos.map(nodo).filter(Boolean);
        const b = boton(a);
        if (ts.length && ids.has(n.id)) b.classList.add('guia-coincide');
        const caja = h('span', { 'class': 'guia-nodo' + (ts.length && !ids.has(n.id) ? ' guia-nodo--tenue' : '') }, [b,
          n.colegiado || n.apoyo ? h('small', { texto: tx(n.colegiado ? 'colegiado' : 'apoyo') }) : null]);
        if (!rama.length) return h('li', {}, [caja]);
        const resumenRama = h('summary', {}, [caja, h('small', { texto: tx('dependencias').replace('{n}', String(hijos.length)) })]);
        resumenRama.addEventListener('click', e => {
          if (e.target === b) return;
          elegido = a.id;
          for (const actual of cuerpo.querySelectorAll('[data-instancia]')) actual.removeAttribute('aria-current');
          b.setAttribute('aria-current', 'true');
          if (raiz.matchMedia('(max-width:899px)').matches) SateUI.modal(a.nombre, ficha(a));
          else cuerpo.querySelector('.guia-ficha-panel')?.replaceChildren(ficha(a));
        });
        const det = h('details', { open: ts.length > 0 || abiertos.has(n.id) || n.padre === null }, [resumenRama, h('ul', {}, rama)]);
        det.addEventListener('toggle', () => { if (det.open) abiertos.add(n.id); else abiertos.delete(n.id); });
        return h('li', {}, [det]);
      }
      function fila(a) {
        // La ficha conserva el texto completo; el resumen de la lista nunca corta una marca.
        const primera = a.para.match(/^(?:\[\[[\s\S]*?\]\]|[^.!?;])*[.!?;](?=\s|$)/)?.[0] || a.para;
        return h('li', {}, [boton(a), h('small', { texto: t('sate.guia.acudir_' + (a.ambito || 'unidad')) }), h('p', {}, enLinea(primera, d))]);
      }
      const lista = vista === 'directorio' ? h('ul', { 'class': 'guia-directorio-lista' }, resultados.filter(a => a.para).map(fila)) : h('div', { 'class': 'guia-arbol' }, [...['unidad', 'ipn'].filter(v => !ambito || ambito === v).map(v => h('section', {}, [h('h3', { texto: t('sate.guia.acudir_' + v) }), h('ul', {}, nodos.filter(n => !n.padre && (instancias.get(n.id).ambito || 'unidad') === v).map(nodo))])), org ? h('p', { 'class': 'guia-arbol-fuente', texto: tx('fuente_estructura') }) : null]);
      const a = instancias.get(elegido);
      cuerpo.replaceChildren(lista, h('aside', { 'class': 'guia-ficha-panel' }, a ? [ficha(a)] : []));
      resumen.textContent = t(resultados.length ? 'sate.guia.detalle_instancias' : 'sate.guia.sin_resultados_preguntas', { n: resultados.length });
    }
    raizGuia.append(cab.nodo, h('div', { 'class': 'guia-apartado' }, [h('div', { 'class': 'guia-barra' }, [buscar.raiz, barra]), filtros, resumen, cuerpo]));
    pintar();
    if (abrirId && instancias.has(abrirId) && raiz.matchMedia('(max-width:899px)').matches) seleccionar(instancias.get(abrirId));
    return { titulo: cab.titulo };
  }

  function apartadoActividades(raizGuia, d, id) {
    const cab = cabecera([...migasBase(), { texto: tituloApartado('actividades') }], tituloApartado('actividades'));
    const contenido = d.actividades;
    const filtro = SateUI.buscador({ etiqueta: t('sate.guia.actividades_filtrar'), marcador: t('sate.guia.actividades_filtrar'), id: 'guia-actividades', alCambiar: valor => { consulta = valor; pintar(); } });
    const zona = h('div', { 'class': 'guia-actividades-vista' });
    const estado = h('p', { 'class': 'sate-sr', role: 'status', 'aria-live': 'polite' });
    let categoria = '', consulta = '';
    const categorias = [...new Set(contenido.elementos.map(a => a.categoria))];
    const nombres = new Map(contenido.elementos.map(a => [a.categoria, t('sate.guia.actividades_' + a.categoria)]));
    const resumirLugar = a => /en l[ií]nea|a distancia|plataforma/i.test(a.donde) ? t('sate.guia.actividades_en_linea') : /upiita|unidad acad[eé]mica/i.test(a.donde) ? t('sate.guia.actividades_tu_unidad') : t('sate.guia.actividades_otra_sede');
    const coincidencias = () => contenido.elementos.filter(a => !consulta || norm([a.nombre, a.ofrece, a.donde, a.requisitos, a.inscripcion, nombres.get(a.categoria)].join(' ')).includes(norm(consulta)));
    const fila = a => {
      const detalle = h('details', { 'class': 'guia-actividad-detalle' }, [h('summary', { texto: t('sate.guia.actividades_detalle') }), h('div', {}, [h('p', { texto: a.ofrece }), ...['requisitos', 'inscripcion', 'donde'].filter(k => a[k]).flatMap(k => [h('h4', { texto: t('sate.guia.actividades_' + k) }), h('p', { texto: a[k] })]), enlaceExterno('sate-recurso__enlace', a.url, t('sate.guia.actividades_sitio')), h('small', { texto: t('sate.guia.actividades_consulta', { fecha: fechaRevision(a.consulta) }) })])]);
      return h('li', { 'class': 'guia-actividad' }, [h('div', {}, [h('strong', { texto: a.nombre }), h('small', { texto: resumirLugar(a) }), enlaceExterno('guia-actividad-enlace', a.url, t('sate.guia.actividades_sitio'))]), detalle]);
    };
    function pintar() {
      const encontrados = coincidencias();
      estado.textContent = t('sate.guia.actividades_resultados', { n: encontrados.length });
      if (consulta) zona.replaceChildren(h('ul', { 'class': 'guia-actividades-lista' }, encontrados.map(fila)));
      else if (categoria) {
        const volver = h('a', { 'class': 'guia-actividades-volver', href: rutaGuia('actividades'), texto: '‹ ' + t('sate.guia.actividades_todas') });
        zona.replaceChildren(volver, h('h2', { texto: nombres.get(categoria) }), h('ul', { 'class': 'guia-actividades-lista' }, encontrados.filter(a => a.categoria === categoria).map(fila)));
      } else {
        zona.replaceChildren(h('ul', { 'class': 'guia-actividades-categorias' }, categorias.map(id => {
          const b = h('button', { type: 'button', 'class': 'guia-actividad-categoria', 'data-categoria': id }, [h('span', { 'class': 'guia-actividad-marca', 'aria-hidden': 'true' }), h('strong', { texto: nombres.get(id) }), h('small', { texto: t('sate.guia.actividades_resultados', { n: contenido.elementos.filter(a => a.categoria === id).length }) })]);
          b.addEventListener('click', () => { categoria = id; pintar(); });
          b.addEventListener('click', () => { raiz.location.hash = rutaGuia('actividades', id); });
          return h('li', {}, [b]);
        })));
      }
    }
    raizGuia.appendChild(cab.nodo);
    raizGuia.appendChild(h('section', { 'class': 'guia-apartado guia-actividades' }, [filtro.raiz, estado, zona]));
    categoria = categorias.includes(id) ? id : '';
    pintar();
    return { titulo: cab.titulo };
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
        const x = apartado === 'glosario' ? apartadoGlosario(raizGuia, d) : a.datos === 'actividades' ? apartadoActividades(raizGuia, d, id) : a.datos === 'faq' ? apartadoPreguntas(raizGuia, d, apartado, id) : a.datos === 'documentos' ? await apartadoReglamentos(raizGuia, d, id, ancla, () => mi === token) : apartadoAcudir(raizGuia, d, id);
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
