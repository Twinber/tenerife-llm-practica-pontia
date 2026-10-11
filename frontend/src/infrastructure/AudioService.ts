// ==============================================================================
// INFRASTRUCTURE: Motor de Síntesis de Sonido Retro Web Audio API
// ==============================================================================

export class AudioService {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private initContext(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

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

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}
