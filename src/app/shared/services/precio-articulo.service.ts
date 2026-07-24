import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Moneda, PrecioArticulo, PrecioArticuloHistorial } from '../models/precio-articulo.model';

/**
 * Ahora contra la API real. La lógica de "mover el valor anterior a
 * historial antes de pisarlo" que antes vivía acá (`definirValor`) ahora
 * vive en el backend (`PreciosArticuloService`, del lado del servidor) —
 * este servicio queda reducido a las tres llamadas HTTP correspondientes.
 */
@Injectable({ providedIn: 'root' })
export class PrecioArticuloService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/listas-precio`;

  /** Precios vigentes de todos los artículos de una lista de precios. */
  listarVigentesDeLista(listaPrecioId: number): Observable<PrecioArticulo[]> {
    return this.http.get<PrecioArticulo[]>(`${this.baseUrl}/${listaPrecioId}/precios`);
  }

  /** Historial de valores (ya reemplazados) de un artículo en una lista, del más reciente al más antiguo. */
  historialDe(listaPrecioId: number, articuloId: number): Observable<PrecioArticuloHistorial[]> {
    return this.http.get<PrecioArticuloHistorial[]>(`${this.baseUrl}/${listaPrecioId}/precios/${articuloId}/historial`);
  }

  /**
   * Define (da de alta o actualiza) el valor de venta de un artículo en una
   * lista de precios. El backend se encarga de mover el valor anterior a
   * historial si ya había uno vigente.
   */
  definirValor(listaPrecioId: number, articuloId: number, valor: number, moneda: Moneda): Observable<PrecioArticulo> {
    return this.http.put<PrecioArticulo>(`${this.baseUrl}/${listaPrecioId}/precios/${articuloId}`, { moneda, valor });
  }
}
