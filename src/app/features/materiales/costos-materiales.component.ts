import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DatePipe } from '@angular/common';
import { Moneda, OPCIONES_MONEDA } from '../../shared/models/precio-articulo.model';
import {
  ETIQUETAS_TIPO_MATERIAL,
  MaterialConCosto,
  MaterialCostoHistorial,
  OPCIONES_TIPO_MATERIAL,
  TipoMaterial,
} from '../../shared/models/material.model';
import { MaterialService } from '../../shared/services/material.service';

@Component({
  selector: 'app-costos-materiales',
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
  ],
  templateUrl: './costos-materiales.component.html',
})
export class CostosMaterialesComponent implements OnInit {
  private readonly materialService = inject(MaterialService);
  private readonly messageService = inject(MessageService);

  protected readonly opcionesTipo = OPCIONES_TIPO_MATERIAL;
  protected readonly opcionesMoneda = OPCIONES_MONEDA;

  protected readonly materiales = signal<MaterialConCosto[]>([]);
  protected readonly cargando = signal(false);

  protected busqueda = '';
  protected tipoFiltro: TipoMaterial | null = null;

  protected readonly dialogoAbierto = signal(false);
  protected readonly materialParaCosto = signal<MaterialConCosto | null>(null);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected monedaForm: Moneda = 'ARS';
  protected valorForm: number | null = null;

  protected readonly dialogoHistorialAbierto = signal(false);
  protected readonly materialParaHistorial = signal<MaterialConCosto | null>(null);
  protected readonly historial = signal<MaterialCostoHistorial[]>([]);
  protected readonly cargandoHistorial = signal(false);

  private readonly formateadores: Record<Moneda, Intl.NumberFormat> = {
    ARS: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 4 }),
    USD: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 }),
  };

  protected etiquetaTipo(tipo: TipoMaterial): string {
    return ETIQUETAS_TIPO_MATERIAL[tipo];
  }

  protected formatearValor(valor: number, moneda: Moneda): string {
    return this.formateadores[moneda].format(valor);
  }

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.materialService.listarConCosto(this.busqueda || undefined, this.tipoFiltro ?? undefined).subscribe((materiales) => {
      this.materiales.set(materiales);
      this.cargando.set(false);
    });
  }

  protected abrirDialogoCosto(material: MaterialConCosto): void {
    this.materialParaCosto.set(material);
    this.monedaForm = material.costoActual?.moneda ?? 'ARS';
    this.valorForm = material.costoActual?.valor ?? null;
    this.error.set(null);
    this.dialogoAbierto.set(true);
  }

  protected guardarCosto(): void {
    this.error.set(null);

    if (!this.valorForm || this.valorForm <= 0) {
      this.error.set('Ingresá un valor mayor a cero.');
      return;
    }

    const material = this.materialParaCosto();
    if (!material) {
      return;
    }

    this.guardando.set(true);
    this.materialService.definirCosto(material.id!, { moneda: this.monedaForm, valor: this.valorForm }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogoAbierto.set(false);
        this.cargar();
        this.messageService.add({
          severity: 'success',
          summary: 'Costo actualizado',
          detail: `Se actualizó el costo de "${material.nombre}".`,
        });
      },
      error: () => {
        this.guardando.set(false);
        this.error.set('No se pudo guardar el costo. Probá de nuevo.');
      },
    });
  }

  protected abrirHistorial(material: MaterialConCosto): void {
    this.materialParaHistorial.set(material);
    this.dialogoHistorialAbierto.set(true);
    this.cargandoHistorial.set(true);
    this.materialService.historialDeCosto(material.id!).subscribe((historial) => {
      this.historial.set(historial);
      this.cargandoHistorial.set(false);
    });
  }
}
