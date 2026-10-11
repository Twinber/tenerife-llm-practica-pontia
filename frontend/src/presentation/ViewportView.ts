// ==============================================================================
// PRESENTATION: ViewportView (Renderizado del Escenario, Actores y Diálogos)
// ==============================================================================
import { Actor } from '../domain/Actor';
import { AssetLoader } from '../infrastructure/AssetLoader';
import { DialogueManager } from '../application/DialogueManager';
import { ActionDispatcher } from '../application/ActionDispatcher';

export class ViewportView {
  private viewportElem: HTMLElement;
  private twinberElem: HTMLImageElement;
  private pacoElem: HTMLImageElement;
  private dialogueContainer: HTMLElement;
  private assetLoader: AssetLoader;
  private twinber: Actor;
  private paco: Actor;
  private dialogueManager: DialogueManager;
  private actionDispatcher: ActionDispatcher;

  constructor(
    twinber: Actor,
    paco: Actor,
    dialogueManager: DialogueManager,
    actionDispatcher: ActionDispatcher,
    assetLoader: AssetLoader
  ) {
    this.twinber = twinber;
    this.paco = paco;
    this.dialogueManager = dialogueManager;
    this.actionDispatcher = actionDispatcher;
    this.assetLoader = assetLoader;

    this.viewportElem = document.getElementById('scene-viewport')!;
    this.twinberElem = document.getElementById('twinber-actor') as HTMLImageElement;
    this.pacoElem = document.getElementById('paco-actor') as HTMLImageElement;
    this.dialogueContainer = document.getElementById('dialogue-container')!;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Avanzar diálogo con tecla Espacio o Enter
    window.addEventListener('keydown', (e) => {
      if ((e.key === ' ' || e.key === 'Enter') && this.dialogueManager.currentLine) {
        e.preventDefault();
        this.dialogueManager.advanceOrSkip();
      }
    });

    // Clic en el propio contenedor del diálogo para avanzar
    this.dialogueContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dialogueManager.advanceOrSkip();
    });

    // Clic en el suelo
    this.viewportElem.addEventListener('click', (e) => {
      if (this.dialogueManager.currentLine) {
        this.dialogueManager.advanceOrSkip();
        return;
      }
      const target = e.target as HTMLElement;
      if (target.classList.contains('hotspot') || target.id === 'paco-actor') return;

      const rect = this.viewportElem.getBoundingClientRect();
      const clickXPct = ((e.clientX - rect.left) / rect.width) * 100;
      const minX = this.twinber.minX ?? 18;
      const maxX = this.twinber.maxX ?? 72;
      const targetX = Math.max(minX, Math.min(maxX, clickXPct));
      this.actionDispatcher.clickGround(targetX);
    });

    // Paco clic & hover
    this.pacoElem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.actionDispatcher.interactWithHotspot('hotspot-paco', 'Paco el Pescador');
    });
    this.pacoElem.addEventListener('mouseenter', () => {
      this.actionDispatcher.setHoverTarget('Paco el Pescador');
    });
    this.pacoElem.addEventListener('mouseleave', () => {
      this.actionDispatcher.setHoverTarget('');
    });

    // Hotspots
    this.bindHotspot('hotspot-paco', 'Paco el Pescador');
    this.bindHotspot('hotspot-barca', 'Barca "El Mojo"');
    this.bindHotspot('hotspot-teide', 'El Teide en la cumbre');
    this.bindHotspot('hotspot-casa', 'Casa Colonial Balcón de Tea');
    this.bindHotspot('hotspot-faro', 'Faro y Fortín de San Telmo');
  }

  private bindHotspot(id: string, name: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('mouseenter', () => this.actionDispatcher.setHoverTarget(name));
    el.addEventListener('mouseleave', () => this.actionDispatcher.setHoverTarget(''));
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.actionDispatcher.interactWithHotspot(id, name);
    });
  }

  public render(): void {
    // 1. Renderizar Twinber
    this.twinberElem.style.left = `${this.twinber.xPct}%`;
    this.twinberElem.style.transform = `scaleX(${this.twinber.facing})`;
    const tSrc = this.assetLoader.getActorSpritePath(
      'twinber',
      this.twinber.state,
      this.twinber.frameIdx
    );
    if (this.twinberElem.getAttribute('src') !== tSrc) {
      this.twinberElem.src = tSrc;
    }

    // 2. Renderizar Paco
    this.pacoElem.style.left = `${this.paco.xPct}%`;
    this.pacoElem.style.transform = `scaleX(${this.paco.facing})`;
    const pSrc = this.assetLoader.getActorSpritePath(
      'paco',
      this.paco.state,
      this.paco.frameIdx
    );
    if (this.pacoElem.getAttribute('src') !== pSrc) {
      this.pacoElem.src = pSrc;
    }

    // 3. Renderizar Subtítulo con botón interactivo de continuación
    if (this.dialogueManager.currentLine) {
      const isTyped = this.dialogueManager.isFullyTyped;
      const speaker = this.dialogueManager.currentLine.speaker;
      this.dialogueContainer.innerHTML = `
        <div class="dialogue-bubble ${speaker}">
          <div class="dialogue-body">${this.dialogueManager.displayedText}</div>
          <button id="btn-dialogue-continue" class="dialogue-continue-btn ${isTyped ? 'ready' : 'typing'}">
            ${isTyped ? '▶ CONTINUAR [ESPACIO]' : '...'}
          </button>
        </div>
      `;

      const btn = document.getElementById('btn-dialogue-continue');
      if (btn) {
        btn.onclick = (e) => {
          e.stopPropagation();
          this.dialogueManager.advanceOrSkip();
        };
      }
    } else {
      this.dialogueContainer.innerHTML = '';
    }
  }
}
