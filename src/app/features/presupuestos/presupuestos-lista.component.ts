import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DatePipe } from '@angular/common';
import { Cliente } from '../../shared/models/cliente.model';
import { Vendedor } from '../../shared/models/vendedor.model';
import { Moneda } from '../../shared/models/precio-articulo.model';
import { ETIQUETAS_TIPO_SERVICIO, Presupuesto } from '../../shared/models/presupuesto.model';
import { Articulo } from '../../shared/models/articulo.model';
import { ClienteService } from '../../shared/services/cliente.service';
import { VendedorService } from '../../shared/services/vendedor.service';
import { ArticuloService } from '../../shared/services/articulo.service';
import { PresupuestoService } from '../../shared/services/presupuesto.service';

const TAMANIO_PAGINA = 10;

/** Total por moneda, para mostrar en la lista y en el detalle. */
interface TotalPorMoneda {
  moneda: Moneda;
  total: number;
}

@Component({
  selector: 'app-presupuestos-lista',
  standalone: true,
  imports: [FormsModule, DatePipe, ButtonModule, DialogModule, PaginatorModule, TableModule, TagModule],
  templateUrl: './presupuestos-lista.component.html',
})
export class PresupuestosListaComponent implements OnInit {
  private readonly presupuestoService = inject(PresupuestoService);
  private readonly clienteService = inject(ClienteService);
  private readonly vendedorService = inject(VendedorService);
  private readonly articuloService = inject(ArticuloService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  protected readonly etiquetasServicio = ETIQUETAS_TIPO_SERVICIO;

  protected readonly presupuestos = signal<Presupuesto[]>([]);
  protected readonly total = signal(0);
  protected readonly primerRegistro = signal(0);
  protected readonly cargando = signal(false);

  /** Lookups por id, para no golpear la API en cada fila de la tabla. */
  protected readonly clientesPorId = signal<Map<number, Cliente>>(new Map());
  protected readonly vendedoresPorId = signal<Map<number, Vendedor>>(new Map());
  protected readonly articulosPorId = signal<Map<number, Articulo>>(new Map());

  protected readonly dialogoVistaAbierto = signal(false);
  protected readonly presupuestoEnVista = signal<Presupuesto | null>(null);

  private readonly formateadores: Record<Moneda, Intl.NumberFormat> = {
    ARS: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }),
    USD: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }),
  };

  ngOnInit(): void {
    // Traemos un lote grande de clientes/vendedores/artículos una sola vez,
    // para poder resolver nombres en la tabla sin pedir uno por uno.
    this.clienteService.listar({ tamanio: 1000 }).subscribe((resultado) => {
      this.clientesPorId.set(new Map(resultado.datos.map((c) => [c.id!, c])));
    });
    this.vendedorService.listarTodos().subscribe((vendedores) => {
      this.vendedoresPorId.set(new Map(vendedores.map((v) => [v.id!, v])));
    });
    this.articuloService.listar({ tamanio: 1000 }).subscribe((resultado) => {
      this.articulosPorId.set(new Map(resultado.datos.map((a) => [a.id!, a])));
    });

    this.cargar(0);
  }

  protected clienteDe(presupuesto: Presupuesto): string {
    return this.clientesPorId().get(presupuesto.clienteId)?.etiqueta ?? `Cliente #${presupuesto.clienteId}`;
  }

  protected vendedorDe(presupuesto: Presupuesto): string {
    return this.vendedoresPorId().get(presupuesto.vendedorId)?.nombre ?? `Vendedor #${presupuesto.vendedorId}`;
  }

  protected articuloDe(articuloId: number): Articulo | undefined {
    return this.articulosPorId().get(articuloId);
  }

  protected etiquetaServicio(presupuesto: Presupuesto): string {
    return this.etiquetasServicio[presupuesto.servicio];
  }

  protected fechaVencimiento(presupuesto: Presupuesto): Date {
    const fecha = new Date(presupuesto.fechaEmision);
    fecha.setDate(fecha.getDate() + presupuesto.plazoValidezDias);
    return fecha;
  }

  protected estaVencido(presupuesto: Presupuesto): boolean {
    return this.fechaVencimiento(presupuesto).getTime() < Date.now();
  }

  protected formatearValor(valor: number, moneda: Moneda): string {
    return this.formateadores[moneda].format(valor);
  }

  /** Total final del presupuesto, agrupado por moneda (mismo cálculo que en el formulario: subtotal de ítems, menos descuentos, menos el descuento general). */
  protected totalesDe(presupuesto: Presupuesto): TotalPorMoneda[] {
    const porMoneda = new Map<Moneda, number>();
    for (const item of presupuesto.items) {
      const subtotal = item.precioUnitario * item.cantidad - item.descuentoValor;
      porMoneda.set(item.moneda, (porMoneda.get(item.moneda) ?? 0) + subtotal);
    }

    // El descuento general se aplica sobre el grupo de mayor subtotal (la "moneda principal"),
    // igual criterio que en el formulario de alta/edición.
    let monedaPrincipal: Moneda | null = null;
    let mayor = -Infinity;
    for (const [moneda, subtotal] of porMoneda) {
      if (subtotal > mayor) {
        mayor = subtotal;
        monedaPrincipal = moneda;
      }
    }

    return Array.from(porMoneda.entries()).map(([moneda, subtotal]) => {
      const descuentoGeneral =
        moneda === monedaPrincipal
          ? Math.min(presupuesto.descuentoGeneralValor, subtotal)
          : subtotal * (presupuesto.descuentoGeneralPorcentaje / 100);
      return { moneda, total: Math.round((subtotal - descuentoGeneral + Number.EPSILON) * 100) / 100 };
    });
  }

  protected abrirVista(presupuesto: Presupuesto): void {
    this.presupuestoEnVista.set(presupuesto);
    this.dialogoVistaAbierto.set(true);
  }

  protected irANuevo(): void {
    this.router.navigate(['/presupuestos/nuevo']);
  }

  protected irAEditar(presupuesto: Presupuesto): void {
    this.router.navigate(['/presupuestos', presupuesto.id, 'editar']);
  }

  protected confirmarEliminacion(presupuesto: Presupuesto): void {
    this.confirmationService.confirm({
      header: 'Eliminar presupuesto',
      message: `¿Seguro que querés eliminar el presupuesto de "${this.clienteDe(presupuesto)}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminar(presupuesto),
    });
  }

  private eliminar(presupuesto: Presupuesto): void {
    this.presupuestoService.eliminar(presupuesto.id!).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Presupuesto eliminado', detail: 'Se eliminó correctamente.' });
      this.cargar(0);
    });
  }

  protected alCambiarPagina(evento: PaginatorState): void {
    this.primerRegistro.set(evento.first ?? 0);
    this.cargar(evento.page ?? 0);
  }

  private cargar(pagina: number): void {
    this.cargando.set(true);
    this.presupuestoService.listar({ pagina, tamanio: TAMANIO_PAGINA }).subscribe((resultado) => {
      this.presupuestos.set(resultado.datos);
      this.total.set(resultado.total);
      this.primerRegistro.set(resultado.pagina * resultado.tamanio);
      this.cargando.set(false);
    });
  }
}
