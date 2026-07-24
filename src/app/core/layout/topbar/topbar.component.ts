import { Component, inject } from '@angular/core';
import { LayoutService } from '../../services/layout.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  templateUrl: './topbar.component.html',
})
export class TopbarComponent {
  protected readonly layout = inject(LayoutService);
  protected readonly theme = inject(ThemeService);
}
