import { EntidadBase } from './entidad-base.model';

export type Moneda = 'ARS' | 'USD';

export const ETIQUETAS_MONEDA: Record<Moneda, string> = {
  ARS: 'Pesos argentinos (ARS)',
  USD: 'Dólares estadounidenses (USD)',
};

export const OPCIONES_MONEDA: { etiqueta: string; valor: Moneda }[] = (
  Object.entries(ETIQUETAS_MONEDA) as [Moneda, string][]
).map(([valor, etiqueta]) => ({ valor, etiqueta }));

/**
 * Valor de venta **vigente** de un artículo dentro de una lista de precios.
 * Tabla `precios_articulo` en el esquema relacional, con claves foráneas
 * `lista_precio_id` y `articulo_id` (par único: un solo precio vigente por
 * artículo y lista a la vez).
 *
 * `actualizadoEn` (heredado de `EntidadBase`) registra la fecha de la
 * última modificación. `vigenteDesde` es la fecha de negocio a partir de
 * la cual este valor rige (en esta implementación coincide con el momento
 * de la modificación).
 */
export interface PrecioArticulo extends EntidadBase {
  listaPrecioId: number;
  articuloId: number;
  moneda: Moneda;
  valor: number;
  vigenteDesde: Date;
}

/**
 * Valor histórico (ya reemplazado) de un artículo en una lista de precios.
 * Tabla `precios_articulo_historial`. Cada vez que se define un nuevo
 * valor sobre un `PrecioArticulo` existente, el valor anterior se copia
 * acá con `vigenteHasta` = momento del reemplazo, antes de actualizar el
 * valor vigente.
 */
export interface PrecioArticuloHistorial extends EntidadBase {
  listaPrecioId: number;
  articuloId: number;
  moneda: Moneda;
  valor: number;
  /** Fecha desde la que ese valor había regido. */
  vigenteDesde: Date;
  /** Fecha en la que pasó a historial (fue reemplazado por un valor nuevo). */
  vigenteHasta: Date;
}
