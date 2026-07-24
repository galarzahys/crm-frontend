import { Injectable, signal, effect } from '@angular/core';

export type Tema = 'claro' | 'oscuro';

const CLAVE_ALMACENAMIENTO = 'gestion-app.tema';
const CLASE_OSCURO = 'dark';

/**
 * Administra el tema visual de la aplicación (claro/oscuro).
 *
 * - El modo claro es el predeterminado.
 * - Se sincroniza con la estrategia `darkMode: 'class'` de Tailwind
 *   y con el `darkModeSelector` configurado en PrimeNG (ver app.config.ts),
 *   de modo que ambos reaccionen al mismo selector: `.dark` en <html>.
 * - La preferencia del usuario se persiste en localStorage.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly tema = signal<Tema>(this.obtenerTemaInicial());

  constructor() {
    // Aplica la clase al <html> cada vez que cambia el signal.
    effect(() => {
      const esOscuro = this.tema() === 'oscuro';
      document.documentElement.classList.toggle(CLASE_OSCURO, esOscuro);
      localStorage.setItem(CLAVE_ALMACENAMIENTO, this.tema());
    });
  }

  alternarTema(): void {
    this.tema.set(this.tema() === 'claro' ? 'oscuro' : 'claro');
  }

  establecerTema(tema: Tema): void {
    this.tema.set(tema);
  }

  private obtenerTemaInicial(): Tema {
    const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO) as Tema | null;
    if (guardado === 'claro' || guardado === 'oscuro') {
      return guardado;
    }
    // Sin preferencia guardada: modo claro por defecto (requisito del proyecto),
    // independientemente de la preferencia del sistema operativo.
    return 'claro';
  }
}
