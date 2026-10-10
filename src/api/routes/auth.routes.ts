import { Router } from 'express';
import { login, register } from '../../controllers/auth.controller';
import { loginSchema, registerSchema } from '../../schemas/auth.schema';
import { validate } from '../middlewares/validate.middleware';

export const authRoutes: Router = Router();

authRoutes.post('/register', validate(registerSchema), register);
authRoutes.post('/login', validate(loginSchema), login);
