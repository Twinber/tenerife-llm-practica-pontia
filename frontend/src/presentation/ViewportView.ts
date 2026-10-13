// ==============================================================================
// PRESENTATION: ViewportView (Renderizado del Escenario, Actores y Diálogos)
// ==============================================================================
import { Actor } from '../domain/Actor';
import { AssetLoader } from '../infrastructure/AssetLoader';
import { DialogueManager } from '../application/DialogueManager';
import { ActionDispatcher } from '../application/ActionDispatcher';
import { HotspotLocationDef } from '../domain/locationsData';

export class ViewportView {
  private viewportElem: HTMLElement;
  private twinberElem: HTMLImageElement;
  private pacoElem: HTMLImageElement;
  private dialogueContainer: HTMLElement;
  private hotspotsContainer: HTMLElement;
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
    this.hotspotsContainer = document.getElementById('hotspots-container')!;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Avanzar diálogo con tecla Espacio o Enter
    window.addEventListener('keydown', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

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

    // Clic en el escenario (avanza diálogos o cancela menú)
    this.viewportElem.addEventListener('click', (e) => {
      if (this.dialogueManager.currentLine) {
        this.dialogueManager.advanceOrSkip();
        return;
      }
      const target = e.target as HTMLElement;
      if (target.classList.contains('hotspot') || target.id === 'paco-actor') return;
      if (this.actionDispatcher.isInNpcDialogue) {
        this.actionDispatcher.endNpcDialogue();
      }
    });

    // NPC activo: clic & hover
    this.pacoElem.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.dialogueManager.currentLine) {
        this.dialogueManager.advanceOrSkip();
        return;
      }
      this.actionDispatcher.talkToCurrentNpc();
    });

    // Clic en el dock de acción inferior (avanza diálogo si el NPC o Twinber están hablando)
    const actionDock = document.getElementById('action-dock');
    if (actionDock) {
      actionDock.addEventListener('click', () => {
        if (this.dialogueManager.currentLine) {
          this.dialogueManager.advanceOrSkip();
        }
      });
    }
    this.pacoElem.addEventListener('mouseenter', () => {
      const npcName = this.actionDispatcher.currentLocation.npc?.name || 'Personaje';
      this.actionDispatcher.setHoverTarget(npcName, 'npc');
    });
    this.pacoElem.addEventListener('mouseleave', () => {
      this.actionDispatcher.setHoverTarget('');
    });
  }

  public renderHotspots(hotspots: HotspotLocationDef[]): void {
    if (!this.hotspotsContainer) return;
    this.hotspotsContainer.innerHTML = '';

    for (const h of hotspots) {
      const el = document.createElement('div');
      el.id = h.id;
      el.className = 'hotspot';
      el.title = h.title || h.name;
      el.style.left = `${h.leftPct}%`;
      if (h.topPct !== undefined) el.style.top = `${h.topPct}%`;
      if (h.bottomPct !== undefined) el.style.bottom = `${h.bottomPct}%`;
      el.style.width = `${h.widthPct}%`;
      el.style.height = `${h.heightPct}%`;

      el.addEventListener('mouseenter', () => {
        this.actionDispatcher.setHoverTarget(h.name, h.type);
      });
      el.addEventListener('mouseleave', () => {
        this.actionDispatcher.setHoverTarget('');
      });
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.actionDispatcher.interactWithHotspotDef(h);
      });

      this.hotspotsContainer.appendChild(el);
    }
  }

  public async transitionScene(
    bgImage: string,
    hudTitle: string,
    npcName?: string,
    npcVisible: boolean = true,
    onSceneReady?: () => void
  ): Promise<void> {
    const overlay = document.getElementById('scene-fade-overlay');
    if (overlay) {
      overlay.classList.add('active');
      await new Promise(r => setTimeout(r, 220));
    }

    // Pre-cargar la imagen en memoria antes de intercambiar el fondo
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = bgImage;
    });

    this.updateScene(bgImage, hudTitle, npcName, npcVisible);

    if (onSceneReady) {
      onSceneReady();
    }

    await new Promise(r => setTimeout(r, 50));
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  public updateScene(bgImage: string, hudTitle: string, npcName?: string, npcVisible: boolean = true): void {
    const bgElem = this.viewportElem.querySelector('.scene-background') as HTMLImageElement;
    if (bgElem && bgImage) {
      bgElem.src = bgImage;
    }
    const hudElem = document.querySelector('.hud-title') as HTMLElement;
    if (hudElem) {
      hudElem.innerText = hudTitle;
    }
    if (this.pacoElem) {
      this.pacoElem.style.display = npcVisible ? 'block' : 'none';
      if (npcName) this.pacoElem.title = npcName;
    }
  }

  public render(): void {
    // 1. Renderizar Twinber
    this.twinberElem.style.left = `${this.twinber.xPct}%`;
    this.twinberElem.style.bottom = `${this.twinber.bottomPct}%`;
    this.twinberElem.style.transform = `translateX(-50%) scaleX(${this.twinber.facing})`;
    const tSrc = this.assetLoader.getActorSpritePath(
      'twinber',
      this.twinber.state,
      this.twinber.frameIdx
    );
    if (this.twinberElem.getAttribute('src') !== tSrc) {
      this.twinberElem.src = tSrc;
    }

    // 2. Renderizar NPC Activo del Escenario
    const currentNpc = this.actionDispatcher.currentLocation.npc;
    if (currentNpc) {
      this.pacoElem.style.display = 'block';
      this.pacoElem.style.left = `${this.paco.xPct}%`;
      this.pacoElem.style.bottom = `${this.paco.bottomPct}%`;
      this.pacoElem.style.transform = `translateX(-50%) scaleX(${this.paco.facing})`;
      const npcActorId = currentNpc.id || this.paco.id || 'paco';
      const pSrc = this.assetLoader.getActorSpritePath(
        npcActorId,
        this.paco.state,
        this.paco.frameIdx
      );
      if (this.pacoElem.getAttribute('src') !== pSrc) {
        this.pacoElem.src = pSrc;
      }
    } else {
      this.pacoElem.style.display = 'none';
    }

    // 3. Renderizar Subtítulo con DOM estable y botón interactivo
    if (this.dialogueManager.currentLine) {
      const isTyped = this.dialogueManager.isFullyTyped;
      const speaker = this.dialogueManager.currentLine.speaker;
      const isWaiting = this.dialogueManager.isWaitingBackend && this.dialogueManager.currentLine.text.includes('⏳');

      let bubble = this.dialogueContainer.querySelector('.dialogue-bubble') as HTMLElement;
      let body = this.dialogueContainer.querySelector('.dialogue-body') as HTMLElement;
      let btn = document.getElementById('btn-dialogue-continue') as HTMLButtonElement;

      if (!bubble || !body || !btn) {
        this.dialogueContainer.innerHTML = `
          <div class="dialogue-bubble ${speaker}">
            <div class="dialogue-body">${this.dialogueManager.displayedText}</div>
            <button id="btn-dialogue-continue" class="dialogue-continue-btn ${isWaiting ? 'waiting' : (isTyped ? 'ready' : 'typing')}">
              ${isWaiting ? '<span class="dialogue-clock-icon">⏳</span> PENSANDO...' : (isTyped ? '▶ CONTINUAR [ESPACIO]' : '...')}
            </button>
          </div>
        `;
        btn = document.getElementById('btn-dialogue-continue') as HTMLButtonElement;
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            this.dialogueManager.advanceOrSkip();
          };
        }
      } else {
        bubble.className = `dialogue-bubble ${speaker}`;
        if (body.textContent !== this.dialogueManager.displayedText) {
          body.textContent = this.dialogueManager.displayedText;
        }
        const targetBtnClass = `dialogue-continue-btn ${isWaiting ? 'waiting' : (isTyped ? 'ready' : 'typing')}`;
        if (btn.className !== targetBtnClass) {
          btn.className = targetBtnClass;
        }
        const targetBtnHtml = isWaiting 
          ? '<span class="dialogue-clock-icon">⏳</span> PENSANDO...' 
          : (isTyped ? '▶ CONTINUAR [ESPACIO]' : '...');
        if (btn.innerHTML !== targetBtnHtml) {
          btn.innerHTML = targetBtnHtml;
        }
      }
    } else {
      if (this.dialogueContainer.innerHTML !== '') {
        this.dialogueContainer.innerHTML = '';
      }
    }
  }
}
