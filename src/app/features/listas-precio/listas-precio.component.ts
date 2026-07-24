import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { Articulo } from '../../shared/models/articulo.model';
import { Categoria } from '../../shared/models/categoria.model';
import { ListaPrecio } from '../../shared/models/lista-precio.model';
import { MaterialConCosto } from '../../shared/models/material.model';
import { Moneda, OPCIONES_MONEDA, PrecioArticulo, PrecioArticuloHistorial } from '../../shared/models/precio-articulo.model';
import { ArticuloService } from '../../shared/services/articulo.service';
import { CategoriaService } from '../../shared/services/categoria.service';
import { ListaPrecioService } from '../../shared/services/lista-precio.service';
import { MaterialService } from '../../shared/services/material.service';
import { PrecioArticuloService } from '../../shared/services/precio-articulo.service';
import { CostoComposicionPipe } from '../../shared/pipes/costo-composicion.pipe';

type Vista = 'listas' | 'detalle';

@Component({
  selector: 'app-listas-precio',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    ButtonModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TextareaModule,
    CostoComposicionPipe,
  ],
  templateUrl: './listas-precio.component.html',
})
export class ListasPrecioComponent implements OnInit {
  private readonly listaPrecioService = inject(ListaPrecioService);
  private readonly precioArticuloService = inject(PrecioArticuloService);
  private readonly articuloService = inject(ArticuloService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly materialService = inject(MaterialService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly opcionesMoneda = OPCIONES_MONEDA;

  // --- Vista general: CRUD de listas ---
  protected readonly vista = signal<Vista>('listas');
  protected readonly listas = signal<ListaPrecio[]>([]);
  protected readonly cargandoListas = signal(false);

  protected readonly dialogoListaAbierto = signal(false);
  protected readonly listaEnEdicion = signal<ListaPrecio | null>(null);
  protected nombreLista = '';
  protected descripcionLista = '';
  protected readonly guardandoLista = signal(false);
  protected readonly errorLista = signal<string | null>(null);

  // --- Vista de detalle: valores por artículo de una lista ---
  protected readonly listaSeleccionada = signal<ListaPrecio | null>(null);
  protected readonly articulos = signal<Articulo[]>([]);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly materialesDisponibles = signal<MaterialConCosto[]>([]);
  protected readonly preciosVigentes = signal<PrecioArticulo[]>([]);
  protected readonly cargandoDetalle = signal(false);
  protected busquedaArticulo = '';

  protected readonly articulosFiltrados = computed(() => {
    const texto = this.busquedaArticulo.trim().toLowerCase();
    if (!texto) {
      return this.articulos();
    }
    return this.articulos().filter((articulo) => articulo.nombre.toLowerCase().includes(texto));
  });

  // --- Diálogo: definir/editar valor ---
  protected readonly dialogoValorAbierto = signal(false);
  protected readonly articuloParaValor = signal<Articulo | null>(null);
  protected monedaForm: Moneda = 'ARS';
  protected valorForm: number | null = null;
  protected readonly guardandoValor = signal(false);
  protected readonly errorValor = signal<string | null>(null);

  // --- Diálogo: historial ---
  protected readonly dialogoHistorialAbierto = signal(false);
  protected readonly articuloParaHistorial = signal<Articulo | null>(null);
  protected readonly historial = signal<PrecioArticuloHistorial[]>([]);
  protected readonly cargandoHistorial = signal(false);

  private readonly formateadores: Record<Moneda, Intl.NumberFormat> = {
    ARS: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }),
    USD: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }),
  };

  ngOnInit(): void {
    this.cargarListas();
  }

  // ---------- Listas de precio ----------

  protected cargarListas(): void {
    this.cargandoListas.set(true);
    this.listaPrecioService.listarTodas().subscribe((listas) => {
      this.listas.set(listas);
      this.cargandoListas.set(false);
    });
  }

  protected abrirAltaLista(): void {
    this.listaEnEdicion.set(null);
    this.nombreLista = '';
    this.descripcionLista = '';
    this.errorLista.set(null);
    this.dialogoListaAbierto.set(true);
  }

  protected abrirEdicionLista(lista: ListaPrecio): void {
    this.listaEnEdicion.set(lista);
    this.nombreLista = lista.nombre;
    this.descripcionLista = lista.descripcion ?? '';
    this.errorLista.set(null);
    this.dialogoListaAbierto.set(true);
  }

  protected guardarLista(): void {
    this.errorLista.set(null);
    if (!this.nombreLista.trim()) {
      this.errorLista.set('El nombre es obligatorio.');
      return;
    }

    this.guardandoLista.set(true);
    const datos = { nombre: this.nombreLista.trim(), descripcion: this.descripcionLista.trim() || null };
    const enEdicion = this.listaEnEdicion();

    const operacion$ = enEdicion
      ? this.listaPrecioService.actualizar({ id: enEdicion.id, ...datos })
      : this.listaPrecioService.crear(datos);

    operacion$.subscribe({
      next: () => {
        this.guardandoLista.set(false);
        this.dialogoListaAbierto.set(false);
        this.cargarListas();
        this.messageService.add({ severity: 'success', summary: 'Lista guardada', detail: 'Los cambios se guardaron correctamente.' });
      },
      error: () => {
        this.guardandoLista.set(false);
        this.errorLista.set('No se pudo guardar la lista. Probá de nuevo.');
      },
    });
  }

  protected confirmarEliminacionLista(lista: ListaPrecio): void {
    this.confirmationService.confirm({
      header: 'Eliminar lista de precios',
      message: `¿Seguro que querés eliminar la lista "${lista.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminarLista(lista),
    });
  }

  private eliminarLista(lista: ListaPrecio): void {
    this.listaPrecioService.eliminar(lista.id!).subscribe(() => {
      this.cargarListas();
      this.messageService.add({ severity: 'success', summary: 'Lista eliminada', detail: `Se eliminó "${lista.nombre}".` });
    });
  }

  // ---------- Detalle: valores por artículo ----------

  protected abrirDetalle(lista: ListaPrecio): void {
    this.listaSeleccionada.set(lista);
    this.vista.set('detalle');
    this.busquedaArticulo = '';
    this.cargandoDetalle.set(true);

    if (this.categorias().length === 0) {
      this.categoriaService.listarTodas().subscribe((categorias) => this.categorias.set(categorias));
    }
    if (this.articulos().length === 0) {
      this.articuloService.listar({ tamanio: 1000, ordenarPor: 'nombre' }).subscribe((resultado) => this.articulos.set(resultado.datos));
    }
    if (this.materialesDisponibles().length === 0) {
      this.materialService.listarConCosto().subscribe((materiales) => this.materialesDisponibles.set(materiales));
    }

    this.cargarPreciosVigentes(lista.id!);
  }

  protected volverAListas(): void {
    this.vista.set('listas');
    this.listaSeleccionada.set(null);
  }

  private cargarPreciosVigentes(listaPrecioId: number): void {
    this.precioArticuloService.listarVigentesDeLista(listaPrecioId).subscribe((precios) => {
      this.preciosVigentes.set(precios);
      this.cargandoDetalle.set(false);
    });
  }

  protected categoriaNombre(categoriaId: number): string {
    return this.categorias().find((c) => c.id === categoriaId)?.nombre ?? '—';
  }

  protected precioDe(articuloId: number): PrecioArticulo | undefined {
    return this.preciosVigentes().find((precio) => precio.articuloId === articuloId);
  }

  protected formatearValor(valor: number, moneda: Moneda): string {
    return this.formateadores[moneda].format(valor);
  }

  // ---------- Definir / editar valor ----------

  protected abrirDialogoValor(articulo: Articulo): void {
    const precioActual = this.precioDe(articulo.id!);
    this.articuloParaValor.set(articulo);
    this.monedaForm = precioActual?.moneda ?? 'ARS';
    this.valorForm = precioActual?.valor ?? null;
    this.errorValor.set(null);
    this.dialogoValorAbierto.set(true);
  }

  protected guardarValor(): void {
    this.errorValor.set(null);

    if (!this.valorForm || this.valorForm <= 0) {
      this.errorValor.set('Ingresá un valor mayor a cero.');
      return;
    }

    const lista = this.listaSeleccionada();
    const articulo = this.articuloParaValor();
    if (!lista || !articulo) {
      return;
    }

    this.guardandoValor.set(true);
    this.precioArticuloService.definirValor(lista.id!, articulo.id!, this.valorForm, this.monedaForm).subscribe({
      next: () => {
        this.guardandoValor.set(false);
        this.dialogoValorAbierto.set(false);
        this.cargarPreciosVigentes(lista.id!);
        this.messageService.add({ severity: 'success', summary: 'Valor guardado', detail: `Se actualizó el valor de "${articulo.nombre}".` });
      },
      error: () => {
        this.guardandoValor.set(false);
        this.errorValor.set('No se pudo guardar el valor. Probá de nuevo.');
      },
    });
  }

  // ---------- Historial ----------

  protected abrirHistorial(articulo: Articulo): void {
    const lista = this.listaSeleccionada();
    if (!lista) {
      return;
    }
    this.articuloParaHistorial.set(articulo);
    this.dialogoHistorialAbierto.set(true);
    this.cargandoHistorial.set(true);
    this.precioArticuloService.historialDe(lista.id!, articulo.id!).subscribe((historial) => {
      this.historial.set(historial);
      this.cargandoHistorial.set(false);
    });
  }
}
