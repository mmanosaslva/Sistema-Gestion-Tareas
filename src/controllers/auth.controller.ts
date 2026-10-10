import { type Request, type Response } from 'express';
import { register as registerUser } from '../services/auth.service';
import type { CreateUserInput } from '../types/user.types';

/**
 * POST /auth/register — 201 con el usuario público.
 * Express 5 reenvía las promesas rechazadas al middleware de errores.
 */
export async function register(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateUserInput;
  const user = await registerUser(input);
  res.status(201).json(user);
}
