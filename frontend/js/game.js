// ==============================================================================
// MOTOR DE JUEGO RETRO SCUMM: PUERTO DE LA CRUZ INTERACTIVE DEMO
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

  beep(freq = 440, type = 'square', duration = 0.05, gain = 0.1) {
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
    this.beep(120, 'triangle', 0.04, 0.08);
  }

  playCoin() {
    this.beep(987, 'sine', 0.08, 0.15);
    setTimeout(() => this.beep(1318, 'sine', 0.12, 0.15), 60);
  }

  playTalk() {
    this.beep(220 + Math.random() * 80, 'square', 0.03, 0.04);
  }

  playHint() {
    this.beep(523, 'triangle', 0.06, 0.12);
    setTimeout(() => this.beep(659, 'triangle', 0.06, 0.12), 70);
    setTimeout(() => this.beep(783, 'triangle', 0.12, 0.15), 140);
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
    this.crtOverlay = document.getElementById('crt-overlay');
    this.consoleElem = document.getElementById('crt-console');
    
    // Estado de Twinber
    this.twinber = {
      xPct: 20.0,
      targetXPct: 20.0,
      speed: 0.18, // % por frame a 60fps
      state: 'IDLE', // 'IDLE', 'WALK', 'TALK'
      facing: 1, // 1: derecha, -1: izquierda
      frameIdx: 0,
      animTimer: 0,
      stepSoundTimer: 0,
      onArrival: null
    };

    // Estado de Paco
    this.paco = {
      state: 'IDLE', // 'IDLE', 'TALK'
      frameIdx: 0,
      animTimer: 0
    };

    // Diálogos activos
    this.dialogueQueue = [];
    this.currentDialogue = null;
    this.dialogueCharTimer = 0;
    this.displayedText = '';

    // Verbo y Acción SCUMM
    this.activeVerb = 'IR A';
    this.hoverTarget = '';

    // Cache de Sprites pre-cargados
    this.sprites = {
      twinber: { walk: [], idle: [], talk: [] },
      paco: { idle: [], talk: [] }
    };

    this.preloadAssets();
    this.bindEvents();
    this.logConsole('Twinber Adventure Engine v1.0 inicializado.');
    this.logConsole('Escenario: Puerto de la Cruz (Enclave 01).');
    
    // Iniciar bucle de renderizado a 60 fps
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  preloadAssets() {
    // Twinber
    for (let i = 0; i < 6; i++) {
      const img = new Image();
      img.src = `assets/img/sprites/twinber_walk_${i}.png`;
      this.sprites.twinber.walk.push(img);
    }
    for (let i = 0; i < 4; i++) {
      const img1 = new Image();
      img1.src = `assets/img/sprites/twinber_idle_${i}.png`;
      this.sprites.twinber.idle.push(img1);
      const img2 = new Image();
      img2.src = `assets/img/sprites/twinber_talk_${i}.png`;
      this.sprites.twinber.talk.push(img2);
    }
    // Paco
    for (let i = 0; i < 4; i++) {
      const img1 = new Image();
      img1.src = `assets/img/sprites/paco_idle_${i}.png`;
      this.sprites.paco.idle.push(img1);
      const img2 = new Image();
      img2.src = `assets/img/sprites/paco_talk_${i}.png`;
      this.sprites.paco.talk.push(img2);
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
      // Ignorar si se hace clic en un hotspot directamente
      if (e.target.classList.contains('hotspot') || e.target.id === 'paco-actor') return;
      const rect = this.viewport.getBoundingClientRect();
      const clickXPct = ((e.clientX - rect.left) / rect.width) * 100;
      // Limitar suelo transitable entre 8% y 88%
      const targetX = Math.max(8, Math.min(88, clickXPct));
      this.moveTo(targetX);
      this.updateSentence('Caminar hacia el muelle');
    });

    // Verbos SCUMM
    document.querySelectorAll('.verb-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
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
        this.sfx.playCoin();
        this.updateSentence(`Usar ${item} con...`);
      });
      slot.addEventListener('mouseenter', () => {
        this.updateSentence(`Mirar ${slot.dataset.item}`);
      });
      slot.addEventListener('mouseleave', () => {
        this.updateSentence('');
      });
    });

    // Hotspots
    this.bindHotspot('hotspot-paco', 'Paco el Pescador', () => {
      this.moveTo(68, () => this.talkToPaco());
    });
    this.bindHotspot('hotspot-barca', 'Barca "El Mojo"', () => {
      this.moveTo(35, () => {
        this.showDialogue('twinber', "Twinber: 'La barca \"El Mojo\"... Huele a marisco fresco y pintura náutica.'");
      });
    });
    this.bindHotspot('hotspot-teide', 'El Teide en el horizonte', () => {
      this.showDialogue('twinber', "Twinber: '¡Qué impresionante! El volcán Teide recortado contra el cielo.'");
    });
    this.bindHotspot('hotspot-casa', 'Casa Colonial con balcón de madera', () => {
      this.moveTo(55, () => {
        this.showDialogue('twinber', "Twinber: 'Balcones tallados en madera de tea tradicional canaria. Magnífico arte colonial.'");
      });
    });

    // Clic directo sobre Paco
    this.pacoElem.addEventListener('click', (e) => {
      e.stopPropagation();
      this.moveTo(68, () => this.talkToPaco());
    });
    this.pacoElem.addEventListener('mouseenter', () => {
      this.updateSentence('Hablar con Paco el Pescador');
    });
    this.pacoElem.addEventListener('mouseleave', () => {
      this.updateSentence('');
    });

    // Tecla ~ para consola de desarrollador
    window.addEventListener('keydown', (e) => {
      if (e.key === '~' || e.key === '`') {
        this.consoleElem.classList.toggle('visible');
      }
    });

    // Controles superiores
    document.getElementById('btn-crt').addEventListener('click', () => {
      this.crtOverlay.classList.toggle('disabled');
    });
    document.getElementById('btn-audio').addEventListener('click', (e) => {
      this.sfx.muted = !this.sfx.muted;
      e.target.innerText = this.sfx.muted ? '🔇 MUTE' : '🔊 AUDIO';
    });
    document.getElementById('btn-console').addEventListener('click', () => {
      this.consoleElem.classList.toggle('visible');
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
    if (Math.abs(this.twinber.xPct - targetX) > 0.5) {
      this.twinber.state = 'WALK';
      this.twinber.facing = targetX > this.twinber.xPct ? 1 : -1;
      this.logConsole(`Twinber se desplaza hacia X: ${targetX.toFixed(1)}%`);
    } else if (onArrival) {
      onArrival();
    }
  }

  talkToPaco() {
    this.dialogueQueue = [
      { speaker: 'twinber', text: "Twinber: '¡Buenos días! Acabo de desembarcar en Puerto de la Cruz. ¿Qué me recomienda ver en la isla?'" },
      { speaker: 'paco', text: "Paco: '¡Chacho, bienvenido a Tenerife, mi niño! Si buscas buen comer y buen gofio, sube al Molino de Chano en La Orotava.'" },
      { speaker: 'paco', text: "Paco: 'Y no tengas prisa por subir al Teide; primero sella todo el Norte en tu pasaporte y tómate un barraquito en el muelle.'" },
      { speaker: 'twinber', text: "Twinber: '¡Oído cocina, Paco! Guardaré bien mis 15 monedas para ese gofio.'" }
    ];
    this.playNextDialogue();
  }

  triggerThinking() {
    this.sfx.playHint();
    this.showDialogue('twinber', "Twinber [💡 PENSAR]: 'Tengo 15 monedas en la riñonera y mi pasaporte en blanco. Debería hablar con Paco el Pescador para orientarme.'");
  }

  triggerWeather() {
    this.showDialogue('paco', "Paco [CLIMA]: 'El alisio sopla suave en el puerto a 21°C con marea calma. En las cumbres del Teide seguro que hace rasca.'");
  }

  showDialogue(speaker, text) {
    this.dialogueQueue = [{ speaker, text }];
    this.playNextDialogue();
  }

  playNextDialogue() {
    if (this.dialogueQueue.length === 0) {
      this.currentDialogue = null;
      this.twinber.state = 'IDLE';
      this.paco.state = 'IDLE';
      this.dialogueContainer.innerHTML = '';
      return;
    }
    this.currentDialogue = this.dialogueQueue.shift();
    this.displayedText = '';
    this.dialogueCharTimer = 0;
    
    if (this.currentDialogue.speaker === 'twinber') {
      this.twinber.state = 'TALK';
      this.paco.state = 'IDLE';
    } else {
      this.paco.state = 'TALK';
      this.twinber.state = 'IDLE';
    }
    this.logConsole(`Diálogo [${this.currentDialogue.speaker}]: ${this.currentDialogue.text}`);
  }

  gameLoop(timestamp) {
    this.updateTwinber();
    this.updatePaco();
    this.updateDialogue();
    this.render();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  updateTwinber() {
    const t = this.twinber;
    // Movimiento
    if (t.state === 'WALK') {
      const diff = t.targetXPct - t.xPct;
      if (Math.abs(diff) <= t.speed) {
        t.xPct = t.targetXPct;
        t.state = 'IDLE';
        t.frameIdx = 0;
        if (t.onArrival) {
          const cb = t.onArrival;
          t.onArrival = null;
          cb();
        }
      } else {
        t.xPct += (diff > 0 ? t.speed : -t.speed);
        // Animación de caminata (6 frames a ~8 fps)
        t.animTimer++;
        if (t.animTimer >= 7) {
          t.animTimer = 0;
          t.frameIdx = (t.frameIdx + 1) % 6;
          // Sonido de pasos
          if (t.frameIdx === 0 || t.frameIdx === 3) {
            this.sfx.playStep();
          }
        }
      }
    } else if (t.state === 'IDLE') {
      t.animTimer++;
      if (t.animTimer >= 20) {
        t.animTimer = 0;
        t.frameIdx = (t.frameIdx + 1) % 4;
      }
    } else if (t.state === 'TALK') {
      t.animTimer++;
      if (t.animTimer >= 10) {
        t.animTimer = 0;
        t.frameIdx = (t.frameIdx + 1) % 4;
      }
    }
  }

  updatePaco() {
    const p = this.paco;
    p.animTimer++;
    if (p.state === 'IDLE') {
      if (p.animTimer >= 24) {
        p.animTimer = 0;
        p.frameIdx = (p.frameIdx + 1) % 4;
      }
    } else if (p.state === 'TALK') {
      if (p.animTimer >= 10) {
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
      if (Math.random() < 0.4) this.sfx.playTalk();
    }
    
    // Si ha terminado de escribir, esperar 3.5 segundos antes de pasar al siguiente
    if (this.displayedText.length >= this.currentDialogue.text.length) {
      if (!this.dialogueWaitTimer) this.dialogueWaitTimer = 1;
      this.dialogueWaitTimer++;
      if (this.dialogueWaitTimer > 200) { // ~3.3 segundos
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
