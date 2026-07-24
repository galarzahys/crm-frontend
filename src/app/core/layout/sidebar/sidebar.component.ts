import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../services/layout.service';
import { ITEMS_NAVEGACION } from '../items-navegacion';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  protected readonly layout = inject(LayoutService);
  protected readonly items = ITEMS_NAVEGACION;

  cerrarEnMobile(): void {
    this.layout.cerrarMobile();
  }
}
