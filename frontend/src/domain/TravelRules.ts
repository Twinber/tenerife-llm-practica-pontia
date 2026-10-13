// ==============================================================================
// DOMAIN: Reglas Deterministas de Desplazamiento y Progresión Insular
// ==============================================================================
import { LocationSceneDef } from './locationsData';

export interface TravelValidationResult {
  allowed: boolean;
  reason?: string;
  badge?: string;
}

export class TravelRules {
  /**
   * Determina si Twinber puede viajar desde su ubicación actual hacia el destino solicitado.
   *
   * @param origin Ubicación actual del jugador
   * @param target Ubicación de destino deseada
   * @param stampedZones Conjunto de nombres de zonas selladas en el pasaporte
   * @param acquiredItems Lista de nombres de objetos en posesión del jugador
   */
  public static canTravel(
    origin: LocationSceneDef,
    target: LocationSceneDef,
    stampedZones: Set<string>,
    acquiredItems: string[]
  ): TravelValidationResult {
    // 1. Misma ubicación
    if (origin.id === target.id) {
      return {
        allowed: false,
        reason: 'Ya te encuentras en este lugar.',
        badge: 'AQUÍ'
      };
    }

    const stampCount = stampedZones.size;
    const hasPacoStamp = stampedZones.has('Puerto de la Cruz') || stampedZones.has('puerto_cruz');
    const hasCableCarTicket = acquiredItems.includes('Billete del Teleférico');

    // 2. Clímax: Pico del Teide — 3.718m
    if (target.id === 'pico_teide') {
      if (!hasCableCarTicket) {
        return {
          allowed: false,
          reason: '🔒 Para ascender al cráter somital necesitas el "Billete del Teleférico" (a la venta por el Operario en Las Cañadas).',
          badge: 'BILLETE REQUERIDO'
        };
      }
      if (origin.id !== 'las_canadas' && !stampedZones.has('Las Cañadas del Teide') && !stampedZones.has('las_canadas') && !stampedZones.has('el_teide')) {
        return {
          allowed: false,
          reason: '🔒 El teleférico parte exclusivamente desde la estación base de Las Cañadas del Teide (2.356m).',
          badge: 'ESTACIÓN BASE'
        };
      }
      return { allowed: true };
    }

    // 3. Cumbre: Las Cañadas del Teide
    if (target.id === 'las_canadas') {
      if (stampCount < 4) {
        return {
          allowed: false,
          reason: `🔒 Los guardas forestales de la TF-21 exigen al menos 4 sellos insulares para ascender a Las Cañadas (tienes ${stampCount}/4).`,
          badge: '4 SELLOS'
        };
      }
      return { allowed: true };
    }

    // 4. Zona Sur: Costa Adeje, El Médano, Masca
    if (target.zone === 'Sur') {
      if (stampCount < 3) {
        return {
          allowed: false,
          reason: `🔒 La línea interurbana TF-1 hacia el Sur exige al menos 3 sellos en el pasaporte para cruzar la isla (tienes ${stampCount}/3).`,
          badge: '3 SELLOS'
        };
      }
      return { allowed: true };
    }

    // 5. Parque Rural de Anaga (Reserva de la Biosfera)
    if (target.id === 'anaga') {
      const hasMetroGateway = stampedZones.has('San Cristóbal de La Laguna') || stampedZones.has('la_laguna') || stampedZones.has('Santa Cruz de Tenerife') || stampedZones.has('santa_cruz');
      if (stampCount < 2 || (!hasMetroGateway && stampCount < 3)) {
        return {
          allowed: false,
          reason: '🔒 El acceso a Anaga por la TF-12 requiere haber explorado y sellado La Laguna o Santa Cruz de Tenerife.',
          badge: 'ACCESO ANAGA'
        };
      }
      return { allowed: true };
    }

    // 6. Zona Metropolitana: La Laguna, Santa Cruz
    if (target.zone === 'Metropolitana') {
      if (stampCount < 2) {
        return {
          allowed: false,
          reason: `🔒 El conductor de TITSA por la autopista TF-5 requiere al menos 2 sellos del Norte en tu pasaporte (tienes ${stampCount}/2).`,
          badge: '2 SELLOS'
        };
      }
      return { allowed: true };
    }

    // 7. Zona Norte: Puerto de la Cruz, La Orotava, Santa Úrsula, Icod, Garachico
    if (target.zone === 'Norte') {
      if (origin.id === 'puerto_cruz' && !hasPacoStamp && stampCount === 0) {
        return {
          allowed: false,
          reason: '🔒 Paco el Pescador debe sellarte el pasaporte en el muelle pesquero antes de tomar la guagua a otros pueblos del norte.',
          badge: 'SELLO PACO'
        };
      }
      return { allowed: true };
    }

    return { allowed: true };
  }

  /**
   * Genera el texto narrativo cinematográfico al estilo Indiana Jones para el trayecto.
   */
  public static getTravelNarration(origin: LocationSceneDef, target: LocationSceneDef): string {
    if (target.id === 'pico_teide') {
      return 'Twinber aborda la cabina del teleférico superando los 3.555m hacia el cráter y el cielo Starlight del Teide...';
    }
    if (target.id === 'las_canadas') {
      return 'Twinber asciende por las curvas de la dorsal TF-21 cruzando el pinar hacia Las Cañadas del Teide (2.356m)...';
    }
    if (target.id === 'anaga') {
      return 'Twinber se adentra por la sinuosa carretera TF-12 hacia la laurisilva milenaria de Anaga...';
    }
    if (target.id === 'masca') {
      return 'Twinber desciende por la vertiginosa garganta del barranco hacia el caserío de Masca...';
    }
    if (target.zone === 'Sur') {
      return `Twinber toma la guagua de TITSA por la autopista TF-1 rumbo al soleado litoral de ${target.name}...`;
    }
    if (target.zone === 'Metropolitana') {
      return `Twinber viaja por la autopista TF-5 hacia la histórica comarca metropolitana de ${target.name}...`;
    }
    if (target.zone === 'Norte') {
      return `Twinber toma la guagua comarcal del Norte hacia ${target.name}...`;
    }
    return `Twinber viaja desde ${origin.name} hacia ${target.name}...`;
  }
}
