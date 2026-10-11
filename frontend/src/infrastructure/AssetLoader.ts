// ==============================================================================
// INFRASTRUCTURE: Cargador y Gestor de Caché de Sprites e Imágenes
// ==============================================================================
import { ActorState } from '../domain/types';

export class AssetLoader {
  private cache: Map<string, HTMLImageElement> = new Map();

  public preloadAll(): void {
    // Sprites de Twinber (Idle, Talk)
    for (let i = 0; i < 4; i++) {
      this.loadImage(`/assets/img/sprites/twinber_idle_${i}.png`);
      this.loadImage(`/assets/img/sprites/twinber_talk_${i}.png`);
    }

    // Sprites de todos los NPCs de los 13 enclaves
    const npcs = [
      'paco', 'chano', 'manolo', 'candido', 'nieves',
      'herminia', 'morales', 'yeray', 'socorrista',
      'tanausu', 'frutero', 'operario', 'guardian'
    ];
    for (const npc of npcs) {
      for (let i = 0; i < 4; i++) {
        this.loadImage(`/assets/img/sprites/${npc}_idle_${i}.png`);
        this.loadImage(`/assets/img/sprites/${npc}_talk_${i}.png`);
      }
    }

    // Iconos de Inventario
    const items = [
      'item_monedas', 'item_pasaporte', 'item_album', 'item_mapa',
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
    const available = [
      'twinber', 'paco', 'chano', 'manolo', 'candido', 'nieves',
      'herminia', 'morales', 'yeray', 'socorrista',
      'tanausu', 'frutero', 'operario', 'guardian'
    ];
    const resolvedId = available.includes(actorId) ? actorId : 'paco';
    return `/assets/img/sprites/${resolvedId}_${stateStr}_${frameIdx}.png`;
  }
}
