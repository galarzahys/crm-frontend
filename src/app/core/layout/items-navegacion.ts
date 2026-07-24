export interface ItemNavegacion {
  etiqueta: string;
  icono: string;
  ruta: string;
}

/**
 * Ítems del menú lateral. A medida que se agreguen módulos/pantallas
 * nuevas, este es el único lugar que hay que tocar para que aparezcan
 * en la barra de navegación.
 */
export const ITEMS_NAVEGACION: ItemNavegacion[] = [
  { etiqueta: 'Inicio', icono: 'pi pi-home', ruta: '/inicio' },
  { etiqueta: 'Artículos', icono: 'pi pi-box', ruta: '/articulos' },
  { etiqueta: 'Atributos', icono: 'pi pi-tags', ruta: '/atributos' },
  { etiqueta: 'Presupuestos', icono: 'pi pi-receipt', ruta: '/presupuestos' },
  { etiqueta: 'Lista de Precios', icono: 'pi pi-dollar', ruta: '/precios' },
  { etiqueta: 'Clientes', icono: 'pi pi-users', ruta: '/nuevo-cliente' },
  { etiqueta: 'Ficha de Clientes', icono: 'pi pi-file', ruta: '/ficha-cliente' },
  { etiqueta: 'Materiales', icono: 'pi pi-list', ruta: '/detalle-costos' },
  { etiqueta: 'Costos', icono: 'pi pi-calculator', ruta: '/costos' },
];
