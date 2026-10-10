"""Clasificación propuesta de planes OCR; no modifica las áreas de la interfaz.

Uso: python tools/categorias_ipn.py [--pendientes]
Las excepciones exactas preceden a la función curricular, el contexto y las
reglas temáticas ordenadas.
"""
import argparse
from collections import Counter, defaultdict
import json
import logging
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
VERSION = "1.0.0"
LOG = logging.getLogger(__name__)


def normalizar(nombre):
    """Conserva la puntuación OCR, pero unifica acentos, caja y espacios."""
    texto = unicodedata.normalize("NFKD", nombre)
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", texto.upper()).strip()


# Son nombres completos, no sustituciones del texto original del OCR.
EXCEPCIONES = {
    "ALGBERA LINEAL": ("fm", "Lectura OCR de álgebra; verificar original"),
    "HIQIENE, SEGUNDA Y RIESGOS INDUSTRIALES": ("ind", "Lectura OCR de higiene y seguridad industrial; verificar original"),
    "FORMULACION Y EVALUACION DE PROVECTOS": ("integral", "Lectura OCR de proyectos en ingeniería"),
    "OPTATIVA I GENERALIZACION CENTRALIZADA": ("amb", "Posible OCR de generación centralizada; confirmar tema"),
    "PROJECT MANAGEMENT *": ("integral", "Gestión de proyectos en ingeniería biotecnológica"),
    "HIGH TECHNOLOGY ENTERPRISE MANAGEMENT": ("integral", "Gestión empresarial en ingeniería"),
    "IT GOVERNANCE": ("integral", "Gobierno de TI en ingeniería"),
    "FEASIBILITY STUDY FOR INTERNATIONAL *": ("adm", "Estudio de factibilidad en comercio; título truncado"),
    "DESING THINKING AND INNOVATION": ("adm", "Innovación en mercadotecnia; grafía de entrada"),
    "BIOGNOSIS": ("bio", "Fundamentos de sistemas biológicos; revisar término en el mapa"),
    "GEOBILOGIA": ("bio", "Lectura OCR de geobiología; verificar original"),
    "FITOPANOLOGIA": ("bio", "Lectura OCR de fitopatología; verificar original"),
    "PARMACOLOGIA": ("salud", "Lectura OCR de farmacología; verificar original"),
    "EMBRILOGIA BASICA": ("salud", "Lectura OCR de embriología; verificar original"),
    "PSICOLOQIA DEL DESARROLLO": ("soc", "Lectura OCR de psicología; verificar original"),
    "GINECOLOQIA": ("salud", "Lectura OCR de ginecología; verificar original"),
    "TECNOLOQIAS DE LA INFORMACION Y COMUNICACION": ("comp", "Lectura OCR de tecnologías; verificar original"),
    "INGENIERIA ECONONMICA": ("integral", "Lectura OCR de economía en ingeniería"),
    "ESTATISTICA ***": ("fm", "Lectura OCR de estadística; verificar original"),
    "QUALITY MANAGEMENT SYSTEM *": ("ind", "Sistemas de gestión de calidad"),
    "INTERNATIONAL LOGISTICS MANAGEMENT *": ("ind", "Logística internacional"),
    "SUPLY CHAIN MANAGEMENT": ("ind", "Cadena de suministro; grafía OCR"),
    "CLEAN AND RENEWABLE ENERGIES": ("amb", "Energías limpias y renovables"),
    "ANALYSIS AND EVALUATION OF THE ENVIRONMENTAL IMPACT": ("amb", "Evaluación del impacto ambiental"),
    "ELECTROMECANIA DE PROCESOS": ("mec", "Lectura OCR de electromecánica; verificar original"),
    "MECANICA Y ELECTROMAGNETISMO": ("fm", "Física básica, como en las reglas de ESCOM"),
    "MECANICA CLASICA": ("fm", "Física básica"),
    "MECANICA CUANTICA": ("fm", "Física básica"),
    "MECANICA CUANTICA I": ("fm", "Física básica"),
    "MECANICA CUANTICA II": ("fm", "Física básica"),
    "BIOQUIMICA": ("bio", "Área biológica del catálogo vigente"),
    "PSICOETICA": ("integral", "Ética aplicada a psicología; distinguir de genética"),
    "ELECTRICIDAD Y MAGNETISMO": ("fm", "Fundamentos físicos; distinguir de ingeniería eléctrica"),
    "FISICA ELECTRICIDAD Y MAGNETISMO": ("fm", "Fundamentos físicos"),
}

NEGOCIOS = {
    "licenciatura-en-comercio-internacional--28plan-2024-29-vigencia-2025-1",
    "mapa-curricular-contadorpublico-esca-ust-utepepan",
    "mapa-curricular-ladministracionydesarrolloempresarial-esca-ust",
    "mapa-curricular-lai-upiicsa", "mapa-curricular-lcfp-esca-ut",
    "mapa-curricular-le-ese", "mapa-curricular-lmd-esca-ust",
    "mapa-curricular-lnd-esca-ust",
    "mapa-curricular-lnegociosinternacionales-esca-ust-utepepan",
    "mapa-curricular-lrelacionescomerciales-esca-ust-utepepan",
    "mapa-curricular-lturismosustentable-upiip",
    "mapa-curricular-ingenieria-en-negocios-energeticos-sustentables--281-29",
}

