# Matriz Oficial de las 28 Fotografías del Álbum de Tenerife

Este documento define la asignación estricta de las 28 fotografías de `TENERIFE.pdf`, su método de desbloqueo (**`MIRAR`** en el escenario vs **`HABLAR`** con un NPC) y los elementos visuales que deben existir en cada una de las pantallas de la aventura gráfica.

---

## Reglas de Diseño del Sistema RAG Fotográfico

1. **Desbloqueo por `MIRAR` (Elemento Visual en Pantalla):**
   * El hito **debe estar presente visualmente** en el arte del escenario.
   * Al hacer `MIRAR [Hito]`, el motor genera un prompt interno al RAG: `"[RAG_QUERY] Información fotográfica y breve pie de foto de {hito} en {enclave}"`.
   * El Retriever devuelve el chunk con los metadatos de la foto y un **pie de foto fotográfico breve** (máximo 2 líneas).
   * La foto se añade automáticamente al Álbum de Fotos.

2. **Desbloqueo por `HABLAR` (Diálogo con NPC Lugareño):**
   * Son rincones ocultos, miradores o playas salvajes que no forman parte de la pantalla principal pero están descritos en `TENERIFE.pdf`.
   * El NPC los menciona durante la conversación (por opción de diálogo o pregunta libre).
   * El Retriever devuelve la foto asociada al secreto cultural revelado por el habitante.

3. **Geocercado Estricto (*Geofencing*):**
   * Solo se pueden desbloquear fotos del enclave actual.
   * **Caso Especial El Teide:** Aunque El Teide sea visible en el fondo de Puerto de la Cruz, las fotos de la cumbre y Parque Nacional solo se desbloquean al viajar físicamente a Las Cañadas del Teide.

---

## Tabla Maestra de las 28 Fotografías

