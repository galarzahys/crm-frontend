import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DatosCostoMaterial,
  DatosFormularioMaterial,
  Material,
  MaterialConCosto,
  MaterialCosto,
  MaterialCostoHistorial,
  TipoMaterial,
} from '../models/material.model';

@Injectable({ providedIn: 'root' })
export class MaterialService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/materiales`;

  listarConCosto(busqueda?: string, tipo?: TipoMaterial): Observable<MaterialConCosto[]> {
    const params: Record<string, string> = {};
    if (busqueda) params['busqueda'] = busqueda;
    if (tipo) params['tipo'] = tipo;
    return this.http.get<MaterialConCosto[]>(this.baseUrl, { params });
  }

  crear(datos: DatosFormularioMaterial): Observable<Material> {
    return this.http.post<Material>(this.baseUrl, datos);
  }

  actualizar(id: number, datos: DatosFormularioMaterial): Observable<Material> {
    return this.http.put<Material>(`${this.baseUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  obtenerCosto(materialId: number): Observable<MaterialCosto | null> {
    return this.http.get<MaterialCosto | null>(`${this.baseUrl}/${materialId}/costo`);
  }

  definirCosto(materialId: number, datos: DatosCostoMaterial): Observable<MaterialCosto> {
    return this.http.put<MaterialCosto>(`${this.baseUrl}/${materialId}/costo`, datos);
  }

  historialDeCosto(materialId: number): Observable<MaterialCostoHistorial[]> {
    return this.http.get<MaterialCostoHistorial[]>(`${this.baseUrl}/${materialId}/costo/historial`);
  }
}
