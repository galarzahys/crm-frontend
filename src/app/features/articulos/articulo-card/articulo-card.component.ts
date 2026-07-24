import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { Articulo } from '../../../shared/models/articulo.model';
import { Categoria } from '../../../shared/models/categoria.model';
import { MaterialConCosto } from '../../../shared/models/material.model';
import { AtributoConOpciones } from '../../../shared/services/atributo.service';
import { CostoComposicionPipe } from '../../../shared/pipes/costo-composicion.pipe';
import { EtiquetaValorAtributoPipe } from '../etiqueta-valor-atributo.pipe';

@Component({
  selector: 'app-articulo-card',
  standalone: true,
  imports: [ButtonModule, ChipModule, TagModule, CostoComposicionPipe, EtiquetaValorAtributoPipe],
  templateUrl: './articulo-card.component.html',
})
export class ArticuloCardComponent {
  @Input({ required: true }) articulo!: Articulo;
  @Input() categoria: Categoria | null = null;
  @Input() atributosDisponibles: AtributoConOpciones[] = [];
  @Input() materialesDisponibles: MaterialConCosto[] = [];

  @Output() editar = new EventEmitter<Articulo>();
  @Output() eliminar = new EventEmitter<Articulo>();
  @Output() composicion = new EventEmitter<Articulo>();
}
