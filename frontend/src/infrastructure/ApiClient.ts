// ==============================================================================
// INFRASTRUCTURE: Cliente HTTP REST y Consumidor de Server-Sent Events (SSE)
// ==============================================================================
import { GameState } from '../domain/types';

export class ApiClient {
  private baseUrl: string = '/api';

  public async fetchState(): Promise<GameState | null> {
    try {
      const res = await fetch(`${this.baseUrl}/state`);
      if (res.ok) return await res.json();
    } catch {
      // Fallback silencioso en modo demo sin backend
    }
    return null;
  }

  public async sendAction(actionType: string = 'OBSERVAR', targetId?: string, itemId?: string, freeText?: string): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_accion: actionType,
          verbo: actionType,
          target_hotspot_id: targetId,
          item_id: itemId,
          texto_libre: freeText
        })
      });
      if (res.ok) return await res.json();
    } catch {
      // Modo demo offline
    }
    return null;
  }

  public subscribeToStream(onToken: (token: string) => void, onComplete: () => void): EventSource | null {
    try {
      const es = new EventSource(`${this.baseUrl}/stream`);
      es.onmessage = (event) => {
        if (event.data === '[DONE]') {
          onComplete();
          es.close();
        } else {
          onToken(event.data);
        }
      };
      es.onerror = () => {
        es.close();
        onComplete();
      };
      return es;
    } catch {
      onComplete();
      return null;
    }
  }
}
