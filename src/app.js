import 'dotenv/config';

import express from 'express';
import { resolve } from 'path';
import cors from 'cors';
import Youch from 'youch';
import * as Sentry from '@sentry/node';
import sentryConfig from './config/sentry';

import 'express-async-errors';
import routes from './routes';

import './database';

class App {
    constructor() {
        this.server = express();

        Sentry.init(sentryConfig);

        // Sentry middleware
        this.server.use(Sentry.Handlers.requestHandler());

        // Custom middlewares
        this.middlewares();
        this.routes();

        // Sentry middleware
        this.server.use(Sentry.Handlers.errorHandler());

        // My Handler for errors
        this.handleErrors();
    }

    middlewares() {
        this.server.use(express.json());
        this.server.use(cors());
        this.server.use(
            '/files',
            express.static(resolve(__dirname, '..', 'tmp', 'uploads'))
        );
    }

    routes() {
        this.server.use(routes);
    }

    handleErrors() {
        this.server.use(async (err, req, res, next) => {
            if (process.env.NODE_ENV === 'development') {
                const errors = await new Youch(err, req).toJSON();

                return res.status(500).json(errors);
            }
            return res.status(500).json({ error: 'Internal server error' });
        });
    }
}

export default new App().server;
