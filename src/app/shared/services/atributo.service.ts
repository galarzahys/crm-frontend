import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Atributo, AtributoOpcion } from '../models/atributo.model';

/** Atributo junto con sus opciones (si es de tipo `opciones`), para simplificar la UI. */
export interface AtributoConOpciones extends Atributo {
  opciones: AtributoOpcion[];
}

/** Datos de alta/edición de un atributo, incluyendo el texto de sus opciones. */
export interface DatosFormularioAtributo {
  nombre: string;
  unidadMedida: string | null;
  tipo: Atributo['tipo'];
  /** Textos de las opciones (solo relevante si tipo === 'opciones'). */
  opciones: string[];
}

/**
 * Ahora contra la API real. La lógica de "dar de baja las opciones
 * anteriores y crear las nuevas" que antes vivía acá (`reemplazarOpciones`)
 * ahora vive en el backend (`AtributosService.reemplazarOpciones`, del
 * lado del servidor) — este servicio queda mucho más simple: solo
 * traduce cada método a su llamada HTTP.
 */
@Injectable({ providedIn: 'root' })
export class AtributoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/atributos`;

  /** Lista todos los atributos activos junto con sus opciones. */
  listarConOpciones(): Observable<AtributoConOpciones[]> {
    return this.http.get<AtributoConOpciones[]>(this.baseUrl);
  }

  crear(datos: DatosFormularioAtributo): Observable<AtributoConOpciones> {
    return this.http.post<AtributoConOpciones>(this.baseUrl, datos);
  }

  actualizar(id: number, datos: DatosFormularioAtributo): Observable<AtributoConOpciones> {
    return this.http.put<AtributoConOpciones>(`${this.baseUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
