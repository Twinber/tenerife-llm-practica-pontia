// ==============================================================================
// APPLICATION: Orquestador de Acciones SCUMM (Verbos, Hotspots e Inventario)
// ==============================================================================
import { VerbType } from '../domain/types';
import { Actor } from '../domain/Actor';
import { DialogueManager } from './DialogueManager';
import { AudioService } from '../infrastructure/AudioService';
import type { PhotoAlbumModal } from '../presentation/PhotoAlbumModal';

export class ActionDispatcher {
  public activeVerb: VerbType = 'HABLAR';
  public selectedItemName: string | null = null;
  public hoverTargetName: string = '';

  private twinber: Actor;
  private paco: Actor;
  private dialogueManager: DialogueManager;
  private audioService: AudioService;
  public photoAlbumModal?: PhotoAlbumModal;
  public onSentenceChange?: (text: string) => void;
  public onLogMessage?: (msg: string) => void;
  public onStateUpdate?: (updates: { photos?: string; passport?: string; coins?: string }) => void;

  public teidePhotoTaken: boolean = false;
  public pacoStampGiven: boolean = false;

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
  }

  public setVerb(verb: VerbType): void {
    this.activeVerb = verb;
    this.audioService.playClick();

    if (verb === 'PENSAR') {
      this.triggerThinking();
    } else if (verb === 'VIAJAR') {
      this.triggerTravel();
    } else {
      this.updateSentence();
    }
  }

  public selectItem(itemName: string): void {
    if (this.activeVerb === 'MIRAR') {
      if (itemName === 'Álbum de Fotos' && this.photoAlbumModal) {
        this.photoAlbumModal.open();
        return;
      }
      if (itemName === 'Pasaporte de Explorador') {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber [MIRAR PASAPORTE]: 'Mi pasaporte oficial de explorador de Tenerife. Tiene espacio para los 10 sellos comarcales más el sello de la cumbre del Teide.'" }
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

  public setHoverTarget(target: string): void {
    this.hoverTargetName = target;
    this.updateSentence();
  }

  public clickGround(targetX: number): void {
    if (this.dialogueManager.currentLine) {
      this.dialogueManager.advanceOrSkip();
      return;
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
    } else if (this.selectedItemName === 'Brújula de Latón') {
      if (hotspotId === 'hotspot-teide') {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber: 'La aguja magnética apunta hacia el Sur-Suroeste, directa a la cumbre volcánica.'" }
        ]);
      } else if (hotspotId === 'hotspot-faro') {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber: 'La aguja señala al Noroeste, adentrándose en el Atlántico hacia San Telmo.'" }
        ]);
      } else {
        this.dialogueManager.enqueue([
          { speaker: 'twinber', text: "Twinber: 'La brújula se mantiene firme orientada hacia el Norte magnético.'" }
        ]);
      }
    }
  }

  public talkToPaco(): void {
    const nearPacoX = Math.min(72, this.twinber.maxX ?? 72);
    this.twinber.moveTo(nearPacoX, () => {
      this.twinber.facing = 1;
      this.paco.facing = -1;

      // Desbloqueo RAG vía conversación (Foto #02 Lago Martiánez)
      if (this.photoAlbumModal) {
        const isNew = this.photoAlbumModal.unlockPhoto(2);
        const count = this.photoAlbumModal.getUnlockedCount();
        if (this.onStateUpdate) this.onStateUpdate({ photos: `${count}/28` });
        if (isNew && this.onLogMessage) {
          this.onLogMessage("[RAG DIALOGUE] Paco revela secreto costero -> Match: photo_id=02 'Lago Martiánez' (pág. 12) -> Desbloqueada en Álbum");
        }
      }

      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: '¡Buenos días! Acabo de desembarcar en Puerto de la Cruz. ¿Qué me recomienda ver en la isla?'" },
        { speaker: 'paco', text: "Paco: '¡Chacho, bienvenido a Tenerife, mi niño! Si buscas buen comer y buen gofio, sube al Molino de Chano en La Orotava.'" },
        { speaker: 'paco', text: "Paco [RAG // Pág. 12]: 'Y si quieres refrescarte, ve al Lago Martiánez al final del paseo: ¡las piscinas de agua salada de César Manrique! [Foto #02 añadida al Álbum]'" },
        { speaker: 'twinber', text: "Twinber: '¡Muchas gracias, Paco! Guardaré bien mis 15 monedas y anotaré el Lago Martiánez.'" }
      ]);
    });
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

