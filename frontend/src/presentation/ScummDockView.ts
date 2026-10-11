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

    this.actionDispatcher.onStateUpdate = (updates) => {
      if (updates.photos) {
        const albumSlot = document.querySelector<HTMLElement>('[data-item="Álbum de Fotos"] .slot-badge');
        if (albumSlot) albumSlot.innerText = updates.photos;
      }
      if (updates.passport) {
        const passportSlot = document.querySelector<HTMLElement>('[data-item="Pasaporte de Explorador"] .slot-badge');
        if (passportSlot) passportSlot.innerText = updates.passport;
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

    // Slots de Inventario
    document.querySelectorAll<HTMLElement>('.inventory-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const item = slot.dataset.item;
        if (!item) return;

        // Si el verbo activo es MIRAR y clican en Álbum de Fotos, abrir modal
        if (this.actionDispatcher.activeVerb === 'MIRAR' && item === 'Álbum de Fotos') {
          this.actionDispatcher.selectItem(item);
          return;
        }

        // Limpiar selección previa o alternar
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

      // Doble clic en cualquier momento en el álbum para abrirlo
      slot.addEventListener('dblclick', () => {
        if (slot.dataset.item === 'Álbum de Fotos' && this.actionDispatcher.photoAlbumModal) {
          this.actionDispatcher.photoAlbumModal.open();
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
  }
}
