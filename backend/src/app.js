import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { basicAuthMiddleware } from './middleware/basicAuth.js';
import { productsRouter } from './routes/products.js';

export function createApp() {
  const app = express();
  const configuredOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5500')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  function isAllowedLocalOrigin(origin) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  }

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }

        if (configuredOrigins.includes(origin) || isAllowedLocalOrigin(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Origen no permitido por CORS: ${origin}`));
      }
    })
  );
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true, service: 'control-stock-backend' });
  });

  // La autenticacion es opcional y se aplica a toda la API de negocio.
  app.use('/api', basicAuthMiddleware);
  app.use('/api/products', productsRouter);

  app.use((error, _request, response, _next) => {
    console.error(error);

    response.status(error.statusCode || 500).json({
      message: error.message || 'Ocurrio un error interno en el servidor.'
    });
  });

  return app;
}