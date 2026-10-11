// ==============================================================================
// MOTOR DE JUEGO RETRO SCUMM: PUERTO DE LA CRUZ INTERACTIVE DEMO (V2)
// ==============================================================================

class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  beep(freq = 440, type = 'square', duration = 0.05, gain = 0.08) {
    if (this.muted) return;
    this.init();
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
    } catch (e) {}
  }

  playStep() {
    this.beep(110, 'triangle', 0.04, 0.06);
  }

  playCoin() {
    this.beep(987, 'sine', 0.08, 0.12);
    setTimeout(() => this.beep(1318, 'sine', 0.12, 0.12), 60);
  }

  playTalk() {
    this.beep(200 + Math.random() * 90, 'square', 0.03, 0.03);
  }

  playHint() {
    this.beep(523, 'triangle', 0.06, 0.1);
    setTimeout(() => this.beep(659, 'triangle', 0.06, 0.1), 70);
    setTimeout(() => this.beep(783, 'triangle', 0.12, 0.12), 140);
  }
}

class RetroAdventureGame {
  constructor() {
    this.sfx = new SoundFX();
    
    // Elementos DOM
    this.viewport = document.getElementById('scene-viewport');
    this.twinberElem = document.getElementById('twinber-actor');
    this.pacoElem = document.getElementById('paco-actor');
    this.sentenceAction = document.getElementById('sentence-action');
    this.dialogueContainer = document.getElementById('dialogue-container');
    this.consoleElem = document.getElementById('crt-console');
    
    // Estado de Twinber
    this.twinber = {
      xPct: 22.0,
      targetXPct: 22.0,
      speed: 0.16, // % por frame a 60fps
      state: 'IDLE', // 'IDLE', 'WALK', 'TALK'
      facing: 1, // 1: derecha, -1: izquierda
      frameIdx: 0,
      animTimer: 0,
      // Sistema de pausas aleatorias para reposo natural:
      idlePauseTimer: this.randomRange(180, 360), // 3 a 6 segundos en reposo
      idleFidgetPhase: 0, // 0: reposo estático, 1..3: animación secundaria
      onArrival: null
    };

    // Estado de Paco el Pescador
    this.paco = {
      xPct: 82.0,
      state: 'IDLE', // 'IDLE', 'TALK'
      facing: -1, // -1: mirando a la izquierda hacia Twinber
      frameIdx: 0,
      animTimer: 0,
      // Sistema de pausas aleatorias para fumar en pipa:
      idlePauseTimer: this.randomRange(240, 480), // 4 a 8 segundos en reposo
      idleFidgetPhase: 0
    };

    // Cola de Diálogos
    this.dialogueQueue = [];
    this.currentDialogue = null;
    this.dialogueCharTimer = 0;
    this.displayedText = '';
    this.dialogueWaitTimer = 0;

    // Verbo y Acción SCUMM
    this.activeVerb = 'IR A';

    // Precarga de Sprites
    this.sprites = {
      twinber: { walk: [], idle: [], talk: [] },
      paco: { idle: [], talk: [] }
    };

    this.preloadAssets();
    this.bindEvents();
    this.logConsole('Twinber Adventure Engine v2.0 inicializado.');
    this.logConsole('Escenario panorámico completo: Puerto de la Cruz.');
    
    // Bucle principal de animación a 60 fps
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  preloadAssets() {
    for (let i = 0; i < 6; i++) {
      const img = new Image();
      img.src = `assets/img/sprites/twinber_walk_${i}.png`;
      this.sprites.twinber.walk.push(img);
    }
    for (let i = 0; i < 4; i++) {
      const tIdle = new Image();
      tIdle.src = `assets/img/sprites/twinber_idle_${i}.png`;
      this.sprites.twinber.idle.push(tIdle);
      
      const tTalk = new Image();
      tTalk.src = `assets/img/sprites/twinber_talk_${i}.png`;
      this.sprites.twinber.talk.push(tTalk);

      const pIdle = new Image();
      pIdle.src = `assets/img/sprites/paco_idle_${i}.png`;
      this.sprites.paco.idle.push(pIdle);

      const pTalk = new Image();
      pTalk.src = `assets/img/sprites/paco_talk_${i}.png`;
      this.sprites.paco.talk.push(pTalk);
    }
  }

  logConsole(msg) {
    if (!this.consoleElem) return;
    const time = new Date().toTimeString().split(' ')[0];
    this.consoleElem.innerHTML += `<div>[${time}] ${msg}</div>`;
    this.consoleElem.scrollTop = this.consoleElem.scrollHeight;
  }

  bindEvents() {
    // Clic en el suelo para caminar
    this.viewport.addEventListener('click', (e) => {
      if (e.target.classList.contains('hotspot') || e.target.id === 'paco-actor') return;
      
      // Si hay un diálogo activo, un clic en pantalla lo avanza inmediatamente
      if (this.currentDialogue) {
        if (this.displayedText.length < this.currentDialogue.text.length) {
          this.displayedText = this.currentDialogue.text;
          return;
        } else {
          this.playNextDialogue();
          return;
        }
      }

      const rect = this.viewport.getBoundingClientRect();
      const clickXPct = ((e.clientX - rect.left) / rect.width) * 100;
      // Límites del muelle transitable: entre 6% y 88%
      const targetX = Math.max(6, Math.min(88, clickXPct));
      this.moveTo(targetX);
      this.updateSentence('Caminar hacia el muelle...');
    });

    // Botones de Verbos SCUMM
    document.querySelectorAll('.verb-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.verb-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeVerb = btn.dataset.verb;
        this.sfx.beep(330, 'square', 0.04);
        
        if (this.activeVerb === 'PENSAR') {
          this.triggerThinking();
        } else if (this.activeVerb === 'CLIMA') {
          this.triggerWeather();
        } else {
          this.updateSentence(this.activeVerb + '...');
        }
      });
    });

    // Inventario
    document.querySelectorAll('.inventory-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const item = slot.dataset.item;
        if (!item) return;
        this.sfx.playCoin();
        this.updateSentence(`Usar ${item} con...`);
      });
      slot.addEventListener('mouseenter', () => {
        if (slot.dataset.item) this.updateSentence(`Mirar ${slot.dataset.item}`);
      });
      slot.addEventListener('mouseleave', () => {
        this.updateSentence('');
      });
    });

    // Hotspots del Muelle
    this.bindHotspot('hotspot-paco', 'Paco el Pescador', () => {
      this.moveTo(74, () => this.talkToPaco());
    });
    this.bindHotspot('hotspot-barca', 'Barca "El Mojo"', () => {
      this.moveTo(35, () => {
        this.showDialogue('twinber', "Twinber: 'La barca \"El Mojo\"... Típica embarcación pesquera de madera canaria. Huele a mar y salitre.'");
      });
    });
    this.bindHotspot('hotspot-teide', 'El Teide en la cumbre', () => {
      this.showDialogue('twinber', "Twinber: '¡Qué imponente! El volcán Teide se alza a 3.718 metros sobre las nubes.'");
    });
    this.bindHotspot('hotspot-casa', 'Casa Colonial Canaria', () => {
      this.moveTo(60, () => {
        this.showDialogue('twinber', "Twinber: 'Hermosos balcones tradicionales tallados en madera de tea. Pura arquitectura canaria.'");
      });
    });
    this.bindHotspot('hotspot-faro', 'Faro y Fortín de la Costa', () => {
      this.moveTo(12, () => {
        this.showDialogue('twinber', "Twinber: 'El viejo faro guiando a los barcos que llegan desde el Atlántico.'");
      });
    });

    // Clic directo sobre Paco el Pescador
    this.pacoElem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.moveTo(74, () => this.talkToPaco());
    });
    this.pacoElem.addEventListener('mouseenter', () => {
      this.updateSentence('Hablar con Paco el Pescador');
    });
    this.pacoElem.addEventListener('mouseleave', () => {
      this.updateSentence('');
    });

    // Botones de Cabecera
    document.getElementById('btn-audio').addEventListener('click', (e) => {
      this.sfx.muted = !this.sfx.muted;
      e.target.innerText = this.sfx.muted ? '🔇 MUTE' : '🔊 AUDIO';
    });
    document.getElementById('btn-console').addEventListener('click', () => {
      this.consoleElem.classList.toggle('visible');
    });

    // Tecla 'T' o '~' para abrir/cerrar la consola de telemetría
    window.addEventListener('keydown', (e) => {
      if (e.key === 't' || e.key === 'T' || e.key === '~' || e.key === '`') {
        // Evitar que se active si el foco está en un campo de texto
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          this.consoleElem.classList.toggle('visible');
        }
      }
    });
  }

  bindHotspot(id, name, onClick) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('mouseenter', () => this.updateSentence(`${this.activeVerb} ${name}`));
    el.addEventListener('mouseleave', () => this.updateSentence(''));
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sfx.beep(400, 'square', 0.04);
      onClick();
    });
  }

  updateSentence(text) {
    this.sentenceAction.innerText = text || (this.activeVerb + '...');
  }

  moveTo(targetX, onArrival = null) {
    this.twinber.targetXPct = targetX;
    this.twinber.onArrival = onArrival;
    if (Math.abs(this.twinber.xPct - targetX) > 0.6) {
      this.twinber.state = 'WALK';
      this.twinber.facing = targetX > this.twinber.xPct ? 1 : -1;
      this.twinber.idleFidgetPhase = 0;
      this.logConsole(`Twinber camina hacia X: ${targetX.toFixed(1)}%`);
    } else if (onArrival) {
      onArrival();
    }
  }

  talkToPaco() {
    // Asegurar que se miren frente a frente
    this.twinber.facing = 1; // Twinber mira a la derecha hacia Paco
    this.paco.facing = -1;   // Paco mira a la izquierda hacia Twinber
    
    this.dialogueQueue = [
      { speaker: 'twinber', text: "Twinber: '¡Buenos días! Acabo de desembarcar en Puerto de la Cruz. ¿Qué me recomienda ver en la isla?'" },
      { speaker: 'paco', text: "Paco: '¡Chacho, bienvenido a Tenerife, mi niño! Si buscas buen comer y buen gofio, sube al Molino de Chano en La Orotava.'" },
      { speaker: 'paco', text: "Paco: 'Y no tengas prisa por subir al Teide; primero sella todo el Norte en tu pasaporte y tómate un buen barraquito en el muelle.'" },
      { speaker: 'twinber', text: "Twinber: '¡Oído cocina, Paco! Guardaré bien mis 15 monedas para ese gofio.'" }
    ];
    this.playNextDialogue();
  }

  triggerThinking() {
    this.sfx.playHint();
    this.showDialogue('twinber', "Twinber [💡 PENSAR]: 'Llevo 15 monedas en la riñonera y mi pasaporte en blanco. Debería charlar con este viejo pescador para orientarme.'");
  }

  triggerWeather() {
    this.showDialogue('paco', "Paco [CLIMA]: 'El alisio sopla fresco en el muelle a 20°C con mar en calma. Arriba en las Cañadas del Teide seguro que hace rasca.'");
  }

  showDialogue(speaker, text) {
    this.dialogueQueue = [{ speaker, text }];
    this.playNextDialogue();
  }

  playNextDialogue() {
    if (this.dialogueQueue.length === 0) {
      this.currentDialogue = null;
      this.twinber.state = 'IDLE';
      this.twinber.frameIdx = 0;
      this.paco.state = 'IDLE';
      this.paco.frameIdx = 0;
      this.dialogueContainer.innerHTML = '';
      return;
    }
    this.currentDialogue = this.dialogueQueue.shift();
    this.displayedText = '';
    this.dialogueCharTimer = 0;
    this.dialogueWaitTimer = 0;
    
    if (this.currentDialogue.speaker === 'twinber') {
      this.twinber.state = 'TALK';
      this.paco.state = 'IDLE';
      this.paco.frameIdx = 0;
    } else {
      this.paco.state = 'TALK';
      this.twinber.state = 'IDLE';
      this.twinber.frameIdx = 0;
    }
    this.logConsole(`Diálogo [${this.currentDialogue.speaker}]: ${this.currentDialogue.text}`);
  }

  gameLoop() {
    this.updateTwinber();
    this.updatePaco();
    this.updateDialogue();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }

  // Animación de Twinber con pausas orgánicas en reposo
  updateTwinber() {
    const t = this.twinber;
    
    if (t.state === 'WALK') {
      const diff = t.targetXPct - t.xPct;
      if (Math.abs(diff) <= t.speed) {
        t.xPct = t.targetXPct;
        t.state = 'IDLE';
        t.frameIdx = 0;
        t.idlePauseTimer = this.randomRange(180, 360);
        t.idleFidgetPhase = 0;
        if (t.onArrival) {
          const cb = t.onArrival;
          t.onArrival = null;
          cb();
        }
      } else {
        t.xPct += (diff > 0 ? t.speed : -t.speed);
        t.animTimer++;
        if (t.animTimer >= 8) { // zancada fluida a ~7.5 fps
          t.animTimer = 0;
          t.frameIdx = (t.frameIdx + 1) % 6;
          if (t.frameIdx === 0 || t.frameIdx === 3) {
            this.sfx.playStep();
          }
        }
      }
    } else if (t.state === 'IDLE') {
      // Reposo natural: se queda quieto en frame 0, y tras unos segundos hace un gesto breve
      if (t.idlePauseTimer > 0) {
        t.idlePauseTimer--;
        t.frameIdx = 0; // quieto en reposo
      } else {
        // Ejecutar un gesto ocasional (respirar o pulgares arriba)
        t.animTimer++;
        if (t.animTimer >= 18) { // cambio pausado de frame (~300ms)
          t.animTimer = 0;
          t.idleFidgetPhase++;
          if (t.idleFidgetPhase === 1) {
            t.frameIdx = 1; // respiración
          } else if (t.idleFidgetPhase === 2) {
            t.frameIdx = 2; // pulgares arriba
          } else if (t.idleFidgetPhase === 3) {
            t.frameIdx = 3; // ajuste de cámara
          } else {
            // Regresar al reposo y esperar otros 3 a 7 segundos aleatorios
            t.frameIdx = 0;
            t.idleFidgetPhase = 0;
            t.idlePauseTimer = this.randomRange(200, 420);
          }
        }
      }
    } else if (t.state === 'TALK') {
      t.animTimer++;
      if (t.animTimer >= 12) {
        t.animTimer = 0;
        t.frameIdx = (t.frameIdx + 1) % 4;
      }
    }
  }

  // Animación de Paco con pausas orgánicas (fuma en pipa esporádicamente)
  updatePaco() {
    const p = this.paco;

    // Orientación inteligente: Paco siempre mira hacia donde esté Twinber
    p.facing = (this.twinber.xPct < p.xPct) ? -1 : 1;

    if (p.state === 'IDLE') {
      if (p.idlePauseTimer > 0) {
        p.idlePauseTimer--;
        p.frameIdx = 0; // postura tranquila sosteniendo su pipa
      } else {
        // Secuencia ocasional de fumar en pipa:
        p.animTimer++;
        if (p.animTimer >= 22) { // ritmo pausado y veterano
          p.animTimer = 0;
          p.idleFidgetPhase++;
          if (p.idleFidgetPhase === 1) {
            p.frameIdx = 1; // parpadeo reflexivo
          } else if (p.idleFidgetPhase === 2) {
            p.frameIdx = 2; // calada a la pipa con humo
          } else if (p.idleFidgetPhase === 3) {
            p.frameIdx = 3; // bajando la pipa con sonrisa
          } else {
            // Regresar a la quietud marina durante 4 a 9 segundos
            p.frameIdx = 0;
            p.idleFidgetPhase = 0;
            p.idlePauseTimer = this.randomRange(240, 540);
          }
        }
      }
    } else if (p.state === 'TALK') {
      p.animTimer++;
      if (p.animTimer >= 11) {
        p.animTimer = 0;
        p.frameIdx = (p.frameIdx + 1) % 4;
      }
    }
  }

  updateDialogue() {
    if (!this.currentDialogue) return;
    this.dialogueCharTimer++;
    if (this.dialogueCharTimer % 2 === 0 && this.displayedText.length < this.currentDialogue.text.length) {
      this.displayedText = this.currentDialogue.text.substring(0, this.displayedText.length + 1);
      if (Math.random() < 0.35) this.sfx.playTalk();
    }
    
    if (this.displayedText.length >= this.currentDialogue.text.length) {
      this.dialogueWaitTimer++;
      if (this.dialogueWaitTimer > 240) { // ~4 segundos para leer con calma
        this.dialogueWaitTimer = 0;
        this.playNextDialogue();
      }
    }
  }

  render() {
    // 1. Renderizar Twinber
    const t = this.twinber;
    this.twinberElem.style.left = `${t.xPct}%`;
    this.twinberElem.style.transform = `scaleX(${t.facing})`;
    
    let tSrc = '';
    if (t.state === 'WALK') {
      tSrc = `assets/img/sprites/twinber_walk_${t.frameIdx}.png`;
    } else if (t.state === 'TALK') {
      tSrc = `assets/img/sprites/twinber_talk_${t.frameIdx}.png`;
    } else {
      tSrc = `assets/img/sprites/twinber_idle_${t.frameIdx}.png`;
    }
    if (this.twinberElem.getAttribute('src') !== tSrc) {
      this.twinberElem.src = tSrc;
    }

    // 2. Renderizar Paco
    const p = this.paco;
    this.pacoElem.style.left = `${p.xPct}%`;
    this.pacoElem.style.transform = `scaleX(${p.facing})`;
    
    let pSrc = '';
    if (p.state === 'TALK') {
      pSrc = `assets/img/sprites/paco_talk_${p.frameIdx}.png`;
    } else {
      pSrc = `assets/img/sprites/paco_idle_${p.frameIdx}.png`;
    }
    if (this.pacoElem.getAttribute('src') !== pSrc) {
      this.pacoElem.src = pSrc;
    }

    // 3. Renderizar Subtítulo
    if (this.currentDialogue) {
      this.dialogueContainer.innerHTML = `
        <div class="dialogue-text ${this.currentDialogue.speaker}">
          ${this.displayedText}
        </div>
      `;
    }
  }
}

// Inicializar al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
  window.game = new RetroAdventureGame();
});