# Se ordenan antes de las reglas generales para evitar que «clínica de ...»
# termine en biología, o «investigación de operaciones» en práctica profesional.
REGLAS = [
    ("prof", r"TRABAJO TERMINAL|SERVICIO SOCIAL|ESTANCIA|SEMINARIO.*TITULACION|TITULACION|PROYECTO TERMINAL|PRACTICA(S)? PROFESIONAL|METODOLOGIA.*INVESTIGACION|PROYECTOS? DE INVESTIGACION|SEMINARIO DE INVESTIGACION|PROTOCOLO DE INVESTIGACION|METODOS.*INVESTIGACION|INVESTIGACION APLICADA|TALLER TERMINAL|PROYECTO INTEGRADOR|MODULO DUAL|PRACTICAS Y VISITAS INDUSTRIALES|METODOLOGIA DE LA CIENCIA"),
    ("integral", r"INGLES|FRANCES|ALEMAN|ITALIANO|LENGUA(S)? (EXTRANJERA|INDIGENA)|IDIOMA|HUMANIDADES|ETICA|BIOETICA|COMUNICACION (ORAL|ESCRITA|ASERTIVA|PROFESIONAL|CIENTIFICA|TECNICA|HUMANA|PARA)|HABILIDADES.*COMUNIC|COMUNICACION Y SISTEMAS DE INFORMACION|PROCESOS DE COMUNICACION|REDACCION|TEXTOS (ACADEMICOS|CIENTIFICOS)|LECTURA|DESARROLLO (HUMANO|PERSONAL|PROFESIONAL)|HABILIDADES.*(SOCIALES|PENSAMIENTO)|HABITOS DE ESTUDIO|HERRAMIENTAS PARA EL APRENDIZAJE|APRENDIZAJE (AUTONOMO|AUTOREGULADO)|SOLUCION DE PROBLEMAS|RESOLUCION DE PROBLEMAS|PENSAMIENTO INNOVADOR|RELACIONES (HUMANAS|LABORALES|INDUSTRIALES)|COMPORTAMIENTO HUMANO|HUMANISMO|SOCIEDAD|LIDERAZGO|EXPRESION ORAL|IDENTIDAD POLITECNICA|IGUALDAD LABORAL|NEGOCIACION|PROBLEMAS SOCIALES|ETIMOLOG|MANUSCRITOS|ARTE, CULTURA|MANIFESTACIONES ARTISTICAS|INTEGRACION PLASTICA"),
    ("clin", r"CLINIC|PROPEDEUTIC|INTERNADO|ENFERMERIA|CUIDADO|CIRUGIA|QUIRURG|REHABILITACION|ENDODON|PERIODON|ORTODON|PROSTODON|ODONTOPEDIATR|OPERATORIA DENTAL|EXODON|CONTACTOLOG|REFRACCION|TERAPEUTICA|DIAGNOSTICO|ANESTESIA BUCODENTAL|RADIOLOGIA DENTAL|OCLUSION|PROTESIS|LENTES DE CONTACTO|VISION (BINOCULAR|BAJA)|ANOMALIAS DE LA VISION|ESTRABISMO|FUNCIONES VISUALES|ORTOQUERATOLOG|ECTASIAS CORNEALES|TERAPIA PERCEPTUAL|PRACTICA (HOSPITALARIA|COMUNITARIA)|ATENCION.*(PACIENTE|PREHOSPITAL)|SOPORTE VITAL|REANIMACION|RCP EN|TERAPIA (DE|OCUPACIONAL)|DIALISIS"),
    ("info", r"BIBLIOTEC|BIBLIOGRAF|ARCHIV|DOCUMENTAL|DOCUMENTACION|CATALOGACION|CLASIFICACION.*(DOCUMENT|BIBLIO)|ACERVOS|PALEOGRAF|DIPLOMATICA|CODICOLOG"),
    ("soc", r"PSICOLOG|PSICOANAL|PSICOMETR|PSICOPAT|PSICOTERAP|PSICOSOC|SOCIOLOG|TRABAJO SOCIAL|PEDAGOG|EDUCACION|DIDACTICA|ANTROPOLOG|FILOSOFIA|HISTORIA|POLITICA SOCIAL"),
    ("salud", r"ANATOM|FISIOLOG|FARMAC|PATOLOG|SALUD|NUTRI|EPIDEMI[LO]|TOXICOLOG|HISTOLOG|EMBRIOLOG|MORFOLOG|MEDICINA|MEDIC[AO]|OBSTET|GINECO|PEDIATR|GERIATR|GERONT|NEUROLOG|OFTALMOLOG|ESTOMATOLOG|ODONTOLOG|OPTOMETR|OPTOMET|PARASITOLOG|FISIOTERAP|BROMATOLOG|ALIMENTACION|HOMEOPAT|HEMATOLOG|SEMIOLOG|INFECTOLOG|ONCOLOG|URGENCIAS|CARDIOVASCULAR|OTORRINOLARINGOLOG|NEUMOLOG|DERMATOLOG|TRAUMATOLOG|ORTOPEDIA|PSIQUIATR|NEFRO|UROLOG|ENDOCRINOLOG|GASTROENTEROLOG|ALERGOLOG|ANESTESIOLOG|DIETOTERAP|PERINATOLOG|TAMIZAJE|INMUNIZACION|ABORTO|HEMODINAM|PERINATAL|DEFECTOS AL NACIMIENTO|ALIMENTOS FUNCIONALES|SUPLEMENTOS ALIMENT|FORTIFICACION|ETIQUETADO DE ALIMENTOS|TECNICAS CULINARIAS|GASTRONOM|RECETAS|SERVICIOS DE ALIMENTOS|ENCUESTAS ALIMENTARIAS|SEXUALIDAD HUMANA|BANCO DE SANGRE|TECNOLOGIA HOSPITALARIA"),
    ("datos", r"BASE(S)? DE DATOS|CIENCIA.*DATOS|INTELIGENCIA ARTIFICIAL|APRENDIZAJE (AUTOMATICO|DE MAQUINA|PROFUNDO)|MINERIA DE DATOS|ANALITICA|BIG DATA|VISION (ARTIFICIAL|COMPUTACIONAL)|LENGUAJE NATURAL|REDES NEURONALES|RECONOCIMIENTO.*(PATRONES|VOZ)|ANALISIS DE DATOS|BIOINSPIRADOS|PROCESAMIENTO.*IMAGENES|MODELADO PREDICTIVO|SERIES DE TIEMPO|SISTEMAS (MULTIAGENTES|EXPERTOS|INTELIGENTES|NEURODIFUSOS)|AGENTES INTELIGENTES|GRANDES VOLUMENES DE DATOS|PROTECCION DE DATOS|ABSTRACCION Y USO DE DATOS|DECISIONES BASADAS EN DATOS|INGENIERIA DEL CONOCIMIENTO"),
    ("ind", r"INVESTIGACION DE OPERACIONES|LOGISTICA|CALIDAD|PRODUCCION|PRODUCTIVIDAD|TRANSPORTE|TRANSITO|MOVILIDAD|CADENA.*SUMINISTRO|INVENTARIO|ERGONOM|ESTUDIO DEL TRABAJO|SEGURIDAD INDUSTRIAL|HIGIENE INDUSTRIAL|INGENIERIA (INDUSTRIAL|DE METODOS)|SISTEMAS DE MANUFACTURA"),
    ("civil", r"TOPOGRAF|GEODES|GEOMAT|GEOTEC|GEOLOG|GEOFIS|GEOQUIM|GEOMORF|GEODINAM|GEOGRAF|PETROLE|PETROFIS|PETROLOG|PERFORACION|YACIMIENTO|SISMO|CIMENTACION|CONSTRUCCION|ARQUITECTON|ARQUITECTURA(?! DE COMPUT)|URBAN|OBRA|CONCRETO|HIDRAULIC|HIDROLOG|HIDROGEO|CARTOGRAF|FOTOGRAM|MINERALOG|ESTRATIGRAF|SEDIMENTOLOG|TECTON|PALEONTOLOG|ESTRUCTURAS (DE|METALICAS)|VIAS TERRESTRES|CARRETERAS|PUENTES|TUNELES"),
    ("amb", r"AMBIENT|SUSTENT|SOSTENIB|ENERGIA|ENERGETIC|RECURSOS NATURALES|CONTAMINACION|RESIDUOS|RECICL|RENOVABLE|EOLIC|SOLAR|FOTOVOLTAIC|METEOROLOG|CLIMATOLOG|ATMOSFER|CONSERVACION"),
    ("redes", r"TELECOM|COMUNICACIONES|REDES DE (COMPUT|DATOS)|SISTEMAS DISTRIBUIDOS|SERVICIOS EN RED|ANTENAS|RADIOFRECUENCIA|MICROONDAS|TRANSMISION.*(DATOS|DIGITAL)|PROPAGACION"),
    ("ctrl", r"CONTROL|AUTOMAT|INSTRUMENTACION|ROBOT|SISTEMAS DINAMICOS|SISTEMAS NO LINEALES|IDENTIFICACION DE SISTEMAS"),
    ("elec", r"ELECTRON|ELECTRIC|CIRCUITO|ELECTROMAGNET|MAQUINAS ELECTRICAS|SISTEMAS DIGITALES|DISENO DIGITAL|ARQUITECTURA DE COMPUT|MICROPROCES|MICROCONTROL|PROCESAMIENTO.*SENALES|SISTEMAS EN CHIP|SISTEMAS EMBEBIDOS|SISTEMAS DE POTENCIA"),
    ("comp", r"PROGRAMACION|ALGORITM|COMPUT|INFORMAT|SOFTWARE|COMPILADOR|SISTEMAS OPERATIVOS|APLICACIONES (WEB|MOVILES)|DESARROLLO.*(WEB|APLICACIONES)|ANALISIS Y DISENO DE SISTEMAS|ESTRUCTURA.*DATOS|SEGURIDAD.*INFORMACION|TECNOLOGIAS.*INFORMACION|PARADIGMAS"),
    ("bio", r"BIOQUIM|BIOLOG|MICROBIO|GENETIC|GENOMIC|INMUNOLOG|ECOLOG|BIOTEC|BIOPROCES|BIOMOLEC|ENZIM|BOTANIC|ZOOLOG|BIODIVERS|VIROLOG|BACTERIOLOG|MICOLOG|BIOSINTESIS|BIOINGENIERIA"),
    ("quim", r"QUIMIC|FISICOQUIM|ELECTROQUIM|ANALISIS (INSTRUMENTAL|CUALITATIVO|CUANTITATIVO)|ESPECTROSCOP|QUIMIOMETR"),
    ("proc", r"BALANCE.*(MATERIA|ENERGIA)|FENOMENOS DE TRANSPORTE|TERMODINAM|REACTOR|SEPARACION|OPERACIONES UNITARIAS|INGENIERIA DE PROCESOS|DISENO DE PLANTAS|TRANSFERENCIA.*(MASA|CALOR)|PROCESOS.*(ALIMENT|FERMENT)|INGENIERIA.*ALIMENT"),
    ("mec", r"MECANIC|MECATRON|MANUFACT|MATERIAL|METALURG|METALOG|TEXTIL|TEJIDO|TEJEDUR|HILATURA|FIBRA|POLIMER|PLASTICO|SOLDAD|FUNDICION|CORROSION|DISENO.*(MAQUIN|ELEMENTOS)|MAQUINAS|TERMICO|TERMICAS|TERMICA|TERMOFLUID|FLUIDOS|AERODINAM|AERONAUT|AEROESPAC|AERONAV|AUTOMOT|AUTOMOV|VEHICUL|MOTORES|TURBINA|REFRIGERACION|NEUMATIC|OLEOHIDRAULIC|TRIBOLOG|CAD/CAM|METROLOG|DIBUJO|RESISTENCIA|ESTATICA|DINAMICA"),
    ("fm", r"MATEMAT|CALCULO|ALGEBRA|FISICA|GEOMETR|ECUACIONES|PROBABILIDAD|ESTADISTIC|METODOS NUMERICOS|METODOS CUANTITATIVOS|ESTOCASTIC|ECONOMETR|ANALISIS (VECTORIAL|NUMERICO|REAL|COMPLEJO)|VARIABLE COMPLEJA|FOURIER|TOPOLOG|OPTICA|ACUSTICA|LOGICA|TEORIA DE NUMEROS"),
]
# Extensiones temáticas: vocabulario observado en los 82 planes, sin categoría
# de respaldo para nombres desconocidos. Se insertan antes de reglas amplias.
REGLAS[3:3] = [
    ("prof", r"METODOLOGIA DE LA INGENIERIA|INGENIERIA DE PROYECTOS|HABILIDADES PARA LA INVESTIGACION|INVESTIGACION Y DESARROLLO DE PROYECTOS|VISITA INDUSTRIAL|BASES DE LA EVIDENCIA CIENTIFICA|REVISION SISTEMATICA|METAANALISIS|INTRODUC[C]?ION A LA INGENIERIA|PERSPECTIVAS DEL AREA PROFESIONAL|TECNICAS PROFESIONALES|PROYECTO INTEGRAL DE LA TRAYECTORIA"),
    ("integral", r"FORMULACION.*(PROYECTOS|PROGRAMAS)|EVALUACION DE PROYECTOS|GENERACION Y EVALUACION DE PROYECTOS|GERENCIA|CAPACITACION|ADIESTRAMIENTO|CULTURA DE LA LEGALIDAD|CONTEXT[O]? SOCIAL|ESTRUCTURA Y DESARROLLO DE (MEXICO|MENICO)|CIUDADANIA DIGITAL|COMMUNICATION IMPACT|CIVILIZACIONES"),
    ("datos", r"DATABASES|DATA ANALYTICS|DATA MINING|MACHINE LEARNING|NATURAL LANGUAGE PROCESSING|IMAGE ANALYSIS"),
    ("ctrl", r"VIRTUAL INSTRUMENTATION"),
    ("elec", r"EMBEDDED SYSTEMS"),
    ("comp", r"CRYPTOGRAPHY|INTERNET OF THINGS|VIRTUAL AND AUGMENTED REALITY|SEGURIDAD EN ENTORNOS MOVILES|VIRTUALIZACION|E-COMMERCE|CRIPTOLOG|PROGRAMATICA DE PLATAFORMA"),
    ("ind", r"TRANSPORTACION|TRAFICO|DEMANDA|ESTACIONES DE TRABAJO|SEGURIDAD EN EL TRABAJO|OPERACION DE TERMINALES"),
    ("amb", r"INGENIERIA NUCLEAR|FUENTES DE GENERACION|GENERACION DISTRIBUIDA|CAMBIO CLIMATICO|REMEDIACION|CARACTERIZACION DE(L)? AGUA|CARACTERIZACION DEL AGUA|MANEJO DE RP|ENERGOTECNIA"),
    ("mec", r"MECANIZADO|FABRICACION|AUTOPARTES|TREN MOTRIZ|ELEMENTO FINITO|FUSION DE ACEROS|FRACTURA|FLOTACION|PROCESAMIENTO DE MINERALES INDUSTRIALES|ANALISIS MATRICIAL DE ESTRUCTURAS"),
    ("clin", r"LABORATORIO DENTAL|PROVISIONALES FIJOS Y REMOVIBLES|MANEJO PREHOSPITALARIO DEL TRAUMA"),
    ("salud", r"IMAGENOLOG|ESTIMULACION TEMPRANA|REPERCUSION OCULAR|HIGIENE Y SEGURIDAD VISUAL"),
    ("soc", r"HABILIDADES DE DOCENTES|RELACIONES INTERNACIONALES"),
    ("redes", r"APLICACIONES PARA COMUNICACION EN RED"),
    ("comp", r"SISTEMAS EN TIEMPO REAL"),
    ("ind", r"NORMAS DE ESTANDARIZACION|ADMINISTRACION DE OPERACIONES"),
    ("fm", r"OPTIC[AO]|MODELADO DE PRECIOS|MODELACION NUMERICA"),
    ("soc", r"CIENCIAS SOCIALES|EPISTEMOLOG|POLITICAS PUBLICAS|INVESTIGACION SOCIAL|INSTITUCIONAL|COMUNITARI|SISTEMATIZACION|GENERO|VIOLENCIA|ALFABETIZACION|EDUCADOR|VOCACIONAL|DOCENCIA|ENSENANZA|EDUCATIV|ORIENTACION FAMILIAR|GESTORIA|TANATOLOG|PSICOPROFILAXIS|INTELIGENCIA EMOCIONAL|ADICCION|DISCURSO|TEORIAS DEL APRENDIZAJE|ENTREVISTA|INTERVENCION EN CRISIS|PSICOLOQ|CAPITAL HUMANO|ANALISIS Y VALUACION DE PUESTOS"),
    ("info", r"BIBLIOMETR|METRIAS DE LA INFORMACION|UNIDADES DE INFORMACION|ENTIDADES DE INFORMACION|POLITICAS DE INFORMACION|RECURSOS, DESCRIPCION Y ACCESO|ALFABETIZACION INFORMACIONAL|PRESERVACION DE LA INFORMACION|RECURSOS CONTINUOS|COLECCIONES"),
    ("amb", r"POTABILIZ|TRATAMIENTO.*(AGUA|EFLUENTES)|DESECHOS|MANEJO INTEGRAL DEL AGUA|COMBUSTIBLES|HIDROGENO|GEOTERM|OCEANOGRAF|TELEDETECCION|PREDICCION.*TIEMPO|ALERTA TEMPRANA|PROTECCION CIVIL|BIOCLIMATIC|BIOCIMATIC|ISO 14001"),
    ("civil", r"ESTRUCTURAL|ESTRUCTURAS (ISOSTATICAS|RETICULARES|PREFABRICADAS|ESPECIALES)|CONSTRUCTIV|MOVIMIENTOS? DE TIERRA|TUBERIAS|CANALES|CAMINOS|AGUA POTABLE|PAVIMENT|TERRAC|ALCANTARILLADO|RIEGO|DRENAJE|AEROPUERTO|EDIFIC|INFRAESTRUCTURA|CONDUCCIONES|MAMPOSTERIA|SISMIC|PUERTOS|COSTAS|HIDROSANIT|EXPLORACION MINERA|CUENCAS|EDAFOLOG|ACUIFER|PERCEPCION REMOTA|MINERALES Y ROCAS|PLANIMETRIA|ALTIMETRIA|VULCANOLOG|CIENCIAS DE LA TIERRA"),
    ("ind", r"OPERACIONES FERROVIARIAS|INGENIERIA DE OPERACIONES|ALMACEN|CENTROS DE DISTRIBUCION|NORMALIZACION|ESTANDARES|CONFIABILIDAD|ACREDITACION|CERTIFICACION|SMED|HIGIENE.*(INDUSTRIAL|PROCESOS)|SEGURIDAD.*PROCESOS"),
    ("ctrl", r"SENSORES|ACTUADORES|ESPACIO DE ESTADOS|MODELADO DE SISTEMAS|MEDICION|SISTEMAS SENSORIALES|DOMOTICA|CONTRO AVANZADO|SERVOMECANISMOS|ADQUISICION DE DATOS"),
    ("elec", r"TRANSFORMADOR|ALTAS TENSIONES|AISLAMIENTO|PUESTA A TIERRA|ILUMINACION|DISPOSITIVOS (PROGRAMABLES|LOGICOS|ANALOGICOS)|SENALES|SENAL|BIOMAGNETISMO|BIOSENSORES|BIOCHIPS|AVIONICA|AVIONICO"),
    ("redes", r"RADIOCOMUNICACION|MODULACION|REDES (BASICAS|DE ALTO|DE AREA|CONVERGENTES|LAN|CONECTIVIDAD|Y CONECTIVIDAD)|COMUNICACION DE DATOS|TRANSMISORES|RECEPTORES|MULTIPLEXAJE|TELEVISION|TEORIA DE LA CODIFICACION|INTERFACES.*COMUNICACION|PROTOCOLOS.*COMUNICACION|INGENIERIA (DEL SONIDO|DE AUDIO)|GRABACION"),
    ("comp", r"HERRAMIENTAS DIGITALES|CIBERSEGURIDAD|SEGURIDAD DIGITAL|SEGURIDAD EN REDES|CRIPTOGRAF|LENGUAJES DE (BAJO NIVEL|INTERNET)|SISTEMAS DE INFORMACION|WEB|MULTIMEDIA|INTERFACES|INTERFASES|INTERACCION HUMANO|ANALISIS Y DISENO DE PROGRAMAS|LENGUAJE DE DESCRIPCION DE HARDWARE|REALIDAD VIRTUAL|GRAFICACION|EDICION DIGITAL|MODELADO (GRAFICO|TRIDIMENSIONAL)|RECORRIDOS VIRTUALES|MEJORES PRACTICAS DE TI|INGENIERIA DE (REQUERIMIENTOS|PRUEBAS)|INTERNET DE LAS COSAS|MANEJO DE LAS TIC"),
    ("bio", r"BIOCONVERSION|INGENIERIA (CELULAR|METABOLICA)|CULTIVO DE (CELULAS|HONGOS)|PROCESOS CELULARES|ANALISIS MOLECULAR|ALGAS|BRIOFITAS|HONGOS|LIQUENES|[I]?VERTEBRADOS|PLANTAS VASCULARES|ARTROPODOS|CORDADOS|POBLACIONES Y COMUNIDADES|EVOLUCION|MICROSCOPIA|MALACOLOG|PALINOLOG|ACUACULTURA|ICTIOLOG|MASTOZOLOG|ARBOLES|ARBUSTOS|ENTOMOLOG|ETOLOG|NEMATOLOG|HERPETOLOG|ORNITOLOG|PISCICULTURA|LIMNOLOG|FAUNA"),
    ("quim", r"METODOS (ANALITICOS|INTRUMENTALES)|ESTRUCTURA DE LA MATERIA|INGENIERIA MOLECULAR"),
    ("proc", r"OPERACION DE PLANTAS|ABSORCION|DESTILACION|EQUIPOS? DE PROCESO|DISENO.*PROCESOS|ESCALAMIENTO|REFINACION|FERMENTACION|BIORREACCION|BIORREFINERIA|BIOTEPARACION|TRANSFERENCIA DE MOMENTO|ALIMENTOS|ALIMENTARIO|CONFITERIA|BEBIDAS|PRODUCTOS PESQUEROS|PROCESOS INDUSTRIALES|PLANTAS Y PROCESOS INDUSTRIALES"),
    ("mec", r"HILADOS|ACABADOS|CONFECCION|HILOS|NANOTE[CH]*NOLOG|ROPA|UNIFORMES|LENCERIA|CORSETERIA|MEZCLILLA|BLANCOS|TENERIA|TINTURA|PROCESOS EN HUMEDO|FRIGORIFIC|ENVASES Y EMBALAJES|ESFUERZOS|MECANISMOS|PREPARACION DE MINERALES|CONCENTRACION DE MINERALES|METALES|ALEACIONES|EXTRACTIVOS|MICROESTRUCTURAL|INTERFASES Y SUPERFICIES|ACERACION|CERAMIC|CONFORMADO|TRANSFORMACIONES DE FASE|CRISTALOGRAF|DIFRACCION|PROPULS|FLEXION|AEROELASTIC|NAVEGACION AEREA|HERRAMENTAL|GENERADORES DE VAPOR|MANTENIMIENTO"),
    ("fm", r"CA[L]?IC?ULO|CACULO|TRANSFORMADAS|OSCILACIONES Y ONDAS|FOTONIC|LASER|LUZ-MATERIA|TECNICAS EXPERIMENTALES|DISENO DE EXPERIMENTOS|OPTIMIZACION|SOLUCIONES NUMERICAS|TEORIA (DE GRAFICAS|DE CONJUNTOS|DEL RIESGO|DE JUEGOS|DE LA INFORMACION|DEL POTENCIAL)|MATRICES|CAMPOS POTENCIALES|COSMOGRAFIA|ASTRONOMIA|^ANALISIS$"),
]
# Evita que GENETICA, SINTETICAS o CIBERNETICA coincidan con ETICA.
REGLAS = [(cat, patron.replace("|ETICA|", r"|\bETICA\b|")) for cat, patron in REGLAS]
PATRONES = [(cat, re.compile(patron)) for cat, patron in REGLAS]
GESTION = re.compile(r"ADMINISTRA|CONTAB|FINAN|ECONOM|MERCADO|MERCADOT|MARKETING|COMERC|NEGOCIO|EMPRESA|EMPRESAR|EMPREND|COSTOS|PRESUPUEST|FISCAL|TRIBUT|AUDITOR|DERECHO|LEGISLACION|GESTION|ORGANIZACION|INVERSION|VENTA|TURIS|PLANEACION|PLANIFICACION|DIRECCION|DIRECTIV|GERENCIAL|GERENCIA|TOMA DE DECISIONES|PROPIEDAD INTELECTUAL|NORMATIVIDAD|RECURSOS HUMANOS|NEGOCIACION|GOBIERNO CORPORATIVO")

