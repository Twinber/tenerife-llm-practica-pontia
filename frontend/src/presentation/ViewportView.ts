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

    // NPC activo: clic & hover
    this.pacoElem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.actionDispatcher.talkToCurrentNpc();
    });
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
    this.twinberElem.style.transform = `translateX(-50%) scaleX(${this.twinber.facing})`;
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
    this.pacoElem.style.transform = `translateX(-50%) scaleX(${this.paco.facing})`;
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
