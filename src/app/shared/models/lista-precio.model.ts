import { EntidadBase } from './entidad-base.model';

/**
 * Lista de precios (por ejemplo: "Lista mayorista", "Lista minorista",
 * "Lista exportación"). Tabla `listas_precio` en el esquema relacional.
 * Cada artículo puede tener un valor distinto definido por lista (ver
 * `PrecioArticulo`).
 */
export interface ListaPrecio extends EntidadBase {
  nombre: string;
  descripcion: string | null;
}
