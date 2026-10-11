// ==============================================================================
// PRESENTATION: ScummDockView (Dock Flotante: Línea de Frase, Verbos e Inventario)
// ==============================================================================
import { VerbType } from '../domain/types';
import { ActionDispatcher } from '../application/ActionDispatcher';
import { AudioService } from '../infrastructure/AudioService';

export class ScummDockView {
  private sentenceActionElem: HTMLElement;
  private actionDispatcher: ActionDispatcher;
  private audioService: AudioService;

  constructor(actionDispatcher: ActionDispatcher, audioService: AudioService) {
    this.actionDispatcher = actionDispatcher;
    this.audioService = audioService;
    this.sentenceActionElem = document.getElementById('sentence-action')!;

    this.bindEvents();

    this.actionDispatcher.onSentenceChange = (text: string) => {
      this.sentenceActionElem.innerText = text;
    };
  }

  private bindEvents(): void {
    // Botones de Verbos
    document.querySelectorAll<HTMLButtonElement>('.verb-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.verb-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const verb = btn.dataset.verb as VerbType;
        this.actionDispatcher.setVerb(verb);
      });
    });

    // Slots de Inventario
    document.querySelectorAll<HTMLElement>('.inventory-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const item = slot.dataset.item;
        if (!item) return;
        this.audioService.playCoin();
        this.actionDispatcher.setHoverTarget(`con ${item}`);
      });
      slot.addEventListener('mouseenter', () => {
        const item = slot.dataset.item;
        if (item) this.actionDispatcher.setHoverTarget(item);
      });
      slot.addEventListener('mouseleave', () => {
        this.actionDispatcher.setHoverTarget('');
      });
    });
  }
}
