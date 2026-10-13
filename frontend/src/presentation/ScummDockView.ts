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
  private currentKeyActions: Record<string, () => void> = {};

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

    this.actionDispatcher.onDialogueModeChange = (
      active: boolean,
      npcName?: string,
      shopItem?: { name: string; price: number },
      twinBrotherName?: string
    ) => {
      if (active) {
        this.dockDialogue.classList.remove('hidden');
        if (this.actionDispatcher.isDialogueSpeaking) {
          this.dockDialogue.classList.add('dialogue-speaking');
        } else {
          this.dockDialogue.classList.remove('dialogue-speaking');
        }
        if (this.dialogueFreeInput) {
          this.dialogueFreeInput.value = '';
          this.dialogueFreeInput.placeholder = `Escribe tu propia pregunta a ${npcName || 'personaje'}...`;
        }

        const twinBtn = document.getElementById('dialogue-choice-twin');
        const twinNum = document.getElementById('dialogue-twin-num');
        const buyBtn = document.getElementById('dialogue-choice-buy');
        const buyText = document.getElementById('dialogue-buy-text');
        const buyNum = document.querySelector<HTMLElement>('#dialogue-choice-buy .choice-num');
        const inputNum = document.getElementById('dialogue-input-num');
        const exitNum = document.getElementById('dialogue-exit-num');

        this.currentKeyActions = {};
        let currentNum = 1;

        // Opción 1: Pasaporte
        this.currentKeyActions[String(currentNum)] = () => this.actionDispatcher.selectDialogueChoice('passport');
        currentNum++;

        // Opción 2: Lore de la zona
        this.currentKeyActions[String(currentNum)] = () => this.actionDispatcher.selectDialogueChoice('lore');
        currentNum++;

        // Opción 3 (Opcional): Hermano Gemelo ("¿Nos conocemos?")
        if (twinBrotherName && twinBtn) {
          twinBtn.classList.remove('hidden');
          twinBtn.style.display = 'flex';
          if (twinNum) twinNum.innerText = `${currentNum}.`;
          const key = String(currentNum);
          this.currentKeyActions[key] = () => this.actionDispatcher.selectDialogueChoice('twin');
          currentNum++;
        } else if (twinBtn) {
          twinBtn.classList.add('hidden');
          twinBtn.style.display = 'none';
        }

        // Opción 4 (Opcional): Comprar artículo de tienda
        if (shopItem && buyBtn && buyText) {
          buyBtn.classList.remove('hidden');
          buyBtn.style.display = 'flex';
          buyText.innerText = `"Comprar ${shopItem.name} (${shopItem.price} 💰)"`;
          if (buyNum) buyNum.innerText = `${currentNum}.`;
          const key = String(currentNum);
          this.currentKeyActions[key] = () => this.actionDispatcher.selectDialogueChoice('buy');
          currentNum++;
        } else if (buyBtn && buyText) {
          buyBtn.classList.add('hidden');
          buyBtn.style.display = 'none';
          buyText.innerText = '';
        }

        // Opción abierta: Input de texto
        if (inputNum) inputNum.innerText = `${currentNum}.`;
        const inputKey = String(currentNum);
        this.currentKeyActions[inputKey] = () => {
          if (this.dialogueFreeInput) this.dialogueFreeInput.focus();
        };
        currentNum++;

        // Despedida
        if (exitNum) exitNum.innerText = `${currentNum}.`;
        const exitKey = String(currentNum);
        this.currentKeyActions[exitKey] = () => this.actionDispatcher.selectDialogueChoice('exit');
      } else {
        this.dockDialogue.classList.add('hidden');
        this.dockDialogue.classList.remove('dialogue-speaking');
        this.currentKeyActions = {};
      }
    };

    this.actionDispatcher.onDialogueSpeechState = (isSpeaking: boolean) => {
      if (isSpeaking || this.actionDispatcher.isWaitingBackend) {
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
        if (this.actionDispatcher.isDialogueSpeaking || this.actionDispatcher.isWaitingBackend) return;
        const choice = btn.dataset.choice as 'passport' | 'lore' | 'twin' | 'buy' | 'exit';
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
        if (this.actionDispatcher.isDialogueSpeaking || this.actionDispatcher.isWaitingBackend) return;
        const text = this.dialogueFreeInput.value.trim();
        if (text) {
          this.audioService.playClick();
          this.actionDispatcher.selectDialogueChoice('custom', text);
        }
      });
    }

    // Teclas de acceso rápido en modo Diálogo (Mapeo dinámico 1, 2, 3, 4, 5, 6 y Escape)
    window.addEventListener('keydown', (e) => {
      if (!this.actionDispatcher.isInNpcDialogue) return;
      if (this.actionDispatcher.isDialogueSpeaking || this.actionDispatcher.isWaitingBackend) return;

      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        this.audioService.playClick();
        this.actionDispatcher.selectDialogueChoice('exit');
      } else if (this.currentKeyActions[e.key]) {
        this.audioService.playClick();
        this.currentKeyActions[e.key]();
      }
    });
  }
}