| # | Título de la Foto | Enclave del Juego | Método de Desbloqueo | Gatillo en el Escenario / Diálogo | Pie de Foto Oficial (`TENERIFE.pdf`) |
| :-: | :--- | :--- | :-: | :--- | :--- |
| **01** | **Muelle y San Telmo** | Puerto de la Cruz | **MIRAR** | Fortín y faro al fondo del muelle | *Pág. 11: Batería y faro histórico de San Telmo (1780), erigidos para proteger el muelle pesquero.* |
| **02** | **Lago Martiánez** | Puerto de la Cruz | **HABLAR** | Paco habla sobre el ocio y la costa este | *Pág. 12: Complejo de piscinas de agua marina obra cumbre de César Manrique.* |
| **03** | **Liceo de Taoro y Jardines** | La Orotava | **MIRAR** | Palacete señorial en lo alto de la plaza | *Pág. 9: Jardines escalonados y señorial palacete del siglo XIX en el valle.* |
| **04** | **Playa de Los Patos** | La Orotava | **HABLAR** | Lugareño revela las calas vírgenes del norte | *Pág. 10: Espectacular playa salvaje de arena negra bajo imponentes acantilados.* |
| **05** | **Playa del Ancón** | La Orotava | **HABLAR** | Preguntar por corrientes y senderos costeros | *Pág. 10: Rincón virgen de fuerte oleaje con panorámica abierta al Atlántico.* |
| **06** | **Drago Milenario** | Icod de los Vinos | **MIRAR** | Ejemplar milenario en el centro de la escena | *Pág. 12: Monumento natural y símbolo vegetal sagrado de las Islas Canarias.* |
| **07** | **Casco y Plaza de Buenavista** | Isla Baja | **MIRAR** | Plaza de los Remedios y pastelería | *Pág. 13: Arquitectura tradicional señorial y dulces típicos en El Aderno.* |
| **08** | **Faro de Punta de Teno** | Isla Baja | **HABLAR** | Barquero habla del extremo occidental y la guagua 369 | *Pág. 14: Faro emblemático en el extremo más salvaje y aislado de la isla.* |
| **09** | **Piscinas de El Caletón** | Garachico | **MIRAR** | Pozas naturales de lava negra frente al mar | *Pág. 12: Piscinas naturales esculpidas por la erupción volcánica de 1706.* |
| **10** | **Plaza del Adelantado** | La Laguna | **MIRAR** | Plaza colonial y palacios históricos | *Pág. 4: Centro neurálgico de la primera ciudad universitaria de Canarias.* |
| **11** | **Calles Coloniales de La Laguna** | La Laguna | **HABLAR** | Historiador sobre el trazado urbanístico Patrimonio UNESCO | *Pág. 4: Trazado en cuadrícula de casas señoriales de los siglos XVI al XVIII.* |
| **12** | **Auditorio de Tenerife** | Santa Cruz | **MIRAR** | Silueta del auditorio de Calatrava | *Pág. 2: Vanguardista icono arquitectónico del Atlántico junto al puerto.* |
| **13** | **Plaza de España y Lago** | Santa Cruz | **MIRAR** | Lago central y edificios gubernamentales | *Pág. 2: Centro cívico de la capital insular frente a la marina.* |
| **14** | **Playa de Las Teresitas** | Santa Cruz | **HABLAR** | Taxista/guía sobre la playa dorada del norte | *Pág. 3: Célebre playa de arena dorada saharianas y palmeras canarias.* |
| **15** | **Bosque de Laurisilva** | Anaga | **MIRAR** | Frondoso sendero de helechos gigantes y niebla | *Pág. 5: Relicto vegetal del Terciario declarado Reserva de la Biosfera.* |
| **16** | **Pico del Inglés (Túnel Verde)** | Anaga | **HABLAR** | Guardabosques sobre el pasillo fotográfico excavado | *Pág. 6: Pasillo natural esculpido en roca volcánica y ramas entrelazadas.* |
| **17** | **Playa de Benijo al Atardecer** | Anaga | **HABLAR** | Pescador de Anaga sobre el mejor atardecer de la isla | *Pág. 8: Atardeceres volcánicos frente a los Roques de Anaga.* |
| **18** | **Caserío de Masca** | Masca | **MIRAR** | Aldea suspendida entre crestas volcánicas | *Pág. 22: Aldea tradicional guanche encaramada sobre un abismo vertical.* |
| **19** | **Barranco de Masca** | Masca | **HABLAR** | Senderista sobre el descenso al mar | *Pág. 22: Garganta colosal con murallas basálticas de más de 400 metros.* |
| **20** | **Playa de Troya** | Costa Adeje | **MIRAR** | Playa dorada y paseo marítimo | *Pág. 17: Enclave marítimo protegido en el epicentro turístico del sur.* |
| **21** | **Monkey Beach Club** | Costa Adeje | **MIRAR** | Terraza del club frente a la arena | *Pág. 17: Famoso club de ocio costero con vistas a La Gomera.* |
| **22** | **Papagayo Beach Club** | Las Américas | **HABLAR** | Joven local sobre el ocio nocturno y gastronómico | *Pág. 18: Galardonado club gastronómico y de ocio sobre el litoral.* |
| **23** | **Playa del Camisón** | Los Cristianos | **HABLAR** | Bañista sobre la ensenada tranquila del sur | *Pág. 20: Ensenada resguardada de arena rubia y aguas cristalinas.* |
| **24** | **Siam Park (Templo del Agua)** | Adeje | **MIRAR** | Arquitectura tailandesa y toboganes | *Pág. 21: El mejor parque acuático del mundo durante cinco años consecutivos.* |
| **25** | **Piscina de Olas de Siam Park** | Adeje | **HABLAR** | Socorrista sobre la ola de 4 metros | *Pág. 21: Récord mundial con la mayor ola artificial creada por el hombre.* |
| **26** | **El Médano y Deportes de Viento**| El Médano | **MIRAR** | Bahía con cometas de kitesurf y windsurf | *Pág. 23: Referente mundial de deportes acuáticos impulsados por los alisios.* |
| **27** | **Montaña Roja y La Tejita** | El Médano | **MIRAR** | Cono volcánico rojizo y playa natural | *Pág. 23: Espacio natural protegido junto a la mayor playa natural de la isla.* |
| **28** | **Roques de García y El Teide** | Las Cañadas | **MIRAR** | Roque Cinchado frente al cono del Teide (3.718m) | *Pág. 15: La estampa cumbre de España: volcán Teide y Llano de Ucanca.* |
