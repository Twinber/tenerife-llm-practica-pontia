// ==============================================================================
// APPLICATION: Orquestador de Acciones SCUMM (Verbos, Hotspots e Inventario)
// ==============================================================================
import { VerbType } from '../domain/types';
import { Actor } from '../domain/Actor';
import { DialogueManager } from './DialogueManager';
import { AudioService } from '../infrastructure/AudioService';
import type { PhotoAlbumModal } from '../presentation/PhotoAlbumModal';
import type { PassportModal } from '../presentation/PassportModal';

export class ActionDispatcher {
  public activeVerb: VerbType = 'HABLAR';
  public selectedItemName: string | null = null;
  public hoverTargetName: string = '';

  private twinber: Actor;
  private paco: Actor;
  private dialogueManager: DialogueManager;
  private audioService: AudioService;
  public photoAlbumModal?: PhotoAlbumModal;
  public passportModal?: PassportModal;
  public onSentenceChange?: (text: string) => void;
  public onLogMessage?: (msg: string) => void;
  public teidePhotoTaken: boolean = false;
  public pacoStampGiven: boolean = false;
  public isInNpcDialogue: boolean = false;
  public isDialogueSpeaking: boolean = false;
  public currentDialogueNpc: string | null = null;
  public pendingDialogueExit: boolean = false;
  public stampedZones: Set<string> = new Set();
  public coins: number = 15;
  public bananaCount: number = 0;

  public onDialogueModeChange?: (active: boolean, npcName?: string) => void;
  public onDialogueSpeechState?: (isSpeaking: boolean) => void;
  public onStateUpdate?: (updates: { photos?: string; passport?: string; coins?: number; bananas?: number }) => void;

  constructor(
    twinber: Actor,
    paco: Actor,
    dialogueManager: DialogueManager,
    audioService: AudioService
  ) {
    this.twinber = twinber;
    this.paco = paco;
    this.dialogueManager = dialogueManager;
    this.audioService = audioService;

    this.dialogueManager.onDialogueFinished = () => {
      this.handleDialogueFinished();
    };
  }

  public setVerb(verb: VerbType): void {
    this.activeVerb = verb;
    this.audioService.playClick();

    if (verb === 'PENSAR') {
      this.triggerThinking();
    } else if (verb === 'VIAJAR') {
      this.triggerTravel();
    }
    this.updateSentence();
  }

