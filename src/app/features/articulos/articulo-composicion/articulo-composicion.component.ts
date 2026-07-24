import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Articulo } from '../../../shared/models/articulo.model';
import { ETIQUETAS_TIPO_MATERIAL, MaterialConCosto, TipoMaterial } from '../../../shared/models/material.model';
import { Moneda } from '../../../shared/models/precio-articulo.model';
import { ArticuloService } from '../../../shared/services/articulo.service';
import { MaterialService } from '../../../shared/services/material.service';

/** Línea de la composición tal como se muestra en la tabla (material ya resuelto, para no buscarlo en cada render). */
interface FilaComposicion {
  materialId: number;
  material: MaterialConCosto;
  cantidad: number;
}

/** Total de costo de la composición, agrupado por moneda (los materiales pueden tener costos en distintas monedas). */
interface TotalCostoPorMoneda {
  moneda: Moneda;
  total: number;
}

/**
 * Pantalla propia (no modal) para definir la composición de costos de un
 * artículo puntual: qué materiales/mano de obra entran y en qué cantidad.
 * Se llega acá desde el botón "Composición de costos" del listado de
 * artículos. Espera un parámetro de ruta `id` con el id del artículo
 * (por ejemplo: `articulos/:id/composicion`).
 */
@Component({
  selector: 'app-articulo-composicion',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputNumberModule, SelectModule, TableModule, TagModule],
  templateUrl: './articulo-composicion.component.html',
})
export class ArticuloComposicionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly articuloService = inject(ArticuloService);
  private readonly materialService = inject(MaterialService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly articulo = signal<Articulo | null>(null);
  protected readonly materialesDisponibles = signal<MaterialConCosto[]>([]);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Filas ya agregadas a la composición. */
  protected filas: FilaComposicion[] = [];

  /** Selección del combo "agregar material". */
  protected materialParaAgregarId: number | null = null;
  protected cantidadParaAgregar = 1;

  private readonly formateadores: Record<Moneda, Intl.NumberFormat> = {
    ARS: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 4 }),
    USD: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 }),
  };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('No se especificó un artículo válido.');
      return;
    }

    this.cargando.set(true);
    this.materialService.listarConCosto().subscribe((materiales) => {
      this.materialesDisponibles.set(materiales);
      this.reconstruirFilas();
    });
    this.articuloService.obtenerPorId(id).subscribe({
      next: (articulo) => {
        this.articulo.set(articulo);
        this.reconstruirFilas();
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('No se pudo cargar el artículo.');
      },
    });
  }

  /** Materiales para el combo de "agregar": excluye los que ya están en la composición. */
  protected get materialesParaAgregar(): MaterialConCosto[] {
    const idsAgregados = new Set(this.filas.map((fila) => fila.materialId));
    return this.materialesDisponibles().filter((material) => !idsAgregados.has(material.id!));
  }

  protected etiquetaTipo(tipo: TipoMaterial): string {
    return ETIQUETAS_TIPO_MATERIAL[tipo];
  }

  protected formatearCosto(valor: number, moneda: Moneda): string {
    return this.formateadores[moneda].format(valor);
  }

  /** Subtotal de costo de una fila (cantidad × costo unitario), o null si el material no tiene costo definido. */
  protected subtotalFila(fila: FilaComposicion): number | null {
    const costo = fila.material.costoActual;
    if (!costo) {
      return null;
    }
    return fila.cantidad * costo.valor;
  }

  /** Detalle de costo total, agrupado por moneda (los materiales pueden estar costeados en distintas monedas). */
  protected get totalesCostoPorMoneda(): TotalCostoPorMoneda[] {
    const mapa = new Map<Moneda, number>();
    for (const fila of this.filas) {
      const subtotal = this.subtotalFila(fila);
      if (subtotal == null) {
        continue;
      }
      const moneda = fila.material.costoActual!.moneda;
      mapa.set(moneda, (mapa.get(moneda) ?? 0) + subtotal);
    }
    return Array.from(mapa.entries()).map(([moneda, total]) => ({ moneda, total }));
  }

  protected agregarMaterial(): void {
    this.error.set(null);

    if (!this.materialParaAgregarId) {
      this.error.set('Elegí un material para agregar.');
      return;
    }
    if (!this.cantidadParaAgregar || this.cantidadParaAgregar <= 0) {
      this.error.set('La cantidad tiene que ser mayor a cero.');
      return;
    }

    const material = this.materialesDisponibles().find((m) => m.id === this.materialParaAgregarId);
    if (!material) {
      return;
    }

    this.filas = [...this.filas, { materialId: material.id!, material, cantidad: this.cantidadParaAgregar }];
    this.materialParaAgregarId = null;
    this.cantidadParaAgregar = 1;
  }

  protected confirmarQuitarFila(fila: FilaComposicion): void {
    this.confirmationService.confirm({
      header: 'Quitar material',
      message: `¿Seguro que querés quitar "${fila.material.nombre}" de la composición de este artículo?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Quitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.filas = this.filas.filter((f) => f.materialId !== fila.materialId);
      },
    });
  }

  protected guardar(): void {
    const articulo = this.articulo();
    if (!articulo) {
      return;
    }

    this.error.set(null);
    this.guardando.set(true);

    // Se reenvían los datos del artículo tal como están (nombre, categoría,
    // descripciones, imagen, atributos) y se cambia únicamente `componentes`
    // — así esta pantalla no puede pisar nada que se edite en otro lado.
    this.articuloService
      .actualizar({
        id: articulo.id,
        nombre: articulo.nombre,
        descripcionInterna: articulo.descripcionInterna,
        descripcionComprador: articulo.descripcionComprador,
        categoriaId: articulo.categoriaId,
        imagenKey: articulo.imagenKey,
        imagenUrlVisualizacion: articulo.imagenUrlVisualizacion,
        // El backend valida con `forbidNonWhitelisted`, así que no se le puede
        // reenviar la entidad completa que devolvió el GET (trae además id,
        // creadoEn, actualizadoEn, activo, articuloId): solo los campos que
        // el DTO de "atributo asignado" espera.
        atributos: articulo.atributos.map(({ atributoId, valorLibre, opcionId }) => ({
          atributoId,
          valorLibre,
          opcionId,
        })),
        componentes: this.filas.map(({ materialId, cantidad }) => ({ materialId, cantidad })),
      })
      .subscribe({
        next: (actualizado) => {
          this.guardando.set(false);
          this.articulo.set(actualizado);
          this.messageService.add({
            severity: 'success',
            summary: 'Composición guardada',
            detail: `Se actualizó el costo de "${actualizado.nombre}".`,
          });
        },
        error: () => {
          this.guardando.set(false);
          this.error.set('No se pudo guardar la composición. Probá de nuevo.');
        },
      });
  }

  protected volver(): void {
    this.router.navigate(['/articulos']);
  }

  /** Reconstruye `filas` a partir del artículo cargado y la lista de materiales (hace falta que ambos ya hayan llegado). */
  private reconstruirFilas(): void {
    const articulo = this.articulo();
    const materiales = this.materialesDisponibles();
    if (!articulo || materiales.length === 0) {
      return;
    }

    this.filas = articulo.componentes
      .map((componente) => {
        const material = materiales.find((m) => m.id === componente.materialId);
        return material ? { materialId: componente.materialId, material, cantidad: componente.cantidad } : null;
      })
      .filter((fila): fila is FilaComposicion => fila !== null);
  }
}
