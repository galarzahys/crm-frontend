/**
 * Entorno de producción. Cuando se despliegue el frontend "de verdad"
 * (EC2, y más adelante detrás de un dominio propio), reemplazar `apiUrl`
 * por la URL real de la API.
 */
export const environment = {
  production: true,
  apiUrl: 'https://TODO-reemplazar-con-la-url-real-de-la-api',
};
