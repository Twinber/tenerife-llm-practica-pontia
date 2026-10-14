// ==============================================================================
// INFRASTRUCTURE: Motor de Audio (Efectos Retro Web Audio + Música Ambiental Secuencial)
// ==============================================================================

export interface MusicTrack {
  id: string;
  title: string;
  url: string;
}

export const AMBIENT_PLAYLIST: MusicTrack[] = [
  {
    id: 'track_1',
    title: 'Path to the Volcanic Pier',
    url: '/assets/music/Path_to_the_Volcanic_Pier.mp3'
  },
  {
    id: 'track_2',
    title: 'Where Basalt Meets Foam',
    url: '/assets/music/Where_Basalt_Meets_Foam.mp3'
  },
  {
    id: 'track_3',
    title: 'Where The Ocean Meets Stars',
    url: '/assets/music/Where_The_Ocean_Meets_Stars.mp3'
  }
];

export class AudioService {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  // Sistema de Banda Sonora Ambiental Secuencial
  private bgMusic: HTMLAudioElement | null = null;
  private musicIndex: number = 0;
  private musicPauseTimer: number | null = null;
  public isMusicActive: boolean = false;
  private musicVolume: number = 0.28; // Volumen equilibrado para música de fondo
  private pauseBetweenTracksMs: number = 4000; // Breve pausa de 4 segundos entre temas
  private unlockListenerBound: boolean = false;

  public onMusicTrackChange?: (track: MusicTrack, index: number) => void;

  constructor() {
    this.setupAutoplayUnlock();
  }

  // ----------------------------------------------------------------------------
  // GESTIÓN DE MÚSICA AMBIENTAL SECUENCIAL
  // ----------------------------------------------------------------------------

