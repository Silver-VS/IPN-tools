/* Bibliotecas del IPN en SATE: busca desde SATE y abre los resultados en el sitio oficial (pestaña nueva).
   A. Funciones puras (URL de cada buscador a partir de data/sate.json: bibliotecas): se prueban en Node.
   B. Panel «Buscar en las bibliotecas del IPN»: lo usan la ficha de una unidad de aprendizaje y Programas de estudio. */
(function (raiz) {
  'use strict';

  /* ===================== A. Funciones puras ===================== */
  const CAMPOS = ['todo', 'titulo', 'autor', 'tema'];
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
  raiz.SateBibliotecas = { CAMPOS, url, destinos };

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
