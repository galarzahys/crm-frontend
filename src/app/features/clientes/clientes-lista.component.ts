import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CampoFichaCliente } from '../../shared/models/campo-ficha-cliente.model';
import { Cliente } from '../../shared/models/cliente.model';
import { CampoFichaClienteService } from '../../shared/services/campo-ficha-cliente.service';
import { ClienteService } from '../../shared/services/cliente.service';
import { ClienteFormularioComponent } from './cliente-formulario/cliente-formulario.component';

const TAMANIO_PAGINA = 10;

@Component({
  selector: 'app-clientes-lista',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    PaginatorModule,
    TableModule,
    ClienteFormularioComponent,
  ],
  templateUrl: './clientes-lista.component.html',
})
export class ClientesListaComponent implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly campoFichaService = inject(CampoFichaClienteService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly camposBuscador = signal<CampoFichaCliente[]>([]);
  protected readonly todosLosCampos = signal<CampoFichaCliente[]>([]);
  protected readonly total = signal(0);
  protected readonly primerRegistro = signal(0);
  protected readonly cargando = signal(false);

  protected readonly dialogoAbierto = signal(false);
  protected readonly clienteEnEdicion = signal<Cliente | null>(null);

  protected readonly dialogoVistaAbierto = signal(false);
  protected readonly clienteEnVista = signal<Cliente | null>(null);

  protected busqueda = '';

  private readonly busqueda$ = new Subject<void>();

  constructor() {
    this.busqueda$.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => this.cargar(0));
  }

  ngOnInit(): void {
    this.campoFichaService.listarTodos().subscribe((campos) => {
      this.todosLosCampos.set(campos);
      this.camposBuscador.set(campos.filter((campo) => campo.esBuscador));
    });
    this.cargar(0);
  }

  protected valorDe(cliente: Cliente, campoId: number): string {
    return cliente.valores.find((v) => v.campoId === campoId)?.valor ?? '—';
  }

  protected abrirVista(cliente: Cliente): void {
    this.clienteEnVista.set(cliente);
    this.dialogoVistaAbierto.set(true);
  }

  protected alBuscar(): void {
    this.busqueda$.next();
  }

  protected alCambiarPagina(evento: PaginatorState): void {
    this.primerRegistro.set(evento.first ?? 0);
    this.cargar(evento.page ?? 0);
  }

  protected abrirAlta(): void {
    this.clienteEnEdicion.set(null);
    this.dialogoAbierto.set(true);
  }

  protected abrirEdicion(cliente: Cliente): void {
    this.clienteEnEdicion.set(cliente);
    this.dialogoAbierto.set(true);
  }

  protected alGuardar(): void {
    this.dialogoAbierto.set(false);
    this.cargar(0);
    this.messageService.add({ severity: 'success', summary: 'Cliente guardado', detail: 'Los cambios se guardaron correctamente.' });
  }

  protected confirmarEliminacion(cliente: Cliente): void {
    this.confirmationService.confirm({
      header: 'Eliminar cliente',
      message: `¿Seguro que querés eliminar a "${cliente.etiqueta}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminar(cliente),
    });
  }

  private eliminar(cliente: Cliente): void {
    this.clienteService.eliminar(cliente.id!).subscribe(() => {
      this.messageService.add({ severity: 'success', summary: 'Cliente eliminado', detail: `Se eliminó a "${cliente.etiqueta}".` });
      this.cargar(0);
    });
  }

  private cargar(pagina: number): void {
    this.cargando.set(true);
    this.clienteService.listar({ pagina, tamanio: TAMANIO_PAGINA, busqueda: this.busqueda || undefined }).subscribe((resultado) => {
      this.clientes.set(resultado.datos);
      this.total.set(resultado.total);
      this.primerRegistro.set(resultado.pagina * resultado.tamanio);
      this.cargando.set(false);
    });
  }
}
