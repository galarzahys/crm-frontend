import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Presupuesto } from '../models/presupuesto.model';
import { ActualizarEntidad, CrearEntidad } from '../models/entidad-base.model';
import { ParametrosConsulta, ResultadoPaginado } from '../models/parametros-consulta.model';

@Injectable({ providedIn: 'root' })
export class PresupuestoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/presupuestos`;

  /**
   * El backend hoy expone `GET /presupuestos` sin parámetros de paginación
   * (todavía no hay una pantalla de listado de presupuestos). Para no
   * romper el contrato (`ResultadoPaginado<T>`, por si se arma esa pantalla
   * más adelante), se pagina acá mismo sobre el array completo.
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

  crear(datos: Omit<CrearEntidad<Presupuesto>, 'fechaEmision'>): Observable<Presupuesto> {
    return this.http.post<Presupuesto>(this.baseUrl, datos);
  }

  /**
   * El backend todavía no tiene `PUT /presupuestos/:id` (no hace falta hoy:
   * no existe pantalla de edición de presupuestos). Se deja el método para
   * no romper el contrato del servicio, pero falla explícitamente si se
   * llega a usar antes de que se agregue esa ruta en la API.
   */
  actualizar(_cambios: ActualizarEntidad<Presupuesto>): Observable<Presupuesto> {
    return throwError(() => new Error('Actualizar presupuestos todavía no está disponible en el backend.'));
  }

  /** Ídem `actualizar`: el backend no tiene `DELETE /presupuestos/:id` todavía. */
  eliminar(_id: number): Observable<void> {
    return throwError(() => new Error('Eliminar presupuestos todavía no está disponible en el backend.'));
  }
}
