// ==============================================================================
// PRESENTATION: PassportModal (Pasaporte de Explorador a Doble Página - 5 Pliegos)
// ==============================================================================
import passportData from '../domain/passportData.json';
import { AudioService } from '../infrastructure/AudioService';

export interface PassportEntry {
  id: number;
  key: string;
  zone: string;
  title: string;
  authority: string;
  stampDate: string;
  inkColor: string;
  sealText: string;
  iconType: string;
  description: string;
  page: number;
  spread: number;
  side: 'left' | 'right';
}

export class PassportModal {
  private modalElem: HTMLElement;
  private leftPageElem: HTMLElement;
  private rightPageElem: HTMLElement;
  private counterElem: HTMLElement;
  private indicatorElem: HTMLElement;
  private prevBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private closeBtn: HTMLButtonElement;

  private audioService: AudioService;
  private entries: PassportEntry[] = passportData as PassportEntry[];
  private unlockedKeys: Set<string> = new Set<string>();
  private currentSpread: number = 1; // 1 a 5 (5 pliegos dobles de 2 páginas)

  public onStampUnlocked?: (unlockedCount: number, total: number) => void;

  constructor(audioService: AudioService) {
    this.audioService = audioService;

    this.modalElem = document.getElementById('passport-modal')!;
    this.leftPageElem = document.getElementById('passport-page-left')!;
    this.rightPageElem = document.getElementById('passport-page-right')!;
    this.counterElem = document.getElementById('passport-counter')!;
    this.indicatorElem = document.getElementById('passport-page-indicator')!;
    this.prevBtn = document.getElementById('btn-passport-prev') as HTMLButtonElement;
    this.nextBtn = document.getElementById('btn-passport-next') as HTMLButtonElement;
    this.closeBtn = document.getElementById('btn-close-passport') as HTMLButtonElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.closeBtn.addEventListener('click', () => this.close());
    this.modalElem.addEventListener('click', (e) => {
      if (e.target === this.modalElem) this.close();
    });

    this.prevBtn.addEventListener('click', () => {
      if (this.currentSpread > 1) {
        this.currentSpread--;
        this.audioService.playPageTurn();
        this.renderSpread();
      }
    });

    this.nextBtn.addEventListener('click', () => {
      if (this.currentSpread < 5) {
        this.currentSpread++;
        this.audioService.playPageTurn();
        this.renderSpread();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (!this.isOpen()) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft' && this.currentSpread > 1) {
        this.currentSpread--;
        this.audioService.playPageTurn();
        this.renderSpread();
      }
      if (e.key === 'ArrowRight' && this.currentSpread < 5) {
        this.currentSpread++;
        this.audioService.playPageTurn();
        this.renderSpread();
      }
    });
  }

  public isOpen(): boolean {
    return !this.modalElem.classList.contains('hidden');
  }

  public open(targetSpread?: number): void {
    if (targetSpread !== undefined && targetSpread >= 1 && targetSpread <= 5) {
      this.currentSpread = targetSpread;
    }
    this.modalElem.classList.remove('hidden');
    this.audioService.playPageTurn();
    this.renderSpread();
  }

  public close(): void {
    this.modalElem.classList.add('hidden');
    this.audioService.playClick();
  }

  public unlockStamp(key: string): boolean {
    if (!this.unlockedKeys.has(key)) {
      this.unlockedKeys.add(key);
      if (this.counterElem) {
        this.counterElem.innerText = `${this.unlockedKeys.size}/10`;
      }
      if (this.onStampUnlocked) {
        this.onStampUnlocked(this.unlockedKeys.size, 10);
      }
      return true;
    }
    return false;
  }

  public isStampUnlocked(key: string): boolean {
    return this.unlockedKeys.has(key);
  }

  public getUnlockedCount(): number {
    return this.unlockedKeys.size;
  }

  public renderSpread(): void {
    // Pliego actual: spread 1 a 5
    const leftEntry = this.entries.find((e) => e.spread === this.currentSpread && e.side === 'left');
    const rightEntry = this.entries.find((e) => e.spread === this.currentSpread && e.side === 'right');

    if (leftEntry) {
      this.leftPageElem.innerHTML = this.renderSinglePageHtml(leftEntry);
    }
    if (rightEntry) {
      this.rightPageElem.innerHTML = this.renderSinglePageHtml(rightEntry);
    }

    // Actualizar barra de navegación y contador
    const startPage = (this.currentSpread - 1) * 2 + 1;
    const endPage = startPage + 1;
    this.indicatorElem.innerText = `PLIEGO ${this.currentSpread} DE 5 (PÁGINAS ${startPage} - ${endPage})`;
    this.counterElem.innerText = `${this.unlockedKeys.size}/10`;

    this.prevBtn.disabled = this.currentSpread === 1;
    this.nextBtn.disabled = this.currentSpread === 5;
  }

