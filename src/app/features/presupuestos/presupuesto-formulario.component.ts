import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Articulo } from '../../shared/models/articulo.model';
import { Cliente } from '../../shared/models/cliente.model';
import { ListaPrecio } from '../../shared/models/lista-precio.model';
import { Moneda, PrecioArticulo } from '../../shared/models/precio-articulo.model';
import { OPCIONES_TIPO_SERVICIO, PresupuestoItem, TipoServicio } from '../../shared/models/presupuesto.model';
import { Vendedor } from '../../shared/models/vendedor.model';
import { ArticuloService } from '../../shared/services/articulo.service';
import { ClienteService } from '../../shared/services/cliente.service';
import { ListaPrecioService } from '../../shared/services/lista-precio.service';
import { PrecioArticuloService } from '../../shared/services/precio-articulo.service';
import { PresupuestoService } from '../../shared/services/presupuesto.service';
import { VendedorService } from '../../shared/services/vendedor.service';
import { ClienteFormularioComponent } from '../clientes/cliente-formulario/cliente-formulario.component';

/** Origen del último valor tocado por el usuario en un par %/monto reactivo. */
type OrigenDescuento = 'porcentaje' | 'valor';

/** Línea de ítem tal como se maneja en el formulario. */
interface ItemFormulario {
  articuloId: number;
  articulo: Articulo;
  /** Lista de precios efectivamente aplicada a este ítem. */
  listaPrecioId: number;
  /** Si sigue a la lista general del presupuesto (true) o fue sobreescrita a mano para este ítem (false). */
  usaListaGeneral: boolean;
  precioUnitario: number;
  moneda: Moneda;
  /** false si el artículo no tiene un valor definido en la lista elegida (precioUnitario queda en 0). */
  precioDefinido: boolean;
  cantidad: number;
  descuentoPorcentaje: number;
  descuentoValor: number;
  origenDescuento: OrigenDescuento;
}

/** Resumen de totales para una moneda presente en el presupuesto. */
interface TotalPorMoneda {
  moneda: Moneda;
  subtotalBruto: number;
  descuentoItems: number;
  subtotalConDescuentosItems: number;
  descuentoGeneral: number;
  total: number;
}

const PLAZO_VALIDEZ_POR_DEFECTO_DIAS = 15;

