import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categoria } from '../models/categoria.model';

/**
 * Ahora contra la API real (antes: `CacheRepository` en memoria).
 * La firma pública no cambió, así que los componentes que ya usaban este
 * servicio no necesitan ningún ajuste.
 */
@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/categorias`;

  /** Devuelve todas las categorías activas. */
  listarTodas(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.baseUrl);
  }
}
