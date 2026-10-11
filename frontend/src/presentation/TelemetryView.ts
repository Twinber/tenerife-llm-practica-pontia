// ==============================================================================
// PRESENTATION: TelemetryView (Consola Retro de Telemetría con Tecla 'T')
// ==============================================================================

export class TelemetryView {
  private consoleElem: HTMLElement;
  private btnConsole: HTMLElement;

  constructor() {
    this.consoleElem = document.getElementById('crt-console')!;
    this.btnConsole = document.getElementById('btn-console')!;
    this.bindEvents();
  }

  private bindEvents(): void {
    // Tecla 'T' o '~'
    window.addEventListener('keydown', (e) => {
      if (e.key === 't' || e.key === 'T' || e.key === '~' || e.key === '`') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          this.toggle();
        }
      }
    });

    // Clic en botón del HUD
    this.btnConsole.addEventListener('click', () => {
      this.toggle();
    });
  }

  public toggle(): void {
    this.consoleElem.classList.toggle('visible');
  }

  public log(message: string): void {
    const time = new Date().toTimeString().split(' ')[0];
    const line = document.createElement('div');
    line.innerText = `[${time}] ${message}`;
    this.consoleElem.appendChild(line);
    this.consoleElem.scrollTop = this.consoleElem.scrollHeight;
  }
}
