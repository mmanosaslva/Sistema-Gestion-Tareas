import Ajv from 'ajv';
import addFormats from 'ajv-formats';

/**
 * Instancia única de AJV con formatos (email, date, uuid).
 * Modo strict activo: detecta esquemas mal escritos en tiempo de compilación.
 */
export const ajv: Ajv = new Ajv({ allErrors: true });

addFormats(ajv);
