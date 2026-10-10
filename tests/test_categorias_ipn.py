"""Contratos del catálogo y clasificación reproducible de los 82 planes OCR."""
import json
import re
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import categorias_ipn as cat

ORDEN_ORIGINAL = ["fm", "comp", "datos", "elec", "ctrl", "redes", "bio", "quim", "proc", "propia", "integral", "prof", "esp"]
NUEVAS = ["mec", "civil", "amb", "ind", "salud", "clin", "adm", "soc", "info"]
# Instantánea de las definiciones vigentes antes de ampliar el catálogo.
ORIGINAL = {
    "fm": ("Ciencias básicas", "Matemáticas, física, probabilidad y estadística, métodos numéricos y cuantitativos."),
    "comp": ("Computación", "Programación, algoritmos, teoría de la computación, sistemas operativos, ingeniería y desarrollo de software."),
    "datos": ("Ciencia de datos e IA", "Bases de datos, inteligencia artificial, aprendizaje de máquina, minería y analítica de datos, visión, lenguaje natural."),
    "elec": ("Electrónica", "Circuitos, electrónica analógica y digital, arquitectura de computadoras, procesamiento de señales."),
    "ctrl": ("Control y automatización", "Control, instrumentación, modelado de sistemas dinámicos."),
    "redes": ("Telecomunicaciones", "Redes de computadoras, comunicaciones, sistemas distribuidos y servicios en red."),
    "integral": ("Humanidades y gestión", "Comunicación, ética, economía, finanzas, gestión, liderazgo y habilidades sociales."),
    "prof": ("Práctica profesional", "Trabajo terminal, estancia profesional, metodología de la investigación."),
    "esp": ("Especialidad", "Optativas y líneas de especialización."),
    "bio": ("Ciencias biológicas", "Biología, microbiología, bioquímica, genética, inmunología y ecología."),
    "quim": ("Química", "Química general, orgánica y analítica, fisicoquímica y sus laboratorios."),
    "proc": ("Ingeniería de procesos", "Balances, fenómenos de transporte, termodinámica, reactores, separaciones y diseño de plantas."),
}


