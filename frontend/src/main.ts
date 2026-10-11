// ==============================================================================
// ENTRYPOINT: Inicialización e Inyección de Dependencias (Clean Architecture)
// ==============================================================================
import './styles/retro.css';

import { Actor } from './domain/Actor';
import { AudioService } from './infrastructure/AudioService';
import { AssetLoader } from './infrastructure/AssetLoader';
import { DialogueManager } from './application/DialogueManager';
import { ActionDispatcher } from './application/ActionDispatcher';
import { GameEngine } from './application/GameEngine';
import { ViewportView } from './presentation/ViewportView';
import { ScummDockView } from './presentation/ScummDockView';
import { TelemetryView } from './presentation/TelemetryView';

window.addEventListener('DOMContentLoaded', () => {
  // 1. Capa de Infraestructura
  const audioService = new AudioService();
  const assetLoader = new AssetLoader();
  assetLoader.preloadAll();

  // 2. Capa de Dominio (Entidades de los Actores)
  const twinber = new Actor({
    id: 'twinber',
    name: 'Twinber',
    initialX: 24.0,
    initialFacing: 1,
    speed: 0.16,
    walkFrameCount: 6,
    idleFrameCount: 4,
    talkFrameCount: 4,
    minIdlePauseSecs: 3.0,
    maxIdlePauseSecs: 6.5,
    minX: 18.0, // Límite del muelle: no avanzar más allá de la hilera de adoquines/mar
    maxX: 72.0  // Límite frente a Paco y los barriles
  });
  twinber.onStepSound = () => audioService.playStep();

  const paco = new Actor({
    id: 'paco',
    name: 'Paco el Pescador',
    initialX: 82.0,
    initialFacing: -1,
    speed: 0.1,
    walkFrameCount: 1,
    idleFrameCount: 4,
    talkFrameCount: 4,
    minIdlePauseSecs: 4.0,
    maxIdlePauseSecs: 8.5
  });

  // 3. Capa de Aplicación (Casos de Uso)
  const dialogueManager = new DialogueManager(audioService);
  const actionDispatcher = new ActionDispatcher(
    twinber,
    paco,
    dialogueManager,
    audioService
  );

  const gameEngine = new GameEngine(
    twinber,
    paco,
    dialogueManager,
    actionDispatcher
  );

  // 4. Capa de Presentación (Vistas y Componentes UI)
  const telemetryView = new TelemetryView();
  new ScummDockView(actionDispatcher, audioService);
  const viewportView = new ViewportView(
    twinber,
    paco,
    dialogueManager,
    actionDispatcher,
    assetLoader
  );

  // Vincular logs a la consola de telemetría
  actionDispatcher.onLogMessage = (msg) => telemetryView.log(msg);

  // Botón de silenciar audio
  const btnAudio = document.getElementById('btn-audio');
  if (btnAudio) {
    btnAudio.addEventListener('click', () => {
      const isMuted = audioService.toggleMute();
      btnAudio.innerText = isMuted ? '🔇 MUTE' : '🔊 AUDIO';
    });
  }

  // 5. Conectar bucle de renderizado y arrancar motor
  gameEngine.onTick = () => {
    viewportView.render();
  };

  telemetryView.log('Twinber Frontend Clean Architecture inicializado (Vite + TypeScript).');
  telemetryView.log('Escenario activo: Puerto de la Cruz (100% fondo panorámico sin recortes).');

  gameEngine.start();
});
