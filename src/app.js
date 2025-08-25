/**
 * Express boot strap:
 * - Security ->
 *                  Disable x-powered-by - to hide tech stack,
 *                  trust-proxy - when behind reverse proxy, trust proxy for correct IPs,
 *                  (Middlware for Request content for ID - Request ID),
 *                  helmet - setting security headers as express does not do it,
 *                  cors- tells browser which external origins are allowed to talk to yyour APIs,
 *                  hpp - Protection against HTML parameter polution (req query, body)
 *
 *  - Rate Limiting -> Without rate limiting attacker can span APIs,
 *
 *  - Body-Parsers -> express url encoded, express json, cookie-parser
 *
 *  - Request Logging -> Need to log every request
 *                      Morgan for request logging,
 *                      Morgan pipes to winston for structuring etc
 *
 *  - Compression -> Compress HTTP response before sending to client,
 *                   Reduce bandwidth, (Avoid compressing already compressed formats).
 *
 *  - Health Check with a specific API
 *
 *  - Mount APIs
 *
 *  - 404 Handler
 *
 *  - Central error handler
 */

import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';

import { isProd } from './config/secret-keys.js';
import errorHandler from './middlewares/error.handler.middleware.js';
import requestContext from './middlewares/request.context.midlleware.js';
import router from './routes/index.js';
import logger from './utils/logger.js';

const app = express();

/** Hide tech stack */
app.disabled('x-powered-by');

/** Trust Proxy */
/** When behind reverse proxy, trust proxy for correct IPs */
app.set('trust proxy', 1);

/** Request context (request ID) */
app.use(requestContext);

/** Express by default does not set security headers */
/** Attacker can exploit it (XSS, clickjacking etc */
/** Helmet set a collection of security headers automatically */
app.use(
  helmet({
    /** Allow authorization headers for APIs via CORS, others kept defaults */
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

/** Allow frontend origins */
/** Tells browser which external origins are allowed to talk to our APIs */
app.use(
  cors({
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin: true,
  }),
);

/** Protection from HTML paramter pollution attacks */
/** Sanitize requests (query, body) */
/** So each parameter has one value */
app.use(hpp());

/** Basic rate limiting per IP */
/** Without rate limiting an attack can span your APIs with thousand of req/sec */
/** It restricts how many request per IP within a winow of time */
// app.rae

const limiter = rateLimit({
  legacyHeaders: false,
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  windowMs: 15 * 60 * 1000,
});

app.use(limiter);

/** Body Parsers */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

/** Request logging -> pipes to winston in prod, dev-friendly otherwise */
/** You need to log every request for debugging and auditing */
/** Morgan is a request logger middleware () It logs methods, url, response time */
/** Connected to winston -> logs can be sstructured */
/** JSON in prod, colorful in dev */
const morganFormat = isProd ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (msg) =>
        logger.http ? logger.http(msg.trim()) : logger.info(msg.trim()),
    },
  }),
);

/** Complress html responses before sending them to the client */
/** Reduce bandwidth - saves server cost and speed up response time */
/** Note: Avoid compressing already compressed formats (images, videos, zips) */
app.use(compression());

/** Health check (useful for uptime monitors) */
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

/** Mount APIs */
app.use('/', router);

/** 404 handler for unknown routes */
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found ${req.method} ${req.originalUrl}`,
  });
});

/** Centralized error handaler */
app.use(errorHandler);

export default app;
