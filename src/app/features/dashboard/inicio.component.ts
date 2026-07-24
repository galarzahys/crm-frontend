import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [ButtonModule, CardModule, TagModule],
  templateUrl: './inicio.component.html',
})
export class InicioComponent {}
