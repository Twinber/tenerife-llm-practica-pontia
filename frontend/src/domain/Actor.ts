// ==============================================================================
// DOMAIN: Entidad Actor (Locomoción, animación y pausas orgánicas)
// ==============================================================================
import { ActorState } from './types';

export interface ActorConfig {
  id: string;
  name: string;
  initialX: number;
  initialFacing: number; // 1: derecha, -1: izquierda
  speed: number;
  walkFrameCount: number;
  idleFrameCount: number;
  talkFrameCount: number;
  minIdlePauseSecs: number;
  maxIdlePauseSecs: number;
}

export class Actor {
  public id: string;
  public name: string;
  public xPct: number;
  public targetXPct: number;
  public facing: number;
  public state: ActorState = 'IDLE';
  public frameIdx: number = 0;

  private speed: number;
  private animTimer: number = 0;
  private walkFrameCount: number;
  private idleFrameCount: number;
  private talkFrameCount: number;
  private minIdleTicks: number;
  private maxIdleTicks: number;
  private idlePauseTimer: number;
  private idleFidgetPhase: number = 0;
  private onArrivalCallback: (() => void) | null = null;
  public onStepSound?: () => void;

  constructor(config: ActorConfig) {
    this.id = config.id;
    this.name = config.name;
    this.xPct = config.initialX;
    this.targetXPct = config.initialX;
    this.facing = config.initialFacing;
    this.speed = config.speed;
    this.walkFrameCount = config.walkFrameCount;
    this.idleFrameCount = config.idleFrameCount;
    this.talkFrameCount = config.talkFrameCount;
    this.minIdleTicks = config.minIdlePauseSecs * 60;
    this.maxIdleTicks = config.maxIdlePauseSecs * 60;
    this.idlePauseTimer = this.randomRange(this.minIdleTicks, this.maxIdleTicks);
  }

  private randomRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  public moveTo(targetX: number, onArrival: (() => void) | null = null): void {
    this.targetXPct = targetX;
    this.onArrivalCallback = onArrival;
    if (Math.abs(this.xPct - targetX) > 0.6) {
      this.state = 'WALK';
      this.facing = targetX > this.xPct ? 1 : -1;
      this.idleFidgetPhase = 0;
    } else if (onArrival) {
      onArrival();
    }
  }

  public setTalk(isTalking: boolean): void {
    if (isTalking) {
      this.state = 'TALK';
    } else {
      this.state = 'IDLE';
      this.frameIdx = 0;
      this.idlePauseTimer = this.randomRange(this.minIdleTicks, this.maxIdleTicks);
    }
  }

  public update(): void {
    if (this.state === 'WALK') {
      const diff = this.targetXPct - this.xPct;
      if (Math.abs(diff) <= this.speed) {
        this.xPct = this.targetXPct;
        this.state = 'IDLE';
        this.frameIdx = 0;
        this.idlePauseTimer = this.randomRange(this.minIdleTicks, this.maxIdleTicks);
        this.idleFidgetPhase = 0;
        if (this.onArrivalCallback) {
          const cb = this.onArrivalCallback;
          this.onArrivalCallback = null;
          cb();
        }
      } else {
        this.xPct += diff > 0 ? this.speed : -this.speed;
        this.animTimer++;
        if (this.animTimer >= 8) {
          this.animTimer = 0;
          this.frameIdx = (this.frameIdx + 1) % this.walkFrameCount;
          if ((this.frameIdx === 0 || this.frameIdx === 3) && this.onStepSound) {
            this.onStepSound();
          }
        }
      }
    } else if (this.state === 'IDLE') {
      if (this.idlePauseTimer > 0) {
        this.idlePauseTimer--;
        this.frameIdx = 0;
      } else {
        this.animTimer++;
        if (this.animTimer >= 20) {
          this.animTimer = 0;
          this.idleFidgetPhase++;
          if (this.idleFidgetPhase < this.idleFrameCount) {
            this.frameIdx = this.idleFidgetPhase;
          } else {
            this.frameIdx = 0;
            this.idleFidgetPhase = 0;
            this.idlePauseTimer = this.randomRange(this.minIdleTicks, this.maxIdleTicks);
          }
        }
      }
    } else if (this.state === 'TALK') {
      this.animTimer++;
      if (this.animTimer >= 11) {
        this.animTimer = 0;
        this.frameIdx = (this.frameIdx + 1) % this.talkFrameCount;
      }
    }
  }
}
