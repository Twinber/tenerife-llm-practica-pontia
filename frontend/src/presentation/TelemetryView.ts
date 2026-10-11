// ==============================================================================
// PRESENTATION: TelemetryView (Consola Retro de Telemetría con Tecla 'T')
// ==============================================================================

export class TelemetryView {
  private consoleElem: HTMLElement;
  private logsElem: HTMLElement;
  private btnConsole: HTMLElement;
  private btnClose: HTMLElement | null;
  private formElem: HTMLFormElement | null;
  private inputElem: HTMLInputElement | null;

  public onCommand?: (command: string) => void;

  constructor() {
    this.consoleElem = document.getElementById('crt-console')!;
    this.logsElem = document.getElementById('crt-logs') || this.consoleElem;
    this.btnConsole = document.getElementById('btn-console')!;
    this.btnClose = document.getElementById('btn-close-crt');
    this.formElem = document.getElementById('crt-cmd-form') as HTMLFormElement | null;
    this.inputElem = document.getElementById('crt-cmd-input') as HTMLInputElement | null;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Tecla 'T' o '~' para alternar; ESC para cerrar
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.consoleElem.classList.contains('visible')) {
        this.close();
        return;
      }

      if (e.key === 't' || e.key === 'T' || e.key === '~' || e.key === '`') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          this.toggle();
        }
      }
    });

    // Clic en botón del HUD
    this.btnConsole.addEventListener('click', () => {
      this.toggle();
    });

    // Clic en botón cerrar de la consola
    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => {
        this.close();
      });
    }

    // Envío del formulario de comandos
    if (this.formElem && this.inputElem) {
      this.formElem.addEventListener('submit', (e) => {
        e.preventDefault();
        const cmd = this.inputElem!.value.trim();
        if (!cmd) return;
        this.inputElem!.value = '';
        this.executeCommand(cmd);
      });
    }
  }

  public toggle(): void {
    const isOpening = !this.consoleElem.classList.contains('visible');
    this.consoleElem.classList.toggle('visible');
    if (isOpening && this.inputElem) {
      setTimeout(() => this.inputElem?.focus(), 60);
    }
  }

  public open(): void {
    this.consoleElem.classList.add('visible');
    if (this.inputElem) {
      setTimeout(() => this.inputElem?.focus(), 60);
    }
  }

  public close(): void {
    this.consoleElem.classList.remove('visible');
  }

  public executeCommand(rawCmd: string): void {
    this.logCommand(rawCmd);
    if (this.onCommand) {
      this.onCommand(rawCmd);
    }
  }

  public log(message: string): void {
    const time = new Date().toTimeString().split(' ')[0];
    const line = document.createElement('div');
    line.innerText = `[${time}] ${message}`;
    this.logsElem.appendChild(line);
    this.logsElem.scrollTop = this.logsElem.scrollHeight;
  }

  public logCommand(cmd: string): void {
    const line = document.createElement('div');
    line.style.color = '#ffff55';
    line.style.fontWeight = 'bold';
    line.innerText = `> ${cmd}`;
    this.logsElem.appendChild(line);
    this.logsElem.scrollTop = this.logsElem.scrollHeight;
  }

  public logRaw(html: string): void {
    const line = document.createElement('div');
    line.innerHTML = html;
    this.logsElem.appendChild(line);
    this.logsElem.scrollTop = this.logsElem.scrollHeight;
  }

  public clear(): void {
    this.logsElem.innerHTML = '';
  }
}

