import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ALMACENAMIENTO_IMAGENES } from '../../core/data/almacenamiento-imagenes.token';
import { ActualizarEntidad, CrearEntidad } from '../models/entidad-base.model';
import { ParametrosConsulta, ResultadoPaginado } from '../models/parametros-consulta.model';
import { Articulo } from '../models/articulo.model';

/** Parámetros de listado de artículos: los genéricos + el filtro propio de categoría. */
export interface ParametrosConsultaArticulos extends ParametrosConsulta {
  categoriaId?: number | null;
}

/**
 * Ahora contra la API real para todo lo relacionado a datos del artículo.
 * La subida de imagen sigue resolviéndose vía `ALMACENAMIENTO_IMAGENES`
 * (en memoria): el backend todavía no expone el endpoint de URLs
 * prefirmadas de S3, así que esa parte se migra en un paso aparte más
 * adelante (ver README del backend, sección "Próximos pasos").
 */
@Injectable({ providedIn: 'root' })
export class ArticuloService {
  private readonly http = inject(HttpClient);
  private readonly almacenamientoImagenes = inject(ALMACENAMIENTO_IMAGENES);
  private readonly baseUrl = `${environment.apiUrl}/articulos`;

  listar(parametros: ParametrosConsultaArticulos): Observable<ResultadoPaginado<Articulo>> {
    let params = new HttpParams();
    if (parametros.pagina != null) params = params.set('pagina', parametros.pagina);
    if (parametros.tamanio != null) params = params.set('tamanio', parametros.tamanio);
    if (parametros.ordenarPor) params = params.set('ordenarPor', parametros.ordenarPor);
    if (parametros.direccion) params = params.set('direccion', parametros.direccion);
    if (parametros.busqueda) params = params.set('busqueda', parametros.busqueda);
    if (parametros.categoriaId) params = params.set('categoriaId', parametros.categoriaId);

    return this.http.get<ResultadoPaginado<Articulo>>(this.baseUrl, { params });
  }

  /**
   * Nota: a diferencia de la versión en cache, si el artículo no existe la
   * API responde 404 (el Observable termina en error, no en `undefined`).
   * Ningún componente depende hoy del caso "no encontrado" silencioso.
   */
  obtenerPorId(id: number): Observable<Articulo> {
    return this.http.get<Articulo>(`${this.baseUrl}/${id}`);
  }

  crear(datos: CrearEntidad<Articulo>): Observable<Articulo> {
    return this.http.post<Articulo>(this.baseUrl, datos);
  }

  actualizar(cambios: ActualizarEntidad<Articulo>): Observable<Articulo> {
    const { id, ...datos } = cambios;
    return this.http.put<Articulo>(`${this.baseUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Orquesta la subida de la imagen de un artículo: pide la URL de subida,
   * sube el archivo y devuelve la `key` (a persistir en el artículo) junto
   * con la URL para previsualizarla. Sigue en cache hasta que el backend
   * tenga el endpoint de S3 (ver nota arriba).
   */
  subirImagen(archivo: File): Observable<{ key: string; urlVisualizacion: string }> {
    return this.almacenamientoImagenes.obtenerUrlSubida(archivo).pipe(
      switchMap(({ key, urlSubida }) =>
        this.almacenamientoImagenes.subirArchivo(urlSubida, archivo).pipe(map(() => key)),
      ),
      switchMap((key) =>
        this.almacenamientoImagenes
          .obtenerUrlVisualizacion(key)
          .pipe(map((urlVisualizacion) => ({ key, urlVisualizacion }))),
      ),
    );
  }

  eliminarImagen(key: string): Observable<void> {
    return this.almacenamientoImagenes.eliminar(key);
  }
}
