import { EntidadBase } from './entidad-base.model';

/**
 * Vendedor que puede quedar asignado a un presupuesto. Tabla `vendedores`
 * en el esquema relacional. Lista mockeada por ahora (ver `VendedorService`).
 */
export interface Vendedor extends EntidadBase {
  nombre: string;
}
