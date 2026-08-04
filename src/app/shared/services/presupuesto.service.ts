import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Presupuesto } from '../models/presupuesto.model';
import { ActualizarEntidad, CrearEntidad } from '../models/entidad-base.model';
import { ParametrosConsulta, ResultadoPaginado } from '../models/parametros-consulta.model';

@Injectable({ providedIn: 'root' })
export class PresupuestoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/presupuestos`;

  /**
   * El backend expone `GET /presupuestos` sin parámetros de paginación
   * (todavía no hace falta del lado del servidor). Para no romper el
   * contrato (`ResultadoPaginado<T>`), se pagina acá mismo sobre el array
   * completo.
   */
  listar(parametros: ParametrosConsulta = {}): Observable<ResultadoPaginado<Presupuesto>> {
    const pagina = parametros.pagina ?? 0;
    const tamanio = parametros.tamanio ?? 10;

    return this.http.get<Presupuesto[]>(this.baseUrl).pipe(
      map((todos) => {
        const inicio = pagina * tamanio;
        return {
          datos: todos.slice(inicio, inicio + tamanio),
          total: todos.length,
          pagina,
          tamanio,
        };
      }),
    );
  }

  obtenerPorId(id: number): Observable<Presupuesto> {
    return this.http.get<Presupuesto>(`${this.baseUrl}/${id}`);
  }

  /**
   * `fechaEmision` la pone el backend solo (nunca hay que mandarla: el DTO
   * no la declara y el validador global rechaza propiedades de más).
   */
  crear(datos: Omit<CrearEntidad<Presupuesto>, 'fechaEmision'>): Observable<Presupuesto> {
    return this.http.post<Presupuesto>(this.baseUrl, datos);
  }

  /** Ídem: no incluir `fechaEmision` en `cambios` (el backend la ignora y la mantiene como estaba). */
  actualizar(cambios: ActualizarEntidad<Presupuesto>): Observable<Presupuesto> {
    const { id, ...datos } = cambios;
    return this.http.put<Presupuesto>(`${this.baseUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
