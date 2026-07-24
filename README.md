# Gestión App

Proyecto base en **Angular 19** + **PrimeNG 19** + **Tailwind CSS**, en español de Argentina, listo para ir agregando módulos de a poco.

## Stack

- **Angular 19** (standalone components, control flow nativo `@if`/`@for`).
- **PrimeNG 19** con el nuevo sistema de theming (`@primeuix/themes`, preset **Aura** personalizado con paleta índigo).
- **Tailwind CSS 3** con `darkMode: 'class'`, integrado con PrimeNG mediante `cssLayer` para que ninguno de los dos gane la pulseada de especificidad CSS.
- **primeicons** para los íconos.

## Cómo correrlo

```bash
npm install
npm start        # http://localhost:4200
```

```bash
npm run build     # build de producción en dist/gestion-app
```

## Decisiones de diseño

### Idioma
- `index.html` con `lang="es-AR"` y `LOCALE_ID` en `es-AR` (para pipes de fecha/número/moneda).
- Traducciones de los componentes de PrimeNG (calendario, paginador, etc.) en `core/i18n/primeng-es-ar.translation.ts`.
- Todos los textos de la interfaz están escritos directamente en español rioplatense. El código (nombres de variables, clases, servicios) se mantiene en su mayoría en español para que el dominio del negocio quede legible, salvo términos técnicos de uso estándar en la industria.

### Modo claro / oscuro
- Modo **claro por defecto**, independientemente de la preferencia del sistema operativo (requisito del proyecto).
- El cambio de tema lo maneja `core/services/theme.service.ts`, que alterna la clase `dark` en `<html>` y persiste la preferencia en `localStorage`.
- Tailwind (`darkMode: 'class'`) y PrimeNG (`darkModeSelector: '.dark'`, configurado en `app.config.ts`) reaccionan al mismo selector, así que un solo toggle sincroniza ambos sistemas de estilos.

### Layout
- `core/layout/layout.component.ts`: shell con sidebar + topbar + `<router-outlet>` para el contenido de cada pantalla.
- `core/layout/sidebar`: barra lateral de navegación.
  - **Laptop/desktop** (`lg:` en adelante): siempre visible, se puede **colapsar** (solo íconos) o **expandir** (íconos + etiquetas) con el botón del pie de la barra. El estado se persiste en `localStorage`.
  - **Mobile/tablet**: se comporta como un panel superpuesto (overlay) que se abre con el botón de hamburguesa del topbar y se cierra tocando el fondo o un ítem del menú.
  - Los ítems del menú están centralizados en `core/layout/items-navegacion.ts`: para agregar una pantalla nueva a la navegación, se agrega una entrada ahí.
- `core/layout/topbar`: botón de menú (mobile), título de la sección y toggle de tema.
- Prioridad de diseño: **laptop** (breakpoint `lg`, 1024px), pero funciona correctamente en mobile y tablet.

### Persistencia de datos (entidades pensadas para una base relacional)

El objetivo de esta etapa es tener la **arquitectura de datos lista**, aunque hoy no haya backend: se persiste en memoria (cache de la sesión del navegador) con una interfaz idéntica a la que se va a usar contra una API HTTP real más adelante.

- `shared/models/entidad-base.model.ts`: contrato `EntidadBase` que deben cumplir todas las entidades (`id`, `creadoEn`, `actualizadoEn`, `activo`), pensado como columnas típicas de una tabla en una base relacional (clave primaria autoincremental, auditoría temporal, baja lógica en vez de `DELETE` físico para no romper integridad referencial). Incluye además los tipos utilitarios `CrearEntidad<T>` (equivalente a un DTO de alta, sin id ni auditoría) y `ActualizarEntidad<T>` (equivalente a un PATCH parcial).
- `shared/models/parametros-consulta.model.ts`: `ParametrosConsulta` (paginación, orden, búsqueda) y `ResultadoPaginado<T>`, con la forma que va a tener el futuro endpoint HTTP (`GET /api/recurso?pagina=0&tamanio=20&orden=...`).
- `core/data/repositorio.interface.ts`: contrato `IRepositorio<T>` (listar, obtenerPorId, crear, actualizar, eliminar) que deben implementar **todos** los repositorios, sea cual sea el origen de datos.
- `core/data/cache-repository.ts`: `CacheRepository<T>` — implementación en memoria de `IRepositorio<T>`, con latencia artificial (`delay`) para que la UI (spinners, estados de carga) se comporte igual que el día que haya un backend real.

**Cómo agregar una entidad nueva (por ejemplo, `Usuario`):**

1. Definir el modelo en `shared/models/usuario.model.ts` extendiendo `EntidadBase`, con sus propias columnas y claves foráneas (`rolId`, etc.).
2. Crear `shared/services/usuario.service.ts`, con una clase `UsuarioCacheRepository extends CacheRepository<Usuario>` (seteando `camposBusqueda` si aplica) y un servicio `UsuarioService` que inyecte `IRepositorio<Usuario>` — hoy apuntando al provider en memoria.
3. El día que exista backend: se crea `UsuarioHttpRepository implements IRepositorio<Usuario>` usando `HttpClient` contra el endpoint real, y se cambia únicamente el `provider` (por ejemplo, con un `InjectionToken` por entidad o directamente reemplazando la clase inyectada). Ningún componente que ya esté usando `UsuarioService` necesita cambios.

## Estructura de carpetas

```
src/app/
  core/
    data/            # Contratos e implementación de repositorios (cache hoy, HTTP a futuro)
    i18n/            # Traducciones de PrimeNG en español (Argentina)
    layout/          # Shell, sidebar, topbar
    services/        # ThemeService, LayoutService
    theme/           # Preset de PrimeNG (Aura + paleta índigo)
  features/          # Pantallas/módulos de negocio (se van agregando de a poco)
  shared/
    models/          # Modelos base compartidos (EntidadBase, paginación)
    services/        # Repositorios/servicios concretos de cada entidad
```

## Próximos pasos sugeridos

- Agregar el primer módulo de negocio real (entidad + pantalla de listado/alta/edición) siguiendo el patrón de `core/data`.
- Cuando exista backend, incorporar un `HttpRepository` genérico o por entidad e inyectar interceptores (auth, manejo de errores) en `app.config.ts`.
