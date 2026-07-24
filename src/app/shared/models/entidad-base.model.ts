/**
 * Contrato base que deben cumplir todas las entidades del dominio.
 *
 * Se modela pensando en una base de datos relacional:
 * - `id`: clave primaria numérica autoincremental (equivalente a un `SERIAL`/
 *   `IDENTITY` en la base). Se usa `number | null` porque una entidad nueva,
 *   todavía no persistida, no tiene id hasta que el backend/la base se lo
 *   asigna.
 * - `creadoEn` / `actualizadoEn`: columnas de auditoría temporal (`created_at`
 *   / `updated_at`) que en un backend real completaría la base de datos o el
 *   ORM automáticamente.
 * - `activo`: baja lógica (soft delete), preferible a un `DELETE` físico
 *   cuando la entidad puede estar referenciada por claves foráneas.
 *
 * Las entidades concretas extienden esta interfaz y agregan sus propias
 * columnas y relaciones (claves foráneas como `xxxId`, referenciando el id
 * de otra entidad).
 */
export interface EntidadBase {
  id: number | null;
  creadoEn: Date;
  actualizadoEn: Date;
  activo: boolean;
}

/**
 * Utilidad de tipo para crear el DTO de alta de una entidad: quita los
 * campos que genera el propio sistema de persistencia (id y auditoría),
 * dejando solo los datos que el usuario/formulario debe proveer.
 *
 * Ejemplo: `type NuevoUsuario = CrearEntidad<Usuario>;`
 */
export type CrearEntidad<T extends EntidadBase> = Omit<T, keyof EntidadBase>;

/**
 * Utilidad de tipo para actualizaciones parciales de una entidad
 * (equivalente a un PATCH), preservando el id.
 */
export type ActualizarEntidad<T extends EntidadBase> = Partial<CrearEntidad<T>> & Pick<EntidadBase, 'id'>;
