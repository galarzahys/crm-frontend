import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ActualizarEntidad, CrearEntidad, EntidadBase } from '../../shared/models/entidad-base.model';
import { ParametrosConsulta, ResultadoPaginado } from '../../shared/models/parametros-consulta.model';
import { IRepositorio } from './repositorio.interface';

/**
 * Repositorio genérico que persiste en memoria (cache del navegador,
 * durante la sesión) en lugar de contra un backend.
 *
 * Es una etapa transitoria: implementa el mismo contrato `IRepositorio`
 * que va a usar la futura implementación HTTP, y simula latencia de red
 * con `delay(...)` para que los componentes (spinners, estados de carga)
 * se comporten igual que el día que haya una API real detrás.
 *
 * Para migrar una entidad al backend más adelante, alcanza con crear una
 * clase que implemente `IRepositorio<T>` usando `HttpClient` y actualizar
 * el `provider` del servicio de esa entidad (ver `shared/services` y los
 * comentarios en cada servicio de entidad).
 *
 * Cada subclase concreta se especializa en una entidad (`Usuario`,
 * `Producto`, etc.) y define cómo se autoincrementa el id y,
 * opcionalmente, sobre qué campos aplica la búsqueda de texto libre.
 */
export abstract class CacheRepository<T extends EntidadBase> implements IRepositorio<T> {
  protected registros: T[] = [];
  private secuenciaId = 1;

  /** Latencia artificial (ms) para simular una llamada de red real. */
  protected readonly latenciaMs = 300;

  /**
   * Campos de tipo texto sobre los que se aplica `busqueda`. Cada
   * repositorio concreto puede sobrescribirlo (por ejemplo: ['nombre', 'email']).
   */
  protected camposBusqueda: (keyof T)[] = [];

  listar(parametros: ParametrosConsulta = {}): Observable<ResultadoPaginado<T>> {
    const { pagina = 0, tamanio = 10, ordenarPor, direccion = 'asc', busqueda } = parametros;

    let filtrados = this.registros.filter((r) => r.activo);

    if (busqueda && this.camposBusqueda.length > 0) {
      const texto = busqueda.toLowerCase();
      filtrados = filtrados.filter((registro) =>
        this.camposBusqueda.some((campo) => String(registro[campo] ?? '').toLowerCase().includes(texto))
      );
    }

    if (ordenarPor) {
      filtrados = [...filtrados].sort((a, b) => {
        const valorA = a[ordenarPor as keyof T];
        const valorB = b[ordenarPor as keyof T];
        const comparacion = valorA! < valorB! ? -1 : valorA! > valorB! ? 1 : 0;
        return direccion === 'asc' ? comparacion : -comparacion;
      });
    }

    const inicio = pagina * tamanio;
    const datos = filtrados.slice(inicio, inicio + tamanio);

    const resultado: ResultadoPaginado<T> = {
      datos,
      total: filtrados.length,
      pagina,
      tamanio,
    };

    return of(resultado).pipe(delay(this.latenciaMs));
  }

  obtenerPorId(id: number): Observable<T | undefined> {
    const encontrado = this.registros.find((r) => r.id === id && r.activo);
    return of(encontrado).pipe(delay(this.latenciaMs));
  }

  crear(entidad: CrearEntidad<T>): Observable<T> {
    const ahora = new Date();
    const nuevaEntidad = {
      ...entidad,
      id: this.secuenciaId++,
      creadoEn: ahora,
      actualizadoEn: ahora,
      activo: true,
    } as unknown as T;

    this.registros.push(nuevaEntidad);
    return of(nuevaEntidad).pipe(delay(this.latenciaMs));
  }

  actualizar(cambios: ActualizarEntidad<T>): Observable<T> {
    const indice = this.registros.findIndex((r) => r.id === cambios.id);
    if (indice === -1) {
      return throwError(() => new Error(`No se encontró el registro con id ${cambios.id}.`));
    }

    const actualizado = {
      ...this.registros[indice],
      ...cambios,
      actualizadoEn: new Date(),
    } as T;

    this.registros[indice] = actualizado;
    return of(actualizado).pipe(delay(this.latenciaMs));
  }

  /** Baja lógica: no elimina el registro, solo lo marca como inactivo. */
  eliminar(id: number): Observable<void> {
    const indice = this.registros.findIndex((r) => r.id === id);
    if (indice === -1) {
      return throwError(() => new Error(`No se encontró el registro con id ${id}.`));
    }

    this.registros[indice] = {
      ...this.registros[indice],
      activo: false,
      actualizadoEn: new Date(),
    };

    return of(undefined).pipe(delay(this.latenciaMs));
  }
}
