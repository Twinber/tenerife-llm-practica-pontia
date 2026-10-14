// ==============================================================================
// APPLICATION: Gestor de Diálogos, Colas de Subtítulos y Streaming
// ==============================================================================
import { DialogueLine, SpeakerType, ExecutionStep } from '../domain/types';
import { AudioService } from '../infrastructure/AudioService';

export class DialogueManager {
  private queue: DialogueLine[] = [];
  public currentLine: DialogueLine | null = null;
  public displayedText: string = '';
  public isFullyTyped: boolean = false;
  public isStreaming: boolean = false;
  
  // Estado de espera del backend ("Relojito / Loading")
  public isWaitingBackend: boolean = false;
  public waitingMessage: string = '';
  public waitingSpeaker: SpeakerType = 'paco';
  private waitingDotsTimer: number = 0;

  private charTimer: number = 0;
  private audioService: AudioService;
  
  public onSpeakerChange?: (speaker: string | null) => void;
  public onDialogueFinished?: () => void;

  constructor(audioService: AudioService) {
    this.audioService = audioService;
  }

  public startStreamingLine(speaker: SpeakerType, initialPrefix: string = ''): void {
    this.isStreaming = true;
    this.isWaitingBackend = false;
    this.currentLine = { speaker, text: initialPrefix };
    this.displayedText = initialPrefix;
    this.isFullyTyped = false;
    if (this.onSpeakerChange) this.onSpeakerChange(speaker);
  }

  public startLiveAgentTurn(speaker: SpeakerType, initialWaitingText: string): void {
    this.isStreaming = true;
    this.isWaitingBackend = true;
    this.waitingSpeaker = speaker;
    this.waitingMessage = initialWaitingText;
    this.currentLine = { speaker, text: initialWaitingText, executionSteps: [] };
    this.displayedText = initialWaitingText;
    this.isFullyTyped = false;
    if (this.onSpeakerChange) this.onSpeakerChange(speaker);
  }

  public addLiveExecutionStep(step: ExecutionStep): void {
    if (!this.currentLine) {
      this.currentLine = { speaker: this.waitingSpeaker || 'paco', text: this.waitingMessage || 'Pensando... ⏳', executionSteps: [] };
    }
    if (!this.currentLine.executionSteps) {
      this.currentLine.executionSteps = [];
    }
    if (!this.currentLine.executionSteps.some(s => s.id === step.id)) {
      this.currentLine.executionSteps.push(step);
      this.audioService.playHint();
    }
  }

  public beginLiveTokens(speaker: SpeakerType, prefix: string): void {
    this.isWaitingBackend = false;
    this.isStreaming = true;
    if (this.currentLine) {
      this.currentLine.speaker = speaker;
      this.currentLine.text = prefix;
    } else {
      this.currentLine = { speaker, text: prefix, executionSteps: [] };
    }
    this.displayedText = prefix;
    this.isFullyTyped = false;
    if (this.onSpeakerChange) this.onSpeakerChange(speaker);
  }

  public finishLiveAgentTurn(): void {
    this.isStreaming = false;
    this.isWaitingBackend = false;
    this.isFullyTyped = true;
  }

  public appendStreamToken(token: string): void {
    if (this.currentLine) {
      this.currentLine.text += token;
      this.displayedText = this.currentLine.text;
      if (Math.random() < 0.35) {
        this.audioService.playTalk();
      }
    }
  }

  public finishStreamingLine(): void {
    this.isStreaming = false;
    this.isFullyTyped = true;
  }

  public setStreamExecutionSteps(steps: ExecutionStep[]): void {
    if (this.currentLine) {
      this.currentLine.executionSteps = steps;
    }
  }

  public attachPhotosToCurrentLine(photos: number[]): void {
    if (this.currentLine) {
      if (!this.currentLine.photos) {
        this.currentLine.photos = [];
      }
      for (const p of photos) {
        if (!this.currentLine.photos.includes(p)) {
          this.currentLine.photos.push(p);
        }
      }
    }
  }

  public startWaitingBackend(speaker: SpeakerType, message: string): void {
    this.isWaitingBackend = true;
    this.waitingSpeaker = speaker;
    this.waitingMessage = message;
    this.waitingDotsTimer = 0;
  }

  public deliverBackendResponse(
    text: string,
    speaker: SpeakerType = 'paco',
    executionSteps?: ExecutionStep[],
    photos?: number[]
  ): void {
    this.isWaitingBackend = false;
    // Si la línea activa era la de espera ("relojito") o ya no hay línea en pantalla:
    if (this.currentLine && this.currentLine.speaker === this.waitingSpeaker && this.currentLine.text.includes('⏳')) {
      this.currentLine = { speaker, text, executionSteps, photos };
      this.displayedText = '';
      this.isFullyTyped = false;
      this.charTimer = 0;
      if (this.onSpeakerChange) this.onSpeakerChange(speaker);
    } else if (!this.currentLine) {
      this.currentLine = { speaker, text, executionSteps, photos };
      this.displayedText = '';
      this.isFullyTyped = false;
      this.charTimer = 0;
      if (this.onSpeakerChange) this.onSpeakerChange(speaker);
    } else {
      // Twinber aún está diciendo su frase: se encola detrás
      this.queue.push({ speaker, text, executionSteps, photos });
    }
  }

  public enqueue(lines: DialogueLine[]): void {
    this.queue.push(...lines);
    if (!this.currentLine) {
      this.playNext();
    }
  }

  public advanceOrSkip(): void {
    if (!this.currentLine) return;
    if (this.isStreaming) return; // No interrumpir mientras se reciben tokens de la red
    if (this.isWaitingBackend && this.currentLine.text.includes('⏳')) {
      // Si estamos esperando al backend con el relojito, no avanzar hasta recibir respuesta
      return;
    }
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
    this.isStreaming = false;
    this.isWaitingBackend = false;
    if (this.onSpeakerChange) this.onSpeakerChange(null);
  }

  private playNext(): void {
    if (this.queue.length === 0) {
      // Si la cola se vació pero el backend aún está procesando, mostrar línea de espera con relojito
      if (this.isWaitingBackend) {
        this.currentLine = {
          speaker: this.waitingSpeaker,
          text: this.waitingMessage || 'Consultando el códice y analizando la isla... ⏳'
        };
        this.displayedText = this.currentLine.text;
        this.isFullyTyped = false;
        if (this.onSpeakerChange) this.onSpeakerChange(this.waitingSpeaker);
        return;
      }

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
    if (this.isStreaming) return;

    // Animación de puntos del relojito de espera
    if (this.isWaitingBackend && this.currentLine.text.includes('⏳')) {
      this.waitingDotsTimer++;
      const base = this.waitingMessage.replace(/[\.⏳\s]+$/, '');
      const dots = ['.', '..', '...'][Math.floor(this.waitingDotsTimer / 18) % 3];
      this.currentLine.text = `${base} ${dots} ⏳`;
      this.displayedText = this.currentLine.text;
      return;
    }

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
  }
}
