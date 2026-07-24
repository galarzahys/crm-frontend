import { EntidadBase } from './entidad-base.model';

/**
 * Asignación de un atributo a un artículo, con su valor concreto.
 *
 * En el esquema relacional esto corresponde a una tabla de relación
 * (join table) `articulo_atributos`, con columnas:
 * `id`, `articulo_id` (FK), `atributo_id` (FK), `valor_libre` (nullable),
 * `opcion_id` (FK nullable hacia `atributo_opciones`).
 *
 * Se guarda embebida dentro del artículo en esta etapa (cache en memoria)
 * para simplificar el formulario; el repositorio HTTP futuro puede optar
 * por mandarla tal cual al backend, que la persiste en su propia tabla.
 */
export interface AtributoAsignado {
  atributoId: number;
  /** Valor cargado a mano, usado cuando el atributo es de tipo `libre`. */
  valorLibre: string | null;
  /** Opción elegida, usada cuando el atributo es de tipo `opciones`. */
  opcionId: number | null;
}

/**
 * Componente de costo (material/mano de obra/accesorio) de un artículo,
 * con la cantidad usada (en la unidad de medida propia del material).
 *
 * Tabla de relación `articulo_componentes` (`articulo_id` FK, `material_id`
 * FK, `cantidad`). Se guarda embebida en el artículo en esta etapa,
 * mismo criterio que `AtributoAsignado`.
 */
export interface ComponenteAsignado {
  materialId: number;
  cantidad: number;
}

/**
 * Artículo para venta. Tabla `articulos` en el esquema relacional, con
 * clave foránea `categoria_id` hacia `categorias`.
 */
export interface Articulo extends EntidadBase {
  nombre: string;
  /** Descripción de uso interno (no se muestra al comprador). */
  descripcionInterna: string;
  /** Descripción que va a ver el comprador (ficha de producto, catálogo, etc.). */
  descripcionComprador: string;
  categoriaId: number;
  /**
   * Clave (key) del objeto en el bucket de S3, es lo que se persiste en la
   * base de datos. Es null si el artículo todavía no tiene imagen cargada.
   */
  imagenKey: string | null;
  /**
   * URL para mostrar la imagen (hoy, en la etapa de cache, es una data URL
   * local; a futuro será la URL prefirmada de lectura que devuelva el
   * backend a partir de `imagenKey`). No se persistiría tal cual en una
   * base real porque las URLs prefirmadas expiran.
   */
  imagenUrlVisualizacion: string | null;
  atributos: AtributoAsignado[];
  /** Composición de costos del artículo (receta de materiales/mano de obra). */
  componentes: ComponenteAsignado[];
}
