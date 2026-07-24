import { Pipe, PipeTransform } from '@angular/core';
import { ComponenteAsignado } from '../models/articulo.model';
import { MaterialConCosto } from '../models/material.model';
import { Moneda } from '../models/precio-articulo.model';

/**
 * Calcula el costo total de la composición de un artículo (sumatoria de
 * cantidad × costo unitario de cada material) y lo devuelve ya formateado,
 * agrupado por moneda si hace falta (los materiales pueden estar costeados
 * en ARS y en USD a la vez).
 *
 * Se usa tanto en el listado de artículos como en la configuración de
 * listas de precio, para tener a la vista el costo de producción junto al
 * valor de venta.
 */
@Pipe({ name: 'costoComposicion', standalone: true })
export class CostoComposicionPipe implements PipeTransform {
  private readonly formateadores: Record<Moneda, Intl.NumberFormat> = {
    ARS: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 4 }),
    USD: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 }),
  };

  transform(componentes: ComponenteAsignado[] | null | undefined, materiales: MaterialConCosto[] | null | undefined): string {
    if (!componentes || componentes.length === 0) {
      return 'Sin composición';
    }
    if (!materiales) {
      return '—';
    }

    const totalesPorMoneda = new Map<Moneda, number>();
    let algunoSinCosto = false;

    for (const componente of componentes) {
      const material = materiales.find((m) => m.id === componente.materialId);
      const costo = material?.costoActual;
      if (!costo) {
        algunoSinCosto = true;
        continue;
      }
      const subtotal = componente.cantidad * costo.valor;
      totalesPorMoneda.set(costo.moneda, (totalesPorMoneda.get(costo.moneda) ?? 0) + subtotal);
    }

    if (totalesPorMoneda.size === 0) {
      return 'Sin costo definido';
    }

    const partes = Array.from(totalesPorMoneda.entries()).map(([moneda, total]) => this.formateadores[moneda].format(total));
    return partes.join(' + ') + (algunoSinCosto ? ' (parcial)' : '');
  }
}
