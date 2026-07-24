import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CampoFichaCliente, DatosFormularioCampoFicha } from '../models/campo-ficha-cliente.model';

@Injectable({ providedIn: 'root' })
export class CampoFichaClienteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/campos-ficha-cliente`;

  listarTodos(): Observable<CampoFichaCliente[]> {
    return this.http.get<CampoFichaCliente[]>(this.baseUrl);
  }

  crear(datos: DatosFormularioCampoFicha): Observable<CampoFichaCliente> {
    return this.http.post<CampoFichaCliente>(this.baseUrl, datos);
  }

  actualizar(id: number, datos: DatosFormularioCampoFicha): Observable<CampoFichaCliente> {
    return this.http.put<CampoFichaCliente>(`${this.baseUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
