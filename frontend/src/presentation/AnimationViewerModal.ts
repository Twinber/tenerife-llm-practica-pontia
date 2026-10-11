// ==============================================================================
// PRESENTATION: AnimationViewerModal (Laboratorio Retro de Animaciones VGA 1990)
// Comando de consola: SHOW_ANIMS
// Permite verificar simultáneamente la fluidez, anclaje y silueta de los 14 personajes
// ==============================================================================
import { AudioService } from '../infrastructure/AudioService';

export interface CharacterAnimDef {
  id: string;
  name: string;
  role: string;
  location: string;
  zone: 'north' | 'metro' | 'south' | 'teide' | 'special';
  zoneName: string;
  canvasSize: string;
  icon: string;
}

export const ALL_CHARACTERS: CharacterAnimDef[] = [
  { id: 'twinber', name: 'Twinber', role: 'Investigador / Aventurero', location: 'Tenerife (Global)', zone: 'special', zoneName: 'Protagonista', canvasSize: '192x256 px', icon: '🤠' },
  { id: 'paco', name: 'Paco el Pescador', role: 'Pescador veterano', location: 'Puerto de la Cruz', zone: 'north', zoneName: 'Norte', canvasSize: '280x460 px', icon: '🎣' },
  { id: 'chano', name: 'Chano el Molinero', role: 'Maestro del gofio canario', location: 'La Orotava', zone: 'north', zoneName: 'Norte', canvasSize: '280x460 px', icon: '🌾' },
  { id: 'manolo', name: 'Manolo el Tabernero', role: 'Tabernero de guachinche', location: 'Santa Úrsula', zone: 'north', zoneName: 'Norte', canvasSize: '360x460 px', icon: '🍷' },
  { id: 'candido', name: 'Don Cándido', role: 'Erudito botánico del Drago', location: 'Icod de los Vinos', zone: 'north', zoneName: 'Norte', canvasSize: '280x460 px', icon: '🌳' },
  { id: 'nieves', name: 'Doña Nieves', role: 'Maestra caladora tradicional', location: 'Garachico', zone: 'north', zoneName: 'Norte', canvasSize: '280x460 px', icon: '🧵' },
  { id: 'herminia', name: 'Profesora Herminia', role: 'Catedrática de Historia', location: 'San Cristóbal de La Laguna', zone: 'metro', zoneName: 'Metropolitana', canvasSize: '280x460 px', icon: '📜' },
  { id: 'morales', name: 'Oficial Morales', role: 'Oficial Autoridad Portuaria', location: 'Santa Cruz de Tenerife', zone: 'metro', zoneName: 'Metropolitana', canvasSize: '280x460 px', icon: '⚓' },
  { id: 'yeray', name: 'Yeray el Guarda', role: 'Guarda forestal de laurisilva', location: 'Parque Rural de Anaga', zone: 'metro', zoneName: 'Metropolitana', canvasSize: '280x460 px', icon: '🌲' },
  { id: 'socorrista', name: 'Ayoze el Socorrista', role: 'Socorrista de costa', location: 'Costa Adeje', zone: 'south', zoneName: 'Sur', canvasSize: '280x460 px', icon: '🏖️' },
  { id: 'tanausu', name: 'Tanausú el Guía', role: 'Guía de alta montaña y barrancos', location: 'Masca & Los Gigantes', zone: 'south', zoneName: 'Sur', canvasSize: '280x460 px', icon: '🧗' },
  { id: 'frutero', name: 'El Frutero Canario', role: 'Vendedor de plátanos y frutas', location: 'El Médano', zone: 'south', zoneName: 'Sur', canvasSize: '280x460 px', icon: '🍌' },
  { id: 'operario', name: 'Operario Teleférico', role: 'Técnico de estación base Teide', location: 'Las Cañadas del Teide', zone: 'teide', zoneName: 'Teide', canvasSize: '280x460 px', icon: '🚠' },
  { id: 'guardian', name: 'El Guardián del Teide', role: 'Astrónomo y sabio de cumbre', location: 'Pico del Teide (3.718m)', zone: 'teide', zoneName: 'Teide', canvasSize: '280x460 px', icon: '🔭' },
];

