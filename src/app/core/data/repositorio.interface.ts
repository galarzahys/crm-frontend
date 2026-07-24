import { Observable } from 'rxjs';
import { ActualizarEntidad, CrearEntidad, EntidadBase } from '../../shared/models/entidad-base.model';
import { ParametrosConsulta, ResultadoPaginado } from '../../shared/models/parametros-consulta.model';

/**
 * Contrato de persistencia que deben cumplir todos los repositorios de
 * entidades, sin importar si el origen de datos es un cache en memoria
 * (etapa actual del proyecto) o una API HTTP contra un backend real
 * (etapa futura).
 *
 * Todos los métodos devuelven `Observable`, igual que `HttpClient`, para
 * que reemplazar la implementación (de `CacheRepository` a, por ejemplo,
 * `HttpRepository`) no requiera tocar ni un componente ni un servicio de
 * entidad concretos: solo el `provider` que se inyecta.
 */
export interface IRepositorio<T extends EntidadBase> {
  listar(parametros?: ParametrosConsulta): Observable<ResultadoPaginado<T>>;
  obtenerPorId(id: number): Observable<T | undefined>;
  crear(entidad: CrearEntidad<T>): Observable<T>;
  actualizar(entidad: ActualizarEntidad<T>): Observable<T>;
  eliminar(id: number): Observable<void>;
}
