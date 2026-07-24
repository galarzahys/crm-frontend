import { EntidadBase } from './entidad-base.model';

/**
 * Tipo de carga de valor que acepta un atributo:
 * - `libre`: el valor se escribe a mano (texto libre) al asignarlo a un artículo.
 * - `opciones`: el valor se elige de una lista predefinida (`AtributoOpcion`).
 */
export type TipoAtributo = 'libre' | 'opciones';

export const ETIQUETAS_TIPO_ATRIBUTO: Record<TipoAtributo, string> = {
  libre: 'Texto libre',
  opciones: 'Opciones seleccionables',
};

/**
 * Atributo reutilizable que luego se puede asignar a uno o más artículos
 * (por ejemplo: "Color", "Alto", "Material"). Tabla `atributos` en el
 * esquema relacional.
 */
export interface Atributo extends EntidadBase {
  nombre: string;
  /** Unidad de medida opcional (ej: "cm", "kg"). Null si no aplica (ej: "Color"). */
  unidadMedida: string | null;
  tipo: TipoAtributo;
}

/**
 * Opción seleccionable de un atributo de tipo `opciones` (por ejemplo,
 * para el atributo "Color": "Rojo", "Azul", "Verde"). Tabla `atributo_opciones`,
 * con clave foránea `atributo_id` hacia `atributos` (relación uno a muchos).
 */
export interface AtributoOpcion extends EntidadBase {
  atributoId: number;
  valor: string;
}
