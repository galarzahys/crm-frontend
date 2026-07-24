import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Vendedor } from '../models/vendedor.model';

@Injectable({ providedIn: 'root' })
export class VendedorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/vendedores`;

  listarTodos(): Observable<Vendedor[]> {
    return this.http.get<Vendedor[]>(this.baseUrl);
  }
}
