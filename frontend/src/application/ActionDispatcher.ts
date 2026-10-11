// ==============================================================================
// APPLICATION: Orquestador de Acciones SCUMM (Verbos, Hotspots e Inventario)
// ==============================================================================
import { VerbType } from '../domain/types';
import { Actor } from '../domain/Actor';
import { DialogueManager } from './DialogueManager';
import { AudioService } from '../infrastructure/AudioService';
import type { PhotoAlbumModal } from '../presentation/PhotoAlbumModal';
import type { PassportModal } from '../presentation/PassportModal';
import { LOCATIONS_CATALOG, LocationSceneDef, HotspotLocationDef } from '../domain/locationsData';
import type { ViewportView } from '../presentation/ViewportView';

export class ActionDispatcher {
  public activeVerb: VerbType = 'HABLAR';
  public selectedItemName: string | null = null;
  public hoverTargetName: string = '';
  public hoverTargetType: 'npc' | 'scenery' | 'item' | 'ground' = 'ground';

  public currentLocation: LocationSceneDef = LOCATIONS_CATALOG[0];
  public viewportView?: ViewportView;

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
  public acquiredItems: Array<{ name: string; icon: string; count?: number }> = [];
  public purchasedFromNpcs: Set<string> = new Set();

  public onDialogueModeChange?: (active: boolean, npcName?: string, shopItem?: { name: string; price: number }, twinBrotherName?: string) => void;
  public onDialogueSpeechState?: (isSpeaking: boolean) => void;
  public onStateUpdate?: (updates: {
    photos?: string;
    passport?: string;
    coins?: number;
    bananas?: number;
    items?: Array<{ name: string; icon: string; count?: number }>;
  }) => void;

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

  public acquireItem(name: string, icon: string, count: number = 1): void {
    const existing = this.acquiredItems.find(it => it.name === name);
    if (existing) {
      existing.count = (existing.count || 1) + count;
    } else {
      this.acquiredItems.push({ name, icon, count });
    }
    if (name === 'Plátano de Canarias') {
      this.bananaCount = (this.bananaCount || 0) + count;
    }
    if (this.onStateUpdate) {
      this.onStateUpdate({ items: this.acquiredItems, bananas: this.bananaCount, coins: this.coins });
    }
  }

  public setVerb(verb: VerbType): void {
    this.activeVerb = verb;
    this.audioService.playClick();
    this.updateSentence();
  }

