/**
 * Parámetros de consulta genéricos para listar entidades.
 *
 * Se define desde ahora con la forma que va a tener el futuro llamado HTTP
 * (por ejemplo `GET /api/usuarios?pagina=0&tamanio=20&orden=nombre,asc`),
 * aunque hoy el `CacheRepository` los resuelva en memoria. Así, el día que
 * se conecte un backend real, los componentes que consumen los servicios
 * no cambian: solo cambia la implementación del repositorio.
 */
export interface ParametrosConsulta {
  /** Número de página, base 0. */
  pagina?: number;
  /** Cantidad de registros por página. */
  tamanio?: number;
  /** Campo por el cual ordenar. */
  ordenarPor?: string;
  /** Dirección del orden. */
  direccion?: 'asc' | 'desc';
  /** Texto libre de búsqueda (se aplica sobre los campos que defina cada servicio). */
  busqueda?: string;
}

/** Respuesta paginada, equivalente a la que devolvería un backend relacional. */
export interface ResultadoPaginado<T> {
  datos: T[];
  total: number;
  pagina: number;
  tamanio: number;
}
