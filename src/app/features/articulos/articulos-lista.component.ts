import { Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Subject, debounceTime } from 'rxjs';
import { Articulo } from '../../shared/models/articulo.model';
import { Categoria } from '../../shared/models/categoria.model';
import { MaterialConCosto } from '../../shared/models/material.model';
import { CategoriaService } from '../../shared/services/categoria.service';
import { AtributoConOpciones, AtributoService } from '../../shared/services/atributo.service';
import { ArticuloService } from '../../shared/services/articulo.service';
import { MaterialService } from '../../shared/services/material.service';
import { CostoComposicionPipe } from '../../shared/pipes/costo-composicion.pipe';
import { ArticuloCardComponent } from './articulo-card/articulo-card.component';
import { ArticuloFormularioComponent } from './articulo-formulario/articulo-formulario.component';
import { EtiquetaValorAtributoPipe } from './etiqueta-valor-atributo.pipe';

type VistaArticulos = 'cards' | 'lista';

const TAMANIO_PAGINA = 12;

@Component({
  selector: 'app-articulos-lista',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    PaginatorModule,
    SelectButtonModule,
    SelectModule,
    TableModule,
    TagModule,
    ArticuloCardComponent,
    ArticuloFormularioComponent,
    CostoComposicionPipe,
    EtiquetaValorAtributoPipe,
  ],
  templateUrl: './articulos-lista.component.html',
})
export class ArticulosListaComponent implements OnInit {
  private readonly articuloService = inject(ArticuloService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly atributoService = inject(AtributoService);
  private readonly materialService = inject(MaterialService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  protected readonly opcionesVista = [
    { icono: 'pi pi-th-large', valor: 'cards' as VistaArticulos },
    { icono: 'pi pi-list', valor: 'lista' as VistaArticulos },
  ];

  protected readonly vista = signal<VistaArticulos>('cards');
  protected readonly articulos = signal<Articulo[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly atributosDisponibles = signal<AtributoConOpciones[]>([]);
  protected readonly materialesDisponibles = signal<MaterialConCosto[]>([]);
  protected readonly total = signal(0);
  protected readonly primerRegistro = signal(0);
  protected readonly cargando = signal(false);

  protected readonly dialogoAbierto = signal(false);
  protected readonly articuloEnEdicion = signal<Articulo | null>(null);

  protected busqueda = '';
  protected categoriaFiltro: number | null = null;

  private readonly busqueda$ = new Subject<void>();

  constructor() {
    this.busqueda$.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => this.cargar(0));
  }

  ngOnInit(): void {
    this.categoriaService.listarTodas().subscribe((categorias) => this.categorias.set(categorias));
    this.atributoService.listarConOpciones().subscribe((atributos) => this.atributosDisponibles.set(atributos));
    this.materialService.listarConCosto().subscribe((materiales) => this.materialesDisponibles.set(materiales));
    this.cargar(0);
  }

  protected categoriaPorId(id: number): Categoria | null {
    return this.categorias().find((c) => c.id === id) ?? null;
  }

  protected alBuscar(): void {
    this.busqueda$.next();
  }

  protected alCambiarCategoria(): void {
    this.cargar(0);
  }

  protected alCambiarPagina(evento: PaginatorState): void {
    this.primerRegistro.set(evento.first ?? 0);
    this.cargar(evento.page ?? 0);
  }

  protected abrirAlta(): void {
    this.articuloEnEdicion.set(null);
    this.dialogoAbierto.set(true);
  }

  protected abrirEdicion(articulo: Articulo): void {
    this.articuloEnEdicion.set(articulo);
    this.dialogoAbierto.set(true);
  }

  /**
   * Navega a la pantalla propia de composición de costos del artículo
   * (no es un diálogo). Asume la ruta `articulos/:id/composicion` — ajustar
   * si se registró con otro path.
   */
  protected irAComposicion(articulo: Articulo): void {
    this.router.navigate(['/articulos', articulo.id, 'composicion']);
  }

  protected alGuardar(): void {
    this.dialogoAbierto.set(false);
    this.cargar(0);
    this.messageService.add({ severity: 'success', summary: 'Artículo guardado', detail: 'Los cambios se guardaron correctamente.' });
    // Puede haberse creado un atributo nuevo desde el formulario: refrescamos la lista disponible.
    this.atributoService.listarConOpciones().subscribe((atributos) => this.atributosDisponibles.set(atributos));
  }

  protected confirmarEliminacion(articulo: Articulo): void {
    this.confirmationService.confirm({
      header: 'Eliminar artículo',
      message: `¿Seguro que querés eliminar "${articulo.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminar(articulo),
    });
  }

  private eliminar(articulo: Articulo): void {
    this.articuloService.eliminar(articulo.id!).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Artículo eliminado', detail: `Se eliminó "${articulo.nombre}".` });
      this.cargar(0);
    });
  }

  private cargar(pagina: number): void {
    this.cargando.set(true);
    this.articuloService
      .listar({
        pagina,
        tamanio: TAMANIO_PAGINA,
        ordenarPor: 'nombre',
        busqueda: this.busqueda || undefined,
        categoriaId: this.categoriaFiltro,
      })
      .subscribe((resultado) => {
        this.articulos.set(resultado.datos);
        this.total.set(resultado.total);
        this.primerRegistro.set(resultado.pagina * resultado.tamanio);
        this.cargando.set(false);
      });
  }
}
