// ==============================================================================
// DOMAIN TYPES: Modelos y contratos de negocio del Frontend de Twinber
// ==============================================================================

export type VerbType = 'HABLAR' | 'MIRAR' | 'USAR' | 'IR A' | 'CLIMA' | 'PENSAR';

export type ActorState = 'IDLE' | 'WALK' | 'TALK';

export type SpeakerType = 'twinber' | 'paco' | 'narration';

export interface DialogueLine {
  speaker: SpeakerType;
  text: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  badge?: string;
  inspectable?: boolean;
}

export interface HotspotData {
  id: string;
  name: string;
  leftPct: number;
  topPct?: number;
  bottomPct?: number;
  widthPct: number;
  heightPct: number;
  targetXPct: number;
  action: () => void;
}

export interface GameState {
  currentLocationId: string;
  coins: number;
  passportStamps: string[];
  photosCount: number;
  inventory: InventoryItem[];
}
