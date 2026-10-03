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
