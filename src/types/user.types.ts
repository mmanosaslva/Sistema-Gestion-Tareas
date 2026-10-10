/** Entidad User tal como vive en la base de datos (incluye hash). */
export interface User {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

/** User sin password_hash: única forma que sale por la API. */
export interface UserPublic {
  id: string;
  nombre: string;
  email: string;
  created_at: Date;
}

/** Datos de entrada para crear un usuario (ya validados por AJV). */
export interface CreateUserInput {
  nombre: string;
  email: string;
  password: string;
}

/** Datos de entrada para iniciar sesión (ya validados por AJV). */
export interface LoginInput {
  email: string;
  password: string;
}

/** Respuesta del login. */
export interface LoginResponse {
  token: string;
}