class CategoriasIPN(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.entrada = json.loads((ROOT / "data/planes_ipn_materias.json").read_text(encoding="utf-8"))
        cls.catalogo = json.loads((ROOT / "data/categorias.json").read_text(encoding="utf-8"))
        cls.salida = json.loads((ROOT / "data/categorias_ipn.json").read_text(encoding="utf-8"))

    def test_catalogo_conserva_definiciones_anteriores(self):
        self.assertEqual(self.catalogo["orden"], ORDEN_ORIGINAL + NUEVAS)
        for clave, (nombre, incluye) in ORIGINAL.items():
            with self.subTest(categoria=clave):
                esperado = {"nombre": nombre, "incluye": incluye}
                if clave == "datos":
                    esperado["nueva"] = "Agregada para la ESCOM (LCD, IIA, ISC); no tiene equivalente en las trayectorias de la UPIITA."
                self.assertEqual(self.catalogo["categorias"][clave], esperado)
        for clave in NUEVAS:
            self.assertIs(self.catalogo["categorias"][clave]["propuesta"], True)

    def test_casos_fijos(self):
        casos = {"CÁLCULO DIFERENCIAL E INTEGRAL": "fm", "ANATOMÍA HUMANA": "salud",
                 "CONTABILIDAD FINANCIERA": "adm", "PROGRAMACIÓN ORIENTADA A OBJETOS": "comp",
                 "TOPOGRAFÍA": "civil", "INGLÉS I": "integral"}
        for nombre, categoria in casos.items():
            with self.subTest(nombre=nombre):
                self.assertEqual(cat.clasificar(nombre)[0], categoria)

    def test_contexto_no_desplaza_disciplina(self):
        negocio = "mapa-curricular-contadorpublico-esca-ust-utepepan"
        ingenieria = "mapa-curricular-ib-upiita"
        for nombre in ["Economía", "Derecho", "Administración de proyectos", "Contabilidad financiera"]:
            self.assertEqual(cat.clasificar(nombre, negocio)[0], "adm", nombre)
            self.assertEqual(cat.clasificar(nombre, ingenieria)[0], "integral", nombre)
        self.assertEqual(cat.clasificar("Química", "mapa-curricular-medicocirujanoypartero-esm")[0], "quim")
        self.assertEqual(cat.clasificar("Optativa I: programación orientada a objetos", negocio)[0], "comp")
        self.assertEqual(cat.clasificar("Optativa II: clínica de endodoncia", negocio)[0], "clin")
        self.assertEqual(cat.clasificar("Optativa A")[0], "esp")
        self.assertEqual(cat.clasificar("Materia sin tema identificable")[0], "sin_categoria")
        self.assertEqual(cat.clasificar("INGLÉS PARA NEGOCIOS", negocio)[0], "integral")
        self.assertEqual(cat.clasificar("Seminario de titulación en administración", negocio)[0], "prof")

    def test_prioridad_y_contexto_clinico(self):
        for nombre, esperado in [("Servicio social", "prof"), ("Seminario de titulación", "prof"),
                                 ("Estancia industrial", "prof"), ("Investigación de operaciones", "ind"),
                                 ("Clínica de farmacología", "clin"), ("Bioquímica", "bio"),
                                 ("Genética", "bio"), ("Bases de datos", "datos"),
                                 ("Fundamentos de enfermería", "salud"), ("Enfermería clínica", "clin"),
                                 ("INGLÉS PARA NEGOCIOS", "integral")]:
            with self.subTest(nombre=nombre):
                self.assertEqual(cat.clasificar(nombre)[0], esperado)

    def test_todas_las_categorias_existen_y_nombres_normalizados(self):
        self.assertEqual({p for p in self.salida if not p.startswith("_")}, set(self.entrada["planes"]))
        self.assertEqual(len(self.entrada["planes"]), 82)
        self.assertEqual(sum(len(p["materias"]) for p in self.entrada["planes"].values()), 7157)
        for pid, plan in self.entrada["planes"].items():
            self.assertEqual(set(self.salida[pid]), {cat.normalizar(n) for _, n in plan["materias"]}, pid)
            for nombre, categoria in self.salida[pid].items():
                self.assertEqual(nombre, cat.normalizar(nombre))
                if categoria != "sin_categoria":
                    self.assertIn(categoria, self.catalogo["categorias"], (pid, nombre))

    def test_integracion_salidas_reproducibles_y_reporte(self):
        with patch.object(cat, "LOG"):
            generado, total, revisiones, conteos = cat.generar(self.entrada, self.catalogo)
        self.assertEqual(generado, self.salida)
        esperado = cat.reporte(self.entrada, self.catalogo, generado, total, revisiones, conteos)
        self.assertEqual((ROOT / "docs/CATEGORIAS-IPN.md").read_text(encoding="utf-8"), esperado)
        for pid in self.entrada["planes"]:
            self.assertIn(pid, esperado)
        for s in generado["_sin_categoria"]:
            self.assertEqual(generado[s["plan_id"]][s["nombre_normalizado"]], "sin_categoria")

    def test_ningun_plan_supera_cinco_por_ciento_sin_categoria(self):
        # Excepción: filas que el OCR fundió con cifras; requieren relectura local del mapa, no una regla.
        ocr = lambda n: cat.motivo_pendiente(n).startswith("Posible") or bool(re.search(r"\d\.\d|\*\*|---", n))
        incumplimientos = []
        for pid, plan in self.entrada["planes"].items():
            sin = sum(self.salida[pid][cat.normalizar(n)] == "sin_categoria" and not ocr(n) for _, n in plan["materias"])
            if sin / len(plan["materias"]) > 0.05:
                incumplimientos.append(f"{pid}: {sin}/{len(plan['materias'])} ({100 * sin / len(plan['materias']):.2f} %)")
        self.assertEqual(incumplimientos, [], "Planes que requieren tema o revisión OCR:\n" + "\n".join(incumplimientos))

    def test_meta_global_menos_dos_por_ciento(self):
        total = sum(len(p["materias"]) for p in self.entrada["planes"].values())
        self.assertLess(len(self.salida["_sin_categoria"]) / total, 0.02,
                        "No rellenar espacios sin tema para satisfacer el umbral; revisar la lista pendiente")


if __name__ == "__main__":
    unittest.main()
