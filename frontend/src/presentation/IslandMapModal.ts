// ==============================================================================
// PRESENTATION: IslandMapModal (Mapa de Carreteras de Tenerife & Animación Indiana Jones)
// ==============================================================================
import { AudioService } from '../infrastructure/AudioService';
import { LOCATIONS_CATALOG, LocationSceneDef } from '../domain/locationsData';
import { TravelRules } from '../domain/TravelRules';

export class IslandMapModal {
  private modalElem: HTMLElement;
  private svgContainer: HTMLElement;
  private bannerTextElem: HTMLElement;
  private currentPillElem: HTMLElement;
  private closeBtn: HTMLButtonElement;

  private audioService: AudioService;
  private currentLocation: LocationSceneDef;
  private stampedZones: Set<string> = new Set<string>();
  private acquiredItems: string[] = [];

  public isTraveling: boolean = false;
  public onTravelConfirmed?: (targetLocationId: string) => void;
  public onLogMessage?: (msg: string) => void;

  constructor(audioService: AudioService, initialLocation: LocationSceneDef) {
    this.audioService = audioService;
    this.currentLocation = initialLocation;

    this.modalElem = document.getElementById('island-map-modal')!;
    this.svgContainer = document.getElementById('map-svg-container')!;
    this.bannerTextElem = document.getElementById('map-banner-text')!;
    this.currentPillElem = document.getElementById('map-current-location-pill')!;
    this.closeBtn = document.getElementById('btn-close-map') as HTMLButtonElement;

    this.initMapSvg();
    this.bindEvents();
  }

