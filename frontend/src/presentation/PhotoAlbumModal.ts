// ==============================================================================
// PRESENTATION: PhotoAlbumModal (Visor Paginado del Álbum de Fotos de Tenerife)
// ==============================================================================
import photosData from '../domain/photosData.json';
import { AudioService } from '../infrastructure/AudioService';

export interface PhotoEntry {
  id: number;
  filename: string;
  title: string;
  enclave: string;
  quote: string;
}

export class PhotoAlbumModal {
  private modalElem: HTMLElement;
  private gridElem: HTMLElement;
  private counterElem: HTMLElement;
  private pageIndicatorElem: HTMLElement;
  private prevBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private closeBtn: HTMLButtonElement;

  private audioService: AudioService;
  private photos: PhotoEntry[] = photosData;
  private unlockedIds: Set<number> = new Set<number>();
  private currentPage: number = 0;
  private readonly itemsPerPage: number = 4;
  private readonly totalPages: number = Math.ceil(photosData.length / 4);

  public onPhotoUnlocked?: (unlockedCount: number, total: number) => void;

  constructor(audioService: AudioService) {
    this.audioService = audioService;

    this.modalElem = document.getElementById('photo-album-modal')!;
    this.gridElem = document.getElementById('album-slots-grid')!;
    this.counterElem = document.getElementById('album-counter')!;
    this.pageIndicatorElem = document.getElementById('album-page-indicator')!;
    this.prevBtn = document.getElementById('btn-album-prev') as HTMLButtonElement;
    this.nextBtn = document.getElementById('btn-album-next') as HTMLButtonElement;
    this.closeBtn = document.getElementById('btn-close-album') as HTMLButtonElement;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.closeBtn.addEventListener('click', () => this.close());
    this.modalElem.addEventListener('click', (e) => {
      if (e.target === this.modalElem) this.close();
    });

    this.prevBtn.addEventListener('click', () => {
      if (this.currentPage > 0) {
        this.currentPage--;
        this.audioService.playClick();
        this.renderPage();
      }
    });

    this.nextBtn.addEventListener('click', () => {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++;
        this.audioService.playClick();
        this.renderPage();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (!this.isOpen()) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft' && this.currentPage > 0) {
        this.currentPage--;
        this.audioService.playClick();
        this.renderPage();
      }
      if (e.key === 'ArrowRight' && this.currentPage < this.totalPages - 1) {
        this.currentPage++;
        this.audioService.playClick();
        this.renderPage();
      }
    });
  }

  public isOpen(): boolean {
    return !this.modalElem.classList.contains('hidden');
  }

  public open(startAtPage?: number): void {
    if (startAtPage !== undefined) {
      this.currentPage = Math.max(0, Math.min(this.totalPages - 1, startAtPage));
    }
    this.modalElem.classList.remove('hidden');
    this.audioService.playClick();
    this.renderPage();
  }

  public close(): void {
    this.modalElem.classList.add('hidden');
    this.audioService.playClick();
  }

  public unlockPhoto(photoId: number): boolean {
    if (this.unlockedIds.has(photoId)) return false;
    this.unlockedIds.add(photoId);

    // Calcular página de la foto para saltar opcionalmente a ella
    const targetPage = Math.floor((photoId - 1) / this.itemsPerPage);
    this.currentPage = targetPage;

    if (this.onPhotoUnlocked) {
      this.onPhotoUnlocked(this.unlockedIds.size, this.photos.length);
    }
    return true;
  }

  public isUnlocked(photoId: number): boolean {
    return this.unlockedIds.has(photoId);
  }

  public getUnlockedCount(): number {
    return this.unlockedIds.size;
  }

  private renderPage(): void {
    this.counterElem.innerText = `${this.unlockedIds.size}/${this.photos.length}`;
    this.pageIndicatorElem.innerText = `PÁGINA ${this.currentPage + 1} / ${this.totalPages}`;

    this.prevBtn.disabled = this.currentPage === 0;
    this.nextBtn.disabled = this.currentPage === this.totalPages - 1;

    const startIdx = this.currentPage * this.itemsPerPage;
    const currentItems = this.photos.slice(startIdx, startIdx + this.itemsPerPage);

    this.gridElem.innerHTML = '';

    currentItems.forEach((item) => {
      const isUnlocked = this.unlockedIds.has(item.id);
      const card = document.createElement('div');
      card.className = `album-photo-card ${isUnlocked ? 'unlocked' : 'locked'}`;

      if (isUnlocked) {
        card.innerHTML = `
          <div class="photo-img-wrapper">
            <img src="${item.filename}" alt="${item.title}" class="real-photo-img" />
            <span class="photo-id-tag">#${String(item.id).padStart(2, '0')}</span>
          </div>
          <div class="photo-info">
            <div class="photo-title">${item.title}</div>
            <div class="photo-enclave">📍 ${item.enclave}</div>
            <div class="photo-quote">${item.quote}</div>
          </div>
        `;
      } else {
        card.innerHTML = `
          <div class="photo-img-wrapper locked-slot">
            <div class="locked-icon">📷 ❓</div>
            <span class="photo-id-tag">#${String(item.id).padStart(2, '0')}</span>
          </div>
          <div class="photo-info locked-info">
            <div class="photo-title locked-title">FOTO #${String(item.id).padStart(2, '0')}</div>
            <div class="photo-locked-badge">[ BLOQUEADA ]</div>
          </div>
        `;
      }

      this.gridElem.appendChild(card);
    });
  }
}