# Contexto restringido a vocabulario ambiguo conocido; todo uso se reporta.
CONTEXTO = [
    (r"-la-enba|-lb-enba", "info", r"SOPORTES DE LA INFORMACION|SISTEMAS? DE CLASIFICACION|USUARIOS|ACCESO A LA INFORMACION|MIGRACION Y PRESERVACION DIGITAL|FUENTES DE INFORMACION|LENGUAJES DE ACCESO|CONSULTA Y RECUPERACION|INDUSTRIA DE LA INFORMACION|SERVICIOS ESPECIALIZADOS|SELECCION Y ADQUISICION|DISENO DE PROYECTOS|INVESTIGACION DE CAMPO"),
    (r"-lp-cics", "soc", r"DISENO DE INSTRUMENTOS PARA LA EVALUACION|PRACTICA (SUPERVISADA|INTEGRATIVA)|FORENSE|INTERVENCION.*APRENDIZAJE|CONSULTORIA PROFESIONAL"),
    (r"ltrabajosocial", "soc", r"COMUNICACION INCLUSIVA|INVESTIGADOR SOCIAL"),
    (r"loptometria", "clin", r"PERCEPCION VISUAL|INTERVENCION TEMPRANA|VISION Y APRENDIZAJE"),
    (r"medico-cirujano", "salud", r"UNIDAD INTEGRATIVA DEL SISTEMA"),
    (r"-mch-|-mcp-", "prof", r"ANALISIS DE LA INFORMACION"),
    (r"-ibq-|-qbp-", "quim", r"METODOS DE ANALISIS"),
    (r"if-upibi", "proc", r"ELEMENTOS PARA EL DISENO"),
    (r"if-upibi", "quim", r"PRODUCTOS NATURALES"),
    (r"ialimentos|lennutricion", "proc", r"DESARROLLO DE PRODUCTOS|INOCUIDAD ALIMENTARIA|INDUSTRIA ALIMENTARIA"),
    (r"-iqi-", "proc", r"ELEMENTOS DE DISENO|DIESENO|INGENIERIA DE VAPOR|FENOMENOS DE SUPERFICIE|NORMAS Y CODIGOS DE DISENO|TECNICAS INSTRUMENTALES|SIMULACION DE PROCESOS"),
    (r"quimica-petrolera", "proc", r"ANALISIS DE RIESGOS"),
    (r"-ibq-", "proc", r"ADITIVOS EN LA INDUSTRIA ALIMENTARIA"),
    (r"-isa-", "amb", r"CONTAMINANTES"),
    (r"-ibm-", "elec", r"MINIMIZACION DE RUIDO"),
    (r"-im-esfm", "ind", r"SEMINARIO DE MODELACION INDUSTRIAL"),
    (r"iarquitecto", "civil", r"TERMODINAMICA"),
    (r"imecanica|textil|automotrices|iaeronautica|-im-upiita", "mec", r"TERMODINAMICA|TRANSFERENCIA DE CALOR"),
    (r"imym|metalurgica", "mec", r"MODELADO Y SIMULACION DE PROCESOS"),
    (r"iarquitecto|civil", "civil", r"EXPRESION GRAFICA|COMPOSICION GRAFICA|PROYECTO EJECUTIVO|INSTALACIONES ESPECIALES|INSTALACIONES DE COMUNICACION Y CLIMATIZACION|REPRESENTACION GRAFICA|VALUACION INMOBILIARIA|PLANTAS DE TRATAMIENTO|CONCURSOS DE PROYECTOS|PRESENTACION DE PROYECTOS"),
    (r"-ip-esia", "civil", r"POZOS|REGISTROS|PRUEBAS DE PRESION|PRODUCION|PIGS|MAQUETAS|AGUJERO|CEMENTACION|CAMPOS EN AGUJAS|AGUJAS SUBTERRANEAS"),
    (r"-ig-esia", "civil", r"METODOS POTENCIALES|GRAVIMETRICO|DISENO Y DETERMINACION DE PARAMETROS"),
    (r"igeologica|ityf", "civil", r"DISENO ASISTIDO|HIDROMENSURA|VIAS DE COMUNICACION|HIDROGRAFIA|ORDENAMIENTO DEL TERRITORIO|ANALISIS DE RIESGO"),
    (r"imeteorologia", "amb", r"LABORATORIO DE CARTAS Y ANALISIS"),
    (r"ing.-ele|redes-inteligentes", "elec", r"REDES DE DISTRIBUCION|REDES GENERALES|TEORIA DE REDES|REDES Y MICROREDES|SISTEMAS AISLADOS|LUMINOTECNIA"),
    (r"icomunicacionesyelectronica", "elec", r"^DISPOSITIVOS$|SINTETIZADORES|RUIDO Y VIBRACIONES"),
    (r"isc-|isistemascomputacionales", "comp", r"COMPLEX SYSTEMS"),
    (r"-ic-esime", "comp", r"TRANSFERENCIA Y PROCESAMIENTO DE LA INFORMACION"),
    (r"ir-esime", "mec", r"DISENO DE CONJUNTOS|SISTEMAS EXPERIMENTALES"),
    (r"-ii-upiig|ingenieria-industrial", "ind", r"SISTEMAS HIBRIDOS|SIMULACION DE SISTEMAS|DESARROLLO DEL PRODUCTO|PROTOTIPO|TECNOLOGIAS INTELIGENTES|INDUSTRIA 5.0"),
    (r"-im-esfm|-lm-esfm", "fm", r"SIMULACION|ANALISIS DE DECISIONES"),
    (r"-lcd-", "datos", r"SIMULACION"),
    (r"-it-upiit|imovilidad|if-upiicsa", "ind", r"REDES|SIMULACION|SEMINARIO DE INGENIERIA FERROVIARIA|ESTUDIOS PARA PROYECTOS FERROVIARIOS|INGENIERIA BASICA Y PROYECTO EJECUTIVO"),
    (r"-it-upiita", "redes", r"TELEFONIA|SISTEMAS CELULARES|PROTOCOLOS DE INTERNET|REDES|APLICACIONES DISTRIBUIDAS"),
    (r"-it-upiita", "elec", r"PROCESAMIENTO DE VOZ|FILTRADO"),
    (r"informatica|upiicsa-ing-inf", "redes", r"REDES Y.*SIMULACION"),
    (r"upiicsa-ing-inf", "comp", r"INGENIERIA DE DISENO"),
    (r"redes-inteligentes", "ctrl", r"MODELADO Y SIMULACION"),
]