  private renderSinglePageHtml(entry: PassportEntry): string {
    const isUnlocked = this.unlockedKeys.has(entry.key);
    const pageNumPadded = entry.page.toString().padStart(2, '0');

    if (isUnlocked) {
      const stampSvg = this.generateStampSvg(entry);
      return `
        <div class="passport-page-inner unlocked" style="--stamp-ink: ${entry.inkColor};">
          <header class="page-security-header">
            <span class="page-security-origin">REINO DE ESPAÑA • CANARIAS</span>
            <span class="page-security-doc">VISADO TERRITORIAL</span>
          </header>

          <div class="stamp-display-zone">
            <div class="rubber-stamp-container ${entry.side === 'left' ? 'tilt-left' : 'tilt-right'}">
              ${stampSvg}
            </div>

            <div class="stamp-meta-box">
              <div class="stamp-meta-badge">✓ VISADO OFICIAL AUTORIZADO</div>
              <div class="stamp-meta-zone">${entry.zone}</div>
              <div class="stamp-meta-authority">Sellado por: <strong>${entry.authority}</strong></div>
              <p class="stamp-meta-desc">${entry.description}</p>
            </div>
          </div>

          <footer class="page-security-footer">
            <span class="page-folio">PÁG. ${pageNumPadded}</span>
            <span class="page-watermark-text">CABILDO DE TENERIFE</span>
            <span class="page-serial">TEN-${entry.id * 1042}-EXP</span>
          </footer>
        </div>
      `;
    } else {
      return `
        <div class="passport-page-inner locked">
          <header class="page-security-header">
            <span class="page-security-origin">REINO DE ESPAÑA • CANARIAS</span>
            <span class="page-security-doc">VISADO TERRITORIAL</span>
          </header>

          <div class="stamp-placeholder-zone">
            <div class="stamp-dotted-box">
              <div class="stamp-watermark-seal">
                ${this.generatePlaceholderSvg(entry.iconType)}
              </div>
              <div class="stamp-placeholder-title">[ ⭕ ESPACIO PARA VISADO ]</div>
              <div class="stamp-placeholder-zone-name">${entry.zone}</div>
              <div class="stamp-placeholder-status">🔒 PENDIENTE DE EXPEDICIÓN</div>
              <p class="stamp-placeholder-instruction">
                Requiere presencia física de Twinber en la comarca y autorización de la autoridad local.
              </p>
            </div>
          </div>

          <footer class="page-security-footer">
            <span class="page-folio">PÁG. ${pageNumPadded}</span>
            <span class="page-watermark-text">CABILDO DE TENERIFE</span>
            <span class="page-serial">TEN-${entry.id * 1042}-EXP</span>
          </footer>
        </div>
      `;
    }
  }

  private generatePlaceholderSvg(iconType: string): string {
    return `
      <svg viewBox="0 0 100 100" class="placeholder-svg-icon">
        <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.35"/>
        <g opacity="0.25">
          ${this.getIconSvgPath(iconType)}
        </g>
      </svg>
    `;
  }

  private generateStampSvg(entry: PassportEntry): string {
    const iconPath = this.getIconSvgPath(entry.iconType);
    return `
      <svg viewBox="0 0 160 160" class="retro-rubber-stamp-svg" style="color: ${entry.inkColor};">
        <!-- Aro exterior con borde dentado / festoneado -->
        <circle cx="80" cy="80" r="74" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="6,2"/>
        <circle cx="80" cy="80" r="69" fill="none" stroke="currentColor" stroke-width="1.2"/>

        <!-- Aro interior -->
        <circle cx="80" cy="80" r="47" fill="none" stroke="currentColor" stroke-width="1.5"/>

        <!-- Texto superior e inferior en arco -->
        <path id="curve-top-${entry.id}" d="M 22,80 A 58,58 0 0,1 138,80" fill="none"/>
        <text font-family="'Press Start 2P', monospace, sans-serif" font-size="7.5" fill="currentColor" letter-spacing="1">
          <textPath href="#curve-top-${entry.id}" startOffset="50%" text-anchor="middle">
            ${entry.zone.toUpperCase()}
          </textPath>
        </text>

        <path id="curve-bot-${entry.id}" d="M 138,80 A 58,58 0 0,1 22,80" fill="none"/>
        <text font-family="'Press Start 2P', monospace, sans-serif" font-size="6.5" fill="currentColor" letter-spacing="0.5">
          <textPath href="#curve-bot-${entry.id}" startOffset="50%" text-anchor="middle">
            ★ TENERIFE ★ OFICIAL
          </textPath>
        </text>

        <!-- Icono central del enclave -->
        <g transform="translate(40, 42) scale(0.8)">
          ${iconPath}
        </g>

        <!-- Franja de fecha de aduana central -->
        <rect x="25" y="74" width="110" height="15" fill="#fcf9f0" stroke="currentColor" stroke-width="1"/>
        <text x="80" y="84.5" font-family="'Press Start 2P', monospace, sans-serif" font-size="6" fill="currentColor" font-weight="bold" text-anchor="middle">
          ${entry.stampDate}
        </text>
      </svg>
    `;
  }