  private initMapSvg(): void {
    // Inyectar el SVG cartográfico de Tenerife con todas sus capas geográficas, carreteras y capas de interacción
    this.svgContainer.innerHTML = `
      <svg id="island-map-svg" viewBox="0 0 1000 650" class="island-svg-map" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="map-ocean-grad" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stop-color="#0e1f33" />
            <stop offset="60%" stop-color="#081422" />
            <stop offset="100%" stop-color="#030810" />
          </radialGradient>

          <radialGradient id="map-teide-relief" cx="44%" cy="46%" r="20%">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="25%" stop-color="#e2cfb7" />
            <stop offset="50%" stop-color="#694d30" />
            <stop offset="85%" stop-color="#3b2614" />
            <stop offset="100%" stop-color="transparent" stop-opacity="0" />
          </radialGradient>

          <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- 1. Océano Atlántico -->
        <rect width="1000" height="650" fill="url(#map-ocean-grad)" />

        <!-- Líneas de rumbo náutico y coordenadas -->
        <g stroke="rgba(90, 140, 210, 0.16)" stroke-width="1" stroke-dasharray="4 6">
          <line x1="50" y1="100" x2="950" y2="100" />
          <line x1="50" y1="200" x2="950" y2="200" />
          <line x1="50" y1="300" x2="950" y2="300" />
          <line x1="50" y1="400" x2="950" y2="400" />
          <line x1="50" y1="500" x2="950" y2="500" />
          <line x1="50" y1="600" x2="950" y2="600" />
          <line x1="150" y1="30" x2="150" y2="620" />
          <line x1="300" y1="30" x2="300" y2="620" />
          <line x1="450" y1="30" x2="450" y2="620" />
          <line x1="600" y1="30" x2="600" y2="620" />
          <line x1="750" y1="30" x2="750" y2="620" />
          <line x1="900" y1="30" x2="900" y2="620" />
        </g>

        <!-- Olas decorativas -->
        <g fill="none" stroke="rgba(120, 170, 240, 0.22)" stroke-width="1.5">
          <path d="M 80 160 q 15 -6 30 0 q 15 -6 30 0" />
          <path d="M 860 480 q 15 -6 30 0 q 15 -6 30 0" />
          <path d="M 120 540 q 15 -6 30 0 q 15 -6 30 0" />
          <path d="M 840 220 q 15 -6 30 0 q 15 -6 30 0" />
        </g>

        <!-- 2. Silueta Geográfica de Tenerife y macizos -->
        <path d="M 840 110 C 825 145, 810 170, 780 200 C 750 230, 740 240, 715 275 C 690 310, 665 350, 640 390 C 620 425, 600 470, 585 535 C 540 565, 480 575, 430 580 C 380 585, 345 565, 320 530 C 295 500, 270 480, 245 445 C 220 410, 195 385, 170 360 C 145 330, 120 300, 140 285 C 160 270, 200 255, 240 240 C 275 235, 310 230, 345 220 C 380 215, 410 200, 440 185 C 485 190, 530 195, 565 185 C 600 175, 635 155, 670 140 C 700 125, 730 110, 785 105 Z"
              fill="none" stroke="#13304c" stroke-width="16" stroke-linejoin="round" />
        <path d="M 840 110 C 825 145, 810 170, 780 200 C 750 230, 740 240, 715 275 C 690 310, 665 350, 640 390 C 620 425, 600 470, 585 535 C 540 565, 480 575, 430 580 C 380 585, 345 565, 320 530 C 295 500, 270 480, 245 445 C 220 410, 195 385, 170 360 C 145 330, 120 300, 140 285 C 160 270, 200 255, 240 240 C 275 235, 310 230, 345 220 C 380 215, 410 200, 440 185 C 485 190, 530 195, 565 185 C 600 175, 635 155, 670 140 C 700 125, 730 110, 785 105 Z"
              fill="#2a4c30" stroke="#1c3322" stroke-width="4" stroke-linejoin="round" />

        <!-- Sur Volcánico -->
        <path d="M 640 390 C 620 425, 600 470, 585 535 C 540 565, 480 575, 430 580 C 380 585, 345 565, 320 530 C 295 500, 270 480, 245 445 C 275 435, 330 420, 380 430 C 430 440, 500 420, 560 390 Z"
              fill="#755a33" opacity="0.92" />
        <!-- Anaga Verde -->
        <path d="M 840 110 C 825 145, 810 170, 780 200 C 750 230, 720 210, 680 180 C 670 140, 700 125, 730 110 Z" fill="#19421d" />
        <!-- Teno y Masca -->
        <path d="M 140 285 C 160 270, 190 290, 220 330 C 195 385, 170 360, 140 285 Z" fill="#39482d" />
        <!-- Valle de La Orotava -->
        <path d="M 440 185 C 485 190, 530 195, 565 185 C 540 230, 500 280, 460 270 Z" fill="#235626" />

        <!-- Caldera y Cono del Teide -->
        <ellipse cx="460" cy="340" rx="110" ry="70" fill="#4d3721" stroke="#332415" stroke-width="2" />
        <circle cx="440" cy="300" r="75" fill="url(#map-teide-relief)" />
        <polygon points="440,285 430,305 450,305" fill="#ffffff" stroke="#b0c4de" stroke-width="1.5" />
        <circle cx="440" cy="293" r="3.5" fill="#e08020" />

        <!-- 3. Red de Carreteras y Guaguas de TITSA -->
        <g stroke="rgba(240, 215, 160, 0.45)" stroke-width="2.5" stroke-dasharray="4 4" fill="none">
          <path d="M 255 255 Q 290 250 330 255 Q 390 230 450 210 Q 480 235 505 260 Q 535 235 560 215 Q 610 195 655 180 Q 690 210 725 240" />
          <path d="M 725 240 Q 660 380 565 515 Q 430 550 290 480" />
          <path d="M 290 480 Q 230 420 205 340 Q 220 290 255 255" />
          <path d="M 655 180 Q 720 150 790 135" />
          <path d="M 725 240 Q 760 180 790 135" />
          <path d="M 505 260 Q 485 300 470 345" />
          <path d="M 470 345 L 440 300" stroke="rgba(255, 215, 0, 0.7)" stroke-width="2" stroke-dasharray="2 3" />
        </g>

        <!-- 4. Rosa de los Vientos -->
        <g class="compass-rose" transform="translate(110, 110)">
          <circle cx="0" cy="0" r="42" fill="#081422" stroke="#c5a059" stroke-width="2" />
          <circle cx="0" cy="0" r="36" fill="none" stroke="rgba(197, 160, 89, 0.4)" stroke-width="1" stroke-dasharray="2 2" />
          <polygon points="0,-38 6,-10 0,0" fill="#c5a059" />
          <polygon points="0,-38 -6,-10 0,0" fill="#856832" />
          <polygon points="0,38 6,10 0,0" fill="#856832" />
          <polygon points="0,38 -6,10 0,0" fill="#c5a059" />
          <polygon points="38,0 10,6 0,0" fill="#856832" />
          <polygon points="38,0 10,-6 0,0" fill="#c5a059" />
          <polygon points="-38,0 -10,6 0,0" fill="#c5a059" />
          <polygon points="-38,0 -10,-6 0,0" fill="#856832" />
          <text x="0" y="-42" fill="#ffdd77" font-family="Courier New, monospace" font-size="13" font-weight="bold" text-anchor="middle">N</text>
        </g>

        <!-- 5. Cartela de Título -->
        <g class="map-cartouche" transform="translate(820, 560)">
          <rect x="-90" y="-32" width="180" height="52" rx="4" fill="#060f1be8" stroke="#c5a059" stroke-width="2" />
          <text x="0" y="-12" fill="#ffd700" font-family="Courier New, monospace" font-size="11" font-weight="bold" text-anchor="middle" letter-spacing="1">ISLA DE TENERIFE</text>
          <text x="0" y="4" fill="#88b0d0" font-family="Courier New, monospace" font-size="8" text-anchor="middle">RED DE GUAGUAS TITSA</text>
          <text x="0" y="14" fill="#c5a059" font-family="Courier New, monospace" font-size="7" text-anchor="middle">28° 16' N  •  16° 36' W</text>
        </g>

        <!-- 6. CAPA DE ANIMACIÓN INDIANA JONES -->
        <g id="map-travel-animation-layer">
          <path id="travel-guide-path" d="" fill="none" stroke="transparent" />
          <path id="travel-visible-line" d="" fill="none" stroke="#e52521" stroke-width="3.5" stroke-dasharray="7 5" stroke-linecap="round" filter="url(#glow-red)" />
          <g id="travel-vehicle" style="display: none;">
            <ellipse cx="0" cy="2" rx="14" ry="7" fill="rgba(0,0,0,0.5)" />
            <circle cx="0" cy="0" r="12" fill="#d92525" stroke="#ffffff" stroke-width="2" />
            <polygon points="12,0 7,-4 7,4" fill="#ffffff" />
            <text x="-6" y="4" font-size="11" text-anchor="middle">🚌</text>
          </g>
        </g>

        <!-- 7. CAPA DE PINES INTERACTIVOS (13 ENCLAVES) -->
        <g id="map-pins-layer"></g>
      </svg>
    `;
  }

