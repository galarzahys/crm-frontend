import { InjectionToken } from '@angular/core';
import { IAlmacenamientoImagenes } from './almacenamiento-imagenes.interface';

/**
 * Token de inyección para el proveedor de almacenamiento de imágenes.
 *
 * Hoy se provee `AlmacenamientoImagenesCacheService` (ver app.config.ts).
 * El día que exista backend con S3, alcanza con crear una clase que
 * implemente `IAlmacenamientoImagenes` (por ejemplo
 * `AlmacenamientoImagenesS3Service`, usando `HttpClient` para pedir las
 * URLs prefirmadas) y cambiar el `useClass` de este token en `app.config.ts`.
 * Ningún componente que dependa de `ALMACENAMIENTO_IMAGENES` necesita cambios.
 */
export const ALMACENAMIENTO_IMAGENES = new InjectionToken<IAlmacenamientoImagenes>('ALMACENAMIENTO_IMAGENES');