@Component({
  selector: 'app-presupuesto-formulario',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule, ButtonModule, DialogModule, InputNumberModule, SelectModule, ClienteFormularioComponent],
  templateUrl: './presupuesto-formulario.component.html',
})
export class PresupuestoFormularioComponent implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly vendedorService = inject(VendedorService);
  private readonly articuloService = inject(ArticuloService);
  private readonly listaPrecioService = inject(ListaPrecioService);
  private readonly precioArticuloService = inject(PrecioArticuloService);
  private readonly presupuestoService = inject(PresupuestoService);
  private readonly messageService = inject(MessageService);

  protected readonly opcionesServicio = OPCIONES_TIPO_SERVICIO;

  protected readonly vendedores = signal<Vendedor[]>([]);
  protected readonly listasPrecio = signal<ListaPrecio[]>([]);
  protected readonly articulosDisponibles = signal<Articulo[]>([]);
  protected readonly sugerenciasClientes = signal<Cliente[]>([]);
  protected readonly dialogoNuevoClienteAbierto = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected clienteSeleccionado: Cliente | null = null;
  protected vendedorId: number | null = null;
  protected servicio: TipoServicio | null = null;
  protected plazoValidezDias = PLAZO_VALIDEZ_POR_DEFECTO_DIAS;

  /** Lista de precios general del presupuesto: default para los ítems nuevos. */
  protected listaPrecioGeneralId: number | null = null;

  protected articuloParaAgregarId: number | null = null;
  protected cantidadParaAgregar = 1;
  protected items: ItemFormulario[] = [];

  /** Descuento general, reactivo entre % y monto (el monto se expresa en `monedaPrincipal`). */
  protected descuentoGeneralPorcentaje = 0;
  protected descuentoGeneralValor = 0;
  private origenDescuentoGeneral: OrigenDescuento = 'porcentaje';

  /** Cache local de precios ya consultados por lista, para no repetir pedidos. */
  private readonly preciosPorLista = new Map<number, PrecioArticulo[]>();

  private readonly formateadores: Record<Moneda, Intl.NumberFormat> = {
    ARS: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }),
    USD: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }),
  };

  ngOnInit(): void {
    this.vendedorService.listarTodos().subscribe((vendedores) => this.vendedores.set(vendedores));
    this.listaPrecioService.listarTodas().subscribe((listas) => this.listasPrecio.set(listas));
    this.articuloService
      .listar({ tamanio: 1000, ordenarPor: 'nombre' })
      .subscribe((resultado) => this.articulosDisponibles.set(resultado.datos));
  }

  /** Artículos para el selector de "agregar": excluye los que ya están en el presupuesto. */
  protected get articulosParaAgregar(): Articulo[] {
    const idsAgregados = new Set(this.items.map((item) => item.articuloId));
    return this.articulosDisponibles().filter((articulo) => !idsAgregados.has(articulo.id!));
  }

  /** Moneda del grupo con mayor subtotal; es la moneda en la que se expresa el descuento general en monto. */
  protected get monedaPrincipal(): Moneda {
    const grupos = this.agruparPorMoneda();
    if (grupos.length === 0) {
      return 'ARS';
    }
    return grupos.reduce((mayor, actual) => (actual.subtotalConDescuentosItems > mayor.subtotalConDescuentosItems ? actual : mayor)).moneda;
  }

  /** Totales finales, agrupados por moneda (un presupuesto puede mezclar artículos en ARS y USD). */
  protected get totalesPorMoneda(): TotalPorMoneda[] {
    const monedaPrincipal = this.monedaPrincipal;
    return this.agruparPorMoneda().map((grupo) => {
      // Para la moneda principal usamos el monto exacto que cargó (o que se derivó
      // en el momento) en vez de recalcularlo desde el %: redondear el % a 2
      // decimales y volver a multiplicarlo contra una base grande (montos de
      // millones) amplifica el error de redondeo. Para el resto de las monedas
      // (si el presupuesto mezcla ARS y USD) no hay un monto propio cargado, así
      // que ahí sí corresponde aplicar el mismo % general sobre esa base.
      const descuentoGeneral =
        grupo.moneda === monedaPrincipal
          ? this.clamp(this.descuentoGeneralValor, 0, grupo.subtotalConDescuentosItems)
          : this.redondear(grupo.subtotalConDescuentosItems * (this.descuentoGeneralPorcentaje / 100));
      return {
        ...grupo,
        descuentoGeneral,
        total: this.redondear(grupo.subtotalConDescuentosItems - descuentoGeneral),
      };
    });
  }

  protected formatearValor(valor: number, moneda: Moneda): string {
    return this.formateadores[moneda].format(valor);
  }

  protected subtotalItem(item: ItemFormulario): number {
    return this.redondear(item.precioUnitario * item.cantidad - item.descuentoValor);
  }

  // ---------- Cliente ----------

  protected buscarClientes(evento: AutoCompleteCompleteEvent): void {
    this.clienteService.buscar(evento.query).subscribe((clientes) => this.sugerenciasClientes.set(clientes));
  }

  protected abrirNuevoCliente(): void {
    this.dialogoNuevoClienteAbierto.set(true);
  }

  /** Al crear un cliente desde acá adentro, lo selecciona automáticamente en el autocomplete. */
  protected alCrearClienteInline(cliente: Cliente): void {
    this.clienteSeleccionado = cliente;
    this.dialogoNuevoClienteAbierto.set(false);
  }

  // ---------- Lista de precios general ----------

  protected alCambiarListaGeneral(): void {
    if (!this.listaPrecioGeneralId) {
      return;
    }
    for (const item of this.items) {
      if (item.usaListaGeneral) {
        this.actualizarPrecioItem(item, this.listaPrecioGeneralId);
      }
    }
  }

  // ---------- Ítems ----------

  protected agregarItem(): void {
    this.error.set(null);

    if (!this.listaPrecioGeneralId) {
      this.error.set('Elegí primero una lista de precios para el presupuesto.');
      return;
    }
    if (!this.articuloParaAgregarId) {
      this.error.set('Elegí un artículo para agregar.');
      return;
    }
    if (!this.cantidadParaAgregar || this.cantidadParaAgregar <= 0) {
      this.error.set('La cantidad tiene que ser mayor a cero.');
      return;
    }

    const articulo = this.articulosDisponibles().find((a) => a.id === this.articuloParaAgregarId);
    if (!articulo) {
      return;
    }

    const nuevoItem: ItemFormulario = {
      articuloId: articulo.id!,
      articulo,
      listaPrecioId: this.listaPrecioGeneralId,
      usaListaGeneral: true,
      precioUnitario: 0,
      moneda: 'ARS',
      precioDefinido: false,
      cantidad: this.cantidadParaAgregar,
      descuentoPorcentaje: 0,
      descuentoValor: 0,
      origenDescuento: 'porcentaje',
    };

    this.items = [...this.items, nuevoItem];
    this.actualizarPrecioItem(nuevoItem, this.listaPrecioGeneralId);

    this.articuloParaAgregarId = null;
    this.cantidadParaAgregar = 1;
  }

  protected quitarItem(indice: number): void {
    this.items = this.items.filter((_, i) => i !== indice);
    this.recalcularDescuentoGeneral();
  }

  protected alCambiarListaItem(item: ItemFormulario, listaPrecioId: number): void {
    item.usaListaGeneral = listaPrecioId === this.listaPrecioGeneralId;
    this.actualizarPrecioItem(item, listaPrecioId);
  }

  protected usarListaGeneralEnItem(item: ItemFormulario): void {
    if (!this.listaPrecioGeneralId) {
      return;
    }
    item.usaListaGeneral = true;
    this.actualizarPrecioItem(item, this.listaPrecioGeneralId);
  }

  protected alCambiarCantidadItem(item: ItemFormulario): void {
    if (!item.cantidad || item.cantidad <= 0) {
      item.cantidad = 1;
    }
    this.recalcularDescuentoItem(item);
    this.recalcularDescuentoGeneral();
  }

  protected alCambiarDescuentoPorcentajeItem(item: ItemFormulario): void {
    item.origenDescuento = 'porcentaje';
    this.recalcularDescuentoItem(item);
    this.recalcularDescuentoGeneral();
  }

  protected alCambiarDescuentoValorItem(item: ItemFormulario): void {
    item.origenDescuento = 'valor';
    this.recalcularDescuentoItem(item);
    this.recalcularDescuentoGeneral();
  }

  // ---------- Descuento general ----------

  protected alCambiarDescuentoGeneralPorcentaje(): void {
    this.origenDescuentoGeneral = 'porcentaje';
    this.recalcularDescuentoGeneral();
  }

  protected alCambiarDescuentoGeneralValor(): void {
    this.origenDescuentoGeneral = 'valor';
    this.recalcularDescuentoGeneral();
  }

  // ---------- Guardar ----------

  protected guardar(): void {
    this.error.set(null);

    if (!this.clienteSeleccionado) {
      this.error.set('Elegí un cliente.');
      return;
    }
    if (!this.vendedorId) {
      this.error.set('Elegí un vendedor.');
      return;
    }
    if (!this.servicio) {
      this.error.set('Elegí el servicio.');
      return;
    }
    if (!this.listaPrecioGeneralId) {
      this.error.set('Elegí la lista de precios del presupuesto.');
      return;
    }
    if (!this.plazoValidezDias || this.plazoValidezDias <= 0) {
      this.error.set('El plazo de validez tiene que ser mayor a cero.');
      return;
    }
    if (this.items.length === 0) {
      this.error.set('Agregá al menos un artículo al presupuesto.');
      return;
    }

    this.guardando.set(true);

    const items: PresupuestoItem[] = this.items.map((item) => ({
      articuloId: item.articuloId,
      cantidad: item.cantidad,
      listaPrecioId: item.listaPrecioId,
      precioUnitario: item.precioUnitario,
      moneda: item.moneda,
      descuentoPorcentaje: item.descuentoPorcentaje,
      descuentoValor: item.descuentoValor,
    }));

    this.presupuestoService
      .crear({
        clienteId: this.clienteSeleccionado.id!,
        vendedorId: this.vendedorId,
        servicio: this.servicio,
        plazoValidezDias: this.plazoValidezDias,
        //fechaEmision: new Date(),
        listaPrecioId: this.listaPrecioGeneralId,
        descuentoGeneralPorcentaje: this.descuentoGeneralPorcentaje,
        descuentoGeneralValor: this.descuentoGeneralValor,
        items,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Presupuesto creado',
            detail: 'El presupuesto se guardó correctamente.',
          });
          this.reiniciar();
        },
        error: () => {
          this.guardando.set(false);
          this.error.set('No se pudo guardar el presupuesto. Probá de nuevo.');
        },
      });
  }

  protected cancelar(): void {
    this.reiniciar();
  }

  // ---------- Privado: precios y descuentos ----------

  private obtenerPreciosDeLista(listaPrecioId: number): Observable<PrecioArticulo[]> {
    const enCache = this.preciosPorLista.get(listaPrecioId);
    if (enCache) {
      return of(enCache);
    }
    return this.precioArticuloService
      .listarVigentesDeLista(listaPrecioId)
      .pipe(tap((precios) => this.preciosPorLista.set(listaPrecioId, precios)));
  }

  private actualizarPrecioItem(item: ItemFormulario, listaPrecioId: number): void {
    item.listaPrecioId = listaPrecioId;
    this.obtenerPreciosDeLista(listaPrecioId).subscribe((precios) => {
      const precio = precios.find((p) => p.articuloId === item.articuloId);
      item.precioUnitario = precio?.valor ?? 0;
      item.moneda = precio?.moneda ?? 'ARS';
      item.precioDefinido = !!precio;
      this.recalcularDescuentoItem(item);
      this.recalcularDescuentoGeneral();
    });
  }

  /** Recalcula, para un ítem, el campo (% o monto) que no fue el último editado por el usuario. */
  private recalcularDescuentoItem(item: ItemFormulario): void {
    const base = item.precioUnitario * item.cantidad;
    const resultado = this.recalcularParDescuento(base, item.descuentoPorcentaje, item.descuentoValor, item.origenDescuento);
    item.descuentoPorcentaje = resultado.porcentaje;
    item.descuentoValor = resultado.valor;
  }

  /** Recalcula el descuento general (aplicado sobre el subtotal ya neto de descuentos por ítem, en la moneda principal). */
  private recalcularDescuentoGeneral(): void {
    const grupo = this.agruparPorMoneda().find((g) => g.moneda === this.monedaPrincipal);
    const base = grupo?.subtotalConDescuentosItems ?? 0;
    const resultado = this.recalcularParDescuento(base, this.descuentoGeneralPorcentaje, this.descuentoGeneralValor, this.origenDescuentoGeneral);
    this.descuentoGeneralPorcentaje = resultado.porcentaje;
    this.descuentoGeneralValor = resultado.valor;
  }

  /** Núcleo de la reactividad %/monto: a partir de una base y de cuál de los dos campos editó el usuario, deriva el otro. */
  private recalcularParDescuento(
    base: number,
    porcentajeActual: number,
    valorActual: number,
    origen: OrigenDescuento
  ): { porcentaje: number; valor: number } {
    if (base <= 0) {
      return { porcentaje: 0, valor: 0 };
    }

    if (origen === 'porcentaje') {
      const porcentaje = this.clamp(porcentajeActual, 0, 100);
      return { porcentaje, valor: this.redondear(base * (porcentaje / 100)) };
    }

    const valor = this.clamp(valorActual, 0, base);
    return { porcentaje: this.redondearPorcentaje((valor / base) * 100), valor };
  }

  private agruparPorMoneda(): { moneda: Moneda; subtotalBruto: number; descuentoItems: number; subtotalConDescuentosItems: number }[] {
    const mapa = new Map<Moneda, { subtotalBruto: number; descuentoItems: number }>();

    for (const item of this.items) {
      const acumulado = mapa.get(item.moneda) ?? { subtotalBruto: 0, descuentoItems: 0 };
      acumulado.subtotalBruto += item.precioUnitario * item.cantidad;
      acumulado.descuentoItems += item.descuentoValor;
      mapa.set(item.moneda, acumulado);
    }

    return Array.from(mapa.entries()).map(([moneda, datos]) => ({
      moneda,
      subtotalBruto: this.redondear(datos.subtotalBruto),
      descuentoItems: this.redondear(datos.descuentoItems),
      subtotalConDescuentosItems: this.redondear(datos.subtotalBruto - datos.descuentoItems),
    }));
  }

  private redondear(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  /** Redondeo con más precisión que `redondear`, para porcentajes: 2 decimales sobre un % ya
   * amplifica bastante el error cuando se multiplica de nuevo contra una base grande. */
  private redondearPorcentaje(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 10000) / 10000;
  }

  private clamp(valor: number, minimo: number, maximo: number): number {
    return Math.min(Math.max(valor, minimo), maximo);
  }

  private reiniciar(): void {
    this.clienteSeleccionado = null;
    this.vendedorId = null;
    this.servicio = null;
    this.plazoValidezDias = PLAZO_VALIDEZ_POR_DEFECTO_DIAS;
    this.listaPrecioGeneralId = null;
    this.articuloParaAgregarId = null;
    this.cantidadParaAgregar = 1;
    this.items = [];
    this.descuentoGeneralPorcentaje = 0;
    this.descuentoGeneralValor = 0;
    this.origenDescuentoGeneral = 'porcentaje';
    this.preciosPorLista.clear();
    this.error.set(null);
  }
}
