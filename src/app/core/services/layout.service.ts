import { Injectable, signal } from '@angular/core';

const CLAVE_ALMACENAMIENTO = 'gestion-app.sidebar-colapsado';

/**
 * Estado de la barra de navegación lateral.
 *
 * - `colapsado`: en pantallas grandes (laptop/desktop), decide si la barra
 *   se muestra completa (con etiquetas) o reducida (solo íconos).
 * - `abiertoMobile`: en pantallas chicas, la barra se comporta como un
 *   panel superpuesto (overlay) que se abre/cierra sobre el contenido.
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly colapsado = signal<boolean>(this.obtenerPreferenciaInicial());
  readonly abiertoMobile = signal<boolean>(false);

  alternarColapsado(): void {
    const nuevoValor = !this.colapsado();
    this.colapsado.set(nuevoValor);
    localStorage.setItem(CLAVE_ALMACENAMIENTO, String(nuevoValor));
  }

  alternarMobile(): void {
    this.abiertoMobile.update((valor) => !valor);
  }

  cerrarMobile(): void {
    this.abiertoMobile.set(false);
  }

  private obtenerPreferenciaInicial(): boolean {
    return localStorage.getItem(CLAVE_ALMACENAMIENTO) === 'true';
  }
}
