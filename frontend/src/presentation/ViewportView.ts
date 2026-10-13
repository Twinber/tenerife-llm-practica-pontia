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
  public isTraceExpanded: boolean = false;
  private lastStepsHash: string = '';

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
      const target = e.target as HTMLElement;
      if (
        target.closest('.agent-trace-container') ||
        target.closest('.step-details-toggle') ||
        target.closest('.trace-step-json')
      ) {
        return;
      }
      this.dialogueManager.advanceOrSkip();
    });

    // Clic en el escenario (avanza diálogos o cancela menú)
    this.viewportElem.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('#dialogue-container')) return;
      if (this.dialogueManager.currentLine) {
        this.dialogueManager.advanceOrSkip();
        return;
      }
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
      const steps = this.dialogueManager.currentLine.executionSteps;

      let bubble = this.dialogueContainer.querySelector('.dialogue-bubble') as HTMLElement;
      let traceBox = this.dialogueContainer.querySelector('#agent-trace-container') as HTMLElement;
      let body = this.dialogueContainer.querySelector('.dialogue-body') as HTMLElement;
      let btn = document.getElementById('btn-dialogue-continue') as HTMLButtonElement;

      if (!bubble || !body || !btn) {
        this.dialogueContainer.innerHTML = `
          <div class="dialogue-bubble ${speaker}${this.isTraceExpanded ? ' has-expanded-trace' : ''}">
            <div id="agent-trace-container" class="agent-trace-container" style="display: none;"></div>
            <div class="dialogue-body">${this.dialogueManager.displayedText}</div>
            <button id="btn-dialogue-continue" class="dialogue-continue-btn ${isWaiting ? 'waiting' : (isTyped ? 'ready' : 'typing')}">
              ${isWaiting ? '<span class="dialogue-clock-icon">⏳</span> PENSANDO...' : (isTyped ? '▶ CONTINUAR [ESPACIO]' : '...')}
            </button>
          </div>
        `;
        bubble = this.dialogueContainer.querySelector('.dialogue-bubble') as HTMLElement;
        traceBox = this.dialogueContainer.querySelector('#agent-trace-container') as HTMLElement;
        body = this.dialogueContainer.querySelector('.dialogue-body') as HTMLElement;
        btn = document.getElementById('btn-dialogue-continue') as HTMLButtonElement;
        this.lastStepsHash = '';

        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            this.dialogueManager.advanceOrSkip();
          };
        }
      }

      // Actualizar clase de bubble
      const targetBubbleClass = `dialogue-bubble ${speaker}${this.isTraceExpanded ? ' has-expanded-trace' : ''}`;
      if (bubble.className !== targetBubbleClass) {
        bubble.className = targetBubbleClass;
      }

      // Actualizar Traza Agéntica de forma reactiva en tiempo real conforme llegan pasos por SSE
      const currentStepsHash = `${steps ? steps.map(s => s.id).join('|') : 'none'}`;
      if (this.lastStepsHash !== currentStepsHash) {
        this.lastStepsHash = currentStepsHash;
        if (traceBox) {
          if (steps && steps.length > 0) {
            traceBox.style.display = 'flex';
            traceBox.innerHTML = this.renderTraceHtml(steps);
            const listElem = traceBox.querySelector('.agent-live-log-list') as HTMLElement;
            if (listElem) {
              listElem.scrollTop = listElem.scrollHeight;
            }
          } else {
            traceBox.style.display = 'none';
            traceBox.innerHTML = '';
          }
        }
      }

      // Actualizar texto del diálogo con formato enriquecido (párrafos, negritas y viñetas)
      if (body) {
        const rawText = this.dialogueManager.displayedText;
        if (body.getAttribute('data-raw') !== rawText) {
          body.setAttribute('data-raw', rawText);
          body.innerHTML = this.formatDialogueText(rawText);
        }
      }

      // Actualizar botón de continuar
      if (btn) {
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
        this.lastStepsHash = '';
      }
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private formatDialogueText(raw: string): string {
    if (!raw) return '';

    // Si es un mensaje de espera (relojito), mostrarlo limpio
    if (raw.includes('⏳')) {
      return `<div class="dialogue-waiting-msg">${this.escapeHtml(raw)}</div>`;
    }

    // 1. Normalizar saltos de línea y separar encabezados pegados a puntuación (ej: "pasado.**Plaza**" -> "pasado.\n\n- **Plaza**")
    let text = raw
      .replace(/([.!?:])\s*(\*\*[^*]+\*\*:?)/g, '$1\n\n- $2')
      .replace(/([.!?:])\s*([-•]\s+\*\*)/g, '$1\n\n$2');

    // 2. Extraer prefijo del hablante si existe al inicio (ej: "Profesora Herminia: '...")
    let prefixHtml = '';
    const speakerMatch = text.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+:)\s*('?)/);
    if (speakerMatch) {
      prefixHtml = `<span class="dialogue-speaker-prefix">${this.escapeHtml(speakerMatch[1])}</span> `;
      text = text.substring(speakerMatch[0].length);
      if (speakerMatch[2] === "'") {
        text = text.replace(/^'/, '').replace(/'$/, '');
      }
    }

    // 3. Escapar caracteres HTML básicos en el cuerpo
    let safe = this.escapeHtml(text);

    // 4. Transformar negritas Markdown **texto** -> <strong class="retro-bold">texto</strong>
    safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong class="retro-bold">$1</strong>');
    // Si hay un ** abierto al final por streaming en vivo, cerrarlo visualmente
    safe = safe.replace(/\*\*([^*\n<]+)$/, '<strong class="retro-bold">$1</strong>');

    // 5. Destacar referencias de páginas del Códice RAG [Pág. X]
    safe = safe.replace(
      /\[(P[aá]g\.?\s*\d+[^\]]*)\]/gi,
      '<span class="rag-page-tag">[$1]</span>'
    );

    // 6. Formatear listas y viñetas (- ó •)
    safe = safe.replace(
      /(?:^|<br\s*\/?>|\n)\s*[-•]\s+([^\n<]+)/g,
      '<div class="dialogue-bullet-item"><span class="bullet-dot">▸</span> $1</div>'
    );

    // 7. Dividir en párrafos por saltos de línea dobles (\n\n)
    const paragraphs = safe.split(/(?:\r?\n){2,}/);
    if (paragraphs.length > 1) {
      const bodyHtml = paragraphs
        .map(p => p.trim())
        .filter(p => p.length > 0)
        .map(p => `<p class="dialogue-paragraph">${p.replace(/\r?\n/g, '<br>')}</p>`)
        .join('');
      return prefixHtml ? `<div class="dialogue-flow">${prefixHtml}${bodyHtml}</div>` : bodyHtml;
    }

    const singleBody = safe.replace(/\r?\n/g, '<br>');
    return prefixHtml ? `${prefixHtml}${singleBody}` : singleBody;
  }

  private renderTraceHtml(steps: any[]): string {
    const itemsHtml = steps.map((st, idx) => {
      let detailsHtml = '';
      if (st.detalles && Object.keys(st.detalles).length > 0) {
        detailsHtml = `
          <details class="step-details-toggle">
            <summary>🔍 VER DETALLES / CONTEXTO RAG</summary>
            <pre class="trace-step-json">${this.escapeHtml(JSON.stringify(st.detalles, null, 2))}</pre>
          </details>
        `;
      }

      return `
        <div class="agent-log-step-line" style="border-left-color: ${st.color};">
          <div class="step-line-row">
            <span class="step-badge" style="color: ${st.color}; border-color: ${st.color};">${st.icono} #${idx + 1} ${st.titulo}</span>
            <span class="step-content">${this.escapeHtml(st.contenido)}</span>
            ${st.latencia_ms ? `<span class="step-lat">${st.latencia_ms}ms</span>` : ''}
          </div>
          ${detailsHtml}
        </div>
      `;
    }).join('');

    return `
      <div class="agent-live-log-header">
        <span class="live-log-tag">⚡ PIPELINE AGÉNTICO // EJECUCIÓN EN TIEMPO REAL</span>
        <span class="live-log-counter">${steps.length} EVENTOS</span>
      </div>
      <div class="agent-live-log-list">
        ${itemsHtml}
      </div>
    `;
  }
}
