// Prueba headless (Chrome + CDP) de web/qa-componentes.html. Uso: node tests/qa_componentes.mjs
// Requiere haber generado la página (python tools/build_qa_componentes.py). Variable CHROME opcional.
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = [process.env.CHROME, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', '/usr/bin/google-chrome'].find(p => p && existsSync(p));
const PAGINA = pathToFileURL(resolve('web/qa-componentes.html')).href;
const PUERTO = 9333 + Math.floor(Math.random() * 500);
const fallos = [];
const ok = (c, m) => { if (!c) { fallos.push(m); console.log('FALLO', m); } };

const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PUERTO}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'qa-'))}`, '--no-first-run', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });
const esperar = ms => new Promise(r => setTimeout(r, ms));
async function destino() {
  for (let i = 0; i < 50; i++) {
    try { const l = await (await fetch(`http://127.0.0.1:${PUERTO}/json`)).json(); const p = l.find(x => x.type === 'page'); if (p) return p.webSocketDebuggerUrl; } catch {}
    await esperar(200);
  }
  throw new Error('Chrome no respondió');
}
const ws = new WebSocket(await destino());
await new Promise(r => ws.addEventListener('open', r));
let n = 0; const pend = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const cdp = (method, params = {}) => new Promise(r => { const id = ++n; pend.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const ev = async expr => { const r = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails)); return r.result.result.value; };
const tecla = async (key, code = key, vk = 0) => { for (const type of ['keyDown', 'keyUp']) await cdp('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: vk }); await esperar(80); };
const errores = [];
await cdp('Runtime.enable');
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') errores.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description || '')); });

for (const [ancho, alto, movil] of [[1280, 800, false], [375, 812, true]]) {
  for (const tema of ['claro', 'oscuro']) {
    const etq = `${ancho}px/${tema}`;
    await cdp('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: movil });
    await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: tema === 'oscuro' ? 'dark' : 'light' }, { name: 'hover', value: movil ? 'none' : 'hover' }] });
    await cdp('Page.enable');
    await cdp('Page.navigate', { url: PAGINA });
    await esperar(600);
    ok(await ev(`document.querySelectorAll('.sate-chip').length`) === 5, `${etq}: 5 chips`);
    ok(await ev(`document.querySelectorAll('.sate-aviso').length`) === 4, `${etq}: 4 avisos`);
    ok(await ev(`!document.documentElement.scrollWidth || document.documentElement.scrollWidth <= innerWidth`), `${etq}: sin desplazamiento horizontal`);
    // modal: abre, Esc cierra y el foco vuelve al botón
    await ev(`document.getElementById('abrir-modal').focus(); document.getElementById('abrir-modal').click()`);
    await esperar(150);
    ok(await ev(`document.querySelector('.sate-modal').open`), `${etq}: el modal abre`);
    ok(await ev(`document.querySelector('.sate-modal').contains(document.activeElement)`), `${etq}: foco dentro del modal`);
    await tecla('Tab', 'Tab', 9); await tecla('Tab', 'Tab', 9); await tecla('Tab', 'Tab', 9);
    ok(await ev(`document.querySelector('.sate-modal').contains(document.activeElement)`), `${etq}: el foco queda atrapado`);
    if (movil) ok(await ev(`(() => { const r = document.querySelector('.sate-modal').getBoundingClientRect(); return Math.abs(r.bottom - innerHeight) < 2 && r.width >= innerWidth - 1 })()`), `${etq}: hoja inferior`);
    await tecla('Escape', 'Escape', 27);
    ok(!(await ev(`document.querySelector('.sate-modal').open`)), `${etq}: Esc cierra el modal`);
    ok(await ev(`document.activeElement.id === 'abrir-modal'`), `${etq}: el foco regresa al botón`);
    // pestañas con flechas
    await ev(`document.querySelector('.sate-pestanas[role=tablist] .sate-pestana').focus()`);
    await tecla('ArrowRight', 'ArrowRight', 39);
    ok(await ev(`document.activeElement.dataset.id === 'dos' && document.activeElement.getAttribute('aria-selected') === 'true' && !document.getElementById('p-uno').hidden === false && !document.getElementById('p-dos').hidden`), `${etq}: ArrowRight pasa a la 2.ª pestaña y muestra su panel`);
    await tecla('ArrowLeft', 'ArrowLeft', 37); await tecla('ArrowLeft', 'ArrowLeft', 37);
    ok(await ev(`document.activeElement.dataset.id === 'tres'`), `${etq}: ArrowLeft da la vuelta`);
    // ayuda: globo en escritorio, modal en teléfono
    await ev(`document.querySelector('#demo-ayuda .sate-ayuda__btn').focus(); document.querySelector('#demo-ayuda .sate-ayuda__btn').click()`);
    await esperar(100);
    if (movil) { ok(await ev(`document.querySelector('.sate-modal').open && document.querySelector('.sate-modal a') !== null`), `${etq}: la ayuda abre modal con enlace`); await tecla('Escape', 'Escape', 27); }
    else { ok(await ev(`!document.querySelector('#demo-ayuda .sate-globo').hidden && document.querySelector('#demo-ayuda .sate-globo a') !== null`), `${etq}: la ayuda abre globo con enlace`); await tecla('Escape', 'Escape', 27); ok(await ev(`document.querySelector('#demo-ayuda .sate-globo').hidden`), `${etq}: Esc cierra el globo`); }
    // barra inferior: visible solo en teléfono, 48 px
    const barra = await ev(`(() => { const b = document.querySelector('.sate-barra'); const s = getComputedStyle(b); return { disp: s.display, h: b.getBoundingClientRect().height } })()`);
    if (movil) ok(barra.disp === 'flex' && Math.round(barra.h) === 48, `${etq}: barra inferior 48 px (${JSON.stringify(barra)})`); else ok(barra.disp === 'none', `${etq}: barra oculta en escritorio`);
    // desplegable recordado
    await ev(`localStorage.removeItem('ipnt.ui.desp.qa'); document.querySelector('.sate-desp').open = true`); await esperar(100);
    ok(await ev(`localStorage.getItem('ipnt.ui.desp.qa') === '1'`), `${etq}: el desplegable guarda su estado`);
    await ev(`document.querySelector('.sate-desp').open = false`);
    // colores de estado y contraste calculados en el navegador
    const bajos = await ev(`(() => {
      const rgb = s => s.match(/[\\d.]+/g).slice(0, 3).map(Number);
      const lum = c => { const f = v => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4) }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]) };
      const fondo = n => { for (; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (!/rgba\\(.*, 0\\)|transparent/.test(c)) return rgb(c) } return [255, 255, 255] };
      const malos = [];
      document.querySelectorAll('.sate-chip__texto,.sate-chip__marca,.sate-aviso__titulo,.sate-aviso__cuerpo,.sate-enlace,.sate-pestana,.sate-btn,.sate-desp summary span,.sate-ayuda__btn,.sate-barra__btn').forEach(n => {
        if (!n.offsetParent && getComputedStyle(n).position !== 'fixed') return;
        const st = getComputedStyle(n), a = lum(rgb(st.color)), b = lum(fondo(n)), r = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
        if (r < 4.5) malos.push(n.className + ' ' + r.toFixed(2));
      });
      return malos })()`);
    ok(bajos.length === 0, `${etq}: contraste AA bajo en ${JSON.stringify(bajos)}`);
  }
}
ok(errores.length === 0, 'errores de consola/JS: ' + errores.join(' | '));
console.log(fallos.length ? `${fallos.length} fallos` : 'qa-componentes: todo en orden');
ws.close(); proc.kill();
process.exit(fallos.length ? 1 : 0);
