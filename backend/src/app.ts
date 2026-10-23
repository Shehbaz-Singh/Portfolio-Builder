import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './lib/config';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { router } from './routes';

export const app = express();

// Render (and most hosts) put a proxy in front of the app. Trust its X-Forwarded-For so the
// rate limiter sees real client IPs instead of the proxy's.
if (config.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: config.FRONTEND_URL }));
app.use(express.json({ limit: '100kb' }));
app.use(router);
app.use(notFoundHandler);
app.use(errorHandler);
