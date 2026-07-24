import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ListaPrecio } from '../models/lista-precio.model';
import { ActualizarEntidad, CrearEntidad } from '../models/entidad-base.model';

@Injectable({ providedIn: 'root' })
export class ListaPrecioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/listas-precio`;

  listarTodas(): Observable<ListaPrecio[]> {
    return this.http.get<ListaPrecio[]>(this.baseUrl);
  }

  crear(datos: CrearEntidad<ListaPrecio>): Observable<ListaPrecio> {
    return this.http.post<ListaPrecio>(this.baseUrl, datos);
  }

  actualizar(cambios: ActualizarEntidad<ListaPrecio>): Observable<ListaPrecio> {
    const { id, ...datos } = cambios;
    return this.http.put<ListaPrecio>(`${this.baseUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