def clasificar(nombre, plan_id="", plan=None):
    """Devuelve categoría y motivo auditable; el contexto nunca rellena todo un plan."""
    n = normalizar(nombre)
    if n in EXCEPCIONES:
        cat, motivo = EXCEPCIONES[n]
        return cat, "excepción: " + motivo
    # Optativas y electivas sin tema: espacio de especialización (decisión del orquestador, 2026-10-09).
    if motivo_pendiente(nombre) == "Espacio curricular sin tema":
        return "esp", "regla: optativa o electiva sin tema"
    # La función curricular precede al contexto económico del título.
    if re.search(r"\b(INGLES|FRANCES|ALEMAN|ITALIANO|IDIOMAS?)\b|LENGUA(S)? (EXTRANJERA|INDIGENA)", n):
        return "integral", "regla: lenguas"
    if PATRONES[0][1].search(n):
        return "prof", "regla: " + PATRONES[0][1].pattern
    if "ENFERMERIA" in n and re.search(r"FUNDAMENTO|TEORIA|TEORIAS|BASES|FILOSOF|MODELOS", n) and not re.search(r"CLINIC|PRACTICA", n):
        return "salud", "contexto: fundamentos de enfermería; distinguir de práctica clínica"
    if "ESTRUCTURAS" in n and "iaeronautica" in plan_id:
        return "mec", "contexto: estructuras aeronáuticas"
    for patron_plan, cat, patron_nombre in CONTEXTO:
        if re.search(patron_plan, plan_id) and re.search(patron_nombre, n):
            return cat, f"contexto: {patron_plan}; tema {patron_nombre}"
    if plan_id in NEGOCIOS and re.search(r"ACCOUNTING|MANAGEMENT|BUSINESS|TRADE|INVESTMENT|NEGOTIATION|PUBLIC RELATIONS|MARKET|BRAND|CUSTOMER|CRM|DROPSHIPPING|MERCHANDISING|E- BUSINESS|ARANCEL|ADUAN|MERCEOLOG|CONTRACT|CONTRAT|LICITACION|FRANQUI|PUBLICI|CLIENTE|CONSUMIDOR|COMPRA|CONTADOR|AUDITIO|CONTRIBUCION|HACIENDA PUBLICA|RECURSOS FEDERALES|RENDICION DE CUENTAS|CAPITAL|COMPETENCIA PERFECTA|VALOR|CUENTAS NACIONALES|EQUILIBRIO GENERAL|MONETARIA|POLITICAS DE DESARROLLO|POLITICAS DEL DESARROLLO|POBREZA|SOBERANIA|TURISTIC|SEO Y SEM|CONTENIDOS DIGITALES|KPI|GEOPOLITIC|ESTUDIOS REGIONALES|POLITICA EXTERIOR|FORMACION DIRECTIVA|DEBATE CONTEMPORANEO|TALENTO HUMANO|EXPORTACION|IMPORTACION|ADQUISICIONES|ENTREPRENEURSHIP|RECLUTAMIENTO|PERFORMANCE ASSESSMENT|REMUNERACION|IMPUESTOS|CONSULORIA|ESTRATEGIAS|TIENDA ONLINE|COMUNICACION.*SOCIAL MEDIA|PROVECTOS DE COMUNICACION|CAMBIO TECNOLOGICO MUNDIAL", n):
        return "adm", "contexto: vocabulario disciplinar de negocios y economía"
    # Economía y gestión no deben desplazar las especialidades temáticas.
    if GESTION.search(n):
        if re.search(r"DERECHO|LEGISLACION", n):
            cat = "adm" if plan_id in NEGOCIOS else ("soc" if not plan_id or "ltrabajosocial" in plan_id or "-lp-" in plan_id else "integral")
        else:
            cat = "adm" if plan_id in NEGOCIOS or (not plan_id and re.search(r"CONTAB|FINAN|ECONOM|COMERC|MERCAD|FISCAL|TRIBUT|AUDITOR", n)) else "integral"
        # Proyectos de investigación, arquitectura o software sí tienen tema.
        if not re.search(r"GESTION (AMBIENTAL|DOCUMENTAL)|ORGANIZACION (DOCUMENTAL|BIBLIOGRAFICA)|ADMINISTRACION DE (LA CALIDAD|OPERACIONES|LA PRODUCCION)|SOCIOLOG|PSICOLOG|CALIDAD|LOGISTICA", n):
            return cat, "contexto: núcleo de negocios" if cat == "adm" else "contexto: formación social" if cat == "soc" else "contexto: formación integral fuera del núcleo de negocios"
    for cat, patron in PATRONES:
        if patron.search(n):
            return cat, "regla: " + patron.pattern
    if re.search(r"DESARROLLO PROSPECTIVO DE PROYECTOS|PROYECTOS? DE INGENIERIA O TOPICOS", n):
        return "prof", "contexto: proyecto de integración profesional en ingeniería; confirmar alternativa de tópicos"
    return "sin_categoria", "sin regla temática; revisar OCR o tema"


