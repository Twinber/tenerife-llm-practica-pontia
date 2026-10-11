// ==============================================================================
// PRESENTATION: ScummDockView (Barra de Acción Contextual, Inventario y Diálogos)
// ==============================================================================
import { ActionDispatcher } from '../application/ActionDispatcher';
import { AudioService } from '../infrastructure/AudioService';

export class ScummDockView {
  private sentenceActionElem: HTMLElement;
  private actionDispatcher: ActionDispatcher;
  private audioService: AudioService;

  private dockDialogue: HTMLElement;
  private dialogueFreeForm: HTMLFormElement;
  private dialogueFreeInput: HTMLInputElement;

  constructor(actionDispatcher: ActionDispatcher, audioService: AudioService) {
    this.actionDispatcher = actionDispatcher;
    this.audioService = audioService;
    this.sentenceActionElem = document.getElementById('sentence-action')!;
    this.dockDialogue = document.getElementById('dock-dialogue')!;
    this.dialogueFreeForm = document.getElementById('dialogue-free-form') as HTMLFormElement;
    this.dialogueFreeInput = document.getElementById('dialogue-free-input') as HTMLInputElement;

    this.bindEvents();

    this.actionDispatcher.onSentenceChange = (text: string) => {
      this.sentenceActionElem.innerText = text;
    };

    this.actionDispatcher.onStateUpdate = (updates) => {
      if (updates.photos) {
        const albumBadge = document.getElementById('sidebar-album-badge');
        if (albumBadge) albumBadge.innerText = updates.photos;
      }
      if (updates.passport) {
        const passportBadge = document.getElementById('sidebar-passport-badge');
        if (passportBadge) passportBadge.innerText = updates.passport;
      }
      if (updates.coins !== undefined) {
        const coinBadge = document.querySelector<HTMLElement>('[data-item="Bolsa de Monedas de Oro"] .slot-badge');
        if (coinBadge) coinBadge.innerText = `${updates.coins} 💰`;
      }
      if (updates.items !== undefined) {
        this.renderRightSidebar(updates.items);
      }
    };

    this.actionDispatcher.onDialogueModeChange = (active: boolean) => {
      if (active) {
        this.dockDialogue.classList.remove('hidden', 'dialogue-speaking');
        if (this.dialogueFreeInput) this.dialogueFreeInput.value = '';
      } else {
        this.dockDialogue.classList.add('hidden');
      }
    };

    this.actionDispatcher.onDialogueSpeechState = (isSpeaking: boolean) => {
      if (isSpeaking) {
        this.dockDialogue.classList.add('dialogue-speaking');
      } else {
        if (this.actionDispatcher.isInNpcDialogue) {
          this.dockDialogue.classList.remove('dialogue-speaking');
          if (this.dialogueFreeInput) this.dialogueFreeInput.value = '';
        }
      }
    };
  }

  public renderRightSidebar(items: Array<{ name: string; icon: string; count?: number }>): void {
    for (let i = 0; i < 4; i++) {
      const slot = document.getElementById(`slot-obj-${i}`);
      if (!slot) continue;

      if (items && items[i]) {
        const item = items[i];
        slot.className = 'inventory-slot';
        slot.dataset.item = item.name;
        slot.title = item.name;
        const countBadge = item.count && item.count > 1 ? `<span class="slot-badge">x${item.count}</span>` : '';
        slot.innerHTML = `<img src="${item.icon}" alt="${item.name}">${countBadge}`;
        this.bindSlotClick(slot);
      } else {
        slot.className = 'inventory-slot empty-slot';
        delete slot.dataset.item;
        slot.removeAttribute('title');
        slot.innerHTML = '';
      }
    }
  }

  private bindSlotClick(slot: HTMLElement): void {
    slot.onclick = () => {
      if (slot.classList.contains('empty-slot')) return;
      const item = slot.dataset.item;
      if (!item) return;
      this.actionDispatcher.selectItem(item);
    };

    slot.onmouseenter = () => {
      if (slot.classList.contains('empty-slot')) return;
      const item = slot.dataset.item;
      if (item) this.actionDispatcher.setHoverTarget(item, 'item');
    };

    slot.onmouseleave = () => {
      this.actionDispatcher.setHoverTarget('');
    };

    slot.ondblclick = () => {
      if (slot.classList.contains('empty-slot')) return;
      const item = slot.dataset.item;
      if (item) this.actionDispatcher.selectItem(item);
    };
  }

  private bindEvents(): void {
    // Vincular slots de inventario existentes (Franja Izquierda y Ranuras Iniciales)
    document.querySelectorAll<HTMLElement>('.inventory-slot').forEach(slot => {
      this.bindSlotClick(slot);
    });

    // Botones de Opciones de Diálogo
    document.querySelectorAll<HTMLButtonElement>('.dialogue-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.dataset.choice as 'passport' | 'lore' | 'buy' | 'exit';
        if (choice) {
          this.audioService.playClick();
          this.actionDispatcher.selectDialogueChoice(choice);
        }
      });
    });

    // Formulario de Input Abierto de Diálogo
    if (this.dialogueFreeForm) {
      this.dialogueFreeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = this.dialogueFreeInput.value.trim();
        if (text) {
          this.audioService.playClick();
          this.actionDispatcher.selectDialogueChoice('custom', text);
        }
      });
    }

    // Teclas de acceso rápido en modo Diálogo (1, 2, 3, 4, Escape)
    window.addEventListener('keydown', (e) => {
      if (!this.actionDispatcher.isInNpcDialogue) return;
      if (this.actionDispatcher.isDialogueSpeaking) return;

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === '1') {
        this.audioService.playClick();
        this.actionDispatcher.selectDialogueChoice('passport');
      } else if (e.key === '2') {
        this.audioService.playClick();
        this.actionDispatcher.selectDialogueChoice('lore');
      } else if (e.key === '3') {
        if (this.dialogueFreeInput) this.dialogueFreeInput.focus();
      } else if (e.key === '4' || e.key === 'Escape') {
        this.audioService.playClick();
        this.actionDispatcher.selectDialogueChoice('exit');
      }
    });
  }
}
