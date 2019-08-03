import { Router } from 'express';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();

// Public routes
routes.post('/sessions', SessionController.store);
routes.post('/users', UserController.store);

// Private routes
routes.use(authMiddleware);
routes.put('/users', UserController.update);

export default routes;