  private bindEvents(): void {
    this.closeBtn.addEventListener('click', () => this.close());
    this.modalElem.addEventListener('click', (e) => {
      if (e.target === this.modalElem && !this.isTraveling) {
        this.close();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (this.modalElem.classList.contains('hidden')) return;
      if (e.key === 'Escape' && !this.isTraveling) {
        this.close();
      }
    });
  }

  public open(currentLocation: LocationSceneDef, stampedZones: Set<string>, acquiredItems: string[]): void {
    this.currentLocation = currentLocation;
    this.stampedZones = stampedZones;
    this.acquiredItems = acquiredItems;

    this.currentPillElem.innerText = `UBICACIÓN: ${currentLocation.name}`;
    this.setBannerText('Haz clic en un enclave desbloqueado para viajar. Usa el Pasaporte para ver tus sellos.');

    this.renderPins();
    this.modalElem.classList.remove('hidden');
    this.audioService.playPageTurn();
  }

  public close(): void {
    if (this.isTraveling) return;
    this.modalElem.classList.add('hidden');
    this.audioService.playClick();
  }

  public setBannerText(text: string): void {
    if (this.bannerTextElem) {
      this.bannerTextElem.innerText = text;
    }
  }

  private renderPins(): void {
    const pinsLayer = document.getElementById('map-pins-layer');
    if (!pinsLayer) return;

    pinsLayer.innerHTML = '';

    LOCATIONS_CATALOG.forEach((loc) => {
      const isCurrent = loc.id === this.currentLocation.id;
      const validation = TravelRules.canTravel(this.currentLocation, loc, this.stampedZones, this.acquiredItems);

      const pinGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      pinGroup.setAttribute('class', `map-pin-group ${isCurrent ? 'current' : validation.allowed ? 'unlocked' : 'locked'}`);
      pinGroup.setAttribute('data-location-id', loc.id);
      pinGroup.setAttribute('transform', `translate(${loc.mapCoords.x}, ${loc.mapCoords.y})`);

      // Área de impacto ampliada y continua para evitar cualquier micro-parpadeo
      const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      hitArea.setAttribute('cx', '0');
      hitArea.setAttribute('cy', '0');
      hitArea.setAttribute('r', '20');
      hitArea.setAttribute('fill', 'transparent');
      hitArea.setAttribute('pointer-events', 'all');
      hitArea.setAttribute('class', 'pin-hit-area');
      pinGroup.appendChild(hitArea);

      // Sombra
      const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      shadow.setAttribute('cx', '0');
      shadow.setAttribute('cy', '3');
      shadow.setAttribute('rx', '10');
      shadow.setAttribute('ry', '6');
      shadow.setAttribute('fill', 'rgba(0,0,0,0.5)');
      shadow.setAttribute('pointer-events', 'none');
      pinGroup.appendChild(shadow);

      // Anillo exterior
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('class', 'pin-ring');
      ring.setAttribute('cx', '0');
      ring.setAttribute('cy', '0');
      ring.setAttribute('r', isCurrent ? '13' : '10');
      ring.setAttribute('pointer-events', 'none');
      pinGroup.appendChild(ring);

      // Núcleo del pin
      const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      core.setAttribute('class', 'pin-core');
      core.setAttribute('cx', '0');
      core.setAttribute('cy', '0');
      core.setAttribute('r', isCurrent ? '8' : '6');
      core.setAttribute('pointer-events', 'none');
      pinGroup.appendChild(core);

      // Icono insignia en el centro
      const badge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      badge.setAttribute('class', 'pin-badge');
      badge.setAttribute('x', '0');
      badge.setAttribute('y', isCurrent ? '3' : '3');
      badge.setAttribute('text-anchor', 'middle');
      badge.setAttribute('font-size', isCurrent ? '9' : '8');
      badge.setAttribute('pointer-events', 'none');
      badge.textContent = isCurrent ? '★' : validation.allowed ? '•' : '🔒';
      pinGroup.appendChild(badge);

      // Rótulo con el nombre del enclave
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('class', 'pin-label');
      label.setAttribute('text-anchor', 'middle');

      // Ajuste de etiqueta vertical según la latitud para evitar solapamientos
      const isTopLabel = loc.id === 'puerto_cruz' || loc.id === 'icod' || loc.id === 'pico_teide';
      label.setAttribute('x', '0');
      label.setAttribute('y', isTopLabel ? '-16' : '22');
      label.textContent = isCurrent ? `📍 ${loc.name}` : loc.name;
      pinGroup.appendChild(label);

      // Interacciones de ratón
      pinGroup.addEventListener('mouseenter', () => {
        if (this.isTraveling) return;
        if (isCurrent) {
          this.setBannerText(`📍 ESTÁS AQUÍ: ${loc.name} (${loc.zone}) — ${loc.hudTitle}`);
        } else if (validation.allowed) {
          this.setBannerText(`🟢 DESTINO DESBLOQUEADO: ${loc.name} (${loc.zone}) — Haz clic para iniciar el viaje en guagua.`);
        } else {
          this.setBannerText(`🔒 DESTINO BLOQUEADO: ${loc.name} — ${validation.reason}`);
        }
      });

      pinGroup.addEventListener('mouseleave', () => {
        if (this.isTraveling) return;
        this.setBannerText('Haz clic en un enclave desbloqueado para viajar. Usa el Pasaporte para ver tus sellos.');
      });

      pinGroup.addEventListener('click', () => {
        if (this.isTraveling) return;

        if (isCurrent) {
          this.audioService.playClick();
          this.setBannerText(`¡Ya estás en ${loc.name}! Elige otro enclave al que desees desplazarte.`);
          return;
        }

        if (!validation.allowed) {
          this.audioService.playError();
          pinGroup.classList.add('pin-shake');
          setTimeout(() => pinGroup.classList.remove('pin-shake'), 450);
          this.setBannerText(`🚫 ACCESO DENEGADO: ${validation.reason}`);
          if (this.onLogMessage) {
            this.onLogMessage(`[VIAJE RESTRINGIDO] Intento de viajar a '${loc.name}': ${validation.reason}`);
          }
          return;
        }

        // Destino permitido: arrancar animación de viaje Indiana Jones
        this.runIndianaJonesTravel(loc);
      });

      pinsLayer.appendChild(pinGroup);
    });
  }

  private calculateCurve(p1: { x: number; y: number }, p2: { x: number; y: number }): string {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);

    // Vector normal unitario perpendicular a la línea
    const nx = -dy / dist;
    const ny = dx / dist;

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    // Curvatura arqueada natural del 15% de la distancia
    const bend = Math.min(48, Math.max(16, dist * 0.16));

    let cx = midX + nx * bend;
    let cy = midY + ny * bend;

    // Mantener punto de control dentro de los márgenes cartográficos
    cx = Math.max(80, Math.min(920, cx));
    cy = Math.max(60, Math.min(580, cy));

    return `M ${p1.x} ${p1.y} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${p2.x} ${p2.y}`;
  }