def generar(entrada, catalogo):
    salida = {"_reglas": {"version": VERSION, "normalizacion": "NFKD, sin acentos, mayúsculas, espacios simples",
                           "prioridad": "excepciones exactas, lenguas y práctica profesional, contexto de plan, reglas temáticas ordenadas",
                           "generador": "tools/categorias_ipn.py"}}
    sin = []
    total = Counter()
    revisiones = {}
    conteos = {}
    for pid, plan in entrada["planes"].items():
        mapa, revision, cuenta = {}, {}, Counter()
        for nivel, nombre in plan["materias"]:
            n = normalizar(nombre)
            cat, motivo = clasificar(nombre, pid, plan)
            if cat != "sin_categoria" and cat not in catalogo["categorias"]:
                raise ValueError(f"{pid}: {nombre!r}: categoría inexistente {cat!r}; {motivo}")
            mapa[n] = cat
            cuenta[cat] += 1
            if motivo.startswith(("excepción:", "contexto:")):
                revision[n] = (cat, motivo)
            if cat == "sin_categoria":
                sin.append({"plan_id": pid, "nivel": nivel, "nombre": nombre, "nombre_normalizado": n})
                LOG.warning("Sin categoría: plan=%s nivel=%s nombre=%r motivo=%s", pid, nivel, nombre, motivo)
        salida[pid] = mapa
        total.update(cuenta)
        conteos[pid] = cuenta
        revisiones[pid] = revision
        LOG.info("Plan=%s materias=%d únicas=%d sin_categoria=%d (%.2f%%) revisiones=%d",
                 pid, sum(cuenta.values()), len(mapa), cuenta["sin_categoria"],
                 100 * cuenta["sin_categoria"] / sum(cuenta.values()), len(revision))
    salida["_sin_categoria"] = sin
    return salida, total, revisiones, conteos


