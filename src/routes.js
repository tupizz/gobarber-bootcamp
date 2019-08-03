import { Router } from 'express';
import User from './app/models/User';

const routes = new Router();

routes.get('/', async (req, res) => {
    const user = await User.create({
        name: 'Tadeu Tupinambá',
        email: 'tadu.tupiz@gmail.com',
        password_hash: '123467890',
    });

    res.json(user);
});

export default routes;
