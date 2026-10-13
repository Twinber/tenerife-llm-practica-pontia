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
import { IslandMapModal } from './presentation/IslandMapModal';
import { AnimationViewerModal } from './presentation/AnimationViewerModal';
import { LOCATIONS_CATALOG } from './domain/locationsData';

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
  const islandMapModal = new IslandMapModal(audioService, actionDispatcher.currentLocation);
  const animationViewerModal = new AnimationViewerModal(audioService);

  actionDispatcher.photoAlbumModal = photoAlbumModal;
  actionDispatcher.passportModal = passportModal;
  actionDispatcher.islandMapModal = islandMapModal;

  // Inspección multimodal con lupa VLM en el Álbum de Fotos
  photoAlbumModal.onInspectVlm = async (photo, resultBox, btnInspect) => {
    btnInspect.disabled = true;
    btnInspect.innerText = "⏳ ANALIZANDO PÍXELES CON VLM...";
    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `<em>Observando la imagen con visión multimodal GPT-4o-mini y buscando correspondencias en el Códice RAG...</em>`;

    const imagePath = `assets/img/photos/photo_${String(photo.id).padStart(2, '0')}.jpg`;
    const prompt = `Inspecciona visualmente con lupa esta fotografía de '${photo.title}' (${photo.enclave}). Describe sus detalles clave, verifica su autenticidad y cita los datos históricos de la guía.`;
    const narrative = await actionDispatcher.inspectVisualContext(imagePath, prompt);

    resultBox.innerHTML = `
      <div style="color:#00ffcc; font-weight:bold; margin-bottom:4px;">🔍 ANÁLISIS MULTIMODAL VLM:</div>
      <div>${narrative}</div>
    `;
    btnInspect.disabled = false;
    btnInspect.innerText = "🔍 EXAMINAR CON LUPA (VISIÓN VLM)";
  };

  // Botón contextual del HUD: ¿Dónde estoy? (Deducción visual del escenario mediante VLM)
  const btnWhereAmI = document.getElementById('btn-whereami') as HTMLButtonElement;
  if (btnWhereAmI) {
    btnWhereAmI.addEventListener('click', async () => {
      if (dialogueManager.isWaitingBackend) return;
      audioService.playClick();
      btnWhereAmI.disabled = true;
      btnWhereAmI.innerText = '📍 DEDUCIENDO... ⏳';

      actionDispatcher.isDialogueSpeaking = true;
      if (actionDispatcher.onDialogueSpeechState) actionDispatcher.onDialogueSpeechState(true);

      const locName = actionDispatcher.currentLocation.name;
      const locId = actionDispatcher.currentLocation.id;
      telemetryView.log(`[VLM DEDUCTION] Analizando visualmente el escenario '${locId}' (${locName})...`);

      // Limpiar cola previa y desplegar inmediatamente la burbuja con el relojito de espera ⏳
      dialogueManager.clear();
      dialogueManager.startWaitingBackend(
        'twinber',
        "Twinber: 'Examinando relieve, mar y arquitectura con visión multimodal... ⏳'"
      );
      dialogueManager.enqueue([
        { speaker: 'twinber', text: "Twinber: 'Examinando relieve, mar y arquitectura con visión multimodal... ⏳'" }
      ]);

      try {
        const prompt = `Inspecciona visualmente el escenario en el que me encuentro. Deduce dónde estoy a partir del relieve, vegetación, mar o arquitectura, y explica qué ves.`;
        const narrative = await actionDispatcher.inspectVisualContext(actionDispatcher.currentLocation.bgImage, prompt);

        const formatted = narrative.startsWith('Twinber:') ? narrative : `Twinber: '${narrative}'`;
        dialogueManager.deliverBackendResponse(formatted, 'twinber');
      } catch (err) {
        dialogueManager.deliverBackendResponse(`Twinber: 'Parece que la bruma del mar no me deja distinguir los detalles en este momento.'`, 'twinber');
      } finally {
        btnWhereAmI.disabled = false;
        btnWhereAmI.innerText = '📍 ¿DÓNDE ESTOY?';
      }
    });
  }

  // Sincronizar estado inicial con el backend FastAPI
  actionDispatcher.syncWithBackend();

  // Botón rápido en la cabecera de la consola de telemetría
  const btnCrtAnims = document.getElementById('btn-crt-anims');
  if (btnCrtAnims) {
    btnCrtAnims.addEventListener('click', () => {
      animationViewerModal.open();
      telemetryView.log("Desplegando laboratorio visual de animaciones (SHOW_ANIMS)...");
    });
  }

  islandMapModal.onTravelConfirmed = (targetLocationId: string) => {
    const loc = LOCATIONS_CATALOG.find(l => l.id === targetLocationId);
    if (loc) {
      actionDispatcher.changeLocation(loc, false);
    }
  };
  islandMapModal.onLogMessage = (msg: string) => telemetryView.log(msg);

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
  (window as any).__animationViewerModal = animationViewerModal;
  (window as any).__showAnims = (filter?: string) => animationViewerModal.open(filter);
  (window as any).__hideAnims = () => animationViewerModal.close();

  // Vincular logs a la consola de telemetría
  actionDispatcher.onLogMessage = (msg) => telemetryView.log(msg);

  // Intérprete interactivo de comandos de telemetría para depuración
  telemetryView.onCommand = (rawCmd: string) => {
    const parts = rawCmd.trim().split(/\s+/);
    const cmd = parts[0].toUpperCase();
    const arg = parts.slice(1).join(' ').trim();

    if (cmd === 'SHOW_ANIMS' || cmd === 'SHOW_ANIMATIONS' || cmd === 'ANIMS' || cmd === 'ANIMACIONES' || cmd === 'VER_ANIMACIONES') {
      animationViewerModal.open(arg || undefined);
      telemetryView.log(`Desplegando laboratorio visual de animaciones (SHOW_ANIMS${arg ? ` [${arg}]` : ''})...`);
      return;
    }

    if (cmd === 'HIDE_ANIMS' || cmd === 'CLOSE_ANIMS' || cmd === 'CERRAR_ANIMS') {
      animationViewerModal.close();
      telemetryView.log("Visor de animaciones cerrado.");
      return;
    }

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

    if (cmd === 'MAPA' || cmd === 'MAP') {
      actionDispatcher.openIslandMap();
      telemetryView.log("Desplegando el Mapa de Tenerife...");
      return;
    }

    if (cmd === 'AUDIT' || cmd === 'TELEMETRIA' || cmd === 'TELEMETRY' || cmd === 'LOGS') {
      telemetryView.log("Consultando telemetría y auditoría en tiempo real del backend...");
      actionDispatcher.apiClient.fetchTelemetry().then((data) => {
        if (!data) {
          telemetryView.log("[ERROR] No se pudo conectar con el endpoint /api/telemetry");
          return;
        }
        telemetryView.logRaw(`
          <div style="color:#55ff99; margin:4px 0; font-family: monospace; font-size:10px;">
            <b>*** AUDITORÍA Y OBSERVABILIDAD DEL MOTOR AGÉNTICO ***</b><br>
            • Total eventos registrados: <b>${data.total_eventos_registrados}</b><br>
            • Tokens memoria híbrida: <b>${data.memoria_snapshot.tokens_historial_total} / ${data.memoria_snapshot.presupuesto_max_tokens}</b><br>
            • Mensajes en ventana reciente: <b>${data.memoria_snapshot.mensajes_recientes.length}</b><br>
            • Últimos eventos de auditoría:<br>
            ${data.eventos_recientes.slice(0, 5).map((e: any) => `  - [${e.tipo_evento}] ${e.nombre_operacion} (${e.latencia_ms.toFixed(1)}ms) -> ${e.resultado_resumen}`).join('<br>')}
          </div>
        `);
      });
      return;
    }

    if (cmd === 'ESTADO' || cmd === 'STATE') {
      actionDispatcher.apiClient.fetchState().then((st) => {
        if (!st) {
          telemetryView.log("[ERROR] Backend offline.");
          return;
        }
        telemetryView.logRaw(`
          <div style="color:#00e5ff; font-family: monospace; font-size:10px;">
            <b>[ESTADO BACKEND]</b> Enclave: ${(st as any).ubicacion_actual} | Monedas: ${(st as any).monedas_oro} | Turnos: ${(st as any).turnos_jugados} | Sellos: ${JSON.stringify((st as any).sellos_obtenidos)}
          </div>
        `);
      });
      return;
    }

    if (cmd === 'RESET' || cmd === 'REINICIAR') {
      telemetryView.log("Reiniciando partida en el backend...");
      actionDispatcher.apiClient.resetGame().then(() => {
        telemetryView.log("Partida reseteada. Recargando estado...");
        actionDispatcher.stampedZones.clear();
        actionDispatcher.coins = 15;
        if (actionDispatcher.passportModal) actionDispatcher.passportModal.close();
        if (actionDispatcher.photoAlbumModal) actionDispatcher.photoAlbumModal.close();
        actionDispatcher.syncWithBackend();
      });
      return;
    }

    if (cmd === 'AYUDA' || cmd === 'HELP' || cmd === '?') {
      telemetryView.logRaw(`
        <div style="color:#00e5ff; margin:4px 0; line-height: 1.4;">
          <b>[COMANDOS DISPONIBLES EN TELEMETRÍA]</b><br>
          • <b>AUDIT / TELEMETRIA</b>: Muestra métricas de observabilidad en vivo, latencias y consumo de tokens.<br>
          • <b>ESTADO</b>: Consulta el GameState determinista activo en FastAPI.<br>
          • <b>RESET</b>: Reinicia la partida y limpia la memoria conversacional.<br>
          • <b>SHOW_ANIMS [FILTRO]</b>: Laboratorio visual de animaciones (Twinber + 13 NPCs).<br>
          • <b>MAPA</b>: Abre el mapa de carreteras de Tenerife (o pulsa la tecla 'M').<br>
          • <b>LISTAR_DESTINOS</b>: Muestra todos los 13 enclaves con sus NPCs, tiendas, sellos y fotos.<br>
          • <b>VIAJAR &lt;DESTINO&gt;</b>: Salto inmediato (Ej: VIAJAR la_orotava ó VIAJAR Masca).<br>
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

  // Atajo de teclado: Tecla 'M' abre el Mapa de Tenerife
  window.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    if (actionDispatcher.isInNpcDialogue) return;
    if (e.key === 'm' || e.key === 'M') {
      actionDispatcher.openIslandMap();
    }
  });

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
  telemetryView.log('Consola CLI lista. Escribe AYUDA, LISTAR_DESTINOS o SHOW_ANIMS.');
  // Exponer API interna en window para telemetría y depuración
  (window as any).__twinber = { actionDispatcher, gameEngine, telemetryView, animationViewerModal };

  gameEngine.start();
});
