import cors from 'cors';
import express from 'express';
import { config } from './lib/config';
import { router } from './routes';

export const app = express();

app.use(cors({ origin: config.FRONTEND_URL }));
app.use(express.json());
app.use(router);