def escapar(texto):
    return str(texto).replace("|", r"\|").replace("\n", " ")


def motivo_pendiente(nombre):
    n = normalizar(nombre)
    if re.fullmatch(r"(?:OPTATIVA|OPLATIVA|ELECTIVAS?)(?:\s+[A-Z0-9]+)?[ *+]*", n) or re.fullmatch(r"ELECTIVA \(\s*DEL [0-9IVX]+ AL [0-9IVX]+\)", n) or n.startswith("ASIGNATURAS OPTATIVAS ("):
        return "Espacio curricular sin tema"
    if re.search(r"^(SUB)?TOTAL\b|INTERVALO H/SEMANA|TEORIA PRACTICA T/H|^C SEMESTRE", n):
        return "Posible fila de horas/créditos del OCR"
    if n == "TRAYECTORIA":
        return "Posible encabezado del OCR"
    return "Tema ambiguo, título incompleto o regla pendiente"


def reporte(entrada, catalogo, salida, total, revisiones, conteos):
    cantidad = sum(total.values())
    doc = ["# Categorías de los planes del IPN (propuesta)", "", "## 1. Alcance y método", "",
           f"{len(entrada['planes'])} planes; {cantidad} registros de materias. Clasificador `{VERSION}`: "
           "excepciones exactas, función curricular, contexto de plan y reglas temáticas por prioridad. "
           "Los conteos incluyen repeticiones por nivel; las claves de salida agrupan nombres normalizados dentro de cada plan.", "",
           "Fuente: mapas curriculares leídos mediante OCR. Se conserva el nombre recibido; esta propuesta requiere "
           "revisión académica y no establece equivalencias ni modifica las áreas de UPIITA, ESCOM o UPIBI.", "",
           "Supuesto: el núcleo económico, administrativo y jurídico de los planes de negocios va en `adm`; "
           "en los demás planes, economía y gestión van en `integral`. Las optativas con tema siguen su disciplina; "
           "las optativas y electivas sin tema van en `esp`. No se asigna una disciplina por el solo hecho de pertenecer a un plan.", "",
           "## 2. Categorías nuevas", "", "| Clave | Nombre | Incluye |", "|---|---|---|"]
    for clave in catalogo["orden"]:
        c = catalogo["categorias"].get(clave, {})
        if c.get("propuesta"):
            doc.append(f"| {clave} | {c['nombre']} | {c['incluye']} |")
    doc += ["", "## 3. Conteo global y pendientes", "",
            f"Sin categoría: **{total['sin_categoria']}/{cantidad} = {100 * total['sin_categoria'] / cantidad:.2f} %** "
            "(registros sin categoría / registros totales × 100).", "",
            "| Categoría | Materias (n) |", "|---|---:|"]
    for cat in catalogo["orden"] + ["sin_categoria"]:
        if total[cat]:
            doc.append(f"| {cat} | {total[cat]} |")
    motivos = Counter(motivo_pendiente(s["nombre"]) for s in salida["_sin_categoria"])
    excedidos = [(pid, c) for pid, c in conteos.items() if c["sin_categoria"] / sum(c.values()) > 0.05]
    doc += ["", "### 3.1. Decisiones pendientes y limitaciones", "",
            f"{len(excedidos)} planes superan el 5 % sin categoría. "
            "La meta global es menor del 2 %; el resultado se conserva sin asignaciones de relleno.", "",
            "| Motivo de revisión | Registros |", "|---|---:|"]
    for motivo, n in motivos.items():
        doc.append(f"| {motivo} | {n} |")
    doc += ["", "Las optativas y electivas sin tema van en `esp`; `esp` no sustituye a una disciplina desconocida. "
            "Las filas sospechosas del OCR requieren cotejo local del mapa. No se elimina ningún registro de la entrada.", "",
            "No se propone otra categoría: teoría general de sistemas, ingeniería de sistemas y títulos genéricos "
            "de diseño requieren confirmar contenido antes de decidir si el catálogo resulta suficiente.", "",
            "### 3.2. Lista de materias sin categoría", "",
            "| Plan | Nivel | Materia OCR | Motivo |", "|---|---|---|---|"]
    for s in salida["_sin_categoria"]:
        doc.append(f"| {s['plan_id']} | {s['nivel']} | {escapar(s['nombre'])} | {motivo_pendiente(s['nombre'])} |")
    if not salida["_sin_categoria"]:
        doc.append("| Ninguno | | | |")
    doc += ["", "## 4. Revisión por plan", ""]
    for i, (pid, plan) in enumerate(entrada["planes"].items(), 1):
        grupos = defaultdict(list)
        for _, nombre in plan["materias"]:
            cat = salida[pid][normalizar(nombre)]
            if nombre not in grupos[cat]:
                grupos[cat].append(nombre)
        doc += [f"### 4.{i}. {pid}", "",
                f"Unidades académicas: {', '.join(plan.get('unidades', [])) or 'No indicada'}. "
                f"Año del plan: {plan.get('plan') or 'No indicado en la entrada'}. "
                f"Fuente: [mapa curricular]({plan['fuente']}).", "",
                "| Categoría | Materias (n) | Ejemplos (hasta 6) |", "|---|---:|---|"]
        for cat in catalogo["orden"] + ["sin_categoria"]:
            if conteos[pid][cat]:
                nombre_cat = catalogo["categorias"].get(cat, {}).get("nombre", "Sin categoría")
                doc.append(f"| {cat}: {nombre_cat} | {conteos[pid][cat]} | {'; '.join(escapar(n) for n in grupos[cat][:6])} |")
        doc += ["", "Materias dudosas por excepción o contexto:", ""]
        if revisiones[pid]:
            doc += ["| Materia normalizada | Categoría | Decisión que requiere revisión |", "|---|---|---|"]
            for nombre, (cat, motivo) in revisiones[pid].items():
                if "; tema " in motivo:
                    motivo = "contexto: título ambiguo interpretado según la disciplina del plan"
                doc.append(f"| {escapar(nombre)} | {cat} | {motivo} |")
        else:
            doc.append("Ninguna decisión por excepción o contexto.")
        doc.append("")
    return "\n".join(doc)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pendientes", action="store_true", help="Inspeccionar sin escribir salidas")
    parser.add_argument("--filtro", default="", help="Subcadena del identificador para inspección")
    parser.add_argument("--resumen", action="store_true", help="Generar con resumen de pendientes, sin log por materia")
    args = parser.parse_args()
    logging.basicConfig(level=logging.ERROR if args.pendientes or args.resumen else logging.INFO,
                        format="%(levelname)s %(message)s")
    entrada = json.loads((ROOT / "data/planes_ipn_materias.json").read_text(encoding="utf-8"))
    catalogo = json.loads((ROOT / "data/categorias.json").read_text(encoding="utf-8"))
    salida, total, revisiones, conteos = generar(entrada, catalogo)
    if args.pendientes:
        for pid, cuenta in conteos.items():
            if args.filtro not in pid:
                continue
            nombres = [s["nombre_normalizado"] for s in salida["_sin_categoria"] if s["plan_id"] == pid]
            print(pid, f"{cuenta['sin_categoria']}/{sum(cuenta.values())}", "; ".join(dict.fromkeys(nombres)))
    else:
        (ROOT / "data/categorias_ipn.json").write_text(json.dumps(salida, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        (ROOT / "docs/CATEGORIAS-IPN.md").write_text(reporte(entrada, catalogo, salida, total, revisiones, conteos), encoding="utf-8")
    print(f"Total: {sum(total.values())}; sin categoría: {total['sin_categoria']} ({100 * total['sin_categoria'] / sum(total.values()):.2f} %)")
    if args.resumen:
        print("Motivos:", dict(Counter(motivo_pendiente(s["nombre"]) for s in salida["_sin_categoria"])))
        print("Planes > 5 %:", sum(c["sin_categoria"] / sum(c.values()) > 0.05 for c in conteos.values()))
        print("Decisiones por contexto/excepción:", sum(len(r) for r in revisiones.values()))
        print("Otros pendientes:", sorted({s["nombre_normalizado"] for s in salida["_sin_categoria"]
                                           if motivo_pendiente(s["nombre"]).startswith("Tema")}))


if __name__ == "__main__":
    main()
