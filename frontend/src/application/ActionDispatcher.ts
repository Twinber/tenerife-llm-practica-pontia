// ==============================================================================
// APPLICATION: Orquestador de Acciones SCUMM (Verbos, Hotspots e Inventario)
// ==============================================================================
import { VerbType } from '../domain/types';
import { Actor } from '../domain/Actor';
import { DialogueManager } from './DialogueManager';
import { AudioService } from '../infrastructure/AudioService';

export class ActionDispatcher {
  public activeVerb: VerbType = 'IR A';
  public selectedItemName: string | null = null;
  public hoverTargetName: string = '';

  private twinber: Actor;
  private paco: Actor;
  private dialogueManager: DialogueManager;
  private audioService: AudioService;
  public onSentenceChange?: (text: string) => void;
  public onLogMessage?: (msg: string) => void;

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
    } else if (verb === 'CLIMA') {
      this.triggerWeather();
    } else {
      this.updateSentence();
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
    this.twinber.moveTo(targetX);
    this.setHoverTarget('el muelle...');
    if (this.onLogMessage) this.onLogMessage(`Twinber camina hacia X: ${targetX.toFixed(1)}%`);
  }

  public talkToPaco(): void {
    this.twinber.moveTo(74, () => {
      this.twinber.facing = 1;
      this.paco.facing = -1;
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: '¡Buenos días! Acabo de desembarcar en Puerto de la Cruz. ¿Qué me recomienda ver en la isla?'" },
        { speaker: 'paco', text: "Paco: '¡Chacho, bienvenido a Tenerife, mi niño! Si buscas buen comer y buen gofio, sube al Molino de Chano en La Orotava.'" },
        { speaker: 'paco', text: "Paco: 'Y no tengas prisa por subir al Teide; primero sella todo el Norte en tu pasaporte y tómate un buen barraquito en el muelle.'" },
        { speaker: 'twinber', text: "Twinber: '¡Oído cocina, Paco! Guardaré bien mis 15 monedas para ese gofio.'" }
      ]);
    });
  }

  public triggerThinking(): void {
    this.audioService.playHint();
    this.dialogueManager.enqueue([
      { speaker: 'twinber', text: "Twinber [💡 PENSAR]: 'Llevo 15 monedas en la riñonera y mi pasaporte en blanco. Debería charlar con este viejo pescador para orientarme.'" }
    ]);
  }

  public triggerWeather(): void {
    this.dialogueManager.enqueue([
      { speaker: 'paco', text: "Paco [CLIMA]: 'El alisio sopla fresco en el muelle a 20°C con mar en calma. Arriba en las Cañadas del Teide seguro que hace rasca.'" }
    ]);
  }

  public inspectBoat(): void {
    this.twinber.moveTo(35, () => {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'La barca \"El Mojo\"... Típica embarcación pesquera de madera canaria. Huele a mar y salitre.'" }
      ]);
    });
  }

  public inspectTeide(): void {
    this.dialogueManager.enqueue([
      { speaker: 'twinber', text: "Twinber: '¡Qué imponente! El volcán Teide se alza a 3.718 metros sobre las nubes.'" }
    ]);
  }

  public inspectHouse(): void {
    this.twinber.moveTo(60, () => {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'Hermosos balcones tradicionales tallados en madera de tea. Pura arquitectura canaria.'" }
      ]);
    });
  }

  public inspectLighthouse(): void {
    this.twinber.moveTo(12, () => {
      this.dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'El viejo faro guiando a los barcos que llegan desde el Atlántico.'" }
      ]);
    });
  }

  private updateSentence(): void {
    let text = this.activeVerb;
    if (this.selectedItemName) {
      text += ` ${this.selectedItemName} con`;
    }
    if (this.hoverTargetName) {
      text += ` ${this.hoverTargetName}`;
    } else {
      text += '...';
    }
    if (this.onSentenceChange) this.onSentenceChange(text);
  }
}
