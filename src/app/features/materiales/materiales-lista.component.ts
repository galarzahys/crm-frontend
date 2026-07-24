import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import {
  DatosFormularioMaterial,
  ETIQUETAS_TIPO_MATERIAL,
  Material,
  OPCIONES_TIPO_MATERIAL,
  TipoMaterial,
} from '../../shared/models/material.model';
import { MaterialService } from '../../shared/services/material.service';

@Component({
  selector: 'app-materiales-lista',
  standalone: true,
  imports: [FormsModule, ButtonModule, DialogModule, InputTextModule, SelectModule, TableModule, TagModule],
  templateUrl: './materiales-lista.component.html',
})
export class MaterialesListaComponent implements OnInit {
  private readonly materialService = inject(MaterialService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly opcionesTipo = OPCIONES_TIPO_MATERIAL;
  protected readonly materiales = signal<Material[]>([]);
  protected readonly cargando = signal(false);

  protected readonly dialogoAbierto = signal(false);
  protected readonly materialEnEdicion = signal<Material | null>(null);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected nombre = '';
  protected tipo: TipoMaterial = 'material';
  protected unidadMedida = '';

  protected etiquetaTipo(tipo: TipoMaterial): string {
    return ETIQUETAS_TIPO_MATERIAL[tipo];
  }

  ngOnInit(): void {
    this.cargarMateriales();
  }

  protected cargarMateriales(): void {
    this.cargando.set(true);
    this.materialService.listarConCosto().subscribe((materiales) => {
      this.materiales.set(materiales);
      this.cargando.set(false);
    });
  }

  protected abrirAlta(): void {
    this.materialEnEdicion.set(null);
    this.nombre = '';
    this.tipo = 'material';
    this.unidadMedida = '';
    this.error.set(null);
    this.dialogoAbierto.set(true);
  }

  protected abrirEdicion(material: Material): void {
    this.materialEnEdicion.set(material);
    this.nombre = material.nombre;
    this.tipo = material.tipo;
    this.unidadMedida = material.unidadMedida;
    this.error.set(null);
    this.dialogoAbierto.set(true);
  }

  protected guardar(): void {
    this.error.set(null);

    if (!this.nombre.trim()) {
      this.error.set('El nombre es obligatorio.');
      return;
    }
    if (!this.unidadMedida.trim()) {
      this.error.set('La unidad de medida es obligatoria.');
      return;
    }

    const datos: DatosFormularioMaterial = {
      nombre: this.nombre.trim(),
      tipo: this.tipo,
      unidadMedida: this.unidadMedida.trim(),
    };

    this.guardando.set(true);
    const enEdicion = this.materialEnEdicion();
    const operacion$ = enEdicion ? this.materialService.actualizar(enEdicion.id!, datos) : this.materialService.crear(datos);

    operacion$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.dialogoAbierto.set(false);
        this.cargarMateriales();
        this.messageService.add({ severity: 'success', summary: 'Material guardado', detail: 'Los cambios se guardaron correctamente.' });
      },
      error: () => {
        this.guardando.set(false);
        this.error.set('No se pudo guardar el material. Probá de nuevo.');
      },
    });
  }

  protected confirmarEliminacion(material: Material): void {
    this.confirmationService.confirm({
      header: 'Eliminar material',
      message: `¿Seguro que querés eliminar "${material.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminar(material),
    });
  }

  private eliminar(material: Material): void {
    this.materialService.eliminar(material.id!).subscribe(() => {
      this.cargarMateriales();
      this.messageService.add({ severity: 'success', summary: 'Material eliminado', detail: `Se eliminó "${material.nombre}".` });
    });
  }
}
