// ==============================================================================
// DOMAIN: Catálogo Oficial de Escenarios, Enclaves, NPCs y Hotspots de Tenerife
// ==============================================================================

export interface HotspotLocationDef {
  id: string;
  name: string;
  title: string;
  type: 'scenery' | 'npc';
  leftPct: number;
  topPct?: number;
  bottomPct?: number;
  widthPct: number;
  heightPct: number;
  lookText: string;
  photoId?: number; // Foto desbloqueable del Álbum con [MIRAR]
}

export interface LocationSceneDef {
  id: string;
  name: string;
  zone: 'Norte' | 'Metropolitana' | 'Sur' | 'Cumbre';
  hudTitle: string;
  bgImage: string;
  stampKey?: string;
  mapCoords: { x: number; y: number };
  npc?: {
    id: string;
    name: string;
    role: string;
    initialX: number;
    initialBottom?: number;
    twinberX?: number;
    twinberBottom?: number;
    lookText: string;
    greeting: string;
    photoIdOnLore?: number; // Foto desbloqueable con [HABLAR / LORE]
    hasShop?: boolean;
    shopItem?: {
      name: string;
      price: number;
      dialogueText: string;
    };
    twinBrotherName?: string; // Nombre del hermano gemelo para el easter egg cómico "¿Nos conocemos?"
  };
  hotspots: HotspotLocationDef[];
}

