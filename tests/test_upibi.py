"""Regresiones de la integración UPIBI; perfiles y profesores ficticios."""
import json, os, pathlib, re, subprocess, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
os.environ['UNIDAD'] = 'upibi'
import build_horarios as build
import extract_mapa_upibi as extract


class UPIBI(unittest.TestCase):
    def test_celda_con_muchas_materias_cabe_en_su_semestre(self):
        cur = {f'DEMO{i}': [f'Materia ficticia {i}', 6, 1 if i < 9 else 2, 'O'] for i in range(12)}
        layout = build.layout_por_areas(cur, {'areas': [{'nombre': 'Área de prueba', 'claves': list(cur)}]})
        self.assertTrue(layout['filas_exactas'])
        for b in layout['boxes']:
            center = dict(layout['rows'])[b[6]]
            self.assertGreaterEqual(b[1], center - layout['pitch'] / 2)
            self.assertLessEqual(b[1] + b[3], center + layout['pitch'] / 2)

    def test_seis_mapas_sin_solapamientos_y_en_su_semestre(self):
        html = (ROOT/'web/dist/horarios-upibi.html').read_text(encoding='utf8')
        data = json.loads(re.search(r'const DATA=(.*?);\n',html).group(1))
        for car, mp in data['mapas'].items():
            layout = mp['layout']; rows = dict(layout['rows']); boxes = layout['boxes']
            self.assertTrue(layout['filas_exactas'],car)
            for i, b in enumerate(boxes):
                center = rows[b[6]]
                self.assertGreaterEqual(b[1],center-layout['pitch']/2,(car,b))
                self.assertLessEqual(b[1]+b[3],center+layout['pitch']/2,(car,b))
                if b[4]: self.assertEqual(b[6],mp['cur'][b[4]][2],(car,b))
                for a in boxes[:i]:
                    overlap = min(a[0]+a[2],b[0]+b[2]) > max(a[0],b[0]) and min(a[1]+a[3],b[1]+b[3]) > max(a[1],b[1])
                    self.assertFalse(overlap,(car,a,b))

    def test_navegador_conserva_centros_exactos_de_fila(self):
        html = (ROOT/'web/horarios.template.html').read_text(encoding='utf8')
        fn = re.search(r'function rowBands\(L\)\{.*?\n\}',html,re.S).group(0)
        script = fn + """
const assert=require('assert');
const L={filas_exactas:true,propuesto:false,pitch:200,h:408,
 rows:[[1,104],[2,304]],boxes:[[0,30,128,44],[0,82,128,44],[0,230,128,44]]};
assert.deepStrictEqual(rowBands(L),[[1,104,4,204],[2,304,204,404]]);
"""
        result = subprocess.run(['node','-e',script],text=True,capture_output=True)
        self.assertEqual(result.returncode,0,result.stderr)

    def test_claves_reutilizadas_por_plan(self):
        cur = build.load_curriculum()
        self.assertEqual(build.lookup(cur, 'B', 'COMUNICACIÓN PROFESIONAL', 1), [4.5, 'B109', 'O'])
        self.assertEqual(build.lookup(cur, 'B_06', 'INGLES I', 1), [3.0, 'B107', 'O'])
        self.assertEqual(build.carrera_plan('B', '24'), 'B')
        self.assertEqual(build.carrera_plan('B', '06'), 'B_06')
        self.assertEqual(build.carrera_plan('M', '06'), 'M')

    def test_salones_alineados_con_bloques_ordenados(self):
        common = {'carrera':'A','turno':'M','nivel':1,'Grupo':'DEMO','Asignatura':'DEMO','Edificio':'1'}
        rows = [dict(common, Profesor='DOCENTE FICTICIO 1', Salon='LAB', Mar='10:00-11:30'),
                dict(common, Profesor='DOCENTE FICTICIO 2', Salon='AULA', Lun='07:00-08:30'),
                dict(common, Profesor='DOCENTE FICTICIO 3', Salon='OTRA', Mar='10:00-11:30')]
        out = build.build(rows, [], [], {}, salon=True)
        self.assertEqual(len(out), 1)
        self.assertEqual(out[0][6], [[0,420,510],[1,600,690]])
        self.assertEqual(out[0][10], ['Edif. 1 · AULA','Edif. 1 · LAB / Edif. 1 · OTRA'])
        self.assertEqual(len(out[0][5]), 3)

    def test_categoria_genetica_no_se_confunde_con_etica(self):
        self.assertEqual(extract.categoria_upibi("Laboratorio de Ingeniería Genética", "Profesional"), "propia")
        self.assertEqual(extract.categoria_upibi("Ética (Taller)", "Institucional"), "integral")

    def test_empate_no_adivina_y_detecta_ambiguedad(self):
        b = {'nombre':'Biología de Eucariontes'}
        row = ['A','06','1','A102','BIOLOGIA DE EUCARIOTES','OBLIGATORIA','12','5','3']
        self.assertEqual(extract.empatar_materia(b,[row],'A','06')[3], 'A102')
        with self.assertRaises(ValueError): extract.empatar_materia(b,[],'A','06')
        with self.assertRaises(ValueError): extract.empatar_materia(b,[row,row],'A','06')

    def test_integracion_sin_claves_huerfanas_o_planes_mezclados(self):
        html = (ROOT/'web/dist/horarios-upibi.html').read_text(encoding='utf8')
        data = json.loads(re.search(r'const DATA=(.*?);\n',html).group(1))
        self.assertEqual(set(data['mapas']), {'A','B','B_06','F','L','M'})
        self.assertEqual(data['mapas']['B']['modelo'], 'semestral')
        self.assertEqual(data['mapas']['B_06']['modelo'], 'niveles')
        self.assertEqual(data['mapas']['B']['cur']['B706'][1], 1.5)
        self.assertEqual(data['mapas']['B']['cur']['B612'][1], 18)
        self.assertIn('370.5',data['mapas']['B']['layout']['nota'])
        for car, mp in data['mapas'].items():
            keys = mp['cur']; boxes = mp['layout']['boxes']
            self.assertTrue(boxes, car)
            self.assertEqual(len([b[4] for b in boxes if b[4]]),len(set(b[4] for b in boxes if b[4])))
            for b in boxes:
                if b[4]: self.assertIn(b[4],keys, (car,b))
            for dst, req in mp['req'].items():
                self.assertIn(dst, keys)
                for src in req: self.assertIn(src,keys)
        for per, rows in data['periodos'].items():
            for r in rows:
                self.assertIn(r[8],data['mapas'][r[0]]['cur'])
                self.assertNotIn('~',r[8], (per,r[0],r[3],data['asig'][r[4]]))
                if len(r)>10: self.assertEqual(len(r[6]),len(r[10]))

    def test_selector_unidad_se_reabre_sin_duplicar_cambios(self):
        import cuenta
        fn = re.search(r'  function bienvenida\(o\)\{.*?\n  \}\n  if\(document.readyState',cuenta.JS,re.S).group(0).rsplit('\n  if(',1)[0]
        script = """
const assert=require('assert'), NUEVO=false, BKEY='demo', CFG={unidad:'upibi',unidades:[{id:'upibi'},{id:'escom',url:'horarios-escom.html'}]};
let changes=0, shows=0, cuenta=null;
const nodes={};const $i=id=>nodes[id]||(nodes[id]={textContent:'',hidden:false});
const dl=$i('ipnt-hola');dl.showModal=()=>{shows++;dl.open=true};dl.close=()=>dl.open=false;
const sel={options:[{value:'B',textContent:'Carrera ficticia'}],dispatchEvent:()=>changes++};
const document={querySelector:()=>sel},ls={set:()=>{}},esc=s=>s,pintar=()=>{};
const MS={disponible:()=>false},GO=MS;
""" + fn + """
(async()=>{
 bienvenida({select:'#demo'});assert.strictEqual(shows,0);
 bienvenida({select:'#demo',force:true});dl.close();
 bienvenida({select:'#demo',force:true});assert.strictEqual(shows,2);
 const button={dataset:{car:'B'},hasAttribute:()=>false};
 await dl.onclick({target:{closest:()=>button}});
 assert.strictEqual(changes,1);assert.strictEqual(dl.open,false);
 assert.strictEqual($i('ipnt-hola-h').textContent,'Cambiar unidad académica');
})().catch(e=>{console.error(e);process.exitCode=1});
"""
        result = subprocess.run(['node','-e',script],text=True,capture_output=True)
        self.assertEqual(result.returncode,0,result.stderr)

    def test_proyeccion_por_periodo_y_referencia_de_carga(self):
        html=(ROOT/'web/horarios.template.html').read_text(encoding='utf8')
        fn=html[html.index('function plazoReferencia('):html.index('function statsDatos(')]
        script="const assert=require('assert');let UNIDAD='upibi';Array.prototype.at=function(i){return this[i<0?this.length+i:i]};"+fn+"""
const A={carga:{total:438,min:36.5,duracion:15,duracion_max:23}};
assert.deepStrictEqual(plazoReferencia(A),{dur:null,max:12,calculado:true});
UNIDAD='upiita';assert.deepStrictEqual(plazoReferencia(A),{dur:15,max:23,calculado:false});
const points=proyeccionCreditos({curva:[{per:53,acum:240}],fin:57,total:438,obt:240,ritmo:49.5});
assert.deepStrictEqual(points.map(d=>d.acum),[240,289.5,339,388.5,438]);
assert.deepStrictEqual(points.map(d=>d.per),[53,54,55,56,57]);
// Kárdex hasta 26/2: 27/1 también se proyecta, aunque la planeación empiece en 27/2.
const gap=proyeccionCreditos({curva:[{per:53,acum:240}],meta:55,fin:58,total:438,obt:240,ritmo:49.5});
assert.deepStrictEqual(gap.map(d=>d.per),[53,54,55,56,57]);
assert.deepStrictEqual(gap.map(d=>d.acum),[240,289.5,339,388.5,438]);
assert.strictEqual(gap.filter(d=>d.acum===438).length,1);
assert.strictEqual(gap.at(-1).per,57);

assert.deepStrictEqual(proyeccionCreditos({curva:[],fin:57,total:438,ritmo:49.5}),[]);
assert.deepStrictEqual(proyeccionCreditos({curva:[{per:53,acum:240}],fin:55,total:300,obt:240,ritmo:40}).map(d=>d.acum),[240,280,300]);
"""
        result=subprocess.run(['node','-e',script],text=True,capture_output=True)
        self.assertEqual(result.returncode,0,result.stderr)

    def test_leyenda_roja_solo_si_la_tendencia_excede_el_limite(self):
        html=(ROOT/'web/horarios.template.html').read_text(encoding='utf8')
        expression=re.search(r"\$\{(totalPer!=null.*?Los puntos rojos.*?)\}",html).group(1)
        script="const assert=require('assert');const legend=(totalPer,plazo)=>"+expression+";"+"""
assert.strictEqual(legend(10,{max:12}),'');
assert.strictEqual(legend(12,{max:12}),'');
assert.ok(legend(13,{max:12}).includes('Los puntos rojos'));
assert.strictEqual(legend(null,{max:12}),'');
assert.strictEqual(legend(13,{}),'');
"""
        result=subprocess.run(['node','-e',script],text=True,capture_output=True)
        self.assertEqual(result.returncode,0,result.stderr)

    def test_coordenadas_svg_con_zoom_scroll_y_resize(self):
        html=(ROOT/'web/horarios.template.html').read_text(encoding='utf8')
        fn=html[html.index('function montarGrafica('):html.index('async function renderStats(')]
        script="""
const assert=require('assert');
class DOMMatrix {constructor(a){[this.a,this.b,this.c,this.d,this.e,this.f]=a}}
let rect={left:200,top:600,width:1350,height:351};
const svg={matches:()=>true,viewBox:{baseVal:{x:0,y:0,width:1000,height:260}},getBoundingClientRect:()=>rect,
getScreenCTM:()=>new DOMMatrix([1,0,0,1,200,600])};
const host={id:'demo',replaceChildren:()=>{}};
"""+fn+"""
montarGrafica(host,svg);
function check(x,y){const m=svg.getScreenCTM(),k=rect.width/1000;
 const clientX=rect.left+x*k,clientY=rect.top+y*k;
 assert.ok(Math.abs((clientX-m.e)/m.a-x)<1e-6);
 assert.ok(Math.abs((clientY-m.f)/m.d-y)<1e-6);
}
for(const width of [350,1000,1350])for(const top of [600,20,-120]){
 rect={left:200,top,width,height:width*.26};check(0,0);check(300,180);check(990,250);
}
"""
        result=subprocess.run(['node','-e',script],text=True,capture_output=True)
        self.assertEqual(result.returncode,0,result.stderr)

    def test_scripts_compilados(self):
        for unit in ('horarios','horarios-escom','horarios-upibi'):
            html = (ROOT/f'web/dist/{unit}.html').read_text(encoding='utf8')
            blocks = re.findall(r'<script\b[^>]*>(.*?)</script>',html,re.S)
            result = subprocess.run(['node','-e','const fs=require("fs");JSON.parse(fs.readFileSync(0,"utf8")).forEach(s=>new Function(s));'],
                                    input=json.dumps(blocks),text=True,capture_output=True)
            self.assertEqual(result.returncode,0,result.stderr)

    def test_perfil_plan_conocido_desconocido_y_legacy(self):
        html = (ROOT/'web/horarios.template.html').read_text(encoding='utf8')
        fn = re.search(r'const carreraPerfil=.*?:null;',html,re.S).group(0)
        script = "const DATA={opciones_plan:{B:{carrera:'B',plan:'24'},B_06:{carrera:'B',plan:'06'}}};" + fn + """
const assert=require('assert');
assert.strictEqual(carreraPerfil({carrera:'B',plan:'06'}),'B_06');
assert.strictEqual(carreraPerfil({carrera:'B',plan:'24'}),'B');
assert.strictEqual(carreraPerfil({carrera:'B',plan:'99'}),null);
assert.strictEqual(carreraPerfil({carrera:'B'}),null);
assert.strictEqual(carreraPerfil({carrera:'M',plan:'06'}),'M');
assert.strictEqual(carreraPerfil(null),null);
DATA.opciones_plan={};assert.strictEqual(carreraPerfil({carrera:'B',plan:'09'}),'B');
"""
        result = subprocess.run(['node','-e',script],text=True,capture_output=True)
        self.assertEqual(result.returncode,0,result.stderr)


if __name__ == '__main__': unittest.main(verbosity=2)
