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
import { PhotoAlbumModal } from './presentation/PhotoAlbumModal';
import { PassportModal } from './presentation/PassportModal';

window.addEventListener('DOMContentLoaded', () => {
  // 1. Capa de Infraestructura
  const audioService = new AudioService();
  const assetLoader = new AssetLoader();
  assetLoader.preloadAll();

  // 2. Capa de Dominio (Entidades de los Actores)
  const twinber = new Actor({
    id: 'twinber',
    name: 'Twinber',
    initialX: 70.5, // Situado a distancia natural de Paco (82.0%)
    initialBottom: 8,
    initialFacing: 1,
    speed: 0,
    walkFrameCount: 0,
    idleFrameCount: 4,
    talkFrameCount: 4,
    minIdlePauseSecs: 3.0,
    maxIdlePauseSecs: 6.5
  });

  const paco = new Actor({
    id: 'paco',
    name: 'Paco el Pescador',
    initialX: 82.0,
    initialBottom: 8,
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
  const photoAlbumModal = new PhotoAlbumModal(audioService);
  const passportModal = new PassportModal(audioService);
  actionDispatcher.photoAlbumModal = photoAlbumModal;
  actionDispatcher.passportModal = passportModal;

  new ScummDockView(actionDispatcher, audioService);
  const viewportView = new ViewportView(
    twinber,
    paco,
    dialogueManager,
    actionDispatcher,
    assetLoader
  );
  actionDispatcher.viewportView = viewportView;
  actionDispatcher.setupSceneHotspots();

  // Exponer para automatización y pruebas de Playwright
  (window as any).__actionDispatcher = actionDispatcher;
  (window as any).__dialogueManager = dialogueManager;

  // Vincular logs a la consola de telemetría
  actionDispatcher.onLogMessage = (msg) => telemetryView.log(msg);

  // Intérprete interactivo de comandos de telemetría para depuración
  telemetryView.onCommand = (rawCmd: string) => {
    const parts = rawCmd.trim().split(/\s+/);
    const cmd = parts[0].toUpperCase();
    const arg = parts.slice(1).join(' ').trim();

    if (cmd === 'LISTAR_DESTINOS' || cmd === 'DESTINOS' || cmd === 'LIST' || cmd === 'LUGARES') {
      const list = actionDispatcher.listDestinations();
      telemetryView.logRaw(`<pre style="margin:4px 0; color:#55ff99; font-size:10px; line-height:1.3; font-family: monospace;">${list}</pre>`);
      return;
    }

    if (cmd === 'VIAJAR' || cmd === 'IR_A' || cmd === 'GOTO' || cmd === 'TELEPORT') {
      if (!arg) {
        telemetryView.log("[ERROR] Debes especificar un destino. Ej: VIAJAR la_orotava ó VIAJAR Masca");
        return;
      }
      const res = actionDispatcher.teleportTo(arg);
      if (!res.success) {
        telemetryView.log(`[ERROR] ${res.message}`);
      }
      return;
    }

    if (cmd === 'AYUDA' || cmd === 'HELP' || cmd === '?') {
      telemetryView.logRaw(`
        <div style="color:#00e5ff; margin:4px 0; line-height: 1.4;">
          <b>[COMANDOS DISPONIBLES EN TELEMETRÍA]</b><br>
          • <b>LISTAR_DESTINOS</b>: Muestra todos los 13 enclaves con sus NPCs, tiendas, sellos y fotos.<br>
          • <b>VIAJAR &lt;DESTINO&gt;</b>: Salto inmediato ignorando bloqueos y sellos (Ej: VIAJAR la_orotava ó VIAJAR Masca).<br>
          • <b>LIMPIAR</b>: Limpia el historial de la pantalla.<br>
          • <b>CERRAR</b>: Oculta la consola de telemetría (o pulsa ESC / Tecla T).
        </div>
      `);
      return;
    }

    if (cmd === 'LIMPIAR' || cmd === 'CLS' || cmd === 'CLEAR') {
      telemetryView.clear();
      return;
    }

    if (cmd === 'CERRAR' || cmd === 'CLOSE' || cmd === 'SALIR') {
      telemetryView.close();
      return;
    }

    telemetryView.log(`[COMANDO NO RECONOCIDO]: '${rawCmd}'. Escribe AYUDA o LISTAR_DESTINOS.`);
  };

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
  telemetryView.log('Consola CLI lista. Escribe LISTAR_DESTINOS o VIAJAR <UBICACION> para depurar.');
  // Exponer API interna en window para telemetría y depuración
  (window as any).__twinber = { actionDispatcher, gameEngine, telemetryView };

  gameEngine.start();
});
