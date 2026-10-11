// ==============================================================================
// APPLICATION: Gestor de Diálogos, Colas de Subtítulos y Streaming
// ==============================================================================
import { DialogueLine } from '../domain/types';
import { AudioService } from '../infrastructure/AudioService';

export class DialogueManager {
  private queue: DialogueLine[] = [];
  public currentLine: DialogueLine | null = null;
  public displayedText: string = '';
  private charTimer: number = 0;
  private waitTimer: number = 0;
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
    if (this.displayedText.length < this.currentLine.text.length) {
      this.displayedText = this.currentLine.text;
    } else {
      this.playNext();
    }
  }

  private playNext(): void {
    if (this.queue.length === 0) {
      this.currentLine = null;
      this.displayedText = '';
      if (this.onSpeakerChange) this.onSpeakerChange(null);
      if (this.onDialogueFinished) this.onDialogueFinished();
      return;
    }

    this.currentLine = this.queue.shift()!;
    this.displayedText = '';
    this.charTimer = 0;
    this.waitTimer = 0;
    if (this.onSpeakerChange) this.onSpeakerChange(this.currentLine.speaker);
  }

  public update(): void {
    if (!this.currentLine) return;

    // Efecto teletipo letra por letra
    this.charTimer++;
    if (this.charTimer % 2 === 0 && this.displayedText.length < this.currentLine.text.length) {
      this.displayedText = this.currentLine.text.substring(0, this.displayedText.length + 1);
      if (Math.random() < 0.35) {
        this.audioService.playTalk();
      }
    }

    // Esperar tras completar el texto para pasar al siguiente diálogo
    if (this.displayedText.length >= this.currentLine.text.length) {
      this.waitTimer++;
      if (this.waitTimer > 240) { // ~4 segundos
        this.waitTimer = 0;
        this.playNext();
      }
    }
  }
}
