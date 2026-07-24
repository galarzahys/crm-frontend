import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Cliente, DatosFormularioCliente } from '../../../shared/models/cliente.model';
import { CampoFichaCliente } from '../../../shared/models/campo-ficha-cliente.model';
import { CampoFichaClienteService } from '../../../shared/services/campo-ficha-cliente.service';
import { ClienteService } from '../../../shared/services/cliente.service';

@Component({
  selector: 'app-cliente-formulario',
  standalone: true,
  imports: [FormsModule, ButtonModule, DatePickerModule, InputNumberModule, InputTextModule],
  templateUrl: './cliente-formulario.component.html',
})
export class ClienteFormularioComponent implements OnInit, OnChanges {
  /** Cliente a editar. Si es null/undefined, el formulario trabaja en modo alta. */
  @Input() clienteEditar: Cliente | null = null;

  @Output() guardado = new EventEmitter<Cliente>();
  @Output() cancelado = new EventEmitter<void>();

  private readonly campoFichaService = inject(CampoFichaClienteService);
  private readonly clienteService = inject(ClienteService);

  protected readonly campos = signal<CampoFichaCliente[]>([]);
  protected readonly cargandoCampos = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Valor "en bruto" por campo, en el tipo que corresponde al widget (string | number | Date | null). */
  protected valoresPorCampo: Record<number, string | number | Date | null> = {};

  ngOnInit(): void {
    this.cargarCampos();
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['clienteEditar'] && this.campos().length > 0) {
      this.cargarValoresDesdeInput();
    }
  }

  protected get esEdicion(): boolean {
    return !!this.clienteEditar;
  }

  private cargarCampos(): void {
    this.cargandoCampos.set(true);
    this.campoFichaService.listarTodos().subscribe((campos) => {
      this.campos.set(campos);
      this.cargandoCampos.set(false);
      this.cargarValoresDesdeInput();
    });
  }

  private cargarValoresDesdeInput(): void {
    const valoresPrevios: Record<number, string> = {};
    for (const valor of this.clienteEditar?.valores ?? []) {
      valoresPrevios[valor.campoId] = valor.valor;
    }

    const nuevoEstado: Record<number, string | number | Date | null> = {};
    for (const campo of this.campos()) {
      const previo = valoresPrevios[campo.id!];
      nuevoEstado[campo.id!] = this.parsearValorGuardado(campo, previo);
    }
    this.valoresPorCampo = nuevoEstado;
  }

  private parsearValorGuardado(campo: CampoFichaCliente, valor: string | undefined): string | number | Date | null {
    if (valor == null || valor === '') {
      return campo.tipo === 'numero' ? null : campo.tipo === 'fecha' ? null : '';
    }
    if (campo.tipo === 'numero') {
      const numero = Number(valor);
      return Number.isNaN(numero) ? null : numero;
    }
    if (campo.tipo === 'fecha') {
      const fecha = new Date(valor);
      return Number.isNaN(fecha.getTime()) ? null : fecha;
    }
    return valor;
  }

  protected guardar(): void {
    this.error.set(null);

    const faltantes = this.campos().filter((campo) => {
      if (!campo.obligatorio) {
        return false;
      }
      const valor = this.valoresPorCampo[campo.id!];
      return valor == null || valor === '';
    });

    if (faltantes.length > 0) {
      this.error.set(`Faltan campos obligatorios: ${faltantes.map((c) => c.nombre).join(', ')}.`);
      return;
    }

    const datos: DatosFormularioCliente = {
      valores: this.campos()
        .map((campo) => ({ campoId: campo.id!, valor: this.formatearValorParaEnviar(campo) }))
        .filter((valor) => valor.valor !== ''),
    };

    this.guardando.set(true);
    const enEdicion = this.clienteEditar;
    const operacion$ = enEdicion
      ? this.clienteService.actualizar(enEdicion.id!, datos)
      : this.clienteService.crear(datos);

    operacion$.subscribe({
      next: (cliente) => {
        this.guardando.set(false);
        this.guardado.emit(cliente);
        this.reiniciar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo guardar el cliente. Probá de nuevo.');
      },
    });
  }

  protected cancelar(): void {
    this.reiniciar();
    this.cancelado.emit();
  }

  private formatearValorParaEnviar(campo: CampoFichaCliente): string {
    const valor = this.valoresPorCampo[campo.id!];
    if (valor == null || valor === '') {
      return '';
    }
    if (campo.tipo === 'fecha' && valor instanceof Date) {
      return valor.toISOString().slice(0, 10);
    }
    return String(valor);
  }

  private reiniciar(): void {
    this.valoresPorCampo = {};
    this.error.set(null);
    this.cargarValoresDesdeInput();
  }
}
