// ==============================================================================
// INFRASTRUCTURE: Cliente HTTP REST y Consumidor de Server-Sent Events (SSE)
// ==============================================================================
import { GameState, ExecutionStep } from '../domain/types';

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

  public async updateState(updates: Record<string, any>): Promise<GameState | null> {
    try {
      const res = await fetch(`${this.baseUrl}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) return await res.json();
    } catch {
      // Modo demo offline
    }
    return null;
  }

  public async sendAction(
    actionType: string = 'OBSERVAR',
    targetId?: string,
    itemId?: string,
    freeText?: string,
    location?: string,
    imagePath?: string,
    coins?: number
  ): Promise<any> {
    try {
      const body: any = {
        tipo_accion: actionType,
        verbo: actionType,
        target_hotspot_id: targetId,
        item_id: itemId,
        texto_libre: freeText,
        ubicacion: location,
        image_path: imagePath
      };
      if (typeof coins === 'number') body.monedas = coins;
      const res = await fetch(`${this.baseUrl}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) return await res.json();
    } catch {
      // Modo demo offline
    }
    return null;
  }

  public async fetchTelemetry(): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/telemetry`);
      if (res.ok) return await res.json();
    } catch {
      // Modo offline
    }
    return null;
  }

  public async resetGame(): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/reset`, { method: 'POST' });
      if (res.ok) return await res.json();
    } catch {
      // Modo offline
    }
    return null;
  }

  public subscribeToStream(
    text: string,
    location?: string,
    imagePath?: string,
    coins?: number,
    onToken?: (token: string) => void,
    onMetadata?: (meta: any) => void,
    onStep?: (step: ExecutionStep) => void,
    onComplete?: () => void,
    onError?: () => void
  ): EventSource | null {
    try {
      const params = new URLSearchParams({ texto: text });
      if (location) params.append('ubicacion', location);
      if (imagePath) params.append('image_path', imagePath);
      if (typeof coins === 'number') params.append('monedas', coins.toString());

      const es = new EventSource(`${this.baseUrl}/stream?${params.toString()}`);
      es.onmessage = (event) => {
        if (event.data === '[DONE]') {
          if (onComplete) onComplete();
          es.close();
        } else if (event.data.startsWith('[STEP]')) {
          try {
            const step = JSON.parse(event.data.substring(6)) as ExecutionStep;
            if (onStep) onStep(step);
          } catch (e) {
            console.warn('[SSE] Error parseando step:', e);
          }
        } else if (event.data.startsWith('[META]')) {
          try {
            const meta = JSON.parse(event.data.substring(6));
            if (onMetadata) onMetadata(meta);
          } catch (e) {
            console.warn('[SSE] Error parseando metadata:', e);
          }
        } else if (event.data.startsWith('[TOKEN]')) {
          try {
            const token = JSON.parse(event.data.substring(7));
            if (onToken) onToken(token);
          } catch (e) {
            if (onToken) onToken(event.data.substring(7));
          }
        } else {
          if (onToken) onToken(event.data);
        }
      };
      es.onerror = () => {
        es.close();
        if (onError) onError();
        else if (onComplete) onComplete();
      };
      return es;
    } catch {
      if (onError) onError();
      else if (onComplete) onComplete();
      return null;
    }
  }
}
