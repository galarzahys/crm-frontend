import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AtributoConOpciones, AtributoService, DatosFormularioAtributo } from '../../../shared/services/atributo.service';
import { TipoAtributo } from '../../../shared/models/atributo.model';

interface OpcionTipoAtributo {
  etiqueta: string;
  valor: TipoAtributo;
}

@Component({
  selector: 'app-atributo-formulario',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './atributo-formulario.component.html',
})
export class AtributoFormularioComponent implements OnChanges {
  /** Atributo a editar. Si es null/undefined, el formulario trabaja en modo alta. */
  @Input() atributoEditar: AtributoConOpciones | null = null;

  /** Se emite con el atributo (ya persistido, con sus opciones) al guardar con éxito. */
  @Output() guardado = new EventEmitter<AtributoConOpciones>();
  @Output() cancelado = new EventEmitter<void>();

  private readonly atributoService = inject(AtributoService);

  protected readonly tiposDisponibles: OpcionTipoAtributo[] = [
    { etiqueta: 'Texto libre', valor: 'libre' },
    { etiqueta: 'Opciones seleccionables', valor: 'opciones' },
  ];

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected nombre = '';
  protected unidadMedida = '';
  protected tipo: TipoAtributo = 'libre';
  protected opciones: string[] = [''];

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['atributoEditar']) {
      this.cargarDesdeInput();
    }
  }

  protected get esEdicion(): boolean {
    return !!this.atributoEditar;
  }

  protected get esOpciones(): boolean {
    return this.tipo === 'opciones';
  }

  protected agregarOpcion(): void {
    this.opciones.push('');
  }

  protected quitarOpcion(indice: number): void {
    this.opciones.splice(indice, 1);
    if (this.opciones.length === 0) {
      this.opciones.push('');
    }
  }

  protected guardar(): void {
    this.error.set(null);

    if (!this.nombre.trim()) {
      this.error.set('El nombre es obligatorio.');
      return;
    }
    if (this.esOpciones && this.opciones.every((opcion) => !opcion.trim())) {
      this.error.set('Agregá al menos una opción.');
      return;
    }

    const datos: DatosFormularioAtributo = {
      nombre: this.nombre.trim(),
      unidadMedida: this.unidadMedida.trim() || null,
      tipo: this.tipo,
      opciones: this.opciones,
    };

    this.guardando.set(true);
    const operacion$ = this.esEdicion
      ? this.atributoService.actualizar(this.atributoEditar!.id!, datos)
      : this.atributoService.crear(datos);

    operacion$.subscribe({
      next: (atributo) => {
        this.guardando.set(false);
        this.guardado.emit(atributo);
        this.reiniciar();
      },
      error: () => {
        this.guardando.set(false);
        this.error.set('No se pudo guardar el atributo. Probá de nuevo.');
      },
    });
  }

  protected cancelar(): void {
    this.reiniciar();
    this.cancelado.emit();
  }

  private cargarDesdeInput(): void {
    if (this.atributoEditar) {
      this.nombre = this.atributoEditar.nombre;
      this.unidadMedida = this.atributoEditar.unidadMedida ?? '';
      this.tipo = this.atributoEditar.tipo;
      this.opciones = this.atributoEditar.opciones.length
        ? this.atributoEditar.opciones.map((opcion) => opcion.valor)
        : [''];
    } else {
      this.reiniciar();
    }
  }

  private reiniciar(): void {
    this.nombre = '';
    this.unidadMedida = '';
    this.tipo = 'libre';
    this.opciones = [''];
    this.error.set(null);
  }
}
