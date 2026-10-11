// ==============================================================================
// APPLICATION: Gestor de Diálogos, Colas de Subtítulos y Streaming
// ==============================================================================
import { DialogueLine } from '../domain/types';
import { AudioService } from '../infrastructure/AudioService';

export class DialogueManager {
  private queue: DialogueLine[] = [];
  public currentLine: DialogueLine | null = null;
  public displayedText: string = '';
  public isFullyTyped: boolean = false;
  private charTimer: number = 0;
  private audioService: AudioService;
  
  public onSpeakerChange?: (speaker: string | null) => void;
  public onDialogueFinished?: () => void;

  constructor(audioService: AudioService) {
    this.audioService = audioService;
  }

  public enqueue(lines: DialogueLine[]): void {
    this.queue.push(...lines);
    if (!this.currentLine) {
      this.playNext();
    }
  }

  public advanceOrSkip(): void {
    if (!this.currentLine) return;
    if (!this.isFullyTyped) {
      // Si el texto aún se está escribiendo, completarlo de inmediato
      this.displayedText = this.currentLine.text;
      this.isFullyTyped = true;
    } else {
      // Si ya está completo, avanzar a la siguiente frase
      this.audioService.playClick();
      this.playNext();
    }
  }

  public clear(): void {
    this.queue = [];
    this.currentLine = null;
    this.displayedText = '';
    this.isFullyTyped = false;
    if (this.onSpeakerChange) this.onSpeakerChange(null);
  }

  private playNext(): void {
    if (this.queue.length === 0) {
      this.currentLine = null;
      this.displayedText = '';
      this.isFullyTyped = false;
      if (this.onSpeakerChange) this.onSpeakerChange(null);
      if (this.onDialogueFinished) this.onDialogueFinished();
      return;
    }

    this.currentLine = this.queue.shift()!;
    this.displayedText = '';
    this.isFullyTyped = false;
    this.charTimer = 0;
    if (this.onSpeakerChange) this.onSpeakerChange(this.currentLine.speaker);
  }

  public update(): void {
    if (!this.currentLine) return;

    // Efecto teletipo letra por letra
    if (!this.isFullyTyped) {
      this.charTimer++;
      if (this.charTimer % 2 === 0 && this.displayedText.length < this.currentLine.text.length) {
        this.displayedText = this.currentLine.text.substring(0, this.displayedText.length + 1);
        if (Math.random() < 0.35) {
          this.audioService.playTalk();
        }
      }

      if (this.displayedText.length >= this.currentLine.text.length) {
        this.isFullyTyped = true;
      }
    }
    // NOTA: Se ha eliminado el timer automático. El texto espera indefinidamente
    // a que el jugador pulse [CONTINUAR], haga clic o pulse Espacio/Enter.
  }
}
