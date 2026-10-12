// ==============================================================================
// PRESENTATION: PhotoAlbumModal (Visor Individual a Pantalla Completa - 1 Foto por Página)
// ==============================================================================
import photosData from '../domain/photosData.json';
import { AudioService } from '../infrastructure/AudioService';

export interface PhotoEntry {
  id: number;
  filename: string;
  title: string;
  enclave: string;
  trigger: string;
  quote: string;
}

export class PhotoAlbumModal {
  private modalElem: HTMLElement;
  private viewerElem: HTMLElement;
  private counterElem: HTMLElement;
  private pageIndicatorElem: HTMLElement;
  private prevBtn: HTMLButtonElement;
  private nextBtn: HTMLButtonElement;
  private closeBtn: HTMLButtonElement;

  private audioService: AudioService;
  private photos: PhotoEntry[] = photosData;
  private unlockedIds: Set<number> = new Set<number>();
  private currentPhotoIndex: number = 0; // 0 a 36 (37 fotos)

  public onPhotoUnlocked?: (unlockedCount: number, total: number) => void;

  constructor(audioService: AudioService) {
    this.audioService = audioService;

    this.modalElem = document.getElementById('photo-album-modal')!;
    this.viewerElem = document.getElementById('album-slots-grid')!;
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
      if (this.currentPhotoIndex > 0) {
        this.currentPhotoIndex--;
        this.audioService.playClick();
        this.renderSinglePhoto();
      }
    });

    this.nextBtn.addEventListener('click', () => {
      if (this.currentPhotoIndex < this.photos.length - 1) {
        this.currentPhotoIndex++;
        this.audioService.playClick();
        this.renderSinglePhoto();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (!this.isOpen()) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft' && this.currentPhotoIndex > 0) {
        this.currentPhotoIndex--;
        this.audioService.playClick();
        this.renderSinglePhoto();
      }
      if (e.key === 'ArrowRight' && this.currentPhotoIndex < this.photos.length - 1) {
        this.currentPhotoIndex++;
        this.audioService.playClick();
        this.renderSinglePhoto();
      }
    });
  }

  public isOpen(): boolean {
    return !this.modalElem.classList.contains('hidden');
  }

  public open(targetPhotoId?: number): void {
    if (targetPhotoId !== undefined) {
      const idx = this.photos.findIndex((p) => p.id === targetPhotoId);
      if (idx !== -1) this.currentPhotoIndex = idx;
    }
    this.modalElem.classList.remove('hidden');
    this.audioService.playClick();
    this.renderSinglePhoto();
  }

  public close(): void {
    this.modalElem.classList.add('hidden');
    this.audioService.playClick();
  }

  public unlockPhoto(photoId: number): boolean {
    if (this.unlockedIds.has(photoId)) return false;
    this.unlockedIds.add(photoId);

    // Enfocar automáticamente en la foto recién obtenida
    const idx = this.photos.findIndex((p) => p.id === photoId);
    if (idx !== -1) this.currentPhotoIndex = idx;

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

  private renderSinglePhoto(): void {
    this.counterElem.innerText = `${this.unlockedIds.size}/${this.photos.length}`;
    this.pageIndicatorElem.innerText = `FOTO ${this.currentPhotoIndex + 1} / ${this.photos.length}`;

    this.prevBtn.disabled = this.currentPhotoIndex === 0;
    this.nextBtn.disabled = this.currentPhotoIndex === this.photos.length - 1;

    const item = this.photos[this.currentPhotoIndex];
    const isUnlocked = this.unlockedIds.has(item.id);

    this.viewerElem.innerHTML = '';

    const singleContainer = document.createElement('div');
    singleContainer.className = `single-photo-view ${isUnlocked ? 'unlocked' : 'locked'}`;

    if (isUnlocked) {
      singleContainer.innerHTML = `
        <div class="full-photo-frame">
          <img src="${item.filename}" alt="${item.title}" class="full-photo-img" />
          <span class="full-photo-badge">#${String(item.id).padStart(2, '0')}</span>
        </div>
        <div class="full-photo-caption">
          <div class="caption-header">
            <span class="caption-title">${item.title}</span>
            <span class="caption-enclave">📍 ${item.enclave}</span>
          </div>
          <p class="caption-text">${item.quote}</p>
        </div>
      `;
    } else {
      singleContainer.innerHTML = `
        <div class="full-photo-frame locked-full-frame">
          <div class="locked-polaroid-art">
            <div class="locked-camera-glyph">📷</div>
            <div class="locked-num">#${String(item.id).padStart(2, '0')}</div>
          </div>
        </div>
        <div class="full-photo-caption locked-caption">
          <div class="caption-header">
            <span class="caption-title locked-title">FOTO #${String(item.id).padStart(2, '0')}</span>
            <span class="caption-locked-tag">[ BLOQUEADA ]</span>
          </div>
          <p class="caption-text locked-subtext">Descúbrela explorando los enclaves de Tenerife.</p>
        </div>
      `;
    }

    this.viewerElem.appendChild(singleContainer);
  }
}
