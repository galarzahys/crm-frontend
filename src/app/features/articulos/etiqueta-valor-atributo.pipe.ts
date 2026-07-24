import { Pipe, PipeTransform } from '@angular/core';
import { AtributoAsignado } from '../../shared/models/articulo.model';
import { AtributoConOpciones } from '../../shared/services/atributo.service';

/**
 * Transforma una asignación de atributo (id + valor) en un texto legible,
 * por ejemplo: "Color: Rojo" o "Alto: 20 cm", buscando el atributo (y su
 * opción, si corresponde) en la lista de atributos disponibles.
 */
@Pipe({ name: 'etiquetaValorAtributo', standalone: true })
export class EtiquetaValorAtributoPipe implements PipeTransform {
  transform(asignado: AtributoAsignado, atributosDisponibles: AtributoConOpciones[]): string {
    const atributo = atributosDisponibles.find((a) => a.id === asignado.atributoId);
    if (!atributo) {
      return '';
    }

    let valor: string;
    if (atributo.tipo === 'opciones') {
      valor = atributo.opciones.find((opcion) => opcion.id === asignado.opcionId)?.valor ?? '—';
    } else {
      valor = asignado.valorLibre ?? '—';
    }

    const unidad = atributo.unidadMedida ? ` ${atributo.unidadMedida}` : '';
    return `${atributo.nombre}: ${valor}${unidad}`;
  }
}