  private getIconSvgPath(iconType: string): string {
    switch (iconType) {
      case 'faro':
        // Faro de San Telmo y olas
        return `
          <polygon points="45,70 48,22 52,22 55,70" fill="none" stroke="currentColor" stroke-width="2"/>
          <rect x="47" y="16" width="6" height="6" fill="currentColor"/>
          <line x1="32" y1="18" x2="42" y2="19" stroke="currentColor" stroke-width="1.5"/>
          <line x1="68" y1="18" x2="58" y2="19" stroke="currentColor" stroke-width="1.5"/>
          <path d="M25,72 Q37,67 50,72 T75,72" fill="none" stroke="currentColor" stroke-width="2"/>
        `;
      case 'molino':
        // Molino de Chano y aspas
        return `
          <polygon points="40,70 44,30 56,30 60,70" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="50" cy="30" r="3" fill="currentColor"/>
          <line x1="50" y1="30" x2="30" y2="14" stroke="currentColor" stroke-width="2"/>
          <line x1="50" y1="30" x2="70" y2="46" stroke="currentColor" stroke-width="2"/>
          <line x1="50" y1="30" x2="66" y2="14" stroke="currentColor" stroke-width="2"/>
          <line x1="50" y1="30" x2="34" y2="46" stroke="currentColor" stroke-width="2"/>
        `;
      case 'drago':
        // Drago Milenario
        return `
          <path d="M48,70 L48,50 L42,38 L30,24 M48,50 L52,38 L62,24 M48,46 L50,22" fill="none" stroke="currentColor" stroke-width="2.5"/>
          <path d="M25,24 Q50,10 75,24" fill="none" stroke="currentColor" stroke-width="2.5"/>
          <polygon points="44,70 47,48 53,48 56,70" fill="currentColor"/>
        `;
      case 'catedral':
        // Torres coloniales de La Laguna
        return `
          <rect x="30" y="35" width="12" height="35" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <polygon points="28,35 36,18 44,35" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <rect x="58" y="35" width="12" height="35" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <polygon points="56,35 64,18 72,35" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <rect x="42" y="44" width="16" height="26" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M46,70 L46,55 Q50,50 54,55 L54,70" fill="none" stroke="currentColor" stroke-width="1.5"/>
        `;
      case 'auditorio':
        // Arco vanguardista del Auditorio
        return `
          <path d="M25,68 Q45,20 75,32 Q58,35 48,52 L48,68 Z" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M20,70 L80,70" stroke="currentColor" stroke-width="2"/>
        `;
      case 'laurisilva':
        // Rama de laurel y helecho
        return `
          <path d="M30,68 Q50,45 68,22" fill="none" stroke="currentColor" stroke-width="2"/>
          <ellipse cx="40" cy="46" rx="6" ry="12" transform="rotate(-30 40 46)" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <ellipse cx="58" cy="34" rx="6" ry="12" transform="rotate(35 58 34)" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <ellipse cx="68" cy="22" rx="4" ry="8" transform="rotate(20 68 22)" fill="currentColor"/>
        `;
      case 'playa':
        // Palmera canaria y sol
        return `
          <circle cx="34" cy="24" r="8" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M64,70 Q58,45 68,30" fill="none" stroke="currentColor" stroke-width="2.5"/>
          <path d="M68,30 Q50,22 45,26 M68,30 Q65,16 75,18 M68,30 Q82,24 85,32" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M22,70 Q45,66 78,70" fill="none" stroke="currentColor" stroke-width="1.8"/>
        `;
      case 'acantilado':
        // Acantilados verticales de Los Gigantes
        return `
          <polygon points="25,70 30,22 45,30 52,20 68,28 75,70" fill="none" stroke="currentColor" stroke-width="2"/>
          <line x1="30" y1="22" x2="33" y2="70" stroke="currentColor" stroke-width="1.2"/>
          <line x1="52" y1="20" x2="54" y2="70" stroke="currentColor" stroke-width="1.2"/>
          <path d="M20,70 Q50,65 80,70" fill="none" stroke="currentColor" stroke-width="2"/>
        `;
      case 'volcan':
        // Montaña Roja y vela de kitesurf
        return `
          <polygon points="26,70 50,34 74,70" fill="none" stroke="currentColor" stroke-width="2"/>
          <ellipse cx="50" cy="34" rx="8" ry="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
          <path d="M66,22 Q76,14 74,26 Z" fill="currentColor"/>
          <line x1="70" y1="26" x2="65" y2="38" stroke="currentColor" stroke-width="1"/>
        `;
      case 'teide':
      default:
        // El Teide y cielo Starlight
        return `
          <polygon points="22,70 50,18 78,70" fill="none" stroke="currentColor" stroke-width="2.2"/>
          <polygon points="44,28 50,18 56,28" fill="currentColor"/>
          <circle cx="30" cy="18" r="1.5" fill="currentColor"/>
          <circle cx="70" cy="16" r="1.5" fill="currentColor"/>
          <circle cx="48" cy="10" r="2" fill="currentColor"/>
          <circle cx="62" cy="12" r="1.5" fill="currentColor"/>
          <line x1="18" y1="70" x2="82" y2="70" stroke="currentColor" stroke-width="2"/>
        `;
    }
  }
}
