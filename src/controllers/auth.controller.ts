import { type Request, type Response } from 'express';
import {
  login as loginUser,
  register as registerUser,
} from '../services/auth.service';
import type { CreateUserInput, LoginInput } from '../types/user.types';

/**
 * POST /auth/register — 201 con el usuario público.
 * Express 5 reenvía las promesas rechazadas al middleware de errores.
 */
export async function register(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateUserInput;
  const user = await registerUser(input);
  res.status(201).json(user);
}

/**
 * POST /auth/login — 200 con { token }.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;
  const result = await loginUser(input);
  res.status(200).json(result);
}
