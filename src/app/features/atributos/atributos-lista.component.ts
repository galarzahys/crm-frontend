import { Component, OnInit, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AtributoConOpciones, AtributoService } from '../../shared/services/atributo.service';
import { Atributo, ETIQUETAS_TIPO_ATRIBUTO } from '../../shared/models/atributo.model';
import { AtributoFormularioComponent } from './atributo-formulario/atributo-formulario.component';

@Component({
  selector: 'app-atributos-lista',
  standalone: true,
  imports: [ButtonModule, DialogModule, TableModule, TagModule, AtributoFormularioComponent],
  templateUrl: './atributos-lista.component.html',
})
export class AtributosListaComponent implements OnInit {
  private readonly atributoService = inject(AtributoService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  protected readonly etiquetasTipo = ETIQUETAS_TIPO_ATRIBUTO;

  protected etiquetaTipo(tipo: Atributo['tipo']): string {
    return ETIQUETAS_TIPO_ATRIBUTO[tipo];
  }
  protected readonly atributos = signal<AtributoConOpciones[]>([]);
  protected readonly cargando = signal(false);
  protected readonly dialogoAbierto = signal(false);
  protected readonly atributoEnEdicion = signal<AtributoConOpciones | null>(null);

  ngOnInit(): void {
    this.cargarAtributos();
  }

  protected cargarAtributos(): void {
    this.cargando.set(true);
    this.atributoService.listarConOpciones().subscribe((atributos) => {
      this.atributos.set(atributos);
      this.cargando.set(false);
    });
  }

  protected abrirAlta(): void {
    this.atributoEnEdicion.set(null);
    this.dialogoAbierto.set(true);
  }

  protected abrirEdicion(atributo: AtributoConOpciones): void {
    this.atributoEnEdicion.set(atributo);
    this.dialogoAbierto.set(true);
  }

  protected alGuardar(): void {
    this.dialogoAbierto.set(false);
    this.cargarAtributos();
    this.messageService.add({ severity: 'success', summary: 'Atributo guardado', detail: 'Los cambios se guardaron correctamente.' });
  }

  protected confirmarEliminacion(atributo: AtributoConOpciones): void {
    this.confirmationService.confirm({
      header: 'Eliminar atributo',
      message: `¿Seguro que querés eliminar el atributo "${atributo.nombre}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminar(atributo),
    });
  }

  private eliminar(atributo: AtributoConOpciones): void {
    this.atributoService.eliminar(atributo.id!).subscribe(() => {
      this.cargarAtributos();
      this.messageService.add({ severity: 'success', summary: 'Atributo eliminado', detail: `Se eliminó "${atributo.nombre}".` });
    });
  }
}
