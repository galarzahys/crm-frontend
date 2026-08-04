import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IAlmacenamientoImagenes, UrlSubidaImagen } from './almacenamiento-imagenes.interface';

/**
 * Implementación real contra S3 (reemplaza a `AlmacenamientoImagenesCacheService`).
 * El bucket sirve las imágenes con lectura pública (ver README de deploy),
 * así que la URL de visualización se conoce desde el momento en que se pide
 * la URL de subida — no hace falta un pedido aparte para leerla.
 */
@Injectable()
export class AlmacenamientoImagenesS3Service implements IAlmacenamientoImagenes {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/imagenes`;

  private readonly urlVisualizacionPorKey = new Map<string, string>();

  obtenerUrlSubida(archivo: File): Observable<UrlSubidaImagen> {
    return this.http
      .post<{ key: string; urlSubida: string; urlVisualizacion: string }>(`${this.baseUrl}/url-subida`, {
        nombreArchivo: archivo.name,
        tipoArchivo: archivo.type,
      })
      .pipe(
        map(({ key, urlSubida, urlVisualizacion }) => {
          this.urlVisualizacionPorKey.set(key, urlVisualizacion);
          return { key, urlSubida };
        }),
      );
  }

  subirArchivo(urlSubida: string, archivo: File): Observable<void> {
    // PUT directo a S3 (no pasa por nuestro backend). El Content-Type acá
    // tiene que ser exactamente el mismo que se usó para firmar la URL.
    return this.http.put<void>(urlSubida, archivo, { headers: { 'Content-Type': archivo.type } });
  }

  obtenerUrlVisualizacion(key: string): Observable<string> {
    return of(this.urlVisualizacionPorKey.get(key) ?? '');
  }

  eliminar(key: string): Observable<void> {
    return this.http.delete<void>(this.baseUrl, { params: { key } });
  }
}
