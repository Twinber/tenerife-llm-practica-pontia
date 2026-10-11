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
  npc?: {
    id: string;
    name: string;
    role: string;
    initialX: number;
    lookText: string;
    greeting: string;
    photoIdOnLore?: number; // Foto desbloqueable con [HABLAR / LORE]
    hasShop?: boolean;
    shopItem?: {
      name: string;
      price: number;
      dialogueText: string;
    };
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
    npc: {
      id: 'paco',
      name: 'Paco el Pescador',
      role: 'Patrón de pesca jubilado',
      initialX: 82.0,
      lookText: "Paco, un curtido pescador canario de pelo blanco y boina marinera. Fuma plácidamente en su pipa de tea.",
      greeting: "¡Hola, forastero! Bienvenido al Puerto de la Cruz. ¿Qué se te ofrece por el muelle?",
      photoIdOnLore: 2 // Lago Martiánez (Pág. 12)
    },
    hotspots: [
      {
        id: 'hotspot-faro',
        name: 'Faro y Fortín de San Telmo',
        title: 'Faro y Fortín de San Telmo',
        type: 'scenery',
        leftPct: 2,
        topPct: 40,
        widthPct: 14,
        heightPct: 22,
        lookText: "Batería y faro histórico de San Telmo (1780), erigidos para proteger el muelle pesquero de ataques corsarios.",
        photoId: 1 // Foto #01 [MIRAR] (Pág. 11)
      },
      {
        id: 'hotspot-barca',
        name: 'Barca "El Mojo"',
        title: 'Barca "El Mojo"',
        type: 'scenery',
        leftPct: 33,
        bottomPct: 25,
        widthPct: 18,
        heightPct: 16,
        lookText: 'La barca "El Mojo"... Embarcación tradicional de pesca artesanal del Puerto de la Cruz. Huele a madera curada y salitre.'
      },
      {
        id: 'hotspot-casa',
        name: 'Casa Colonial Balcón de Tea',
        title: 'Casa Colonial Balcón de Tea',
        type: 'scenery',
        leftPct: 64,
        topPct: 28,
        widthPct: 26,
        heightPct: 32,
        lookText: 'Casona señorial canaria del siglo XVII con mirador y balconada tallada en madera de tea de pino canario.'
      },
      {
        id: 'hotspot-teide',
        name: 'El Teide en la cumbre',
        title: 'El Teide en la cumbre',
        type: 'scenery',
        leftPct: 63,
        topPct: 5,
        widthPct: 23,
        heightPct: 28,
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
        name: 'Liceo de Taoro y Jardines',
        title: 'Liceo de Taoro y Jardines',
        type: 'scenery',
        leftPct: 10,
        topPct: 25,
        widthPct: 25,
        heightPct: 35,
        lookText: "Jardines escalonados y señorial palacete del siglo XIX presidiendo el Valle de Taoro.",
        photoId: 3 // Foto #03 [MIRAR] (Pág. 9)
      },
      {
        id: 'hotspot-molino-chano',
        name: 'Molino de Agua de Gofio',
        title: 'Molino de Agua de Gofio',
        type: 'scenery',
        leftPct: 40,
        topPct: 30,
        widthPct: 20,
        heightPct: 40,
        lookText: "Antiguo molino hidráulico de la Calle de la Carrera movido por la acequia del valle."
      },
      {
        id: 'hotspot-balcones-orotava',
        name: 'Casa de los Balcones',
        title: 'Casa de los Balcones',
        type: 'scenery',
        leftPct: 65,
        topPct: 20,
        widthPct: 25,
        heightPct: 45,
        lookText: "Joya de la arquitectura tradicional canaria de 1632 con patios interiores y celosías de tea."
      }
    ]
  },
  {
    id: 'santa_ursula',
    name: 'Santa Úrsula',
    zone: 'Norte',
    hudTitle: '🍷 SANTA ÚRSULA // GUACHINCHE & RUTA DEL MAR DE NUBES',
    bgImage: '/assets/img/bg_santa_ursula.jpg',
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
        leftPct: 15,
        topPct: 30,
        widthPct: 22,
        heightPct: 35,
        lookText: "Viejos toneles de vino de la comarca Tacoronte-Acentejo con olor a roble curado y uva listán negro."
      },
      {
        id: 'hotspot-mar-nubes-tf24',
        name: 'Mar de Nubes en la dorsal TF-24',
        title: 'Mar de Nubes en la dorsal TF-24',
        type: 'scenery',
        leftPct: 45,
        topPct: 15,
        widthPct: 35,
        heightPct: 30,
        lookText: "Impresionante alfombra blanca de niebla condensada por los vientos alisios a 1.200 metros."
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
    npc: {
      id: 'candido',
      name: 'Don Cándido el Bodeguero',
      role: 'Guardián del patrimonio botánico',
      initialX: 78.0,
      lookText: "Don Cándido, elegante anciano de sombrero de paja y bastón de madroño.",
      greeting: "Frente a ti se yergue el ser vivo más anciano de la isla. Respeta su sombra milenaria."
    },
    hotspots: [
      {
        id: 'hotspot-drago-milenario',
        name: 'Drago Milenario de Icod',
        title: 'Drago Milenario de Icod',
        type: 'scenery',
        leftPct: 25,
        topPct: 10,
        widthPct: 30,
        heightPct: 65,
        lookText: "Monumento natural de más de 800 años y 16 metros de altura, símbolo vegetal sagrado de Canarias.",
        photoId: 6 // Foto #06 [MIRAR] (Pág. 12)
      },
      {
        id: 'hotspot-iglesia-san-marcos',
        name: 'Iglesia de San Marcos',
        title: 'Iglesia de San Marcos',
        type: 'scenery',
        leftPct: 60,
        topPct: 20,
        widthPct: 22,
        heightPct: 45,
        lookText: "Templo del siglo XVI con artesonado mudéjar y cruz monumental de plata mexicana."
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
        id: 'hotspot-caleton-piscinas',
        name: 'Piscinas Naturales de El Caletón',
        title: 'Piscinas Naturales de El Caletón',
        type: 'scenery',
        leftPct: 12,
        bottomPct: 20,
        widthPct: 30,
        heightPct: 35,
        lookText: "Piscinas naturales de agua salada esculpidas caprichosamente por la colada volcánica de 1706.",
        photoId: 9 // Foto #09 [MIRAR] (Pág. 12)
      },
      {
        id: 'hotspot-castillo-san-miguel',
        name: 'Castillo de San Miguel',
        title: 'Castillo de San Miguel',
        type: 'scenery',
        leftPct: 50,
        topPct: 25,
        widthPct: 20,
        heightPct: 38,
        lookText: "Torre defensiva cuadrangular de cantería oscura que sobrevivió intacta a la erupción."
      },
      {
        id: 'hotspot-plaza-buenavista',
        name: 'Casco y Plaza de Buenavista',
        title: 'Casco y Plaza de Buenavista',
        type: 'scenery',
        leftPct: 72,
        topPct: 20,
        widthPct: 22,
        heightPct: 40,
        lookText: "Arquitectura señorial tradicional y dulcerías de repostería típica de la Isla Baja.",
        photoId: 7 // Foto #07 [MIRAR] (Pág. 13)
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
    npc: {
      id: 'profesora_laguna',
      name: 'Profesora Herminia',
      role: 'Historiadora de la Universidad de La Laguna',
      initialX: 75.0,
      lookText: "Herminia, profesora de historia de la Universidad ataviada con bufanda y cartera de cuero.",
      greeting: "La Laguna fue trazada sin murallas según la Carta Celeste de Platón en 1496. ¡Respira historia viva!",
      photoIdOnLore: 11 // Calles Coloniales (Pág. 4)
    },
    hotspots: [
      {
        id: 'hotspot-plaza-adelantado',
        name: 'Plaza del Adelantado',
        title: 'Plaza del Adelantado',
        type: 'scenery',
        leftPct: 15,
        topPct: 25,
        widthPct: 28,
        heightPct: 40,
        lookText: "Centro cívico e histórico presidido por la fuente de mármol de Génova y el Palacio de Nava.",
        photoId: 10 // Foto #10 [MIRAR] (Pág. 4)
      },
      {
        id: 'hotspot-torre-concepcion',
        name: 'Torre de la Concepción',
        title: 'Torre de la Concepción',
        type: 'scenery',
        leftPct: 52,
        topPct: 10,
        widthPct: 18,
        heightPct: 55,
        lookText: "Campanario toscano de piedra vista de finales del siglo XVII que vigila el trazado colonial."
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
    npc: {
      id: 'oficial_puerto',
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
        leftPct: 8,
        topPct: 20,
        widthPct: 28,
        heightPct: 45,
        lookText: "Vanguardista ala de hormigón blanco brillante que parece despegar sobre las olas atlánticas.",
        photoId: 12 // Foto #12 [MIRAR] (Pág. 2)
      },
      {
        id: 'hotspot-plaza-espana-lago',
        name: 'Plaza de España y Lago Central',
        title: 'Plaza de España y Lago Central',
        type: 'scenery',
        leftPct: 42,
        topPct: 25,
        widthPct: 30,
        heightPct: 40,
        lookText: "Enorme lago de agua marina de los arquitectos Herzog & de Meuron sobre el antiguo castillo de San Cristóbal.",
        photoId: 13 // Foto #13 [MIRAR] (Pág. 2)
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
    npc: {
      id: 'guarda_anaga',
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
        name: 'Sendero de Laurisilva de Anaga',
        title: 'Sendero de Laurisilva de Anaga',
        type: 'scenery',
        leftPct: 15,
        topPct: 15,
        widthPct: 32,
        heightPct: 55,
        lookText: "Espesa selva nublada de laureles, viñátigos y tilos envuelta en la bruma mágica de los alisios.",
        photoId: 15 // Foto #15 [MIRAR] (Pág. 5)
      },
      {
        id: 'hotspot-pico-ingles',
        name: 'Pico del Inglés y Túnel Verde',
        title: 'Pico del Inglés y Túnel Verde',
        type: 'scenery',
        leftPct: 55,
        topPct: 20,
        widthPct: 25,
        heightPct: 45,
        lookText: "Angosto pasadizo excavado en roca volcánica donde las copas de los árboles forman una bóveda perfecta."
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
    npc: {
      id: 'socorrista_adeje',
      name: 'Ayoze el Socorrista',
      role: 'Vigilante costero de Playa de Troya',
      initialX: 76.0,
      lookText: "Ayoze, socorrista moreno con silbato y flotador torpedo rojo vigilando la orilla.",
      greeting: "¡Aló, forastero! El agua está a 22 grados y no hay corrientes peligrosas hoy. ¡A disfrutar del sur!",
      photoIdOnLore: 22 // Papagayo Beach Club (Pág. 18)
    },
    hotspots: [
      {
        id: 'hotspot-playa-troya',
        name: 'Playa de Troya',
        title: 'Playa de Troya',
        type: 'scenery',
        leftPct: 8,
        bottomPct: 20,
        widthPct: 28,
        heightPct: 35,
        lookText: "Ensenada protegida de arena dorada y aguas tranquilas frente al canal de La Gomera.",
        photoId: 20 // Foto #20 [MIRAR] (Pág. 17)
      },
      {
        id: 'hotspot-monkey-beach',
        name: 'Monkey Beach Club',
        title: 'Monkey Beach Club',
        type: 'scenery',
        leftPct: 40,
        topPct: 30,
        widthPct: 22,
        heightPct: 35,
        lookText: "Exclusiva terraza costera frente a la rompiente con vistas panorámicas al atardecer sobre La Gomera.",
        photoId: 21 // Foto #21 [MIRAR] (Pág. 17)
      },
      {
        id: 'hotspot-siam-park',
        name: 'Siam Park — Templo del Agua',
        title: 'Siam Park — Templo del Agua',
        type: 'scenery',
        leftPct: 66,
        topPct: 15,
        widthPct: 26,
        heightPct: 50,
        lookText: "Templo oriental del galardonado mejor parque acuático del mundo, entre vegetación exótica.",
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
    npc: {
      id: 'guia_masca',
      name: 'Tanausú el Guía de Montaña',
      role: 'Guía de senderismo del barranco',
      initialX: 74.0,
      lookText: "Tanausú, fornido montañero de barba cerrada con bastón de senderismo y mochila técnica.",
      greeting: "Estás ante la garganta más imponente del archipiélago. Antiguo refugio de piratas y aborígenes guanches.",
      photoIdOnLore: 19 // Barranco de Masca (Pág. 22)
    },
    hotspots: [
      {
        id: 'hotspot-caserio-masca',
        name: 'Caserío de Masca',
        title: 'Caserío de Masca',
        type: 'scenery',
        leftPct: 15,
        topPct: 20,
        widthPct: 30,
        heightPct: 45,
        lookText: "Aldea tradicional canaria colgada inverosímilmente sobre las crestas volcánicas del abismo.",
        photoId: 18 // Foto #18 [MIRAR] (Pág. 22)
      },
      {
        id: 'hotspot-acantilados-gigantes',
        name: 'Murallas Basálticas de Los Gigantes',
        title: 'Murallas Basálticas de Los Gigantes',
        type: 'scenery',
        leftPct: 52,
        topPct: 15,
        widthPct: 35,
        heightPct: 55,
        lookText: "Colosales murallones de lava basáltica cayendo verticalmente 600 metros en caída libre al océano.",
        photoId: 19 // Foto #19 [MIRAR] (Pág. 22)
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
    npc: {
      id: 'frutero_sur',
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
        leftPct: 12,
        topPct: 25,
        widthPct: 30,
        heightPct: 40,
        lookText: "Reserva natural especial formada por un cono de ceniza volcánica rojiza junto a la playa virgen de La Tejita.",
        photoId: 27 // Foto #27 [MIRAR] (Pág. 23)
      },
      {
        id: 'hotspot-ensenada-kitesurf',
        name: 'Bahía de El Médano y Kitesurf',
        title: 'Bahía de El Médano y Kitesurf',
        type: 'scenery',
        leftPct: 48,
        topPct: 30,
        widthPct: 35,
        heightPct: 35,
        lookText: "Meca mundial de windsurf y kitesurf con decenas de cometas de colores surcando los vientos alisios.",
        photoId: 26 // Foto #26 [MIRAR] (Pág. 23)
      }
    ]
  },
  {
    id: 'las_canadas',
    name: 'Las Cañadas del Teide',
    zone: 'Cumbre',
    hudTitle: '🌋 LAS CAÑADAS DEL TEIDE // ROQUES DE GARCÍA (2.356m)',
    bgImage: '/assets/img/bg_las_canadas.jpg',
    npc: {
      id: 'taquillero_teide',
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
      }
    },
    hotspots: [
      {
        id: 'hotspot-roques-garcia',
        name: 'Roques de García y El Teide',
        title: 'Roques de García y El Teide',
        type: 'scenery',
        leftPct: 20,
        topPct: 10,
        widthPct: 40,
        heightPct: 65,
        lookText: "La estampa más célebre de España: el Roque Cinchado con la silueta nevada del Teide dominando el Llano de Ucanca.",
        photoId: 28 // Foto #28 [MIRAR] (Pág. 15)
      },
      {
        id: 'hotspot-estacion-teleferico',
        name: 'Estación Base del Teleférico',
        title: 'Estación Base del Teleférico',
        type: 'scenery',
        leftPct: 65,
        topPct: 30,
        widthPct: 25,
        heightPct: 40,
        lookText: "Estación de abordaje mecánico con cabinas rojas suspendidas por cables hacia la cumbre volcánica."
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
    npc: {
      id: 'guardian_cumbre',
      name: 'Guardián del Teide',
      role: 'Sabio de la cumbre y astrónomo',
      initialX: 75.0,
      lookText: "El Guardián del Teide, con capa de lana y telescopio astronómico bajo un manto estelar infinito.",
      greeting: "¡Has coronado el techo de España, viajero! A tus pies se extienden las siete islas y sobre ti el universo entero."
    },
    hotspots: [
      {
        id: 'hotspot-crater-teide',
        name: 'Cráter Somital del Teide',
        title: 'Cráter Somital del Teide',
        type: 'scenery',
        leftPct: 20,
        topPct: 20,
        widthPct: 35,
        heightPct: 45,
        lookText: "El cráter volcánico somital a 3.718 metros emite vapor sulfuroso blanco en el silencio absoluto de la altitud."
      },
      {
        id: 'hotspot-cielo-starlight',
        name: 'Bóveda Celeste Starlight',
        title: 'Bóveda Celeste Starlight',
        type: 'scenery',
        leftPct: 45,
        topPct: 5,
        widthPct: 45,
        heightPct: 35,
        lookText: "Uno de los cielos más puros del planeta para la observación astronómica: la Vía Láctea brilla con nitidez sobrecogedora."
      }
    ]
  }
];
