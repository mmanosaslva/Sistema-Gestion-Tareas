import { Router } from 'express';
import { register } from '../../controllers/auth.controller';
import { registerSchema } from '../../schemas/auth.schema';
import { validate } from '../middlewares/validate.middleware';

export const authRoutes: Router = Router();

authRoutes.post('/register', validate(registerSchema), register);
