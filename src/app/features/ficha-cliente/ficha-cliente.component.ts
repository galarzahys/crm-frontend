import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import {
  CampoFichaCliente,
  DatosFormularioCampoFicha,
  ETIQUETAS_TIPO_CAMPO,
  ICONOS_TIPO_CAMPO,
  LIMITE_CAMPOS_BUSCADOR,
  OPCIONES_TIPO_CAMPO,
  TipoCampoFicha,
} from '../../shared/models/campo-ficha-cliente.model';
import { CampoFichaClienteService } from '../../shared/services/campo-ficha-cliente.service';

@Component({
  selector: 'app-ficha-cliente',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './ficha-cliente.component.html',
})
export class FichaClienteComponent implements OnInit {
  private readonly campoFichaService = inject(CampoFichaClienteService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly limiteBuscador = LIMITE_CAMPOS_BUSCADOR;
  protected readonly opcionesTipo = OPCIONES_TIPO_CAMPO;
  protected readonly etiquetasTipo = ETIQUETAS_TIPO_CAMPO;
  protected readonly iconosTipo = ICONOS_TIPO_CAMPO;

  protected readonly campos = signal<CampoFichaCliente[]>([]);
  protected readonly cargando = signal(false);

  protected readonly dialogoAbierto = signal(false);
  protected readonly campoEnEdicion = signal<CampoFichaCliente | null>(null);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected nombre = '';
  protected tipo: TipoCampoFicha = 'texto';
  protected obligatorio = false;
  protected esBuscador = false;

  /** Cuántos campos (sin contar el que se está editando) ya están marcados para el buscador. */
  protected readonly buscadoresUsadosPorOtros = computed(() => {
    const idEnEdicion = this.campoEnEdicion()?.id ?? null;
    return this.campos().filter((campo) => campo.esBuscador && campo.id !== idEnEdicion).length;
  });

  protected readonly limiteBuscadorAlcanzado = computed(() => this.buscadoresUsadosPorOtros() >= this.limiteBuscador);

  protected etiquetaTipo(tipo: TipoCampoFicha): string {
    return this.etiquetasTipo[tipo];
  }

  protected iconoTipo(tipo: TipoCampoFicha): string {
    return this.iconosTipo[tipo];
  }

  ngOnInit(): void {
    this.cargarCampos();
  }

  protected cargarCampos(): void {
    this.cargando.set(true);
    this.campoFichaService.listarTodos().subscribe({
      next: (campos) => {
        this.campos.set(campos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected abrirAlta(): void {
    this.campoEnEdicion.set(null);
    this.nombre = '';
    this.tipo = 'texto';
    this.obligatorio = false;
    this.esBuscador = false;
    this.error.set(null);
    this.dialogoAbierto.set(true);
  }

  protected abrirEdicion(campo: CampoFichaCliente): void {
    this.campoEnEdicion.set(campo);
    this.nombre = campo.nombre;
    this.tipo = campo.tipo;
    this.obligatorio = campo.obligatorio;
    this.esBuscador = campo.esBuscador;
    this.error.set(null);
    this.dialogoAbierto.set(true);
  }

  /** Si al tildar "buscador" ya se llegó al límite, se lo destildamos para que no quede en un estado inválido. */
  protected alCambiarBuscador(): void {
    if (this.esBuscador && this.limiteBuscadorAlcanzado()) {
      this.esBuscador = false;
    }
  }

  protected guardar(): void {
    this.error.set(null);

    if (!this.nombre.trim()) {
      this.error.set('El nombre del campo es obligatorio.');
      return;
    }
    if (this.esBuscador && this.limiteBuscadorAlcanzado()) {
      this.error.set(`Ya hay ${this.limiteBuscador} campos marcados para el buscador. Desmarcá uno antes de agregar otro.`);
      return;
    }

    const datos: DatosFormularioCampoFicha = {
      nombre: this.nombre.trim(),
      tipo: this.tipo,
      obligatorio: this.obligatorio,
      esBuscador: this.esBuscador,
    };

    this.guardando.set(true);
    const enEdicion = this.campoEnEdicion();
    const operacion$ = enEdicion ? this.campoFichaService.actualizar(enEdicion.id!, datos) : this.campoFichaService.crear(datos);

    operacion$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogoAbierto.set(false);
        this.cargarCampos();
        this.messageService.add({ severity: 'success', summary: 'Campo guardado', detail: 'La ficha de cliente se actualizó.' });
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'No se pudo guardar el campo. Probá de nuevo.');
      },
    });
  }

  protected confirmarEliminacion(campo: CampoFichaCliente): void {
    this.confirmationService.confirm({
      header: 'Eliminar campo',
      message: `¿Seguro que querés eliminar el campo "${campo.nombre}" de la ficha de cliente? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminar(campo),
    });
  }

  private eliminar(campo: CampoFichaCliente): void {
    this.campoFichaService.eliminar(campo.id!).subscribe(() => {
      this.cargarCampos();
      this.messageService.add({ severity: 'success', summary: 'Campo eliminado', detail: `Se eliminó "${campo.nombre}" de la ficha.` });
    });
  }
}
