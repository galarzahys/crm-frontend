import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { AlmacenamientoImagenesCacheService } from './core/data/almacenamiento-imagenes-cache.service';
import { ALMACENAMIENTO_IMAGENES } from './core/data/almacenamiento-imagenes.token';
import { PRIMENG_TRANSLATION_ES_AR } from './core/i18n/primeng-es-ar.translation';
import { PresetGestionApp } from './core/theme/preset-gestion-app';
import { AlmacenamientoImagenesS3Service } from './core/data/almacenamiento-imagenes-s3.service';

registerLocaleData(localeEsAr, 'es-AR');

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    { provide: LOCALE_ID, useValue: 'es-AR' },
    providePrimeNG({
      ripple: true,
      inputVariant: 'outlined',
      theme: {
        preset: PresetGestionApp,
        options: {
          // Mismo selector que usa Tailwind (darkMode: 'class') para que
          // ambos sistemas de estilos reaccionen a la misma clase en <html>.
          darkModeSelector: '.dark',
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities',
          },
        },
      },
      translation: PRIMENG_TRANSLATION_ES_AR,
    }),
    // Servicios de PrimeNG para notificaciones (p-toast) y confirmaciones
    // (p-confirmDialog), provistos una sola vez a nivel raíz. Los elementos
    // <p-toast> y <p-confirmDialog> viven en el layout (ver layout.component).
    MessageService,
    ConfirmationService,
    // Proveedor de almacenamiento de imágenes de artículos. Hoy en memoria;
    // el día que haya backend con S3, se reemplaza este `useClass` por la
    // implementación real (ver core/data/almacenamiento-imagenes.interface.ts).
    { provide: ALMACENAMIENTO_IMAGENES, useClass: AlmacenamientoImagenesS3Service },
  ],
};