  public runIndianaJonesTravel(target: LocationSceneDef): void {
    if (this.isTraveling) return;
    this.isTraveling = true;

    const origin = this.currentLocation;
    const pathD = this.calculateCurve(origin.mapCoords, target.mapCoords);

    const guidePath = document.getElementById('travel-guide-path') as unknown as SVGPathElement;
    const visibleLine = document.getElementById('travel-visible-line') as unknown as SVGPathElement;
    const vehicle = document.getElementById('travel-vehicle') as unknown as SVGGElement;

    if (!guidePath || !visibleLine || !vehicle) {
      this.finishTravel(target);
      return;
    }

    guidePath.setAttribute('d', pathD);
    visibleLine.setAttribute('d', '');
    vehicle.style.display = 'block';

    const totalLength = guidePath.getTotalLength();
    const narration = TravelRules.getTravelNarration(origin, target);
    this.setBannerText(`🚌 ${narration}`);

    if (this.onLogMessage) {
      this.onLogMessage(`[INDIANA JONES TRAVEL] Salida: ${origin.name} -> Destino: ${target.name} (${target.zone})`);
    }

    const durationMs = 1850; // Duración clásica de viaje cinemático (1.85 segundos)
    const startTime = performance.now();
    let lastTickTime = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Clic rítmico de traqueteo de carretera / teletipo cada ~115ms
      if (currentTime - lastTickTime > 115) {
        this.audioService.playTravelTick();
        lastTickTime = currentTime;
      }

      const currentLen = progress * totalLength;

      // Construcción progresiva de la línea de puntos roja
      let subD = `M ${origin.mapCoords.x} ${origin.mapCoords.y}`;
      const step = 5;
      for (let s = step; s < currentLen; s += step) {
        const p = guidePath.getPointAtLength(s);
        subD += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      }
      const tip = guidePath.getPointAtLength(currentLen);
      subD += ` L ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`;
      visibleLine.setAttribute('d', subD);

      // Posicionamiento y orientación tangencial del icono del vehículo
      const prevDist = Math.max(0, currentLen - 3);
      const prevPt = guidePath.getPointAtLength(prevDist);
      const angle = Math.atan2(tip.y - prevPt.y, tip.x - prevPt.x) * (180 / Math.PI);
      vehicle.setAttribute('transform', `translate(${tip.x.toFixed(1)}, ${tip.y.toFixed(1)}) rotate(${angle.toFixed(1)})`);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // ¡Llegada al destino!
        this.audioService.playTravelArrival();
        this.setBannerText(`✨ ¡Llegada a ${target.name}! Desembarcando en la parada de TITSA...`);

        // Destello de celebración en el pin de destino
        const targetPinGroup = document.querySelector(`.map-pin-group[data-location-id="${target.id}"]`);
        if (targetPinGroup) {
          targetPinGroup.classList.add('arrival-flash');
        }

        setTimeout(() => {
          if (targetPinGroup) {
            targetPinGroup.classList.remove('arrival-flash');
          }
          vehicle.style.display = 'none';
          visibleLine.setAttribute('d', '');
          this.isTraveling = false;
          this.modalElem.classList.add('hidden');
          this.finishTravel(target);
        }, 500);
      }
    };

    requestAnimationFrame(animate);
  }

  private finishTravel(target: LocationSceneDef): void {
    this.isTraveling = false;
    this.currentLocation = target;
    if (this.onTravelConfirmed) {
      this.onTravelConfirmed(target.id);
    }
  }
}
