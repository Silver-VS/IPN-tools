// DOM mínimo en memoria para las pruebas qa_sate_*: árbol de nodos, atributos, clases, selectores simples y eventos con
// propagación. No es un navegador: solo lo que usan el lector de PoliCORE y temarios.js (sin selectores con «>» ni «+»).
const kebab = s => s.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
const camel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function analizar(sel) {
  return sel.split(',').map(g => g.trim()).filter(Boolean).map(g => g.split(/\s+/).map(comp => {
    const c = { tag: null, id: null, clases: [], attrs: [], no: [] };
    let resto = comp;
    resto = resto.replace(/:not\(([^)]*)\)/g, (_, x) => { c.no.push(analizar(x)[0][0]); return ''; });
    const t = resto.match(/^[a-zA-Z][a-zA-Z0-9]*/); if (t) { c.tag = t[0].toUpperCase(); resto = resto.slice(t[0].length); }
    const re = /#([\w-]+)|\.([\w-]+)|\[([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\]]*)))?\]/g;
    let m; while ((m = re.exec(resto))) {
      if (m[1]) c.id = m[1]; else if (m[2]) c.clases.push(m[2]);
      else c.attrs.push([m[3], m[4] ?? m[5] ?? m[6]]);
    }
    return c;
  }));
}
function coincideComp(n, c) {
  if (n.nodeType !== 1) return false;
  if (c.tag && n.tagName !== c.tag) return false;
  if (c.id && n.getAttribute('id') !== c.id) return false;
  for (const k of c.clases) if (!n.classList.contains(k)) return false;
  for (const [a, v] of c.attrs) { if (!n.hasAttribute(a)) return false; if (v !== undefined && n.getAttribute(a) !== v) return false; }
  for (const x of c.no) if (coincideComp(n, x)) return false;
  return true;
}
function coincide(n, grupos) {
  return grupos.some(cadena => {
    if (!coincideComp(n, cadena[cadena.length - 1])) return false;
    let a = n.parentNode;
    for (let i = cadena.length - 2; i >= 0; i--) {
      while (a && !coincideComp(a, cadena[i])) a = a.parentNode;
      if (!a) return false;
      a = a.parentNode;
    }
    return true;
  });
}

