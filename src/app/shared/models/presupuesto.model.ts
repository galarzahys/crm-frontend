import { EntidadBase } from './entidad-base.model';
import { Moneda } from './precio-articulo.model';

/**
 * Tipo de servicio del presupuesto. Se modela como una lista fija (en vez
 * de una tabla editable como `Categoria`) porque hoy son 4 valores de
 * negocio conocidos. Si más adelante necesitara ser gestionable desde la
 * UI (agregar/quitar tipos), se puede migrar al mismo patrón que
 * `Categoria` sin romper nada, ya que el resto de la app referencia el
 * valor por su código (`TipoServicio`), no por texto libre.
 */
export type TipoServicio = 'venta_contenedores' | 'alquiler_contenedores' | 'modificacion' | 'accesorios';

export const ETIQUETAS_TIPO_SERVICIO: Record<TipoServicio, string> = {
  venta_contenedores: 'Venta de contenedores',
  alquiler_contenedores: 'Alquiler de contenedores',
  modificacion: 'Modificación',
  accesorios: 'Accesorios',
};

export const OPCIONES_TIPO_SERVICIO: { etiqueta: string; valor: TipoServicio }[] = (
  Object.entries(ETIQUETAS_TIPO_SERVICIO) as [TipoServicio, string][]
).map(([valor, etiqueta]) => ({ valor, etiqueta }));

/**
 * Línea de artículo dentro de un presupuesto.
 *
 * En el esquema relacional corresponde a la tabla de relación
 * `presupuesto_items` (`id`, `presupuesto_id` FK, `articulo_id` FK,
 * `lista_precio_id` FK, `cantidad`, `precio_unitario`, `moneda`,
 * `descuento_porcentaje`, `descuento_valor`). Se guarda embebida en el
 * presupuesto en esta etapa de cache, igual que `AtributoAsignado` en
 * `Articulo`.
 *
 * `precioUnitario`, `moneda` y el descuento se **congelan** al momento de
 * agregar el artículo al presupuesto (copiados desde `PrecioArticulo` de
 * la lista elegida): un presupuesto no debe recalcularse solo si el
 * precio de lista cambia después de emitido.
 */
export interface PresupuestoItem {
  articuloId: number;
  cantidad: number;
  /** Lista de precios de la que se tomó `precioUnitario` (global o sobreescrita para este ítem). */
  listaPrecioId: number;
  precioUnitario: number;
  moneda: Moneda;
  descuentoPorcentaje: number;
  /** Monto de descuento, en la misma moneda que `precioUnitario`. */
  descuentoValor: number;
}

/**
 * Presupuesto. Tabla `presupuestos`, con claves foráneas `cliente_id`,
 * `vendedor_id` y `lista_precio_id` (lista general por defecto).
 */
export interface Presupuesto extends EntidadBase {
  clienteId: number;
  vendedorId: number;
  servicio: TipoServicio;
  /** Días de validez del presupuesto a partir de `fechaEmision`. */
  plazoValidezDias: number;
  /** Fecha de emisión "de negocio" (puede diferir de `creadoEn`, que es de auditoría). */
  fechaEmision: Date;
  /** Lista de precios general del presupuesto (default para los ítems; cada uno puede sobreescribirla). */
  listaPrecioId: number;
  descuentoGeneralPorcentaje: number;
  /** Monto del descuento general, expresado en la moneda "principal" del presupuesto (ver componente). */
  descuentoGeneralValor: number;
  items: PresupuestoItem[];
}

