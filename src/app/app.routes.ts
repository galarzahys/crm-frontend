import { Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        loadComponent: () => import('./features/dashboard/inicio.component').then((m) => m.InicioComponent),
        title: 'Inicio · Gestión App',
      },
      {
        path: 'articulos',
        loadComponent: () =>
          import('./features/articulos/articulos-lista.component').then((m) => m.ArticulosListaComponent),
        title: 'Artículos · Gestión App',
      },
      {
        path: 'atributos',
        loadComponent: () =>
          import('./features/atributos/atributos-lista.component').then((m) => m.AtributosListaComponent),
        title: 'Atributos · Gestión App',
      },
      {
        path: 'presupuestos',
        loadComponent: () =>
          import('./features/presupuestos/presupuesto-formulario.component').then((m) => m.PresupuestoFormularioComponent),
        title: 'Atributos · Gestión App',
      },
      {
        path: 'precios',
        loadComponent: () =>
          import('./features/listas-precio/listas-precio.component').then((m) => m.ListasPrecioComponent),
        title: 'Atributos · Gestión App',
      },
      {
        path: 'nuevo-cliente',
        loadComponent: () =>
          import('./features/clientes/clientes-lista.component').then((m) => m.ClientesListaComponent),
        title: 'Atributos · Gestión App',
      },
      {
        path: 'ficha-cliente',
        loadComponent: () =>
          import('./features/ficha-cliente/ficha-cliente.component').then((m) => m.FichaClienteComponent),
        title: 'Atributos · Gestión App',
      },
      {
        path: 'detalle-costos',
        loadComponent: () =>
          import('./features/materiales/materiales-lista.component').then((m) => m.MaterialesListaComponent),
        title: 'Atributos · Gestión App',
      },
      {
        path: 'articulos/:id/composicion',
        loadComponent: () =>
          import('./features/articulos/articulo-composicion/articulo-composicion.component').then((m) => m.ArticuloComposicionComponent),
        title: 'Composición de costos · Gestión App',
      },
      {
        path: 'costos',
        loadComponent: () =>
          import('./features/materiales/costos-materiales.component').then((m) => m.CostosMaterialesComponent),
        title: 'Atributos · Gestión App',
      },
      // Los nuevos módulos se agregan acá como rutas lazy-loaded adicionales.
      { path: '**', redirectTo: 'inicio' },
    ],
  },
];
