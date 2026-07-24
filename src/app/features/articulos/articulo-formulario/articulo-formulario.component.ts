import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { Articulo, AtributoAsignado } from '../../../shared/models/articulo.model';
import { Categoria } from '../../../shared/models/categoria.model';
import { CategoriaService } from '../../../shared/services/categoria.service';
import { AtributoConOpciones, AtributoService } from '../../../shared/services/atributo.service';
import { ArticuloService } from '../../../shared/services/articulo.service';
import { AtributoFormularioComponent } from '../../atributos/atributo-formulario/atributo-formulario.component';

/** Estado editable, en el formulario, del valor de un atributo asignado. */
interface ValorAtributoFormulario {
  atributoId: number;
  valorLibre: string;
  opcionId: number | null;
}

@Component({
  selector: 'app-articulo-formulario',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    TextareaModule,
    AtributoFormularioComponent,
  ],
  templateUrl: './articulo-formulario.component.html',
})
export class ArticuloFormularioComponent implements OnInit, OnChanges {
  @Input() articuloEditar: Articulo | null = null;

  @Output() guardado = new EventEmitter<Articulo>();
  @Output() cancelado = new EventEmitter<void>();

  private readonly categoriaService = inject(CategoriaService);
  private readonly atributoService = inject(AtributoService);
  private readonly articuloService = inject(ArticuloService);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly atributosDisponibles = signal<AtributoConOpciones[]>([]);

  protected readonly guardando = signal(false);
  protected readonly subiendoImagen = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly dialogoNuevoAtributoAbierto = signal(false);

  protected nombre = '';
  protected descripcionInterna = '';
  protected descripcionComprador = '';
  protected categoriaId: number | null = null;
  protected imagenKey: string | null = null;
  protected imagenUrlVisualizacion: string | null = null;

  protected atributosSeleccionados: number[] = [];
  protected valoresPorAtributo: Record<number, ValorAtributoFormulario> = {};

  ngOnInit(): void {
    this.categoriaService.listarTodas().subscribe((categorias) => this.categorias.set(categorias));
    this.cargarAtributosDisponibles();
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['articuloEditar']) {
      this.cargarDesdeInput();
    }
  }

  protected get esEdicion(): boolean {
    return !!this.articuloEditar;
  }

  private cargarAtributosDisponibles(): void {
    this.atributoService.listarConOpciones().subscribe((atributos) => this.atributosDisponibles.set(atributos));
  }

  private cargarDesdeInput(): void {
    if (this.articuloEditar) {
      this.nombre = this.articuloEditar.nombre;
      this.descripcionInterna = this.articuloEditar.descripcionInterna;
      this.descripcionComprador = this.articuloEditar.descripcionComprador;
      this.categoriaId = this.articuloEditar.categoriaId;
      this.imagenKey = this.articuloEditar.imagenKey;
      this.imagenUrlVisualizacion = this.articuloEditar.imagenUrlVisualizacion;
      this.atributosSeleccionados = this.articuloEditar.atributos.map((a) => a.atributoId);
      this.valoresPorAtributo = {};
      for (const asignado of this.articuloEditar.atributos) {
        this.valoresPorAtributo[asignado.atributoId] = {
          atributoId: asignado.atributoId,
          valorLibre: asignado.valorLibre ?? '',
          opcionId: asignado.opcionId,
        };
      }
    } else {
      this.reiniciar();
    }
  }

  /** Se llama cuando cambia la selección del multiselect de atributos. */
  protected alCambiarSeleccionAtributos(): void {
    // Da de alta un estado de valor vacío para los recién seleccionados...
    for (const atributoId of this.atributosSeleccionados) {
      if (!this.valoresPorAtributo[atributoId]) {
        this.valoresPorAtributo[atributoId] = { atributoId, valorLibre: '', opcionId: null };
      }
    }
    // ...y limpia los que ya no están seleccionados.
    for (const atributoId of Object.keys(this.valoresPorAtributo).map(Number)) {
      if (!this.atributosSeleccionados.includes(atributoId)) {
        delete this.valoresPorAtributo[atributoId];
      }
    }
  }

  protected atributoPorId(atributoId: number): AtributoConOpciones | undefined {
    return this.atributosDisponibles().find((a) => a.id === atributoId);
  }

  protected abrirNuevoAtributo(): void {
    this.dialogoNuevoAtributoAbierto.set(true);
  }

  /** Al crear un atributo desde acá adentro, lo agrega a la lista y lo selecciona automáticamente. */
  protected alCrearAtributoInline(atributo: AtributoConOpciones): void {
    this.atributosDisponibles.update((lista) => [...lista, atributo]);
    this.atributosSeleccionados = [...this.atributosSeleccionados, atributo.id!];
    this.alCambiarSeleccionAtributos();
    this.dialogoNuevoAtributoAbierto.set(false);
  }

  protected seleccionarArchivo(input: HTMLInputElement): void {
    input.click();
  }

  protected alSeleccionarArchivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) {
      return;
    }

    this.subiendoImagen.set(true);
    this.articuloService.subirImagen(archivo).subscribe({
      next: ({ key, urlVisualizacion }) => {
        this.imagenKey = key;
        this.imagenUrlVisualizacion = urlVisualizacion;
        this.subiendoImagen.set(false);
      },
      error: () => {
        this.subiendoImagen.set(false);
        this.error.set('No se pudo subir la imagen. Probá de nuevo.');
      },
    });

    input.value = '';
  }

  protected quitarImagen(): void {
    this.imagenKey = null;
    this.imagenUrlVisualizacion = null;
  }

  protected guardar(): void {
    this.error.set(null);

    if (!this.nombre.trim()) {
      this.error.set('El nombre es obligatorio.');
      return;
    }
    if (!this.categoriaId) {
      this.error.set('Elegí una categoría.');
      return;
    }

    const atributos: AtributoAsignado[] = this.atributosSeleccionados.map((atributoId) => {
      const valor = this.valoresPorAtributo[atributoId];
      return {
        atributoId,
        valorLibre: valor?.valorLibre?.trim() || null,
        opcionId: valor?.opcionId ?? null,
      };
    });

    this.guardando.set(true);

    const datosBase = {
      nombre: this.nombre.trim(),
      descripcionInterna: this.descripcionInterna.trim(),
      descripcionComprador: this.descripcionComprador.trim(),
      categoriaId: this.categoriaId,
      imagenKey: this.imagenKey,
      imagenUrlVisualizacion: this.imagenUrlVisualizacion,
      atributos,
    };

    const operacion$ = this.esEdicion
      ? this.articuloService.actualizar({ id: this.articuloEditar!.id, ...datosBase })
      : this.articuloService.crear({ ...datosBase, componentes: [] });

    operacion$.subscribe({
      next: (articulo) => {
        this.guardando.set(false);
        this.guardado.emit(articulo);
        this.reiniciar();
      },
      error: () => {
        this.guardando.set(false);
        this.error.set('No se pudo guardar el artículo. Probá de nuevo.');
      },
    });
  }

  protected cancelar(): void {
    this.reiniciar();
    this.cancelado.emit();
  }

  private reiniciar(): void {
    this.nombre = '';
    this.descripcionInterna = '';
    this.descripcionComprador = '';
    this.categoriaId = null;
    this.imagenKey = null;
    this.imagenUrlVisualizacion = null;
    this.atributosSeleccionados = [];
    this.valoresPorAtributo = {};
    this.error.set(null);
  }
}