export class AnimationViewerModal {
  private modalElem: HTMLElement;
  private gridElem: HTMLElement;
  private btnClose: HTMLButtonElement;
  private btnPlayPause: HTMLButtonElement;
  private btnSpeed: HTMLButtonElement;
  private btnBg: HTMLButtonElement;
  private filterBtns: NodeListOf<HTMLButtonElement>;

  private audioService: AudioService;
  private isOpen: boolean = false;
  private isPlaying: boolean = true;

  private speedIndex: number = 0;
  private readonly speeds = [1.0, 0.5, 0.25, 2.0];
  private readonly speedLabels = ['⚡ 1.0x (Normal)', '⚡ 0.5x (Lento)', '⚡ 0.25x (Super Lento)', '⚡ 2.0x (Rápido)'];

  private bgIndex: number = 0;
  private readonly bgClasses = ['bg-checker', 'bg-dark', 'bg-light', 'bg-chroma'];
  private readonly bgLabels = ['🏁 AJEDREZ', '⬛ OSCURO', '⬜ CLARO', '🟩 CHROMA'];

  private currentFilter: string = 'all';

  private idleFrame: number = 0;
  private talkFrame: number = 0;
  private idleAccumulator: number = 0;
  private talkAccumulator: number = 0;
  private lastTimestamp: number = 0;
  private animFrameReq: number | null = null;

  // Referencias a elementos en el DOM para actualizar frames a alta velocidad sin re-renderizar
  private idleImgs: Map<string, HTMLImageElement> = new Map();
  private talkImgs: Map<string, HTMLImageElement> = new Map();
  private idleBadges: Map<string, HTMLElement> = new Map();
  private talkBadges: Map<string, HTMLElement> = new Map();
  private previewBoxes: HTMLElement[] = [];

  constructor(audioService: AudioService) {
    this.audioService = audioService;

    this.modalElem = document.getElementById('animation-viewer-modal')!;
    this.gridElem = document.getElementById('anims-cards-grid')!;
    this.btnClose = document.getElementById('btn-close-anims') as HTMLButtonElement;
    this.btnPlayPause = document.getElementById('btn-anims-playpause') as HTMLButtonElement;
    this.btnSpeed = document.getElementById('btn-anims-speed') as HTMLButtonElement;
    this.btnBg = document.getElementById('btn-anims-bg') as HTMLButtonElement;
    this.filterBtns = document.querySelectorAll<HTMLButtonElement>('.anims-filter-btn');

    this.renderCards();
    this.bindEvents();
  }

