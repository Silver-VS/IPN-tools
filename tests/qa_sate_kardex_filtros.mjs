// Regresión de filtros del kárdex con intentos ficticios, sin navegador.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const fuente = readFileSync('web/sate/desempeno.js', 'utf8');
const helpers = fuente.match(/const kardexFueraOrdinario=[^;]+;\nconst kardexMostrarReinicio=[^;]+;/)?.[0];
assert.ok(helpers, 'deben existir las reglas del filtro y del reinicio');
const contexto = vm.createContext({});
vm.runInContext(helpers+';globalThis.fuera=kardexFueraOrdinario;globalThis.reinicio=kardexMostrarReinicio', contexto);

const caso = (codigo, intentos=1) => contexto.fuera({codigo}, intentos);
assert.equal(caso('EXT'), true, 'extraordinario pertenece al filtro');
assert.equal(caso('ETS'), true, 'ETS pertenece al filtro');
assert.equal(caso('REC'), true, 'recursamiento pertenece al filtro');
assert.equal(caso('ORD', 2), true, 'dos intentos pertenecen al filtro aunque la última fila sea ordinaria');
assert.equal(caso('ORD'), false, 'ordinario acreditado a la primera queda fuera');
assert.equal(caso('EQV'), false, 'equivalencia por sí sola no indica intento fuera de ordinario');
assert.equal(contexto.reinicio('*'), false, 'reinicio oculto al mostrar todos los periodos');
assert.equal(contexto.reinicio('2026/1'), true, 'reinicio visible cuando hay periodo elegido');
assert.match(fuente, /\$\('#kx-todos'\)\.hidden=!kardexMostrarReinicio\(filtro\.periodo\)/);
assert.match(fuente, /role="group" aria-label="\$\{esc\(SATE\.texto\('sate\.trayectoria\.kardex_estado'/);
console.log('OK filtros del kárdex: fuera de ordinario, reinicio contextual y opciones exclusivas');