  public selectItem(itemName: string): void {
    this.audioService.playClick();
    this.dialogueManager.clear();

    if (itemName === 'Mapa de Tenerife') {
      this.triggerTravel();
      return;
    }

    if (itemName === 'Álbum de Fotos') {
      if (this.photoAlbumModal) {
        this.photoAlbumModal.open();
        return;
      }
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

    if (itemName === 'Bolsa de Monedas de Oro') {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: `Twinber [MONEDAS]: 'Llevo ${this.coins} monedas de oro en mi riñonera.'` }
      ]);
      return;
    }

    if (itemName === 'Saco de Gofio') {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'Un saquito de gofio tradicional canario de trigo y millo tostado.'" }
      ]);
      return;
    }

    if (itemName === 'Comanda del Guachinche') {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'Una comanda de taberna con notas y apuntes de ruta.'" }
      ]);
      return;
    }

    if (itemName === 'Billete del Teleférico') {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'Un billete para la cabina del teleférico de El Teide.'" }
      ]);
      return;
    }

    if (itemName === 'Plátano de Canarias') {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'Un rico plátano de Canarias con motitas. Siempre viene bien para reponer fuerzas.'" }
      ]);
      return;
    }
  }

  public setHoverTarget(target: string, type: 'npc' | 'scenery' | 'item' | 'ground' = 'ground'): void {
    this.hoverTargetName = target;
    this.hoverTargetType = type;
    this.updateSentence();
  }

  public clickGround(_targetX: number): void {
    if (this.dialogueManager.currentLine) {
      this.dialogueManager.advanceOrSkip();
      return;
    }
    if (this.isInNpcDialogue) {
      this.endNpcDialogue();
    }
  }

  public setupSceneHotspots(): void {
    if (this.viewportView) {
      this.viewportView.renderHotspots(this.currentLocation.hotspots);
    }
  }

  public listDestinations(): string {
    let out = '=== DESTINOS IMPLEMENTADOS EN TENERIFE (CATÁLOGO OFICIAL) ===\n';
    const zones = ['Norte', 'Metropolitana', 'Sur', 'Cumbre'] as const;
    for (const zone of zones) {
      out += `\n[ZONA ${zone.toUpperCase()}]\n`;
      const inZone = LOCATIONS_CATALOG.filter(l => l.zone === zone);
      for (const loc of inZone) {
        const npcInfo = loc.npc ? `${loc.npc.name} (${loc.npc.role})${loc.npc.hasShop ? ' [Tienda]' : ''}` : 'Sin NPC';
        const stampInfo = loc.stampKey ? `[Sello: ${loc.stampKey}]` : '[Sin sello]';
        const mirarPhotos = loc.hotspots
          .filter(h => h.photoId)
          .map(h => `#${String(h.photoId).padStart(2, '0')}`)
          .join(', ');
        const photosInfo = mirarPhotos ? ` | Fotos [MIRAR]: ${mirarPhotos}` : '';
        out += `  • ${loc.id.padEnd(14)} -> ${loc.name.padEnd(25)} | NPC: ${npcInfo} | ${stampInfo}${photosInfo}\n`;
      }
    }
    out += '\n------------------------------------------------------------\n';
    out += 'Comando para saltar: VIAJAR <ID_O_NOMBRE> (Ej: VIAJAR la_orotava ó VIAJAR Masca)\n';
    return out;
  }

  public teleportTo(query: string): { success: boolean; message: string; location?: LocationSceneDef } {
    const clean = query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!clean) {
      const msg = "Debes indicar un destino. Ejemplo: VIAJAR la_orotava (o usa LISTAR_DESTINOS).";
      if (this.onLogMessage) this.onLogMessage(`[ERROR TELEMETRÍA] ${msg}`);
      return { success: false, message: msg };
    }

    const found = LOCATIONS_CATALOG.find(l => {
      const cleanId = l.id.toLowerCase();
      const cleanName = l.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return cleanId === clean || cleanName === clean || cleanId.includes(clean) || cleanName.includes(clean);
    });

    if (!found) {
      const msg = `Destino no reconocido: '${query}'. Escribe LISTAR_DESTINOS para ver los 13 enclaves disponibles.`;
      if (this.onLogMessage) this.onLogMessage(`[ERROR TELEMETRÍA] ${msg}`);
      return { success: false, message: msg };
    }

    this.currentLocation = found;

    // 1. Reposicionar y configurar NPC
    if (found.npc) {
      this.paco.id = found.npc.id;
      this.paco.name = found.npc.name;
      this.paco.xPct = found.npc.initialX;
      this.paco.targetXPct = found.npc.initialX;
      this.paco.bottomPct = found.npc.initialBottom !== undefined ? found.npc.initialBottom : 8;
      this.paco.frameIdx = 0;
      this.paco.state = 'IDLE';
      this.paco.facing = -1;

      // 2. Posicionar a Twinber a distancia coherente del NPC (a su izquierda, mirándole)
      const npcX = found.npc.initialX;
      const twinberX = found.npc.twinberX !== undefined ? found.npc.twinberX : Math.max(16, npcX - 11.5);
      this.twinber.xPct = twinberX;
      this.twinber.targetXPct = twinberX;
      this.twinber.bottomPct = found.npc.twinberBottom !== undefined 
        ? found.npc.twinberBottom 
        : (found.npc.initialBottom !== undefined ? found.npc.initialBottom : 8);
      this.twinber.state = 'IDLE';
      this.twinber.frameIdx = 0;
      this.twinber.facing = 1;
    } else {
      this.twinber.xPct = 50.0;
      this.twinber.targetXPct = 50.0;
      this.twinber.state = 'IDLE';
      this.twinber.frameIdx = 0;
      this.twinber.facing = 1;
    }

    // 3. Actualizar Viewport (Background, HUD, NPC visible y Hotspots)
    if (this.viewportView) {
      this.viewportView.updateScene(
        found.bgImage,
        found.hudTitle,
        found.npc?.name,
        !!found.npc
      );
      this.viewportView.renderHotspots(found.hotspots);
    }

    // 4. Limpiar diálogos en curso
    this.dialogueManager.clear();
    if (this.isInNpcDialogue) {
      this.endNpcDialogue();
    }

    // 5. Notificación retro en telemetría
    this.audioService.playClick();
    const logMsg = `[TELEMETRÍA] Salto forzado a '${found.name}' [${found.id}]. Reglas de viaje y sellos ignorados para depuración.`;
    if (this.onLogMessage) this.onLogMessage(logMsg);

    this.dialogueManager.enqueue([
      { speaker: 'twinber', text: `Twinber: '[DEPURACIÓN] Teletransportado con éxito a ${found.name}.'` }
    ]);

    return { success: true, message: `Teletransportado a ${found.name}`, location: found };
  }

  public interactWithHotspot(hotspotId: string, hotspotName: string = ''): void {
    if (this.dialogueManager.currentLine) {
      this.dialogueManager.advanceOrSkip();
      return;
    }

    const def = this.currentLocation.hotspots.find(h => h.id === hotspotId);
    if (def) {
      this.interactWithHotspotDef(def);
      return;
    }

    if (hotspotId === 'hotspot-paco' || hotspotId === 'paco-actor') {
      this.talkToCurrentNpc();
    } else {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: `Twinber: 'Examinando ${hotspotName || 'este punto'} detenidamente.'` }
      ]);
    }
  }

  public interactWithHotspotDef(hotspot: HotspotLocationDef): void {
    if (this.dialogueManager.currentLine) {
      this.dialogueManager.advanceOrSkip();
      return;
    }

    if (hotspot.type === 'npc') {
      this.talkToCurrentNpc();
      return;
    }

    // Orientar a Twinber mirando hacia el punto de interés observado
    const hotspotCenterX = hotspot.leftPct + hotspot.widthPct / 2;
    this.twinber.facing = hotspotCenterX > this.twinber.xPct ? 1 : -1;
    this.audioService.playClick();

    let unlockedPhoto = false;
    if (hotspot.photoId && this.photoAlbumModal) {
      unlockedPhoto = this.photoAlbumModal.unlockPhoto(hotspot.photoId);
      if (unlockedPhoto) {
        this.audioService.playHint();
        const count = this.photoAlbumModal.getUnlockedCount();
        if (this.onStateUpdate) this.onStateUpdate({ photos: `${count}/28` });
        if (this.onLogMessage) {
          this.onLogMessage(`[RAG RETRIEVAL] Foto #${String(hotspot.photoId).padStart(2, '0')} desbloqueada al mirar '${hotspot.name}' (${this.currentLocation.name})`);
        }
      }
    }

    const lines: Array<{ speaker: 'twinber' | 'paco'; text: string }> = [
      { speaker: 'twinber', text: `Twinber: '${hotspot.lookText}'` }
    ];

    if (unlockedPhoto && hotspot.photoId) {
      lines.push({
        speaker: 'twinber',
        text: `Twinber: '¡Foto #${String(hotspot.photoId).padStart(2, '0')} agregada a mi Álbum de Recuerdos! Usa el Álbum para verla a tamaño completo.'`
      });
    }

    this.dialogueManager.enqueue(lines);
  }

  public talkToCurrentNpc(): void {
    if (this.isInNpcDialogue) return;
    const npc = this.currentLocation.npc;
    if (!npc) {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'No hay nadie en este lugar con quien conversar ahora mismo.'" }
      ]);
      return;
    }
    this.startNpcDialogue(npc.id, npc.name);
  }

  public talkToPaco(): void {
    this.talkToCurrentNpc();
  }

  public startNpcDialogue(_npcId: string, npcName: string): void {
    // Twinber y el NPC se encaran mutuamente
    this.twinber.facing = this.twinber.xPct < this.paco.xPct ? 1 : -1;
    this.paco.facing = this.twinber.xPct < this.paco.xPct ? -1 : 1;

    this.isInNpcDialogue = true;
    this.isDialogueSpeaking = true;
    this.currentDialogueNpc = npcName;
    this.pendingDialogueExit = false;

    const npc = this.currentLocation.npc;
    const isSoldOut = npc?.id ? this.purchasedFromNpcs.has(npc.id) : false;
    const shopItem = (npc?.hasShop && !isSoldOut) ? npc.shopItem : undefined;
    const twinBrotherName = npc?.twinBrotherName;
    if (this.onDialogueModeChange) {
      this.onDialogueModeChange(true, npcName, shopItem, twinBrotherName);
    }
    if (this.onDialogueSpeechState) {
      this.onDialogueSpeechState(true);
    }
    this.updateSentence();

    const greeting = this.currentLocation.npc?.greeting || `¡Hola! Bienvenido a ${this.currentLocation.name}.`;
    this.dialogueManager.enqueue([
      { speaker: 'paco', text: `${npcName}: '${greeting}'` }
    ]);
  }

  public endNpcDialogue(): void {
    this.isInNpcDialogue = false;
    this.isDialogueSpeaking = false;
    this.currentDialogueNpc = null;
    this.pendingDialogueExit = false;

    // Twinber vuelve a mirar hacia el NPC
    this.twinber.facing = this.twinber.xPct < this.paco.xPct ? 1 : -1;

    if (this.onDialogueModeChange) {
      this.onDialogueModeChange(false);
    }
    this.updateSentence();
  }

  public selectDialogueChoice(choice: 'passport' | 'lore' | 'twin' | 'buy' | 'custom' | 'exit', customText?: string): void {
    if (!this.isInNpcDialogue) return;
    if (this.isDialogueSpeaking) return;
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
      case 'twin':
        this.handleTwinChoice();
        break;
      case 'buy':
        this.handleBuyChoice();
        break;
      case 'custom':
        this.handleCustomChoice(customText || '');
        break;
      case 'exit':
        this.handleExitChoice();
        break;
    }
  }

  private handleTwinChoice(): void {
    const npc = this.currentLocation.npc;
    const npcName = npc?.name || 'Personaje';
    const twinName = npc?.twinBrotherName || 'mi otro hermano';

    if (this.onLogMessage) {
      this.onLogMessage(`[EASTER EGG // HERMANOS GEMELOS] Twinber -> ${npcName}: "¿Nos conocemos?" -> Hermano gemelo: "${twinName}"`);
    }

    this.dialogueManager.enqueue([
      { speaker: 'twinber', text: "Twinber: '¿Nos conocemos?'" },
      { speaker: 'paco', text: `${npcName}: 'No lo creo caballero, tal vez haya conocido a mi hermano gemelo ${twinName}.'` }
    ]);
  }

  private handleBuyChoice(): void {
    const npc = this.currentLocation.npc;
    const npcName = npc?.name || 'Comerciante';

    if (npc?.hasShop && npc.shopItem) {
      const item = npc.shopItem;

      // Comprobar si este comerciante ya ha agotado sus existencias
      if (npc.id && this.purchasedFromNpcs.has(npc.id)) {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: `Twinber: '¿Le queda algún otro artículo a la venta?'` },
          { speaker: 'paco', text: `${npcName}: 'Ya te vendí todo lo que tenía de sobra, forastero.'` }
        ]);
        return;
      }

      // Comprobar si ya tiene el objeto único
      const alreadyHas = this.acquiredItems.some(i => i.name === item.name);
      if (alreadyHas && item.name !== 'Plátano de Canarias') {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: `Twinber: 'Ya tengo ${item.name} a buen recaudo en mi inventario.'` },
          { speaker: 'paco', text: `${npcName}: '¡Cuídalo bien, forastero!'` }
        ]);
        return;
      }

      // Comprobar límite de plátanos (máximo 3)
      if (item.name === 'Plátano de Canarias' && (this.bananaCount || 0) >= 3) {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber: '¡Ya llevo 3 plátanos de Canarias encima! No me caben más en la riñonera.'" },
          { speaker: 'paco', text: `${npcName}: '¡Vaya apetito por la fruta canaria!'` }
        ]);
        return;
      }

      if (this.coins >= item.price) {
        this.coins -= item.price;
        let icon = '/assets/img/items/item_gofio.svg';
        if (item.name.includes('Plátano')) icon = '/assets/img/items/item_platano.svg';
        else if (item.name.includes('Comanda')) icon = '/assets/img/items/item_comanda.svg';
        else if (item.name.includes('Billete')) icon = '/assets/img/items/item_billete.svg';
        else if (item.name.includes('Gofio')) icon = '/assets/img/items/item_gofio.svg';

        this.acquireItem(item.name, icon, 1);
        if (npc.id) {
          this.purchasedFromNpcs.add(npc.id);
          if (this.onDialogueModeChange) {
            this.onDialogueModeChange(true, npcName, undefined, npc.twinBrotherName);
          }
        }
        this.audioService.playCoin();
        if (this.onLogMessage) {
          this.onLogMessage(`[COMERCIO] Adquirido '${item.name}' por ${item.price} monedas. Saldo restante: ${this.coins}`);
        }
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: `Twinber: 'Me gustaría comprar ${item.name} por ${item.price} monedas.'` },
          { speaker: 'paco', text: `${npcName}: '${item.dialogueText}'` },
          { speaker: 'twinber', text: `Twinber: '¡Trato hecho! Guardo ${item.name} en mi inventario.'` }
        ]);
      } else {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: `Twinber: 'Quisiera comprar ${item.name}, pero no me alcanzan las monedas...'` },
          { speaker: 'paco', text: `${npcName}: '¡Chacho, necesitas ${item.price} monedas y solo te quedan ${this.coins}!'` }
        ]);
      }
    } else {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: '¿Tiene algo a la venta por aquí?'" },
        { speaker: 'paco', text: `${npcName}: 'No tengo artículos a la venta en este momento, muchacho.'` }
      ]);
    }
  }

  private handlePassportChoice(): void {
    const stampKey = this.currentLocation.stampKey;
    const locName = this.currentLocation.name;
    const npcName = this.currentLocation.npc?.name || 'Guía';

    if (!stampKey) {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: '¿Podría sellarme el pasaporte de explorador?'" },
        { speaker: 'paco', text: `${npcName}: 'En este enclave no disponemos de cuño oficial. Busca en las villas y parques principales de Tenerife.'` }
      ]);
      return;
    }

    const hasStamp = this.stampedZones.has(locName);
    if (!hasStamp) {
      this.stampedZones.add(locName);
      if (this.passportModal) {
        this.passportModal.unlockStamp(stampKey);
      }
      this.audioService.playCoin();
      if (this.onStateUpdate) {
        this.onStateUpdate({ passport: `${this.stampedZones.size}/10` });
      }
      if (this.onLogMessage) {
        this.onLogMessage(`[PASAPORTE] Sello oficial estampado: '${locName}' [${stampKey}] (${this.stampedZones.size}/10 sellos oficiales)`);
      }
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: '¿Podría sellarme el pasaporte de explorador oficial de Tenerife?'" },
        { speaker: 'paco', text: `${npcName}: '¡Por supuesto! Estampo el sello de ${locName} en tu pasaporte. ¡Ya sumas ${this.stampedZones.size} de los 10 sellos oficiales de la isla!'` }
      ]);
    } else {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: '¿Podría sellarme el pasaporte?'" },
        { speaker: 'paco', text: `${npcName}: '¡Chacho, si ya tienes estampada la marca oficial de ${locName}! Sigue explorando para completar las 10 páginas.'` }
      ]);
    }
  }

  private handleLoreChoice(): void {
    const npc = this.currentLocation.npc;
    const npcName = npc?.name || 'Lugareño';
    const locName = this.currentLocation.name;

    if (this.onLogMessage) {
      this.onLogMessage(`[RAG RETRIEVAL // ZONA] Consulta de lore: '${locName}' -> Contexto: TENERIFE.pdf`);
    }

    let isNewPhoto = false;
    const photoId = npc?.photoIdOnLore;
    if (photoId && this.photoAlbumModal) {
      isNewPhoto = this.photoAlbumModal.unlockPhoto(photoId);
      const count = this.photoAlbumModal.getUnlockedCount();
      if (this.onStateUpdate) this.onStateUpdate({ photos: `${count}/28` });
      if (isNewPhoto) {
        this.audioService.playHint();
        if (this.onLogMessage) {
          this.onLogMessage(`[RAG METADATA] Foto #${String(photoId).padStart(2, '0')} desbloqueada en el Álbum por diálogo con ${npcName}.`);
        }
      }
    }

    if (isNewPhoto && photoId) {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: `Twinber: '¿Qué me puede contar sobre los secretos de ${locName}?'` },
        { speaker: 'paco', text: `${npcName}: 'Tenerife guarda incontables maravillas. Te he dejado una foto testimonial en tu Álbum de Recuerdos.'` },
        { speaker: 'twinber', text: `Twinber: '¡Foto #${String(photoId).padStart(2, '0')} guardada en mi Álbum de Recuerdos!'` }
      ]);
    } else {
      const lore = npc?.lookText || `Un rincón emblemático del archipiélago canario lleno de encanto, volcanes y tradición.`;
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: `Twinber: '¿Qué me puede contar sobre la historia de ${locName}?'` },
        { speaker: 'paco', text: `${npcName}: '${lore}'` }
      ]);
    }
  }

  private handleCustomChoice(userText: string): void {
    const npcName = this.currentLocation.npc?.name || 'Personaje';
    if (this.onLogMessage) {
      this.onLogMessage(`[PROMPT ABIERTO AL LLM] Twinber -> ${npcName}: "${userText}"`);
    }

    const lower = userText.toLowerCase();
    let reply = `${npcName}: '¡Chacho, qué buena pregunta! En Tenerife cada rincón guarda una leyenda. ¡Sigue explorando la isla!'`;

    if (this.currentLocation.npc?.twinBrotherName && (lower.includes('conocemos') || lower.includes('gemelo') || lower.includes('hermano') || lower.includes('clon') || lower.includes('pareces'))) {
      reply = `${npcName}: 'No lo creo caballero, tal vez haya conocido a mi hermano gemelo ${this.currentLocation.npc.twinBrotherName}.'`;
    } else if (lower.includes('gofio') || lower.includes('comer') || lower.includes('molino') || lower.includes('comida') || lower.includes('papas') || lower.includes('mojo')) {
      reply = `${npcName}: '¡Para comer bien pide unas papas arrugadas con mojo y sube a La Orotava al Molino de Chano por buen gofio recién molido!'`;
    } else if (lower.includes('teide') || lower.includes('volcan') || lower.includes('volcán') || lower.includes('cumbre') || lower.includes('subir') || lower.includes('pico')) {
      reply = `${npcName}: 'El padre Teide vigila a 3.718 metros. Toma la guagua a Las Cañadas y luego la cabina del teleférico.'`;
    } else if (lower.includes('tiempo') || lower.includes('clima') || lower.includes('alisios') || lower.includes('calima') || lower.includes('viento')) {
      reply = `${npcName}: 'Los vientos alisios soplan frescos del norte. En el sur reina el sol y en la cumbre el aire es limpio y transparente.'`;
    } else if (lower.includes('dinero') || lower.includes('monedas') || lower.includes('perras') || lower.includes('comprar')) {
      reply = `${npcName}: '¡Cuida bien tus monedas! Te harán falta para adquirir provisiones y billetes de viaje.'`;
    } else if (lower.includes('hola') || lower.includes('buenos dias') || lower.includes('buenas')) {
      reply = `${npcName}: '¡Muy buenas, muchacho! Siempre da alegría ver viajeros con ganas de conocer nuestra tierra.'`;
    }

    this.dialogueManager.enqueue([
      { speaker: 'twinber', text: `Twinber: '${userText}'` },
      { speaker: 'paco', text: reply }
    ]);
  }

  private handleExitChoice(): void {
    const npcName = this.currentLocation.npc?.name || 'Amigo';
    this.pendingDialogueExit = true;
    this.dialogueManager.enqueue([
      { speaker: 'twinber', text: `Twinber: 'Tengo que marcharme. ¡Hasta luego, ${npcName}!'` },
      { speaker: 'paco', text: `${npcName}: '¡Que los alisios te sean favorables, muchacho! Buen viaje por la isla.'` }
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
      { speaker: 'twinber', text: "Twinber: 'Llevo 15 monedas en la riñonera y mi pasaporte en blanco. Debería charlar con este viejo pescador o consultar los lugares de la zona.'" }
    ]);
  }

  public triggerTravel(): void {
    this.audioService.playClick();
    const count = this.stampedZones.size;
    const list = count > 0 ? Array.from(this.stampedZones).join(', ') : 'Puerto de la Cruz (pendiente)';
    this.dialogueManager.enqueue([
      { speaker: 'twinber', text: `Twinber [MAPA DE TENERIFE]: 'Despliego el mapa de carreteras insulares. Sellos oficiales en pasaporte: ${count}/10 (${list}).'` },
      { speaker: 'twinber', text: "Twinber: 'Para tomar la guagua hacia La Orotava o Las Cañadas del Teide, asegúrate de tener sellada la zona actual.'" }
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

    if (this.hoverTargetType === 'npc') {
      text = target ? `Hablar con ${target}` : '';
    } else if (this.hoverTargetType === 'scenery') {
      text = target ? `Mirar ${target}` : '';
    } else if (this.hoverTargetType === 'item') {
      text = target || '';
    } else {
      text = target || '';
    }

    if (this.onSentenceChange) this.onSentenceChange(text);
  }
}

