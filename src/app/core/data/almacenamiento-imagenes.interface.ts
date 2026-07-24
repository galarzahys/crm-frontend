import { Observable } from 'rxjs';

/** Resultado de solicitar una URL de subida para un archivo nuevo. */
export interface UrlSubidaImagen {
  /** Clave (key) del objeto dentro del bucket; esto es lo que se persiste en la entidad. */
  key: string;
  /** URL a la que subir el archivo (PUT). Prefirmada cuando el proveedor sea S3. */
  urlSubida: string;
}

/**
 * Contrato para el almacenamiento de imágenes de artículos.
 *
 * La implementación real (a futuro) va a pedirle al backend una URL
 * prefirmada de S3, subir el archivo directamente a ese bucket desde el
 * navegador, y luego pedir una URL prefirmada de lectura para mostrarla.
 * Mientras no exista ese backend, `AlmacenamientoImagenesCacheService`
 * implementa el mismo contrato guardando el archivo en memoria (como
 * data URL), para que el componente de artículos no tenga que cambiar
 * nada el día que se conecte el backend real: solo se reemplaza el
 * provider (ver `core/data/almacenamiento-imagenes.token.ts`).
 */
export interface IAlmacenamientoImagenes {
  /**
   * Pide una URL para subir un archivo nuevo.
   * A futuro: `GET/POST /api/articulos/imagenes/url-subida` → URL prefirmada de S3 (PUT).
   */
  obtenerUrlSubida(archivo: File): Observable<UrlSubidaImagen>;

  /**
   * Sube el archivo a la URL obtenida en `obtenerUrlSubida`.
   * A futuro: `PUT` directo contra la URL prefirmada de S3 (sin pasar por nuestro backend).
   */
  subirArchivo(urlSubida: string, archivo: File): Observable<void>;

  /**
   * Obtiene la URL para mostrar/visualizar una imagen ya subida a partir de su `key`.
   * A futuro: `GET /api/articulos/imagenes/{key}/url-visualizacion` → URL prefirmada de S3 (GET).
   */
  obtenerUrlVisualizacion(key: string): Observable<string>;

  /** Elimina una imagen del almacenamiento. A futuro: borra el objeto del bucket de S3. */
  eliminar(key: string): Observable<void>;
}
