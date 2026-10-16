/* Bibliotecas del IPN en SATE: busca desde SATE y abre los resultados en el sitio oficial (pestaña nueva).
   A. Funciones puras (URL de cada buscador a partir de data/sate.json: bibliotecas): se prueban en Node.
   B. Panel «Buscar en las bibliotecas del IPN»: lo usan la ficha de una unidad de aprendizaje y Programas de estudio. */
(function (raiz) {
  'use strict';

  /* ===================== A. Funciones puras ===================== */
  const CAMPOS = ['todo', 'titulo', 'autor', 'tema'];
  // El OCR mezcla APA, comillas y listas separadas por coma o punto y coma.
  // Solo se descarta el prefijo de autor cuando hay un delimitador reconocible.
  function tituloDeReferencia(texto) {
    const original = String(texto == null ? '' : texto).replace(/\s+/g, ' ').trim();
    const citado = original.match(/[“"]([^”"]+)[”"]/);
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
      .replace(/\b(?:18|19|20)\d{2}\b.*$/, '').replace(/[.;,\s–-]+$/, '').trim();
    // Conservar conectores y subtítulos; ocho palabras acotan la consulta sin inventar términos.
    return (s && /\p{L}{3}/u.test(s) ? s : original).split(/\s+/).slice(0, 8).join(' ');
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
    if (op.biblioteca && fuente.filtroUnidad) u += fuente.filtroUnidad.replace('{biblioteca}', encodeURIComponent(op.biblioteca));
    return u;
  }
  const destinos = (fuentes, termino, op) => (fuentes || []).map(f => ({ id: f.id, titulo: f.titulo, descripcion: f.descripcion, aviso: f.aviso || null, href: url(f, termino, op) }));
  raiz.SateBibliotecas = { CAMPOS, url, destinos, tituloDeReferencia };

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
        href: url(catalogo, titulo, { campo: 'titulo' }), target: '_blank', rel: 'noopener',
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
