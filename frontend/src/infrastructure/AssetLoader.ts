// ==============================================================================
// INFRASTRUCTURE: Cargador y Gestor de Caché de Sprites e Imágenes
// ==============================================================================
import { ActorState } from '../domain/types';

export class AssetLoader {
  private cache: Map<string, HTMLImageElement> = new Map();

  public preloadAll(): void {
    // Sprites de Twinber
    for (let i = 0; i < 6; i++) {
      this.loadImage(`/assets/img/sprites/twinber_walk_${i}.png`);
    }
    for (let i = 0; i < 4; i++) {
      this.loadImage(`/assets/img/sprites/twinber_idle_${i}.png`);
      this.loadImage(`/assets/img/sprites/twinber_talk_${i}.png`);
      this.loadImage(`/assets/img/sprites/paco_idle_${i}.png`);
      this.loadImage(`/assets/img/sprites/paco_talk_${i}.png`);
    }

    // Iconos de Inventario
    const items = [
      'item_monedas', 'item_pasaporte', 'item_album', 'item_brujula',
      'item_gofio', 'item_comanda', 'item_billete', 'item_platano'
    ];
    for (const item of items) {
      this.loadImage(`/assets/img/items/${item}.png`);
    }
  }

  private loadImage(src: string): void {
    if (!this.cache.has(src)) {
      const img = new Image();
      img.src = src;
      this.cache.set(src, img);
    }
  }

  public getActorSpritePath(actorId: string, state: ActorState, frameIdx: number): string {
    const stateStr = state.toLowerCase();
    return `/assets/img/sprites/${actorId}_${stateStr}_${frameIdx}.png`;
  }
}
