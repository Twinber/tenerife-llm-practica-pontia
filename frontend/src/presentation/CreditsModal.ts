// ==============================================================================
// PRESENTATION: CreditsModal (Créditos Cinematográficos Retro LucasArts 1990)
// Desplegable en la cumbre del Teide y mediante comando de consola: CREDITOS
// ==============================================================================
import { AudioService } from '../infrastructure/AudioService';

export class CreditsModal {
  private modalElem: HTMLElement;
  private viewportElem: HTMLElement;
  private contentElem: HTMLElement;
  private btnClose: HTMLButtonElement;
  private btnPause: HTMLButtonElement;

  private audioService: AudioService;
  private isOpen: boolean = false;
  private isPaused: boolean = false;
  private scrollSpeed: number = 0.275; // Píxeles por fotograma (~16.5 px/s a 60fps, 50% reducción)
  private currentScroll: number = 0;
  private animFrameId: number | null = null;
  private reverseAnimFrameId: number | null = null;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor(audioService: AudioService) {
    this.audioService = audioService;

    // Crear o recuperar elemento modal
    let modal = document.getElementById('modal-credits');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-credits';
      modal.className = 'modal-backdrop hidden';
      modal.innerHTML = `
        <div class="credits-window">
          <div class="credits-header">
            <span class="credits-title">🏆 CRÉDITOS FINALES // TWINBER EN BUSCA DEL SECRETO GUANCHE</span>
            <button class="credits-close-btn" id="btn-credits-close" title="Cerrar Créditos [ESC]">✕</button>
          </div>
          <div class="credits-viewport" id="credits-viewport">
            <div class="credits-content" id="credits-content"></div>
          </div>
          <div class="credits-footer">
            <button id="btn-credits-pause" class="credits-btn">⏸️ PAUSAR SCROLL</button>
            <button id="btn-credits-restart" class="credits-btn">🔄 REINICIAR SCROLL</button>
            <span class="credits-tip">Pulsa [ESC] o ✕ para volver a la cumbre</span>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    this.modalElem = modal;
    this.viewportElem = document.getElementById('credits-viewport') as HTMLElement;
    this.contentElem = document.getElementById('credits-content') as HTMLElement;
    this.btnClose = document.getElementById('btn-credits-close') as HTMLButtonElement;
    this.btnPause = document.getElementById('btn-credits-pause') as HTMLButtonElement;

    const btnRestart = document.getElementById('btn-credits-restart') as HTMLButtonElement;
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        this.stopReverseScroll();
        this.currentScroll = 0;
        this.viewportElem.scrollTop = 0;
        if (!this.isPaused) {
          this.startAutoScroll();
        }
      });
    }

    this.btnClose.addEventListener('click', () => this.close());
    this.btnPause.addEventListener('click', () => this.togglePause());

    this.viewportElem.addEventListener('wheel', () => {
      this.currentScroll = this.viewportElem.scrollTop;
    }, { passive: true });

    this.boundKeyDown = (e: KeyboardEvent) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      } else if (e.key === ' ' || e.code === 'Space') {
        // Espacio para pausar/reanudar
        e.preventDefault();
        this.togglePause();
      }
    };
    window.addEventListener('keydown', this.boundKeyDown);

    this.populateCreditsContent();
  }

  private populateCreditsContent(): void {
    this.contentElem.innerHTML = `
      <div class="credits-spacer-top"></div>

      <div class="credits-banner-main">
        <div class="credits-pixel-logo">🌴 TWINBER EN BUSCA DEL SECRETO GUANCHE 🌴</div>
        <div class="credits-subtitle">Aventura Gráfica Conversacional & Asistente Turístico Inteligente en Tenerife</div>
        <div class="credits-tech-badge">Clean Architecture &bull; Motor ReAct &bull; RAG Geocercado &bull; VGA 16:9 LucasArts Style</div>
      </div>

      <hr class="credits-divider">

      <div class="credits-section">
        <div class="credits-section-title">AUTORÍA, DIRECCIÓN & DESARROLLO</div>
        <div class="credits-name-lead">DANIEL AGUILERA GONZÁLEZ</div>
        <div class="credits-role-desc">Idea Original, Arquitectura de Software, Guion Narrativo,</div>
        <div class="credits-role-desc">Ingeniería de Prompts y Desarrollo Agéntico Multiturno</div>
      </div>

      <hr class="credits-divider">

      <div class="credits-section">
        <div class="credits-section-title">CONTEXTO ACADÉMICO</div>
        <div class="credits-text-bold">TRABAJO DE FIN DE MÓDULO</div>
        <div class="credits-text-highlight">Large Language Models (LLMs)</div>
        <div class="credits-text-sub">Máster en Inteligencia Artificial, Cloud Computing & DevOps</div>
        <div class="credits-institution">PONTIA &bull; Convocatoria 2026</div>
      </div>

      <hr class="credits-divider">

      <div class="credits-section">
        <div class="credits-section-title">DOCENCIA DEL MÓDULO DE LLMs</div>
        <div class="credits-name">Alberto Ruiz-Arteaga González</div>
        <div class="credits-role-desc">Docente de la asignatura Large Language Models</div>
      </div>

      <hr class="credits-divider">

      <div class="credits-section">
        <div class="credits-section-title">ARQUITECTURA AGÉNTICA, MODELOS & HERRAMIENTAS</div>
        <div class="credits-tools-list">
          <div class="credits-tool-item">
            <span class="tool-label">Entorno Agéntico de Desarrollo</span>
            <span class="tool-val">Antigravity CLI (Google DeepMind)</span>
          </div>
          <div class="credits-tool-item">
            <span class="tool-label">Modelo LLM Central & Razonamiento</span>
            <span class="tool-val">Gemini 3.8 (Motor ReAct & Function Calling)</span>
          </div>
          <div class="credits-tool-item">
            <span class="tool-label">Generación de Arte Gráfico & Sprites VGA</span>
            <span class="tool-val">Nano Banana (Fondos Panorámicos y Sprites Pixel Art)</span>
          </div>
          <div class="credits-tool-item">
            <span class="tool-label">Composición Sonora & Efectos de Audio</span>
            <span class="tool-val">Lira & Síntesis Web Audio API en Tiempo Real</span>
          </div>
          <div class="credits-tool-item">
            <span class="tool-label">Base de Conocimiento RAG & Geocercado</span>
            <span class="tool-val">Documento PDF "TENERIFE.pdf" (provisto por el docente)</span>
          </div>
          <div class="credits-tool-item">
            <span class="tool-label">API Meteorológica Insular</span>
            <span class="tool-val">Open-Meteo Weather API (Previsión de Viento y Cielos)</span>
          </div>
          <div class="credits-tool-item">
            <span class="tool-label">API de Calima & Polvo Sahariano</span>
            <span class="tool-val">Open-Meteo Air Quality & Dust API (Aerosoles Saharianos)</span>
          </div>
          <div class="credits-tool-item">
            <span class="tool-label">API Astronómica Starlight</span>
            <span class="tool-val">Open-Meteo Night Sky & Cloud Transparency (Cielos del Teide)</span>
          </div>
          <div class="credits-tool-item">
            <span class="tool-label">Stack Tecnológico</span>
            <span class="tool-val">Python 3.11, FastAPI, ChromaDB, TypeScript & Vite</span>
          </div>
        </div>
      </div>

      <hr class="credits-divider">

      <div class="credits-section">
        <div class="credits-section-title">ELENCO DE PERSONAJES AUTÓCTONOS DE TENERIFE</div>
        <div class="credits-cast-list">
          <div class="cast-item">
            <span class="cast-name">🤠 Twinber</span>
            <span class="cast-role">El Explorador Forastero</span>
          </div>
          <div class="cast-item">
            <span class="cast-name">🎣 Paco el Pescador</span>
            <span class="cast-role">Muelle Histórico de Puerto de la Cruz</span>
          </div>
          <div class="cast-item">
            <span class="cast-name">🌾 Chano el Molinero</span>
            <span class="cast-role">Molino de Gofio de La Orotava</span>
          </div>
          <div class="cast-item">
            <span class="cast-name">🍷 Manolo el Tabernero</span>
            <span class="cast-role">Guachinche Tradicional de Santa Úrsula</span>
          </div>
          <div class="cast-item">
            <span class="cast-name">🌳 Don Cándido</span>
            <span class="cast-role">Parque del Drago Milenario de Icod de los Vinos</span>
          </div>
          <div class="cast-item">
            <span class="cast-name">🧵 Doña Nieves</span>
            <span class="cast-role">Plaza de la Libertad & Calados de Garachico</span>
          </div>
          <div class="cast-item">
            <span class="cast-name">📜 Profesora Herminia</span>
            <span class="cast-role">Universidad de San Cristóbal de La Laguna</span>
          </div>
          <div class="cast-item">
            <span class="cast-name">⚓ Oficial Morales</span>
            <span class="cast-role">Autoridad Portuaria de Santa Cruz de Tenerife</span>
          </div>
          <div class="cast-item">
            <span class="cast-name">🌲 Yeray el Guarda Forestal</span>
            <span class="cast-role">Parque Rural de Anaga & Bosque de Laurisilva</span>
          </div>
          <div class="cast-item">
            <span class="cast-name">🏖️ Ayoze el Socorrista</span>
            <span class="cast-role">Costas y Playas de Costa Adeje</span>
          </div>
          <div class="cast-item">
            <span class="cast-name">🧗 Tanausú el Guía de Montaña</span>
            <span class="cast-role">Barranco de Masca & Acantilados de Los Gigantes</span>
          </div>
          <div class="cast-item">
            <span class="cast-name">🍌 El Frutero Canario</span>
            <span class="cast-role">Puesto Callejero de Plátanos en El Médano</span>
          </div>
          <div class="cast-item">
            <span class="cast-name">🚠 Operario del Teleférico</span>
            <span class="cast-role">Estación Base de Las Cañadas del Teide</span>
          </div>
          <div class="cast-item">
            <span class="cast-name">🔭 El Guardián del Teide</span>
            <span class="cast-role">Cumbre Somital & Cielos Starlight (3.718m)</span>
          </div>
        </div>
      </div>

      <hr class="credits-divider">

      <div class="credits-section">
        <div class="credits-section-title">AGRADECIMIENTOS ESPECIALES</div>
        <p class="credits-quote">&laquo;A la isla de Tenerife: sus cumbres volcánicas, sus barrancos milenarios, sus cielos Starlight y el calor de su gente.&raquo;</p>
        <p class="credits-quote">&laquo;A los guachinches del norte, las papas con mojo picón, el gofio amasado y los plátanos dulces recién cortados.&raquo;</p>
        <p class="credits-quote">&laquo;A Ron Gilbert, Tim Schafer, Dave Grossman y Michael Land por enseñarnos en los años 90 que una pantalla VGA de 320x200 píxeles podía albergar un universo entero de magia y aventuras.&raquo;</p>
      </div>

      <div class="credits-humor-note">
        &laquo;Ningún plátano canario ni pescador de puerto sufrieron daños<br>
        durante el entrenamiento o ejecución de este sistema agéntico.&raquo;
      </div>

      <div class="credits-end-seal">
        ✨ &iexcl;GRACIAS POR JUGAR A TWINBER EN TENERIFE! ✨
      </div>

      <div class="credits-final-copyright">
        TODOS LOS DERECHOS RESERVADOS
      </div>

      <div class="credits-spacer-bottom"></div>
    `;
  }

  public open(): void {
    this.isOpen = true;
    this.isPaused = false;
    this.modalElem.classList.remove('hidden');
    this.btnPause.innerText = '⏸️ PAUSAR SCROLL';

    this.stopAutoScroll();
    this.stopReverseScroll();
    this.currentScroll = 0;
    this.viewportElem.scrollTop = 0;

    // Disparar el Gag Cómico sonoro (Homenaje MP3 15s -> Derrape/Scratch MP3 -> Música oficial)
    this.audioService.playCreditsThemeWithGag({
      onHomenajeStart: () => {
        // En cuanto la melodía homenaje carga y arranca efectivamente a sonar: comenzar el scroll descendente
        if (this.isOpen && !this.isPaused) {
          this.startAutoScroll();
        }
      },
      onScratch: (durationMs: number) => {
        // En el momento exacto del derrape: animar el rebobinado inverso hacia el principio durante el sonido
        this.startReverseScroll(durationMs);
      },
      onOriginalMusicStart: () => {
        // En cuanto la música oficial del juego arranca efectivamente a sonar: reanudar el scroll hacia abajo desde arriba
        if (this.isOpen && !this.isPaused) {
          this.currentScroll = 0;
          this.viewportElem.scrollTop = 0;
          this.startAutoScroll();
        }
      }
    });
  }

  public close(): void {
    this.isOpen = false;
    this.stopAutoScroll();
    this.stopReverseScroll();
    this.modalElem.classList.add('hidden');

    // Detener el gag sonoro si estuviese activo
    this.audioService.stopCreditsGag();
  }

  public togglePause(): void {
    this.isPaused = !this.isPaused;
    this.btnPause.innerText = this.isPaused ? '▶️ REANUDAR SCROLL' : '⏸️ PAUSAR SCROLL';
    if (!this.isPaused) {
      this.startAutoScroll();
    } else {
      this.stopAutoScroll();
      this.stopReverseScroll();
    }
  }

  public startReverseScroll(durationMs: number, onComplete?: () => void): void {
    this.stopAutoScroll();
    this.stopReverseScroll();

    const startPos = this.currentScroll;
    if (startPos <= 0) {
      this.currentScroll = 0;
      this.viewportElem.scrollTop = 0;
      onComplete?.();
      return;
    }

    const startTime = performance.now();

    const reverseStep = (now: number) => {
      if (!this.isOpen || this.isPaused) return;

      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Curva de frenazo y rebobinado (ease-out cubic): rápido al inicio con el chirrido y desacelerando a 0
      const ease = 1 - Math.pow(1 - progress, 3);

      this.currentScroll = Math.max(0, startPos * (1 - ease));
      this.viewportElem.scrollTop = this.currentScroll;

      if (progress < 1) {
        this.reverseAnimFrameId = requestAnimationFrame(reverseStep);
      } else {
        this.currentScroll = 0;
        this.viewportElem.scrollTop = 0;
        this.reverseAnimFrameId = null;
        onComplete?.();
      }
    };

    this.reverseAnimFrameId = requestAnimationFrame(reverseStep);
  }

  public stopReverseScroll(): void {
    if (this.reverseAnimFrameId !== null) {
      cancelAnimationFrame(this.reverseAnimFrameId);
      this.reverseAnimFrameId = null;
    }
  }

  private startAutoScroll(): void {
    this.stopReverseScroll();
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }

    const step = () => {
      if (!this.isOpen || this.isPaused) return;

      this.currentScroll += this.scrollSpeed;
      this.viewportElem.scrollTop = this.currentScroll;

      // Si ha llegado al fondo absoluto, detenerse con suavidad
      const maxScroll = this.viewportElem.scrollHeight - this.viewportElem.clientHeight;
      if (this.currentScroll < maxScroll) {
        this.animFrameId = requestAnimationFrame(step);
      } else {
        this.animFrameId = null;
      }
    };

    this.animFrameId = requestAnimationFrame(step);
  }

  private stopAutoScroll(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}
