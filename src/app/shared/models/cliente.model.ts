import { EntidadBase } from './entidad-base.model';

/** Valor concreto de un campo de la ficha, cargado en un cliente puntual. */
export interface ValorCampoCliente {
  campoId: number;
  valor: string;
}

/**
 * Cliente. La ficha es 100% dinámica: qué datos tiene un cliente depende
 * de los campos definidos en `CampoFichaCliente` (ver ese modelo) — acá
 * solo se guardan los valores cargados (`valores`) más una `etiqueta`
 * legible (calculada por el backend a partir de los campos marcados como
 * buscador) para mostrar en listas y en el autocomplete de presupuestos.
 */
export interface Cliente extends EntidadBase {
  valores: ValorCampoCliente[];
  etiqueta: string;
}

/** Datos que manda el formulario al crear/editar un cliente. */
export interface DatosFormularioCliente {
  valores: ValorCampoCliente[];
}
