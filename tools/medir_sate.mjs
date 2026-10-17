// Sin navegador ni red. KB sin comprimir; ms = transferencia a 10 Mbit/s + parse local.
// No estima latencia, ejecución JS, DOM, layout ni bibliotecas externas de gráficas.
import {readFileSync, existsSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import vm from 'node:vm';
const base = 'web/dist/sate', unidad = process.argv.find(a=>a.startsWith('--unidad='))?.split('=')[1] || 'upiita';
const html = readFileSync(join(base,'index.html'),'utf8');
const config = JSON.parse(html.match(/window.SATE_CONFIG=([\s\S]*?);<\/script>/)[1]);
const cfg = config.unidades[unidad];
const contexto=vm.createContext({});
vm.runInContext(readFileSync('web/sate/rutas.js','utf8'),contexto);
const filas=[];
for(const tab of [...cfg.pestanas,...(cfg.vistas||[]).map(v=>v.id)]){
  const archivos = contexto.SateRutas.recursos(cfg,unidad,tab).map(archivo=>{
    const ruta=join(base,archivo);
    if(!existsSync(ruta)) throw new Error('Compila primero: '+ruta);
    const s=readFileSync(ruta,'utf8'), bytes=Buffer.byteLength(s);
    let parseMs=0;
    if(archivo.endsWith('.json')){
      for(let i=0;i<5;i++)JSON.parse(s);
      const inicio=performance.now();for(let i=0;i<50;i++)JSON.parse(s);
      parseMs=(performance.now()-inicio)/50;
    }
    return {archivo,bytes,parseMs};
  });
  const bytes=archivos.reduce((n,a)=>n+a.bytes,0), parseMs=archivos.reduce((n,a)=>n+a.parseMs,0);
  filas.push({tab,KB:+(bytes/1000).toFixed(1),parseMs:+parseMs.toFixed(3),estimadoMs:+(bytes/1250+parseMs).toFixed(1),archivos});
}
const resultado={unidad,modelo:'Primer clic frío sin perfil tras núcleo; 10 Mbit/s, sin latencia ni DOM; caché y precarga excluidas',filas,
  sincrono:{trayectoria:'Estadísticas y secciones abiertas; con perfil puede cargar D3/Plot',mapa:'Seriación, sugerencias, mapa y lista',horarios:'Filtros, oferta y agenda',tramites:'Estado y lista de trámites',calendario:'Eventos y cuadrícula mensual',guia:'Portada y apartados',temarios:'Índice y explorador'},
  bajoDemanda:['dictamen-pdf.json','bajas-pdf.json','electivas.json','electivas-pdf.json','pdf-lib y estampadores PDF','reglamentos/<documento>.json','temarios/<carrera>.json','recursos/<carrera>.json'],
  limitacion:'Pintado no aislado: requiere DOM, layout y perfil. ?medir permite medirlo localmente. No se extrapola desde JSON.parse.'};
const salida=process.argv.find(a=>a.startsWith('--salida='))?.slice(9);
if(salida)writeFileSync(salida,JSON.stringify(resultado,null,2)+'\n','utf8');
console.log(JSON.stringify(resultado,null,2));