  private renderCards(): void {
    this.gridElem.innerHTML = '';
    this.idleImgs.clear();
    this.talkImgs.clear();
    this.idleBadges.clear();
    this.talkBadges.clear();
    this.previewBoxes = [];

    const currentBgClass = this.bgClasses[this.bgIndex];

    ALL_CHARACTERS.forEach(char => {
      const card = document.createElement('article');
      card.className = 'anim-card';
      card.setAttribute('data-id', char.id);
      card.setAttribute('data-zone', char.zone);

      card.innerHTML = `
        <header class="anim-card-header">
          <span class="anim-card-title">${char.icon} ${char.name}</span>
          <span class="anim-card-loc">${char.location}</span>
        </header>

        <div class="anim-card-body">
          <!-- Columna REPOSO (IDLE) -->
          <div class="anim-preview-col">
            <div class="anim-preview-box ${currentBgClass}" id="box-idle-${char.id}">
              <img
                src="/assets/img/sprites/${char.id}_idle_0.png"
                alt="${char.name} reposo"
                class="anim-sprite-img"
                id="img-idle-${char.id}"
                loading="eager"
              />
            </div>
            <span class="anim-badge-f badge-idle" id="badge-idle-${char.id}">IDLE • F: 0/3</span>
          </div>

          <!-- Columna HABLA (TALK) -->
          <div class="anim-preview-col">
            <div class="anim-preview-box ${currentBgClass}" id="box-talk-${char.id}">
              <img
                src="/assets/img/sprites/${char.id}_talk_0.png"
                alt="${char.name} habla"
                class="anim-sprite-img"
                id="img-talk-${char.id}"
                loading="eager"
              />
            </div>
            <span class="anim-badge-f badge-talk" id="badge-talk-${char.id}">TALK • F: 0/3</span>
          </div>
        </div>

        <footer class="anim-card-footer">
          <span>${char.role}</span>
          <span>📐 ${char.canvasSize}</span>
        </footer>
      `;

      this.gridElem.appendChild(card);

      const idleImg = card.querySelector(`#img-idle-${char.id}`) as HTMLImageElement;
      const talkImg = card.querySelector(`#img-talk-${char.id}`) as HTMLImageElement;
      const idleBadge = card.querySelector(`#badge-idle-${char.id}`) as HTMLElement;
      const talkBadge = card.querySelector(`#badge-talk-${char.id}`) as HTMLElement;
      const boxIdle = card.querySelector(`#box-idle-${char.id}`) as HTMLElement;
      const boxTalk = card.querySelector(`#box-talk-${char.id}`) as HTMLElement;

      if (idleImg) this.idleImgs.set(char.id, idleImg);
      if (talkImg) this.talkImgs.set(char.id, talkImg);
      if (idleBadge) this.idleBadges.set(char.id, idleBadge);
      if (talkBadge) this.talkBadges.set(char.id, talkBadge);
      if (boxIdle) this.previewBoxes.push(boxIdle);
      if (boxTalk) this.previewBoxes.push(boxTalk);
    });
  }