export const LOCATIONS_CATALOG: LocationSceneDef[] = [
  {
    id: 'puerto_cruz',
    name: 'Puerto de la Cruz',
    zone: 'Norte',
    hudTitle: '🌴 PUERTO DE LA CRUZ // MUELLE PESQUERO & SAN TELMO',
    bgImage: '/assets/img/bg_puerto_de_la_cruz.jpg',
    stampKey: 'puerto_cruz',
    mapCoords: { x: 450, y: 210 },
    npc: {
      id: 'paco',
      name: 'Paco el Pescador',
      role: 'Patrón de pesca jubilado',
      initialX: 82.0,
      lookText: "Paco, un curtido pescador canario de pelo blanco y boina marinera. Fuma plácidamente en su pipa de tea.",
      greeting: "¡Hola, forastero! Bienvenido al Puerto de la Cruz. ¿Qué se te ofrece por el muelle?",
      hasShop: true,
      shopItem: {
        name: 'Plátano de Canarias',
        price: 1,
        dialogueText: "¡Toma un buen plátano que me traje en la barca para la faena, chacho! No hay mareo que se le resista."
      },
      photoIdOnLore: 2 // Lago Martiánez (Pág. 12)
    },
    hotspots: [
      {
        id: 'hotspot-faro',
        name: 'Faro de San Telmo',
        title: 'Faro de San Telmo',
        type: 'scenery',
        leftPct: 4.5,
        topPct: 42,
        widthPct: 4.5,
        heightPct: 9,
        lookText: "Faro histórico de San Telmo que corona el extremo del espigón del puerto pesquero.",
        photoId: 1 // Foto #01 [MIRAR] (Pág. 11)
      },
      {
        id: 'hotspot-fortin-san-telmo',
        name: 'Fortín y Batería de San Telmo',
        title: 'Fortín y Batería de San Telmo',
        type: 'scenery',
        leftPct: 21,
        topPct: 40,
        widthPct: 13,
        heightPct: 16,
        lookText: "Batería y fortín defensivo de cantería (1780) erigido para proteger el muelle pesquero de corsarios."
      },
      {
        id: 'hotspot-barca',
        name: 'Barca "El Mojo"',
        title: 'Barca "El Mojo"',
        type: 'scenery',
        leftPct: 23,
        topPct: 62,
        widthPct: 19,
        heightPct: 15,
        lookText: 'La barca "El Mojo"... Embarcación tradicional de pesca artesanal amarrada junto al muelle. Huele a madera curada y salitre.'
      },
      {
        id: 'hotspot-casa',
        name: 'Casa Colonial Balcón de Tea',
        title: 'Casa Colonial Balcón de Tea',
        type: 'scenery',
        leftPct: 63,
        topPct: 30,
        widthPct: 21,
        heightPct: 33,
        lookText: 'Casona señorial canaria del siglo XVII con mirador y balconada tallada en madera de tea de pino canario.'
      },
      {
        id: 'hotspot-teide',
        name: 'El Teide en la cumbre',
        title: 'El Teide en la cumbre',
        type: 'scenery',
        leftPct: 60,
        topPct: 5,
        widthPct: 22,
        heightPct: 24,
        lookText: 'El volcán Teide se divisa a lo lejos sobre las nubes a 3.718 metros. Para capturar la foto oficial de la cumbre tendré que viajar al Parque Nacional de Las Cañadas.'
      }
    ]
  },
  {
    id: 'la_orotava',
    name: 'La Orotava',
    zone: 'Norte',
    hudTitle: '🏛️ LA OROTAVA // VALLE DE TAORO & MOLINO DE CHANO',
    bgImage: '/assets/img/bg_la_orotava.jpg',
    stampKey: 'la_orotava',
    mapCoords: { x: 505, y: 260 },
    npc: {
      id: 'chano',
      name: 'Chano el Molinero',
      role: 'Maestro molinero de gofio',
      initialX: 75.0,
      lookText: "Chano, veterano molinero con mandil de lino blanco manchado de millo tostado y manos sabias.",
      greeting: "¡Chacho, bienvenido al Valle! En este molino molemos el grano con muelas de piedra como hacían nuestros abuelos.",
      hasShop: true,
      shopItem: {
        name: 'Saco de Gofio',
        price: 3,
        dialogueText: "Aquí tienes un buen saco de gofio tradicional de trigo y millo tostado. Te dará fuerzas para la cumbre."
      },
      photoIdOnLore: 4 // Playa de Los Patos (Pág. 10)
    },
    hotspots: [
      {
        id: 'hotspot-liceo-taoro',
        name: 'Casa de los Balcones y Balconadas',
        title: 'Casa de los Balcones y Balconadas',
        type: 'scenery',
        leftPct: 14,
        topPct: 15,
        widthPct: 22,
        heightPct: 45,
        lookText: "Joya señorial canaria del siglo XVII con primorosas balconadas de tea tallada y patios florecidos.",
        photoId: 3 // Foto #03 [MIRAR] (Pág. 9)
      },
      {
        id: 'hotspot-molino-chano',
        name: 'Molino de Agua de Gofio',
        title: 'Molino de Agua de Gofio',
        type: 'scenery',
        leftPct: 71,
        topPct: 48,
        widthPct: 14,
        heightPct: 32,
        lookText: "Antigua rueda hidráulica de madera movida por el agua de la acequia para triturar el millo tostado."
      },
      {
        id: 'hotspot-calle-acequia',
        name: 'Callejón y Acequia del Agua',
        title: 'Callejón y Acequia del Agua',
        type: 'scenery',
        leftPct: 38,
        topPct: 38,
        widthPct: 18,
        heightPct: 38,
        lookText: "Calle empedrada de La Orotava con el canal de piedra que conduce el agua de los manantiales de la cumbre."
      },
      {
        id: 'hotspot-teide-orotava',
        name: 'Pico del Teide y Palmeras de Taoro',
        title: 'Pico del Teide y Palmeras de Taoro',
        type: 'scenery',
        leftPct: 58,
        topPct: 8,
        widthPct: 24,
        heightPct: 25,
        lookText: "El volcán Teide coronando el Valle de Taoro sobre las copas de las palmeras canarias."
      }
    ]
  },
  {
    id: 'santa_ursula',
    name: 'Santa Úrsula',
    zone: 'Norte',
    hudTitle: '🍷 SANTA ÚRSULA // GUACHINCHE & RUTA DEL MAR DE NUBES',
    bgImage: '/assets/img/bg_santa_ursula.jpg',
    mapCoords: { x: 560, y: 215 },
    npc: {
      id: 'manolo',
      name: 'Manolo el Tabernero',
      role: 'Tabernero de guachinche tradicional',
      initialX: 72.0,
      lookText: "Manolo, tabernero dicharachero de delantal a cuadros, siempre con un jarro de vino tinto en la mano.",
      greeting: "¡Pasa pa' dentro, forastero! Carne de fiesta recién sacada del caldero y vino de cosecha propia.",
      hasShop: true,
      shopItem: {
        name: 'Comanda del Guachinche',
        price: 4,
        dialogueText: "Toma la comanda doblada con los apuntes de la ruta de la TF-24 para cruzar el mar de nubes."
      }
    },
    hotspots: [
      {
        id: 'hotspot-bodega-guachinche',
        name: 'Bodega de Barricas de Roble',
        title: 'Bodega de Barricas de Roble',
        type: 'scenery',
        leftPct: 6,
        topPct: 62,
        widthPct: 20,
        heightPct: 32,
        lookText: "Viejos toneles de vino de la comarca Tacoronte-Acentejo con olor a roble curado y uva listán negro."
      },
      {
        id: 'hotspot-mar-nubes-tf24',
        name: 'Mar de Nubes en el Valle (TF-24)',
        title: 'Mar de Nubes en el Valle (TF-24)',
        type: 'scenery',
        leftPct: 15,
        topPct: 34,
        widthPct: 30,
        heightPct: 28,
        lookText: "Impresionante alfombra blanca de niebla condensada por los vientos alisios a 1.200 metros sobre el valle."
      },
      {
        id: 'hotspot-guachinche-portal',
        name: 'Guachinche Elsa y Pizarra de Platos',
        title: 'Guachinche Elsa y Pizarra de Platos',
        type: 'scenery',
        leftPct: 68,
        topPct: 28,
        widthPct: 24,
        heightPct: 48,
        lookText: "Entrada del guachinche con la pizarra del día: papas arrugadas, mojo picón, queso asado y carne fiesta."
      }
    ]
  },
  {
    id: 'icod',
    name: 'Icod de los Vinos',
    zone: 'Norte',
    hudTitle: '🌳 ICOD DE LOS VINOS // DRAGO MILENARIO & PLAZA MAYOR',
    bgImage: '/assets/img/bg_icod.jpg',
    stampKey: 'icod_garachico',
    mapCoords: { x: 330, y: 255 },
    npc: {
      id: 'candido',
      name: 'Don Cándido el Bodeguero',
      role: 'Guardián del patrimonio botánico',
      initialX: 56.0,
      initialBottom: 7.0,
      lookText: "Don Cándido, elegante anciano de sombrero de paja y bastón de madroño.",
      greeting: "Frente a ti se yergue el ser vivo más anciano de la isla. Respeta su sombra milenaria."
    },
    hotspots: [
      {
        id: 'hotspot-drago-milenario',
        name: 'Drago Milenario de Icod',
        title: 'Drago Milenario de Icod',
        type: 'scenery',
        leftPct: 16,
        topPct: 10,
        widthPct: 38,
        heightPct: 62,
        lookText: "Monumento natural de más de 800 años y 16 metros de altura, símbolo vegetal sagrado de Canarias.",
        photoId: 6 // Foto #06 [MIRAR] (Pág. 12)
      },
      {
        id: 'hotspot-iglesia-san-marcos',
        name: 'Iglesia de San Marcos',
        title: 'Iglesia de San Marcos',
        type: 'scenery',
        leftPct: 58,
        topPct: 34,
        widthPct: 18,
        heightPct: 30,
        lookText: "Templo del siglo XVI con artesonado mudéjar y cruz monumental de plata mexicana."
      },
      {
        id: 'hotspot-teide-icod',
        name: 'Pico del Teide Nevado',
        title: 'Pico del Teide Nevado',
        type: 'scenery',
        leftPct: 63,
        topPct: 12,
        widthPct: 24,
        heightPct: 24,
        lookText: "La silueta nevada del Teide dominando el horizonte sobre los valles del norte."
      }
    ]
  },
  {
    id: 'garachico',
    name: 'Garachico',
    zone: 'Norte',
    hudTitle: '🌊 GARACHICO // EL CALETÓN & VILLA HISTÓRICA DE LAVA',
    bgImage: '/assets/img/bg_garachico.jpg',
    stampKey: 'icod_garachico',
    mapCoords: { x: 255, y: 255 },
    npc: {
      id: 'nieves',
      name: 'Doña Nieves',
      role: 'Cronista de la villa',
      initialX: 74.0,
      lookText: "Doña Nieves, vecina de la villa de Garachico tejiendo calados tradicionales de lino.",
      greeting: "El volcán de Trevejo sepultó nuestro puerto en 1706, pero de la roca negra renació esta joya.",
      photoIdOnLore: 8 // Faro de Punta de Teno (Pág. 14)
    },
    hotspots: [
      {
        id: 'hotspot-castillo-san-miguel',
        name: 'Castillo de San Miguel (1575)',
        title: 'Castillo de San Miguel (1575)',
        type: 'scenery',
        leftPct: 71,
        topPct: 22,
        widthPct: 18,
        heightPct: 42,
        lookText: "Torre defensiva cuadrangular de cantería oscura que sobrevivió intacta a la erupción de 1706.",
        photoId: 7 // Foto #07 [MIRAR] (Pág. 13)
      },
      {
        id: 'hotspot-caleton-piscinas',
        name: 'Piscinas Naturales de El Caletón',
        title: 'Piscinas Naturales de El Caletón',
        type: 'scenery',
        leftPct: 16,
        topPct: 46,
        widthPct: 34,
        heightPct: 28,
        lookText: "Piscinas naturales de agua salada esculpidas caprichosamente por la colada volcánica de 1706.",
        photoId: 9 // Foto #09 [MIRAR] (Pág. 12)
      },
      {
        id: 'hotspot-roque-garachico',
        name: 'Roque de Garachico',
        title: 'Roque de Garachico',
        type: 'scenery',
        leftPct: 19,
        topPct: 27,
        widthPct: 16,
        heightPct: 18,
        lookText: "Monumento natural y roque volcánico que emerge del océano frente a la antigua villa."
      },
      {
        id: 'hotspot-plaza-buenavista',
        name: 'Casco Histórico de Garachico',
        title: 'Casco Histórico de Garachico',
        type: 'scenery',
        leftPct: 48,
        topPct: 30,
        widthPct: 22,
        heightPct: 20,
        lookText: "Conjunto histórico-artístico de casonas e iglesias renacidas tras la catástrofe volcánica."
      }
    ]
  },
  {
    id: 'la_laguna',
    name: 'San Cristóbal de La Laguna',
    zone: 'Metropolitana',
    hudTitle: '🎓 LA LAGUNA // CIUDAD UNIVERSITARIA & PATRIMONIO UNESCO',
    bgImage: '/assets/img/bg_la_laguna.jpg',
    stampKey: 'la_laguna',
    mapCoords: { x: 655, y: 180 },
    npc: {
      id: 'herminia',
      name: 'Profesora Herminia',
      role: 'Historiadora de la Universidad de La Laguna',
      initialX: 75.0,
      lookText: "Herminia, profesora de historia de la Universidad ataviada con bufanda y cartera de cuero.",
      greeting: "La Laguna fue trazada sin murallas según la Carta Celeste de Platón en 1496. ¡Respira historia viva!",
      photoIdOnLore: 11 // Calles Coloniales (Pág. 4)
    },
    hotspots: [
      {
        id: 'hotspot-torre-concepcion',
        name: 'Torre de la Concepción',
        title: 'Torre de la Concepción',
        type: 'scenery',
        leftPct: 56,
        topPct: 7,
        widthPct: 12,
        heightPct: 42,
        lookText: "Campanario toscano de piedra vista de finales del siglo XVII que vigila el trazado colonial."
      },
      {
        id: 'hotspot-plaza-adelantado',
        name: 'Fuente de Mármol de Génova',
        title: 'Fuente de Mármol de Génova',
        type: 'scenery',
        leftPct: 56,
        topPct: 50,
        widthPct: 14,
        heightPct: 28,
        lookText: "Histórica fuente renacentista de mármol genovés que preside las plazas históricas laguneras.",
        photoId: 10 // Foto #10 [MIRAR] (Pág. 4)
      },
      {
        id: 'hotspot-palacio-colonial',
        name: 'Palacio y Balcón de Tea (UNESCO)',
        title: 'Palacio y Balcón de Tea (UNESCO)',
        type: 'scenery',
        leftPct: 18,
        topPct: 18,
        widthPct: 22,
        heightPct: 52,
        lookText: "Casona señorial del trazado colonial en cuadrícula del siglo XVI protegido por la UNESCO."
      }
    ]
  },
  {
    id: 'santa_cruz',
    name: 'Santa Cruz de Tenerife',
    zone: 'Metropolitana',
    hudTitle: '🚢 SANTA CRUZ // CAPITAL INSULAR & AUDITORIO DE TENERIFE',
    bgImage: '/assets/img/bg_santa_cruz.jpg',
    stampKey: 'santa_cruz',
    mapCoords: { x: 725, y: 240 },
    npc: {
      id: 'morales',
      name: 'Oficial Morales',
      role: 'Comisionado de la Autoridad Portuaria',
      initialX: 76.0,
      lookText: "Oficial Morales, uniforme naval de gala con galones y prismáticos de vigía marítimo.",
      greeting: "Bienvenido a la capital de la provincia. Por esta dársena entran las mercancías de tres continentes.",
      photoIdOnLore: 14 // Playa de Las Teresitas (Pág. 3)
    },
    hotspots: [
      {
        id: 'hotspot-auditorio-calatrava',
        name: 'Auditorio de Tenerife Adán Martín',
        title: 'Auditorio de Tenerife Adán Martín',
        type: 'scenery',
        leftPct: 33,
        topPct: 20,
        widthPct: 25,
        heightPct: 35,
        lookText: "Vanguardista ala de hormigón blanco brillante que parece despegar sobre las olas atlánticas.",
        photoId: 12 // Foto #12 [MIRAR] (Pág. 2)
      },
      {
        id: 'hotspot-plaza-espana-lago',
        name: 'Plaza de España y Lago Central',
        title: 'Plaza de España y Lago Central',
        type: 'scenery',
        leftPct: 68,
        topPct: 45,
        widthPct: 20,
        heightPct: 18,
        lookText: "Enorme lago de agua marina de los arquitectos Herzog & de Meuron con sus surtidores centrales.",
        photoId: 13 // Foto #13 [MIRAR] (Pág. 2)
      },
      {
        id: 'hotspot-puerto-cruceros',
        name: 'Puerto y Dársena de Cruceros',
        title: 'Puerto y Dársena de Cruceros',
        type: 'scenery',
        leftPct: 69,
        topPct: 28,
        widthPct: 24,
        heightPct: 18,
        lookText: "Gran dársena marítima de Santa Cruz donde atracan ferrys interinsulares y transatlánticos."
      },
      {
        id: 'hotspot-litoral-atlantico',
        name: 'Litoral Atlántico y Escollera',
        title: 'Litoral Atlántico y Escollera',
        type: 'scenery',
        leftPct: 8,
        topPct: 36,
        widthPct: 22,
        heightPct: 32,
        lookText: "Paseo marítimo sobre las aguas del Atlántico con noráis de amarre y escolleras de piedra."
      }
    ]
  },
  {
    id: 'anaga',
    name: 'Parque Rural de Anaga',
    zone: 'Metropolitana',
    hudTitle: '🌿 PARQUE RURAL DE ANAGA // BOSQUE DE LAURISILVA TERCIARIA',
    bgImage: '/assets/img/bg_anaga.jpg',
    stampKey: 'anaga',
    mapCoords: { x: 790, y: 135 },
    npc: {
      id: 'yeray',
      name: 'Guarda Forestal Yeray',
      role: 'Guarda de la Reserva de la Biosfera',
      initialX: 74.0,
      lookText: "Yeray, guarda forestal de verde monte con vara de acebiño y botas de montaña embarradas.",
      greeting: "Caminas por un fósil viviente de la era terciaria. Camina con sigilo entre los líquenes y helechos.",
      photoIdOnLore: 17 // Playa de Benijo (Pág. 8)
    },
    hotspots: [
      {
        id: 'hotspot-bosque-laurisilva',
        name: 'Túnel Verde de Laurisilva',
        title: 'Túnel Verde de Laurisilva',
        type: 'scenery',
        leftPct: 53,
        topPct: 20,
        widthPct: 24,
        heightPct: 44,
        lookText: "Espesa selva nublada donde laureles, viñátigos y musgos forman una bóveda mágica.",
        photoId: 15 // Foto #15 [MIRAR] (Pág. 5)
      },
      {
        id: 'hotspot-pico-ingles',
        name: 'Mirador y Crestas de Anaga',
        title: 'Mirador y Crestas de Anaga',
        type: 'scenery',
        leftPct: 18,
        topPct: 16,
        widthPct: 25,
        heightPct: 45,
        lookText: "Panorámica de los afilados roques y valles volcánicos del macizo de Anaga entre la niebla."
      },
      {
        id: 'hotspot-helechos-relictos',
        name: 'Helechos Gigantes Terciarios',
        title: 'Helechos Gigantes Terciarios',
        type: 'scenery',
        leftPct: 3,
        topPct: 58,
        widthPct: 22,
        heightPct: 32,
        lookText: "Frondosos helechos de monteverde que sobrevivieron a las glaciaciones en este refugio atlántico."
      }
    ]
  },
  {
    id: 'costa_adeje',
    name: 'Costa Adeje & Las Américas',
    zone: 'Sur',
    hudTitle: '🏖️ COSTA ADEJE // LITORAL DEL SUR & PARQUES ACUÁTICOS',
    bgImage: '/assets/img/bg_costa_adeje.jpg',
    stampKey: 'costa_adeje',
    mapCoords: { x: 290, y: 480 },
    npc: {
      id: 'socorrista',
      name: 'Ayoze el Socorrista',
      role: 'Vigilante costero de Playa de Troya',
      initialX: 76.0,
      lookText: "Ayoze, socorrista moreno con silbato y flotador torpedo rojo vigilando la orilla.",
      greeting: "¡Aló, forastero! El agua está a 22 grados y no hay corrientes peligrosas hoy. ¡A disfrutar del sur!",
      hasShop: true,
      shopItem: {
        name: 'Plátano de Canarias',
        price: 1,
        dialogueText: "¡Aquí tienes, forastero! Un plátano con bien de potasio para que no te dé una rampa nadando hacia La Gomera."
      },
      photoIdOnLore: 22 // Papagayo Beach Club (Pág. 18)
    },
    hotspots: [
      {
        id: 'hotspot-monkey-beach',
        name: 'Monkey Beach Club',
        title: 'Monkey Beach Club',
        type: 'scenery',
        leftPct: 63,
        topPct: 16,
        widthPct: 24,
        heightPct: 48,
        lookText: "Exclusiva terraza costera frente a la rompiente con su letrero de madera y vistas al atardecer.",
        photoId: 21 // Foto #21 [MIRAR] (Pág. 17)
      },
      {
        id: 'hotspot-playa-troya',
        name: 'Playa de Troya y Sombrillas',
        title: 'Playa de Troya y Sombrillas',
        type: 'scenery',
        leftPct: 40,
        topPct: 40,
        widthPct: 22,
        heightPct: 26,
        lookText: "Ensenada protegida de arena dorada con sombrillas y aguas tranquilas frente al canal de La Gomera.",
        photoId: 20 // Foto #20 [MIRAR] (Pág. 17)
      },
      {
        id: 'hotspot-paseo-maritimo',
        name: 'Paseo Marítimo de Las Américas',
        title: 'Paseo Marítimo de Las Américas',
        type: 'scenery',
        leftPct: 12,
        topPct: 42,
        widthPct: 26,
        heightPct: 34,
        lookText: "Avenida costera empedrada con balaustrada blanca y cocoteros tropicales que bordea la bahía."
      },
      {
        id: 'hotspot-siam-park',
        name: 'Siam Park — Templo del Agua',
        title: 'Siam Park — Templo del Agua',
        type: 'scenery',
        leftPct: 80,
        topPct: 8,
        widthPct: 18,
        heightPct: 25,
        lookText: "El reino tailandés acuático con la mayor ola artificial del mundo y toboganes gigantes.",
        photoId: 24 // Foto #24 [MIRAR] (Pág. 21)
      }
    ]
  },
  {
    id: 'masca',
    name: 'Los Gigantes & Masca',
    zone: 'Sur',
    hudTitle: '🧗 MASCA & LOS GIGANTES // ACANTILADOS BASÁLTICOS DE 600M',
    bgImage: '/assets/img/bg_masca.jpg',
    stampKey: 'los_gigantes_masca',
    mapCoords: { x: 205, y: 340 },
    npc: {
      id: 'tanausu',
      name: 'Tanausú el Guía de Montaña',
      role: 'Guía de senderismo del barranco',
      initialX: 74.0,
      lookText: "Tanausú, fornido montañero de barba cerrada con bastón de senderismo y mochila técnica.",
      greeting: "Estás ante la garganta más imponente del archipiélago. Antiguo refugio de piratas y aborígenes guanches.",
      photoIdOnLore: 19, // Barranco de Masca (Pág. 22)
      twinBrotherName: 'Yeray'
    },
    hotspots: [
      {
        id: 'hotspot-caserio-masca',
        name: 'Caserío Tradicional de Masca',
        title: 'Caserío Tradicional de Masca',
        type: 'scenery',
        leftPct: 51,
        topPct: 39,
        widthPct: 24,
        heightPct: 26,
        lookText: "Aldea tradicional canaria colgada inverosímilmente sobre las crestas volcánicas del abismo.",
        photoId: 18 // Foto #18 [MIRAR] (Pág. 22)
      },
      {
        id: 'hotspot-acantilados-gigantes',
        name: 'Barranco de Masca y Acantilados',
        title: 'Barranco de Masca y Acantilados',
        type: 'scenery',
        leftPct: 18,
        topPct: 20,
        widthPct: 28,
        heightPct: 46,
        lookText: "Colosales murallones de lava basáltica cayendo verticalmente 600 metros en caída libre hacia el océano.",
        photoId: 19 // Foto #19 [MIRAR] (Pág. 22)
      },
      {
        id: 'hotspot-sendero-piratas',
        name: 'Senda Empedrada de los Piratas',
        title: 'Senda Empedrada de los Piratas',
        type: 'scenery',
        leftPct: 22,
        topPct: 66,
        widthPct: 28,
        heightPct: 24,
        lookText: "Antiguo camino de herradura tallado en la roca volcánica que desciende por el cauce del barranco."
      }
    ]
  },
  {
    id: 'el_medano',
    name: 'El Médano & Montaña Roja',
    zone: 'Sur',
    hudTitle: '🪁 EL MÉDANO // MONTAÑA ROJA & CAPITAL DEL VIENTO',
    bgImage: '/assets/img/bg_el_medano.jpg',
    stampKey: 'el_medano_cristianos',
    mapCoords: { x: 565, y: 515 },
    npc: {
      id: 'frutero',
      name: 'El Frutero Canario',
      role: 'Vendedor ambulante de fruta local',
      initialX: 75.0,
      lookText: "Simpático frutero ambulante con visera de paja, ofreciendo frutas de las huertas del sur.",
      greeting: "¡Plátanos dulces con motitas recién cortados de la platanera, marchando para reponer fuerzas!",
      hasShop: true,
      shopItem: {
        name: 'Plátano de Canarias',
        price: 1,
        dialogueText: "Aquí tienes un plátano de Canarias bien rico y dulce. ¡Oro canario para el camino!"
      },
      photoIdOnLore: 23 // Playa del Camisón (Pág. 20)
    },
    hotspots: [
      {
        id: 'hotspot-montana-roja',
        name: 'Cono Volcánico de Montaña Roja',
        title: 'Cono Volcánico de Montaña Roja',
        type: 'scenery',
        leftPct: 60,
        topPct: 20,
        widthPct: 30,
        heightPct: 28,
        lookText: "Reserva natural especial formada por un cono de ceniza volcánica rojiza junto a la playa virgen de La Tejita.",
        photoId: 27 // Foto #27 [MIRAR] (Pág. 23)
      },
      {
        id: 'hotspot-ensenada-kitesurf',
        name: 'Bahía de El Médano y Kitesurf',
        title: 'Bahía de El Médano y Kitesurf',
        type: 'scenery',
        leftPct: 16,
        topPct: 34,
        widthPct: 38,
        heightPct: 30,
        lookText: "Meca mundial de windsurf y kitesurf con decenas de cometas de colores surcando los vientos alisios.",
        photoId: 26 // Foto #26 [MIRAR] (Pág. 23)
      },
      {
        id: 'hotspot-dunas-playa',
        name: 'Playa Natural y Dunas Fósiles',
        title: 'Playa Natural y Dunas Fósiles',
        type: 'scenery',
        leftPct: 46,
        topPct: 48,
        widthPct: 36,
        heightPct: 20,
        lookText: "Extensa playa natural de arena dorada moldeada constantemente por la brisa marina del sur."
      }
    ]
  },
  {
    id: 'las_canadas',
    name: 'Las Cañadas del Teide',
    zone: 'Cumbre',
    hudTitle: '🌋 LAS CAÑADAS DEL TEIDE // ROQUES DE GARCÍA (2.356m)',
    bgImage: '/assets/img/bg_las_canadas.jpg',
    mapCoords: { x: 470, y: 345 },
    npc: {
      id: 'operario',
      name: 'Operario del Teleférico',
      role: 'Responsable técnico de cabina',
      initialX: 74.0,
      lookText: "Operario con anorak térmico oficial del Parque Nacional y radio de comunicación de alta montaña.",
      greeting: "Base del teleférico a 2.356 metros. El viento en la cumbre permite el ascenso a La Rambleta.",
      hasShop: true,
      shopItem: {
        name: 'Billete del Teleférico',
        price: 5,
        dialogueText: "Billete troquelado para subir en cabina hasta La Rambleta a 3.555 metros. ¡Buen ascenso!"
      },
      twinBrotherName: 'el Oficial Morales'
    },
    hotspots: [
      {
        id: 'hotspot-roques-garcia',
        name: 'Roque Cinchado (Roques de García)',
        title: 'Roque Cinchado (Roques de García)',
        type: 'scenery',
        leftPct: 35,
        topPct: 26,
        widthPct: 9,
        heightPct: 22,
        lookText: "El famoso 'Árbol de Piedra' de los Roques de García, célebre silueta volcánica que presidía los billetes de mil pesetas.",
        photoId: 28 // Foto #28 [MIRAR] (Pág. 15)
      },
      {
        id: 'hotspot-teide-cumbre',
        name: 'Pico del Teide (3.718m)',
        title: 'Pico del Teide (3.718m)',
        type: 'scenery',
        leftPct: 56,
        topPct: 14,
        widthPct: 32,
        heightPct: 26,
        lookText: "El colosal estratovolcán Teide elevándose hacia el cielo sobre el altiplano de Las Cañadas."
      },
      {
        id: 'hotspot-tajinastes-rojos',
        name: 'Tajinastes Rojos de Las Cañadas',
        title: 'Tajinastes Rojos de Las Cañadas',
        type: 'scenery',
        leftPct: 8,
        topPct: 38,
        widthPct: 18,
        heightPct: 48,
        lookText: "Endemismo botánico espectacular de más de dos metros de altura que tiñe de rojo el paisaje volcánico."
      },
      {
        id: 'hotspot-estacion-teleferico',
        name: 'Estación Base del Teleférico (2.356m)',
        title: 'Estación Base del Teleférico (2.356m)',
        type: 'scenery',
        leftPct: 64,
        topPct: 43,
        widthPct: 14,
        heightPct: 14,
        lookText: "Edificio de piedra y punto de partida de las cabinas mecánicas hacia la cumbre del Teide."
      }
    ]
  },
  {
    id: 'pico_teide',
    name: 'Pico del Teide — 3.718m',
    zone: 'Cumbre',
    hudTitle: '✨ PICO DEL TEIDE // CUMBRE DE ESPAÑA (3.718m) & STARLIGHT',
    bgImage: '/assets/img/bg_pico_teide.jpg',
    stampKey: 'el_teide',
    mapCoords: { x: 440, y: 300 },
    npc: {
      id: 'guardian',
      name: 'Guardián del Teide',
      role: 'Sabio de la cumbre y astrónomo',
      initialX: 75.0,
      lookText: "El Guardián del Teide, con capa de lana y telescopio astronómico bajo un manto estelar infinito.",
      greeting: "¡Has coronado el techo de España, viajero! A tus pies se extienden las siete islas y sobre ti el universo entero.",
      twinBrotherName: 'Don Cándido'
    },
    hotspots: [
      {
        id: 'hotspot-telescopio-cumbre',
        name: 'Telescopio Astronómico en el Risco',
        title: 'Telescopio Astronómico en el Risco',
        type: 'scenery',
        leftPct: 44,
        topPct: 28,
        widthPct: 9,
        heightPct: 22,
        lookText: "Catalejo astronómico de latón orientado hacia los confines de la galaxia sobre el mar de nubes."
      },
      {
        id: 'hotspot-crater-teide',
        name: 'Cráter Somital y Fumarolas de Azufre',
        title: 'Cráter Somital y Fumarolas de Azufre',
        type: 'scenery',
        leftPct: 15,
        topPct: 42,
        widthPct: 28,
        heightPct: 34,
        lookText: "El cráter volcánico somital emite vapor sulfuroso blanco en el silencio absoluto de los 3.718 metros."
      },
      {
        id: 'hotspot-cielo-starlight',
        name: 'Bóveda Celeste Starlight (Vía Láctea)',
        title: 'Bóveda Celeste Starlight (Vía Láctea)',
        type: 'scenery',
        leftPct: 54,
        topPct: 5,
        widthPct: 36,
        heightPct: 38,
        lookText: "Uno de los cielos más puros del planeta para la observación astronómica: la Vía Láctea brilla con nitidez sobrecogedora."
      },
      {
        id: 'hotspot-mar-nubes-cumbre',
        name: 'Mar de Nubes Bajo la Cumbre',
        title: 'Mar de Nubes Bajo la Cumbre',
        type: 'scenery',
        leftPct: 55,
        topPct: 46,
        widthPct: 36,
        heightPct: 18,
        lookText: "Un denso océano blanco de nubes bajas que cubre Tenerife y aísla la cumbre bajo el cosmos."
      }
    ]
  }
];
