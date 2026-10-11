// ==============================================================================
// APPLICATION: GameEngine (Game Loop, Coordinador de Entidades y Estados)
// ==============================================================================
import { Actor } from '../domain/Actor';
import { DialogueManager } from './DialogueManager';
import { ActionDispatcher } from './ActionDispatcher';

export class GameEngine {
  public twinber: Actor;
  public paco: Actor;
  public dialogueManager: DialogueManager;
  public actionDispatcher: ActionDispatcher;
  private isRunning: boolean = false;
  public onTick?: () => void;

  constructor(
    twinber: Actor,
    paco: Actor,
    dialogueManager: DialogueManager,
    actionDispatcher: ActionDispatcher
  ) {
    this.twinber = twinber;
    this.paco = paco;
    this.dialogueManager = dialogueManager;
    this.actionDispatcher = actionDispatcher;

    // Vincular cambios de hablante a las animaciones de los actores
    this.dialogueManager.onSpeakerChange = (speaker) => {
      if (speaker === 'twinber') {
        this.twinber.setTalk(true);
        this.paco.setTalk(false);
      } else if (speaker === 'paco') {
        this.paco.setTalk(true);
        this.twinber.setTalk(false);
      } else {
        this.twinber.setTalk(false);
        this.paco.setTalk(false);
      }
    };
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(_timestamp: number): void {
    if (!this.isRunning) return;

    // 1. Orientación reactiva de Paco: mira siempre hacia Twinber
    this.paco.facing = this.twinber.xPct < this.paco.xPct ? -1 : 1;

    // 2. Actualizar estados de actores
    this.twinber.update();
    this.paco.update();

    // 3. Actualizar máquina de diálogos
    this.dialogueManager.update();

    // 4. Notificar a las vistas
    if (this.onTick) {
      this.onTick();
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}
