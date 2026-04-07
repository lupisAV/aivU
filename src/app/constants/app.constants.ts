/**
 * Constantes y configuración global de la app
 */

// Mensajes de feedback comunes
export const FEEDBACK_MESSAGES = {
  SUCCESS: {
    SAVE: '¡Guardado correctamente!',
    DELETE: '¡Eliminado correctamente!',
    UPDATE: '¡Actualizado correctamente!',
    LOGIN: '¡Sesión iniciada correctamente!',
    REGISTER: '¡Cuenta creada correctamente!',
  },
  ERROR: {
    GENERIC: 'Ocurrió un error. Por favor, intenta de nuevo.',
    NETWORK: 'Error de conexión. Verifica tu conexión a internet.',
    VALIDATION: 'Por favor, completa todos los campos requeridos.',
    UNAUTHORIZED: 'No tienes permisos para realizar esta acción.',
    NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  },
  WARNING: {
    UNSAVED_CHANGES: 'Tienes cambios sin guardar. ¿Deseas continuar?',
    DELETE_CONFIRMATION: '¿Estás seguro que deseas eliminar esto? Esta acción no se puede deshacer.',
  },
  INFO: {
    LOADING: 'Cargando...',
    PROCESSING: 'Procesando...',
    SAVING: 'Guardando...',
  }
};

// Textos de botones comunes
export const BUTTON_LABELS = {
  SAVE: 'Guardar',
  DELETE: 'Eliminar',
  CANCEL: 'Cancelar',
  CONFIRM: 'Confirmar',
  CLOSE: 'Cerrar',
  EDIT: 'Editar',
  BACK: 'Atrás',
  NEXT: 'Siguiente',
  SUBMIT: 'Enviar',
  RETRY: 'Reintentar',
};

// Duración de animaciones (ms)
export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
};

// Duración de toasts (ms)
export const TOAST_DURATIONS = {
  SHORT: 3000,
  NORMAL: 4000,
  LONG: 5000,
};

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  PHONE: /^[0-9]{7,15}$/,
};

// Estados de carga
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

// Breakpoints responsivos (px)
export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1440,
};

// Rutas protegidas (no requieren autenticación)
export const PUBLIC_ROUTES = [
  '/',
  '/signup',
];

// Rutas privadas (requieren autenticación)
export const PROTECTED_ROUTES = [
  '/home',
  '/elbow-pose',
  '/exercise-recommendation',
  '/comparison',
];