  public selectItem(itemName: string): void {
    if (this.activeVerb === 'MIRAR') {
      if (itemName === 'Álbum de Fotos' && this.photoAlbumModal) {
        this.photoAlbumModal.open();
        return;
      }
      if (itemName === 'Pasaporte de Explorador') {
        if (this.passportModal) {
          this.passportModal.open();
          return;
        }
        const count = this.stampedZones.size;
        const list = count > 0 ? Array.from(this.stampedZones).join(', ') : 'Ninguno todavía';
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: `Twinber [PASAPORTE]: 'Pasaporte de Explorador (${count}/10 sellos oficiales). Sellos estampados: ${list}.'` }
        ]);
        return;
      }
      if (itemName === 'Mapa de Tenerife') {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber [MAPA DE TENERIFE]: 'Mapa topográfico y de carreteras insulares. Muestra las rutas a La Orotava, Teide y el sur insular.'" },
          { speaker: 'twinber', text: "Twinber: '¡Haz clic sobre el mapa para activar el modo [VIAJAR] por Tenerife!'" }
        ]);
        return;
      }
      if (itemName === 'Bolsa de Monedas de Oro') {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: `Twinber [MONEDAS]: 'Tengo ${this.coins} monedas de oro en mi riñonera. Suficientes para comprar provisiones, recuerdos y billetes.'` }
        ]);
        return;
      }
    }

    if (this.selectedItemName === itemName) {
      this.selectedItemName = null;
      this.activeVerb = 'MIRAR';
    } else {
      this.selectedItemName = itemName;
      this.activeVerb = 'USAR';
      this.audioService.playCoin();
    }
    this.updateSentence();
  }

  public inspectLockedItem(itemName: string): void {
    this.dialogueManager.clear();
    this.audioService.playHint();
    if (itemName === 'Saco de Gofio') {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber [SACO DE GOFIO - 3 💰]: 'Harina tostada de trigo y millo tradicional canario. Podré comprar un saco a Chano en el antiguo molino de La Orotava.'" }
      ]);
    } else if (itemName === 'Comanda del Guachinche') {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber [COMANDA DE GUACHINCHE - 4 💰]: 'Comanda con anotaciones de papas arrugadas, vino del país y rutas. Manolo la despacha en su tasca de Santa Úrsula.'" }
      ]);
    } else if (itemName === 'Billete del Teleférico') {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber [BILLETE DEL TELEFÉRICO - 5 💰]: 'Ticket oficial para ascender a La Rambleta (3.555 m). Se adquiere en la taquilla de Las Cañadas del Teide.'" }
      ]);
    } else if (itemName === 'Plátano de Canarias') {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: `Twinber [🍌 PLÁTANO DE CANARIAS - 1 💰]: '¡El auténtico plátano con motitas! Es un meme puro: no resuelve ningún acertijo, pero qué rico está. Llevo ${this.bananaCount}/3.'` }
      ]);
    }
  }

  public setHoverTarget(target: string): void {
    this.hoverTargetName = target;
    this.updateSentence();
  }

  public clickGround(targetX: number): void {
    if (this.dialogueManager.currentLine) {
      this.dialogueManager.advanceOrSkip();
      return;
    }
    if (this.isInNpcDialogue) {
      this.endNpcDialogue();
    }
    this.twinber.moveTo(targetX);
    this.setHoverTarget('el muelle...');
    if (this.onLogMessage) this.onLogMessage(`Twinber camina hacia X: ${targetX.toFixed(1)}%`);
  }

  public interactWithHotspot(hotspotId: string, _hotspotName: string = ''): void {
    if (this.dialogueManager.currentLine) {
      this.dialogueManager.advanceOrSkip();
      return;
    }

    switch (this.activeVerb) {
      case 'HABLAR':
        this.handleTalk(hotspotId);
        break;
      case 'MIRAR':
        this.handleLook(hotspotId);
        break;
      case 'COMPRAR':
        this.handleBuy(hotspotId);
        break;
      case 'USAR':
        this.handleUse(hotspotId);
        break;
      case 'VIAJAR':
        this.triggerTravel();
        break;
      case 'PENSAR':
        this.triggerThinking();
        break;
    }
  }

  private handleTalk(hotspotId: string): void {
    if (hotspotId === 'hotspot-paco' || hotspotId === 'paco-actor') {
      this.talkToPaco();
    } else if (hotspotId === 'hotspot-teide') {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: '¡Hola, imponente señor Teide!... Solo me responde el murmullo de los vientos alisios.'" }
      ]);
    } else if (hotspotId === 'hotspot-barca') {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'No creo que una barca de pesca vacía tenga mucho que contarme.'" }
      ]);
    } else if (hotspotId === 'hotspot-casa') {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'El balcón de tea está en silencio. Nadie responde a mis saludos.'" }
      ]);
    } else if (hotspotId === 'hotspot-faro') {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'El farero de San Telmo debe de estar descansando de la guardia nocturna.'" }
      ]);
    }
  }

  private handleLook(hotspotId: string): void {
    if (hotspotId === 'hotspot-paco' || hotspotId === 'paco-actor') {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'Paco, un curtido pescador canario de pelo blanco y boina marinera. Fuma plácidamente en su pipa de madera de tea.'" }
      ]);
    } else if (hotspotId === 'hotspot-teide') {
      // GEOFENCING: En Puerto de la Cruz solo se divisa a lo lejos; la foto de cumbre requiere estar en Las Cañadas
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'El volcán Teide se divisa a lo lejos sobre las nubes a 3.718 metros. Para capturar la foto oficial de la cumbre tendré que viajar al Parque Nacional de Las Cañadas.'" }
      ]);
      if (this.onLogMessage) this.onLogMessage("[RAG GEOFENCING] Foto del Teide restringida a la zona 'Las Cañadas'. No desbloqueada desde el puerto.");
    } else if (hotspotId === 'hotspot-barca') {
      this.twinber.moveTo(35, () => {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber: 'La barca \"El Mojo\"... Embarcación tradicional de pesca artesanal del Puerto de la Cruz. Huele a madera curada y salitre.'" }
        ]);
      });
    } else if (hotspotId === 'hotspot-casa') {
      this.twinber.moveTo(60, () => {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber: 'Casona señorial canaria del siglo XVII con mirador y balconada tallada en madera de tea de pino canario.'" }
        ]);
      });
    } else if (hotspotId === 'hotspot-faro') {
      // MIRAR DESBLOQUEA FOTO #01 VÍA METADATOS RAG
      const leftEdge = this.twinber.minX ?? 18;
      this.twinber.moveTo(leftEdge, () => {
        this.twinber.facing = -1;
        this.audioService.playHint();

        if (this.photoAlbumModal) {
          const isNew = this.photoAlbumModal.unlockPhoto(1);
          const count = this.photoAlbumModal.getUnlockedCount();
          if (this.onStateUpdate) this.onStateUpdate({ photos: `${count}/28` });
          if (isNew && this.onLogMessage) {
            this.onLogMessage("[RAG RETRIEVAL] Query: 'Faro y fortín de San Telmo' -> Match: photo_id=01 (pág. 11 TENERIFE.pdf) -> Desbloqueada en Álbum");
          }
        }

        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber [RAG // Pág. 11]: 'Batería y faro histórico de San Telmo (1780), erigidos para proteger el muelle pesquero.'" },
          { speaker: 'twinber', text: "Twinber: '¡Foto #01 agregada a mi Álbum de Recuerdos! Usa [MIRAR] sobre el Álbum para verla a tamaño completo.'" }
        ]);
      });
    }
  }

  private handleBuy(hotspotId: string): void {
    if (hotspotId === 'hotspot-paco' || hotspotId === 'paco-actor') {
      const nearPaco = Math.min(72, this.twinber.maxX ?? 72);
      this.twinber.moveTo(nearPaco, () => {
        this.twinber.facing = 1;
        this.paco.facing = -1;
        this.dialogueManager.enqueue([
          { speaker: 'paco', text: "Paco [COMPRAR]: '¡Chacho, yo hoy no vendo pescado en el muelle! Pero si buscas buen gofio recién molido o comanda de papas, sube al molino en La Orotava.'" },
          { speaker: 'twinber', text: "Twinber: '¡Anotado! Guardaré mis 15 monedas de oro para cuando llegue a los comercios de La Orotava.'" }
        ]);
      });
    } else if (hotspotId === 'hotspot-teide') {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: '¡El Teide no está en venta! Es Parque Nacional protegido y Patrimonio de la Humanidad.'" }
      ]);
    } else if (hotspotId === 'hotspot-barca') {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'Mis 15 monedas no me alcanzan para comprar un barco de pesca artesanal.'" }
      ]);
    } else {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'Eso no está en venta ni tiene dueño a la vista.'" }
      ]);
    }
  }

  private handleUse(hotspotId: string): void {
    if (!this.selectedItemName) {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'Primero debería seleccionar qué objeto de mi riñonera quiero usar.'" }
      ]);
      return;
    }

    if (this.selectedItemName === 'Álbum de Fotos') {
      if (hotspotId === 'hotspot-teide') {
        this.audioService.playHint();
        this.teidePhotoTaken = true;
        if (this.photoAlbumModal) {
          this.photoAlbumModal.unlockPhoto(15);
          const count = this.photoAlbumModal.getUnlockedCount();
          if (this.onStateUpdate) this.onStateUpdate({ photos: `${count}/28` });
        }
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber [📸 CÁMARA 35mm]: '¡CLICK! He sacado una hermosa foto panorámica de El Teide sobre el muelle. ¡Registrada en el Álbum (Foto #15)!' " },
          { speaker: 'twinber', text: "Twinber: 'Usa el verbo [MIRAR] sobre el Álbum de Fotos para contemplar tus recuerdos.'" }
        ]);
      } else if (hotspotId === 'hotspot-faro') {
        this.audioService.playHint();
        if (this.photoAlbumModal) {
          this.photoAlbumModal.unlockPhoto(1);
          const count = this.photoAlbumModal.getUnlockedCount();
          if (this.onStateUpdate) this.onStateUpdate({ photos: `${count}/28` });
        }
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber [📸 CÁMARA 35mm]: '¡CLICK! Foto del histórico fortín de San Telmo y el puerto guardada en el Álbum (Foto #01).'" }
        ]);
      } else if (hotspotId === 'hotspot-paco' || hotspotId === 'paco-actor') {
        this.audioService.playHint();
        this.dialogueManager.enqueue([
          { speaker: 'paco', text: "Paco: '¡Sácame bien gallardo con la pipa y la boina marinera, mi niño!' " },
          { speaker: 'twinber', text: "Twinber: '¡Foto de Paco capturada para el recuerdo de Tenerife!'" }
        ]);
      } else {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber: 'Una bonita toma, pero debo guardar carrete para los monumentos oficiales del Álbum.'" }
        ]);
      }
    } else if (this.selectedItemName === 'Pasaporte de Explorador') {
      if (hotspotId === 'hotspot-paco' || hotspotId === 'paco-actor') {
        this.audioService.playCoin();
        this.pacoStampGiven = true;
        if (this.onStateUpdate) this.onStateUpdate({ passport: '1/10' });
        this.dialogueManager.enqueue([
          { speaker: 'paco', text: "Paco: '¡Acércame ese cuaderno de viaje! Te pongo el primer sello oficial: [Sello: Puerto de la Cruz - Muelle Pesquero].'" },
          { speaker: 'twinber', text: "Twinber: '¡Fantástico! Ya tengo 1 de los 10 sellos para explorar la isla.'" }
        ]);
      } else {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber: 'Solo los lugareños o autoridades pueden estampar un sello oficial en mi pasaporte.'" }
        ]);
      }
    } else if (this.selectedItemName === 'Bolsa de Monedas de Oro') {
      if (hotspotId === 'hotspot-paco' || hotspotId === 'paco-actor') {
        this.dialogueManager.enqueue([
          { speaker: 'paco', text: "Paco: '¡Guarda tus perras, muchacho! Las vas a necesitar para pagar el saco de gofio o el teleférico.'" }
        ]);
      } else {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber: 'No tiene sentido arrojar mis monedas de oro ahí.'" }
        ]);
      }
    } else if (this.selectedItemName === 'Mapa de Tenerife') {
      if (hotspotId === 'hotspot-teide') {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber [MAPA]: 'El mapa traza la carretera TF-21 que sube desde La Orotava directo hasta Las Cañadas del Teide.'" }
        ]);
      } else if (hotspotId === 'hotspot-faro') {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber [MAPA]: 'El Fortín de San Telmo figura como punto de vigía costero en la carta de navegación.'" }
        ]);
      } else if (hotspotId === 'hotspot-paco' || hotspotId === 'paco-actor') {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber: 'Le muestro el mapa a Paco.'" },
          { speaker: 'paco', text: "Paco: '¡Buen mapa, chacho! Primero sella aquí en el Puerto y luego sigue la ruta hacia el Valle.'" }
        ]);
      } else {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber [MAPA]: 'Consulto las carreteras insulares. Usa el verbo [VIAJAR] para desplazarte por la isla.'" }
        ]);
      }
    }
  }

  public talkToPaco(): void {
    if (this.isInNpcDialogue) return;
    this.startNpcDialogue('paco', 'Paco el Pescador');
  }

  public startNpcDialogue(_npcId: string, npcName: string): void {
    const nearNpcX = Math.min(72, this.twinber.maxX ?? 72);
    this.twinber.moveTo(nearNpcX, () => {
      this.twinber.facing = 1;
      this.paco.facing = -1;

      this.isInNpcDialogue = true;
      this.isDialogueSpeaking = true;
      this.currentDialogueNpc = npcName;
      this.pendingDialogueExit = false;

      if (this.onDialogueModeChange) {
        this.onDialogueModeChange(true, npcName);
      }
      this.updateSentence();

      // Saludo inicial breve antes de desplegar las opciones
      this.dialogueManager.enqueue([
        { speaker: 'paco', text: "Paco: '¡Hola, forastero! Bienvenido al Puerto de la Cruz. ¿Qué se te ofrece por el muelle?'" }
      ]);
    });
  }

  public endNpcDialogue(): void {
    this.isInNpcDialogue = false;
    this.isDialogueSpeaking = false;
    this.currentDialogueNpc = null;
    this.pendingDialogueExit = false;

    if (this.onDialogueModeChange) {
      this.onDialogueModeChange(false);
    }
    this.updateSentence();
  }

  public selectDialogueChoice(choice: 'passport' | 'lore' | 'custom' | 'exit', customText?: string): void {
    if (!this.isInNpcDialogue) return;
    this.isDialogueSpeaking = true;
    if (this.onDialogueSpeechState) this.onDialogueSpeechState(true);
    this.updateSentence();

    switch (choice) {
      case 'passport':
        this.handlePassportChoice();
        break;
      case 'lore':
        this.handleLoreChoice();
        break;
      case 'custom':
        this.handleCustomChoice(customText || '');
        break;
      case 'exit':
        this.handleExitChoice();
        break;
    }
  }

  private handlePassportChoice(): void {
    const hasStamp = this.stampedZones.has('Puerto de la Cruz');
    if (!hasStamp) {
      this.stampedZones.add('Puerto de la Cruz');
      if (this.passportModal) {
        this.passportModal.unlockStamp('puerto_cruz');
      }
      this.audioService.playCoin();
      if (this.onStateUpdate) {
        this.onStateUpdate({ passport: `${this.stampedZones.size}/10` });
      }
      if (this.onLogMessage) {
        this.onLogMessage(`[PASAPORTE] Sello añadido: 'Puerto de la Cruz' (${this.stampedZones.size}/10 sellos oficiales)`);
      }
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: '¿Podría sellarme el pasaporte de explorador?'" },
        { speaker: 'paco', text: "Paco: '¡Faltaría más, mi niño! Te estampo el sello del Puerto de la Cruz en tu pasaporte. ¡Ya tienes el primero de los 10 sellos de la isla!'" }
      ]);
    } else {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: '¿Podría sellarme el pasaporte?'" },
        { speaker: 'paco', text: "Paco: '¡Chacho, si ya tienes bien sellado el Puerto de la Cruz! Ahora te toca buscar los sellos de La Orotava, Icod o el Teide.'" }
      ]);
    }
  }

  private handleLoreChoice(): void {
    if (this.onLogMessage) {
      this.onLogMessage("[RAG RETRIEVAL // ZONA] Query: 'Qué me puede contar de Puerto de la Cruz' -> Match: TENERIFE.pdf (Pág. 12)");
    }

    let isNewPhoto = false;
    if (this.photoAlbumModal) {
      isNewPhoto = this.photoAlbumModal.unlockPhoto(2);
      const count = this.photoAlbumModal.getUnlockedCount();
      if (this.onStateUpdate) this.onStateUpdate({ photos: `${count}/28` });
      if (isNewPhoto) {
        this.audioService.playHint();
        if (this.onLogMessage) {
          this.onLogMessage("[RAG METADATA] photo_id=02 'Lago Martiánez' desbloqueada en el Álbum.");
        }
      }
    }

    if (isNewPhoto) {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: '¿Qué me puede contar de esta zona, señor Paco?'" },
        { speaker: 'paco', text: "Paco: '¡Chacho, el Puerto es historia viva! Aquí al lado tienes este muelle pesquero y el histórico fortín de San Telmo que nos protegía de corsarios.'" },
        { speaker: 'paco', text: "Paco [RAG // Pág. 12]: 'Y si caminas por el paseo costero verás el Lago Martiánez: unas piscinas de agua marina ideadas por César Manrique entre roca volcánica. ¡Te he guardado una foto en tu Álbum!'" }
      ]);
    } else {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: '¿Qué más me puede contar de la zona?'" },
        { speaker: 'paco', text: "Paco: 'Pues que en el barrio marinero de La Ranilla se come el mejor pescado recién faenado con papas arrugadas y mojo. ¡Y en días despejados el Teide parece rozar el cielo!'" }
      ]);
    }
  }

  private handleCustomChoice(userText: string): void {
    if (this.onLogMessage) {
      this.onLogMessage(`[PROMPT ABIERTO AL LLM] Twinber: "${userText}"`);
    }

    const lower = userText.toLowerCase();
    let reply = "Paco: '¡Chacho, qué buena pregunta! Como viejo lobo de mar te digo: en Tenerife cada rincón guarda una leyenda. ¡Sigue explorando la isla, mi niño!'";

    if (lower.includes('gofio') || lower.includes('comer') || lower.includes('molino') || lower.includes('comida') || lower.includes('papas') || lower.includes('mojo')) {
      reply = "Paco: '¡Chacho, para buen comer pide unas papas arrugadas con mojo picón y sube a La Orotava al Molino de Chano por un buen gofio amasado!'";
    } else if (lower.includes('teide') || lower.includes('volcan') || lower.includes('volcán') || lower.includes('cumbre') || lower.includes('subir') || lower.includes('pico')) {
      reply = "Paco: 'El padre Teide vigila a 3.718 metros. Para subir tendrás que tomar una guagua a Las Cañadas y luego subir en el teleférico.'";
    } else if (lower.includes('barco') || lower.includes('barca') || lower.includes('pesca') || lower.includes('pescar') || lower.includes('mar')) {
      reply = "Paco: 'Esa barquita es \"El Mojo\". Llevo 40 años saliendo al alba a faenar viejas y sargos en estas aguas atlánticas.'";
    } else if (lower.includes('tiempo') || lower.includes('clima') || lower.includes('alisios') || lower.includes('calima') || lower.includes('viento') || lower.includes('llover') || lower.includes('sol')) {
      reply = "Paco: 'Hoy los vientos alisios soplan frescos del norte y el mar está en calma chicha. ¡Solo vigila si asoma calima del desierto!'";
    } else if (lower.includes('dinero') || lower.includes('monedas') || lower.includes('perras') || lower.includes('comprar') || lower.includes('oro')) {
      reply = "Paco: '¡Cuida bien tus 15 monedas! Te harán falta para comprar provisiones o pagar tu billete de transporte.'";
    } else if (lower.includes('hola') || lower.includes('buenos dias') || lower.includes('buenas') || lower.includes('saludos')) {
      reply = "Paco: '¡Muy buenas, muchacho! Siempre da alegría ver visitantes con ganas de empaparse de nuestra tierra.'";
    } else if (lower.includes('quien eres') || lower.includes('quién eres') || lower.includes('llamas') || lower.includes('nombre')) {
      reply = "Paco: 'Soy Paco, patrón de pesca jubilado y el marinero más veterano de este muelle del Puerto de la Cruz.'";
    }

    this.dialogueManager.enqueue([
      { speaker: 'twinber', text: `Twinber: '${userText}'` },
      { speaker: 'paco', text: reply }
    ]);
  }

  private handleExitChoice(): void {
    this.pendingDialogueExit = true;
    this.dialogueManager.enqueue([
      { speaker: 'twinber', text: "Twinber: 'Tengo que marcharme. ¡Hasta luego, Paco!'" },
      { speaker: 'paco', text: "Paco: '¡Que los alisios te sean favorables, muchacho! Pásate por el muelle cuando quieras.'" }
    ]);
  }

  private handleDialogueFinished(): void {
    if (this.pendingDialogueExit) {
      this.endNpcDialogue();
      return;
    }
    if (this.isInNpcDialogue) {
      this.isDialogueSpeaking = false;
      if (this.onDialogueSpeechState) {
        this.onDialogueSpeechState(false);
      }
      this.updateSentence();
    }
  }

  public triggerThinking(): void {
    this.audioService.playHint();
    this.dialogueManager.enqueue([
      { speaker: 'twinber', text: "Twinber [💡 PENSAR]: 'Llevo 15 monedas en la riñonera y mi pasaporte en blanco. Debería charlar con este viejo pescador o usar mi cámara de 35mm.'" }
    ]);
  }

  public triggerTravel(): void {
    this.audioService.playClick();
    this.dialogueManager.enqueue([
      { speaker: 'twinber', text: "Twinber [VIAJAR]: 'Para viajar a La Orotava o al Sur de Tenerife en guagua, primero necesito el sello de Puerto de la Cruz en mi pasaporte.'" }
    ]);
  }

  private updateSentence(): void {
    if (this.isInNpcDialogue) {
      const npc = this.currentDialogueNpc || 'Paco el Pescador';
      const text = this.isDialogueSpeaking
        ? `${npc} está hablando...`
        : `Conversando con ${npc} [ESC para terminar]`;
      if (this.onSentenceChange) this.onSentenceChange(text);
      return;
    }

    let text = '';
    const target = this.hoverTargetName;

    switch (this.activeVerb) {
      case 'HABLAR':
        text = target ? `Hablar con ${target}` : 'Hablar con...';
        break;
      case 'MIRAR':
        text = target ? `Mirar ${target}` : 'Mirar...';
        break;
      case 'COMPRAR':
        text = target ? `Comprar a ${target}` : 'Comprar...';
        break;
      case 'VIAJAR':
        text = target ? `Viajar hacia ${target}` : 'Viajar por Tenerife...';
        break;
      case 'USAR':
        if (this.selectedItemName) {
          text = target ? `Usar ${this.selectedItemName} con ${target}` : `Usar ${this.selectedItemName} con...`;
        } else {
          text = target ? `Usar objeto con ${target}` : 'Usar...';
        }
        break;
      case 'PENSAR':
        text = '💡 Pensar en la misión...';
        break;
      default:
        text = target || '...';
    }
    if (this.onSentenceChange) this.onSentenceChange(text);
  }
}