  /**
   * Intenta reproducir la música de inmediato o registra un oyente para el primer clic/tecla.
   */
  private setupAutoplayUnlock(): void {
    if (this.unlockListenerBound) return;
    this.unlockListenerBound = true;

    const unlockHandler = () => {
      this.initContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      if (!this.isMuted && !this.isMusicActive) {
        this.playCurrentMusicTrack();
      }
      window.removeEventListener('pointerdown', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
      this.unlockListenerBound = false;
    };

    window.addEventListener('pointerdown', unlockHandler, { once: false });
    window.addEventListener('keydown', unlockHandler, { once: false });

    // Intentar arranque directo por si el navegador ya permite autoplay
    setTimeout(() => {
      if (!this.isMuted && !this.isMusicActive) {
        this.playCurrentMusicTrack();
      }
    }, 200);
  }

  /**
   * Arranca la reproducción del tema musical actual de la playlist.
   */
  public playCurrentMusicTrack(): void {
    if (this.isMuted) return;

    if (this.musicPauseTimer) {
      window.clearTimeout(this.musicPauseTimer);
      this.musicPauseTimer = null;
    }

    const track = AMBIENT_PLAYLIST[this.musicIndex];
    if (!track) return;

    if (!this.bgMusic) {
      this.bgMusic = new Audio();
      this.bgMusic.preload = 'auto';

      this.bgMusic.addEventListener('ended', () => {
        this.onMusicTrackEnded();
      });

      this.bgMusic.addEventListener('error', (e) => {
        console.warn(`[AudioService] Error cargando pista '${track.title}':`, e);
        this.onMusicTrackEnded();
      });
    }

    this.bgMusic.src = track.url;
    this.bgMusic.volume = this.isMuted ? 0 : this.musicVolume;
    this.bgMusic.loop = false; // No repetir la misma pista; avanzar secuencialmente

    this.bgMusic.play()
      .then(() => {
        this.isMusicActive = true;
        if (this.onMusicTrackChange) {
          this.onMusicTrackChange(track, this.musicIndex);
        }
      })
      .catch(() => {
        // Bloqueo de política de autoplay del navegador antes del primer gesto
        this.isMusicActive = false;
      });
  }

  /**
   * Se ejecuta al finalizar un tema: aplica una pausa breve y avanza al siguiente.
   */
  private onMusicTrackEnded(): void {
    this.isMusicActive = false;

    // Avanzar secuencialmente a la siguiente pista (cíclico: 0 -> 1 -> 2 -> 0)
    this.musicIndex = (this.musicIndex + 1) % AMBIENT_PLAYLIST.length;

    if (this.musicPauseTimer) {
      window.clearTimeout(this.musicPauseTimer);
    }

    // Breve pausa entre canciones
    this.musicPauseTimer = window.setTimeout(() => {
      this.musicPauseTimer = null;
      if (!this.isMuted) {
        this.playCurrentMusicTrack();
      }
    }, this.pauseBetweenTracksMs);
  }

  /**
   * Salta manualmente al siguiente tema musical de la lista.
   */
  public nextMusicTrack(): void {
    if (this.bgMusic) {
      this.bgMusic.pause();
    }
    this.onMusicTrackEnded();
  }

  /**
   * Obtiene la pista de música actualmente en reproducción o turno.
   */
  public getCurrentTrack(): MusicTrack {
    return AMBIENT_PLAYLIST[this.musicIndex];
  }

  /**
   * Ajusta el volumen de la música ambiental (0.0 a 1.0).
   */
  public setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.bgMusic && !this.isMuted) {
      this.bgMusic.volume = this.musicVolume;
    }
  }

  // ----------------------------------------------------------------------------
  // GESTIÓN DE SILENCIO (MUTE) & CONTEXTO WEB AUDIO
  // ----------------------------------------------------------------------------

  private initContext(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;

    if (this.isMuted) {
      // Pausar música y cancelar temporizadores de pausa
      if (this.bgMusic) {
        this.bgMusic.pause();
      }
      if (this.musicPauseTimer) {
        window.clearTimeout(this.musicPauseTimer);
        this.musicPauseTimer = null;
      }
      this.isMusicActive = false;
    } else {
      // Reanudar música
      if (this.bgMusic && this.bgMusic.src) {
        this.bgMusic.volume = this.musicVolume;
        this.bgMusic.play()
          .then(() => { this.isMusicActive = true; })
          .catch(() => this.setupAutoplayUnlock());
      } else {
        this.playCurrentMusicTrack();
      }
    }

    return this.isMuted;
  }

  // ----------------------------------------------------------------------------
  // SÍNTESIS RETRO WEB AUDIO API (EFECTOS DE SONIDO / SFX)
  // ----------------------------------------------------------------------------

  public beep(freq = 440, type: OscillatorType = 'square', duration = 0.05, gain = 0.08): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      g.gain.setValueAtTime(gain, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Ignorar restricciones de audio antes de interacción
    }
  }

  public playStep(): void {
    this.beep(110, 'triangle', 0.04, 0.06);
  }

  public playCoin(): void {
    this.beep(987, 'sine', 0.08, 0.12);
    setTimeout(() => this.beep(1318, 'sine', 0.12, 0.12), 60);
  }

  public playTalk(): void {
    this.beep(200 + Math.random() * 90, 'square', 0.03, 0.03);
  }

  public playHint(): void {
    this.beep(523, 'triangle', 0.06, 0.1);
    setTimeout(() => this.beep(659, 'triangle', 0.06, 0.1), 70);
    setTimeout(() => this.beep(783, 'triangle', 0.12, 0.12), 140);
  }

  public playClick(): void {
    this.beep(330, 'square', 0.04, 0.05);
  }

  public playPageTurn(): void {
    this.beep(220, 'triangle', 0.04, 0.05);
    setTimeout(() => this.beep(330, 'triangle', 0.05, 0.04), 30);
  }

  public playError(): void {
    this.beep(160, 'sawtooth', 0.12, 0.08);
    setTimeout(() => this.beep(120, 'sawtooth', 0.16, 0.08), 80);
  }

  public playTravelTick(): void {
    this.beep(950 + Math.random() * 150, 'triangle', 0.02, 0.04);
  }

  public playTravelArrival(): void {
    this.beep(523, 'triangle', 0.09, 0.10);
    setTimeout(() => this.beep(659, 'triangle', 0.09, 0.10), 90);
    setTimeout(() => this.beep(784, 'triangle', 0.11, 0.12), 180);
    setTimeout(() => this.beep(1046, 'sine', 0.28, 0.14), 280);
  }
}