export function crearEntorno() {
  const doc = { activeElement: null, scrolled: null, copiado: [] };
  class Evento {
    constructor(type, o = {}) { Object.assign(this, { type, bubbles: true, defaultPrevented: false, _stop: false }, o); }
    preventDefault() { this.defaultPrevented = true; }
    stopPropagation() { this._stop = true; }
  }
  class Nodo {
    constructor() { this.parentNode = null; this.childNodes = []; this._ev = {}; }
    get firstChild() { return this.childNodes[0] || null; }
    get nextSibling() { const p = this.parentNode; return p ? p.childNodes[p.childNodes.indexOf(this) + 1] || null : null; }
    get isConnected() { let n = this; while (n.parentNode) n = n.parentNode; return n === doc.documentElement || n === doc.raiz; }
    _insertar(n, antes) {
      if (n.nodeType === 11) { for (const h of [...n.childNodes]) this._insertar(h, antes); return n; }
      if (n.parentNode) n.parentNode.removeChild(n);
      n.parentNode = this;
      if (antes) this.childNodes.splice(this.childNodes.indexOf(antes), 0, n); else this.childNodes.push(n);
      return n;
    }
    appendChild(n) { return this._insertar(n, null); }
    append(...ns) { for (const n of ns) this.appendChild(typeof n === 'string' ? doc.createTextNode(n) : n); }
    insertBefore(n, ref) { return this._insertar(n, ref); }
    removeChild(n) { const i = this.childNodes.indexOf(n); if (i >= 0) { this.childNodes.splice(i, 1); n.parentNode = null; } return n; }
    replaceChild(nuevo, viejo) { this._insertar(nuevo, viejo); this.removeChild(viejo); return viejo; }
    remove() { if (this.parentNode) this.parentNode.removeChild(this); }
    replaceChildren(...ns) { for (const h of [...this.childNodes]) this.removeChild(h); for (const n of ns) this.appendChild(typeof n === 'string' ? doc.createTextNode(n) : n); }
    contains(n) { for (; n; n = n.parentNode) if (n === this) return true; return false; }
    normalize() {
      const out = [];
      for (const h of this.childNodes) {
        if (h.nodeType === 3) { if (!h.nodeValue) continue; const u = out[out.length - 1]; if (u && u.nodeType === 3) { u.nodeValue += h.nodeValue; continue; } }
        else if (h.normalize) h.normalize();
        out.push(h);
      }
      this.childNodes = out; out.forEach(h => { h.parentNode = this; });
    }
    get textContent() { return this.childNodes.map(h => h.textContent).join(''); }
    set textContent(v) { for (const h of [...this.childNodes]) this.removeChild(h); if (v !== '' && v != null) this.appendChild(doc.createTextNode(String(v))); }
    addEventListener(t, f) { (this._ev[t] ||= []).push(f); }
    removeEventListener(t, f) { this._ev[t] = (this._ev[t] || []).filter(x => x !== f); }
    dispatchEvent(e) {
      e.target ||= this;
      for (let n = this; n && !e._stop; n = n.parentNode || (n === doc.documentElement ? doc : null)) {
        e.currentTarget = n;
        for (const f of [...(n._ev?.[e.type] || [])]) f(e);
        if (!e.bubbles) break;
      }
      return !e.defaultPrevented;
    }
  }
  class Texto extends Nodo {
    constructor(v) { super(); this.nodeType = 3; this.nodeValue = String(v); }
    get textContent() { return this.nodeValue; }
    set textContent(v) { this.nodeValue = String(v); }
  }
  class Fragmento extends Nodo { constructor() { super(); this.nodeType = 11; } }
  class Elemento extends Nodo {
    constructor(tag) {
      super(); this.nodeType = 1; this.tagName = tag.toUpperCase(); this._attrs = new Map(); this.clientWidth = 0;
      this.style = {setProperty() {}}; this.hidden = false; this.disabled = false; this.open = false; this.value = '';
      const self = this;
      this.dataset = new Proxy({}, {
        get: (_, k) => (typeof k === 'string' && self._attrs.has('data-' + kebab(k)) ? self._attrs.get('data-' + kebab(k)) : undefined),
        set: (_, k, v) => { self._attrs.set('data-' + kebab(k), String(v)); return true; },
        has: (_, k) => self._attrs.has('data-' + kebab(k)),
        deleteProperty: (_, k) => { self._attrs.delete('data-' + kebab(k)); return true; },
        ownKeys: () => [...self._attrs.keys()].filter(k => k.startsWith('data-')).map(k => camel(k.slice(5))),
        getOwnPropertyDescriptor: (_, k) => ({ enumerable: true, configurable: true, value: self._attrs.get('data-' + kebab(k)) })
      });
      this.classList = {
        _l: () => (self._attrs.get('class') || '').split(/\s+/).filter(Boolean),
        _e: l => self._attrs.set('class', l.join(' ')),
        contains(c) { return this._l().includes(c); },
        add(...cs) { const l = this._l(); cs.forEach(c => { if (!l.includes(c)) l.push(c); }); this._e(l); },
        remove(...cs) { this._e(this._l().filter(c => !cs.includes(c))); },
        toggle(c, f) { const on = f === undefined ? !this.contains(c) : !!f; if (on) this.add(c); else this.remove(c); return on; }
      };
    }
    get id() { return this._attrs.get('id') || ''; }
    get className() { return this._attrs.get('class') || ''; }
    set className(v) { this._attrs.set('class', v); }
    get children() { return this.childNodes.filter(n => n.nodeType === 1); }
    getAttribute(k) { return this._attrs.has(k) ? this._attrs.get(k) : null; }
    setAttribute(k, v) { this._attrs.set(k, String(v)); if (k === 'hidden') this.hidden = true; }
    removeAttribute(k) { this._attrs.delete(k); if (k === 'hidden') this.hidden = false; }
    hasAttribute(k) { return this._attrs.has(k); }
    toggleAttribute(k, f) { const on = f === undefined ? !this.hasAttribute(k) : !!f; if (on) this.setAttribute(k, ''); else this.removeAttribute(k); return on; }
    matches(sel) { return coincide(this, analizar(sel)); }
    closest(sel) { const g = analizar(sel); for (let n = this; n; n = n.parentNode) if (n.nodeType === 1 && coincide(n, g)) return n; return null; }
    querySelectorAll(sel) {
      const g = analizar(sel), r = [];
      const rec = n => { for (const h of n.childNodes) if (h.nodeType === 1) { if (coincide(h, g)) r.push(h); rec(h); } };
      rec(this); return r;
    }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    focus() { doc.activeElement = this; }
    select() {}
    scrollIntoView(o) { doc.scrolled = this; doc.scrollOpciones = o; }
    getBoundingClientRect() { return { width: this.clientWidth, height: 0, top: 0, left: 0 }; }
    click() { return this.dispatchEvent(new Evento('click', { target: this })); }
  }
  // Los atributos reflejan en propiedades que el código lee directamente.
  const reflejo = Object.getOwnPropertyDescriptor(Elemento.prototype, 'setAttribute');
  Elemento.prototype.setAttribute = function (k, v) {
    reflejo.value.call(this, k, v);
    if (k === 'disabled') this.disabled = true;
    if (k === 'value') this.value = String(v);
  };
  doc.createElement = t => new Elemento(t);
  doc.createTextNode = v => new Texto(v);
  doc.createDocumentFragment = () => new Fragmento();
  doc.documentElement = new Elemento('html');
  doc.head = doc.documentElement.appendChild(new Elemento('head'));
  doc.body = doc.documentElement.appendChild(new Elemento('body'));
  doc.querySelector = s => doc.documentElement.querySelector(s);
  doc.querySelectorAll = s => doc.documentElement.querySelectorAll(s);
  doc.getElementById = id => doc.documentElement.querySelector('#' + id);
  doc.addEventListener = (t, f) => (doc._ev ||= {}, (doc._ev[t] ||= []).push(f));
  doc.dispatchEvent = e => { for (const f of [...(doc._ev?.[e.type] || [])]) f(e); return !e.defaultPrevented; };
  doc.execCommand = () => false;
  doc.currentScript = null;
  return { document: doc, Evento, Elemento, Texto, Fragmento };
}
