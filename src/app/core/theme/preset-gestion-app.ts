import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Preset de tema para PrimeNG basado en Aura, con la paleta primaria
 * personalizada a índigo/violeta para diferenciar la identidad visual
 * de la aplicación de gestión respecto del verde por defecto de Aura.
 *
 * El modo oscuro se resuelve por selector de clase (`.dark`) para
 * quedar sincronizado con la estrategia `darkMode: 'class'` de Tailwind
 * (ver ThemeService y tailwind.config.js).
 */
export const PresetGestionApp = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
    //primary: {
    //  50: '#fffdf2',
    //  100: '#fff8d6',
    //  200: '#fff0a8',
    //  300: '#ffe679',
    //  400: '#ffda47',
    //  500: '#FDCA1A', // Color principal
    //  600: '#e3b312',
    //  700: '#bf920d',
    //  800: '#99740b',
    //  900: '#7a5c08',
    //  950: '#4d3904',
    //},
  },
});
