// ==============================================================================
// PRESENTATION: ScummDockView (Dock Flotante: Línea de Frase, Verbos, Inventario y Diálogos)
// ==============================================================================
import { VerbType } from '../domain/types';
import { ActionDispatcher } from '../application/ActionDispatcher';
import { AudioService } from '../infrastructure/AudioService';

export class ScummDockView {
  private sentenceActionElem: HTMLElement;
  private actionDispatcher: ActionDispatcher;
  private audioService: AudioService;

  private dockVerbsInventory: HTMLElement;
  private dockDialogue: HTMLElement;
  private dialogueFreeForm: HTMLFormElement;
  private dialogueFreeInput: HTMLInputElement;

  constructor(actionDispatcher: ActionDispatcher, audioService: AudioService) {
    this.actionDispatcher = actionDispatcher;
    this.audioService = audioService;
    this.sentenceActionElem = document.getElementById('sentence-action')!;
    this.dockVerbsInventory = document.getElementById('dock-verbs-inventory')!;
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
      if (updates.bananas !== undefined) {
        const bananaBadge = document.getElementById('sidebar-banana-badge');
        if (bananaBadge) bananaBadge.innerText = `${updates.bananas}/3 🍌`;
      }
    };

    this.actionDispatcher.onDialogueModeChange = (active: boolean) => {
      if (active) {
        this.dockVerbsInventory.classList.add('hidden');
        this.dockDialogue.classList.remove('hidden', 'dialogue-speaking');
        if (this.dialogueFreeInput) this.dialogueFreeInput.value = '';
      } else {
        this.dockDialogue.classList.add('hidden');
        this.dockVerbsInventory.classList.remove('hidden');
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

    // Slots de Inventario (Flancos Izquierdo y Derecho)
    document.querySelectorAll<HTMLElement>('.inventory-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const item = slot.dataset.item;
        if (!item) return;

        // 1. Mapa de Tenerife -> Activar inmediatamente modo VIAJAR
        if (item === 'Mapa de Tenerife') {
          this.audioService.playClick();
          this.actionDispatcher.setVerb('VIAJAR');
          document.querySelectorAll<HTMLButtonElement>('.verb-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.verb === 'VIAJAR');
          });
          return;
        }

        // 2. Álbum de Fotos -> Abrir modal directamente
        if (item === 'Álbum de Fotos') {
          if (this.actionDispatcher.photoAlbumModal) {
            this.actionDispatcher.photoAlbumModal.open();
            return;
          }
        }

        // 3. Pasaporte de Explorador -> Abrir modal directamente
        if (item === 'Pasaporte de Explorador') {
          if (this.actionDispatcher.passportModal) {
            this.actionDispatcher.passportModal.open();
            return;
          }
        }

        // 4. Objetos bloqueados de compra (Gofio, Comanda, Billete, Plátano) -> Inspección directa
        if (slot.classList.contains('locked-slot')) {
          this.audioService.playClick();
          this.actionDispatcher.inspectLockedItem(item);
          return;
        }

        // Limpiar selección previa o alternar para otros verbos (USAR, etc.)
        const isSelected = slot.classList.contains('selected');
        document.querySelectorAll('.inventory-slot').forEach(s => s.classList.remove('selected'));

        if (!isSelected) {
          slot.classList.add('selected');
          this.actionDispatcher.selectItem(item);
          this.audioService.playClick();
          // Resaltar USAR en la botonera
          document.querySelectorAll<HTMLButtonElement>('.verb-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.verb === 'USAR');
          });
        } else {
          this.actionDispatcher.selectItem(item); // deselecciona
          this.audioService.playClick();
          // Volver al verbo activo
          document.querySelectorAll<HTMLButtonElement>('.verb-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.verb === this.actionDispatcher.activeVerb);
          });
        }
      });

      // Clic directo en la insignia/badge (ej. 0/10 o 0/28) siempre abre el modal
      const badge = slot.querySelector('.slot-badge');
      if (badge) {
        badge.addEventListener('click', (e) => {
          e.stopPropagation();
          if (slot.dataset.item === 'Álbum de Fotos' && this.actionDispatcher.photoAlbumModal) {
            this.actionDispatcher.photoAlbumModal.open();
          }
          if (slot.dataset.item === 'Pasaporte de Explorador' && this.actionDispatcher.passportModal) {
            this.actionDispatcher.passportModal.open();
          }
          if (slot.dataset.item === 'Mapa de Tenerife') {
            this.actionDispatcher.setVerb('VIAJAR');
            document.querySelectorAll<HTMLButtonElement>('.verb-btn').forEach(b => {
              b.classList.toggle('active', b.dataset.verb === 'VIAJAR');
            });
          }
        });
      }

      // Doble clic en cualquier momento en el álbum o pasaporte para abrirlo
      slot.addEventListener('dblclick', () => {
        if (slot.dataset.item === 'Álbum de Fotos' && this.actionDispatcher.photoAlbumModal) {
          this.actionDispatcher.photoAlbumModal.open();
        }
        if (slot.dataset.item === 'Pasaporte de Explorador' && this.actionDispatcher.passportModal) {
          this.actionDispatcher.passportModal.open();
        }
        if (slot.dataset.item === 'Mapa de Tenerife') {
          this.actionDispatcher.setVerb('VIAJAR');
          document.querySelectorAll<HTMLButtonElement>('.verb-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.verb === 'VIAJAR');
          });
        }
      });

      slot.addEventListener('mouseenter', () => {
        const item = slot.dataset.item;
        if (item) this.actionDispatcher.setHoverTarget(item);
      });
      slot.addEventListener('mouseleave', () => {
        this.actionDispatcher.setHoverTarget('');
      });
    });

    // Botones de Opciones de Diálogo
    document.querySelectorAll<HTMLButtonElement>('.dialogue-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.dataset.choice as 'passport' | 'lore' | 'exit';
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