  private bindEvents(): void {
    // Cerrar con botón X
    this.btnClose.addEventListener('click', () => this.close());

    // Cerrar al hacer clic en el telón de fondo oscuro
    this.modalElem.addEventListener('click', (e) => {
      if (e.target === this.modalElem) this.close();
    });

    // Tecla Escape para cerrar
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Botón Pausar / Reanudar
    this.btnPlayPause.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      this.btnPlayPause.innerHTML = this.isPlaying ? '⏸️ PAUSAR' : '▶️ REANUDAR';
      this.btnPlayPause.classList.toggle('paused', !this.isPlaying);
      this.audioService.playClick();
    });

    // Botón Cambiar Velocidad (1x -> 0.5x -> 0.25x -> 2x)
    this.btnSpeed.addEventListener('click', () => {
      this.speedIndex = (this.speedIndex + 1) % this.speeds.length;
      this.btnSpeed.textContent = this.speedLabels[this.speedIndex];
      this.audioService.playClick();
    });

    // Botón Cambiar Fondo (Ajedrez -> Oscuro -> Claro -> Chroma)
    this.btnBg.addEventListener('click', () => {
      const prevClass = this.bgClasses[this.bgIndex];
      this.bgIndex = (this.bgIndex + 1) % this.bgClasses.length;
      const nextClass = this.bgClasses[this.bgIndex];

      this.previewBoxes.forEach(box => {
        box.classList.remove(prevClass);
        box.classList.add(nextClass);
      });

      this.btnBg.textContent = this.bgLabels[this.bgIndex];
      this.audioService.playClick();
    });

    // Filtros de zona
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter') || 'all';
        this.applyFilter(filter);
        this.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.audioService.playClick();
      });
    });
  }

  public applyFilter(filter: string): void {
    this.currentFilter = filter.toLowerCase();
    const cards = this.gridElem.querySelectorAll<HTMLElement>('.anim-card');

    cards.forEach(card => {
      const zone = card.getAttribute('data-zone') || '';
      const charId = card.getAttribute('data-id') || '';

      if (this.currentFilter === 'all') {
        card.classList.remove('hidden-by-filter');
      } else if (this.currentFilter === 'north' && zone === 'north') {
        card.classList.remove('hidden-by-filter');
      } else if (this.currentFilter === 'metro' && zone === 'metro') {
        card.classList.remove('hidden-by-filter');
      } else if (this.currentFilter === 'south' && zone === 'south') {
        card.classList.remove('hidden-by-filter');
      } else if (this.currentFilter === 'teide' && zone === 'teide') {
        card.classList.remove('hidden-by-filter');
      } else if (this.currentFilter === charId) {
        card.classList.remove('hidden-by-filter');
      } else {
        card.classList.add('hidden-by-filter');
      }
    });
  }

  public open(filterArg?: string): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.modalElem.classList.remove('hidden');

    if (filterArg) {
      const normalized = filterArg.toLowerCase().trim();
      if (['norte', 'north'].includes(normalized)) this.applyFilter('north');
      else if (['metro', 'metropolitana', 'laguna', 'santacruz'].includes(normalized)) this.applyFilter('metro');
      else if (['sur', 'south', 'adeje', 'medano', 'masca'].includes(normalized)) this.applyFilter('south');
      else if (['teide', 'cumbre'].includes(normalized)) this.applyFilter('teide');
      else {
        // Verificar si es un ID de personaje puntual (ej: 'manolo', 'twinber')
        const found = ALL_CHARACTERS.find(c => c.id === normalized || c.name.toLowerCase().includes(normalized));
        if (found) {
          this.applyFilter(found.id);
        } else {
          this.applyFilter('all');
        }
      }
    } else {
      this.applyFilter('all');
    }

    this.audioService.playClick();

    // Iniciar bucle de animación
    this.lastTimestamp = performance.now();
    this.startAnimationLoop();
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.modalElem.classList.add('hidden');

    if (this.animFrameReq !== null) {
      cancelAnimationFrame(this.animFrameReq);
      this.animFrameReq = null;
    }

    this.audioService.playClick();
  }

  private startAnimationLoop(): void {
    const loop = (timestamp: number) => {
      if (!this.isOpen) return;

      const delta = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

      if (this.isPlaying) {
        const speed = this.speeds[this.speedIndex];

        // Acumular tiempo para animaciones
        this.idleAccumulator += delta * speed;
        this.talkAccumulator += delta * speed;

        // Reposo (IDLE): ~260ms por frame para ciclo de fidget continuo fluido
        if (this.idleAccumulator >= 260) {
          this.idleAccumulator = 0;
          this.idleFrame = (this.idleFrame + 1) % 4;
          this.updateIdleFrames();
        }

        // Habla (TALK): ~170ms por frame (~5.8 FPS, idéntico al motor del juego)
        if (this.talkAccumulator >= 170) {
          this.talkAccumulator = 0;
          this.talkFrame = (this.talkFrame + 1) % 4;
          this.updateTalkFrames();
        }
      }

      this.animFrameReq = requestAnimationFrame(loop);
    };

    this.animFrameReq = requestAnimationFrame(loop);
  }

  private updateIdleFrames(): void {
    ALL_CHARACTERS.forEach(char => {
      const img = this.idleImgs.get(char.id);
      if (img) {
        img.src = `/assets/img/sprites/${char.id}_idle_${this.idleFrame}.png`;
      }
      const badge = this.idleBadges.get(char.id);
      if (badge) {
        badge.textContent = `IDLE • F: ${this.idleFrame}/3`;
      }
    });
  }

  private updateTalkFrames(): void {
    ALL_CHARACTERS.forEach(char => {
      const img = this.talkImgs.get(char.id);
      if (img) {
        img.src = `/assets/img/sprites/${char.id}_talk_${this.talkFrame}.png`;
      }
      const badge = this.talkBadges.get(char.id);
      if (badge) {
        badge.textContent = `TALK • F: ${this.talkFrame}/3`;
      }
    });
  }
}
