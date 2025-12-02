// Lee variables de entorno en CRA (process.env.REACT_APP_*) o Vite (import.meta.env)
const viteEnv = (import.meta !== undefined ? (import.meta as any).env : undefined) || {};

export const ENV = {
  // Base del scheduler
  SCHEDULER_BASE:
    viteEnv.VITE_SCHEDULER_BASE_URL ||
    process.env.REACT_APP_SCHEDULER_API_BASE ||
    'https://reservationsservice-g2f5cvd5c2f2bsd0.canadacentral-01.azurewebsites.net',

  // Base del users service. Para CRA ya incluye /Api-user
  USERS_BASE:
    viteEnv.VITE_USERS_BASE_URL ||
    process.env.REACT_APP_USER_API_BASE ||   // ej: http://localhost:8080/Api-user
    'https://users-service-c9bhh8agamhndhg2.canadacentral-01.azurewebsites.net/Api-user',

  // Ruta del endpoint público (si USERS_BASE ya incluye /Api-user, aquí solo /public/profile)
  USERS_PROFILE_PATH:
    viteEnv.VITE_USERS_PROFILE_PATH ||
    '/public/profile',

  // Base del payment service
  PAYMENT_BASE:
    viteEnv.VITE_PAYMENT_BASE_URL ||
    process.env.REACT_APP_PAYMENT_API_BASE ||
    'https://wallet-service-evh5ccbsbwb9cfh8.canadacentral-01.azurewebsites.net/api',
};
