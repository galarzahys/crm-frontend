import { EntidadBase } from './entidad-base.model';

export type TipoCampoFicha = 'texto' | 'numero' | 'fecha' | 'email' | 'telefono';

export const ETIQUETAS_TIPO_CAMPO: Record<TipoCampoFicha, string> = {
  texto: 'Texto',
  numero: 'Número',
  fecha: 'Fecha',
  email: 'Email',
  telefono: 'Teléfono',
};

export const OPCIONES_TIPO_CAMPO: { etiqueta: string; valor: TipoCampoFicha }[] = (
  Object.entries(ETIQUETAS_TIPO_CAMPO) as [TipoCampoFicha, string][]
).map(([valor, etiqueta]) => ({ valor, etiqueta }));

/** Ícono de PrimeIcons por tipo, para la vista previa de la ficha. */
export const ICONOS_TIPO_CAMPO: Record<TipoCampoFicha, string> = {
  texto: 'pi pi-align-left',
  numero: 'pi pi-hashtag',
  fecha: 'pi pi-calendar',
  email: 'pi pi-at',
  telefono: 'pi pi-phone',
};

/**
 * Definición de un campo de la ficha de registro de cliente (metadato,
 * no el valor cargado). Tabla `campos_ficha_cliente` en el esquema
 * relacional. El usuario arma su ficha agregando/editando estos registros.
 */
export interface CampoFichaCliente extends EntidadBase {
  nombre: string;
  /** Identificador estable, no cambia si se edita `nombre` después. */
  clave: string;
  tipo: TipoCampoFicha;
  obligatorio: boolean;
  esBuscador: boolean;
}

/** Datos de alta/edición de un campo (todo lo que carga el formulario). */
export interface DatosFormularioCampoFicha {
  nombre: string;
  tipo: TipoCampoFicha;
  obligatorio: boolean;
  esBuscador: boolean;
}

export const LIMITE_CAMPOS_BUSCADOR = 2;
