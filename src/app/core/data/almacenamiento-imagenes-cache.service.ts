import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import { IAlmacenamientoImagenes, UrlSubidaImagen } from './almacenamiento-imagenes.interface';

/**
 * Implementación transitoria de `IAlmacenamientoImagenes` que guarda las
 * imágenes en memoria (como data URL), simulando el flujo de subida por
 * URL prefirmada de S3 sin depender todavía de un backend.
 *
 * Cuando se conecte el backend real, este servicio se reemplaza por uno
 * que pida las URLs prefirmadas por HTTP y haga el `PUT` contra S3 — la
 * forma de los métodos (`obtenerUrlSubida` → `subirArchivo` → `obtenerUrlVisualizacion`)
 * es intencionalmente la misma que va a tener ese flujo real.
 */
@Injectable()
export class AlmacenamientoImagenesCacheService implements IAlmacenamientoImagenes {
  private readonly archivos = new Map<string, string>();
  private secuencia = 1;
  private readonly latenciaMs = 250;

  obtenerUrlSubida(archivo: File): Observable<UrlSubidaImagen> {
    const key = `local/articulos/${this.secuencia++}-${archivo.name}`;
    // En la implementación real, acá se llamaría al backend para pedir la
    // URL prefirmada de S3. En memoria, la "url de subida" es solo un
    // identificador interno que después reconoce `subirArchivo`.
    const resultado: UrlSubidaImagen = { key, urlSubida: `memoria://${key}` };
    return of(resultado).pipe(delay(this.latenciaMs));
  }

  subirArchivo(urlSubida: string, archivo: File): Observable<void> {
    const key = urlSubida.replace('memoria://', '');
    return this.leerArchivoComoDataUrl(archivo).pipe(
      switchMap((dataUrl) => {
        this.archivos.set(key, dataUrl);
        return of(undefined).pipe(delay(this.latenciaMs));
      })
    );
  }

  obtenerUrlVisualizacion(key: string): Observable<string> {
    const dataUrl = this.archivos.get(key) ?? '';
    return of(dataUrl).pipe(delay(this.latenciaMs));
  }

  eliminar(key: string): Observable<void> {
    this.archivos.delete(key);
    return of(undefined).pipe(delay(this.latenciaMs));
  }

  private leerArchivoComoDataUrl(archivo: File): Observable<string> {
    return new Observable<string>((observer) => {
      const lector = new FileReader();
      lector.onload = () => {
        observer.next(lector.result as string);
        observer.complete();
      };
      lector.onerror = () => observer.error(lector.error);
      lector.readAsDataURL(archivo);
    });
  }
}
