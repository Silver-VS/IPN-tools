/* Bibliotecas del IPN en SATE: busca desde SATE y abre los resultados en el sitio oficial (pestaña nueva).
   A. Funciones puras (URL de cada buscador a partir de data/sate.json: bibliotecas): se prueban en Node.
   B. Panel «Buscar en las bibliotecas del IPN»: lo usan la ficha de una unidad de aprendizaje y Programas de estudio. */
(function (raiz) {
  'use strict';

  /* ===================== A. Funciones puras ===================== */
  const CAMPOS = ['todo', 'titulo', 'autor', 'tema'];
  // El OCR mezcla APA, comillas y listas separadas por coma o punto y coma.
  // Solo se descarta el prefijo de autor cuando hay un delimitador reconocible.
  const EDITORIAL = /\b(?:pearson|mc\.?\s*-?\s*graw|mcgraw|wiley|springer|prentice|thomson|cengage|limusa|alfaomega|alfa\s*omega|oxford|cambridge|addison|elsevier|paraninfo|trillas|dover|crc|taylor|academic press|artech|apress|siam|mir|editorial|ediciones|publishing|publishers|press|interamericana|learning|hall)\b/i;
  const PAIS = /^(?:m[eé]xico|espa[nñ]a|usa|u\.s\.a\.?|uk|estados unidos|colombia|argentina|india|england|germany|great britain|netherlands|canad[aá])\b/i;
  const EDICION = /\s*[\(\[]?\s*(?:\d+\s*(?:[.ªºa-z°]{0,4})\s*\.?\s*(?:edici[oó]n|edition|ed\b\.?)|(?:primera|segunda|tercera|cuarta|quinta|sexta|s[eé]ptima|octava|novena|first|second|third|fourth|fifth|\d+(?:ra|da|er|era|ma|a))\s*(?:edici[oó]n|edition|ed\b\.?)|\d+\s*(?:ª|º|°)\s*(?:ed\b\.?)?)\s*[\)\]]?/giu;
  const AUTOR = /^[\p{Lu}][\p{L}'-]+(?:\s+[\p{Lu}][\p{L}'-]+)?,?\s+(?:\p{Lu}\.\s*){1,3}$|^[\p{Lu}][\p{L}'-]+,\s+\p{Lu}$|^(?:\p{Lu}\.\s*){1,3}\s*[\p{Lu}][\p{L}'-]+$/u;
  const esMalo = c => !c || !/\p{L}{3}/u.test(c) || EDITORIAL.test(c) && c.split(/\s+/).length <= 4 || AUTOR.test(c.trim()) || PAIS.test(c) ||
    /^(?:disponible|www\.|http)/i.test(c) || /^[\p{Lu}\s.,&]+$/u.test(c) && c.split(/\s+/).length <= 3 && /,/.test(c);
  // Limpia un candidato: viñetas, ediciones, paréntesis sin cerrar, «, País: Editorial» y signos sueltos.
  function limpiarTitulo(t) {
    let s = String(t || '').replace(/^[\s•*·\-–—]*\d{1,2}[.)]\s+/, '').replace(/^[\s•*·\-–—,;.:]+/, '');
    s = s.replace(EDICION, ' ').replace(/\(\s*\)|\[\s*\]/g, ' ').replace(/\s+([,;.])/g, '$1').replace(/([,;.])(?:\s*[,;.])+/g, '$1');
    s = s.replace(/[,;.]\s*(?:[\p{L} ]{2,25}:\s*)?(?:ed\.?|editorial|ediciones)\b.*$/iu, '');
    s = s.replace(/[,;.:]?\s*\b(?:m[eé]xico|espa[nñ]a|usa|u\.s\.a|uk|estados unidos|colombia|argentina|india|england|germany|great britain|netherlands|canad[aá]|madrid|barcelona|mosc[uú])\b.*$/iu, '');
    s = s.replace(/[,;.]\s*(?:USA|U\.S\.A\.?)\b.*$/, '');
    s = s.replace(new RegExp('(?:[,;]|\\s+Ed\\.?\\s)\\s*[^,;]*' + EDITORIAL.source + '.*$', 'i'), '').replace(/\(\s*coord\.?\s*\)|^\s*(?:et\.?\s*)?al\.?,\s*/gi, '').replace(/\s*;.*$/, '').replace(/\*+$/, '').replace(/\s+/g, ' ');
    if ((s.match(/\(/g) || []).length > (s.match(/\)/g) || []).length) s = s.replace(/\s*\([^)]*$/, '');
    if ((s.match(/\)/g) || []).length > (s.match(/\(/g) || []).length) s = s.replace(/^[^(]*\)\s*/, '');
    return s.replace(/\s+Ed\.?$/, '').replace(/^[\s,;.:&\-–]+|[\s,;.:&\-–]+$/g, '').trim();
  }
  // Segmentos de una referencia separados por coma, punto y coma o punto; se elige el más parecido a un título.
  function mejorSegmento(original) {
    const sinFecha = original.replace(/\((?:18|19|20)\d{2}[a-z]?\)/g, ',').replace(/\b(?:ISBN|ISSN)\b.*$/i, '');
    const partes = sinFecha.split(/\s*[;,]\s*|\.\s+/).map(limpiarTitulo).filter(p => p && !esMalo(p) && !/^\d/.test(p) && !/p[aá]gs?\b/i.test(p));
    let mejor = '';
    for (const p of partes) if (p.split(/\s+/).length > mejor.split(/\s+/).filter(Boolean).length) mejor = p;
    return mejor;
  }
  function tituloDeReferencia(texto) {
    const original = String(texto == null ? '' : texto).replace(/\s+/g, ' ').trim();
    // Renglones rotos del OCR: solo ISBN o solo una dirección web no son una referencia buscable.
    if (/^(?:(?:ISBN|ISSN)[\s:#-]*[\dX-]{8,}[.\s]*|(?:https?:\/\/|www\.)\S+)$/i.test(original)) return '';
    // Fragmento que empieza con una palabra suelta y su edición («Ambiental (1ª edición). …»): el título se perdió.
    if (/^\p{L}+\s*\(\s*\d+\s*[ªºa°.]*\s*ed/iu.test(original)) return '';
    const citado = original.match(/[“"«]([^”"»]+)[”"»]/);
    const fecha = original.match(/\((?:18|19|20)\d{2}[a-z]?\)\.?\s*(.+)/i);
    let s = citado ? citado[1] : fecha ? fecha[1] : original;
    if (!citado && !fecha) {
      // Iniciales como «T.D.» no son límites de título.
      s = s.replace(/\b(\p{L})\.(?=\p{L}\.)/gu, '$1');
      const autor = /^(?:[^.]+)\.\s+(?:Editorial|Ed\.|ISBN)/i.test(s) ? null : s.match(/^([^.;]+)\.\s+(.+)/);
      if (autor && /[,]|\s/.test(autor[1]) && /\p{L}{2,}$|\b[A-Z]{1,3}$/u.test(autor[1])) s = autor[2].replace(/^[;,\s]+/, '');
      const partes = s.split(/\s*[;,]\s*|\.\s+/).filter(Boolean);
      const candidato = partes.findIndex((p, i) => i > 0 && p.replace(/\b\p{L}\.?\b/gu, '').trim().split(/\s+/).filter(Boolean).length >= 1 &&
        !/^[A-Z]{1,4}\.?$/.test(partes[i + 1] || '') &&
        !/^(?:[A-Z]{1,4}\.?|y|and)$/u.test(p) && !/\b\p{L}\.?$/u.test(p) && !/^(?:ISBN|Ed\b|Editorial|\d)/i.test(p));
      if (!autor && candidato > 0) s = partes[candidato];
    }
    if (!citado) s = s.split(/\.\s+/)[0];
    s = s.replace(/\b(?:ISBN|ISSN)\b.*$/i, '')
      .replace(/(?:[,;]\s*|\s+)(?:(?:\d+(?:[.ªºa-z]+)?|primera|segunda|tercera|cuarta|quinta|sexta|séptima|octava|novena)\s*(?:edici[oó]n|edition|ed\b)|editorial\b|edit\.|ed\.|Mc\.?\s*Graw|Prentice\b|Pearson\b).*$/i, '')
      .replace(/\b(?:18|19|20)\d{2}\b.*$/, '');
    s = limpiarTitulo(s);
    if (esMalo(s)) s = mejorSegmento(original) || s;
    // Conservar conectores y subtítulos; ocho palabras acotan el título mostrado.
    if (s && s.split(/\s+/).length === 1) {
      const alterno = mejorSegmento(original);
      if (alterno.split(/\s+/).length >= 2) s = alterno;
    }
    // «Apellido Nombre» antes del primer punto es autor: el título es el segmento siguiente.
    if (/^\p{Lu}[\p{L}'-]+\s+\p{Lu}[\p{L}'-]+$/u.test(s) && original.startsWith(s + '.')) {
      const siguiente = limpiarTitulo(original.slice(s.length + 1).split(/\.\s+/)[0]);
      if (siguiente && !esMalo(siguiente)) s = siguiente;
    }
    let corto = (s && /\p{L}{3}/u.test(s) ? s : original).split(/\s+/).slice(0, 8).join(' ');
    if ((corto.match(/\(/g) || []).length > (corto.match(/\)/g) || []).length) corto = corto.replace(/\s*\([^)]*$/, '');
    return corto.replace(/[\s,;:.&–-]+$/, '');
  }
  const VACIAS = new Set('de del la las los el y e en para por con a an the of and for to in on with su sus un una al o u que como sobre desde'.split(' '));
  // Término de consulta para el catálogo: 4–5 palabras significativas del título (antes de «:» o «.»),
  // porque el catálogo del IPN responde mal a títulos largos completos.
  function consultaDeReferencia(titulo, maximo) {
    const base = String(titulo == null ? '' : titulo).split(/[:.]/)[0];
    const palabras = (base.match(/[\p{L}\p{N}]+/gu) || []).filter(w => w.length > 2 && !VACIAS.has(w.toLowerCase()));
    return palabras.slice(0, maximo || 5).join(' ');
  }
  // URL de un buscador: el término se codifica con encodeURIComponent; sin término se abre la portada del buscador.
  // op: {campo: 'todo'|'titulo'|'autor'|'tema', biblioteca: código de la biblioteca de la unidad (solo el catálogo lo filtra)}
  function url(fuente, termino, op) {
    op = op || {};
    const q = String(termino == null ? '' : termino).trim();
    if (!fuente || !fuente.url) return '';
    if (!q) return fuente.inicio || '';
    const campo = (fuente.campos && (fuente.campos[op.campo] || fuente.campos.todo)) || {};
    let u = fuente.url
      .replace('{termino}', encodeURIComponent((campo.prefijo || '') + q))
      .replace('{campo}', encodeURIComponent(campo.codigo || ''));
    if (op.adyacente && fuente.adyacente) u += fuente.adyacente;
    if (op.biblioteca && fuente.filtroUnidad) u += fuente.filtroUnidad.replace('{biblioteca}', encodeURIComponent(op.biblioteca));
    return u;
  }
  const destinos = (fuentes, termino, op) => (fuentes || []).map(f => ({ id: f.id, titulo: f.titulo, descripcion: f.descripcion, aviso: f.aviso || null, href: url(f, termino, op) }));
  raiz.SateBibliotecas = { CAMPOS, url, destinos, tituloDeReferencia, consultaDeReferencia };

  if (typeof raiz.SATE === 'undefined' || typeof raiz.SATE_CONFIG === 'undefined' || typeof document === 'undefined') return;

  /* ===================== B. Panel de búsqueda ===================== */
  const t = (c, v) => SATE.texto(c, v);
  const h = (etiqueta, atributos, hijos) => {
    const n = document.createElement(etiqueta);
    for (const k in atributos || {}) {
      const v = atributos[k];
      if (v == null || v === false) continue;
      if (k === 'texto') n.textContent = v; else n.setAttribute(k, v === true ? '' : v);
    }
    for (const x of hijos || []) if (x) n.appendChild(typeof x === 'string' ? document.createTextNode(x) : x);
    return n;
  };
  let contador = 0;
  function referencia(texto) {
    const titulo = tituloDeReferencia(texto);
    const catalogo = (SATE_CONFIG.bibliotecas || []).find(f => f.id === 'catalogo');
    return h('li', { 'class': 'sate-biblio__referencia' }, [
      h('span', { texto }), catalogo && titulo ? h('a', { 'class': 'sate-btn sate-btn--chico',
        href: url(catalogo, consultaDeReferencia(titulo) || titulo, { campo: 'titulo', adyacente: true }), target: '_blank', rel: 'noopener',
        'aria-label': t('sate.biblio.disponibilidad_titulo', { titulo }), texto: t('sate.biblio.disponibilidad') }) : null]);
  }
  raiz.SateBibliotecas.referencia = referencia;
  // panel({termino, titulo?}) → Element. La biblioteca de la unidad sale de data/sate.json (unidades.<id>.biblioteca).
  function panel(op) {
    op = op || {};
    const fuentes = SATE_CONFIG.bibliotecas || [], unidad = SATE_CONFIG.unidades[raiz.SATE_UNIDAD] || {};
    const id = 'sate-biblio-' + (++contador);
    const estado = { campo: 'todo', soloUnidad: false };
    const enlaces = {};
    const buscar = SateUI.buscador({ etiqueta: t('sate.biblio.etiqueta'), marcador: t('sate.biblio.marcador'), valor: op.termino || '', id: id + '-q', alCambiar: pintar, alEnviar: () => {
      const f = fuentes[0]; if (f) raiz.open(url(f, buscar.entrada.value, opciones()), '_blank', 'noopener,noreferrer');
    } });
    const campo = h('select', { id: id + '-campo' }, CAMPOS.map(c => h('option', { value: c, texto: t('sate.biblio.campo_' + c) })));
    campo.addEventListener('change', () => { estado.campo = campo.value; pintar(); });
    const casilla = unidad.biblioteca ? h('input', { type: 'checkbox', id: id + '-unidad' }) : null;
    if (casilla) casilla.addEventListener('change', () => { estado.soloUnidad = casilla.checked; pintar(); });
    const opciones = () => ({ campo: estado.campo, biblioteca: estado.soloUnidad ? unidad.biblioteca : null });
    const lista = h('ul', { 'class': 'sate-biblio__destinos' }, fuentes.map(f => {
      const a = SateUI.tarjetaNav({ href: f.inicio || '#', titulo: t(f.titulo), detalle: t(f.descripcion), externo: true, compacta: true });
      enlaces[f.id] = a;
      return h('li', {}, [a]);
    }));
    function pintar() {
      const q = buscar.entrada.value;
      for (const f of fuentes) enlaces[f.id].setAttribute('href', url(f, q, opciones()) || f.inicio || '#');
      // El filtro por biblioteca solo aplica al catálogo; el campo, a los dos buscadores que lo admiten.
    }
    pintar();
    const avisos = fuentes.filter(f => f.aviso).map(f => h('p', { 'class': 'sate-biblio__aviso', texto: t(f.aviso) }));
    return h('section', { 'class': 'sate-biblio', 'aria-labelledby': id + '-t' }, [
      h('div', {}, [h('h3', { id: id + '-t', texto: op.titulo || t('sate.biblio.titulo') }), h('p', { 'class': 'sate-biblio__ayuda', texto: t('sate.biblio.ayuda') })]),
      buscar.raiz,
      h('div', { 'class': 'sate-biblio__opciones' }, [
        h('label', { 'class': 'sate-biblio__campo', 'for': id + '-campo' }, [h('span', { texto: t('sate.biblio.campo') }), campo]),
        casilla ? h('label', { 'class': 'sate-biblio__casilla', 'for': id + '-unidad' }, [casilla, h('span', { texto: t('sate.biblio.solo_unidad', { unidad: unidad.siglas || '' }) })]) : null]),
      lista, ...avisos]);
  }
  raiz.SateBibliotecas.panel = panel;
})(typeof window !== 'undefined' ? window : globalThis);
