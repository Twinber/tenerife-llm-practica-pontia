// ==============================================================================
// DOMAIN: RoadGraph (Grafo de Carreteras de Tenerife & Rutas Óptimas)
// ==============================================================================

export interface RoadEdge {
  from: string;
  to: string;
  controlPoint?: { x: number; y: number };
  isStraight?: boolean;
}

export interface NodeCoord {
  x: number;
  y: number;
}

export class RoadGraph {
  public static readonly EDGES: RoadEdge[] = [
    // 1. TF-5 Autopista del Norte (Garachico <-> Santa Cruz)
    { from: 'garachico', to: 'icod', controlPoint: { x: 290, y: 250 } },
    { from: 'icod', to: 'puerto_cruz', controlPoint: { x: 390, y: 230 } },
    { from: 'puerto_cruz', to: 'la_orotava', controlPoint: { x: 480, y: 235 } },
    { from: 'la_orotava', to: 'santa_ursula', controlPoint: { x: 535, y: 235 } },
    { from: 'santa_ursula', to: 'la_laguna', controlPoint: { x: 610, y: 195 } },
    { from: 'la_laguna', to: 'santa_cruz', controlPoint: { x: 690, y: 210 } },

    // 2. TF-1 Autopista del Sur (Santa Cruz <-> Costa Adeje)
    { from: 'santa_cruz', to: 'el_medano', controlPoint: { x: 660, y: 380 } },
    { from: 'el_medano', to: 'costa_adeje', controlPoint: { x: 430, y: 550 } },

    // 3. TF-436 / TF-82 Carretera de Teno y Masca (Costa Adeje <-> Garachico)
    { from: 'costa_adeje', to: 'masca', controlPoint: { x: 230, y: 420 } },
    { from: 'masca', to: 'garachico', controlPoint: { x: 220, y: 290 } },

    // 4. TF-12 Carretera de Anaga (desde La Laguna)
    { from: 'la_laguna', to: 'anaga', controlPoint: { x: 720, y: 150 } },

    // 5. TF-11 / Autovía de San Andrés (desde Santa Cruz a Anaga)
    { from: 'santa_cruz', to: 'anaga', controlPoint: { x: 760, y: 180 } },

    // 6. TF-21 Dorsal de La Orotava a Las Cañadas del Teide
    { from: 'la_orotava', to: 'las_canadas', controlPoint: { x: 485, y: 300 } },

    // 7. Teleférico del Teide (Las Cañadas <-> Pico del Teide)
    { from: 'las_canadas', to: 'pico_teide', isStraight: true }
  ];

  /**
   * Calcula el peso/longitud geométrica aproximada de una arista.
   */
  public static getEdgeWeight(edge: RoadEdge, coordsMap: Record<string, NodeCoord>): number {
    const p1 = coordsMap[edge.from];
    const p2 = coordsMap[edge.to];
    if (!p1 || !p2) return 100;

    const chord = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (edge.isStraight || !edge.controlPoint) {
      return chord;
    }
    const cp = edge.controlPoint;
    const leg1 = Math.hypot(cp.x - p1.x, cp.y - p1.y);
    const leg2 = Math.hypot(p2.x - cp.x, p2.y - cp.y);
    // Aproximación parabólica de longitud de arco cuadrático de Bezier: (2 * cuerda + catetos) / 3
    return (2 * chord + leg1 + leg2) / 3;
  }

  /**
   * Encuentra la arista entre dos nodos adyacentes (en cualquier dirección).
   */
  public static findEdge(nodeA: string, nodeB: string): RoadEdge | undefined {
    return this.EDGES.find(
      (e) => (e.from === nodeA && e.to === nodeB) || (e.from === nodeB && e.to === nodeA)
    );
  }

  /**
   * Construye el mapa de adyacencia del grafo insular.
   */
  public static buildAdjacencyList(
    coordsMap: Record<string, NodeCoord>
  ): Map<string, Array<{ neighbor: string; weight: number; edge: RoadEdge }>> {
    const adj = new Map<string, Array<{ neighbor: string; weight: number; edge: RoadEdge }>>();

    for (const edge of this.EDGES) {
      const weight = this.getEdgeWeight(edge, coordsMap);

      if (!adj.has(edge.from)) adj.set(edge.from, []);
      if (!adj.has(edge.to)) adj.set(edge.to, []);

      adj.get(edge.from)!.push({ neighbor: edge.to, weight, edge });
      adj.get(edge.to)!.push({ neighbor: edge.from, weight, edge });
    }

    return adj;
  }

  /**
   * Algoritmo Dijkstra para encontrar la secuencia más corta de enclaves a lo largo de las carreteras.
   */
  public static findShortestPath(
    originId: string,
    targetId: string,
    coordsMap: Record<string, NodeCoord>
  ): string[] {
    if (originId === targetId) return [originId];

    const adj = this.buildAdjacencyList(coordsMap);
    const dist = new Map<string, number>();
    const prev = new Map<string, string>();
    const unvisited = new Set<string>();

    for (const node of Object.keys(coordsMap)) {
      dist.set(node, Infinity);
      unvisited.add(node);
    }
    dist.set(originId, 0);

    while (unvisited.size > 0) {
      let u: string | null = null;
      let minDistance = Infinity;
      for (const node of unvisited) {
        const d = dist.get(node) ?? Infinity;
        if (d < minDistance) {
          minDistance = d;
          u = node;
        }
      }

      if (!u || minDistance === Infinity) break;
      if (u === targetId) break;

      unvisited.delete(u);

      const neighbors = adj.get(u) || [];
      for (const { neighbor, weight } of neighbors) {
        if (!unvisited.has(neighbor)) continue;
        const alt = (dist.get(u) ?? Infinity) + weight;
        if (alt < (dist.get(neighbor) ?? Infinity)) {
          dist.set(neighbor, alt);
          prev.set(neighbor, u);
        }
      }
    }

    // Reconstruir la ruta hacia atrás
    const path: string[] = [];
    let curr: string | undefined = targetId;
    while (curr) {
      path.unshift(curr);
      curr = prev.get(curr);
    }

    if (path.length > 0 && path[0] === originId) {
      return path;
    }

    // Respaldo de seguridad si no hubiese conexión
    return [originId, targetId];
  }

  /**
   * Genera el atributo `d` del SVG Path unificado concatenando los segmentos geométricos.
   */
  public static buildRouteSvgPath(
    routeNodes: string[],
    coordsMap: Record<string, NodeCoord>
  ): string {
    if (routeNodes.length === 0) return '';
    if (routeNodes.length === 1) {
      const p = coordsMap[routeNodes[0]];
      return `M ${p.x} ${p.y}`;
    }

    const start = coordsMap[routeNodes[0]];
    if (!start) return '';

    let d = `M ${start.x} ${start.y}`;

    for (let i = 0; i < routeNodes.length - 1; i++) {
      const from = routeNodes[i];
      const to = routeNodes[i + 1];
      const toCoord = coordsMap[to];
      if (!toCoord) continue;

      const edge = this.findEdge(from, to);

      if (!edge || edge.isStraight || !edge.controlPoint) {
        d += ` L ${toCoord.x} ${toCoord.y}`;
      } else {
        d += ` Q ${edge.controlPoint.x} ${edge.controlPoint.y} ${toCoord.x} ${toCoord.y}`;
      }
    }

    return d;
  }
}
