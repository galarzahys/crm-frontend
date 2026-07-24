import { EntidadBase } from './entidad-base.model';
import { Moneda } from './precio-articulo.model';

export type TipoMaterial = 'material' | 'mano_obra' | 'accesorio' | 'insumos' | 'estructural';

export const ETIQUETAS_TIPO_MATERIAL: Record<TipoMaterial, string> = {
  estructural: 'Estructural',
  material: 'Material',
  insumos: 'Insumos',
  mano_obra: 'Mano de obra',
  accesorio: 'Accesorio'
};

export const OPCIONES_TIPO_MATERIAL: { etiqueta: string; valor: TipoMaterial }[] = (
  Object.entries(ETIQUETAS_TIPO_MATERIAL) as [TipoMaterial, string][]
).map(([valor, etiqueta]) => ({ valor, etiqueta }));

/**
 * Material, mano de obra o accesorio que se puede usar como componente de
 * costo de un artículo. Tabla `materiales` en el esquema relacional.
 */
export interface Material extends EntidadBase {
  nombre: string;
  tipo: TipoMaterial;
  /** Ej: "kg", "m2", "hora", "unidad". Texto libre, igual que en Atributo. */
  unidadMedida: string;
}

/**
 * Costo vigente por unidad de medida de un material. Un solo valor activo
 * por material a la vez (los valores anteriores quedan en `MaterialCostoHistorial`).
 */
export interface MaterialCosto extends EntidadBase {
  materialId: number;
  moneda: Moneda;
  valor: number;
  vigenteDesde: Date;
}

/** Costo histórico (ya reemplazado) de un material. */
export interface MaterialCostoHistorial extends EntidadBase {
  materialId: number;
  moneda: Moneda;
  valor: number;
  vigenteDesde: Date;
  vigenteHasta: Date;
}

/** Material junto con su costo vigente (si ya se definió), para simplificar la UI. */
export interface MaterialConCosto extends Material {
  costoActual: MaterialCosto | null;
}

export interface DatosFormularioMaterial {
  nombre: string;
  tipo: TipoMaterial;
  unidadMedida: string;
}

export interface DatosCostoMaterial {
  moneda: Moneda;
  valor: number;
}
