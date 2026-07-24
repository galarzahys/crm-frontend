import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ParametrosConsulta, ResultadoPaginado } from '../models/parametros-consulta.model';
import { Cliente, DatosFormularioCliente } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/clientes`;

  /** Listado paginado, con búsqueda opcional (contra los campos marcados como buscador en la ficha). */
  listar(parametros: ParametrosConsulta): Observable<ResultadoPaginado<Cliente>> {
    const params: Record<string, string> = {};
    if (parametros.pagina != null) params['pagina'] = String(parametros.pagina);
    if (parametros.tamanio != null) params['tamanio'] = String(parametros.tamanio);
    if (parametros.busqueda) params['busqueda'] = parametros.busqueda;

    return this.http.get<ResultadoPaginado<Cliente>>(this.baseUrl, { params });
  }

  /** Búsqueda liviana, usada por el autocomplete del formulario de presupuestos. */
  buscar(texto: string): Observable<Cliente[]> {
    return this.listar({ busqueda: texto, tamanio: 20 }).pipe(map((resultado) => resultado.datos));
  }

  obtenerPorId(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/${id}`);
  }

  crear(datos: DatosFormularioCliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.baseUrl, datos);
  }

  actualizar(id: number, datos: DatosFormularioCliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.baseUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
