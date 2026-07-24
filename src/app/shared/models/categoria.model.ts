import { EntidadBase } from './entidad-base.model';

/**
 * Categoría de artículo. Tabla simple (`categorias`) referenciada por
 * `articulos.categoria_id` (clave foránea) en el esquema relacional.
 */
export interface Categoria extends EntidadBase {
  nombre: string;
}
