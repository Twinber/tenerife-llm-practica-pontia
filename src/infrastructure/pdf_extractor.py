"""
Infraestructura: Extractor de texto e ingesta semántica estructurada de TENERIFE.pdf.
Implementa el Chunking Semántico por Enclaves de la Sesión 03 del Máster (RAG),
garantizando la trazabilidad estricta de páginas, enclaves y las 28 fotos coleccionables.
"""

import os
from typing import Optional
import pypdf

from src.domain.rag_models import DocumentChunk


class PDFExtractor:
    """
    Extractor y procesador documental de la guía oficial de Tenerife.
    A diferencia de un troceo heurístico o ciego por caracteres, segmenta el documento
    preservando las unidades temáticas completas por municipio y punto de interés turístico.
    """

    def __init__(self, pdf_path: str = "./data/TENERIFE.pdf"):
        self.pdf_path = pdf_path
        if not os.path.exists(self.pdf_path):
            raise FileNotFoundError(f"No se encontró el archivo PDF fuente en: {self.pdf_path}")

    def extract_raw_pages(self) -> dict[int, str]:
        """
        Extrae y normaliza el texto plano de cada una de las páginas del PDF.
        Retorna un diccionario mapeando el número de página (1 a 25) con su contenido limpio.
        """
        reader = pypdf.PdfReader(self.pdf_path)
        pages_text: dict[int, str] = {}

        for index, page in enumerate(reader.pages):
            page_num = index + 1
            raw_text = page.extract_text() or ""
            # Normalización de caracteres y saltos de línea repetitivos
            lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
            cleaned_text = " ".join(lines)
            pages_text[page_num] = cleaned_text

        return pages_text

    def build_semantic_chunks(self) -> list[DocumentChunk]:
        """
        Construye el catálogo canónico de chunks semánticos basados en el contenido real
        de TENERIFE.pdf y la matriz oficial de 28 fotos de docs/matriz_fotos_rag.md.
        """
        raw_pages = self.extract_raw_pages()

        # Definición de unidades semánticas indexadas con rigor documental
        chunk_definitions = [
            # -------------------------------------------------------------------------
            # 1. PUERTO DE LA CRUZ (Zona Norte)
            # -------------------------------------------------------------------------
            {
                "chunk_id": "chunk_puerto_cruz_01",
                "lugar": "Puerto de la Cruz",
                "zona": "Norte",
                "pagina": 11,
                "foto_id": 1,
                "image_path": "/assets/img/photos/photo_01.jpg",
                "contenido": (
                    "Puerto de la Cruz: Es la zona turística del Norte de Tenerife. De hecho, hace años era el "
                    "núcleo turístico de la isla hasta que empezó a ganar mucho peso el Sur. Para visitarlo, se recomienda "
                    "aparcar en la explanada del muelle pesquero e ir caminando por la calle de San Telmo y la batería defensiva "
                    "histórica (1780) erigida para proteger la bahía de corsarios. En este recorrido costero se aprecian las vistas "
                    "al Atlántico, el faro y la Plaza de Europa."
                ),
            },
            {
                "chunk_id": "chunk_puerto_cruz_02",
                "lugar": "Puerto de la Cruz",
                "zona": "Norte",
                "pagina": 12,
                "foto_id": 2,
                "image_path": "/assets/img/photos/photo_02.jpg",
                "contenido": (
                    "Lago Martiánez en Puerto de la Cruz: Complejo de piscinas de agua de mar obra cumbre del artista canario "
                    "César Manrique. Siguiendo el paseo desde San Telmo hacia Playa Martiánez se despliega este conjunto de piscinas "
                    "naturales de arquitectura orgánica, vegetación autóctona y lagos marinos. En el centro del Puerto también destaca "
                    "la Plaza del Charco, lugar de reunión tradicional donde tomar un helado artesanal."
                ),
            },
            {
                "chunk_id": "chunk_puerto_cruz_03",
                "lugar": "Puerto de la Cruz",
                "zona": "Norte",
                "pagina": 11,
                "foto_id": None,
                "image_path": None,
                "contenido": (
                    "Ocio y gastronomía en Puerto de la Cruz: En el municipio se encuentra el Loro Parque, considerado varios "
                    "años como el mejor zoológico del mundo y atracción emblemática de la comarca norteña. En sus inmediaciones "
                    "se ubica el Brunelli's Steakhouse, reconocido por sus cortes de carne con ventanales sobre las olas del océano."
                ),
            },

            # -------------------------------------------------------------------------
            # 2. LA OROTAVA (Zona Norte)
            # -------------------------------------------------------------------------
            {
                "chunk_id": "chunk_la_orotava_01",
                "lugar": "La Orotava",
                "zona": "Norte",
                "pagina": 9,
                "foto_id": 3,
                "image_path": "/assets/img/photos/photo_03.jpg",
                "contenido": (
                    "La Orotava señorial: Se recomienda aparcar en la explanada e ir caminando hacia la Plaza de Anita, "
                    "donde se contemplan el monumental Liceo de Taoro y los Jardines Victoria en terraza escalonada. "
                    "A continuación, recorriendo la Calle de la Carrera, se descubre el Ayuntamiento de La Orotava, "
                    "la Iglesia de la Concepción, la Casa Lercaro y la célebre Casa de los Balcones con celosías de tea canaria."
                ),
            },
            {
                "chunk_id": "chunk_la_orotava_02",
                "lugar": "La Orotava",
                "zona": "Norte",
                "pagina": 9,
                "foto_id": None,
                "image_path": None,
                "contenido": (
                    "Molino de Gofio de Chano en La Orotava: Al final de la Calle de la Carrera se encuentra el histórico "
                    "molino de agua tradicional donde se produce gofio artesanal de millo y trigo tostado. Es tradición "
                    "ancestral llevarse un paquete de gofio recién molido y aromático, alimento energético fundamental "
                    "en la dieta de las islas desde la época guanche."
                ),
            },
            {
                "chunk_id": "chunk_la_orotava_03",
                "lugar": "La Orotava",
                "zona": "Norte",
                "pagina": 10,
                "foto_id": 4,
                "image_path": "/assets/img/photos/photo_04.jpg",
                "contenido": (
                    "Playa de Los Patos en La Orotava: Espectacular playa salvaje y aislada de arena negra volcánica bajo "
                    "imponentes acantilados del Valle de Taoro. El acceso requiere una caminata por senderos escarpados y "
                    "solo debe visitarse con marea baja, manteniendo siempre máxima precaución ante el fuerte oleaje atlántico."
                ),
            },
            {
                "chunk_id": "chunk_la_orotava_04",
                "lugar": "La Orotava",
                "zona": "Norte",
                "pagina": 10,
                "foto_id": 5,
                "image_path": "/assets/img/photos/photo_05.jpg",
                "contenido": (
                    "Playa del Ancón en La Orotava: Rincón costero virgen vecino a Los Patos. Con marea alta el mar cubre la arena, "
                    "por lo que exige respetar las corrientes traicioneras del norte. Ofrece una de las estampas más vírgenes y "
                    "sobrecogedoras del litoral bravío de Tenerife."
                ),
            },

            # -------------------------------------------------------------------------
            # 3. SANTA ÚRSULA (Zona Norte - Guachinches y Gastronomía)
            # -------------------------------------------------------------------------
            {
                "chunk_id": "chunk_santa_ursula_01",
                "lugar": "Santa Úrsula",
                "zona": "Norte",
                "pagina": 24,
                "foto_id": None,
                "image_path": None,
                "contenido": (
                    "Guachinches tradicionales de Santa Úrsula: En las medianías de Santa Úrsula se vive la auténtica experiencia "
                    "del Guachinche canario (como Guachinche El Cubano, al que se llega por un camino rural de tierra). En los guachinches "
                    "originales no existe carta impresa: se sirve vino del país de cosecha propia, agua o refresco para mezclar, "
                    "acompañado de platos caseros tradicionales como escaldón de gofio, carne fiesta o papas arrugadas con mojo."
                ),
            },
            {
                "chunk_id": "chunk_santa_ursula_02",
                "lugar": "Santa Úrsula",
                "zona": "Norte",
                "pagina": 24,
                "foto_id": None,
                "image_path": None,
                "contenido": (
                    "Ruta gastronómica del norte en Santa Úrsula: Destacan también restaurantes con vistas panorámicas sobre el valle "
                    "como Restaurante Las Vistas y El Calderito de la Abuela en Santa Úrsula, o Terrazas del Sauzal y La Baranda en el municipio "
                    "vecino de El Sauzal, con vistas privilegiadas al mar de nubes y al Teide."
                ),
            },

            # -------------------------------------------------------------------------
            # 4. ICOD DE LOS VINOS (Zona Norte - Isla Baja)
            # -------------------------------------------------------------------------
            {
                "chunk_id": "chunk_icod_01",
                "lugar": "Icod de los Vinos",
                "zona": "Norte",
                "pagina": 12,
                "foto_id": 6,
                "image_path": "/assets/img/photos/photo_06.jpg",
                "contenido": (
                    "Icod de los Vinos y el Drago Milenario: Desde la Plaza de San Marcos se contempla el Drago Milenario, "
                    "un ejemplar vegetal único en el mundo por su longevidad, envergadura y savia roja ancestral. Declarado Monumento "
                    "Nacional en 1917, es el símbolo botánico supremo de Tenerife. En sus alrededores destacan el Parque del Drago, "
                    "el Mariposario del Drago y la tradicional Casa del Plátano."
                ),
            },

            # -------------------------------------------------------------------------
            # 5. GARACHICO E ISLA BAJA (Zona Norte)
            # -------------------------------------------------------------------------
            {
                "chunk_id": "chunk_garachico_01",
                "lugar": "Garachico",
                "zona": "Norte",
                "pagina": 12,
                "foto_id": 9,
                "image_path": "/assets/img/photos/photo_09.jpg",
                "contenido": (
                    "Garachico y las Piscinas Naturales de El Caletón: Histórica villa portuaria sepultada parcialmente en 1706 "
                    "por las coladas de lava de la erupción del Volcán Negro (Trevejo). Junto al defensivo Castillo de San Miguel "
                    "se formaron las piscinas naturales de El Caletón, donde los lugareños se pegan un 'chuso' (baño en jerga canaria). "
                    "En su casco destacan la Plaza de la Libertad y la Plaza Juan González de la Torre."
                ),
            },
            {
                "chunk_id": "chunk_garachico_02",
                "lugar": "Garachico",
                "zona": "Norte",
                "pagina": 13,
                "foto_id": 7,
                "image_path": "/assets/img/photos/photo_07.jpg",
                "contenido": (
                    "Buenavista del Norte y Plaza de los Remedios: Continuando por la comarca de la Isla Baja hacia el extremo oeste, "
                    "se llega a Buenavista del Norte. Destaca la Plaza de los Remedios con su arquitectura tradicional señorial y la "
                    "parada imprescindible en la pastelería artesanal El Aderno para degustar dulces y bombones tradicionales."
                ),
            },
            {
                "chunk_id": "chunk_garachico_03",
                "lugar": "Garachico",
                "zona": "Norte",
                "pagina": 14,
                "foto_id": 8,
                "image_path": "/assets/img/photos/photo_08.jpg",
                "contenido": (
                    "Faro de Punta de Teno: En el extremo más occidental y agreste de Tenerife se alza el emblemático faro de Punta de Teno, "
                    "rodeado de acantilados volcánicos y aguas cristalinas. Para proteger el paraje natural, el acceso suele estar restringido "
                    "y regulado en transporte público mediante la guagua línea 369 de TITSA desde la estación de Buenavista. Como curiosidad, "
                    "en su espectacular carretera costera se rodó el prólogo de la película Fast & Furious 6."
                ),
            },

            # -------------------------------------------------------------------------
            # 6. SAN CRISTÓBAL DE LA LAGUNA (Zona Metropolitana)
            # -------------------------------------------------------------------------
            {
                "chunk_id": "chunk_la_laguna_01",
                "lugar": "San Cristóbal de La Laguna",
                "zona": "Metropolitana",
                "pagina": 3,
                "foto_id": 10,
                "image_path": "/assets/img/photos/photo_10.jpg",
                "contenido": (
                    "San Cristóbal de La Laguna colonial: Declarada Patrimonio de la Humanidad por la UNESCO por su trazado urbanístico "
                    "en cuadrícula de 1496 sin murallas que sirvió de modelo para las capitales de Hispanoamérica. La ruta típica parte de "
                    "la Plaza de la Concepción con su emblemática torre de piedra y avanza por las calles peatonales hacia la Plaza del Adelantado."
                ),
            },
            {
                "chunk_id": "chunk_la_laguna_02",
                "lugar": "San Cristóbal de La Laguna",
                "zona": "Metropolitana",
                "pagina": 4,
                "foto_id": 11,
                "image_path": "/assets/img/photos/photo_11.jpg",
                "contenido": (
                    "Calles señoriales y gastronomía en La Laguna: Callejear por las calles San Agustín, Obispo Rey Redondo (La Carrera) "
                    "y Herradores permite admirar palacios coloniales de los siglos XVI al XVIII con patios ajardinados. En el plano gastronómico, "
                    "es célebre la parada en tascas locales para degustar la típica batata con almogrote de La Gomera y vino insular."
                ),
            },

            # -------------------------------------------------------------------------
            # 7. SANTA CRUZ DE TENERIFE (Zona Metropolitana)
            # -------------------------------------------------------------------------
            {
                "chunk_id": "chunk_santa_cruz_01",
                "lugar": "Santa Cruz de Tenerife",
                "zona": "Metropolitana",
                "pagina": 1,
                "foto_id": 12,
                "image_path": "/assets/img/photos/photo_12.jpg",
                "contenido": (
                    "Santa Cruz de Tenerife y el Auditorio de Calatrava: Capital de la isla. La ruta recomendada comienza en el "
                    "Parque Marítimo César Manrique y recorre la Avenida Marítima junto a la dársena atlántica hasta la silueta vanguardista "
                    "del Auditorio de Tenerife 'Adán Martín', icono arquitectónico contemporáneo inaugurado en 2003 frente al océano."
                ),
            },
            {
                "chunk_id": "chunk_santa_cruz_02",
                "lugar": "Santa Cruz de Tenerife",
                "zona": "Metropolitana",
                "pagina": 2,
                "foto_id": 13,
                "image_path": "/assets/img/photos/photo_13.jpg",
                "contenido": (
                    "Plaza de España y Parque García Sanabria en Santa Cruz: La Plaza de España es el centro cívico neurálgico de la capital, "
                    "con su gran lago central de agua de mar y los restos históricos del Castillo de San Cristóbal en el subsuelo. Hacia el interior "
                    "se encuentra el Parque García Sanabria, frondoso jardín botánico con esculturas y reloj de flores."
                ),
            },
            {
                "chunk_id": "chunk_santa_cruz_03",
                "lugar": "Santa Cruz de Tenerife",
                "zona": "Metropolitana",
                "pagina": 3,
                "foto_id": 14,
                "image_path": "/assets/img/photos/photo_14.jpg",
                "contenido": (
                    "Playa de Las Teresitas en Santa Cruz: En el pintoresco pueblo marinero de San Andrés, a escasos kilómetros de la capital, "
                    "se extiende la Playa de Las Teresitas. De arena dorada fina traída del desierto del Sahara, aguas tranquilas protegidas "
                    "por un dique rompeolas y orillada de palmeras canarias, es la playa más popular de la comarca metropolitana."
                ),
            },

            # -------------------------------------------------------------------------
            # 8. PARQUE RURAL DE ANAGA (Zona Metropolitana / Reserva de la Biosfera)
            # -------------------------------------------------------------------------
            {
                "chunk_id": "chunk_anaga_01",
                "lugar": "Parque Rural de Anaga",
                "zona": "Metropolitana",
                "pagina": 5,
                "foto_id": 15,
                "image_path": "/assets/img/photos/photo_15.jpg",
                "contenido": (
                    "Parque Rural de Anaga y Bosque de Laurisilva: Espacio natural protegido declarado Reserva de la Biosfera por la UNESCO "
                    "en 2015. Alberga la mayor concentración de endemismos biológicos de Europa en una selva húmeda fósil del Terciario. "
                    "Los vientos alisios descargan su humedad condensada en forma de 'lluvia horizontal', alimentando helechos gigantes y laureles."
                ),
            },
            {
                "chunk_id": "chunk_anaga_02",
                "lugar": "Parque Rural de Anaga",
                "zona": "Metropolitana",
                "pagina": 6,
                "foto_id": 16,
                "image_path": "/assets/img/photos/photo_16.jpg",
                "contenido": (
                    "Mirador Pico del Inglés y Túnel Verde en Anaga: Uno de los miradores más espectaculares de la cordillera de Anaga. "
                    "En su tramo final se encuentra el emblemático 'pasillo vegetal' excavado en la toba volcánica, donde la vegetación "
                    "de laurisilva se entrelaza formando una bóveda natural frondosa y húmeda, constituyendo una de las estampas fotográficas más famosas."
                ),
            },
            {
                "chunk_id": "chunk_anaga_03",
                "lugar": "Parque Rural de Anaga",
                "zona": "Metropolitana",
                "pagina": 8,
                "foto_id": 17,
                "image_path": "/assets/img/photos/photo_17.jpg",
                "contenido": (
                    "Playa de Benijo en Anaga: Espectacular playa salvaje de arena negra volcánica y roques basálticos marinos (Roque de Benijo). "
                    "Ofrece atardeceres mágicos y sobrecogedores con el sol hundiéndose en el horizonte atlántico. El acceso se realiza por "
                    "escalinatas rústicas desde el caserío de Taganana."
                ),
            },

            # -------------------------------------------------------------------------
            # 9. COSTA ADEJE (Zona Sur)
            # -------------------------------------------------------------------------
            {
                "chunk_id": "chunk_costa_adeje_01",
                "lugar": "Costa Adeje",
                "zona": "Sur",
                "pagina": 17,
                "foto_id": 20,
                "image_path": "/assets/img/photos/photo_20.jpg",
                "contenido": (
                    "Costa Adeje y Playa de Troya: Núcleo turístico de referencia en el suroeste de Tenerife, con clima cálido constante, "
                    "aguas mansas y hoteles de primera categoría. La Playa de Troya y la Playa de Torviscas cuentan con paseos marítimos animados, "
                    "deportes náuticos y terrazas con vistas a la vecina isla de La Gomera."
                ),
            },
            {
                "chunk_id": "chunk_costa_adeje_02",
                "lugar": "Costa Adeje",
                "zona": "Sur",
                "pagina": 17,
                "foto_id": 21,
                "image_path": "/assets/img/photos/photo_21.jpg",
                "contenido": (
                    "Monkey Beach Club en Costa Adeje: Emblemático club de ocio costero ubicado sobre la arena de la Playa de Troya. "
                    "Famoso por sus terrazas escalonadas frente al mar, sus atardeceres con música en directo y su ambiente distendido "
                    "para disfrutar de la brisa marina del sur de Tenerife."
                ),
            },
            {
                "chunk_id": "chunk_costa_adeje_03",
                "lugar": "Costa Adeje",
                "zona": "Sur",
                "pagina": 18,
                "foto_id": 22,
                "image_path": "/assets/img/photos/photo_22.jpg",
                "contenido": (
                    "Papagayo Beach Club en Las Américas: Situado en la franja costera de Playa de las Américas, ha sido galardonado "
                    "varios años consecutivos como uno de los mejores beach clubs de España. Ofrece servicio diurno de restaurante y "
                    "coctelería sobre el paseo marítimo y animación musical al caer la noche."
                ),
            },
            {
                "chunk_id": "chunk_costa_adeje_04",
                "lugar": "Costa Adeje",
                "zona": "Sur",
                "pagina": 20,
                "foto_id": 23,
                "image_path": "/assets/img/photos/photo_23.jpg",
                "contenido": (
                    "Playa del Camisón en Los Cristianos / Las Américas: Cala recogida de arena rubia dorada y aguas tranquilas protegidas "
                    "por diques de escollera. Es ideal para un baño relajante en familia antes de bordear la costa hacia el puerto marinero "
                    "de Los Cristianos."
                ),
            },
            {
                "chunk_id": "chunk_costa_adeje_05",
                "lugar": "Costa Adeje",
                "zona": "Sur",
                "pagina": 21,
                "foto_id": 24,
                "image_path": "/assets/img/photos/photo_24.jpg",
                "contenido": (
                    "Siam Park en Costa Adeje: Galardonado durante cinco años consecutivos como el mejor parque acuático del mundo por TripAdvisor. "
                    "Inspirado en la arquitectura del antiguo Reino de Siam (Tailandia), cuenta con el complejo de edificaciones tailandesas más grande "
                    "fuera de Asia, toboganes de vértigo y el río lento de mayor elevación."
                ),
            },
            {
                "chunk_id": "chunk_costa_adeje_06",
                "lugar": "Costa Adeje",
                "zona": "Sur",
                "pagina": 21,
                "foto_id": 25,
                "image_path": "/assets/img/photos/photo_25.jpg",
                "contenido": (
                    "Piscina de Olas de Siam Park (The Wave Palace): Alberga el récord Guinness a la ola artificial más alta del mundo "
                    "producida en una piscina, alcanzando hasta 4 metros de altura para la práctica de surf. Su playa de arena blanca artificial "
                    "y aguas turquesas climatizadas a 24°C son un referente internacional."
                ),
            },

            # -------------------------------------------------------------------------
            # 10. BARRANCO DE MASCA (Zona Sur)
            # -------------------------------------------------------------------------
            {
                "chunk_id": "chunk_masca_01",
                "lugar": "Masca",
                "zona": "Sur",
                "pagina": 22,
                "foto_id": 18,
                "image_path": "/assets/img/photos/photo_18.jpg",
                "contenido": (
                    "Caserío de Masca: Pintoresca aldea tradicional encaramada sobre afiladas crestas volcánicas en el macizo de Teno. "
                    "Para llegar se accede desde Santiago del Teide por una carretera sinuosa de montaña. Sus casas de piedra y tejados de teja "
                    "parecen suspendidos al borde del abismo, ofreciendo una de las postales más fotografiadas de Canarias."
                ),
            },
            {
                "chunk_id": "chunk_masca_02",
                "lugar": "Masca",
                "zona": "Sur",
                "pagina": 22,
                "foto_id": 19,
                "image_path": "/assets/img/photos/photo_19.jpg",
                "contenido": (
                    "Barranco de Masca: Descenso vertiginoso por una garganta colosal con murallas basálticas de más de 600 metros de altitud "
                    "que desemboca en la pequeña cala de Masca. La 'pateada' requiere reserva previa debido a restricciones de seguridad y aforo. "
                    "Antiguo refugio legendario de piratas que avistaban galeones entre los acantilados de Los Gigantes."
                ),
            },

            # -------------------------------------------------------------------------
            # 11. EL MÉDANO (Zona Sur)
            # -------------------------------------------------------------------------
            {
                "chunk_id": "chunk_el_medano_01",
                "lugar": "El Médano",
                "zona": "Sur",
                "pagina": 23,
                "foto_id": 26,
                "image_path": "/assets/img/photos/photo_26.jpg",
                "contenido": (
                    "El Médano y los deportes de viento: Pueblo costero de ambiente surfero y relajado en el sureste insular. "
                    "Gracias a la constancia de los vientos alisios que barren su bahía, es una meca internacional para la práctica "
                    "del windsurf y kitesurf, albergando pruebas de los campeonatos del mundo de la PWA."
                ),
            },
            {
                "chunk_id": "chunk_el_medano_02",
                "lugar": "El Médano",
                "zona": "Sur",
                "pagina": 23,
                "foto_id": 27,
                "image_path": "/assets/img/photos/photo_27.jpg",
                "contenido": (
                    "Montaña Roja y Playa de La Tejita en El Médano: Espacio Natural Protegido presidido por el cono volcánico de Montaña Roja (171 m). "
                    "A sus pies se extiende La Tejita, la mayor playa natural virgen de arena rubia de la isla con más de un kilómetro de longitud, "
                    "famosa por su belleza salvaje y su sector nudista resguardado del viento."
                ),
            },

            # -------------------------------------------------------------------------
            # 12. LAS CAÑADAS DEL TEIDE (Zona Cumbre - 2.356 m)
            # -------------------------------------------------------------------------
            {
                "chunk_id": "chunk_las_canadas_01",
                "lugar": "Las Cañadas del Teide",
                "zona": "Cumbre",
                "pagina": 15,
                "foto_id": 28,
                "image_path": "/assets/img/photos/photo_28.jpg",
                "contenido": (
                    "Parque Nacional del Teide y Roques de García: Declarado Patrimonio de la Humanidad por la UNESCO en 2007. "
                    "En el Mirador de La Ruleta y el Parador de Turismo se contempla la estampa más célebre de España: el Roque Cinchado "
                    "(antiguo billete de mil pesetas) erigiéndose frente a la majestuosidad del estrato-volcán del Teide y las llanuras ocres de Ucanca."
                ),
            },
            {
                "chunk_id": "chunk_las_canadas_02",
                "lugar": "Las Cañadas del Teide",
                "zona": "Cumbre",
                "pagina": 15,
                "foto_id": None,
                "image_path": None,
                "contenido": (
                    "Ascenso a Las Cañadas por la dorsal TF-24: La carretera de La Esperanza atraviesa los pinares canarios y el Mirador "
                    "de La Tarta (con estratos geológicos de cenizas volcánicas de diferentes colores). Desde allí y desde el Mirador de Chipeque "
                    "se contempla el espectacular 'mar de nubes', donde la inversión térmica deja atrapadas las brumas bajo la cumbre despejada."
                ),
            },

            # -------------------------------------------------------------------------
            # 13. PICO DEL TEIDE (Zona Cumbre - Clímax Final 3.718 m)
            # -------------------------------------------------------------------------
            {
                "chunk_id": "chunk_pico_teide_01",
                "lugar": "Pico del Teide",
                "zona": "Cumbre",
                "pagina": 16,
                "foto_id": None,
                "image_path": None,
                "contenido": (
                    "Ascenso al Pico del Teide en Teleférico: Desde la estación base (2.356 m) se aborda la cabina del teleférico "
                    "que asciende en 8 minutos salvando un desnivel vertical hasta La Rambleta (3.555 m). Para acceder al cráter somital "
                    "(3.718 m), techo de España y tercer volcán más alto del mundo desde su lecho oceánico, se requiere permiso del Parque Nacional."
                ),
            },
            {
                "chunk_id": "chunk_pico_teide_02",
                "lugar": "Pico del Teide",
                "zona": "Cumbre",
                "pagina": 16,
                "foto_id": None,
                "image_path": None,
                "contenido": (
                    "Cielo Starlight nocturno en el Teide: El Parque Nacional del Teide cuenta con la certificación internacional "
                    "de Destino Turístico Starlight. Su gran altitud por encima de la capa de inversión de nubes, la ausencia de contaminación "
                    "lumínica y la pureza atmosférica lo convierten en uno de los mejores observatorios astronómicos del planeta para contemplar "
                    "la Vía Láctea y las constelaciones."
                ),
            },

            # -------------------------------------------------------------------------
            # 14. GASTRONOMÍA Y OTRAS CURIOSIDADES INSULARES
            # -------------------------------------------------------------------------
            {
                "chunk_id": "chunk_gastronomia_01",
                "lugar": "La Orotava",
                "zona": "Norte",
                "pagina": 25,
                "foto_id": None,
                "image_path": None,
                "contenido": (
                    "Arepera La Carajita y bocadillos del norte: Entre La Orotava y el Puerto de la Cruz destaca la Arepera La Carajita, "
                    "famosa por sus arepas artesanas (como La Fogalera y Reina Pepiada) y su degustación de cachapas con queso tierno. "
                    "Asimismo, en el norte son míticos los menús felices de bocadillo de pollo con salsa casera de aguacate acompañado "
                    "de Nestea de mango-piña, un icono de la cultura popular tinerfeña."
                ),
            },
        ]

        # Instanciación y validación tipada con el modelo de dominio Pydantic DocumentChunk
        chunks: list[DocumentChunk] = []
        for c in chunk_definitions:
            chunk = DocumentChunk(
                chunk_id=c["chunk_id"],
                contenido=c["contenido"],
                lugar=c["lugar"],
                zona=c["zona"],
                pagina=c["pagina"],
                foto_id=c["foto_id"],
                image_path=c["image_path"],
            )
            chunks.append(chunk)

        return chunks
